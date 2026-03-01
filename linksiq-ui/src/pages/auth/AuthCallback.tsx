import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { supabase } from "../../lib/supabase";

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography color="text.secondary">Completing sign in...</Typography>
    </Box>
  );
}
