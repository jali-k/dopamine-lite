import {
    Box as Bx,
    Container,
    Grid,
    Typography as T,
    Paper,
    Card,
    CardContent,
    Button as B,
    Stack,
    Avatar,
  } from "@mui/material";
  import {
    VideoLibrary,
    PictureAsPdf,
    School,
    FormatQuote,
    Lightbulb,
    Science,
    BiotechOutlined,
    Psychology,
    EmojiObjects,
    ArrowForward,
    Warning,
    Schedule,
  } from "@mui/icons-material";
  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import Appbar from "../components/Appbar";
  import { useUser } from "../contexts/UserProvider";
  import { collection, getDocs } from "firebase/firestore";
  import { fireDB } from "../../firebaseconfig";
  import Loading from "../components/Loading";
  
  export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, uloading } = useUser();
    const [loading, setLoading] = useState(true);
    
    // Calculate maintenance date display
    const getMaintenanceDisplayText = () => {
      const today = new Date();
      const maintenanceDate = new Date(2025, 7, 8); // August 8, 2025 (month is 0-indexed)
      
      const timeDiff = maintenanceDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff === 1) {
        return "Tomorrow, Friday 08/08/2025";
      } else if (daysDiff === 0) {
        return "Today, Friday 08/08/2025";
      } else if (daysDiff < 0) {
        return "Friday 08/08/2025 (Completed)";
      } else {
        return "Friday 08/08/2025";
      }
    };
    
    // Study tips/biology facts
    const [studyTips] = useState([
      {
        id: 1,
        tip: "The human brain has a memory capacity estimated to be around 2.5 petabytes (equivalent to 3 million hours of TV shows).",
        icon: <Psychology />,
      },
      {
        id: 2,
        tip: "There are more bacteria in your body than human cells. They make up about 1-3% of your body weight!",
        icon: <BiotechOutlined />,
      },
      {
        id: 3,
        tip: "DNA from all cells in a single person, laid end to end, would stretch from Earth to the Sun and back over 600 times.",
        icon: <Science />,
      },
      {
        id: 4,
        tip: "Use the Pomodoro Technique: Study for 25 minutes, then take a 5-minute break to improve focus and retention.",
        icon: <EmojiObjects />,
      },
    ]);
  
    useEffect(() => {
      async function fetchData() {
        try {
          setLoading(true);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setLoading(false);
        }
      }
      
      if (!uloading) {
        fetchData();
      }
    }, [uloading]);
  
    if (uloading || loading) {
      return <Loading text="Loading Dashboard" />;
    }
    
    // Current tip to display (random)
    const currentTip = studyTips[Math.floor(Math.random() * studyTips.length)];
  
    return (
        <Container
        disableGutters
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f5f5f5",
        }}
      >
        <Appbar />
        
        {/* System Update Banner */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mx: 2,
            mt: 2,
            mb: 1,
            borderRadius: 2,
            background: "rgba(255, 248, 220, 0.9)",
            border: "2px solid #FFB74D",
            position: "relative",
            boxShadow: "0 2px 8px rgba(255, 183, 77, 0.15)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Warning 
              sx={{ 
                color: "#F57C00", 
                fontSize: 22,
                opacity: 0.9 
              }} 
            />
            
            <Bx sx={{ flex: 1 }}>
              <T variant="subtitle2" sx={{ fontWeight: 600, color: "#E65100", mb: 0.5 }}>
                System Maintenance Notice
              </T>
              
              <T variant="body2" sx={{ color: "text.primary", fontSize: "0.875rem", lineHeight: 1.3 }}>
                <strong>{getMaintenanceDisplayText()} (1:00 PM - 4:00 PM):</strong> You may experience 
                interruptions while watching recordings. We apologize for any inconvenience.
              </T>
            </Bx>
          </Stack>
        </Paper>
        
        {/* Welcome Banner */}
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            mb: 3,
            mt: 2,
            mx: 2,
            borderRadius: 2,
            background: "linear-gradient(45deg, #2e7d32 30%, #43a047 90%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Bx
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }}
          />
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <T variant="h4" gutterBottom fontWeight="bold">
                Welcome back, {user.displayName?.split(' ')[0] || 'Bio'}!
              </T>
              <T variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                Continue your biology learning journey. Explore our library of video lessons and Notes.
              </T>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: { xs: "none", md: "block" } }}>
              <Bx
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <School sx={{ fontSize: 120, opacity: 0.8 }} />
              </Bx>
            </Grid>
          </Grid>
        </Paper>
        {/* Quote Section */}
<Paper
  elevation={0}
  sx={{
    p: 3, 
    mx: 2,
    mb: 3,
    borderRadius: 2,
    position: "relative",
    background: "rgba(236, 246, 236, 0.5)",
    border: "1px solid rgba(46, 125, 50, 0.1)",
    overflow: "hidden",
  }}
