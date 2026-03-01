"""LinksIQ FastAPI application entry point."""

import os
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware

# Load env before anything else
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from server.routers import courses, holes, favorites, health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="LinksIQ API",
    description="Course knowledge platform for serious golfers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# SlowAPI rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [o.strip() for o in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(health.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(holes.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/")
async def root():
    return {"status": "healthy", "app": "LinksIQ API"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server.app:app", host="0.0.0.0", port=port, reload=True)
