import {
  Box,
  Button,
  Container,
  Modal,
  Typography as T,
  Paper,
  Card,
  CardContent,
  Stack
} from "@mui/material";
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import Appbar from "../components/Appbar";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { collection, doc } from "firebase/firestore";
import {
  useCollectionData as uCD,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { NavLink, useNavigate as uNV, useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import Loading from "../components/Loading";
import { useEffect as uE, useState } from "react";
import NotFocus from "./NotFocus";
import { useUser } from "../contexts/UserProvider";
import theme from "../../theme";
import { deleteTutorial } from "../../funcs";
import CVPL from "../components/cvp";

export default function ADVideoPage() {
  const params = useParams();
  const tutsref = collection(fireDB, "folders", params.fname, "tutorials");
  const lessonref = doc(fireDB, tutsref.path, params.lname);
  const [vurl, setvurl] = useState("");

  const { user, isAdmin } = useUser();

  const [tut, loading, error] = useDocumentData(lessonref);

  const nv = uNV();

  uE(() => {
    async function geturl() {
      if (tut) {
        const vref = ref(
          fireStorage,
          `videos/${params.fname}/${params.lname}/${tut.video}`
        );
        await getDownloadURL(vref)
          .then((url) => {
            setvurl(url);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }

    geturl();
  }, [tut, loading, params.fname, params.lname]);

  if (loading) {
    return <Loading text="Loading Document" />;
  }
  if (error) {
    return (
      <NavLink
        to="/admin"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          textDecoration: "none",
        }}
      >
        <T color={"error.main"} textAlign={"center"}>
          An Error Occured. Click here to go back
        </T>
      </NavLink>
    );
  }

  if (!isAdmin) {
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
        <T color={"error.main"} textAlign={"center"}>
          You are not authorized to view this page. Click here to go back
        </T>
      </NavLink>
    );
  }
  if (vurl === null) {
    return <Loading text="Loading Video" />;
  }
  return (
    <Container
      disableGutters
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        bgcolor: "background.default",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Appbar />
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          overflow: "auto",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {/* Title Header */}
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
          <BiotechIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <T variant="h4">
            {tut.title} - {tut.lesson}
          </T>
        </Paper>

        {/* Video Player Card */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {vurl ? (
              <CVPL url={vurl} watermark={user.email} />
            ) : (
              <Box sx={{
                width: "100%",
                aspectRatio: "16/9",
                bgcolor: "black",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ScienceIcon sx={{ fontSize: 64, color: 'grey.500' }} />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Date */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarTodayIcon color="primary" />
                <T variant="h6">
                  {tut.date.replaceAll("-", "/")}
                </T>
              </Stack>

              {/* Description */}
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DescriptionIcon color="primary" />
                  <T variant="h6">Description</T>
                </Stack>
                <T variant="body1" sx={{ pl: 4 }}>
                  {tut.description}
                </T>
              </Stack>

              {/* Delete Button */}
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  deleteTutorial(params.fname, tut.title, tut.video, tut.thumbnail);
                  nv(`/admin/${params.fname}`);
                }}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Delete Tutorial
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
