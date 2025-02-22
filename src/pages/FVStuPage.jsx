import React from 'react';
import { Container, Grid, Typography, Box, Tabs, Tab } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
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

  const truncateText = (text, maxLength = 30) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "..."; // Truncate and add ellipsis
    }
    return text;
  };

  const renderFolderGrid = (folders, type) => (
    <Grid
      container
      spacing={7}
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
              fname={truncateText(file.fname)} // Truncate before passing
              to={`/${type}/${file.fname}`}
              sx={{
                width: '100%',
                height: '100%',
                minHeight: '150px',
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
        backgroundColor: '#f0f0f0',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
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

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            width: '100%',
            bgcolor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            variant="fullWidth"
            TabIndicatorProps={{
              style: {
                backgroundColor: '#2e7d32' // Green indicator
              }
            }}
            sx={{
              '& .MuiTab-root': {
                minHeight: '64px',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              },
              '& .Mui-selected': {
                color: '#2e7d32 !important', // Green text for selected tab
                '& .MuiSvgIcon-root': {
                  color: '#2e7d32 !important', // Green icon for selected tab
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<VideocamIcon sx={{ mr: 1 }} />}
              label="Video Folders"
              iconPosition="start"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.3rem',
                },
              }}
            />
            <Tab
              icon={<PictureAsPdfIcon sx={{ mr: 1 }} />}
              label="PDF Folders"
              iconPosition="start"
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: '1.3rem',
                },
              }}
            />
          </Tabs>
        </Box>

        <Box
          sx={{
            height: 'calc(100vh - 112px)',
            overflowY: 'auto',
            backgroundColor: '#eeeeee',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {activeTab === 0 && renderFolderGrid(videoFolders, 'video')}
          {activeTab === 1 && renderFolderGrid(pdfFolders, 'pdf')}
        </Box>
      </Container>
    </Box>
  );
}