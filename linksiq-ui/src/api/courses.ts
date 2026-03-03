import { supabase } from "../lib/supabase";
import type {
  CourseListResponse,
  CourseDetail,
  CourseGuide,
  CourseFilterParams,
  Hole,
} from "../types/course";

const COURSE_LIST_COLUMNS =
  "id, name, club_name, city, state, course_type, total_par, num_holes, total_yardage, slope_rating, course_rating, photo_url, has_detailed_holes";

const COURSE_DETAIL_COLUMNS =
  "id, name, club_name, city, state, course_type, total_par, num_holes, total_yardage, slope_rating, course_rating, description, walkthrough_narrative, website_url, phone, latitude, longitude, source";

const HOLE_COLUMNS =
  "id, hole_number, par, handicap_rating, yardage_by_tee, elevation_description, terrain_description, strategic_tips, green_slope, green_speed_range, green_details";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQuery = any;

function applyFilters(query: SupabaseQuery, params: CourseFilterParams): SupabaseQuery {
  if (params.state) query = query.eq("state", params.state);
  if (params.has_intel) query = query.eq("has_detailed_holes", true);
  if (params.holes) query = query.eq("num_holes", params.holes);
  if (params.course_type) query = query.eq("course_type", params.course_type);
  if (params.slope_min != null) query = query.gte("slope_rating", params.slope_min);
  if (params.slope_max != null) query = query.lte("slope_rating", params.slope_max);
  if (params.rating_min != null) query = query.gte("course_rating", params.rating_min);
  if (params.rating_max != null) query = query.lte("course_rating", params.rating_max);
  if (params.yardage_min != null) query = query.gte("total_yardage", params.yardage_min);
  if (params.yardage_max != null) query = query.lte("total_yardage", params.yardage_max);
  return query;
}

function applySort(query: SupabaseQuery, sort: string): SupabaseQuery {
  switch (sort) {
    case "name_desc":
      return query.order("name", { ascending: false });
    case "rating_desc":
      return query.order("course_rating", { ascending: false, nullsFirst: false }).order("name", { ascending: true });
    case "slope_desc":
      return query.order("slope_rating", { ascending: false, nullsFirst: false }).order("name", { ascending: true });
    case "yardage_desc":
      return query.order("total_yardage", { ascending: false, nullsFirst: false }).order("name", { ascending: true });
    case "yardage_asc":
      return query.order("total_yardage", { ascending: true, nullsFirst: false }).order("name", { ascending: true });
    default: // name_asc
      return query.order("name", { ascending: true });
  }
}

export async function fetchCourses(params: CourseFilterParams): Promise<CourseListResponse> {
  const page = params.page ?? 1;
  const perPage = params.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const sort = params.sort ?? "name_asc";

  let query = supabase
    .from("courses_list")
    .select(COURSE_LIST_COLUMNS, { count: "exact" });

  query = applyFilters(query, params);

  // Full-text search with ilike fallback
  if (params.search) {
    const term = params.search.trim();
    const tsQuery = term.replace(/\s+/g, " & ");
    query = query.textSearch("name_search", tsQuery);
  }

  query = applySort(query, sort);
  query = query.range(from, to);

  let { data, count, error } = await query;

  // Fallback: if text search failed (e.g. bad tsquery), retry with ilike
  if (error && params.search) {
    let fb = supabase
      .from("courses_list")
      .select(COURSE_LIST_COLUMNS, { count: "exact" });

    fb = applyFilters(fb, params);
    fb = fb.ilike("name", `%${params.search.trim()}%`);
    fb = applySort(fb, sort);
    fb = fb.range(from, to);

    const result = await fb;
    data = result.data;
    count = result.count;
    error = result.error;
  }

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    courses: data ?? [],
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  };
}

export async function fetchStateCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("courses_list")
    .select("state");

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.state) {
      counts[row.state] = (counts[row.state] || 0) + 1;
    }
  }
  return counts;
}

export async function fetchCourse(id: string): Promise<CourseDetail> {
  const [courseResult, holesResult] = await Promise.all([
    supabase.from("courses").select(COURSE_DETAIL_COLUMNS).eq("id", id).single(),
    supabase
      .from("holes")
      .select("strategic_tips, green_details")
      .eq("course_id", id),
  ]);

  if (courseResult.error) throw new Error(courseResult.error.message);

  const holes = holesResult.data ?? [];
  const holesSummary = {
    total_holes: holes.length,
    has_strategic_tips: holes.filter((h) => h.strategic_tips != null).length,
    has_green_details: holes.filter((h) => h.green_details != null).length,
  };

  return { ...courseResult.data, holes_summary: holesSummary } as CourseDetail;
}

export async function fetchCourseHoles(id: string): Promise<Hole[]> {
  const { data, error } = await supabase
    .from("holes")
    .select(HOLE_COLUMNS)
    .eq("course_id", id)
    .order("hole_number");

  if (error) throw new Error(error.message);
  return data as Hole[];
}

export async function fetchHole(
  courseId: string,
  holeNumber: number
): Promise<Hole> {
  const { data, error } = await supabase
    .from("holes")
    .select(HOLE_COLUMNS)
    .eq("course_id", courseId)
    .eq("hole_number", holeNumber)
    .single();

  if (error) throw new Error(error.message);
  return data as Hole;
}

export async function fetchCourseGuide(id: string): Promise<CourseGuide> {
  const [courseResult, holesResult] = await Promise.all([
    supabase.from("courses").select(COURSE_DETAIL_COLUMNS).eq("id", id).single(),
    supabase
      .from("holes")
      .select(HOLE_COLUMNS)
      .eq("course_id", id)
      .order("hole_number"),
  ]);

  if (courseResult.error) throw new Error(courseResult.error.message);
  if (holesResult.error) throw new Error(holesResult.error.message);

  return {
    ...courseResult.data,
    holes: holesResult.data,
  } as CourseGuide;
}
