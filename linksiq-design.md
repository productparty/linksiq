# LinksIQ — Design Document

## Goal
Give serious golfers the local knowledge advantage on any course they play, through deep hole-by-hole intelligence that no GPS app or booking platform provides.

## Problem Statement
A golfer preparing for an unfamiliar course needs a way to study every hole in detail before and during the round, because no existing platform aggregates deep course-level geographic and strategic data, which means they're playing blind on courses where local knowledge is the difference between a good round and a frustrating one.

### Problem Narrative
- **I am:** A serious golfer (single-digit to mid-handicap) traveling to play a course I've never seen
- **Trying to:** Understand every hole before I play — terrain, strategy, where to miss, what the greens do
- **But:** GPS apps (SwingU, Grint, 18Birdies) focus on yardages and my swing data, not course knowledge. Booking platforms (GolfNow) help me find tee times, not understand the course. Google gives me scattered blog posts and generic course descriptions.
- **Because:** Deep course intelligence doesn't live anywhere in one place — it's trapped in the heads of locals and regulars
- **Which makes me feel:** Underprepared, like I'm leaving strokes on the table because I don't know what I don't know

### Jobs This Addresses
- **Functional:** Study hole-by-hole course details (terrain, strategy, greens) before and during a round
- **Social:** Show up prepared, play with confidence, look like someone who does their homework
- **Emotional:** Feel the same confidence on an unfamiliar course that a regular member has

## Positioning
**For** serious golfers preparing to play unfamiliar courses **that need** deep, hole-by-hole intelligence before and during their round, **LinksIQ** is a course knowledge platform **that** gives you the local knowledge advantage on any course you play.

**Unlike** GPS apps that focus on your swing data and live yardages, or booking platforms that help you find tee times, **LinksIQ provides** the course-level geographic and strategic intelligence those platforms don't — terrain, strategy, green details, and local knowledge for every hole.

## Approach
**Option B: Fresh Start + Cherry Pick** from existing findmyclub codebase.

New React/TypeScript frontend (Vite) + new FastAPI backend + fresh Supabase project. Cherry-pick ~4.5 hours of directly reusable code from findmyclub (auth context, API client, map component, error handling, utilities). Build new pages, new API routes, new data model designed around holes as the atomic unit.

Rationale: 70% of findmyclub's pages are being dropped. The backend is a monolith that needs restructuring. The database has a messy dual-table design. Fresh start with cherry-picked pieces is faster than fork-and-strip.

### Three Usage Modes
1. **Pre-round research** — full course walkthrough on laptop or phone browser
2. **On-course companion** — per-hole quick reference on mobile browser
3. **Printable course guide** — PDF export to throw in the bag

### Three Data Layers
1. **API baseline** (Golf API) — par, yardage by tee, handicap index for every hole. Automated import.
2. **Manual enrichment** (Mike) — elevation, terrain, strategic tips, green details for showcase courses. 10-20 Michigan courses at launch.
3. **Community crowdsourced** (future) — user-contributed tips, conditions, photos. Not in v1.

## In Scope (v1)
- Fresh project scaffold (React/TS frontend, FastAPI backend, Supabase)
- Cherry-pick reusable code from findmyclub
- Supabase schema: `courses`, `holes`, `user_favorites`, `profiles`
- Golf API data pipeline: import courses + hole-level data
- Course catalog browse (list/search by state, not the old ZIP-radius finder)
- Course overview page with walkthrough narrative
- Hole-by-hole detail pages (par, yardage, handicap, elevation, terrain, strategy, green details)
- PDF course guide export (printable)
- Mobile-responsive design (mobile-first for on-course use)
- Optional user accounts (Supabase Auth — email/password)
- Favorites (save courses, requires account)
- Seed 10-20 Michigan courses with rich manual content
- Deploy: Vercel (frontend) + Railway (backend)

## Out of Scope (Strict)
- Crowdsourced contributions / community features
- On-course GPS tracking or live yardages
- User-submitted photos, condition reports, wind data
- Tee time booking or any transactional features
- Native mobile app
- Monetization / payments
- Social features, reviews, ratings
- Course recommendation engine
- Amenity-based filtering

## Key Decisions
- **Holes are the atomic unit:** The data model and UI are built around holes, not courses. A course is a collection of holes.
- **Mobile-first:** The on-course companion mode drives the responsive design approach. Desktop is the secondary viewport.
- **No login wall:** All course/hole data is publicly browsable. Account is optional, only needed for favorites.
- **PDF is a first-class feature:** Not an afterthought. The printable course guide is a core differentiator.
- **Fresh Supabase:** New project with clean schema rather than migrating messy old tables.
- **Golf API provides baseline hole data:** Par, yardage, handicap auto-imported. Rich content (terrain, tips, greens) is manual.

## Acceptance Criteria
- [ ] A user can browse courses by state and view a course overview page
- [ ] A user can drill into any hole and see: par, yardage by tee, handicap rating
- [ ] Showcase courses (10-20 Michigan) additionally show: elevation, terrain, strategic tips, green details
- [ ] A user can view a full course walkthrough (all 18 holes in sequence)
- [ ] A user can export a PDF course guide for any course
- [ ] A user can create an account and save favorite courses
- [ ] All browsing works without an account
- [ ] The UI is mobile-first and usable on a phone at the course
- [ ] The site loads and renders correctly on mobile Safari and Chrome
- [ ] Golf API data pipeline successfully imports courses with hole-level data into Supabase

## Next Step
Implementation via two sequential briefs:
1. **Brief 1: Foundation** — scaffold, database, data pipeline, backend API
2. **Brief 2: Frontend** — UI pages, PDF export, deployment
