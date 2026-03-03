import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "./useDebounce";
import type { CourseFilterParams } from "../types/course";

export interface FilterState {
  search: string;
  state: string;
  holes: number | null;
  course_type: string;
  slope_min: number | null;
  slope_max: number | null;
  rating_min: number | null;
  rating_max: number | null;
  yardage_min: number | null;
  yardage_max: number | null;
  has_intel: boolean;
  sort: string;
  page: number;
}

// Range defaults (used to detect "active" vs "default")
export const SLOPE_RANGE: [number, number] = [93, 150];
export const RATING_RANGE: [number, number] = [55, 77];
export const YARDAGE_RANGE: [number, number] = [2400, 7600];

function parseNum(val: string | null): number | null {
  if (!val) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function useCourseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FilterState = useMemo(() => ({
    search: searchParams.get("search") || "",
    state: searchParams.get("state") || "",
    holes: parseNum(searchParams.get("holes")),
    course_type: searchParams.get("type") || "",
    slope_min: parseNum(searchParams.get("slope_min")),
    slope_max: parseNum(searchParams.get("slope_max")),
    rating_min: parseNum(searchParams.get("rating_min")),
    rating_max: parseNum(searchParams.get("rating_max")),
    yardage_min: parseNum(searchParams.get("yardage_min")),
    yardage_max: parseNum(searchParams.get("yardage_max")),
    has_intel: searchParams.get("intel") === "1",
    sort: searchParams.get("sort") || "name_asc",
    page: Math.max(1, Number(searchParams.get("page")) || 1),
  }), [searchParams]);

  const debouncedSearch = useDebounce(filters.search, 400);

  const setFilters = useCallback(
    (updates: Partial<FilterState>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        // Determine if we should reset page (any filter change except page/sort itself)
        let shouldResetPage = false;

        for (const [key, value] of Object.entries(updates)) {
          if (key === "page") continue;
          if (key !== "sort") shouldResetPage = true;

          const paramKey = key === "course_type" ? "type" : key === "has_intel" ? "intel" : key;

          if (
            value === null ||
            value === "" ||
            value === false ||
            value === undefined
          ) {
            next.delete(paramKey);
          } else if (typeof value === "boolean") {
            next.set(paramKey, value ? "1" : "0");
          } else {
            next.set(paramKey, String(value));
          }
        }

        if ("page" in updates) {
          if (updates.page && updates.page > 1) {
            next.set("page", String(updates.page));
          } else {
            next.delete("page");
          }
        } else if (shouldResetPage) {
          next.delete("page");
        }

        return next;
      });
    },
    [setSearchParams]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.state) count++;
    if (filters.holes) count++;
    if (filters.course_type) count++;
    if (filters.has_intel) count++;
    if (filters.slope_min != null || filters.slope_max != null) count++;
    if (filters.rating_min != null || filters.rating_max != null) count++;
    if (filters.yardage_min != null || filters.yardage_max != null) count++;
    return count;
  }, [filters]);

  const apiParams: CourseFilterParams = useMemo(
    () => ({
      state: filters.state || undefined,
      search: debouncedSearch || undefined,
      has_intel: filters.has_intel || undefined,
      holes: filters.holes ?? undefined,
      course_type: filters.course_type || undefined,
      slope_min: filters.slope_min ?? undefined,
      slope_max: filters.slope_max ?? undefined,
      rating_min: filters.rating_min ?? undefined,
      rating_max: filters.rating_max ?? undefined,
      yardage_min: filters.yardage_min ?? undefined,
      yardage_max: filters.yardage_max ?? undefined,
      sort: filters.sort,
      page: filters.page,
      per_page: 20,
    }),
    [filters, debouncedSearch]
  );

  return { filters, setFilters, clearAllFilters, activeFilterCount, apiParams };
}
