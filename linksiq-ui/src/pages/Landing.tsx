import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Grid,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const STATES = [
  "MI", "OH", "IN", "IL", "WI", "FL", "CA", "TX", "NY", "NC",
  "SC", "GA", "PA", "AZ", "CO", "OR", "WA", "VA", "TN", "MN",
];

export function Landing() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          py: { xs: 6, md: 10 },
          px: 2,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            The local knowledge advantage
            <br />
            on any course you play
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.85, fontWeight: 400 }}
          >
            Deep, hole-by-hole intelligence for serious golfers
          </Typography>
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ maxWidth: 500, mx: "auto" }}
          >
            <TextField
              fullWidth
              placeholder="Search courses by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                bgcolor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": { borderRadius: 1 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Browse by state */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Browse by State
        </Typography>
        <Grid container spacing={1.5}>
          {STATES.map((state) => (
            <Grid key={state} size={{ xs: 4, sm: 3, md: 2 }}>
              <Card variant="outlined">
                <CardActionArea
                  onClick={() => navigate(`/courses?state=${state}`)}
                >
                  <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {state}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/courses")}
          >
            Browse All Courses
          </Button>
        </Box>
      </Container>
    </>
  );
}
