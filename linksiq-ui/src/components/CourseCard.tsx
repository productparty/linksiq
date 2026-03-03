import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import type { CourseListItem } from "../types/course";

interface Props {
  course: CourseListItem;
}

export function CourseCard({ course }: Props) {
  const courseType = course.course_type?.toLowerCase();
  const isPublic = courseType === "public";
  const isPrivate = courseType === "private";

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardActionArea component={RouterLink} to={`/courses/${course.id}`}>
        {/* Card image area — real photo or gradient fallback */}
        <Box
          sx={{
            height: course.photo_url ? 180 : 100,
            bgcolor: "primary.main",
            position: "relative",
            overflow: "hidden",
            ...(course.photo_url
              ? {
                  backgroundImage: `url(${course.photo_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  "& .card-hover-zoom": {
                    transition: "transform 0.5s ease",
                  },
                }
              : {
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    opacity: 0.1,
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "32px 32px",
                  },
                }),
          }}
        >
          {/* PUBLIC/PRIVATE badge top-left */}
          {(isPublic || isPrivate) && (
            <Chip
              label={isPublic ? "PUBLIC" : "PRIVATE"}
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                bgcolor: "rgba(26, 66, 49, 0.9)",
                color: "white",
                fontWeight: 800,
                fontSize: "0.5rem",
                height: 22,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            />
          )}
          {/* IQ circle badge top-right */}
          {course.has_detailed_holes && (
            <Box
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: "50%",
                bgcolor: "secondary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <Typography
                sx={{
                  color: "white",
                  fontWeight: 900,
                  fontSize: "0.6rem",
                }}
              >
                IQ
              </Typography>
            </Box>
          )}
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Name */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}
          >
            {course.name}
          </Typography>
          {/* Location */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 3 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {[course.city, course.state].filter(Boolean).join(", ")}
            </Typography>
          </Box>

          {/* 3-column stat grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 1.5,
            }}
          >
            {course.total_par && (
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: "text.disabled",
                  }}
                >
                  Par
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {course.total_par}
                </Typography>
              </Box>
            )}
            {course.num_holes && (
              <Box
                sx={{
                  textAlign: "center",
                  borderLeft: "1px solid",
                  borderRight: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: "text.disabled",
                  }}
                >
                  Holes
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {course.num_holes}
                </Typography>
              </Box>
            )}
            {course.total_yardage && (
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: "text.disabled",
                  }}
                >
                  Yardage
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {course.total_yardage.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Slope / Rating row */}
          {(course.slope_rating != null || course.course_rating != null) && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderTop: "1px solid",
                borderColor: "divider",
                mt: 1,
                pt: 1.5,
              }}
            >
              {course.slope_rating != null && (
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      color: "text.disabled",
                    }}
                  >
                    Slope
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {course.slope_rating}
                  </Typography>
                </Box>
              )}
              {course.course_rating != null && (
                <Box
                  sx={{
                    textAlign: "center",
                    ...(course.slope_rating != null && {
                      borderLeft: "1px solid",
                      borderColor: "divider",
                    }),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      color: "text.disabled",
                    }}
                  >
                    Rating
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {course.course_rating}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
