import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
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
      // Merge ratings into existing entry
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
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 600, py: 1 }}>Tee</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, py: 1 }}>
              Yardage
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tees.map((tee, i) => {
            const color = tee.color
              ? TEE_COLORS[tee.color.toLowerCase()] || "#999"
              : "#999";
            return (
              <TableRow key={i} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell sx={{ py: 0.75 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: color,
                      marginRight: 8,
                      border: color === "#e0e0e0" ? "1px solid #bbb" : "none",
                      verticalAlign: "middle",
                    }}
                  />
                  {tee.name}
                </TableCell>
                <TableCell align="right" sx={{ py: 0.75, fontWeight: 500 }}>
                  {tee.yardage ? `${tee.yardage}` : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
