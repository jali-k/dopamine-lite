import {
  Backdrop,
  Box,
  Button,
  Container,
  Modal,
  Typography as T,
} from "@mui/material";
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
        <T
          variant={"h4"}
          sx={{
            fontSize: { xs: "24px", sm: "28px", md: "32px" },
          }}
        >
          {tut.title} - {tut.lesson}
        </T>
        {vurl ? (
          //   <video
          //     width="100%"
          //     controls
          //     src={vurl}
          //     preload="metadata"
          //     controlsList="nodownload"
          //     style={{
          //       backgroundColor: "black",
          //       borderRadius: "6px",
          //       maxHeight: "600px",
          //     }}
          //     onContextMenu={(e) => {
          //       e.preventDefault();
          //     }}
          //   />

          <CVPL url={vurl} watermark={user.email} />
        ) : (
          <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }} />
        )}
        <T
          variant="h5"
          sx={{
            fontSize: { xs: "16px", sm: "18px", md: "20px" },
          }}
        >
          {tut.date.replaceAll("-", "/")}
        </T>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            deleteTutorial(params.fname, tut.title, tut.video, tut.thumbnail);
            nv(`/admin/${params.fname}`);
          }}
        >
          Delete
        </Button>
        <T variant="body1">{tut.description}</T>
      </Box>
    </Container>
  );
}
