# LinksIQ Brief 2: Frontend — UI, PDF Export, Deployment

## Goal
Build the LinksIQ frontend that turns the data foundation (Brief 1) into a mobile-first web app where golfers can research courses hole-by-hole, walk through a full course, export a printable PDF guide, and save favorites.

## Problem Statement
Brief 1 produced a working backend with real Golf API data (courses + hole-level detail) in Supabase. Now we need the user-facing application that delivers the three usage modes: pre-round research, on-course companion, and printable course guide.

## Prerequisites
* Brief 1 is complete and verified
* `GET /api/courses/{id}/guide` returns a full course with 18 holes of real data
* At least 30 Michigan courses exist in the database
* Supabase Auth is configured and working

## In Scope
* New Vite + React + TypeScript project at `linksiq-ui/`
* Cherry-pick reusable code from findmyclub frontend
* LinksIQ branding, theme, and typography
* Mobile-first responsive design
* All pages: Landing, Course List, Course Detail, Hole Detail, Course Walkthrough, PDF export
* Auth pages: Sign In, Create Account, Password Reset, Auth Callback
* Favorites functionality (requires auth)
* Vercel deployment config
* Railway deployment config for backend

## Out of Scope (Strict)
* No crowdsourced contribution UI (no "add a tip" forms)
* No user profile page beyond auth
* No course submission
* No reviews or ratings
* No map-based course discovery (no "courses near me" map view)
* No social features
* No dark mode (defer to later)
* No native app or PWA features

## Cherry-Pick Inventory (Frontend)

From `D:\projects\golf\golf-course-recommendation-engine\golf-club-ui\src\`:

| Source | Destination | Changes |
|--------|-------------|---------|
| `api/client.ts` | `src/api/client.ts` | Update base URL env var name |
| `context/AuthContext.tsx` | `src/context/AuthContext.tsx` | As-is |
| `context/FavoritesContext.tsx` | `src/context/FavoritesContext.tsx` | Rename golfclub → course, update API paths |
| `components/InteractiveMap.tsx` | `src/components/Map.tsx` | Rename, simplify for single-course view |
| `utils/errorHandling.ts` | `src/utils/errorHandling.ts` | As-is |
| `utils/mapUtils.ts` | `src/utils/mapUtils.ts` | As-is |
| `hooks/useDebounce.ts` | `src/hooks/useDebounce.ts` | As-is |
| `components/common/Pagination.tsx` | `src/components/Pagination.tsx` | As-is |
| `components/common/LoadingSkeleton.tsx` | `src/components/LoadingSkeleton.tsx` | As-is |
| `components/ErrorBoundary.tsx` | `src/components/ErrorBoundary.tsx` | As-is |
| `components/RouteErrorBoundary.tsx` | `src/components/RouteErrorBoundary.tsx` | As-is |
| `components/ProtectedRoute.tsx` | `src/components/ProtectedRoute.tsx` | As-is |
| `lib/supabase.ts` | `src/lib/supabase.ts` | As-is |
| `config.ts` | `src/config.ts` | Update env var names |
| Auth pages (SignIn, CreateAccount, AuthCallback, PasswordReset) | `src/pages/auth/` | Rebrand from findmyclub to LinksIQ |

## Pages & Screens

### 1. Landing Page (`/`)
* Hero section: LinksIQ tagline + value prop ("The local knowledge advantage on any course you play")
* Search bar: search courses by name
* Browse by state: grid or dropdown to jump to state course lists
* Featured courses section: 3-4 showcase courses with rich data as proof of depth
* CTA: "Browse Courses" (no login required)
* Mobile: stack vertically, search prominent

### 2. Course List (`/courses?state=MI`)
* Filterable by state (URL param)
* Searchable by course name
* Paginated list of course cards
* Each card shows: name, city/state, course type, total par, num holes, "detailed" badge if has rich hole data
* Mobile: single-column card list

### 3. Course Detail (`/courses/:id`)
* **Course header:** name, city/state, course type, par, yardage, slope/rating
* **Walkthrough narrative** (if present) — the overview description
* **Hole grid:** visual grid/list of all 18 holes showing par and key info at a glance
* **Tap any hole** → navigates to hole detail
* **Action buttons:** "Full Walkthrough" (sequential view), "Download PDF Guide", "Save to Favorites" (auth required)
* **Map:** show course location via Leaflet (single marker)
* **Contact info:** website, phone
* Mobile: scroll-friendly, sticky action bar at bottom

### 4. Hole Detail (`/courses/:id/holes/:number`)
* **Hole header:** "Hole 7 — Par 4" + handicap rating
* **Yardage table:** all available tees with yardage, formatted clearly
* **Content sections** (only shown if data exists):
  * Elevation & Terrain
  * Strategic Tips (where to miss, club selection)
  * Green Complex (slope, speed, pin positions)
* **Navigation:** Previous/Next hole arrows + "Back to Course" link
* **Mobile-optimized:** This is the on-course companion screen. Large text, swipeable between holes, minimal chrome. A golfer standing on the tee should be able to glance at this.

### 5. Course Walkthrough (`/courses/:id/walkthrough`)
* Sequential view of all 18 holes in order
* Each hole rendered as a section/card on a single scrollable page
* Same content as Hole Detail but condensed per hole (no navigation overhead)
* Anchored sidebar or sticky header showing hole numbers for quick jump
* "Download PDF" button persistent at top
* **This is the pre-round research mode.** Desktop-optimized for the night-before study session.

### 6. PDF Course Guide (generated, not a page)
* Triggered from Course Detail or Walkthrough via "Download PDF Guide" button
* Generates a clean, printable PDF containing:
  * Course header with name, location, par, yardage, slope/rating
  * 18 holes in sequence, each with: par, yardage (primary tee), handicap, terrain, tips, green details
  * Only include content sections that have data (don't show empty "Strategic Tips: —")
  * Footer: "Generated by LinksIQ — linksiq.com"
* Use `@react-pdf/renderer` for client-side generation (no server dependency, works offline once page is loaded)
* The PDF should look professional — not a raw data dump. Think caddie notebook aesthetic.

### 7. Auth Pages (`/signin`, `/signup`, `/reset-password`, `/auth/callback`)
* Cherry-pick from findmyclub, rebrand to LinksIQ
* Simple email/password auth via Supabase
* After signup, redirect to wherever they came from (not a dashboard)
* Auth is only prompted when user tries to save a favorite

### 8. Favorites (`/favorites`)
* Protected route (requires auth)
* List of saved courses (same card format as Course List)
* "Remove" action on each card
* Empty state: "No saved courses yet. Browse courses to find your next round."

## The LinksIQ Brand / Theme

### Colors (MUI theme)
* **Primary:** Deep navy/slate — professional, not playful. Think `#1a2332` or similar.
* **Accent:** A muted green or teal — golf-adjacent without being cliché. Think `#2d8a6e` range.
* **Background:** Clean white/off-white for content readability
* **Text:** Near-black for body, slate-gray for secondary
* **Card surfaces:** Subtle gray or warm white

