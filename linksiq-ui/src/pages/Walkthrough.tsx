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
  Grid,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FlagIcon from "@mui/icons-material/Flag";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { fetchCourseGuide } from "../api/courses";
import { YardageTable } from "../components/YardageTable";
import { CourseGuidePdf } from "../components/CourseGuide";
import type { Hole } from "../types/course";

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

function IntelCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box sx={{ color: "primary.light" }}>{icon}</Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Paper>
  );
}

function LocalTipCallout({ text }: { text: string }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        mt: 2,
        bgcolor: "rgba(212, 168, 67, 0.1)",
        border: "1px solid rgba(212, 168, 67, 0.3)",
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "secondary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LightbulbIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "secondary.dark", mb: 0.5 }}
          >
            Local Tip
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
            {text}
          </Typography>
        </Box>
      </Box>
    </Paper>
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
      {/* Header */}
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="overline"
          sx={{ color: "primary.light", letterSpacing: 2, fontWeight: 700 }}
        >
          Full Course Scouting Report
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {guide.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {[guide.city, guide.state].filter(Boolean).join(", ")}
        </Typography>
      </Box>

      {/* Stat boxes */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", my: 3 }}>
        {guide.total_par && (
          <Paper variant="outlined" sx={{ px: 3, py: 1.5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontSize: "0.65rem" }}>Par</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{guide.total_par}</Typography>
          </Paper>
        )}
        {guide.num_holes && (
          <Paper variant="outlined" sx={{ px: 3, py: 1.5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontSize: "0.65rem" }}>Holes</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{guide.num_holes}</Typography>
          </Paper>
        )}
        {guide.total_yardage && (
          <Paper variant="outlined" sx={{ px: 3, py: 1.5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontSize: "0.65rem" }}>Yardage</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{guide.total_yardage.toLocaleString()}y</Typography>
          </Paper>
        )}
        {guide.slope_rating && (
          <Paper variant="outlined" sx={{ px: 3, py: 1.5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontSize: "0.65rem" }}>Slope</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{guide.slope_rating}</Typography>
          </Paper>
        )}
        {guide.course_rating && (
          <Paper variant="outlined" sx={{ px: 3, py: 1.5, textAlign: "center" }}>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontSize: "0.65rem" }}>Rating</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{guide.course_rating}</Typography>
          </Paper>
        )}
      </Box>

      <Button
        variant="outlined"
        startIcon={<PictureAsPdfIcon />}
        onClick={() => (window.location.search = "?pdf=1")}
        sx={{ mb: 3 }}
      >
        Download PDF Guide
      </Button>

      {/* Course Character / Strategic Overview */}
      {(guide.description || guide.walkthrough_narrative) && (
        <>
          <Divider sx={{ my: 3 }} />
          {guide.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Course Character
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {guide.description}
              </Typography>
            </Box>
          )}
          {guide.walkthrough_narrative && (
            <Box sx={{ mb: 3 }}>
              {!guide.description && (
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                  Course Character
                </Typography>
              )}
              {guide.walkthrough_narrative
                .split(/\n\n|\n/)
                .filter((p) => p.trim())
                .map((p, i) => (
                  <Typography key={i} variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                    {p.trim()}
                  </Typography>
                ))}
            </Box>
          )}
        </>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Hole-by-hole */}
      {guide.holes.map((hole) => {
        const intel = hasIntel(hole);
        const teeText = (hole: Hole) => {
          const parts = [];
          if (hole.elevation_description) parts.push(hole.elevation_description);
          if (hole.terrain_description) parts.push(hole.terrain_description);
          return parts.join(" ");
        };
        const greenText = (hole: Hole) => {
          const parts = [hole.green_slope, hole.green_speed_range, hole.green_details].filter(Boolean);
          return parts.join(" ");
        };

        return (
          <Box key={hole.hole_number} sx={{ mb: 5 }}>
            {/* Hole header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: intel ? "primary.main" : "grey.200",
                  color: intel ? "white" : "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  flexShrink: 0,
                }}
              >
                {hole.hole_number}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Par {hole.par}
                  </Typography>
                  {hole.handicap_rating && (
                    <Chip
                      label={`Handicap ${hole.handicap_rating}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  )}
                  {intel && (
                    <Chip
                      label="INTEL"
                      size="small"
                      sx={{
                        bgcolor: "secondary.main",
                        color: "secondary.contrastText",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 20,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Tee yardages */}
            <YardageTable yardageByTee={hole.yardage_by_tee} />

            {/* Intel grid — terrain + green cards */}
            {(teeText(hole) || greenText(hole)) && (
              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                {teeText(hole) && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <IntelCard
                      icon={<WarningAmberIcon fontSize="small" />}
                      title="Terrain & Hazards"
                      text={teeText(hole)}
                    />
                  </Grid>
                )}
                {greenText(hole) && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <IntelCard
                      icon={<FlagIcon fontSize="small" />}
                      title="The Green"
                      text={greenText(hole)}
                    />
                  </Grid>
                )}
              </Grid>
            )}

            {/* Local Tip — strategic advice in signature callout */}
            {hole.strategic_tips && (
              <LocalTipCallout text={hole.strategic_tips} />
            )}

            <Divider sx={{ mt: 3 }} />
          </Box>
        );
      })}
    </Container>
  );
}
