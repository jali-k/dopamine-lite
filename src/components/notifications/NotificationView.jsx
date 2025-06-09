// src/components/notifications/NotificationView.jsx
import {
    Box as Bx,
    Container,
    Paper,
    Typography as T,
    IconButton,
    Stack,
    Chip,
    Avatar,
    Divider,
    Button as B,
  } from "@mui/material";
  import {
    ArrowBack,
    Notifications,
    Schedule,
    CheckCircle,
    Circle,
  } from "@mui/icons-material";
  import { format } from "date-fns";
  import Appbar from "../Appbar";
  
  export default function NotificationView({ notification, onBack, onMarkAsRead }) {
    
    const handleMarkAsRead = async () => {
      if (!notification.isRead) {
        await onMarkAsRead(notification.id);
      }
    };
  
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
        <Paper sx={{ p: 2, m: 2, borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={onBack} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <T variant="h6" sx={{ flex: 1 }}>
              Notification Details
            </T>
            {!notification.isRead && (
              <B
                variant="contained"
                size="small"
                onClick={handleMarkAsRead}
                startIcon={<CheckCircle />}
              >
                Mark as Read
              </B>
            )}
          </Stack>
        </Paper>
  
        {/* Content */}
        <Bx sx={{ flex: 1, p: 2 }}>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            {/* Header Info */}
            <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56
                }}
              >
                <Notifications sx={{ fontSize: 28 }} />
              </Avatar>
              
              <Bx sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <T variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {notification.title}
                  </T>
                  {notification.isRead ? (
                    <Chip
                      icon={<CheckCircle fontSize="small" />}
                      label="Read"
                      color="success"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<Circle fontSize="small" />}
                      label="New"
                      color="error"
                    />
                  )}
                </Stack>
                
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    icon={<Schedule fontSize="small" />}
                    label={format(notification.createdAt, "PPpp")}
                    variant="outlined"
                    size="small"
                  />
                  {notification.isRead && notification.readAt && (
                    <T variant="caption" color="text.secondary">
                      Read on {format(notification.readAt, "PPp")}
                    </T>
                  )}
                </Stack>
              </Bx>
            </Stack>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Content */}
            <Bx 
              sx={{
                fontSize: '1.1rem',
                lineHeight: 1.7,
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                  fontWeight: 'medium',
                  '&:hover': {
                    textDecoration: 'none',
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }
                },
                '& strong': {
                  fontWeight: 'bold',
                  color: 'text.primary'
                },
                '& em': {
                  fontStyle: 'italic',
                  color: 'text.secondary'
                },
                '& p': {
                  marginBottom: '1em'
                }
              }}
              dangerouslySetInnerHTML={{ 
                __html: notification.contentHtml || notification.content.replace(/\n/g, '<br>') 
              }}
            />
            
            <Divider sx={{ my: 4 }} />
            
            {/* Footer */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <T variant="body2" color="text.secondary">
                Received: {format(notification.createdAt, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </T>
              
              <B
                variant="outlined"
                onClick={onBack}
                startIcon={<ArrowBack />}
              >
                Back to Notifications
              </B>
            </Stack>
          </Paper>
        </Bx>
      </Container>
    );
  }