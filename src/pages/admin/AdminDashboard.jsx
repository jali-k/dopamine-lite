// src/pages/admin/AdminDashboard.jsx
import {
  Box as Bx,
  Container,
  Grid,
  Typography as T,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Appbar from "../../components/Appbar";
import {
  VideoLibrary,
  PictureAsPdf,
  Message,
  Folder,
  AlternateEmail,
  Notifications,
  NotificationsActive,
} from "@mui/icons-material";
import { useUser } from "../../contexts/UserProvider";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { fireDB } from "../../../firebaseconfig";
import Loading from "../../components/Loading";

export default function AdminDashboard() {
  const { isAdmin, uloading } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    videoFolders: 0,
    pdfFolders: 0,
    totalMessages: 0,
    totalNotifications: 0,
    totalPersonalizedNotifications: 0, // NEW: Personalized notifications count
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch folder counts
        const videoFoldersSnapshot = await getDocs(collection(fireDB, "folders"));
        const pdfFoldersSnapshot = await getDocs(collection(fireDB, "pdfFolders"));
        
        // Fetch message stats
        let messageCount = 0;
        try {
          const messageHistoryRef = collection(fireDB, "messageHistory");
          const messageHistorySnapshot = await getDocs(messageHistoryRef);
          messageCount = messageHistorySnapshot.size;
        } catch (error) {
          console.log("Message history may not exist yet:", error);
          // This is fine for first-time setup
        }
        
        // Fetch original notification stats
        let notificationCount = 0;
        try {
          const notificationsRef = collection(fireDB, "notifications");
          const notificationsSnapshot = await getDocs(notificationsRef);
          notificationCount = notificationsSnapshot.size;
        } catch (error) {
          console.log("Notifications may not exist yet:", error);
          // This is fine for first-time setup
        }
        
        // NEW: Fetch personalized notification stats
        let personalizedNotificationCount = 0;
        try {
          const personalizedNotificationsRef = collection(fireDB, "personalizedNotificationQueue");
          const personalizedNotificationsSnapshot = await getDocs(personalizedNotificationsRef);
          personalizedNotificationCount = personalizedNotificationsSnapshot.size;
        } catch (error) {
          console.log("Personalized notifications may not exist yet:", error);
          // This is fine for first-time setup
        }
        
        // Update stats
        setStats({
          videoFolders: videoFoldersSnapshot.size,
          pdfFolders: pdfFoldersSnapshot.size,
          totalMessages: messageCount,
          totalNotifications: notificationCount,
          totalPersonalizedNotifications: personalizedNotificationCount,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        setLoading(false);
      }
    };
    
    if (isAdmin && !uloading) {
      fetchStats();
    }
  }, [isAdmin, uloading]);

  // Show loading state while user authentication is being checked
  if (uloading) {
    return <Loading text="Checking authorization..." />;
  }

  if (loading) {
    return <Loading text="Loading Admin Dashboard" />;
  }

  if (!isAdmin) {
    return (
      <Container>
        <Appbar />
        <Bx sx={{ p: 3, textAlign: "center" }}>
          <T color="error" variant="h6">You are not authorized to access this page.</T>
        </Bx>
      </Container>
    );
  }

  const adminModules = [
    {
      title: "Video Tutorials",
      description: "Manage video tutorials and student access",
      icon: <VideoLibrary sx={{ fontSize: 60, color: "primary.main" }} />,
      path: "/admin/video",
      count: stats.videoFolders,
      countLabel: "Folders",
    },
    {
      title: "PDF Documents",
      description: "Manage PDF documents and student access",
      icon: <PictureAsPdf sx={{ fontSize: 60, color: "error.main" }} />,
      path: "/admin/pdf",
      count: stats.pdfFolders,
      countLabel: "Folders",
    },
    {
      title: "Message Center",
      description: "Send payment confirmations and notifications to students",
      icon: <Message sx={{ fontSize: 60, color: "success.main" }} />,
      path: "/admin/messages",
      count: stats.totalMessages,
      countLabel: "Messages Sent",
      // highlight: true, // Highlight this as a feature
    },
    {
      title: "Notification Center",
      description: "Send basic announcements and notifications to students",
      icon: <Notifications sx={{ fontSize: 60, color: "warning.main" }} />,
      path: "/admin/notifications",
      count: stats.totalNotifications,
      countLabel: "Notifications Sent",
      highlight: true, // Highlight this as a new feature
      isNew: true, // Mark as completely new
    },
    {
      title: "Personalized Notifications",
      description: "Send dynamic, personalized notifications with placeholders and rich formatting",
      icon: <NotificationsActive sx={{ fontSize: 60, color: "secondary.main" }} />,
      path: "/admin/personalizednotifications",
      count: stats.totalPersonalizedNotifications,
      countLabel: "Campaigns Sent",
      highlight: true, // Highlight this as a new feature
      isNew: true, // Mark as completely new
    },
    {
      title: "Email Validator",
      description: "Validate and fix student email addresses from CSV files",
      icon: <AlternateEmail sx={{ fontSize: 60, color: "info.main" }} />,
      path: "/admin/email-validator",
      count: "New",
      countLabel: "Tool",
      highlight: true, // Highlight this new feature
    },
  ];

  return (
    <Container
      disableGutters
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f4f4",
      }}
    >
      <Appbar />
      
      <Bx sx={{ p: 3 }}>
        <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
          <T variant="h4" gutterBottom>
            Admin Dashboard
          </T>
          <T variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Welcome to the admin dashboard. Manage your courses, documents, and student communications.
          </T>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Folder sx={{ fontSize: 40, mb: 1 }} />
                <T variant="h5">{stats.videoFolders + stats.pdfFolders}</T>
                <T variant="body2">Total Folders</T>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Message sx={{ fontSize: 40, mb: 1 }} />
                <T variant="h5">{stats.totalMessages}</T>
                <T variant="body2">Messages Sent</T>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Notifications sx={{ fontSize: 40, mb: 1 }} />
                <T variant="h5">{stats.totalNotifications}</T>
                <T variant="body2">Basic Notifications</T>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                <NotificationsActive sx={{ fontSize: 40, mb: 1 }} />
                <T variant="h5">{stats.totalPersonalizedNotifications}</T>
                <T variant="body2">Personalized Campaigns</T>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
        
        <T variant="h5" sx={{ mb: 3 }}>Admin Modules</T>
        
        <Grid container spacing={3}>
          {adminModules.map((module, index) => (
            <Grid item xs={12} md={4} lg={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: module.highlight ? 
                      (module.title === "Notification Center" ? '0 8px 24px rgba(255, 152, 0, 0.25)' :
                       module.title === "Personalized Notifications" ? '0 8px 24px rgba(156, 39, 176, 0.25)' :
                       module.title === "Email Validator" ? '0 8px 24px rgba(33, 150, 243, 0.25)' : 
                       '0 8px 24px rgba(76, 175, 80, 0.25)') : 
                      '0 8px 24px rgba(0, 0, 0, 0.1)',
                  },
                  border: module.highlight ? '1px solid' : 'none',
                  borderColor: module.highlight ? (
                    module.title === "Notification Center" ? 'warning.main' :
                    module.title === "Personalized Notifications" ? 'secondary.main' :
                    module.title === "Email Validator" ? 'info.main' : 
                    'success.main'
                  ) : 'transparent',
                }}
              >
                <CardActionArea
                  onClick={() => navigate(module.path)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <Bx sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                    {module.icon}
                  </Bx>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <T variant="h6">{module.title}</T>
                      {module.highlight && (
                        <Chip 
                          label={module.isNew ? "New!" : "New"} 
                          color={
                            module.title === "Notification Center" ? "warning" :
                            module.title === "Personalized Notifications" ? "secondary" :
                            module.title === "Email Validator" ? "info" : 
                            "success"
                          } 
                          size="small"
                          variant={module.isNew ? "filled" : "outlined"}
                        />
                      )}
                    </Stack>
                    <T variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {module.description}
                    </T>
                    <Chip
                      label={`${module.count} ${module.countLabel}`}
                      variant="outlined"
                      size="small"
                      color={module.highlight ? (
                        module.title === "Notification Center" ? "warning" :
                        module.title === "Personalized Notifications" ? "secondary" :
                        module.title === "Email Validator" ? "info" : 
                        "success"
                      ) : "default"}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Feature Comparison Info */}
        <Paper sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
          <T variant="h6" gutterBottom>Communication Tools Comparison</T>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack spacing={1}>
                <T variant="subtitle1" color="success.main">📧 Message Center</T>
                <T variant="body2">• Sends emails via SendGrid</T>
                <T variant="body2">• Payment confirmations</T>
                <T variant="body2">• External email delivery</T>
                <T variant="body2">• Template-based messages</T>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={1}>
                <T variant="subtitle1" color="warning.main">🔔 Notification Center</T>
                <T variant="body2">• Basic in-app notifications</T>
                <T variant="body2">• Simple announcements</T>
                <T variant="body2">• No personalization</T>
                <T variant="body2">• Standard formatting</T>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={1}>
                <T variant="subtitle1" color="secondary.main">🎯 Personalized Notifications</T>
                <T variant="body2">• Dynamic content with placeholders</T>
                <T variant="body2">• Rich text formatting & links</T>
                <T variant="body2">• CSV-based targeting</T>
                <T variant="body2">• Template management</T>
                <T variant="body2">• Real-time delivery tracking</T>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Bx>
    </Container>
  );
}