// src/components/personalizednotifications/PersonalizedNotificationView.jsx
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
    Message,
    Schedule,
    CheckCircle,
    Circle,
  } from "@mui/icons-material";
  import { format } from "date-fns";
  import Appbar from "../Appbar";
  import { processPersonalizedNotificationContentWithUser, processTemplateVariables } from "../../services/personalizedNotificationService";
  import { useUser } from "../../contexts/UserProvider";
  
  export default function PersonalizedNotificationView({ notification, onBack, onMarkAsRead }) {
    const { user } = useUser();
    
    const handleMarkAsRead = async () => {
      if (!notification.isRead) {
        await onMarkAsRead(notification.notificationId || notification.id);
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
              Personal Message Details
            </T>
            {!notification.isRead && (
              <B
                variant="contained"
                size="small"
                onClick={handleMarkAsRead}
                startIcon={<CheckCircle />}
                sx={{
                  bgcolor: '#9C27B0',
                  '&:hover': { bgcolor: '#7B1FA2' }
                }}
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
                  bgcolor: '#9C27B0',
                  width: 56,
                  height: 56
                }}
              >
                <Message sx={{ fontSize: 28 }} />
              </Avatar>
              
              <Bx sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <T variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {processTemplateVariables(notification.title, user, notification)}
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
                      sx={{
                        bgcolor: '#9C27B0',
                        color: 'white'
                      }}
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
                  color: '#9C27B0',
                  textDecoration: 'underline',
                  fontWeight: 'medium',
                  '&:hover': {
                    textDecoration: 'none',
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
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
                __html: processPersonalizedNotificationContentWithUser(notification.body, user, notification)
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
                sx={{ 
                  color: '#9C27B0',
                  borderColor: '#9C27B0',
                  '&:hover': {
                    bgcolor: '#9C27B0',
                    color: '#fff',
                    borderColor: '#9C27B0',
                  }
                }}
              >
                Back to Messages
              </B>
            </Stack>
          </Paper>
        </Bx>
      </Container>
    );
  }