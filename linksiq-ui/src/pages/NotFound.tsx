import { Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button, Box } from "@mui/material";

export function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
        Page not found
      </Typography>
      <Box>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          size="large"
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
}
