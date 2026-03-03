import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Typography,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import { fetchCourses } from "../api/courses";
import { CourseCard } from "../components/CourseCard";
import { CourseFilterPanel } from "../components/CourseFilterPanel";
import { useCourseFilters } from "../hooks/useCourseFilters";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "rating_desc", label: "Rating (High-Low)" },
  { value: "slope_desc", label: "Slope (High-Low)" },
  { value: "yardage_desc", label: "Yardage (Long-Short)" },
  { value: "yardage_asc", label: "Yardage (Short-Long)" },
];

export function CourseList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { filters, setFilters, clearAllFilters, activeFilterCount, apiParams } =
    useCourseFilters();

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", apiParams],
    queryFn: () => fetchCourses(apiParams),
  });

  // Build active filter chips
  const chips: { key: string; label: string; onDelete: () => void }[] = [];
  if (filters.state) {
    chips.push({ key: "state", label: `State: ${filters.state}`, onDelete: () => setFilters({ state: "" }) });
  }
  if (filters.holes) {
    chips.push({ key: "holes", label: `${filters.holes} Holes`, onDelete: () => setFilters({ holes: null }) });
  }
  if (filters.course_type) {
    chips.push({ key: "type", label: filters.course_type, onDelete: () => setFilters({ course_type: "" }) });
  }
  if (filters.has_intel) {
    chips.push({ key: "intel", label: "Has Intel", onDelete: () => setFilters({ has_intel: false }) });
  }
  if (filters.slope_min != null || filters.slope_max != null) {
    const min = filters.slope_min ?? 93;
    const max = filters.slope_max ?? 150;
    chips.push({ key: "slope", label: `Slope: ${min}–${max}`, onDelete: () => setFilters({ slope_min: null, slope_max: null }) });
  }
  if (filters.rating_min != null || filters.rating_max != null) {
    const min = filters.rating_min ?? 55;
    const max = filters.rating_max ?? 77;
    chips.push({ key: "rating", label: `Rating: ${min}–${max}`, onDelete: () => setFilters({ rating_min: null, rating_max: null }) });
  }
  if (filters.yardage_min != null || filters.yardage_max != null) {
    const min = filters.yardage_min ?? 2400;
    const max = filters.yardage_max ?? 7600;
    chips.push({ key: "yardage", label: `Yardage: ${min.toLocaleString()}–${max.toLocaleString()}`, onDelete: () => setFilters({ yardage_min: null, yardage_max: null }) });
  }

  return (
    <>
      {/* Sticky search bar */}
      <Box
        sx={{
          position: "sticky",
          top: { xs: 56, sm: 64 },
          zIndex: (t) => t.zIndex.appBar - 1,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: { xs: 2, sm: 3 },
          py: 1.5,
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <TextField
            placeholder="Search courses..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            size="small"
            sx={{ flex: 1, maxWidth: { md: 400 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Sort - hidden on xs */}
          <FormControl size="small" sx={{ minWidth: 170, display: { xs: "none", sm: "flex" } }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={filters.sort}
              label="Sort by"
              onChange={(e) => setFilters({ sort: e.target.value })}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Mobile filter button */}
          {isMobile && (
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setDrawerOpen(true)}
              size="small"
              sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          )}

          {/* Result count */}
          {data && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                whiteSpace: "nowrap",
                display: { xs: "none", sm: "block" },
              }}
            >
              {data.total} course{data.total !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            px: { xs: 2, sm: 3 },
            pt: 1.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          {chips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onDelete={chip.onDelete}
              size="small"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          ))}
          {chips.length > 1 && (
            <Button
              size="small"
              onClick={clearAllFilters}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
            >
              Clear all
            </Button>
          )}
        </Box>
      )}

      {/* Main content: sidebar + results */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          display: "flex",
          gap: 4,
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        {/* Desktop sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              position: "sticky",
              top: 140,
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
              pr: 1,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "divider",
                borderRadius: 2,
              },
            }}
          >
            <CourseFilterPanel
              filters={filters}
              setFilters={setFilters}
              clearAllFilters={clearAllFilters}
              activeFilterCount={activeFilterCount}
              resultCount={data?.total}
            />
          </Box>
        )}

        {/* Results grid */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {isLoading && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load courses. Please try again.
            </Alert>
          )}

          {data && (
            <>
              <Grid container spacing={3}>
                {data.courses.map((course) => (
                  <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <CourseCard course={course} />
                  </Grid>
                ))}
              </Grid>

              {data.courses.length === 0 && (
                <Typography
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}
                >
                  No courses found. Try a different search or filter.
                </Typography>
              )}

              {data.total_pages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mt: 6,
                    gap: 1.5,
                  }}
                >
                  <Pagination
                    count={data.total_pages}
                    page={filters.page}
                    onChange={(_, p) => setFilters({ page: p })}
                    color="primary"
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Showing {data.courses.length} of {data.total} courses
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: "85vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        {/* Drag handle + close */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "divider", mb: 1 }} />
          <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end", px: 1 }}>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ overflowY: "auto", pb: 2 }}>
          <CourseFilterPanel
            filters={filters}
            setFilters={setFilters}
            clearAllFilters={clearAllFilters}
            activeFilterCount={activeFilterCount}
            resultCount={data?.total}
            isMobile
            onApply={() => setDrawerOpen(false)}
          />
        </Box>
      </Drawer>
    </>
  );
}
