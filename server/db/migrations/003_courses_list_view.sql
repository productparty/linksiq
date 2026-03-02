-- View: courses_list
-- Exposes has_detailed_holes as a computed column for the course list.
-- PostgREST cannot express correlated EXISTS subqueries inline,
-- so we materialise it in a view.

CREATE OR REPLACE VIEW public.courses_list AS
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
    to_tsvector('english', c.name) AS name_search,
    EXISTS (
        SELECT 1 FROM public.holes h
        WHERE h.course_id = c.id
        AND (h.strategic_tips IS NOT NULL OR h.green_details IS NOT NULL)
    ) AS has_detailed_holes
FROM public.courses c;

GRANT SELECT ON public.courses_list TO anon, authenticated;
