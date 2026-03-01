-- Extend constraints for 27/36-hole courses
-- Run this in Supabase SQL Editor

-- Allow hole_number up to 27
ALTER TABLE public.holes DROP CONSTRAINT IF EXISTS holes_hole_number_check;
ALTER TABLE public.holes ADD CONSTRAINT holes_hole_number_check CHECK (hole_number BETWEEN 1 AND 27);

-- Allow 27 and 36 hole courses
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_num_holes_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_num_holes_check CHECK (num_holes IN (9, 18, 27, 36));
