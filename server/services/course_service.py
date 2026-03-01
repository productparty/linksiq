import math
from typing import Optional
from uuid import UUID

from db.connection import get_cursor


def list_courses(
    state: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    """List courses with optional state filter and name search, paginated."""
    per_page = min(per_page, 100)
    offset = (page - 1) * per_page

    conditions = []
    params = []

    if state:
        conditions.append("c.state = %s")
        params.append(state.upper())

    if search:
        conditions.append("to_tsvector('english', c.name) @@ plainto_tsquery('english', %s)")
        params.append(search)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    # Get total count
    with get_cursor() as cur:
        cur.execute(f"SELECT COUNT(*) as count FROM public.courses c {where_clause}", params)
        total = cur.fetchone()["count"]

    # Get page of courses with has_detailed_holes flag
    query = f"""
        SELECT
            c.id, c.name, c.club_name, c.city, c.state, c.course_type,
            c.total_par, c.num_holes, c.total_yardage,
            EXISTS (
                SELECT 1 FROM public.holes h
                WHERE h.course_id = c.id
                AND (h.strategic_tips IS NOT NULL OR h.green_details IS NOT NULL)
            ) as has_detailed_holes
        FROM public.courses c
        {where_clause}
        ORDER BY c.name
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])

    with get_cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()

    return {
        "courses": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if total > 0 else 0,
    }


def get_course(course_id: UUID) -> Optional[dict]:
    """Get a single course with holes_summary."""
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT
                c.*,
                COALESCE(hs.total_holes, 0) as total_holes,
                COALESCE(hs.has_strategic_tips, 0) as has_strategic_tips,
                COALESCE(hs.has_green_details, 0) as has_green_details
            FROM public.courses c
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*) as total_holes,
                    COUNT(h.strategic_tips) as has_strategic_tips,
                    COUNT(h.green_details) as has_green_details
                FROM public.holes h
                WHERE h.course_id = c.id
            ) hs ON true
            WHERE c.id = %s
            """,
            (str(course_id),),
        )
        row = cur.fetchone()

    if not row:
        return None

    row = dict(row)
    row["holes_summary"] = {
        "total_holes": row.pop("total_holes"),
        "has_strategic_tips": row.pop("has_strategic_tips"),
        "has_green_details": row.pop("has_green_details"),
    }
    return row


def get_holes(course_id: UUID) -> list[dict]:
    """Get all holes for a course, ordered by hole_number."""
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT id, hole_number, par, handicap_rating, yardage_by_tee,
                   elevation_description, terrain_description, strategic_tips,
                   green_slope, green_speed_range, green_details
            FROM public.holes
            WHERE course_id = %s
            ORDER BY hole_number
            """,
            (str(course_id),),
        )
        return [dict(r) for r in cur.fetchall()]


def get_hole(course_id: UUID, hole_number: int) -> Optional[dict]:
    """Get a single hole by course_id and hole_number."""
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT id, hole_number, par, handicap_rating, yardage_by_tee,
                   elevation_description, terrain_description, strategic_tips,
                   green_slope, green_speed_range, green_details
            FROM public.holes
            WHERE course_id = %s AND hole_number = %s
            """,
            (str(course_id), hole_number),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def get_course_guide(course_id: UUID) -> Optional[dict]:
    """Get full course detail + all holes for walkthrough/PDF."""
    course = get_course(course_id)
    if not course:
        return None

    holes = get_holes(course_id)
    # Remove holes_summary from guide response, add holes list
    course.pop("holes_summary", None)
    course["holes"] = holes
    return course


def course_exists(course_id: UUID) -> bool:
    """Check if a course exists."""
    with get_cursor() as cur:
        cur.execute("SELECT 1 FROM public.courses WHERE id = %s", (str(course_id),))
        return cur.fetchone() is not None


# --- Favorites ---

def get_favorites(profile_id: UUID) -> list[dict]:
    """Get user's favorite courses."""
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT uf.id, uf.course_id, c.name as course_name,
                   c.city, c.state, c.course_type, c.total_par, c.num_holes,
                   uf.created_at
            FROM public.user_favorites uf
            JOIN public.courses c ON c.id = uf.course_id
            WHERE uf.profile_id = %s
            ORDER BY uf.created_at DESC
            """,
            (str(profile_id),),
        )
        return [dict(r) for r in cur.fetchall()]


def add_favorite(profile_id: UUID, course_id: UUID) -> Optional[dict]:
    """Add a course to user's favorites. Returns the favorite or None if already exists."""
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO public.user_favorites (profile_id, course_id)
            VALUES (%s, %s)
            ON CONFLICT (profile_id, course_id) DO NOTHING
            RETURNING id, course_id, created_at
            """,
            (str(profile_id), str(course_id)),
        )
        row = cur.fetchone()
    return dict(row) if row else None


def remove_favorite(profile_id: UUID, course_id: UUID) -> bool:
    """Remove a course from user's favorites. Returns True if deleted."""
    with get_cursor() as cur:
        cur.execute(
            """
            DELETE FROM public.user_favorites
            WHERE profile_id = %s AND course_id = %s
            """,
            (str(profile_id), str(course_id)),
        )
        return cur.rowcount > 0
