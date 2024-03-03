import WarningIcon from "@mui/icons-material/Warning";
import { Container, Typography } from "@mui/material";

export default function NotFocus() {
  return (
    <Container
      sx={{
        bgcolor: "#f4f4f4",
        height: "100vh",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          textAlign: "center",
          position: "absolute",
          width: "90%",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <WarningIcon sx={{ fontSize: "100px" }} />
        Stay focused
      </Typography>
    </Container>
  );
}
