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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { fetchCourses } from "../api/courses";
import { CourseCard } from "../components/CourseCard";
import { useDebounce } from "../hooks/useDebounce";

export function CourseList() {
  const [searchParams] = useSearchParams();
  const stateFilter = searchParams.get("state") || "";
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", stateFilter, debouncedSearch, page],
    queryFn: () =>
      fetchCourses({
        state: stateFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      }),
  });

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

      <TextField
        fullWidth
        placeholder="Search by course name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

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
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No courses found. Try a different search.
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
