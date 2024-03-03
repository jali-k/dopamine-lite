/* eslint-disable react/prop-types */

import { Container, Grid, Typography } from "@mui/material";
import FButton from "../components/FButton";

import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";

export default function FVStuPage() {
  const foldersRef = collection(fireDB, "folders");
  const [folders, loading] = useCollectionData(foldersRef, {
    idField: "fname",
  });
  if (loading) {
    return <Loading text="Loading Files" />;
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
    >
      <Appbar />
      <Grid container columns={18} spacing={2}>
        {folders.length > 0 &&
          folders.map((file, index) => (
            <Grid
              justifyContent={"center"}
              display={"flex"}
              item
              xs={9}
              sm={6}
              md={3}
              lg={2}
              key={index}
            >
              <FButton fname={file.fname} to={`/${file.fname}`} />
            </Grid>
          ))}
      </Grid>
      {(folders === undefined || folders.length < 1) && (
        <Typography
          variant="h3"
          sx={{
            textAlign: "center",
            my: 4,
            fontSize: "24px",
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          No Files Found
        </Typography>
      )}
    </Container>
  );
}
