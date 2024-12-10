import {
  Backdrop,
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress
} from "@mui/material";
import {
  BiotechOutlined as BiotechIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import Appbar from "../components/Appbar";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { collection, doc, getDoc } from "firebase/firestore";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { NavLink, useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import Loading from "../components/Loading";
import { useEffect, useState } from "react";
import NotFocus from "./NotFocus";
import { useUser } from "../contexts/UserProvider";
import CVPL from "../components/cvp";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import VideoErrorDialog from "../components/VideoErrorDialog";
import SecurityCheckUI from "../components/SecurityCheck";
import BaseHlsPlayer from "../components/BaseHlsPlayer";

export default function VideoPage() {
  const params = useParams();
  const tutsref = collection(fireDB, "folders", params.fname, "tutorials");
  const lessonref = doc(fireDB, tutsref.path, params.lname);
  const [vurl, setvurl] = useState("http://localhost:3000/uploads/myVideo-1715438432526/output.m3u8");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const emailListref = collection(
    fireDB,
    "folders",
    params.fname,
    "emailslist"
  );

  const [emails, emailLoading] = useCollectionData(emailListref);
  const { user, isAdmin } = useUser();
  const [tut, loading] = useDocumentData(lessonref);
  const [focused, setFocused] = useState(true);
  const [handler, setHandler] = useState("");
  const [securityCheck, setSecurityCheck] = useState(true);
  const [progress, setProgress] = useState(0);

  async function getHandler() {
    console.log('====================================');
    console.log("The tut" + tut);
    console.log('====================================');

    const docRef = doc(fireDB, "folders", params.fname, "tutorials", params.lname);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setHandler(docSnap.data().handler);

        console.log('====================================');
        console.log('====================================');
        console.log("Inside the get url");
        console.log('====================================');
        console.log(docSnap.data().handler);
        console.log('====================================');

        setHandler(docSnap.data().handler);
      } else {
        console.log("No such document!");
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    console.log('====================================');
    console.log("Fetching the handler");
    console.log('====================================');
    getHandler();
  }, []);

  useEffect(() => {
    console.log('====================================');
    console.log(handler);
    console.log('====================================');

    if (!handler || hasLoadError) return;

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + 1;
        if (nextProgress === 100) {
          clearInterval(interval);
          setSecurityCheck(false);
        }
        return nextProgress;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [handler, hasLoadError]);

  if (loading) {
    return <Loading text="Loading Document" />;
  }
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
  }
  if (!tut) {
    return <Loading text="Loading Tutorial Data" />;
  }
  if (isAdmin) {
    emails.push({ email: user.email });
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
        }}
        onContextMenu={(e) => {
          e.preventDefault();
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
          <BiotechIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">
            {tut.title} - {tut.lesson}
          </Typography>
        </Paper>

        {/* Video Player Card */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {vurl ? (
              <>
                <CVPL
                  url={'https://us-central1-dopamine-lite-b61bf.cloudfunctions.net/getPresignedUrl?manifest_key=index.m3u8&segment_keys=index0.ts,index1.ts&folder=' + handler + '&expiration=3600'}
                  watermark={user.email}
                  canPlay={!securityCheck && progress === 100}
                  onError={() => {
                    setShowErrorDialog(true);
                    setHasLoadError(true);
                  }}
                />
                <VideoErrorDialog
                  open={showErrorDialog}
                  onClose={() => setShowErrorDialog(false)}
                />
              </>
            ) : (
              <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }} />
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Date */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon color="primary" />
                <Typography variant="h6">
                  {tut.date.replaceAll("-", "/")}
                </Typography>
              </Stack>

              {/* Description */}
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DescriptionIcon color="primary" />
                  <Typography variant="h6">Description</Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    pl: 4,
                    color: 'text.secondary'
                  }}
                >
                  {tut.description}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(46, 125, 50, 0.4)',
        }}
        open={securityCheck || hasLoadError}
      >
        <SecurityCheckUI progress={progress} />
      </Backdrop>
    </Container>
  );
}