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
import { collection, doc, getDoc } from "firebase/firestore";
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
  const [isConvertedVideo, setIsConvertedVideo] = useState(false);
  const [videoHandler, setVideoHandler] = useState("");

  const { user, isAdmin } = useUser();

  const [tut, loading, error] = useDocumentData(lessonref);

  const nv = uNV();

  // Function to check if video is converted (new system)
  const checkVideoStatus = async (tutorialHandler) => {
    try {
      console.log("Checking video status for handler:", tutorialHandler);
      const videoDocRef = doc(fireDB, "videos", tutorialHandler);
      const videoDocSnap = await getDoc(videoDocRef);
      
      if (videoDocSnap.exists()) {
        const videoData = videoDocSnap.data();
        console.log("Video document data:", videoData);
        return videoData.status === 'completed';
      } else {
        console.log("No video document found for handler:", tutorialHandler);
        return false;
      }
    } catch (error) {
      console.error("Error checking video status:", error);
      return false;
    }
  };

  uE(() => {
    async function determineVideoType() {
      if (tut && tut.handler) {
        setVideoHandler(tut.handler);
        
        // Check if this is a new converted video
        const isNewVideo = await checkVideoStatus(tut.handler);
        
        if (isNewVideo) {
          console.log("Admin viewing new converted video:", tut.handler);
          setIsConvertedVideo(true);
          // For new videos, we don't need to set vurl as we'll use cookie auth
        } else {
          console.log("Admin viewing legacy video:", tut.handler);
          setIsConvertedVideo(false);
          
          // Legacy video - use Firebase storage
          const vref = ref(
            fireStorage,
            `videos/${params.fname}/${params.lname}/${tut.video}`
          );
          
          try {
            const url = await getDownloadURL(vref);
            setvurl(url);
          } catch (err) {
            console.log("Error getting legacy video URL:", err);
          }
        }
      }
    }

    determineVideoType();
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
  
  // For new videos, we don't wait for vurl since we use cookie auth
  if (!isConvertedVideo && vurl === null) {
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
            {videoHandler ? (
              <CVPL
                url={isConvertedVideo ? null : vurl}
                videoHandler={isConvertedVideo ? videoHandler : null}
                useCookieAuth={isConvertedVideo}
                watermark={user.email}
                canPlay={true} // Admin can always play
              />
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
