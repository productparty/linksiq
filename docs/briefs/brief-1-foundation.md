# LinksIQ Brief 1: Foundation — Scaffold, Database, Data Pipeline, Backend API

## Goal
Stand up the LinksIQ project from scratch with a working backend, populated database, and verified data pipeline — so Brief 2 (frontend) has real data to build against.

## Problem Statement
LinksIQ is a new project being built with cherry-picked pieces from an existing codebase (`findmyclub`). The foundation needs to be clean, properly structured, and populated with real Golf API data including hole-level detail before any frontend work begins.

## In Scope
* New project scaffold at `D:\projects\golf\linksiq\`
* Fresh Supabase project setup (schema, RLS, auth config)
* FastAPI backend with proper structure (routers, services, models)
* Golf API data pipeline that imports courses AND hole-level data
* Cherry-picked backend utilities from findmyclub
* All backend API routes needed for LinksIQ v1
* Seed data: Michigan courses with hole-level data from Golf API
* Git init + push to `productparty/linksiq`

## Out of Scope (Strict)
* No frontend pages or UI (that's Brief 2)
* No PDF generation (Brief 2)
* No deployment configuration (Brief 2)
* No manual content entry for showcase courses (post-Brief 2)
* No community/crowdsource features
* No recommendation engine
* No amenity filtering

## Project Structure

```
D:\projects\golf\linksiq\
├── CLAUDE.md
├── tasks/
│   ├── todo.md
│   └── lessons.md
├── docs/
│   └── briefs/
│       ├── brief-1-foundation.md    (this file)
│       └── brief-2-frontend.md      (future)
├── server/
│   ├── app.py                       # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── courses.py               # Course CRUD + list/search
│   │   ├── holes.py                 # Hole endpoints
│   │   ├── favorites.py             # User favorites
│   │   └── health.py                # Health check
│   ├── services/
│   │   ├── __init__.py
│   │   ├── golf_api.py              # Golf API integration (cherry-picked + refactored from findmyclub)
│   │   ├── course_service.py        # Course business logic
│   │   └── auth.py                  # Token verification helper
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py               # Pydantic request/response models
│   ├── db/
│   │   ├── __init__.py
│   │   ├── connection.py            # Supabase/psycopg2 connection management
│   │   └── migrations/
│   │       └── 001_initial_schema.sql
│   └── scripts/
│       └── import_courses.py        # One-off data import script
├── linksiq-ui/                      # Empty for now — Brief 2
│   └── .gitkeep
└── .gitignore
```

## The Database Schema

### 1. `courses` table
```sql
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    club_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    course_type TEXT CHECK (course_type IN ('public', 'private', 'municipal', 'resort', 'military')),
    total_par INTEGER,
    total_yardage INTEGER,
    num_holes INTEGER DEFAULT 18 CHECK (num_holes IN (9, 18)),
    slope_rating NUMERIC,
    course_rating NUMERIC,
    description TEXT,
    walkthrough_narrative TEXT,
    website_url TEXT,
    phone TEXT,
    source TEXT DEFAULT 'api_import' CHECK (source IN ('api_import', 'manual', 'community')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courses_state_idx ON public.courses (state);
CREATE INDEX IF NOT EXISTS courses_name_search_idx ON public.courses USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS courses_external_id_idx ON public.courses (external_id);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Courses are editable by service role only" ON public.courses FOR ALL USING (auth.role() = 'service_role');
```

### 2. `holes` table
```sql
CREATE TABLE IF NOT EXISTS public.holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    par INTEGER CHECK (par BETWEEN 3 AND 6),
    yardage_by_tee JSONB DEFAULT '{}',
    handicap_rating INTEGER CHECK (handicap_rating BETWEEN 1 AND 18),
    elevation_description TEXT,
    terrain_description TEXT,
    strategic_tips TEXT,
    green_slope TEXT,
    green_speed_range TEXT,
    green_details TEXT,
    source TEXT DEFAULT 'api_import' CHECK (source IN ('api_import', 'manual', 'community')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, hole_number)
);

CREATE INDEX IF NOT EXISTS holes_course_idx ON public.holes (course_id);

