import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import { fetchHole, fetchCourse } from "../api/courses";
import { YardageTable } from "../components/YardageTable";
import { HoleNavigation } from "../components/HoleNavigation";

export function HolePage() {
  const { id, number } = useParams<{ id: string; number: string }>();
  const holeNumber = Number(number);

  const { data: course } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const { data: hole, isLoading, error } = useQuery({
    queryKey: ["hole", id, holeNumber],
    queryFn: () => fetchHole(id!, holeNumber),
    enabled: !!id && !isNaN(holeNumber),
  });

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !hole) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">Hole not found.</Alert>
      </Container>
    );
  }

  const totalHoles = course?.num_holes || 18;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Hole header — large, scannable */}
      <Paper sx={{ p: 3, mb: 3, textAlign: "center" }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Hole {hole.hole_number}
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          Par {hole.par}
        </Typography>
        {hole.handicap_rating && (
          <Typography variant="body2" color="text.secondary">
            Handicap {hole.handicap_rating}
          </Typography>
        )}
      </Paper>

      {/* Yardage table */}
      <YardageTable yardageByTee={hole.yardage_by_tee} />

      {/* Content sections — only show if data exists */}
      {(hole.elevation_description || hole.terrain_description) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Elevation & Terrain
          </Typography>
          {hole.elevation_description && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              {hole.elevation_description}
            </Typography>
          )}
          {hole.terrain_description && (
            <Typography variant="body1">{hole.terrain_description}</Typography>
          )}
        </Box>
      )}

      {hole.strategic_tips && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Strategic Tips
          </Typography>
          <Typography variant="body1">{hole.strategic_tips}</Typography>
        </Box>
      )}

      {(hole.green_slope || hole.green_speed_range || hole.green_details) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Green Complex
          </Typography>
          {hole.green_slope && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              {hole.green_slope}
            </Typography>
          )}
          {hole.green_speed_range && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Speed: {hole.green_speed_range}
            </Typography>
          )}
          {hole.green_details && (
            <Typography variant="body1">{hole.green_details}</Typography>
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <HoleNavigation
        courseId={id!}
        currentHole={holeNumber}
        totalHoles={totalHoles}
      />
    </Container>
  );
}
