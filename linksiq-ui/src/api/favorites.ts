import { api } from "./client";
import type { FavoriteItem } from "../types/course";

export function fetchFavorites(): Promise<FavoriteItem[]> {
  return api.get("/api/favorites");
}

export function addFavorite(courseId: string): Promise<{ detail: string }> {
  return api.post(`/api/favorites/${courseId}`);
}

export function removeFavorite(courseId: string): Promise<{ detail: string }> {
  return api.delete(`/api/favorites/${courseId}`);
}
