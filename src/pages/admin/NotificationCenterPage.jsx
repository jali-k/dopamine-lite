// src/pages/admin/NotificationCenterPage.jsx
import {
    Box as Bx,
    Container,
    Tab,
    Tabs,
    Typography as T,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
  } from "@mui/material";
  import { useState, useEffect } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import { 
    Notifications as NotificationsIcon,
    History,
    Add
  } from "@mui/icons-material";
  import { useUser } from "../../contexts/UserProvider";
  import Appbar from "../../components/Appbar";
  import Loading from "../../components/Loading";
  import NotificationForm from "../../components/admin/NotificationForm";
  import NotificationHistory from "../../components/admin/NotificationHistory";
  
  export default function NotificationCenterPage() {
    const { isAdmin, uloading } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
  
    // Determine active tab based on URL
    useEffect(() => {
      if (location.pathname.includes("/history")) {
        setTabValue(1);
      } else {
        setTabValue(0);
      }
    }, [location]);
  
    const handleTabChange = (event, newValue) => {
      switch (newValue) {
        case 0:
          navigate("/admin/notifications");
          break;
        case 1:
          navigate("/admin/notifications/history");
          break;
        default:
          navigate("/admin/notifications");
      }
      setTabValue(newValue);
    };
  
    const handleNotificationSent = (message) => {
      setSuccessAlert({ open: true, message });
    };
  
    // Show loading state while user authentication is being checked
    if (uloading) {
      return <Loading text="Checking authorization..." />;
    }
  
    // Check if user is admin
    if (!isAdmin) {
      return (
        <Container>
          <Appbar />
          <Bx sx={{ p: 3, textAlign: "center" }}>
            <T color="error" variant="h6">
              You are not authorized to access this page.
            </T>
          </Bx>
        </Container>
      );
    }
  
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
        
        {/* Tabs Navigation */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<Add />} 
              label="New Notification" 
              iconPosition="start"
            />
            <Tab 
              icon={<History />} 
              label="Notification History" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        
        {/* Tab Content */}
        <Bx sx={{ flex: 1, p: 2, overflowY: "auto" }}>
          {loading && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Bx>
          )}
          
          {!loading && (
            <>
              {/* New Notification Tab */}
              {tabValue === 0 && (
                <Paper sx={{ p: 3, mb: 2 }}>
                  <T variant="h5" sx={{ mb: 3 }}>
                    Create New Notification
                  </T>
                  <NotificationForm onNotificationSent={handleNotificationSent} />
                </Paper>
              )}
              
              {/* Notification History Tab */}
              {tabValue === 1 && <NotificationHistory />}
            </>
          )}
        </Bx>
        
        {/* Success Alert Snackbar */}
        <Snackbar
          open={successAlert.open}
          autoHideDuration={5000}
          onClose={() => setSuccessAlert({ ...successAlert, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSuccessAlert({ ...successAlert, open: false })} 
            severity="success"
            variant="filled"
          >
            {successAlert.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }