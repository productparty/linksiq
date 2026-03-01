import { IconButton, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useNavigate } from "react-router-dom";

interface Props {
  courseId: string;
}

export function FavoriteButton({ courseId }: Props) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const faved = isFavorite(courseId);

  const handleClick = () => {
    if (!user) {
      navigate("/signin", { state: { from: window.location.pathname } });
      return;
    }
    toggleFavorite(courseId);
  };

  return (
    <Tooltip title={faved ? "Remove from favorites" : "Save to favorites"}>
      <IconButton onClick={handleClick} color={faved ? "error" : "default"}>
        {faved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Tooltip>
  );
}
