import { useParams, Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Grid,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FlagIcon from "@mui/icons-material/Flag";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { fetchHole, fetchCourse } from "../api/courses";
import { YardageTable } from "../components/YardageTable";
import { HoleNavigation } from "../components/HoleNavigation";

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
    <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box sx={{ color: "primary.light" }}>{icon}</Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {text}
      </Typography>
    </Paper>
  );
}

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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Hole not found.</Alert>
      </Container>
    );
  }

  const totalHoles = course?.num_holes || 18;
  const primaryYardage = hole.yardage_by_tee?.tees?.[0]?.yardage;
  const primaryTeeName = hole.yardage_by_tee?.tees?.[0]?.name;

  // Build intel sections from available data
  const teeText = [hole.elevation_description, hole.terrain_description]
    .filter(Boolean)
    .join(" ");
  const greenText = [hole.green_slope, hole.green_speed_range, hole.green_details]
    .filter(Boolean)
    .join(" ");

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Breadcrumb */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Typography
          component={RouterLink}
          to={`/courses/${id}`}
          variant="body2"
          sx={{ color: "primary.light", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          {course?.name || "Course"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          &rsaquo;
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Hole {hole.hole_number}
        </Typography>
      </Box>

      {/* Hole header + nav row */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          {/* Handicap badge */}
          {hole.handicap_rating && (
            <Chip
              label={`#${hole.handicap_rating} HANDICAP`}
              size="small"
              sx={{
                bgcolor: "error.main",
                color: "white",
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 24,
                mb: 1.5,
              }}
            />
          )}

          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            Hole {hole.hole_number}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Par {hole.par}
            {primaryYardage
              ? ` | ${primaryYardage} Yards${primaryTeeName ? ` (${primaryTeeName})` : ""}`
              : ""}
          </Typography>
        </Box>
      </Box>

      {/* Tee yardages */}
      <YardageTable yardageByTee={hole.yardage_by_tee} />

      {/* Intel Card Grid */}
      {(teeText || greenText) && (
        <Grid container spacing={2} sx={{ my: 3 }}>
          {teeText && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <IntelCard
                icon={<WarningAmberIcon />}
                title="Terrain & Hazards"
                text={teeText}
              />
            </Grid>
          )}
          {greenText && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <IntelCard
                icon={<FlagIcon />}
                title="The Green"
                text={greenText}
              />
            </Grid>
          )}
        </Grid>
      )}

      {/* Local Tip callout */}
      {hole.strategic_tips && (
        <Paper
          sx={{
            p: 2.5,
            my: 3,
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
              <Typography variant="body2" sx={{ fontStyle: "italic", lineHeight: 1.7 }}>
                {hole.strategic_tips}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <HoleNavigation
        courseId={id!}
        currentHole={holeNumber}
        totalHoles={totalHoles}
      />
    </Container>
  );
}
