import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import * as favoritesApi from "../api/favorites";

interface FavoritesState {
  favoriteIds: Set<string>;
  isLoading: boolean;
  toggleFavorite: (courseId: string) => Promise<void>;
  isFavorite: (courseId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesState | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setIsLoading(true);
    favoritesApi
      .fetchFavorites()
      .then((favs) => setFavoriteIds(new Set(favs.map((f) => f.course_id))))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  const toggleFavorite = useCallback(
    async (courseId: string) => {
      if (!user) return;
      const wasFavorite = favoriteIds.has(courseId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(courseId);
        else next.add(courseId);
        return next;
      });

      try {
        if (wasFavorite) {
          await favoritesApi.removeFavorite(courseId);
        } else {
          await favoritesApi.addFavorite(courseId);
        }
      } catch {
        // Revert on error
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(courseId);
          else next.delete(courseId);
          return next;
        });
      }
    },
    [user, favoriteIds]
  );

  const isFavorite = useCallback(
    (courseId: string) => favoriteIds.has(courseId),
    [favoriteIds]
  );

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isLoading, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
