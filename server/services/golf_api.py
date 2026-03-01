"""Golf Course API client — fetches course and hole data from golfcourseapi.com.

Data format: each course has tees grouped by male/female, each tee has
a holes[] array with per-hole par, yardage, and handicap.
"""

import os
import json
import logging
import re
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

API_BASE = "https://api.golfcourseapi.com/v1"


def _get_headers() -> dict:
    api_key = os.getenv("GOLF_API_KEY", "")
    return {
        "Authorization": f"Key {api_key}",
        "Accept": "application/json",
    }


def test_api_key() -> bool:
    """Verify the Golf API key is valid."""
    try:
        response = httpx.get(
            f"{API_BASE}/courses?limit=1",
            headers=_get_headers(),
            timeout=30,
        )
        if response.status_code == 200:
            logger.info("Golf Course API key is valid")
            return True
        logger.error(f"Golf Course API returned {response.status_code}: {response.text[:200]}")
        return False
    except Exception as e:
        logger.error(f"Golf Course API connection failed: {e}")
        return False


def load_courses_from_json(json_path: str) -> list[dict]:
    """Load pre-fetched courses from a local JSON file."""
    with open(json_path) as f:
        return json.load(f)


def normalize_course_data(course: dict) -> dict:
    """Transform golfcourseapi.com course into our courses table schema."""
    location = course.get("location", {})

    # Extract zip code from address string
    address = location.get("address", "")
    zip_match = re.search(r"\b(\d{5})\b", address)
    zip_code = zip_match.group(1) if zip_match else None

    # Get slope/rating/yardage/par from the first male tee (or female if no male)
    tees_data = course.get("tees", {})
    male_tees = tees_data.get("male", [])
    female_tees = tees_data.get("female", [])
    all_tees = male_tees + female_tees

    slope_rating = None
    course_rating = None
    total_yardage = None
    total_par = None
    num_holes = 18

    if male_tees:
        primary = male_tees[0]
        slope_rating = primary.get("slope_rating")
        course_rating = primary.get("course_rating")
        total_yardage = primary.get("total_yards")
        total_par = primary.get("par_total")
        num_holes = primary.get("number_of_holes", 18)
    elif female_tees:
        primary = female_tees[0]
        slope_rating = primary.get("slope_rating")
        course_rating = primary.get("course_rating")
        total_yardage = primary.get("total_yards")
        total_par = primary.get("par_total")
        num_holes = primary.get("number_of_holes", 18)

    return {
        "external_id": str(course.get("id")),
        "name": course.get("course_name", course.get("club_name", "Unknown")),
        "club_name": course.get("club_name"),
        "address": address,
        "city": location.get("city"),
        "state": location.get("state"),
        "zip_code": zip_code,
        "country": "USA" if location.get("country") == "United States" else location.get("country", "USA"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "course_type": "public",  # API doesn't provide this
        "total_par": total_par,
        "total_yardage": total_yardage,
        "num_holes": num_holes if num_holes in (9, 18) else 18,
        "slope_rating": slope_rating,
        "course_rating": course_rating,
        "website_url": None,
        "phone": None,
        "source": "api_import",
    }


def normalize_holes_data(course: dict) -> list[dict]:
    """Transform golfcourseapi.com tee data into normalized hole rows.

    The API groups tees by male/female, each tee has a holes[] array.
    We merge all tees into the yardage_by_tee JSONB structure.
    """
    tees_data = course.get("tees", {})
    male_tees = tees_data.get("male", [])
    female_tees = tees_data.get("female", [])

    if not male_tees and not female_tees:
        return []

    # Determine number of holes from primary tee
    primary_tees = male_tees if male_tees else female_tees
    primary = primary_tees[0]
    primary_holes = primary.get("holes", [])
    num_holes = len(primary_holes)

    if num_holes == 0:
        return []

    # Get par and handicap from male tees first, then female
    par_source = male_tees[0] if male_tees else female_tees[0]
    par_holes = par_source.get("holes", [])

    holes = []
    for hole_idx in range(num_holes):
        hole_number = hole_idx + 1

        par = par_holes[hole_idx].get("par") if hole_idx < len(par_holes) else None
        handicap = par_holes[hole_idx].get("handicap") if hole_idx < len(par_holes) else None

        # Build yardage_by_tee from all tees
        tee_entries = []

        for tee in male_tees:
            tee_holes = tee.get("holes", [])
            if hole_idx < len(tee_holes):
                entry = {
                    "name": tee.get("tee_name", "Unknown"),
                    "color": _guess_tee_color(tee.get("tee_name", "")),
                    "yardage": tee_holes[hole_idx].get("yardage"),
                }
                if tee.get("course_rating"):
                    entry["course_rating_men"] = tee["course_rating"]
                if tee.get("slope_rating"):
                    entry["slope_men"] = tee["slope_rating"]
                tee_entries.append(entry)

        for tee in female_tees:
            tee_holes = tee.get("holes", [])
            if hole_idx < len(tee_holes):
                entry = {
                    "name": tee.get("tee_name", "Unknown"),
                    "color": _guess_tee_color(tee.get("tee_name", "")),
                    "yardage": tee_holes[hole_idx].get("yardage"),
                }
                if tee.get("course_rating"):
                    entry["course_rating_women"] = tee["course_rating"]
                if tee.get("slope_rating"):
                    entry["slope_women"] = tee["slope_rating"]
                tee_entries.append(entry)

        holes.append({
            "hole_number": hole_number,
            "par": par,
            "handicap_rating": handicap,
            "yardage_by_tee": {"tees": tee_entries},
            "source": "api_import",
        })

    return holes


def _guess_tee_color(tee_name: str) -> str | None:
    """Map common tee names to colors."""
    name = tee_name.upper()
    color_map = {
        "BLACK": "Black",
        "BLUE": "Blue",
        "WHITE": "White",
        "GOLD": "Gold",
        "RED": "Red",
        "GREEN": "Green",
        "SILVER": "Silver",
        "YELLOW": "Yellow",
        "ORANGE": "Orange",
        "BRONZE": "Bronze",
    }
    for key, color in color_map.items():
        if key in name:
            return color
    return None
