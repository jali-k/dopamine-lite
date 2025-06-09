// src/pages/NotificationPage.jsx
import {
    Box as Bx,
    Container,
    Typography as T,
    Paper,
    Stack,
    Button as B,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Fab,
    Snackbar,
    Alert,
  } from "@mui/material";
  import {
    Notifications,
    MarkEmailRead,
    FilterList,
    Refresh,
    KeyboardArrowUp,
  } from "@mui/icons-material";
  import { useState, useEffect } from "react";
  import { useUser } from "../contexts/UserProvider";
  import { useNotifications } from "../hooks/useNotifications";
  import Appbar from "../components/Appbar";
  import Loading from "../components/Loading";
  import NotificationList from "../components/notifications/NotificationList";
  import NotificationView from "../components/notifications/NotificationView";
  
  export default function NotificationPage() {
    const { user, uloading } = useUser();
    const {
      notifications,
      loading,
      error,
      hasMore,
      loadMore,
      markAsRead,
      markAllAsRead,
      refresh
    } = useNotifications(user?.email, true); // Enable real-time updates
  
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [filterType, setFilterType] = useState('all'); // all, unread, read
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
  
    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
      switch (filterType) {
        case 'unread':
          return !notification.isRead;
        case 'read':
          return notification.isRead;
        default:
          return true;
      }
    });
  
    const unreadCount = notifications.filter(n => !n.isRead).length;
  
    // Handle scroll to top button
    useEffect(() => {
      const handleScroll = () => {
        setShowScrollTop(window.pageYOffset > 300);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  
    const handleNotificationClick = async (notification) => {
      setSelectedNotification(notification);
      
      // Mark as read if not already read
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    };
  
    const handleMarkAllAsRead = async () => {
      const result = await markAllAsRead();
      if (result.success) {
        setSuccessAlert({ 
          open: true, 
          message: `Marked ${result.markedCount} notifications as read` 
        });
      }
    };
  
    const handleFilterClick = (event) => {
      setFilterAnchorEl(event.currentTarget);
    };
  
    const handleFilterClose = () => {
      setFilterAnchorEl(null);
    };
  
    const handleFilterSelect = (filter) => {
      setFilterType(filter);
      handleFilterClose();
    };
  
    if (uloading) {
      return <Loading text="Loading..." />;
    }
  
    // If viewing a specific notification
    if (selectedNotification) {
      return (
        <NotificationView 
          notification={selectedNotification}
          onBack={() => setSelectedNotification(null)}
          onMarkAsRead={markAsRead}
        />
      );
    }
  
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
        
        {/* Header */}
        <Paper sx={{ p: 3, m: 2, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Notifications color="primary" sx={{ fontSize: 32 }} />
              <Bx>
                <T variant="h4" fontWeight="bold">
                  Notifications
                </T>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip 
                    label={`${notifications.length} total`}
                    size="small"
                    variant="outlined"
                  />
                  {unreadCount > 0 && (
                    <Chip 
                      label={`${unreadCount} unread`}
                      size="small"
                      color="error"
                    />
                  )}
                </Stack>
              </Bx>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <IconButton onClick={refresh} disabled={loading}>
                <Refresh />
              </IconButton>
              <IconButton onClick={handleFilterClick}>
                <FilterList />
              </IconButton>
              {unreadCount > 0 && (
                <B
                  variant="contained"
                  size="small"
                  onClick={handleMarkAllAsRead}
                  startIcon={<MarkEmailRead />}
                  sx={{ ml: 1 }}
                >
                  Mark All Read
                </B>
              )}
            </Stack>
          </Stack>
        </Paper>
  
        {/* Content */}
        <Bx sx={{ flex: 1, p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
  
          <NotificationList
            notifications={filteredNotifications}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onNotificationClick={handleNotificationClick}
            emptyMessage={
              filterType === 'unread' ? "No unread notifications" :
              filterType === 'read' ? "No read notifications" :
              "No notifications yet"
            }
          />
        </Bx>
  
        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem onClick={() => handleFilterSelect('all')}>
            <ListItemIcon>
              <Notifications fontSize="small" />
            </ListItemIcon>
            All Notifications
          </MenuItem>
          <MenuItem onClick={() => handleFilterSelect('unread')}>
            <ListItemIcon>
              <Chip 
                label={unreadCount} 
                size="small" 
                color="error" 
                sx={{ minWidth: 20, height: 20 }}
              />
            </ListItemIcon>
            Unread Only
          </MenuItem>
          <MenuItem onClick={() => handleFilterSelect('read')}>
            <ListItemIcon>
              <MarkEmailRead fontSize="small" />
            </ListItemIcon>
            Read Only
          </MenuItem>
        </Menu>
  
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Fab
            size="small"
            color="primary"
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <KeyboardArrowUp />
          </Fab>
        )}
  
        {/* Success Alert */}
        <Snackbar
          open={successAlert.open}
          autoHideDuration={3000}
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
  
  
