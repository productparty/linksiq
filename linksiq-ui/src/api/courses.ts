import { supabase } from "../lib/supabase";
import type {
  CourseListResponse,
  CourseDetail,
  CourseGuide,
  Hole,
} from "../types/course";

const COURSE_LIST_COLUMNS =
  "id, name, club_name, city, state, course_type, total_par, num_holes, total_yardage, has_detailed_holes";

const COURSE_DETAIL_COLUMNS =
  "id, name, club_name, city, state, course_type, total_par, num_holes, total_yardage, slope_rating, course_rating, description, walkthrough_narrative, website_url, phone, latitude, longitude, source";

const HOLE_COLUMNS =
  "id, hole_number, par, handicap_rating, yardage_by_tee, elevation_description, terrain_description, strategic_tips, green_slope, green_speed_range, green_details";

export async function fetchCourses(params: {
  state?: string;
  search?: string;
  has_intel?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}): Promise<CourseListResponse> {
  const page = params.page ?? 1;
  const perPage = params.per_page ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("courses_list")
    .select(COURSE_LIST_COLUMNS, { count: "exact" });

  // Filters
  if (params.state) {
    query = query.eq("state", params.state);
  }

  if (params.has_intel) {
    query = query.eq("has_detailed_holes", true);
  }

  // Full-text search with ilike fallback
  if (params.search) {
    const term = params.search.trim();
    // Try full-text search first; fall back to ilike if it fails
    const tsQuery = term.replace(/\s+/g, " & ");
    query = query.textSearch("name_search", tsQuery);
  }

  // Sorting
  const sort = params.sort ?? "name_asc";
  switch (sort) {
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    case "state_asc":
      query = query.order("state", { ascending: true }).order("name", { ascending: true });
      break;
    case "state_desc":
      query = query.order("state", { ascending: false }).order("name", { ascending: true });
      break;
    default: // name_asc
      query = query.order("name", { ascending: true });
  }

  query = query.range(from, to);

  let { data, count, error } = await query;

  // Fallback: if text search failed (e.g. bad tsquery), retry with ilike
  if (error && params.search) {
    const fallback = supabase
      .from("courses_list")
      .select(COURSE_LIST_COLUMNS, { count: "exact" });

    let fb = fallback.ilike("name", `%${params.search.trim()}%`);
    if (params.state) fb = fb.eq("state", params.state);
    if (params.has_intel) fb = fb.eq("has_detailed_holes", true);

    switch (sort) {
      case "name_desc":
        fb = fb.order("name", { ascending: false });
        break;
      case "state_asc":
        fb = fb.order("state", { ascending: true }).order("name", { ascending: true });
        break;
      case "state_desc":
        fb = fb.order("state", { ascending: false }).order("name", { ascending: true });
        break;
      default:
        fb = fb.order("name", { ascending: true });
    }

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
