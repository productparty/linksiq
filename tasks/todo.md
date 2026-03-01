# Brief 1: Foundation — Scaffold, Database, Data Pipeline, Backend API

## Plan
- [x] Step 1: Project scaffold — create directory structure, .gitignore, requirements.txt
- [x] Step 2: Cherry-pick backend code from findmyclub (golf_api.py, auth.py, limiter)
- [x] Step 3: Database schema — create migration SQL file (001_initial_schema.sql)
- [x] Step 4: Database connection module (psycopg2 with context managers)
- [x] Step 5: Pydantic models (schemas.py — all request/response shapes)
- [x] Step 6: Backend services (course_service.py, golf_api.py, auth.py)
- [x] Step 7: API routes (courses, holes, favorites, health)
- [x] Step 8: FastAPI app.py with CORS, rate limiting, router registration
- [x] Step 9: Import script (import_courses.py) — Golf API → Supabase pipeline
- [x] Step 10: Environment config (.env.example)
- [x] Step 11: Git init
- [ ] Step 12: **BLOCKED** — Golf API key not found in findmyclub .env

## Progress Notes

### What was done
All code scaffolding is complete. The full backend is written and structured per the brief:
- FastAPI app with proper separation (routers → services → db)
- Cherry-picked `fetch_paginated()`, API config, and auth pattern from findmyclub
- Normalized hole data into rows (not wide columns like findmyclub)
- Auth uses Supabase GoTrue REST API directly (no Supabase Python SDK)
- Rate limiting via SlowAPI
- Import script with upsert pattern and rate limit handling
- Migration SQL matches brief exactly (courses, holes, profiles, user_favorites + RLS)

### Design decisions
- Used httpx instead of Supabase Python SDK for auth token verification (calls GoTrue /auth/v1/user directly) — aligns with "no Supabase SDK for backend" rule
- Kept holes router mostly empty since all hole endpoints live under /courses/{id}/holes — router exists as placeholder per project structure
- Import script uses named params for all SQL to avoid positional/named mixing

### Blocker
**GOLF_API_KEY is missing from findmyclub's .env file.** The key was referenced in dataload.py but never stored in the committed .env. Need the key to:
1. Verify the Golf API is still accessible
2. Run the import pipeline
3. Populate Michigan course data

## Review
[Blocked on API key — all code complete and ready to test]
