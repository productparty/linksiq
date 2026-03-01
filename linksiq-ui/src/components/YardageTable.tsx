import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import type { YardageByTee } from "../types/course";

interface Props {
  yardageByTee: YardageByTee | null;
}

export function YardageTable({ yardageByTee }: Props) {
  const tees = yardageByTee?.tees ?? [];
  if (tees.length === 0) return null;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Tee</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Yardage
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tees.map((tee, i) => (
            <TableRow key={i}>
              <TableCell>
                {tee.color && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: tee.color?.toLowerCase() || "#999",
                      marginRight: 8,
                      border: "1px solid #ccc",
                    }}
                  />
                )}
                {tee.name}
              </TableCell>
              <TableCell align="right">
                {tee.yardage ? `${tee.yardage} yds` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
