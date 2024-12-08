import React from 'react';
import { Container, Grid, Typography, Box, Tabs, Tab } from '@mui/material';
import FButton from "../components/FButton";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";

export default function FVStuPage() {
  const [activeTab, setActiveTab] = React.useState(0);

  const videoFoldersRef = collection(fireDB, "folders");
  const pdfFoldersRef = collection(fireDB, "pdfFolders");

  const [videoFolders, videoLoading] = useCollectionData(videoFoldersRef, {
    idField: "fname",
  });

  const [pdfFolders, pdfLoading] = useCollectionData(pdfFoldersRef, {
    idField: "fname",
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (videoLoading || pdfLoading) {
    return <Loading text="Loading Files" />;
  }

  const renderFolderGrid = (folders, type) => (
    <Grid
      container
      spacing={2}
      sx={{
        px: 2,
        width: '100%',
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
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <FButton
              fname={file.fname}
              to={`/${type}/${file.fname}`}
              sx={{
                width: '100%',
                height: '100%',
                minHeight: '150px', // Or a fixed height
              }}
            />
          </Grid>
        ))
      ) : (
        <Grid item xs={12} textAlign="center">
          <Typography variant="h6" color="textSecondary">
            No {type === 'video' ? 'Video' : 'PDF'} Folders Found
          </Typography>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box
      sx={{
        backgroundColor: '#f0f0f0', // Full page background color
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden', // Prevent scroll bars
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          width: '100%',
          padding: 0,
        }}
      >
        <Appbar />

        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            variant="fullWidth"
          >
            <Tab label="Video Folders" />
            <Tab label="PDF Folders" />
          </Tabs>
        </Box>

        {/* Full height wrapper for each tab */}
        <Box
          sx={{
            height: '100vh', // Ensure the content fills the viewport height
            overflowY: 'auto', // Enable scrolling for content if needed
            backgroundColor: activeTab === 0 ? '#eeeeee' : '#d6eaf8', // Different background for each tab
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 0 && renderFolderGrid(videoFolders, 'video')}
          {activeTab === 1 && renderFolderGrid(pdfFolders, 'pdf')}
        </Box>
      </Container>
    </Box>
  );
}
