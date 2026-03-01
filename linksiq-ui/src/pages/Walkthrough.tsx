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
import TerrainIcon from "@mui/icons-material/Terrain";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SportsGolfIcon from "@mui/icons-material/SportsGolf";
import LandscapeIcon from "@mui/icons-material/Landscape";
import { fetchCourseGuide } from "../api/courses";
import { YardageTable } from "../components/YardageTable";
import { CourseGuidePdf } from "../components/CourseGuide";
import type { Hole } from "../types/course";

function NarrativeText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n|\n/).filter((p) => p.trim());
  return (
    <>
      {paragraphs.map((p, i) => (
        <Typography key={i} variant="body1" sx={{ mb: 2 }}>
          {p.trim()}
        </Typography>
      ))}
    </>
  );
}

function HoleIntelSection({
  icon,
  label,
  text,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: 1.5,
        borderRadius: 1,
        bgcolor: color,
        mb: 1,
      }}
    >
      <Box sx={{ color: "text.secondary", mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.25 }}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
}

function hasIntel(hole: Hole): boolean {
  return !!(
    hole.elevation_description ||
    hole.terrain_description ||
    hole.strategic_tips ||
    hole.green_slope ||
    hole.green_speed_range ||
    hole.green_details
  );
}

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

  const greenInfo = (hole: Hole) => {
    const parts = [hole.green_slope, hole.green_speed_range, hole.green_details].filter(Boolean);
    return parts.join(" ");
  };

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
          {guide.course_rating && (
            <Chip label={`Rating ${guide.course_rating}`} size="small" variant="outlined" />
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

      {/* Course narrative — description first, then walkthrough */}
      {guide.description && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}>
          <Typography variant="body1" sx={{ fontStyle: "italic", lineHeight: 1.8 }}>
            {guide.description}
          </Typography>
        </Paper>
      )}

      {guide.walkthrough_narrative && (
        <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Course Intelligence
          </Typography>
          <NarrativeText text={guide.walkthrough_narrative} />
        </Paper>
      )}

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Hole-by-Hole Guide
      </Typography>

      {/* All holes in sequence */}
      {guide.holes.map((hole) => {
        const intel = hasIntel(hole);
        return (
          <Paper
            key={hole.hole_number}
            sx={{
              p: 3,
              mb: 3,
              borderLeft: intel ? "4px solid" : undefined,
              borderLeftColor: intel ? "secondary.main" : undefined,
            }}
            variant="outlined"
          >
            {/* Hole header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {hole.hole_number}
                </Typography>
                <Chip label={`Par ${hole.par}`} size="small" />
                {hole.handicap_rating && (
                  <Chip
                    label={`HCP ${hole.handicap_rating}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              {intel && (
                <Chip
                  label="Intel"
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                />
              )}
            </Box>

            <YardageTable yardageByTee={hole.yardage_by_tee} />

            {/* Intel sections */}
            {intel && (
              <Box sx={{ mt: 2 }}>
                {hole.elevation_description && (
                  <HoleIntelSection
                    icon={<LandscapeIcon fontSize="small" />}
                    label="Elevation"
                    text={hole.elevation_description}
                    color="rgba(45, 138, 110, 0.06)"
                  />
                )}
                {hole.terrain_description && (
                  <HoleIntelSection
                    icon={<TerrainIcon fontSize="small" />}
                    label="Terrain & Hazards"
                    text={hole.terrain_description}
                    color="rgba(26, 35, 50, 0.04)"
                  />
                )}
                {hole.strategic_tips && (
                  <HoleIntelSection
                    icon={<LightbulbIcon fontSize="small" />}
                    label="Strategy"
                    text={hole.strategic_tips}
                    color="rgba(249, 168, 37, 0.08)"
                  />
                )}
                {greenInfo(hole) && (
                  <HoleIntelSection
                    icon={<SportsGolfIcon fontSize="small" />}
                    label="Green"
                    text={greenInfo(hole)}
                    color="rgba(45, 138, 110, 0.06)"
                  />
                )}
              </Box>
            )}
          </Paper>
        );
      })}
    </Container>
  );
}
