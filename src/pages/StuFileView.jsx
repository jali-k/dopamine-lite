import { Box, Container, Grid, Typography } from "@mui/material";
import { collection } from "firebase/firestore";
import { NavLink, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import VCad from "../components/VCad";
import { useUser } from "../contexts/UserProvider";

export default function StuFileView() {
  const params = useParams();
  const tutorialref = collection(fireDB, "folders", params.fname, "tutorials");
  const emailListref = collection(
    fireDB,
    "folders",
    params.fname,
    "emailslist"
  );

  const { user, isAdmin } = useUser();

  const [tuts, loading] = useCollectionData(tutorialref);
  const [emails, emailLoading] = useCollectionData(emailListref);

  if (loading) {
    return <Loading text="Loading Tutorials" />;
  }
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
  }
  if (isAdmin) {
    emails.push({ email: user.email });
    console.log("giving access to admin: ", user.email);
  }
  if (emails && emails.length > 0) {
    if (!emails.find((email) => email.email === user.email)) {
      return (
        <NavLink
          to="/"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textDecoration: "none",
          }}
        >
          <Typography color={"error.main"} textAlign={"center"}>
            You are not authorized to view this page. Click here to go back
          </Typography>
        </NavLink>
      );
    }
  }
  return (
    <Container
      disableGutters
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f4f4",
        position: "relative",
      }}
    >
      <Appbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: 2,
          overflowY: "auto",
        }}
      >
        <Grid container columns={12} spacing={1}>
          {tuts.length > 0 ? (
            tuts.map((tut, index) => (
              <Grid
                item
                key={index}
                justifyContent={"center"}
                display={"flex"}
                xs={12}
                sm={6}
                md={4}
              >
                <VCad tut={{ ...tut, fpath: params.fname }} />
              </Grid>
            ))
          ) : (
            <Typography
              variant="h3"
              sx={{
                textAlign: "center",
                my: 4,
                fontSize: "24px",
                width: "100%",
              }}
            >
              No Files Found
            </Typography>
          )}
        </Grid>
      </Box>
    </Container>
  );
}
