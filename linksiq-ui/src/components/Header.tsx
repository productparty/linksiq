import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            color: "inherit",
            fontWeight: 700,
          }}
        >
          Links<span style={{ color: "#2d8a6e" }}>IQ</span>
        </Typography>

        {/* Desktop nav */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/courses">
            Courses
          </Button>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/favorites">
                Favorites
              </Button>
              <Button color="inherit" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/signin">
              Sign In
            </Button>
          )}
        </Box>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                navigate("/courses");
                setAnchorEl(null);
              }}
            >
              Courses
            </MenuItem>
            {user ? (
              [
                <MenuItem
                  key="fav"
                  onClick={() => {
                    navigate("/favorites");
                    setAnchorEl(null);
                  }}
                >
                  Favorites
                </MenuItem>,
                <MenuItem
                  key="out"
                  onClick={() => {
                    signOut();
                    setAnchorEl(null);
                  }}
                >
                  Sign Out
                </MenuItem>,
              ]
            ) : (
              <MenuItem
                onClick={() => {
                  navigate("/signin");
                  setAnchorEl(null);
                }}
              >
                Sign In
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
