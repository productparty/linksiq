#!/usr/bin/env python3
"""Import pre-fetched golf course data into Supabase.

Reads courses from a local JSON file (fetched from golfcourseapi.com)
and upserts into the LinksIQ database.

Usage:
    python -m server.scripts.import_courses
    python -m server.scripts.import_courses --file server/scripts/mi_courses_raw.json
    python -m server.scripts.import_courses --metro-detroit
"""

import argparse
import json
import logging
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from server.db.connection import get_cursor
from server.services.golf_api import (
    load_courses_from_json,
    normalize_course_data,
    normalize_holes_data,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

METRO_DETROIT_CITIES = {
    "Detroit", "Dearborn", "Dearborn Heights", "Livonia", "Troy",
    "Sterling Heights", "Rochester Hills", "Rochester", "Royal Oak",
    "Bloomfield Hills", "West Bloomfield", "Farmington Hills", "Farmington",
    "Novi", "Southfield", "Canton", "Plymouth", "Ann Arbor", "Ypsilanti",
    "South Lyon", "Brighton", "Howell", "Clarkston", "Auburn Hills",
    "Pontiac", "Lake Orion", "Commerce Township", "Northville", "Milford",
    "Wixom", "Grosse Ile", "Romulus", "Belleville", "Monroe", "Flat Rock",
    "Woodhaven", "Waterford", "White Lake", "Highland", "Oxford",
    "Shelby Township", "Macomb", "Clinton Township", "Warren",
    "Grosse Pointe", "Grosse Pointe Woods", "Wyandotte", "Taylor",
    "Westland", "Garden City", "Redford", "Inkster",
}


def upsert_course(course_data: dict) -> str | None:
    """Upsert a course into the database. Returns the course UUID."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO public.courses (
                external_id, name, club_name, address, city, state, zip_code,
                country, latitude, longitude, course_type, total_par,
                total_yardage, num_holes, slope_rating, course_rating,
                website_url, phone, source
            ) VALUES (
                %(external_id)s, %(name)s, %(club_name)s, %(address)s,
                %(city)s, %(state)s, %(zip_code)s, %(country)s,
                %(latitude)s, %(longitude)s, %(course_type)s, %(total_par)s,
                %(total_yardage)s, %(num_holes)s, %(slope_rating)s,
                %(course_rating)s, %(website_url)s, %(phone)s, %(source)s
            )
            ON CONFLICT (external_id) DO UPDATE SET
                name = EXCLUDED.name,
                club_name = EXCLUDED.club_name,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                zip_code = EXCLUDED.zip_code,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                course_type = EXCLUDED.course_type,
                total_par = EXCLUDED.total_par,
                total_yardage = EXCLUDED.total_yardage,
                num_holes = EXCLUDED.num_holes,
                slope_rating = EXCLUDED.slope_rating,
                course_rating = EXCLUDED.course_rating,
                website_url = EXCLUDED.website_url,
                phone = EXCLUDED.phone,
                updated_at = NOW()
            RETURNING id
            """,
            course_data,
        )
        row = cur.fetchone()
        return str(row["id"]) if row else None


def upsert_holes(course_uuid: str, holes: list[dict]) -> int:
    """Upsert holes for a course. Returns number of holes upserted."""
    count = 0
    with get_cursor() as cur:
        for hole in holes:
            cur.execute(
                """
                INSERT INTO public.holes (
                    course_id, hole_number, par, handicap_rating,
                    yardage_by_tee, source
                ) VALUES (
                    %(course_id)s, %(hole_number)s, %(par)s, %(handicap_rating)s,
                    %(yardage_by_tee_json)s::jsonb, %(source)s
                )
                ON CONFLICT (course_id, hole_number) DO UPDATE SET
                    par = EXCLUDED.par,
                    handicap_rating = EXCLUDED.handicap_rating,
                    yardage_by_tee = EXCLUDED.yardage_by_tee,
                    updated_at = NOW()
                """,
                {
                    "course_id": course_uuid,
                    "hole_number": hole["hole_number"],
                    "par": hole["par"],
                    "handicap_rating": hole["handicap_rating"],
                    "yardage_by_tee_json": json.dumps(hole["yardage_by_tee"]),
                    "source": hole["source"],
                },
            )
            count += 1
    return count


def import_from_json(json_path: str, metro_only: bool = False) -> tuple[int, int]:
    """Import courses from a local JSON file. Returns (course_count, hole_count)."""
    logger.info(f"Loading courses from {json_path}")
    raw_courses = load_courses_from_json(json_path)
    logger.info(f"Loaded {len(raw_courses)} courses from file")

    if metro_only:
        raw_courses = [
            c for c in raw_courses
            if c.get("location", {}).get("city", "") in METRO_DETROIT_CITIES
        ]
        logger.info(f"Filtered to {len(raw_courses)} metro Detroit courses")

    course_count = 0
    hole_count = 0

    for i, raw in enumerate(raw_courses):
        name = raw.get("course_name", raw.get("club_name", "Unknown"))

        course_data = normalize_course_data(raw)
        holes_data = normalize_holes_data(raw)

        course_uuid = upsert_course(course_data)
        if not course_uuid:
            logger.error(f"  Failed to upsert: {name}")
            continue

        course_count += 1

        if holes_data:
            h = upsert_holes(course_uuid, holes_data)
            hole_count += h

        logger.info(f"  [{i+1}/{len(raw_courses)}] {name}: {len(holes_data)} holes")

    return course_count, hole_count


def main():
    parser = argparse.ArgumentParser(description="Import golf courses into LinksIQ")
    parser.add_argument(
        "--file",
        default=os.path.join(os.path.dirname(__file__), "mi_courses_raw.json"),
        help="Path to JSON file with course data",
    )
    parser.add_argument(
        "--metro-detroit",
        action="store_true",
        help="Only import metro Detroit area courses",
    )
    args = parser.parse_args()

    if not os.path.exists(args.file):
        logger.error(f"File not found: {args.file}")
        sys.exit(1)

    course_count, hole_count = import_from_json(args.file, metro_only=args.metro_detroit)
    logger.info(f"Done. Imported {course_count} courses, {hole_count} holes.")


if __name__ == "__main__":
    main()
