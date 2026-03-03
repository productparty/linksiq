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
  Button,
} from "@mui/material";
import GolfCourseIcon from "@mui/icons-material/GolfCourse";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FlagIcon from "@mui/icons-material/Flag";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { fetchHole, fetchCourse } from "../api/courses";
import { HoleNavigation } from "../components/HoleNavigation";
import { CourseLocationMap } from "../components/maps";

const TEE_COLORS: Record<string, string> = {
  black: "#1a1a1a",
  blue: "#2563eb",
  white: "#e2e8f0",
  red: "#dc2626",
  gold: "#d4a843",
  green: "#16a34a",
  silver: "#94a3b8",
};

function getTeeColor(name: string, color?: string | null): string {
  if (color && TEE_COLORS[color.toLowerCase()])
    return TEE_COLORS[color.toLowerCase()];
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(TEE_COLORS)) {
    if (lower.includes(key)) return val;
  }
  return "#94a3b8";
}

function IntelCard({
  icon,
  iconBg,
  iconColor,
  title,
  text,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  text: string;
}) {
  return (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            bgcolor: iconBg,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1.15rem" }}
        >
          {title}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.7 }}
      >
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

  const {
    data: hole,
    isLoading,
    error,
  } = useQuery({
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
  const tees = hole.yardage_by_tee?.tees || [];

  const offTheTeeText = hole.elevation_description || "";
  const terrainText = hole.terrain_description || "";
  const greenText = [
    hole.green_slope,
    hole.green_speed_range,
    hole.green_details,
  ]
    .filter(Boolean)
    .join(" ");

  const hasMap =
    course?.latitude != null && course?.longitude != null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb left + prev/next right */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            component={RouterLink}
            to={`/courses/${id}`}
            variant="body2"
            sx={{
              color: "text.secondary",
              textDecoration: "none",
              fontWeight: 500,
              "&:hover": { color: "primary.main" },
            }}
          >
            {course?.name || "Course"}
          </Typography>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ fontSize: "0.7rem" }}
          >
            ›
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Hole {hole.hole_number}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            disabled={holeNumber <= 1}
            component={RouterLink}
            to={`/courses/${id}/holes/${holeNumber - 1}`}
            sx={{
              fontWeight: 700,
              borderColor: "divider",
              color: "text.primary",
            }}
          >
            Hole {holeNumber - 1}
          </Button>
          <Button
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            disabled={holeNumber >= totalHoles}
            component={RouterLink}
            to={`/courses/${id}/holes/${holeNumber + 1}`}
            sx={{
              fontWeight: 700,
              borderColor: "divider",
              color: "text.primary",
            }}
          >
            Hole {holeNumber + 1}
          </Button>
        </Box>
      </Box>

      {/* Hero Section: 3-column grid (2 left info + 1 right map) */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, lg: hasMap ? 8 : 12 }}>
          {/* Handicap badge */}
          {hole.handicap_rating && (
            <Chip
              label={`#${hole.handicap_rating} HANDICAP`}
              size="small"
              icon={<PriorityHighIcon sx={{ fontSize: 14 }} />}
              sx={{
                bgcolor: "error.light",
                color: "error.dark",
                fontWeight: 700,
                fontSize: "0.6rem",
                height: 26,
                letterSpacing: 1,
                textTransform: "uppercase",
                mb: 2,
                "& .MuiChip-icon": { color: "error.dark" },
              }}
            />
          )}

          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2rem", md: "2.75rem" },
            }}
          >
            Hole {hole.hole_number}
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "text.secondary", mt: 1, fontWeight: 500 }}
          >
            Par {hole.par}
            {primaryYardage
              ? ` | ${primaryYardage} Yards${primaryTeeName ? ` (${primaryTeeName})` : ""}`
              : ""}
          </Typography>

          {/* Tee yardage cards with colored dots */}
          {tees.length > 0 && (
            <Grid container spacing={2} sx={{ mt: 3 }}>
              {tees.map((tee) => {
                const dotColor = getTeeColor(tee.name, tee.color);
                const isWhiteTee =
                  tee.name.toLowerCase().includes("white") ||
                  tee.color?.toLowerCase() === "white";
                return (
                  <Grid key={tee.name} size={{ xs: 6, sm: 3 }}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: dotColor,
                            ...(isWhiteTee && {
                              border: "1px solid",
                              borderColor: "grey.400",
                            }),
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "text.secondary",
                          }}
                        >
                          {tee.name}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "1.5rem",
                          fontWeight: 900,
                          color: "primary.main",
                        }}
                      >
                        {tee.yardage ? `${tee.yardage}y` : "—"}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>

        {/* Right column — satellite map */}
        {hasMap && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "4px solid white",
                boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              }}
            >
              <CourseLocationMap
                latitude={course!.latitude!}
                longitude={course!.longitude!}
                courseName={course!.name}
                city={course!.city}
                state={course!.state}
              />
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Intel Card Grid — 2×2 */}
      {(offTheTeeText || terrainText || greenText) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {offTheTeeText && (
            <Grid size={{ xs: 12, md: 6 }}>
              <IntelCard
                icon={<GolfCourseIcon />}
                iconBg="rgba(26, 66, 49, 0.1)"
                iconColor="#1a4231"
                title="Off the Tee"
                text={offTheTeeText}
              />
            </Grid>
          )}
          {terrainText && (
            <Grid size={{ xs: 12, md: 6 }}>
              <IntelCard
                icon={<WarningAmberIcon />}
                iconBg="rgba(245, 158, 11, 0.15)"
                iconColor="#b45309"
                title="Terrain & Hazards"
                text={terrainText}
              />
            </Grid>
          )}
          {greenText && (
            <Grid size={{ xs: 12, md: 6 }}>
              <IntelCard
                icon={<FlagIcon />}
                iconBg="rgba(16, 185, 129, 0.15)"
                iconColor="#047857"
                title="The Green"
                text={greenText}
              />
            </Grid>
          )}
        </Grid>
      )}

      {/* Local Tip callout — enlarged with decorative bg */}
      {hole.strategic_tips && (
        <Paper
          sx={{
            p: 3,
            my: 4,
            bgcolor: "rgba(212, 168, 67, 0.08)",
            border: "2px solid rgba(212, 168, 67, 0.25)",
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative background lightbulb */}
          <LightbulbIcon
            sx={{
              position: "absolute",
              right: -16,
              top: -16,
              fontSize: 120,
              color: "rgba(212, 168, 67, 0.08)",
            }}
          />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(212, 168, 67, 0.4)",
              }}
            >
              <LightbulbIcon
                sx={{ color: "primary.main", fontSize: 28 }}
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: "secondary.dark",
                  mb: 0.5,
                }}
              >
                Local Tip
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  lineHeight: 1.7,
                  color: "rgba(120, 80, 20, 0.8)",
                  maxWidth: 700,
                }}
              >
                "{hole.strategic_tips}"
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
