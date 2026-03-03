"""
Populate course photos using Google Places API + Supabase Storage.

Usage:
    python -m scripts.populate_course_photos [--limit N] [--dry-run]

Required env vars:
    GOOGLE_PLACES_API_KEY  — Google Cloud API key with Places API enabled
    SUPABASE_URL           — Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (for storage upload)
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD — Database connection

Flow per course:
    1. Google Places Text Search → find place, get photo reference
    2. Google Places Photo API → download image bytes
    3. Upload to Supabase Storage bucket 'course-photos'
    4. Store public URL in courses.photo_url
"""

import os
import sys
import time
import argparse

import httpx
from dotenv import load_dotenv

load_dotenv()

# Add parent dir so we can import db.connection
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from db.connection import get_cursor

GOOGLE_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET = "course-photos"
PHOTO_MAX_WIDTH = 800


def ensure_bucket(client: httpx.Client):
    """Create the storage bucket if it doesn't exist."""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    # Check if bucket exists
    r = client.get(f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET}", headers=headers)
    if r.status_code == 200:
        return
    # Create public bucket
    client.post(
        f"{SUPABASE_URL}/storage/v1/bucket",
        headers=headers,
        json={"id": BUCKET, "name": BUCKET, "public": True},
    )
    print(f"Created storage bucket: {BUCKET}")


def find_place_photo_ref(client: httpx.Client, name: str, city: str, state: str) -> tuple[str | None, str | None]:
    """Search Google Places for a golf course and return (place_id, photo_reference)."""
    query = f"{name} golf course {city or ''} {state or ''}".strip()
    r = client.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        params={"query": query, "type": "establishment", "key": GOOGLE_API_KEY},
    )
    data = r.json()
    results = data.get("results", [])
    if not results:
        return None, None

    place = results[0]
    place_id = place.get("place_id")
    photos = place.get("photos", [])
    photo_ref = photos[0].get("photo_reference") if photos else None
    return place_id, photo_ref


def download_photo(client: httpx.Client, photo_reference: str) -> bytes | None:
    """Download photo bytes from Google Places Photo API."""
    r = client.get(
        "https://maps.googleapis.com/maps/api/place/photo",
        params={
            "maxwidth": PHOTO_MAX_WIDTH,
            "photo_reference": photo_reference,
            "key": GOOGLE_API_KEY,
        },
        follow_redirects=True,
    )
    if r.status_code == 200:
        return r.content
    return None


def upload_to_storage(client: httpx.Client, course_id: str, image_bytes: bytes) -> str | None:
    """Upload image to Supabase Storage and return public URL."""
    path = f"{course_id}.jpg"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
    }
    r = client.post(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}",
        headers=headers,
        content=image_bytes,
    )
    if r.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
    print(f"  Storage upload failed ({r.status_code}): {r.text[:200]}")
    return None


def main():
    parser = argparse.ArgumentParser(description="Populate course photos from Google Places")
    parser.add_argument("--limit", type=int, default=0, help="Max courses to process (0 = all)")
    parser.add_argument("--dry-run", action="store_true", help="Search only, don't download/upload")
    args = parser.parse_args()

    if not GOOGLE_API_KEY:
        print("ERROR: GOOGLE_PLACES_API_KEY not set")
        sys.exit(1)
    if not args.dry_run and (not SUPABASE_URL or not SUPABASE_SERVICE_KEY):
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for uploads")
        sys.exit(1)

    # Get courses without photos
    with get_cursor() as cur:
        cur.execute(
            "SELECT id, name, city, state FROM public.courses WHERE photo_url IS NULL ORDER BY name"
        )
        courses = [dict(r) for r in cur.fetchall()]

    if args.limit > 0:
        courses = courses[: args.limit]

    print(f"Processing {len(courses)} courses without photos...")

    client = httpx.Client(timeout=30)

    if not args.dry_run:
        ensure_bucket(client)

    success = 0
    skipped = 0

    for i, course in enumerate(courses):
        cid = str(course["id"])
        label = f"[{i+1}/{len(courses)}] {course['name']}"

        # Search Google Places
        place_id, photo_ref = find_place_photo_ref(
            client, course["name"], course["city"], course["state"]
        )

        if not photo_ref:
            print(f"  {label} — no photo found, skipping")
            skipped += 1
            # Still save place_id if found
            if place_id:
                with get_cursor() as cur:
                    cur.execute(
                        "UPDATE public.courses SET google_place_id = %s WHERE id = %s",
                        (place_id, cid),
                    )
            continue

        if args.dry_run:
            print(f"  {label} — found photo (place_id={place_id})")
            success += 1
            continue

        # Download photo
        image_bytes = download_photo(client, photo_ref)
        if not image_bytes:
            print(f"  {label} — download failed, skipping")
            skipped += 1
            continue

        # Upload to storage
        public_url = upload_to_storage(client, cid, image_bytes)
        if not public_url:
            skipped += 1
            continue

        # Save to database
        with get_cursor() as cur:
            cur.execute(
                "UPDATE public.courses SET photo_url = %s, google_place_id = %s WHERE id = %s",
                (public_url, place_id, cid),
            )

        print(f"  {label} — done")
        success += 1

        # Rate limit: Google Places allows ~10 QPS
        time.sleep(0.2)

    client.close()
    print(f"\nDone: {success} photos added, {skipped} skipped")


if __name__ == "__main__":
    main()
