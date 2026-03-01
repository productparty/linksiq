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
