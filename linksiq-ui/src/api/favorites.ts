import { supabase } from "../lib/supabase";
import type { FavoriteItem } from "../types/course";

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_favorites")
    .select("id, course_id, created_at, courses(name, city, state, course_type, total_par, num_holes)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Transform the nested join response into flat FavoriteItem objects
  return (data ?? []).map((row: Record<string, unknown>) => {
    const course = row.courses as Record<string, unknown> | null;
    return {
      id: row.id as string,
      course_id: row.course_id as string,
      course_name: (course?.name as string) ?? "",
      city: (course?.city as string) ?? null,
      state: (course?.state as string) ?? null,
      course_type: (course?.course_type as string) ?? null,
      total_par: (course?.total_par as number) ?? null,
      num_holes: (course?.num_holes as number) ?? null,
      created_at: row.created_at as string,
    } satisfies FavoriteItem;
  });
}

export async function addFavorite(courseId: string): Promise<{ detail: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_favorites")
    .insert({ profile_id: user.id, course_id: courseId });

  if (error) {
    // 23505 = unique_violation — favorite already exists, treat as success
    if (error.code === "23505") {
      return { detail: "Already a favorite" };
    }
    throw new Error(error.message);
  }

  return { detail: "Favorite added" };
}

export async function removeFavorite(courseId: string): Promise<{ detail: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("profile_id", user.id)
    .eq("course_id", courseId);

  if (error) throw new Error(error.message);
  return { detail: "Favorite removed" };
}
