import React, { useState } from "react";
import { Container, Grid, Typography, Box, Tabs, Tab } from "@mui/material";
import FButton from "../components/FButton";
import CreateFModal from "../components/CreateFModal";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { NavLink } from "react-router-dom";
import { useUser } from "../contexts/UserProvider";

export default function FVAdPage() {
  const [activeTab, setActiveTab] = useState(0);

  const videoFoldersRef = collection(fireDB, "folders");
  const pdfFoldersRef = collection(fireDB, "pdfFolders");

  const [videoFolders, videoLoading] = useCollectionData(videoFoldersRef, {
    idField: "fname",
  });
  const [pdfFolders, pdfLoading] = useCollectionData(pdfFoldersRef, {
    idField: "fname",
  });

  const { isAdmin } = useUser();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (videoLoading || pdfLoading) {
    return <Loading text="Loading Files" />;
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
        }}
      >
        <Typography color={"error.main"}>
          You are not authorized to view this page. Click here to go back
        </Typography>
      </NavLink>
    );
  }

  const renderFolderGrid = (folders, type) => (
    <Grid
      container
      spacing={2}
      sx={{
        px: 2,
        minHeight: "100vh",
        backgroundColor: type === "video" ? "#eeeeee" : "#d6eaf8",
        width: "100%",
        margin: 0,
      }}
    >
      {folders && folders.length > 0 ? (
        folders.map((file, index) => (
          <Grid
            item
            xs={6}
            sm={4}
            md={3}
            lg={2}
            key={index}
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <FButton fname={file.fname} to={`/admin/${type}/${file.fname}`} />
          </Grid>
        ))
      ) : (
        <Grid item xs={12} textAlign="center">
          <Typography variant="h6" color="textSecondary">
            No {type === "video" ? "Video" : "PDF"} Folders Found
          </Typography>
        </Grid>
      )}
    </Grid>
  );

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
      <CreateFModal activeTab={activeTab} />
      <Appbar />
      <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered variant="fullWidth">
          <Tab label="Video Folders" />
          <Tab label="PDF Folders" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderFolderGrid(videoFolders, "video")}
      {activeTab === 1 && renderFolderGrid(pdfFolders, "pdf")}
    </Container>
  );
}
