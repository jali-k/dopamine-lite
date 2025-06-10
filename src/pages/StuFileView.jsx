import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Alert,
  AlertTitle
} from "@mui/material";
import {
  Science as ScienceIcon,
  BiotechOutlined as BiotechIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';
import { collection, doc, getDoc } from "firebase/firestore";
import { NavLink, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import VCad from "../components/VCad";
import { useUser } from "../contexts/UserProvider";
import { Colors } from "../themes/colours";

export default function StuFileView() {
  const params = useParams();
  const tutorialref = collection(fireDB, "folders", params.fname, "tutorials");
  const emailListref = collection(
    fireDB,
    "folders",
    params.fname,
    "emailslist"
  );

  const { user, isAdmin } = useUser();

  const [tuts, loading] = useCollectionData(tutorialref);
  const [emails, emailLoading] = useCollectionData(emailListref);
  const [enrichedTuts, setEnrichedTuts] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch video statuses for each tutorial
  useEffect(() => {
    const fetchVideoStatuses = async () => {
      if (!tuts || tuts.length === 0) return;
      
      setStatusLoading(true);
      try {
        const enrichedTutorials = await Promise.all(
          tuts.map(async (tut) => {
            // If tutorial has a handler, check if it exists in videos collection
            if (tut.handler) {
              try {
                const videoDocRef = doc(fireDB, "videos", tut.handler);
                const videoDoc = await getDoc(videoDocRef);
                
                if (videoDoc.exists()) {
                  // Handler exists AND found in videos collection = New video with conversion
                  const videoData = videoDoc.data();
                  return {
                    ...tut,
                    videoStatus: videoData.status || 'processing',
                    isLegacyVideo: false
                  };
                } else {
                  // Handler exists but NOT found in videos collection = Legacy video
                  return {
                    ...tut,
                    videoStatus: null,
                    isLegacyVideo: true
                  };
                }
              } catch (error) {
                console.error(`Error fetching video status for ${tut.handler}:`, error);
                // Error fetching - treat as legacy
                return {
                  ...tut,
                  videoStatus: null,
                  isLegacyVideo: true
                };
              }
            }
            
            // No handler - this is also a legacy video
            return {
              ...tut,
              videoStatus: null,
              isLegacyVideo: true
            };
          })
        );
        
        setEnrichedTuts(enrichedTutorials);
      } catch (error) {
        console.error('Error enriching tutorials with video status:', error);
        // Fallback to treating all as legacy videos
        setEnrichedTuts(tuts.map(tut => ({ ...tut, videoStatus: null, isLegacyVideo: true })));
      } finally {
        setStatusLoading(false);
      }
    };

    fetchVideoStatuses();
  }, [tuts]);

  if (loading) {
    return <Loading text="Loading Tutorials" />;
  }
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
  }
  if (statusLoading) {
    return <Loading text="Loading Video Status" />;
  }

  if (isAdmin) {
    emails.push({ email: user.email });
    console.log("giving access to admin: ", user.email);
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

  return (
    <Container
      disableGutters
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f5f5",// The Background
        position: "relative",
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
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: 2,
          py: 2,
          overflowY: "auto",
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
          <Typography variant="h4">
            {params.fname} Tutorials
          </Typography>
        </Paper>

        {/* Tutorials Grid */}
        <Grid
          container
          spacing={2}
          sx={{
            position: 'relative'
          }}
        >
          {enrichedTuts.length > 0 ? (
            enrichedTuts.map((tut, index) => (
              <Grid
                item
                key={index}
                xs={12}
                sm={6}
                md={4}
              >
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                    }
                  }}
                >
                  <VCad tut={{ ...tut, fpath: params.fname }} />
                </Card>
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
                  <ScienceIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                      opacity: 0.7,
                      mb: 2
                    }}
                  />
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                      fontFamily: 'Quicksand, Arial, sans-serif',
                      fontWeight: 500
                    }}
                  >
                    No Tutorials Found
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}