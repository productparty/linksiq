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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {stateFilter ? `Courses in ${stateFilter}` : "All Courses"}
      </Typography>
      {data && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {data.total} course{data.total !== 1 ? "s" : ""} found
        </Typography>
      )}

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by course name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Filters + Sort row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <FilterListIcon fontSize="small" sx={{ color: "text.secondary" }} />

        {/* State filter chip */}
        {stateFilter && (
          <Chip
            label={stateFilter}
            onDelete={clearState}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}

        {/* Intel filter chip */}
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

        {/* Sort */}
        <FormControl size="small" sx={{ minWidth: 150, ml: "auto" }}>
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </Box>

          {data.courses.length === 0 && (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No courses found. Try a different search or filter.
            </Typography>
          )}

          {data.total_pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={data.total_pages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
