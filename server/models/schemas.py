from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- Hole schemas ---

class TeeYardage(BaseModel):
    name: str
    color: Optional[str] = None
    yardage: Optional[int] = None
    course_rating_men: Optional[float] = None
    slope_men: Optional[int] = None
    course_rating_women: Optional[float] = None
    slope_women: Optional[int] = None


class YardageByTee(BaseModel):
    tees: list[TeeYardage] = []


class HoleResponse(BaseModel):
    id: UUID
    hole_number: int
    par: Optional[int] = None
    handicap_rating: Optional[int] = None
    yardage_by_tee: Optional[dict] = None
    elevation_description: Optional[str] = None
    terrain_description: Optional[str] = None
    strategic_tips: Optional[str] = None
    green_slope: Optional[str] = None
    green_speed_range: Optional[str] = None
    green_details: Optional[str] = None


# --- Course schemas ---

class HolesSummary(BaseModel):
    total_holes: int = 0
    has_strategic_tips: int = 0
    has_green_details: int = 0


class CourseListItem(BaseModel):
    id: UUID
    name: str
    club_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    course_type: Optional[str] = None
    total_par: Optional[int] = None
    num_holes: Optional[int] = None
    total_yardage: Optional[int] = None
    has_detailed_holes: bool = False


class CourseDetail(BaseModel):
    id: UUID
    name: str
    club_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    course_type: Optional[str] = None
    total_par: Optional[int] = None
    num_holes: Optional[int] = None
    total_yardage: Optional[int] = None
    slope_rating: Optional[float] = None
    course_rating: Optional[float] = None
    description: Optional[str] = None
    walkthrough_narrative: Optional[str] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: Optional[str] = None
    holes_summary: HolesSummary = HolesSummary()


class CourseGuide(BaseModel):
    """Full course detail + all holes, for walkthrough and PDF generation."""
    id: UUID
    name: str
    club_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    course_type: Optional[str] = None
    total_par: Optional[int] = None
    num_holes: Optional[int] = None
    total_yardage: Optional[int] = None
    slope_rating: Optional[float] = None
    course_rating: Optional[float] = None
    description: Optional[str] = None
    walkthrough_narrative: Optional[str] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    holes: list[HoleResponse] = []


class CourseListResponse(BaseModel):
    courses: list[CourseListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


# --- Favorites schemas ---

class FavoriteResponse(BaseModel):
    id: UUID
    course_id: UUID
    course_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    course_type: Optional[str] = None
    total_par: Optional[int] = None
    num_holes: Optional[int] = None
    created_at: datetime


# --- Health ---

class HealthResponse(BaseModel):
    status: str
    database: bool


# --- Error ---

class ErrorResponse(BaseModel):
    detail: str
