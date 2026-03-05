-- Migration 006: Google Places API enrichment columns + course_reviews table
-- Adds columns for storing Google Places data and LLM-extracted insights
-- Does NOT modify or drop any existing columns

-- ============================================================
-- 1. New columns on courses table
-- ============================================================

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC,
  ADD COLUMN IF NOT EXISTS google_rating_count INTEGER,
  ADD COLUMN IF NOT EXISTS editorial_summary TEXT,
  ADD COLUMN IF NOT EXISTS generative_summary TEXT,
  ADD COLUMN IF NOT EXISTS review_summary TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB,
  ADD COLUMN IF NOT EXISTS price_level TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_uri TEXT,
  ADD COLUMN IF NOT EXISTS course_conditions_json JSONB,
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- ============================================================
-- 2. course_reviews table
-- ============================================================

CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  publish_time TIMESTAMPTZ,
  language TEXT,
  google_review_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_course_review UNIQUE (course_id, google_review_id)
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON course_reviews(course_id);

-- ============================================================
-- 3. RLS policies for course_reviews
-- ============================================================

ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Reviews are publicly readable"
  ON course_reviews FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages reviews"
  ON course_reviews FOR ALL
  USING (auth.role() = 'service_role');

-- Grant access to anon and authenticated roles
GRANT SELECT ON course_reviews TO anon, authenticated;