ALTER TABLE public.holes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holes are viewable by everyone" ON public.holes FOR SELECT USING (true);
CREATE POLICY "Holes are editable by service role only" ON public.holes FOR ALL USING (auth.role() = 'service_role');
```

### 3. `profiles` table (simplified from findmyclub)
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles are editable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles are insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. `user_favorites` table
```sql
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, course_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = profile_id);
```

### `yardage_by_tee` JSONB structure
```json
{
    "tees": [
        {
            "name": "Championship",
            "color": "Black",
            "yardage": 450,
            "course_rating_men": 74.2,
            "slope_men": 138
        },
        {
            "name": "Men's",
            "color": "Blue",
            "yardage": 420
        },
        {
            "name": "Women's",
            "color": "Red",
            "yardage": 380,
            "course_rating_women": 72.1,
            "slope_women": 128
        }
    ]
}
```

## The Backend API

### Routes

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `GET` | `/api/health` | Health check | None |
| `GET` | `/api/courses` | List courses (paginated, filter by state, search by name) | None |
| `GET` | `/api/courses/{id}` | Single course with summary stats | None |
| `GET` | `/api/courses/{id}/holes` | All holes for a course (ordered by hole_number) | None |
| `GET` | `/api/courses/{id}/holes/{number}` | Single hole detail | None |
| `GET` | `/api/courses/{id}/guide` | Full course data + all holes (for walkthrough/PDF) | None |
| `GET` | `/api/favorites` | User's saved courses | Required |
| `POST` | `/api/favorites/{course_id}` | Save a course | Required |
| `DELETE` | `/api/favorites/{course_id}` | Unsave a course | Required |

### Query parameters for `GET /api/courses`
* `state` (string) — filter by state abbreviation (e.g., `MI`)
* `search` (string) — full-text search on course name
* `page` (int, default 1)
* `per_page` (int, default 20, max 100)

### Response shapes

**Course list item** (from `GET /api/courses`):
```json
{
    "id": "uuid",
    "name": "Eagle Eye Golf Club",
    "club_name": "Eagle Eye",
    "city": "Bath",
    "state": "MI",
    "course_type": "public",
    "total_par": 72,
    "num_holes": 18,
    "total_yardage": 7025,
    "has_detailed_holes": true
}
```

**Course detail** (from `GET /api/courses/{id}`):
```json
{
    "id": "uuid",
    "name": "...",
    "club_name": "...",
    "city": "...",
    "state": "...",
    "course_type": "...",
    "total_par": 72,
    "num_holes": 18,
    "total_yardage": 7025,
    "slope_rating": 138,
    "course_rating": 74.2,
    "description": "...",
    "walkthrough_narrative": "...",
    "website_url": "...",
    "phone": "...",
    "latitude": 42.123,
    "longitude": -84.456,
    "source": "api_import",
    "holes_summary": {
        "total_holes": 18,
        "has_strategic_tips": 5,
        "has_green_details": 5
    }
}
```

**Hole detail** (from `GET /api/courses/{id}/holes/{number}`):
```json
{
    "id": "uuid",
    "hole_number": 7,
    "par": 4,
    "handicap_rating": 3,
    "yardage_by_tee": { "tees": [...] },
    "elevation_description": "Significant uphill tee shot...",
    "terrain_description": "Dogleg left with fairway bunkers...",
    "strategic_tips": "Favor the right side off the tee...",
    "green_slope": "Back-to-front slope, fastest from above...",
    "green_speed_range": "Stimp 10-11 in summer...",
    "green_details": "Two-tier green, pin positions favor..."
}
```

**Course guide** (from `GET /api/courses/{id}/guide`):
Full course detail object + `holes` array (all 18 holes ordered by hole_number). This single endpoint powers both the walkthrough view and PDF generation.

## The Golf API Data Pipeline

### Cherry-pick source
`D:\projects\golf\golf-course-recommendation-engine\server\utils\dataload.py`

### What to reuse
* `fetch_paginated()` function (line 70) — generic paginated API fetcher
* API base URL and endpoint definitions (line 27)
* Bearer token auth pattern
* `fetch_michigan_courses()` detail-fetch pattern (lines 169-253) — proves the API returns hole-level data in `parsMen[]`, `indexesMen[]`, `tees[].length1-18`

### What to change
* Normalize hole data into rows instead of wide Excel columns
* Store into `courses` + `holes` tables via Supabase client
* Generalize beyond Michigan (accept state param)
* Upsert pattern: match on `external_id`, update if exists, insert if new
* Parse `tees[]` array into the `yardage_by_tee` JSONB structure defined above

### Import script behavior (`scripts/import_courses.py`)
1. Accept `--state MI` param (default to Michigan for initial load)
2. Fetch all clubs in state via Golf API `/clubs` endpoint
3. For each club, fetch course detail via `/courses/{id}` endpoint
4. Upsert into `courses` table (extract total_par from sum of parsMen array)
5. For each course, create/update 18 `holes` rows with par, yardage_by_tee, handicap_rating
6. Log progress: `Imported 47 courses, 846 holes for MI`
7. Handle rate limits gracefully (the Golf API may throttle)

### First action: verify API key
Before any implementation, run a test call to confirm:
* The Golf API key (from findmyclub's env) is still valid
* The `/courses/{id}` endpoint still returns `parsMen`, `indexesMen`, `tees[]` with per-hole lengths
* If the key is expired, STOP and notify — the data pipeline plan depends on this

## Cherry-Pick Inventory (Backend)

From `D:\projects\golf\golf-course-recommendation-engine\server\`:

| Source File | What to Copy | Destination | Changes Needed |
|-------------|-------------|-------------|----------------|
| `utils/dataload.py` lines 70-100 | `fetch_paginated()` + API config | `server/services/golf_api.py` | Clean up, add typing |
| `utils/dataload.py` lines 169-253 | Course detail fetch pattern | `server/services/golf_api.py` | Normalize hole data |
| `app.py` lines 50-70 | `get_user_from_token()` auth helper | `server/services/auth.py` | Minor cleanup |
| `limiter.py` | SlowAPI rate limiter setup | `server/app.py` | As-is |
| `.env.example` | Env var template | `server/.env.example` | Update for LinksIQ vars |

## Environment Variables

### `server/.env.example`
```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Database (direct connection for psycopg2)
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password

