from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request

from models.schemas import (
    CourseDetail,
    CourseGuide,
    CourseListResponse,
    HoleResponse,
)
from services import course_service

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=CourseListResponse)
async def list_courses(
    request: Request,
    state: Optional[str] = Query(None, description="Filter by state abbreviation (e.g. MI)"),
    search: Optional[str] = Query(None, description="Full-text search on course name"),
    has_intel: Optional[bool] = Query(None, description="Filter to courses with enriched hole data"),
    sort: Optional[str] = Query(None, description="Sort field: name, yardage, par, rating, slope"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    result = course_service.list_courses(
        state=state,
        search=search,
        has_intel=has_intel,
        sort=sort,
        page=page,
        per_page=per_page,
    )
    return result


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(course_id: UUID):
    course = course_service.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.get("/{course_id}/holes", response_model=list[HoleResponse])
async def get_holes(course_id: UUID):
    if not course_service.course_exists(course_id):
        raise HTTPException(status_code=404, detail="Course not found")
    return course_service.get_holes(course_id)


@router.get("/{course_id}/holes/{hole_number}", response_model=HoleResponse)
async def get_hole(course_id: UUID, hole_number: int):
    if not course_service.course_exists(course_id):
        raise HTTPException(status_code=404, detail="Course not found")
    hole = course_service.get_hole(course_id, hole_number)
    if not hole:
        raise HTTPException(status_code=404, detail="Hole not found")
    return hole


@router.get("/{course_id}/guide", response_model=CourseGuide)
async def get_course_guide(course_id: UUID):
    guide = course_service.get_course_guide(course_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Course not found")
    return guide
