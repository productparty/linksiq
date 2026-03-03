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
  Paper,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GridViewIcon from "@mui/icons-material/GridView";
import { fetchCourse, fetchCourseHoles } from "../api/courses";
import { FavoriteButton } from "../components/FavoriteButton";
import { CourseLocationMap } from "../components/maps";
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

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
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

  const proTipHole = holes?.find(
    (h) => h.strategic_tips && holeHasIntel(h),
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Info Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          alignItems: { lg: "flex-start" },
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {course.name}
            </Typography>
            <FavoriteButton courseId={course.id} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body1"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                fontSize: "1.05rem",
              }}
            >
              <LocationOnIcon sx={{ fontSize: 18 }} />
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
                  fontSize: "0.55rem",
                  height: 24,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => navigate(`/courses/${id}/walkthrough?pdf=1`)}
            sx={{ height: 48, fontWeight: 700 }}
          >
            Download PDF Guide
          </Button>
          {holes && holes.length > 0 && (
            <Button
              variant="contained"
              startIcon={<MapIcon />}
              onClick={() => navigate(`/courses/${id}/walkthrough`)}
              sx={{
                height: 48,
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(26,66,49,0.3)",
              }}
            >
              Walk the Course
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Bar — white bordered cards */}
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {course.total_par && (
          <Grid size={{ xs: 6, md: "grow" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Par
              </Typography>
              <Typography
                sx={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "primary.main",
                }}
              >
                {course.total_par}
              </Typography>
            </Paper>
          </Grid>
        )}
        {course.num_holes && (
          <Grid size={{ xs: 6, md: "grow" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Holes
              </Typography>
              <Typography
                sx={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "primary.main",
                }}
              >
                {course.num_holes}
              </Typography>
            </Paper>
          </Grid>
        )}
        {course.total_yardage && (
          <Grid size={{ xs: 6, md: "grow" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Yardage
              </Typography>
              <Typography
                sx={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "primary.main",
                }}
              >
                {course.total_yardage.toLocaleString()}
                <Typography
                  component="span"
                  sx={{ fontSize: "1rem", fontWeight: 400, ml: 0.5 }}
                >
                  y
                </Typography>
              </Typography>
            </Paper>
          </Grid>
        )}
        {course.slope_rating && (
          <Grid size={{ xs: 6, md: "grow" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Slope
              </Typography>
              <Typography
                sx={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "primary.main",
                }}
              >
                {course.slope_rating}
              </Typography>
            </Paper>
          </Grid>
        )}
        {course.course_rating && (
          <Grid size={{ xs: 6, md: "grow" }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Rating
              </Typography>
              <Typography
                sx={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "primary.main",
                }}
              >
                {course.course_rating}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* 3-column layout: 2 cols Course Character, 1 col Hole Quick Ref */}
      <Grid container spacing={5}>
        {/* Left — Course Character (2/3) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {(course.description || course.walkthrough_narrative) && (
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  borderLeft: "4px solid",
                  borderColor: "secondary.main",
                  pl: 2,
                }}
              >
                Course Character
              </Typography>
              {course.description && (
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1.15rem",
                    lineHeight: 1.8,
                    fontWeight: 300,
                    mb: 2,
                  }}
                >
                  {course.description}
                </Typography>
              )}
              {course.walkthrough_narrative &&
                course.walkthrough_narrative
                  .split(/\n\n|\n/)
                  .filter((p: string) => p.trim())
                  .map((p: string, i: number) => (
                    <Typography
                      key={i}
                      variant="body1"
                      sx={{
                        fontSize: "1.15rem",
                        lineHeight: 1.8,
                        fontWeight: 300,
                        mb: 2,
                      }}
                    >
                      {p.trim()}
                    </Typography>
                  ))}
            </Box>
          )}

          {/* Map */}
          {course.latitude != null && course.longitude != null && (
            <Box
              sx={{
                mt: 4,
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CourseLocationMap
                latitude={course.latitude}
                longitude={course.longitude}
                courseName={course.name}
                city={course.city}
                state={course.state}
              />
            </Box>
          )}

          {/* Contact info */}
          {(course.website_url || course.phone) && (
            <Box sx={{ mt: 4 }}>
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
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{course.phone}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Grid>

        {/* Right — Hole Quick Reference (1/3) */}
        {holes && holes.length > 0 && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <GridViewIcon sx={{ color: "secondary.main" }} />
              Hole Quick Reference
            </Typography>
            <Grid container spacing={1}>
              {holes.map((hole) => {
                const intel = holeHasIntel(hole);
                const primaryYardage =
                  hole.yardage_by_tee?.tees?.[0]?.yardage;
                return (
                  <Grid key={hole.hole_number} size={{ xs: 4 }}>
                    <Card
                      sx={{
                        borderRadius: 2,
                        border: intel ? "2px solid" : "1px solid",
                        borderColor: intel ? "secondary.main" : "divider",
                        boxShadow: "none",
                        overflow: "hidden",
                        position: "relative",
                        transition: "box-shadow 0.2s",
                        "&:hover": {
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <CardActionArea
                        component={RouterLink}
                        to={`/courses/${id}/holes/${hole.hole_number}`}
                      >
                        <CardContent
                          sx={{ textAlign: "center", py: 1.5, px: 1 }}
                        >
                          {intel && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                bgcolor: "secondary.main",
                                color: "white",
                                fontSize: "0.45rem",
                                fontWeight: 700,
                                px: 0.5,
                                lineHeight: 1.6,
                              }}
                            >
                              INTEL
                            </Box>
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "text.disabled",
                            }}
                          >
                            #{hole.hole_number}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                            }}
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

            {/* Pro Tip */}
            {proTipHole && (
              <Paper
                sx={{
                  p: 2,
                  mt: 2,
                  bgcolor: "rgba(26, 66, 49, 0.05)",
                  border: "1px solid",
                  borderColor: "rgba(26, 66, 49, 0.1)",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontStyle: "italic", color: "text.secondary" }}
                >
                  <Typography
                    component="span"
                    sx={{ fontWeight: 700, fontStyle: "normal" }}
                  >
                    Pro Tip:
                  </Typography>{" "}
                  Hole {proTipHole.hole_number} —{" "}
                  {proTipHole.strategic_tips}
                </Typography>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
