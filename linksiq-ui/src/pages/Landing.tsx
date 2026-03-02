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
  Chip,
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
          py: { xs: 8, md: 12 },
          px: 2,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Chip
            label="COURSE INTELLIGENCE"
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: 2,
              mb: 3,
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "2.2rem", md: "3.2rem" },
              lineHeight: 1.15,
            }}
          >
            Know every hole
          </Typography>
          <Typography
            variant="h2"
            component="span"
            sx={{
              fontWeight: 700,
              fontStyle: "italic",
              color: "secondary.main",
              display: "block",
              mb: 3,
              fontSize: { xs: "2.2rem", md: "3.2rem" },
              lineHeight: 1.15,
            }}
          >
            before you play
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 5, opacity: 0.85, maxWidth: 480, mx: "auto", fontSize: "1.05rem" }}
          >
            The world's most advanced course database for serious golfers who
            demand detailed strategic intelligence.
          </Typography>
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              maxWidth: 540,
              mx: "auto",
              bgcolor: "white",
              borderRadius: 2,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <TextField
              fullWidth
              placeholder="Course name, city, or zip code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  border: "none",
                  "& fieldset": { border: "none" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: 0,
                px: 4,
                bgcolor: "primary.dark",
                "&:hover": { bgcolor: "#0a1f14" },
                whiteSpace: "nowrap",
              }}
            >
              Search
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Browse by state */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
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
