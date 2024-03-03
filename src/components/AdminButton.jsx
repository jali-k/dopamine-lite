import { AdminPanelSettingsOutlined, Visibility } from "@mui/icons-material";
import { Fab } from "@mui/material";
import { useUser } from "../contexts/UserProvider";

export default function AdminButton() {
  const { isAdmin } = useUser();

  return isAdmin ? (
    <Fab
      sx={{
        position: "fixed",
        bottom: "20px",
        left: "15px",
      }}
      color={window.location.pathname.includes("admin") ? "error" : "success"}
      aria-label="add"
      onClick={() => {
        const pathname = window.location.pathname;
        if (pathname.includes("admin")) {
          console.log("admin path");
          window.location.href = pathname.replace("/admin", "");
        } else {
          console.log("not admin path");
          window.location.href = "/admin" + pathname;
        }
      }}
    >
      {/* <AdminPanelSettingsOutlined />
  <Person /> */}
      {window.location.href.includes("admin") ? (
        <AdminPanelSettingsOutlined />
      ) : (
        <Visibility />
      )}
    </Fab>
  ) : null;
}
