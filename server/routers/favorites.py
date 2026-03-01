from uuid import UUID

from fastapi import APIRouter, HTTPException, Request

from server.models.schemas import FavoriteResponse
from server.services.auth import authenticate_request
from server.services import course_service

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=list[FavoriteResponse])
async def get_favorites(request: Request):
    profile_id = authenticate_request(request)
    return course_service.get_favorites(profile_id)


@router.post("/{course_id}", status_code=201)
async def add_favorite(course_id: UUID, request: Request):
    profile_id = authenticate_request(request)

    if not course_service.course_exists(course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    result = course_service.add_favorite(profile_id, course_id)
    if result is None:
        return {"detail": "Course already in favorites"}
    return {"detail": "Course saved to favorites", "id": str(result["id"])}


@router.delete("/{course_id}", status_code=200)
async def remove_favorite(course_id: UUID, request: Request):
    profile_id = authenticate_request(request)

    deleted = course_service.remove_favorite(profile_id, course_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"detail": "Course removed from favorites"}