>
  <Bx
    sx={{
      position: "absolute",
      top: 10,
      left: 20,
      fontFamily: "'Times New Roman', serif",
      fontSize: "60px",
      lineHeight: 1,
      color: "#2e7d32",
      opacity: 0.2,
    }}
  >
    "
  </Bx>
  <Bx
    sx={{
      position: "absolute",
      bottom: 10,
      right: 20,
      fontFamily: "'Times New Roman', serif",
      fontSize: "60px",
      lineHeight: 1,
      color: "#2e7d32",
      opacity: 0.2,
    }}
  >
    "
  </Bx>
  <Bx
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      py: 1,
    }}
  >
    <T
      variant="h6"
      sx={{
        fontWeight: 400,
        fontStyle: "italic",
        color: "#2e7d32",
        letterSpacing: 0.2,
      }}
    >
      "Work hard in silence. Let your success be the noise."
    </T>
    <T
      variant="body2"
      sx={{
        color: "text.secondary",
        mt: 1,
        fontSize: "0.85rem",
      }}
    >
      Daily Inspiration
    </T>
  </Bx>
</Paper>
        
        
        
        {/* Resource Cards */}
<Grid container spacing={3} sx={{ px: 2, mb: 3 }}>
  {/* Video Tutorials Card */}
  <Grid item xs={12} md={6}>
    <Paper
      onClick={() => navigate('/video')}
      sx={{
        p: 3,
        borderRadius: 2,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          '& .card-overlay': {
            opacity: 0.05,
          },
          '& .card-icon': {
            transform: 'scale(1.1) rotate(3deg)',
          }
        },
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* Hover overlay effect */}
      <Bx
        className="card-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: '#4CAF50',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      />
      
      <Stack direction="row" alignItems="center" spacing={2}>
        <VideoLibrary 
          className="card-icon"
          sx={{ 
            color: '#4CAF50', 
            fontSize: 26,
            transition: 'transform 0.3s ease',
          }} 
        />
        <T variant="h6">Videos</T>
      </Stack>
      
      <T variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
        Biology video lessons and discussions.
      </T>
      
      <B
        variant="text"
        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when button is clicked
          navigate('/video');
        }}
        sx={{
          p: 0,
          minWidth: 'auto',
          color: '#4CAF50',
          textTransform: 'uppercase',
          fontSize: '0.8rem',
          fontWeight: 500,
          zIndex: 2, // Ensure button is above the overlay
          position: 'relative',
          '&:hover': {
            background: 'none',
            opacity: 0.8,
            transform: 'translateX(3px)',
          },
          transition: 'transform 0.2s ease',
        }}
      >
        EXPLORE
      </B>
    </Paper>
  </Grid>
  
  {/* PDF Resources Card */}
  <Grid item xs={12} md={6}>
    <Paper
      onClick={() => navigate('/pdf')}
      sx={{
        p: 3,
        borderRadius: 2,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          '& .card-overlay': {
            opacity: 0.05,
          },
          '& .card-icon': {
            transform: 'scale(1.1) rotate(3deg)',
          }
        },
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* Hover overlay effect */}
      <Bx
        className="card-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: '#E53935',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      />
      
      <Stack direction="row" alignItems="center" spacing={2}>
        <PictureAsPdf 
          className="card-icon"
          sx={{ 
            color: '#E53935', 
            fontSize: 26,
            transition: 'transform 0.3s ease',
          }} 
        />
        <T variant="h6">Notes</T>
      </Stack>
      
      <T variant="body2" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
        Biology notes and reference materials.
      </T>
      
      <B
        variant="text"
        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when button is clicked
          navigate('/pdf');
        }}
        sx={{
          p: 0,
          minWidth: 'auto',
          color: '#E53935',
          textTransform: 'uppercase',
          fontSize: '0.8rem',
          fontWeight: 500,
          zIndex: 2, // Ensure button is above the overlay
          position: 'relative',
          '&:hover': {
            background: 'none',
            opacity: 0.8,
            transform: 'translateX(3px)',
          },
          transition: 'transform 0.2s ease',
        }}
      >
        EXPLORE
      </B>
    </Paper>
  </Grid>
</Grid>
        
        {/* Did You Know Section */}
        <Paper
          sx={{
            p: 3,
            mx: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255, 248, 225, 0.5)',
            border: '1px solid rgba(255, 236, 179, 0.3)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Lightbulb sx={{ color: '#F57F17', fontSize: 20 }} />
            <T variant="subtitle1" fontWeight={500}>Did You Know?</T>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 193, 7, 0.2)',
                color: '#F57F17',
                width: 36,
                height: 36,
              }}
            >
              <Science fontSize="small" />
            </Avatar>
            <T sx={{ color: 'text.primary', fontSize: '0.95rem' }}>
              DNA from all cells in a single person, laid end to end, would stretch from Earth to the Sun and back over 600 times.
            </T>
          </Stack>
        </Paper>
      </Container>
    );
  }