// src/components/notifications/NotificationList.jsx
import {
    Box as Bx,
    Card,
    CardContent,
    Typography as T,
    Stack,
    Chip,
    Avatar,
    Skeleton,
    Button as B,
    Paper,
  } from "@mui/material";
  import {
    Notifications,
    NotificationsNone,
    Circle,
    CheckCircle,
    Schedule,
  } from "@mui/icons-material";
  import { format, isToday, isYesterday } from "date-fns";
  import { extractPlainText } from "../../services/notificationService";
  
  export default function NotificationList({
    notifications,
    loading,
    hasMore,
    onLoadMore,
    onNotificationClick,
    emptyMessage = "No notifications"
  }) {
  
    const getTimeDisplay = (date) => {
      if (isToday(date)) {
        return `Today ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    };
  
    const NotificationSkeleton = () => (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <Skeleton variant="circular" width={40} height={40} />
            <Bx sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={16} />
            </Bx>
          </Stack>
        </CardContent>
      </Card>
    );
  
    if (loading && notifications.length === 0) {
      return (
        <Bx>
          {[...Array(5)].map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </Bx>
      );
    }
  
    if (notifications.length === 0) {
      return (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <NotificationsNone sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
          <T variant="h6" color="text.secondary">
            {emptyMessage}
          </T>
          <T variant="body2" color="text.secondary">
            You'll see notifications from your instructors here.
          </T>
        </Paper>
      );
    }
  
    return (
      <Bx>
        {notifications.map((notification) => (
          <Card
            key={notification.notificationId || notification.id}
            variant="outlined"
            sx={{
              mb: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderLeft: notification.isRead ? 'none' : '4px solid',
              borderLeftColor: 'error.main',
              bgcolor: notification.isRead ? 'inherit' : 'rgba(244, 67, 54, 0.02)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }
            }}
            onClick={() => onNotificationClick(notification)}
          >
            <CardContent>
              <Stack direction="row" spacing={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: notification.isRead ? 'grey.300' : '#45a049',
                    width: 48,
                    height: 48
                  }}
                >
                  <Notifications />
                </Avatar>
                
                <Bx sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <T 
                      variant="h6" 
                      sx={{ 
                        fontWeight: notification.isRead ? 'normal' : 'bold',
                        color: notification.isRead ? 'text.secondary' : 'text.primary'
                      }}
                      noWrap
                    >
                      {notification.title}
                    </T>
                    
                    <Stack direction="row" spacing={1} alignItems="center">
                      {!notification.isRead ? (
                        <Circle sx={{ color: 'error.main', fontSize: 12 }} />
                      ) : (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                      )}
                      <T variant="caption" color="text.secondary" noWrap>
                        {getTimeDisplay(notification.createdAt)}
                      </T>
                    </Stack>
                  </Stack>
                  
                  <T 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      lineHeight: 1.4,
                      mb: 1
                    }}
                  >
                    {extractPlainText(notification.contentHtml || notification.content, 150)}
                  </T>
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      icon={<Schedule fontSize="small" />}
                      label={format(notification.createdAt, 'MMM d, yyyy')}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                    {!notification.isRead && (
                      <Chip
                        label="NEW"
                        size="small"
                        color="error"
                        sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                </Bx>
              </Stack>
            </CardContent>
          </Card>
        ))}
        
        {/* Load More Button */}
        {hasMore && (
          <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <B 
              onClick={onLoadMore} 
              disabled={loading}
              variant="outlined"
              size="large"
            >
              {loading ? 'Loading...' : 'Load More Notifications'}
            </B>
          </Bx>
        )}
        
        {/* Loading More Indicator */}
        {loading && notifications.length > 0 && (
          <Bx sx={{ mt: 2 }}>
            <NotificationSkeleton />
          </Bx>
        )}
      </Bx>
    );
  }