import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent
} from "@mui/material";
import {
  Science as ScienceIcon,
  BiotechOutlined as BiotechIcon
} from '@mui/icons-material';
import { collection } from "firebase/firestore";
import { NavLink, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import VCad from "../components/VCad";
import { useUser } from "../contexts/UserProvider";
import { Colors } from "../themes/colours";

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
          <Typography
            color="error.main"
            textAlign="center"
            variant="h6"
            sx={{
              backgroundColor: 'error.light',
              padding: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)'
            }}
          >
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
        bgcolor: "background.default",
        position: "relative",
      }}
    >
      <Appbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: 2,
          py: 2,
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'customColors.cytoplasm',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <BiotechIcon sx={{ fontSize: 32, color: Colors.green }} />
          <Typography variant="h4">
            {params.fname} Tutorials
          </Typography>
        </Paper>

        {/* Tutorials Grid */}
        <Grid
          container
          spacing={2}
          sx={{
            position: 'relative'
          }}
        >
          {tuts.length > 0 ? (
            tuts.map((tut, index) => (
              <Grid
                item
                key={index}
                xs={12}
                sm={6}
                md={4}
              >
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                    }
                  }}
                >
                  <VCad tut={{ ...tut, fpath: params.fname }} />
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Card
                sx={{
                  textAlign: 'center',
                  py: 6,
                  backgroundColor: 'customColors.cytoplasm',
                  border: '1px dashed',
                  borderColor: 'primary.main'
                }}
              >
                <CardContent>
                  <ScienceIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                      opacity: 0.7,
                      mb: 2
                    }}
                  />
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                      fontFamily: 'Quicksand, Arial, sans-serif',
                      fontWeight: 500
                    }}
                  >
                    No Tutorials Found
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}