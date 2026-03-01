# CLAUDE.md

This file guides AI agents (Claude Code, Cursor) on how to work in the LinksIQ codebase. Read this before any implementation.

---

## Autonomy Mode

- Do NOT stop to ask permission or clarification unless genuinely blocked
- If the brief is clear, execute it — don't ask "should I proceed?"
- Make reasonable decisions and document them in `tasks/todo.md`
- Only stop if: an API key is dead, a dependency won't install, or the brief is genuinely ambiguous
- After each major step, log progress in `tasks/todo.md` and keep going
- When multiple reasonable approaches exist, pick the simpler one and note why in `tasks/todo.md`

---

## About LinksIQ

The AllTrails for golf courses. A course knowledge platform that gives serious golfers deep, hole-by-hole intelligence on any course they play.

**Tech stack:**
- Frontend: React + TypeScript (Vite), MUI v7, deployed to Vercel
- Backend: Python FastAPI, deployed to Railway
- Database: Supabase (PostgreSQL + Auth + RLS)
- Data source: Golf API (golfapi.io) for course and hole-level data

**Core concept:**
- Holes are the atomic unit — courses are containers of holes
- Three usage modes: pre-round research (laptop), on-course companion (mobile browser), printable PDF guide
- Three data layers: API baseline → manual enrichment → community crowdsourced (future)

**Non-negotiable constraints:**
- No login wall — all course/hole data is publicly browsable
- User accounts are optional (only needed for saving favorites)
- Mobile-first responsive design — the on-course companion mode drives layout decisions
- PDF course guide is a first-class feature, not an afterthought
- No hardcoded credentials anywhere — all secrets in `.env`

---

## How Work Arrives

Implementation briefs come from ideation sessions (Claude project). Each brief follows a standard format:

- **Goal**: What this achieves
- **Scope**: What's in and out
- **Architecture**: Database schema, API routes, component structure
- **Cherry-pick inventory**: Specific files to copy from the findmyclub reference codebase
- **Acceptance Criteria**: Testable outcomes

**Your job: execute the brief, not expand it.** If the brief is unclear or ambiguous, stop and ask — don't guess. Product decisions were already made during ideation.

---

## Workflow

### 1. Before Starting Any Task
1. Read this file
2. Read `tasks/lessons.md` (if it exists)
3. Read the implementation brief
4. Write your plan to `tasks/todo.md`
5. Execute (don't wait for confirmation — autonomy mode)

### 2. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan — don't keep pushing
- The brief is your spec. Follow it. Question ambiguity before assuming.

### 3. Task Tracking
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Track Progress**: Mark items complete as you go
3. **Explain Changes**: High-level summary at each step
4. **Document Results**: Add review section to `tasks/todo.md`
5. **Keep going**: Don't stop between steps unless blocked

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Run the server, test endpoints, verify data flows
- Ask yourself: "Would a senior engineer approve this?"

### 5. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user

---

## LinksIQ-Specific Rules

### Database
- Supabase PostgreSQL with Row Level Security
- All course/hole data is publicly readable (RLS: SELECT for everyone)
- Write operations restricted to service role (backend) or authenticated users (favorites)
- Schema changes go in `server/db/migrations/` as numbered SQL files
- Use psycopg2 for backend database access (not the Supabase Python SDK)

### Backend
- FastAPI with proper separation: `routers/` → `services/` → `db/`
- Keep route handlers thin — business logic in services
- Type everything with Pydantic models in `models/schemas.py`
- Consistent error responses: `{"detail": "message"}` with appropriate HTTP status codes
- Rate limiting via SlowAPI on all public endpoints

### Frontend
- React Query (`@tanstack/react-query`) for all API data fetching
- MUI v7 for components and theming — no Tailwind, no CSS-in-JS beyond MUI's sx prop
- AuthContext for auth state, FavoritesContext for favorites — no Redux, no Zustand
- Mobile-first: design for phone viewport first, then expand to desktop

### Cherry-Picking from findmyclub
- Reference codebase at `D:\projects\golf\golf-course-recommendation-engine\`
- Treat as READ-ONLY — copy specific files, don't modify the original
- Each brief specifies exactly which files to cherry-pick and what changes are needed
- When copying, update all references from "findmyclub"/"club" to "LinksIQ"/"course"

### PDF Generation
- Use `@react-pdf/renderer` for client-side PDF generation
- PDFs must look professional — caddie notebook aesthetic, not a data dump
- Footer on every page: "Generated by LinksIQ — linksiq.com"
- Only render content sections that have data (no empty placeholder sections)

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary.
- **YAGNI**: Don't add features not in the brief.
- **Prefer existing patterns**: Match the codebase conventions over introducing new ones.
- **Data-first**: Backend and data pipeline before frontend. Real data drives UI decisions.

---

## Self-Improvement Loop

After ANY correction from the user:
1. Fix the issue
2. Update `tasks/lessons.md` with the pattern
3. Continue

Format for lessons:
```
[Mistake pattern]: [What to do instead]
```

Review `tasks/lessons.md` at session start. These are rules you wrote for yourself — follow them.

---

## Project Structure

```
linksiq/
├── CLAUDE.md              # This file — agent instructions
├── tasks/
│   ├── todo.md            # Current task plan and progress
│   └── lessons.md         # Accumulated learnings
├── docs/
│   └── briefs/            # Implementation briefs from ideation
├── server/
│   ├── app.py             # FastAPI entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/           # API route handlers
│   ├── services/          # Business logic
│   ├── models/            # Pydantic schemas
│   ├── db/                # Database connection + migrations
│   └── scripts/           # One-off scripts (data import, etc.)
├── linksiq-ui/            # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── api/           # API client + endpoint functions
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React contexts (Auth, Favorites)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page-level components
│   │   ├── lib/           # Third-party setup (Supabase client)
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript type definitions
│   │   ├── theme.ts       # MUI theme configuration
│   │   └── config.ts      # Environment config
│   └── .env.example
└── .gitignore
```

---

## tasks/todo.md Format
```markdown
# [Feature/Task Name]

## Plan
- [ ] Step 1: [Description]
- [ ] Step 2: [Description]
- [ ] Step 3: [Description]

## Progress Notes
[Add notes as you complete steps]

## Review
[Summary of what was done, any deviations from plan]
```

---

## Communication Style

- Be direct. Skip preamble.
- If blocked, say what's blocking you and what you need.
- If you made a mistake, own it and fix it.
- Summarize changes in plain language, not just file diffs.
- Don't ask "shall I continue?" — just continue.

---

This file evolves. Update it when you learn something that should apply to future sessions.