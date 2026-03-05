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
- Save API data to local JSON to avoid re-fetching (300/day free tier limit)
- golfcourseapi.com uses `Authorization: Key {key}` not Bearer
- golfcourseapi.com has no state filter — must paginate and filter client-side
- Supabase pooler connection: user=`postgres.{ref}` host=`aws-0-{region}.pooler.supabase.com`

## Google Places Enrichment (Brief 3)

### API Notes
- Places API (New) uses REST: `GET https://places.googleapis.com/v1/places/{placeId}`
- Fields requested via `X-Goog-FieldMask` header, API key via `X-Goog-Api-Key` header
- Enterprise + Atmosphere fields (rating, reviews, editorialSummary, generativeSummary, reviewSummary) = 1,000 free calls/month
- Review objects have `name` field like "places/ABC/reviews/XYZ" — extract last segment for dedup ID
- `generativeSummary` and `reviewSummary` are NOT always present — many places return null for these
- `editorialSummary` is also sparse — Google doesn't have editorial summaries for most golf courses
- The 5 reviews returned per place are Google's "most relevant" — not all reviews

### Supabase Notes
- Can't run raw SQL via supabase-js (no `exec_sql` rpc function available) — use pg driver directly for migrations
- psql from Windows Git Bash has password handling issues with special chars — pg Node driver works reliably
- Service role key needed for write operations on tables with RLS policies

### Pattern
- Layer enrichment: never overwrite non-NULL values, only fill gaps
- Use `enrichment_status` column for idempotent pipelines (pending → api_fetched → complete)
- Rate limit API calls with sleep(300ms) to stay under per-minute quotas
