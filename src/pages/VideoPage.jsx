import { Backdrop, Box, Container, Typography } from "@mui/material";
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
import BaseHlsPlayer from "../components/BaseHlsPlayer";

export default function VideoPage() {
  const params = useParams();
  const tutsref = collection(fireDB, "folders", params.fname, "tutorials");
  const lessonref = doc(fireDB, tutsref.path, params.lname);
  const [vurl, setvurl] = useState("http://localhost:3000/uploads/myVideo-1715438432526/output.m3u8");

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
  const [securityCheck, setSecurityCheck] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('====================================');
    console.log(params.lname);
    console.log('====================================');
 
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
  }, []);

  if (loading) {
    return <Loading text="Loading Document" />;
  }
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
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
          <Typography color={"error.main"} textAlign={"center"}>
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
        bgcolor: "#f4f4f4",
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
          gap: 2,
          overflow: "scroll",
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <Typography
          variant={"h4"}
          sx={{
            fontSize: { xs: "24px", sm: "28px", md: "32px" },
          }}
        >
          {tut.title} - {tut.lesson}
        </Typography>
        {vurl ? (
          <CVPL url={'https://us-central1-video-sharing-web-81a82.cloudfunctions.net/getPresignedUrl?manifest_key=index.m3u8&segment_keys=index0.ts,index1.ts&folder=test2&expiration=3600'} watermark={user.email} />
          // https://us-central1-video-sharing-web-81a82.cloudfunctions.net/getPresignedUrl?manifest_key=index.m3u8&segment_keys=index0.ts,index1.ts&folder=myVideo&expiration=3600
        ) : (
          <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }} />
        )}
        {<BaseHlsPlayer src={'https://convertedvs.s3.amazonaws.com/myVideo/index.m3u8'} />}
        <Typography
          variant="h5"
          sx={{
            fontSize: { xs: "16px", sm: "18px", md: "20px" },
          }}
        >
          {tut.date.replaceAll("-", "/")}
        </Typography>
        <Typography variant="body1">{tut.description}</Typography>
      </Box>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        open={securityCheck}
      >
        <div style={{ width: 200, height: 200 }}>
          <CircularProgressbar
        
          value={progress}
          text={`${progress}%`}
          styles={buildStyles({
            textSize: '24px',
            textColor: '#fff',
            pathColor: '#4caf50',
            trailColor: 'rgba(255, 255, 255, 0.2)',
          })}
        />
        </div>
        <Typography
          variant="h6"
          sx={{
            mt: 2,
          }}
        >
          Performing security checks...
        </Typography>
      </Backdrop>
    </Container>
  );
}