### Typography
* Sans-serif throughout. Clean, readable at small sizes (on-course companion mode).
* Large bold for hole numbers and par info — scannable from arm's length
* Generous line spacing in content sections (terrain, tips, green details)

### Design direction
* Not sporty/flashy — more like a well-designed field reference guide
* Closer to AllTrails or Strava's course detail pages than GolfNow's booking-heavy UI
* Content-forward: the data IS the experience, minimize chrome around it
* Mobile: think "one-handed, in sunlight, with a glove on" for on-course screens

### Logo
* Text-based for v1: "LinksIQ" in the primary font, accent color on "IQ"
* No icon needed yet — brand mark can come later

## Frontend Structure

```
linksiq-ui/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts              (cherry-picked)
│   │   ├── courses.ts             (new — course + hole API calls)
│   │   └── favorites.ts           (cherry-picked, renamed)
│   ├── components/
│   │   ├── Layout.tsx             (new — shell with Header/Footer)
│   │   ├── Header.tsx             (new — LinksIQ nav)
│   │   ├── Footer.tsx             (new)
│   │   ├── CourseCard.tsx          (new — card for course lists)
│   │   ├── HoleCard.tsx           (new — condensed hole view for walkthrough)
│   │   ├── HoleDetail.tsx         (new — full hole content)
│   │   ├── YardageTable.tsx       (new — tee/yardage display)
│   │   ├── CourseGuide.tsx        (new — PDF generation component)
│   │   ├── Map.tsx                (cherry-picked from InteractiveMap)
│   │   ├── FavoriteButton.tsx     (new — heart/save toggle)
│   │   ├── HoleNavigation.tsx     (new — prev/next hole arrows)
│   │   ├── Pagination.tsx         (cherry-picked)
│   │   ├── LoadingSkeleton.tsx    (cherry-picked)
│   │   ├── ErrorBoundary.tsx      (cherry-picked)
│   │   ├── RouteErrorBoundary.tsx (cherry-picked)
│   │   └── ProtectedRoute.tsx     (cherry-picked)
│   ├── context/
│   │   ├── AuthContext.tsx         (cherry-picked)
│   │   └── FavoritesContext.tsx    (cherry-picked, modified)
│   ├── hooks/
│   │   ├── useDebounce.ts         (cherry-picked)
│   │   └── useCourseGuide.ts      (new — hook for fetching full course + holes for PDF/walkthrough)
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── CourseList.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── HolePage.tsx
│   │   ├── Walkthrough.tsx
│   │   ├── Favorites.tsx
│   │   ├── NotFound.tsx
│   │   └── auth/
│   │       ├── SignIn.tsx
│   │       ├── CreateAccount.tsx
│   │       ├── PasswordReset.tsx
│   │       └── AuthCallback.tsx
│   ├── lib/
│   │   └── supabase.ts            (cherry-picked)
│   ├── utils/
│   │   ├── errorHandling.ts       (cherry-picked)
│   │   └── mapUtils.ts            (cherry-picked)
│   ├── types/
│   │   └── course.ts              (new — Course, Hole, CourseGuide TypeScript types)
│   ├── theme.ts                   (new — LinksIQ MUI theme)
│   ├── config.ts                  (cherry-picked, updated)
│   ├── App.tsx                    (new — router setup)
│   └── main.tsx
├── .env.example
├── vite.config.ts
├── tsconfig.app.json
├── vercel.json
└── package.json
```

