import {
  Backdrop,
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip
} from "@mui/material";
import {
  BiotechOutlined as BiotechIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Construction as ConstructionIcon,
  HighQuality as HighQualityIcon
} from '@mui/icons-material';
import Appbar from "../components/Appbar";
import { fireDB } from "../../firebaseconfig";
import { collection, doc, getDoc } from "firebase/firestore";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import { NavLink, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserProvider";
import CVPL from "../components/cvp";
import VideoErrorDialog from "../components/VideoErrorDialog";
import SecurityCheckUI from "../components/SecurityCheck";
import { Colors } from "../themes/colours";

export default function VideoPage() {
  const params = useParams();
  const tutsref = collection(fireDB, "folders", params.fname, "tutorials");
  const lessonref = doc(fireDB, tutsref.path, params.lname);
  const [vurl, setvurl] = useState("http://localhost:3000/uploads/myVideo-1715438432526/output.m3u8");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [showRetryWarning, setShowRetryWarning] = useState(false);
  const [securityCheckComplete, setSecurityCheckComplete] = useState(false);
  
  // New state variables for video source handling
  const [videoUrl, setVideoUrl] = useState(null);
  const [isConvertedVideo, setIsConvertedVideo] = useState(false);
  const [videoFolderId, setVideoFolderId] = useState(null);

  const emailListref = collection(
    fireDB,
    "folders",
    params.fname,
    "emailslist"
  );

  const [emails, emailLoading] = useCollectionData(emailListref);
  const { user, isAdmin } = useUser();
  const [tut, loading] = useDocumentData(lessonref);
  const [handler, setHandler] = useState("");
  const [securityCheck, setSecurityCheck] = useState(true);
  const [progress, setProgress] = useState(0);

  // Function to check video status from videos collection
  const checkVideoStatus = async (tutorialHandler) => {
    try {
      console.log("Checking video status for handler:", tutorialHandler);
      const videoDocRef = doc(fireDB, "videos", tutorialHandler);
      const videoDocSnap = await getDoc(videoDocRef);
      
      if (videoDocSnap.exists()) {
        const videoData = videoDocSnap.data();
        console.log("Video document data:", videoData);
        return videoData.status === 'completed';
      } else {
        console.log("No video document found for handler:", tutorialHandler);
        return false;
      }
    } catch (error) {
      console.error("Error checking video status:", error);
      return false;
    }
  };

  // Function to determine the correct video URL based on video status
  const determineVideoUrl = async (tutData) => {
    console.log("Determining video URL. Document data:", tutData);
    
    if (!tutData.handler) {
      console.log("No handler available, cannot determine video URL");
      return;
    }

    // Check video status from videos collection
    const isNewVideo = await checkVideoStatus(tutData.handler);
    
    if (isNewVideo) {
      console.log("Using new EC2-converted video with handler:", tutData.handler);
      setIsConvertedVideo(true);
      setVideoFolderId(tutData.handler); // Using handler as folder ID for new videos
      
      // For new EC2-converted videos, use master.m3u8
      const url = `https://us-central1-dopamine-lite-b61bf.cloudfunctions.net/getPresignedUrl?manifest_key=master.m3u8&folder=videos/${tutData.handler}&expiration=28800`;
      setVideoUrl(url);
      console.log("Generated URL for new EC2-converted video:", url);
    } else {
      console.log("Using legacy video with handler:", tutData.handler);
      setIsConvertedVideo(false);
      setVideoFolderId(null);
      
      // For legacy videos, use index.m3u8
      const url = `https://us-central1-dopamine-lite-b61bf.cloudfunctions.net/getPresignedUrl?manifest_key=index.m3u8&segment_keys=index0.ts,index1.ts&folder=${tutData.handler}&expiration=28800`;
      setVideoUrl(url);
      console.log("Generated URL for legacy video:", url);
    }
  };

  async function getHandler(maxRetries = 3, retryDelay = 1000) {
    const docRef = doc(fireDB, "folders", params.fname, "tutorials", params.lname);
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const tutData = docSnap.data();
          console.log("Document data retrieved:", tutData);
          
          setHandler(tutData.handler);
          setInitialLoadAttempted(true);
          setHasLoadError(false); // Reset error state on success
          
          // Determine the correct video URL (now async)
          await determineVideoUrl(tutData);
          
          return; // Exit on success
        } else {
          console.log("No such document!");
          attempt++;
          if (attempt === maxRetries) {
            setHasLoadError(true);
            setShowErrorDialog(true);
            setInitialLoadAttempted(true);
          }
        }
      } catch (err) {
        console.log(`Attempt ${attempt + 1} failed:`, err);
        attempt++;
        if (attempt === maxRetries) {
          console.log("Max retries reached");
          setHasLoadError(true);
          setShowErrorDialog(true);
          setInitialLoadAttempted(true);
        }
      }
      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  useEffect(() => {
    getHandler();
  }, []);

  // Update video URL when tut data changes
  useEffect(() => {
    if (tut && !loading && tut.handler) {
      console.log("Tutorial data updated, refreshing video URL");
      determineVideoUrl(tut);
    }
  }, [tut, loading]);

  useEffect(() => {
    if (!handler || hasLoadError || showRetryWarning) return; // Add showRetryWarning check

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + 1;
        if (nextProgress === 100) {
          clearInterval(interval);
          setSecurityCheck(false);
          setSecurityCheckComplete(true);

          // Cleanup state
          setShowErrorDialog(false);
          setHasLoadError(false);
          setShowRetryWarning(false);
        }
        return nextProgress;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [handler, hasLoadError, showRetryWarning]); // Add showRetryWarning dependency

  const handleVideoError = (error) => {
    console.log("Video error detected:", error);
    
    if (!securityCheckComplete) {
      if (error?.type === 'retry') {
        setRetryAttempt(error.attempt);
        setShowRetryWarning(true);
        // Reset progress when showing retry warning
        setProgress(0); // Add this line
      } else if (error?.type === 'manifest') {
        setShowErrorDialog(true);
        setHasLoadError(true);
        setShowRetryWarning(false);
      }
    } else {
      console.log('Video error after security check:', error);
    }
  };

  const renderBackdropContent = () => {
    if (showRetryWarning) {
      return (
        <Box sx={{ textAlign: 'center', maxWidth: '400px', px: 2 }}>
          <Alert
            severity="warning"
            sx={{
              backgroundColor: 'rgba(251, 140, 0, 0.1)',
              border: '1px solid rgba(251, 140, 0, 0.3)',
              mb: 2,
              '& .MuiAlert-icon': {
                color: '#fb8c00'
              }
            }}
          >
            <AlertTitle>Connection Failed</AlertTitle>
            Attempt {retryAttempt} failed. Trying again...
          </Alert>
         
        </Box>
      );
    }

    return securityCheckComplete ? null : <SecurityCheckUI progress={progress} hasError={hasLoadError} />;
  };

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
      
           {/* Multi-Quality Video Feature Banner */}
           <Alert 
        severity="success" 
        icon={<BiotechIcon />}
        sx={{
          borderRadius: 0,
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.12) 0%, rgba(102, 187, 106, 0.08) 100%)',
          border: '1px solid rgba(46, 125, 50, 0.3)',
          borderLeft: 'none',
          borderRight: 'none',
          '& .MuiAlert-icon': {
            color: '#2e7d32',
            fontSize: '28px'
          },
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle sx={{ mb: 1, fontWeight: 700, color: '#1b5e20', fontSize: '1.1rem' }}>
          🎉 New Feature: Multi-Quality Video Streaming Now Available!
        </AlertTitle>
        <Typography variant="body2" sx={{ color: '#2e7d32', mb: 0.5, fontWeight: 500 }}>
          Experience adaptive streaming with multiple video quality options for new videos:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Typography variant="body2" sx={{ 
            color: '#1b5e20', 
            backgroundColor: 'rgba(46, 125, 50, 0.1)', 
            px: 1.5, 
            py: 0.5, 
            borderRadius: 1,
            fontWeight: 500
          }}>
            📉 Lower data usage with quality selection
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#1b5e20', 
            backgroundColor: 'rgba(46, 125, 50, 0.1)', 
            px: 1.5, 
            py: 0.5, 
            borderRadius: 1,
            fontWeight: 500
          }}>
            ⚡ Faster loading times
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#1b5e20', 
            backgroundColor: 'rgba(46, 125, 50, 0.1)', 
            px: 1.5, 
            py: 0.5, 
            borderRadius: 1,
            fontWeight: 500
          }}>
            📶 Adapt quality to your connection strength
          </Typography>
        </Box>
      </Alert>
      
      
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
          <BiotechIcon sx={{ fontSize: 32, color: Colors.green }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography variant="h4">
              {tut.title} - {tut.lesson}
            </Typography>
            {isConvertedVideo && (
                 <Chip
               
                 icon={<HighQualityIcon />}
                 label="Multi-Quality"
                 size="small"
                 sx={{
                   backgroundColor: '#4caf50',
                   color: 'white',
                   width: 'fit-content',
                   border: '1px solid #4caf50',
                   '& .MuiChip-icon': {
                     color: 'white'
                   }
                 }}
               />
            )}
          </Box>
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
            {handler && videoUrl ? (
              <CVPL
                url={videoUrl}
                watermark={user.email}
                canPlay={!securityCheck && progress === 100}
                onError={handleVideoError}
              />
            ) : (
              <Box sx={{ width: "100%", aspectRatio: "16/9", bgcolor: "black" }} />
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarIcon sx={{ color: Colors.green }}/>
                <Typography variant="h6">
                  {tut.date.replaceAll("-", "/")}
                </Typography>
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DescriptionIcon sx={{ color: Colors.green }} />
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

      {!securityCheckComplete && (
        <VideoErrorDialog
          open={showErrorDialog}
          onClose={() => setShowErrorDialog(false)}
        />
      )}

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(46, 125, 50, 0.4)',
          p: 3
        }}
        open={!securityCheckComplete && (securityCheck || hasLoadError || showRetryWarning)}
      >
        {renderBackdropContent()}
      </Backdrop>
    </Container>
  );
}