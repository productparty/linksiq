#!/usr/bin/env python3
"""Enrich courses and holes with Gemini Layer 2 research data.

Reads a JSON file with structured Gemini research and updates existing
courses/holes in the database. Never overwrites Layer 1 fields (par,
yardage, handicap). Only fills in enrichment text fields.

Usage:
    python scripts/enrich_courses.py --file scripts/gemini_enrichment.json
    python scripts/enrich_courses.py --file scripts/gemini_enrichment.json --dry-run

JSON Input Format:
    [
        {
            "course_name": "Eagle Eye Golf Club",
            "description": "A Chris Lutzke design...",
            "walkthrough_narrative": "Eagle Eye is...",
            "holes": [
                {
                    "hole_number": 17,
                    "elevation_description": "...",
                    "terrain_description": "...",
                    "strategic_tips": "...",
                    "green_slope": "...",
                    "green_speed_range": "...",
                    "green_details": "..."
                }
            ]
        }
    ]
"""

import argparse
import json
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from db.connection import get_cursor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Enrichment fields for courses (Layer 2 only — never touch Layer 1 fields)
COURSE_ENRICHMENT_FIELDS = ["description", "walkthrough_narrative"]

# Enrichment fields for holes (Layer 2 only)
HOLE_ENRICHMENT_FIELDS = [
    "elevation_description",
    "terrain_description",
    "strategic_tips",
    "green_slope",
    "green_speed_range",
    "green_details",
]


def _normalize_name(name: str) -> str:
    """Strip common golf suffixes for better matching."""
    import re
    n = name.strip()
    # Remove common suffixes: Golf Club, GC, Gc, Golf Course, CC, Country Club, G&CC, etc.
    n = re.sub(
        r'\s*\b(golf\s*(club|course)?|gc|g\s*&?\s*cc|country\s*club|cc)\s*$',
        '', n, flags=re.IGNORECASE,
    ).strip()
    return n


def find_course_by_name(name: str) -> dict | None:
    """Fuzzy-match a course by name. Tries exact, then normalized, then contains."""
    with get_cursor() as cur:
        # Try exact match first
        cur.execute(
            "SELECT id, name FROM public.courses WHERE LOWER(name) = LOWER(%s)",
            (name,),
        )
        row = cur.fetchone()
        if row:
            return dict(row)

        # Try contains match
        cur.execute(
            "SELECT id, name FROM public.courses WHERE LOWER(name) LIKE LOWER(%s)",
            (f"%{name}%",),
        )
        rows = cur.fetchall()
        if len(rows) == 1:
            return dict(rows[0])

        # Try the other direction — course name contains search term
        cur.execute(
            "SELECT id, name FROM public.courses WHERE LOWER(%s) LIKE '%%' || LOWER(name) || '%%'",
            (name,),
        )
        rows = cur.fetchall()
        if len(rows) == 1:
            return dict(rows[0])

        # Normalize both sides — strip "Golf Club", "Gc", "CC" etc. and compare core names
        norm_search = _normalize_name(name).lower()
        if norm_search:
            cur.execute("SELECT id, name FROM public.courses")
            all_courses = cur.fetchall()
            matches = [
                dict(c) for c in all_courses
                if _normalize_name(c["name"]).lower() == norm_search
            ]
            if len(matches) == 1:
                return matches[0]

            # Partial: normalized search is contained in normalized DB name or vice versa
            if not matches:
                matches = [
                    dict(c) for c in all_courses
                    if norm_search in _normalize_name(c["name"]).lower()
                    or _normalize_name(c["name"]).lower() in norm_search
                ]
                if len(matches) == 1:
                    return matches[0]

        # Try word-level match (each significant word appears in the DB name)
        words = [w for w in name.lower().split() if len(w) > 2 and w not in ("golf", "club", "course", "the", "country")]
        if len(words) >= 2:
            conditions = " AND ".join(["LOWER(name) LIKE %s"] * len(words))
            params = [f"%{w}%" for w in words]
            cur.execute(
                f"SELECT id, name FROM public.courses WHERE {conditions}",
                params,
            )
            rows = cur.fetchall()
            if len(rows) == 1:
                return dict(rows[0])

    return None


