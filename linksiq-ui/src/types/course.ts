export interface TeeYardage {
  name: string;
  color?: string | null;
  yardage?: number | null;
  course_rating_men?: number | null;
  slope_men?: number | null;
  course_rating_women?: number | null;
  slope_women?: number | null;
}

export interface YardageByTee {
  tees: TeeYardage[];
}

export interface Hole {
  id: string;
  hole_number: number;
  par: number | null;
  handicap_rating: number | null;
  yardage_by_tee: YardageByTee | null;
  elevation_description: string | null;
  terrain_description: string | null;
  strategic_tips: string | null;
  green_slope: string | null;
  green_speed_range: string | null;
  green_details: string | null;
}

export interface HolesSummary {
  total_holes: number;
  has_strategic_tips: number;
  has_green_details: number;
}

export interface CourseListItem {
  id: string;
  name: string;
  club_name: string | null;
  city: string | null;
  state: string | null;
  course_type: string | null;
  total_par: number | null;
  num_holes: number | null;
  total_yardage: number | null;
  slope_rating: number | null;
  course_rating: number | null;
  photo_url: string | null;
  has_detailed_holes: boolean;
}

export interface CourseFilterParams {
  state?: string;
  search?: string;
  has_intel?: boolean;
  holes?: number;
  course_type?: string;
  slope_min?: number;
  slope_max?: number;
  rating_min?: number;
  rating_max?: number;
  yardage_min?: number;
  yardage_max?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

export interface CourseDetail {
  id: string;
  name: string;
  club_name: string | null;
  city: string | null;
  state: string | null;
  course_type: string | null;
  total_par: number | null;
  num_holes: number | null;
  total_yardage: number | null;
  slope_rating: number | null;
  course_rating: number | null;
  description: string | null;
  walkthrough_narrative: string | null;
  website_url: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string | null;
  holes_summary: HolesSummary;
}

export interface CourseGuide {
  id: string;
  name: string;
  club_name: string | null;
  city: string | null;
  state: string | null;
  course_type: string | null;
  total_par: number | null;
  num_holes: number | null;
  total_yardage: number | null;
  slope_rating: number | null;
  course_rating: number | null;
  description: string | null;
  walkthrough_narrative: string | null;
  website_url: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  holes: Hole[];
}

export interface CourseListResponse {
  courses: CourseListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FavoriteItem {
  id: string;
  course_id: string;
  course_name: string;
  city: string | null;
  state: string | null;
  course_type: string | null;
  total_par: number | null;
  num_holes: number | null;
  created_at: string;
}
