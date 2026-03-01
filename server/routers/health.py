import logging

from fastapi import APIRouter

from db.connection import get_cursor

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    db_ok = False
    try:
        with get_cursor() as cur:
            cur.execute("SELECT 1")
            db_ok = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    return {"status": "healthy" if db_ok else "degraded", "database": db_ok}
