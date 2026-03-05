# Brief 1: Foundation — COMPLETE

## Results
- 127 metro Detroit courses, 1,998 holes imported
- All API endpoints verified (health, courses, holes, guide, favorites)
- Repo: https://github.com/productparty/linksiq

## Deviations from original brief
- Used golfcourseapi.com instead of golfapi.io (different API, different data format)
- Auth header format: `Key` not `Bearer`
- Tees grouped by male/female (not flat array) — normalizer updated
- No filtering by state in API — paginated through all 30k courses, saved MI to local JSON
- Used Supabase connection pooler (aws-0-us-west-2.pooler.supabase.com) instead of direct DB host

---

# Brief 2: Frontend — IN PROGRESS

## Plan
- [ ] Step 1: Scaffold Vite + React + TypeScript project
- [ ] Step 2: Cherry-pick frontend files from findmyclub (auth, favorites, error handling, etc.)
- [ ] Step 3: MUI theme + LinksIQ branding
- [ ] Step 4: API client + React Query setup
- [ ] Step 5: Layout (Header, Footer, routing)
- [ ] Step 6: Landing page
- [ ] Step 7: Course List page
- [ ] Step 8: Course Detail page
- [ ] Step 9: Hole Detail page
- [ ] Step 10: Course Walkthrough page
- [ ] Step 11: PDF Course Guide generation
- [ ] Step 12: Auth pages (SignIn, CreateAccount, PasswordReset, AuthCallback)
- [ ] Step 13: Favorites page
- [ ] Step 14: Vercel + Railway deployment config
- [ ] Step 15: Verify all acceptance criteria

## Progress Notes
Starting Brief 2 execution.

---

# Brief 3: Google Places Enrichment Pipeline — IN PROGRESS

## Plan
- [x] Phase 1: Schema migration (006_google_enrichment.sql) — adds 11 columns to courses, creates course_reviews table
- [x] Phase 2: Google Places API batch fetch script (enrich-places-api.ts) — tested with --limit 1
- [x] Phase 3: LLM review extraction script (enrich-llm-extract.ts) — built, needs ANTHROPIC_API_KEY to run
- [ ] Phase 2 full run: Process all 605 courses (npx tsx enrich-places-api.ts)
- [ ] Phase 3 full run: Extract insights from reviews (npx tsx enrich-llm-extract.ts)
- [ ] Verify: website_url + phone population rates
- [ ] Verify: review counts per course
- [ ] Verify: LLM-extracted descriptions and hole insights

## Completed
- Migration 006 applied to production database
- Dry-run of Places API: 1 course enriched (Eagle Eye GC: 4.6 rating, 670 reviews, website + phone populated, 5 reviews stored)
- All scripts compile cleanly (TypeScript strict mode)
