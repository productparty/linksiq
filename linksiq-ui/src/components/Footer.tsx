import { Box, Typography } from "@mui/material";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: "auto",
        backgroundColor: "primary.main",
        color: "primary.contrastText",
        textAlign: "center",
      }}
    >
      <Typography variant="body2">
        LinksIQ — The local knowledge advantage on any course you play
      </Typography>
    </Box>
  );
}
