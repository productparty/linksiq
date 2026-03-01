"""Standalone holes router — currently all hole endpoints live under /courses.

This module exists for future hole-specific endpoints that don't belong
under a course context. For now, hole access is via:
  GET /api/courses/{id}/holes
  GET /api/courses/{id}/holes/{number}
"""

from fastapi import APIRouter

router = APIRouter(prefix="/holes", tags=["Holes"])

# Reserved for future hole-specific endpoints (e.g., search holes by par, etc.)
