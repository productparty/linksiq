import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Button,
  Divider,
  Paper,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { fetchCourse, fetchCourseHoles } from "../api/courses";
import { FavoriteButton } from "../components/FavoriteButton";
import type { Hole } from "../types/course";

function holeHasIntel(hole: Hole): boolean {
  return !!(
    hole.elevation_description ||
    hole.terrain_description ||
    hole.strategic_tips ||
    hole.green_slope ||
    hole.green_speed_range ||
    hole.green_details
  );
}

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const { data: holes } = useQuery({
    queryKey: ["courseHoles", id],
    queryFn: () => fetchCourseHoles(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Course not found.</Alert>
      </Container>
    );
  }

  const courseType = course.course_type?.toLowerCase();
  const isPublic = courseType === "public";
  const isPrivate = courseType === "private";

  // Find a notable hole for Pro Tip
  const proTipHole = holes?.find(
    (h) => h.strategic_tips && holeHasIntel(h),
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 1,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {course.name}
            </Typography>
            <FavoriteButton courseId={course.id} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body1" color="text.secondary">
              {[course.city, course.state].filter(Boolean).join(", ")}
            </Typography>
            {(isPublic || isPrivate) && (
              <Chip
                label={isPublic ? "PUBLIC" : "PRIVATE"}
                size="small"
                sx={{
                  bgcolor: isPublic ? "primary.main" : "grey.700",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.6rem",
                  height: 22,
                  letterSpacing: 0.5,
                }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => navigate(`/courses/${id}/walkthrough?pdf=1`)}
          >
            Download PDF Guide
          </Button>
          {holes && holes.length > 0 && (
            <Button
              variant="contained"
              startIcon={<MapIcon />}
              onClick={() => navigate(`/courses/${id}/walkthrough`)}
            >
              Walk the Course
            </Button>
          )}
        </Box>
      </Box>

      {/* Stat boxes */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", my: 3 }}>
        {course.total_par && (
          <Paper
            variant="outlined"
            sx={{ px: 3, py: 1.5, textAlign: "center", minWidth: 90 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "text.secondary",
                fontSize: "0.65rem",
              }}
            >
              Par
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {course.total_par}
            </Typography>
          </Paper>
        )}
        {course.num_holes && (
          <Paper
            variant="outlined"
            sx={{ px: 3, py: 1.5, textAlign: "center", minWidth: 90 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "text.secondary",
                fontSize: "0.65rem",
              }}
            >
              Holes
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {course.num_holes}
            </Typography>
          </Paper>
        )}
        {course.total_yardage && (
          <Paper
            variant="outlined"
            sx={{ px: 3, py: 1.5, textAlign: "center", minWidth: 90 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "text.secondary",
                fontSize: "0.65rem",
              }}
            >
              Yardage
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {course.total_yardage.toLocaleString()}y
            </Typography>
          </Paper>
        )}
        {course.slope_rating && (
          <Paper
            variant="outlined"
            sx={{ px: 3, py: 1.5, textAlign: "center", minWidth: 90 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "text.secondary",
                fontSize: "0.65rem",
              }}
            >
              Slope
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {course.slope_rating}
            </Typography>
          </Paper>
        )}
        {course.course_rating && (
          <Paper
            variant="outlined"
            sx={{ px: 3, py: 1.5, textAlign: "center", minWidth: 90 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "text.secondary",
                fontSize: "0.65rem",
              }}
            >
              Rating
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {course.course_rating}
            </Typography>
          </Paper>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Two-column: Course Character + Hole Quick Reference */}
      <Grid container spacing={4}>
        {/* Left column — Course Character */}
        <Grid size={{ xs: 12, md: 6 }}>
          {(course.description || course.walkthrough_narrative) && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Course Character
              </Typography>
              {course.description && (
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontStyle: "italic", lineHeight: 1.8 }}
                  >
                    {course.description}
                  </Typography>
                </Paper>
              )}
              {course.walkthrough_narrative &&
                course.walkthrough_narrative
                  .split(/\n\n|\n/)
                  .filter((p: string) => p.trim())
                  .map((p: string, i: number) => (
                    <Typography
                      key={i}
                      variant="body1"
                      sx={{ mb: 2, lineHeight: 1.8 }}
                    >
                      {p.trim()}
                    </Typography>
                  ))}
            </Box>
          )}

          {/* Contact info */}
          {(course.website_url || course.phone) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              {course.website_url && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <LanguageIcon fontSize="small" color="action" />
                  <Typography
                    component="a"
                    href={course.website_url}
                    target="_blank"
                    rel="noopener"
                    variant="body2"
                  >
                    {course.website_url}
                  </Typography>
                </Box>
              )}
              {course.phone && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{course.phone}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Grid>

        {/* Right column — Hole Quick Reference */}
        {holes && holes.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Hole Quick Reference
            </Typography>
            <Grid container spacing={1}>
              {holes.map((hole) => {
                const intel = holeHasIntel(hole);
                const primaryYardage =
                  hole.yardage_by_tee?.tees?.[0]?.yardage;
                return (
                  <Grid
                    key={hole.hole_number}
                    size={{ xs: 4, sm: 4, md: 4 }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        borderColor: intel
                          ? "secondary.main"
                          : "divider",
                        borderWidth: intel ? 2 : 1,
                      }}
                    >
                      <CardActionArea
                        component={RouterLink}
                        to={`/courses/${id}/holes/${hole.hole_number}`}
                      >
                        <CardContent
                          sx={{
                            textAlign: "center",
                            py: 1.5,
                            px: 1,
                            position: "relative",
                          }}
                        >
                          {intel && (
                            <Chip
                              label="INTEL"
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: "secondary.main",
                                color: "secondary.contrastText",
                                fontWeight: 700,
                                fontSize: "0.5rem",
                                height: 16,
                                "& .MuiChip-label": { px: 0.75 },
                              }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            #{hole.hole_number}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700 }}
                          >
                            P{hole.par}
                            {primaryYardage
                              ? ` | ${primaryYardage}y`
                              : ""}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Pro Tip callout */}
            {proTipHole && (
              <Paper
                sx={{
                  p: 2.5,
                  mt: 2,
                  bgcolor: "rgba(212, 168, 67, 0.1)",
                  border: "1px solid rgba(212, 168, 67, 0.3)",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "secondary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <LightbulbIcon
                      sx={{ color: "white", fontSize: 18 }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: "secondary.dark",
                        mb: 0.5,
                      }}
                    >
                      Pro Tip — Hole {proTipHole.hole_number}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: "italic" }}
                    >
                      {proTipHole.strategic_tips}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
