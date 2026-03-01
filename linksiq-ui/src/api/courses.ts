import { api } from "./client";
import type {
  CourseListResponse,
  CourseDetail,
  CourseGuide,
  Hole,
} from "../types/course";

export function fetchCourses(params: {
  state?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<CourseListResponse> {
  const query = new URLSearchParams();
  if (params.state) query.set("state", params.state);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  return api.get(`/api/courses?${query}`);
}

export function fetchCourse(id: string): Promise<CourseDetail> {
  return api.get(`/api/courses/${id}`);
}

export function fetchCourseHoles(id: string): Promise<Hole[]> {
  return api.get(`/api/courses/${id}/holes`);
}

export function fetchHole(courseId: string, holeNumber: number): Promise<Hole> {
  return api.get(`/api/courses/${courseId}/holes/${holeNumber}`);
}

export function fetchCourseGuide(id: string): Promise<CourseGuide> {
  return api.get(`/api/courses/${id}/guide`);
}
