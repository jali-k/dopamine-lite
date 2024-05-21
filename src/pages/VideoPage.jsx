import { Backdrop, Box, Container, Typography } from "@mui/material";
import Appbar from "../components/Appbar";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { collection, doc } from "firebase/firestore";
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

export default function VideoPage() {
  const params = useParams();
  const tutsref = collection(fireDB, "folders", params.fname, "tutorials");
  const lessonref = doc(fireDB, tutsref.path, params.lname);
  // const [vurl, setvurl] = useState("");
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

  // useEffect(() => {
  //   async function geturl() {
  //     if (tut) {
  //       const vref = ref(
  //         fireStorage,
  //         `videos/${params.fname}/${params.lname}/${tut.video}`
  //       );
  //       await getDownloadURL(vref)
  //         .then((url) => {
  //           setvurl(url);
  //         })
  //         .catch((err) => {
  //           console.log(err);
  //         });
  //     }
  //   }

  //   geturl();
  // }, [tut, loading, params.fname, params.lname]);

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
          <CVPL url={vurl} watermark={user.email} />
        ) : (
          <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }} />
        )}
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
    </Container>
  );
}
