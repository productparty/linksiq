-- LinksIQ Initial Schema
-- Run this in Supabase SQL Editor

-- 1. Courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    club_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    course_type TEXT CHECK (course_type IN ('public', 'private', 'municipal', 'resort', 'military')),
    total_par INTEGER,
    total_yardage INTEGER,
    num_holes INTEGER DEFAULT 18 CHECK (num_holes IN (9, 18)),
    slope_rating NUMERIC,
    course_rating NUMERIC,
    description TEXT,
    walkthrough_narrative TEXT,
    website_url TEXT,
    phone TEXT,
    source TEXT DEFAULT 'api_import' CHECK (source IN ('api_import', 'manual', 'community')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courses_state_idx ON public.courses (state);
CREATE INDEX IF NOT EXISTS courses_name_search_idx ON public.courses USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS courses_external_id_idx ON public.courses (external_id);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Courses are editable by service role only" ON public.courses FOR ALL USING (auth.role() = 'service_role');

-- 2. Holes table
CREATE TABLE IF NOT EXISTS public.holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    par INTEGER CHECK (par BETWEEN 3 AND 6),
    yardage_by_tee JSONB DEFAULT '{}',
    handicap_rating INTEGER CHECK (handicap_rating BETWEEN 1 AND 18),
    elevation_description TEXT,
    terrain_description TEXT,
    strategic_tips TEXT,
    green_slope TEXT,
    green_speed_range TEXT,
    green_details TEXT,
    source TEXT DEFAULT 'api_import' CHECK (source IN ('api_import', 'manual', 'community')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, hole_number)
);

CREATE INDEX IF NOT EXISTS holes_course_idx ON public.holes (course_id);

ALTER TABLE public.holes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holes are viewable by everyone" ON public.holes FOR SELECT USING (true);
CREATE POLICY "Holes are editable by service role only" ON public.holes FOR ALL USING (auth.role() = 'service_role');

-- 3. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles are editable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles are insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. User favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, course_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = profile_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER holes_updated_at
    BEFORE UPDATE ON public.holes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
