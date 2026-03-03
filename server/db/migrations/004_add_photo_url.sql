-- Add photo_url and google_place_id columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Recreate courses_list view to include photo_url
DROP VIEW IF EXISTS public.courses_list;
CREATE VIEW public.courses_list AS
SELECT
    c.id,
    c.name,
    c.club_name,
    c.city,
    c.state,
    c.course_type,
    c.total_par,
    c.num_holes,
    c.total_yardage,
    c.course_rating,
    c.slope_rating,
    c.photo_url,
    to_tsvector('english', c.name) AS name_search,
    EXISTS (
        SELECT 1 FROM public.holes h
        WHERE h.course_id = c.id
        AND (h.strategic_tips IS NOT NULL OR h.green_details IS NOT NULL)
    ) AS has_detailed_holes
FROM public.courses c;

GRANT SELECT ON public.courses_list TO anon, authenticated;
