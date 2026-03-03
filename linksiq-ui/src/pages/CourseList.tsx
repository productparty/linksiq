import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fetchCourses } from "../api/courses";
import { CourseCard } from "../components/CourseCard";
import { useDebounce } from "../hooks/useDebounce";

const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "yardage", label: "Yardage" },
  { value: "par", label: "Par" },
  { value: "rating", label: "Rating" },
  { value: "slope", label: "Slope" },
];

export function CourseList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stateFilter = searchParams.get("state") || "";
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [intelOnly, setIntelOnly] = useState(false);
  const [sort, setSort] = useState("name");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", stateFilter, debouncedSearch, intelOnly, sort, page],
    queryFn: () =>
      fetchCourses({
        state: stateFilter || undefined,
        search: debouncedSearch || undefined,
        has_intel: intelOnly ? true : undefined,
        sort: sort !== "name" ? sort : undefined,
        page,
        per_page: 20,
      }),
  });

  const clearState = () => {
    searchParams.delete("state");
    setSearchParams(searchParams);
    setPage(1);
  };

  return (
    <>
      {/* Hero Banner */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          px: 2,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          },
        }}
      >
        <Container
          maxWidth="md"
          sx={{ position: "relative", zIndex: 1, textAlign: "center" }}
        >
          <Chip
            label="COURSE INTELLIGENCE"
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              fontWeight: 700,
              fontSize: "0.6rem",
              letterSpacing: 2,
              textTransform: "uppercase",
              mb: 3,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              mb: 2,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            Know every hole{" "}
            <Box
              component="span"
              sx={{ color: "secondary.main", fontStyle: "italic" }}
            >
              before you play
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontSize: { xs: "1rem", md: "1.15rem" },
              fontWeight: 500,
              mb: 5,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            The world's most advanced course database for serious golfers who
            demand detailed strategic intelligence.
          </Typography>

          {/* Search embedded in hero */}
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 3,
              p: 1,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 1,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxWidth: 700,
              mx: "auto",
            }}
          >
            <TextField
              fullWidth
              placeholder="Course name, city, or zip code"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                sx: { px: 2, py: 1 },
              }}
            />
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          width: "100%",
          px: 3,
          py: 5,
        }}
      >
        {/* Filter chips row */}
        <Box sx={{ mb: 5, overflowX: "auto" }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "text.secondary",
                mr: 1,
                whiteSpace: "nowrap",
              }}
            >
              Filter by:
            </Typography>
            {stateFilter && (
              <Chip
                label={stateFilter}
                onDelete={clearState}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
            <Chip
              label="Has Intel"
              size="small"
              variant={intelOnly ? "filled" : "outlined"}
              color={intelOnly ? "secondary" : "default"}
              onClick={() => {
                setIntelOnly(!intelOnly);
                setPage(1);
              }}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Content header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            mb: 4,
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}
            >
              {stateFilter ? `Top Rated in ${stateFilter}` : "All Courses"}
            </Typography>
            {data && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontWeight: 500, mt: 0.5 }}
              >
                Found {data.total} course intelligence report
                {data.total !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sort}
              label="Sort by"
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

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
            {/* 3-column card grid */}
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
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                />
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                >
                  Showing {data.courses.length} of {data.total} courses
                  {stateFilter ? ` in ${stateFilter}` : ""}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
}
