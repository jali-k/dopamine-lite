import { Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Error404() {
  const navigator = useNavigate();
  return (
    <Container
      sx={{
        bgcolor: "#f4f4f4",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="h3">Error 404</Typography>
      <Typography variant="h5">Page Not Found</Typography>
      <Button
        onClick={() => {
          navigator("/");
        }}
      >
        Go Home
      </Button>
    </Container>
  );
}