## Deployment Configuration

### Vercel (frontend)
```json
{
    "buildCommand": "cd linksiq-ui && npm run build",
    "outputDirectory": "linksiq-ui/dist",
    "framework": "vite"
}
```

### Railway (backend)
* Dockerfile or Procfile in `server/` directory
* Environment variables set in Railway dashboard
* `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Environment Variables

**Frontend (`linksiq-ui/.env.example`):**
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

## Acceptance Criteria
* Landing page loads with LinksIQ branding, search bar, and state browse
* `/courses?state=MI` shows paginated Michigan course list with cards
* `/courses/:id` shows full course detail with hole grid and all action buttons
* `/courses/:id/holes/7` shows complete hole detail with yardage table and all content sections
* `/courses/:id/walkthrough` shows all 18 holes in scrollable sequence
* "Download PDF Guide" generates and downloads a professional-looking PDF with course + hole data
* PDF only shows content sections that have data (no empty sections)
* Saving a favorite prompts for sign-in if not authenticated
* Favorites page shows saved courses with remove option
* All pages are mobile-responsive and usable on a phone screen
* Hole detail page is optimized for quick scanning (large par/yardage, readable tips)
* Site deploys to Vercel without build errors
* Backend deploys to Railway with working API connection
* No console errors in production build
* No hardcoded credentials

## Design Principle
**Mobile-first, content-forward.** The data IS the experience. Every design decision should optimize for a golfer reading course intelligence — whether on a laptop the night before or standing on the tee with a phone. Minimize chrome, maximize content readability.

---

## Notes for Claude Code

**Reference codebase:** `D:\projects\golf\golf-course-recommendation-engine\golf-club-ui\src\` contains findmyclub's frontend with cherry-pickable code. Treat as read-only reference.

**PDF generation:** Use `@react-pdf/renderer` for client-side PDF. The Course Guide PDF is a core feature, not an afterthought. It should look like a professional yardage book — clean typography, clear hole-by-hole layout, printable on letter-size paper. The footer "Generated by LinksIQ" is subtle but always present.

**Mobile-first priority:**
The hole detail page is the most important mobile screen. A golfer on the course will tap a hole number and need to immediately see par, yardage, and tips. Design for glanceability — not scrolling through paragraphs.

**Routing:**
```
/                          → Landing
/courses                   → Course List (state filter via ?state=MI)
/courses/:id               → Course Detail
/courses/:id/holes/:number → Hole Detail
/courses/:id/walkthrough   → Course Walkthrough
/favorites                 → Favorites (protected)
/signin                    → Sign In
/signup                    → Create Account
/reset-password            → Password Reset
/auth/callback             → Auth Callback
```

**State management:**
* React Query (`@tanstack/react-query`) for all API data fetching and caching
* AuthContext for auth state
* FavoritesContext for favorite state
* No Redux, no Zustand — keep it simple

**What success looks like:** A golfer finds Eagle Eye Golf Club on LinksIQ, reads the walkthrough of all 18 holes on their laptop, downloads the PDF course guide, and the next morning pulls it out of their bag on the first tee. That's the product working.

### tasks/lessons.md (additions for Brief 2)
```markdown
## Don't Repeat
- [From findmyclub] Don't use Tailwind config without actually installing/wiring it up
- [From findmyclub] Don't create duplicate auth context files (stores/ vs context/)
- [From findmyclub] Don't create multiple versions of the same page component (ClubDetail vs ClubDetailPage)

## Patterns That Work
- Cherry-pick specific files from findmyclub, don't copy entire directories
- MUI theme for consistent styling, not scattered CSS files
- React Query for data fetching — no manual loading/error state management
```
