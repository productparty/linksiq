import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import type { CourseListItem } from "../types/course";

interface Props {
  course: CourseListItem;
}

export function CourseCard({ course }: Props) {
  const courseType = course.course_type?.toLowerCase();
  const isPublic = courseType === "public";
  const isPrivate = courseType === "private";

  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} to={`/courses/${course.id}`}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Top row: badges */}
          <Box sx={{ display: "flex", gap: 0.75, mb: 1.5 }}>
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
            {course.has_detailed_holes && (
              <Chip
                label="IQ"
                size="small"
                sx={{
                  bgcolor: "secondary.main",
                  color: "secondary.contrastText",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 22,
                  minWidth: 32,
                }}
              />
            )}
          </Box>

          {/* Name + location */}
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>
            {course.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {[course.city, course.state].filter(Boolean).join(", ")}
          </Typography>

          {/* Stat row */}
          <Box
            sx={{
              display: "flex",
              gap: 3,
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 1.5,
            }}
          >
            {course.total_par && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "text.secondary",
                    fontSize: "0.6rem",
                  }}
                >
                  Par
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {course.total_par}
                </Typography>
              </Box>
            )}
            {course.num_holes && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "text.secondary",
                    fontSize: "0.6rem",
                  }}
                >
                  Holes
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {course.num_holes}
                </Typography>
              </Box>
            )}
            {course.total_yardage && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: "text.secondary",
                    fontSize: "0.6rem",
                  }}
                >
                  Yardage
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {course.total_yardage.toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
