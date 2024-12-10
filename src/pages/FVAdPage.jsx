import React, { useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent
} from "@mui/material";
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import VideocamIcon from '@mui/icons-material/Videocam';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FButton from "../components/FButton";
import CreateFModal from "../components/CreateFModal";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { NavLink } from "react-router-dom";
import { useUser } from "../contexts/UserProvider";

// Custom styled tab component
const StyledTab = ({ icon, ...props }) => (
  <Tab
    {...props}
    icon={icon}
    sx={{
      textTransform: 'none',
      fontFamily: 'Quicksand, Arial, sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      '&.Mui-selected': {
        color: 'primary.main',
      }
    }}
  />
);

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
        p: 2,
        width: '100%',
        margin: 0,
        minHeight: '80vh'
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
          >
            <FButton
              fname={file.fname}
              to={isAdmin ? `/admin/${type}/${file.fname}` : `/${type}/${file.fname}`}
              sx={{
                height: '100%',
                minHeight: '150px',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                }
              }}
            />
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Card
            sx={{
              textAlign: 'center',
              py: 6,
              backgroundColor: 'customColors.cytoplasm',
              border: '1px dashed',
              borderColor: 'primary.main'
            }}
          >
            <CardContent>
              <ScienceIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7, mb: 2 }} />
              <Typography variant="h6" color="primary">
                No {type === 'video' ? 'Video' : 'PDF'} Folders Found
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
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

        {isAdmin && <CreateFModal activeTab={activeTab} />}

        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            variant="fullWidth"
            TabIndicatorProps={{
              style: {
                backgroundColor: '#2e7d32'
              }
            }}
          >
            <StyledTab
              icon={<VideocamIcon />}
              label="Video Folders"
            />
            <StyledTab
              icon={<PictureAsPdfIcon />}
              label="PDF Folders"
            />
          </Tabs>
        </Paper>

        <Box
          sx={{
            flexGrow: 1,
            bgcolor: activeTab === 0 ? 'customColors.cytoplasm' : 'customColors.membrane',
            transition: 'background-color 0.3s ease'
          }}
        >
          {activeTab === 0 && renderFolderGrid(videoFolders, 'video')}
          {activeTab === 1 && renderFolderGrid(pdfFolders, 'pdf')}
        </Box>
      </Container>
    </Box>
  );
}
