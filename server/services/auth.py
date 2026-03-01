"""Token verification helper — validates Supabase auth tokens via GoTrue REST API."""

import os
import logging
from typing import Any

import httpx
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")


def get_user_from_token(token: str) -> dict[str, Any]:
    """Validate a Supabase auth token and return user info.

    Calls Supabase GoTrue /auth/v1/user endpoint directly,
    avoiding the Supabase Python SDK.
    """
    try:
        response = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": os.getenv("SUPABASE_ANON_KEY", ""),
            },
            timeout=10,
        )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        user_data = response.json()
        return {
            "id": user_data["id"],
            "email": user_data.get("email"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth token validation failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


def authenticate_request(request: Request) -> str:
    """Extract bearer token from request and return the user's profile ID."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")

    token = auth_header.split(" ", 1)[1]
    user_info = get_user_from_token(token)
    return user_info["id"]