def enrich_course(course_id: str, data: dict, dry_run: bool = False) -> bool:
    """Update a course's enrichment fields. Returns True if updated."""
    updates = {}
    for field in COURSE_ENRICHMENT_FIELDS:
        val = data.get(field)
        if val and val.strip():
            updates[field] = val.strip()

    if not updates:
        return False

    if dry_run:
        logger.info(f"  [DRY RUN] Would update course fields: {list(updates.keys())}")
        return True

    set_clause = ", ".join(f"{k} = %({k})s" for k in updates)
    updates["id"] = course_id
    updates["source"] = "manual"

    with get_cursor() as cur:
        cur.execute(
            f"""
            UPDATE public.courses
            SET {set_clause}, source = %(source)s, updated_at = NOW()
            WHERE id = %(id)s
            """,
            updates,
        )
    return True


def enrich_hole(course_id: str, hole_data: dict, dry_run: bool = False) -> bool:
    """Update a hole's enrichment fields. Returns True if updated."""
    hole_number = hole_data.get("hole_number")
    if not hole_number:
        logger.warning("  Hole data missing hole_number, skipping")
        return False

    updates = {}
    for field in HOLE_ENRICHMENT_FIELDS:
        val = hole_data.get(field)
        if val and val.strip():
            updates[field] = val.strip()

    if not updates:
        return False

    if dry_run:
        logger.info(f"  [DRY RUN] Hole {hole_number}: would update {list(updates.keys())}")
        return True

    set_clause = ", ".join(f"{k} = %({k})s" for k in updates)
    updates["course_id"] = course_id
    updates["hole_number"] = hole_number
    updates["source"] = "manual"

    with get_cursor() as cur:
        cur.execute(
            f"""
            UPDATE public.holes
            SET {set_clause}, source = %(source)s, updated_at = NOW()
            WHERE course_id = %(course_id)s AND hole_number = %(hole_number)s
            """,
            updates,
        )
        if cur.rowcount == 0:
            logger.warning(f"  Hole {hole_number}: no matching row found (course may not have this hole in DB)")
            return False
    return True


def enrich_from_json(json_path: str, dry_run: bool = False) -> dict:
    """Process enrichment JSON file. Returns stats."""
    with open(json_path, "r", encoding="utf-8") as f:
        enrichment_data = json.load(f)

    stats = {
        "courses_matched": 0,
        "courses_not_found": 0,
        "courses_enriched": 0,
        "holes_enriched": 0,
        "holes_not_found": 0,
    }

    for entry in enrichment_data:
        course_name = entry.get("course_name", "")
        if not course_name:
            logger.warning("Entry missing course_name, skipping")
            continue

        logger.info(f"Processing: {course_name}")

        match = find_course_by_name(course_name)
        if not match:
            logger.warning(f"  NOT FOUND in database — skipping")
            stats["courses_not_found"] += 1
            continue

        course_id = str(match["id"])
        db_name = match["name"]
        if db_name.lower() != course_name.lower():
            logger.info(f"  Matched to: {db_name}")
        stats["courses_matched"] += 1

        # Enrich course-level fields
        if enrich_course(course_id, entry, dry_run):
            stats["courses_enriched"] += 1

        # Enrich holes
        for hole_data in entry.get("holes", []):
            if enrich_hole(course_id, hole_data, dry_run):
                stats["holes_enriched"] += 1
            else:
                if hole_data.get("hole_number"):
                    stats["holes_not_found"] += 1

    return stats


def main():
    parser = argparse.ArgumentParser(description="Enrich LinksIQ courses with Gemini research data")
    parser.add_argument(
        "--file",
        required=True,
        help="Path to JSON file with enrichment data",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be updated without writing to DB",
    )
    args = parser.parse_args()

    if not os.path.exists(args.file):
        logger.error(f"File not found: {args.file}")
        sys.exit(1)

    mode = "DRY RUN" if args.dry_run else "LIVE"
    logger.info(f"Starting enrichment ({mode}) from {args.file}")

    stats = enrich_from_json(args.file, dry_run=args.dry_run)

    logger.info("=" * 50)
    logger.info(f"Courses matched:    {stats['courses_matched']}")
    logger.info(f"Courses not found:  {stats['courses_not_found']}")
    logger.info(f"Courses enriched:   {stats['courses_enriched']}")
    logger.info(f"Holes enriched:     {stats['holes_enriched']}")
    logger.info(f"Holes not matched:  {stats['holes_not_found']}")


if __name__ == "__main__":
    main()
