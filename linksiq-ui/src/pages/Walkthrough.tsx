import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Button,
  Chip,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { fetchCourseGuide } from "../api/courses";
import { YardageTable } from "../components/YardageTable";
import { CourseGuidePdf } from "../components/CourseGuide";

export function Walkthrough() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const showPdf = searchParams.get("pdf") === "1";

  const { data: guide, isLoading, error } = useQuery({
    queryKey: ["courseGuide", id],
    queryFn: () => fetchCourseGuide(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !guide) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Course not found.</Alert>
      </Container>
    );
  }

  // PDF download
  if (showPdf) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Generating PDF for {guide.name}...
        </Typography>
        <CourseGuidePdf guide={guide} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Course header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {guide.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {[guide.city, guide.state].filter(Boolean).join(", ")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1, mb: 2 }}>
          {guide.total_par && <Chip label={`Par ${guide.total_par}`} size="small" />}
          {guide.total_yardage && (
            <Chip label={`${guide.total_yardage.toLocaleString()} yds`} size="small" variant="outlined" />
          )}
          {guide.slope_rating && (
            <Chip label={`Slope ${guide.slope_rating}`} size="small" variant="outlined" />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => window.location.search = "?pdf=1"}
        >
          Download PDF Guide
        </Button>
      </Box>

      {guide.walkthrough_narrative && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1">{guide.walkthrough_narrative}</Typography>
        </Box>
      )}

      <Divider sx={{ mb: 4 }} />

      {/* All holes in sequence */}
      {guide.holes.map((hole) => (
        <Paper key={hole.hole_number} sx={{ p: 3, mb: 3 }} variant="outlined">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              mb: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Hole {hole.hole_number}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip label={`Par ${hole.par}`} size="small" />
              {hole.handicap_rating && (
                <Chip
                  label={`HCP ${hole.handicap_rating}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          <YardageTable yardageByTee={hole.yardage_by_tee} />

          {hole.terrain_description && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Terrain:</strong> {hole.terrain_description}
            </Typography>
          )}
          {hole.strategic_tips && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Strategy:</strong> {hole.strategic_tips}
            </Typography>
          )}
          {hole.green_details && (
            <Typography variant="body2">
              <strong>Green:</strong> {hole.green_details}
            </Typography>
          )}
        </Paper>
      ))}
    </Container>
  );
}
