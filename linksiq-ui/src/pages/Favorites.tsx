import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { fetchFavorites } from "../api/favorites";
import { CourseCard } from "../components/CourseCard";

export function Favorites() {
  const { user } = useAuth();

  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: fetchFavorites,
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load favorites.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        My Favorites
      </Typography>

      {favorites && favorites.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {favorites.map((fav) => (
            <CourseCard
              key={fav.id}
              course={{
                id: fav.course_id,
                name: fav.course_name,
                club_name: null,
                city: fav.city,
                state: fav.state,
                course_type: fav.course_type,
                total_par: fav.total_par,
                num_holes: fav.num_holes,
                total_yardage: null,
                slope_rating: null,
                course_rating: null,
                google_rating: null,
                photo_url: null,
                has_detailed_holes: false,
              }}
            />
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
          No favorites yet. Browse courses and tap the heart icon to save them
          here.
        </Typography>
      )}
    </Container>
  );
}
