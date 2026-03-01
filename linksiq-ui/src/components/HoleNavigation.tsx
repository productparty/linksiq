import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface Props {
  courseId: string;
  currentHole: number;
  totalHoles: number;
}

export function HoleNavigation({ courseId, currentHole, totalHoles }: Props) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 3,
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        disabled={currentHole <= 1}
        onClick={() =>
          navigate(`/courses/${courseId}/holes/${currentHole - 1}`)
        }
      >
        Hole {currentHole - 1}
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate(`/courses/${courseId}`)}
      >
        Back to Course
      </Button>
      <Button
        endIcon={<ArrowForwardIcon />}
        disabled={currentHole >= totalHoles}
        onClick={() =>
          navigate(`/courses/${courseId}/holes/${currentHole + 1}`)
        }
      >
        Hole {currentHole + 1}
      </Button>
    </Box>
  );
}
