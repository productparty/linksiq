import { Box, Typography, Paper } from "@mui/material";
import type { YardageByTee, TeeYardage } from "../types/course";

interface Props {
  yardageByTee: YardageByTee | null;
}

const TEE_COLORS: Record<string, string> = {
  black: "#1a1a1a",
  blue: "#1565c0",
  white: "#e0e0e0",
  gold: "#f9a825",
  yellow: "#f9a825",
  red: "#c62828",
  green: "#2e7d32",
  silver: "#9e9e9e",
  orange: "#e65100",
};

function deduplicateTees(tees: TeeYardage[]): TeeYardage[] {
  const seen = new Map<string, TeeYardage>();
  for (const tee of tees) {
    const key = `${tee.name}-${tee.yardage}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (tee.course_rating_men) existing.course_rating_men = tee.course_rating_men;
      if (tee.slope_men) existing.slope_men = tee.slope_men;
      if (tee.course_rating_women) existing.course_rating_women = tee.course_rating_women;
      if (tee.slope_women) existing.slope_women = tee.slope_women;
    } else {
      seen.set(key, { ...tee });
    }
  }
  return Array.from(seen.values());
}

export function YardageTable({ yardageByTee }: Props) {
  const rawTees = yardageByTee?.tees ?? [];
  if (rawTees.length === 0) return null;

  const tees = deduplicateTees(rawTees);

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
      {tees.map((tee, i) => {
        const dotColor = tee.color
          ? TEE_COLORS[tee.color.toLowerCase()] || "#999"
          : "#999";
        return (
          <Paper
            key={i}
            variant="outlined"
            sx={{
              px: 2,
              py: 1,
              minWidth: 80,
              textAlign: "center",
              flex: "0 0 auto",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.25 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: dotColor,
                  border: dotColor === "#e0e0e0" ? "1px solid #bbb" : "none",
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", color: "text.secondary", fontSize: "0.65rem", letterSpacing: 0.5 }}>
                {tee.name}
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {tee.yardage ? `${tee.yardage}y` : "—"}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
}
