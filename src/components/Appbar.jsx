import { Home, NavigateNext } from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Breadcrumbs,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { useUser } from "../contexts/UserProvider";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "../../af";

export default function Appbar() {
  const { user } = useUser();
  const location = useLocation();

  return (
    <>
      <AppBar position="static" sx={{ mb: 1 }} color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Educator
          </Typography>
          <IconButton
            onClick={() => {
              signOut();
            }}
          >
            <Avatar src={user.photoURL} />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Breadcrumbs
        sx={{ ml: 2, mb: 2, position: "sticky", color: " #2279cf " }}
        separator={<NavigateNext />}
      >
        <Link to="/" style={{ textDecoration: "none", color: " #2279cf " }}>
          <Home />
        </Link>
        {location.pathname.split("/").map((path, index) => {
          if (path === "") {
            return null;
          }
          return (
            <Link
              key={index}
              to={`/${path}`}
              style={{ textDecoration: "none", color: " #2279cf " }}
            >
              {decodeURI(path)}
            </Link>
          );
        })}
      </Breadcrumbs>
    </>
  );
}