# Golf API
GOLF_API_KEY=your-golf-api-key

# Application
CORS_ORIGINS=http://localhost:5173
PORT=8000
```

## Files Expected to Create

| File | Purpose |
|------|---------|
| `server/app.py` | FastAPI app with CORS, rate limiting, router registration |
| `server/requirements.txt` | Python dependencies |
| `server/.env.example` | Environment template |
| `server/routers/courses.py` | Course list, detail, guide endpoints |
| `server/routers/holes.py` | Hole endpoints |
| `server/routers/favorites.py` | Favorites CRUD |
| `server/routers/health.py` | Health check |
| `server/services/golf_api.py` | Golf API client (cherry-picked + refactored) |
| `server/services/course_service.py` | Course/hole query logic |
| `server/services/auth.py` | Token verification |
| `server/models/schemas.py` | Pydantic models for all request/response shapes |
| `server/db/connection.py` | Database connection management |
| `server/db/migrations/001_initial_schema.sql` | All CREATE TABLE statements |
| `server/scripts/import_courses.py` | Golf API → Supabase import script |
| `CLAUDE.md` | Agent instructions |
| `tasks/todo.md` | Task tracking |
| `tasks/lessons.md` | Lessons learned |
| `.gitignore` | Standard Python + Node ignores |

## Acceptance Criteria
* `GET /api/health` returns `{"status": "healthy", "database": true}`
* `GET /api/courses?state=MI` returns paginated list of Michigan courses with total_par and num_holes
* `GET /api/courses/{id}` returns full course detail including holes_summary
* `GET /api/courses/{id}/holes` returns 18 hole objects ordered by hole_number, each with par, yardage_by_tee (JSONB), and handicap_rating
* `GET /api/courses/{id}/guide` returns course + all holes in a single response
* `POST /api/favorites/{course_id}` with valid auth token creates a favorite
* `GET /api/favorites` returns user's saved courses
* `import_courses.py --state MI` successfully imports Michigan courses with hole-level data
* At least 30 Michigan courses with hole data exist in the database after import
* All endpoints return proper error responses (404, 401, 422) with consistent error format
* No hardcoded credentials anywhere in the codebase
* `.env.example` is complete with every required variable documented

## Design Principle
**Data-first.** Get real data flowing before building any UI. Every frontend decision in Brief 2 will be informed by the actual shape and richness of the data this brief produces.

---

## Notes for Claude Code

This brief is the first of two. The second brief (frontend) depends on this one being complete and verified.

**Reference codebase:** `D:\projects\golf\golf-course-recommendation-engine\` contains the findmyclub project with cherry-pickable code. Treat it as read-only reference — copy specific files/functions, don't modify it.

**Before writing any code:**
1. Verify the Golf API key works by making a test call
2. If the key is dead, stop and report — the data pipeline depends on it
3. Set up the Supabase project and run the migration SQL before building routes

**Implementation guidance:**
* Use the simplest solution that achieves the goal
* psycopg2 for database queries (not the Supabase Python SDK — it's a major version behind and unreliable)
* Supabase JS client is fine for frontend (Brief 2), but backend should use direct DB connection
* FastAPI dependency injection for database connections
* Keep route handlers thin — business logic in services
* Type everything with Pydantic models
* The `yardage_by_tee` JSONB structure must match the schema defined above so the frontend can reliably parse it

**What success looks like:** After this brief, I can run `import_courses.py`, then hit `/api/courses/[some-id]/guide` and see a full course with 18 holes of real data. That's the foundation Brief 2 builds on.

### tasks/lessons.md (starter)
```markdown
# LinksIQ Lessons

## Architecture Decisions
- Fresh start with cherry-pick over fork-and-strip: 70% of findmyclub code is irrelevant to LinksIQ
- psycopg2 over Supabase Python SDK: SDK is major version behind, direct DB is more reliable
- Holes as the atomic unit: data model and API built around holes, courses are containers

## Don't Repeat
- [From findmyclub] Don't flatten hole data into wide columns — normalize into rows
- [From findmyclub] Don't put SQL inline in route handlers — use service layer
- [From findmyclub] Don't create multiple tables for the same entity (golfclub vs golfcourse)

## Patterns That Work
- Cherry-pick specific functions, not entire files
- Verify external API keys before building pipelines that depend on them
- Data-first: populate DB before building UI
```
