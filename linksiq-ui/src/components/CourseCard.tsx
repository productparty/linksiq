import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import GolfCourseIcon from "@mui/icons-material/GolfCourse";
import type { CourseListItem } from "../types/course";

interface Props {
  course: CourseListItem;
}

export function CourseCard({ course }: Props) {
  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/courses/${course.id}`}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {course.name}
            </Typography>
            {course.has_detailed_holes && (
              <Chip
                label="Detailed"
                size="small"
                color="secondary"
                sx={{ ml: 1, flexShrink: 0 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {[course.city, course.state].filter(Boolean).join(", ")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
            {course.total_par && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <GolfCourseIcon fontSize="small" color="action" />
                <Typography variant="body2">Par {course.total_par}</Typography>
              </Box>
            )}
            {course.num_holes && (
              <Typography variant="body2" color="text.secondary">
                {course.num_holes} holes
              </Typography>
            )}
            {course.total_yardage && (
              <Typography variant="body2" color="text.secondary">
                {course.total_yardage.toLocaleString()} yds
              </Typography>
            )}
            {course.course_type && (
              <Chip
                label={course.course_type}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
