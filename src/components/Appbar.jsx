import {
  Home,
  NavigateNext,
  Person as PersonIcon,
  Email as EmailIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Breadcrumbs,
  IconButton,
  Toolbar,
  Typography,
  Stack,
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Paper
} from "@mui/material";
import { useUser } from "../contexts/UserProvider";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "../../af";
import { useState } from "react";
import appIcon from '../assets/icon.jpg';


export default function Appbar() {
  const { user } = useUser();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleClose();
    signOut();
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          bgcolor: 'primary.main',
          backgroundImage: 'linear-gradient(45deg, #2e7d32 30%, #43a047 90%)',
          boxShadow: '0 2px 10px rgba(46, 125, 50, 0.2)',
        }}
      >
        <Toolbar>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ flexGrow: 1 }}
          >
            <Box
              component="img"
              src={appIcon}
              alt="App Icon"
              sx={{
                width: 32,
                height: 32,
                // filter: 'brightness(0) invert(1)', // Makes the icon white
                opacity: 0.9
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.5px',
                fontFamily: 'Quicksand, Arial, sans-serif',
                color: '#ffffff', // Ensuring text is white
                textShadow: '0 1px 2px rgba(0,0,0,0.1)', // Adding subtle shadow for better visibility
                opacity: 0.95
              }}
            >
              Dopamine Lite
            </Typography>
          </Stack>
          <IconButton
            onClick={handleClick}
            sx={{
              border: '2px solid rgba(255, 255, 255, 0.2)',
              padding: '4px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                border: '2px solid rgba(255, 255, 255, 0.5)',
              }
            }}
          >
            <Avatar
              src={user.photoURL}
              sx={{
                width: 32,
                height: 32,
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Rest of the component remains the same */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(46, 125, 50, 0.15))',
            mt: 1.5,
            minWidth: 250,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{
          p: 2,
          bgcolor: 'customColors.cytoplasm',
          borderBottom: '1px solid',
          borderColor: 'customColors.membrane'
        }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Avatar
              src={user.photoURL}
              sx={{
                width: 48,
                height: 48,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: '#2e7d32'
                }}
              >
                {user.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Biology Student
              </Typography>
            </Box>
          </Stack>
        </Box>

        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            <EmailIcon fontSize="small" sx={{ color: "#2e7d32" }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </MenuItem>
        
        <MenuItem
          component={Link}
          to="/admin"
          sx={{
            py: 1.5,
            '&:hover': {
              bgcolor: 'primary.light',
            }
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" sx={{ color: "#2e7d32" }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.secondary">
            Admin Panel
          </Typography>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={handleSignOut}
          sx={{
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.light',
            }
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      <Box sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
        <Breadcrumbs
          separator={
            <NavigateNext sx={{ color: '#2e7d32', opacity: 0.7 }} />
          }
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center"
            }}
          >
            <Home sx={{
              color: '#2e7d32',
              fontSize: 20
            }} />
          </Link>
          {location.pathname.split("/").map((path, index) => {
            if (path === "") {
              return null;
            }
            return (
              <Link
                key={index}
                to={`/${path}`}
                style={{
                  textDecoration: "none",
                  color: "#2e7d32",
                  fontFamily: 'Quicksand, Arial, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}
              >
                {decodeURI(path)}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>
    </>
  );
}