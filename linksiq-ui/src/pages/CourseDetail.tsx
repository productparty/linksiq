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
} from "@mui/material";
import GolfCourseIcon from "@mui/icons-material/GolfCourse";
import MapIcon from "@mui/icons-material/Map";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import { fetchCourse, fetchCourseHoles } from "../api/courses";
import { FavoriteButton } from "../components/FavoriteButton";

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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {course.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {[course.city, course.state].filter(Boolean).join(", ")}
          </Typography>
        </Box>
        <FavoriteButton courseId={course.id} />
      </Box>

      {/* Stats row */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", my: 2 }}>
        {course.total_par && <Chip icon={<GolfCourseIcon />} label={`Par ${course.total_par}`} />}
        {course.num_holes && <Chip label={`${course.num_holes} holes`} variant="outlined" />}
        {course.total_yardage && <Chip label={`${course.total_yardage.toLocaleString()} yds`} variant="outlined" />}
        {course.slope_rating && <Chip label={`Slope ${course.slope_rating}`} variant="outlined" />}
        {course.course_rating && <Chip label={`Rating ${course.course_rating}`} variant="outlined" />}
        {course.course_type && <Chip label={course.course_type} variant="outlined" />}
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", my: 3 }}>
        {holes && holes.length > 0 && (
          <Button
            variant="contained"
            startIcon={<MapIcon />}
            onClick={() => navigate(`/courses/${id}/walkthrough`)}
          >
            Full Walkthrough
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => navigate(`/courses/${id}/walkthrough?pdf=1`)}
        >
          Download PDF Guide
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Description */}
      {course.walkthrough_narrative && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overview
          </Typography>
          <Typography variant="body1">{course.walkthrough_narrative}</Typography>
        </Box>
      )}
      {course.description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">{course.description}</Typography>
        </Box>
      )}

      {/* Hole grid */}
      {holes && holes.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Holes
          </Typography>
          <Grid container spacing={1.5}>
            {holes.map((hole) => {
              const primaryYardage = hole.yardage_by_tee?.tees?.[0]?.yardage;
              return (
                <Grid key={hole.hole_number} size={{ xs: 4, sm: 3, md: 2 }}>
                  <Card variant="outlined">
                    <CardActionArea
                      component={RouterLink}
                      to={`/courses/${id}/holes/${hole.hole_number}`}
                    >
                      <CardContent sx={{ textAlign: "center", py: 1.5, px: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, lineHeight: 1 }}
                        >
                          {hole.hole_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Par {hole.par}
                        </Typography>
                        {primaryYardage && (
                          <Typography variant="caption" color="text.secondary">
                            {primaryYardage} yds
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Contact info */}
      {(course.website_url || course.phone) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Contact
          </Typography>
          {course.website_url && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
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
    </Container>
  );
}
