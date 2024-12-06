import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { fireDB } from "../../firebaseconfig";
import Appbar from "../components/Appbar";
import Loading from "../components/Loading";

export default function PDFPage() {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    const fetchPDFData = async () => {
      try {
        const pdfRef = doc(
          fireDB,
          "pdfFolders",
          params.fname,
          "pdfs",
          params.lname
        );

        const docSnap = await getDoc(pdfRef);

        if (docSnap.exists()) {
          setPdfData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPDFData();
  }, [params.fname, params.lname]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (loading) {
    return <Loading text="Loading PDF" />;
  }

  if (!pdfData || !pdfData.url) {
    return (
      <Container>
        <Appbar />
        <Typography variant="h6" color="error">
          PDF not found
        </Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Appbar />
      <Container
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          position: 'relative'
        }}
      >
        {/* {!isFullScreen && (
          <>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {pdfData.title}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {pdfData.description}
            </Typography>
          </>
        )} */}
        <Box
          sx={{
            flexGrow: 1,
            border: '1px solid #ddd',
            borderRadius: 2,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            <IconButton
              onClick={toggleFullScreen}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)'
                }
              }}
            >
              {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          {isIframeLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <iframe
            src={pdfData.url}
            width="100%"
            height="100%"
            title={pdfData.title}
            frameBorder="0"
            onLoad={() => setIsIframeLoading(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              ...(isFullScreen && {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 1000,
                backgroundColor: 'white'
              })
            }}
          />
        </Box>
      </Container>
    </Box>
  );
}