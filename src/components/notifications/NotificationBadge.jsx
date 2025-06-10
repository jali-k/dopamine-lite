// src/components/notifications/NotificationBadge.jsx
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography as T,
  Box as Bx,
  Divider,
  Button as B,
  Stack,
  Avatar,
  ListItemText,
  Chip,
  Skeleton,
  ListItemAvatar,
  CircularProgress,
} from "@mui/material";
import {
  Notifications,
  NotificationsNone,
  MarkEmailRead,
  Visibility,
  Circle,
  CheckCircle,
  MoreHoriz,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { useUser } from "../../contexts/UserProvider";
import { format, formatDistanceToNow } from "date-fns";
import { extractPlainText } from "../../services/notificationService";

export default function NotificationBadge() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // Fetch actual notifications (first 5 for preview)
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead
  } = useNotifications(user?.email, true); // Enable real-time updates
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const open = Boolean(anchorEl);

  // Get unread count and recent notifications
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;
  const recentNotifications = notifications.slice(0, 5); // Show 5 most recent

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/notifications');
  };

  const handleNotificationClick = async (notification) => {
  

    handleClose();
    // Navigate directly to the specific notification view
    navigate(`/notifications/${notification.id}`);
    // Mark as read if unread
    if (!notification.isRead) {
      setActionLoading(true);
      await markAsRead(notification.id);
      setActionLoading(false);
    }
    
    
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    
    setActionLoading(true);
    await markAllAsRead();
    setActionLoading(false);
  };

  if (loading && notifications.length === 0) {
    return (
      <IconButton sx={{ color: 'inherit' }}>
        <Skeleton variant="circular" width={24} height={24} />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{ 
          color: 'inherit',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 'bold',
              fontSize: '0.75rem',
              minWidth: '20px',
              height: '20px',
              animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' },
              },
            }
          }}
        >
          {unreadCount > 0 ? (
            <Notifications sx={{ fontSize: 24 }} />
          ) : (
            <NotificationsNone sx={{ fontSize: 24 }} />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            minWidth: 360,
            maxWidth: 380,
            maxHeight: 480,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Bx sx={{ p: 2, bgcolor: '#4CAF50', color: 'white' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Notifications />
              <T variant="subtitle1" fontWeight="bold">
                Notifications
              </T>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              {unreadCount > 0 && (
                <Chip 
                  label={`${unreadCount} new`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                />
              )}
              {unreadCount > 0 && (
                <IconButton
                  size="small"
                  onClick={handleMarkAllRead}
                  disabled={actionLoading}
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                  title="Mark all as read"
                >
                  {actionLoading ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <MarkEmailRead fontSize="small" />
                  )}
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Bx>

        <Divider />

        {/* Notifications List */}
        {recentNotifications.length > 0 ? (
          <Bx sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {recentNotifications.map((notification, index) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: !notification.isRead ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                  borderLeft: !notification.isRead ? '4px solid' : 'none',
                  borderLeftColor: '#4CAF50',
                  '&:hover': {
                    bgcolor: !notification.isRead ? 'rgba(76, 175, 80, 0.12)' : 'action.hover',
                  },
                  alignItems: 'flex-start',
                  minHeight: 'auto',
                }}
              >
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40,
                      bgcolor: !notification.isRead ? '#4CAF50' : 'grey.400',
                      fontSize: '0.875rem'
                    }}
                  >
                    {!notification.isRead ? (
                      <Notifications fontSize="small" />
                    ) : (
                      <CheckCircle fontSize="small" />
                    )}
                  </Avatar>
                </ListItemAvatar>
                
                <Bx sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <T 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: !notification.isRead ? 600 : 400,
                        color: !notification.isRead ? 'text.primary' : 'text.secondary',
                        fontSize: '0.9rem',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 1,
                        flex: 1,
                        pr: 1
                      }}
                    >
                      {notification.title}
                    </T>
                    
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                      {!notification.isRead && (
                        <Circle sx={{ fontSize: 8, color: '#4CAF50' }} />
                      )}
                      <T variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </T>
                    </Stack>
                  </Stack>
                  
                  <T 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                    }}
                  >
                    {"Click to view details or mark as read."}
                  </T>
                  
                  {/* Read/Unread Status */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={notification.isRead ? 'Read' : 'Unread'}
                      size="small"
                      sx={{ 
                        fontSize: '0.7rem', 
                        height: 22,
                        fontWeight: 500,
                        '& .MuiChip-label': { px: 1 },
                        ...(notification.isRead ? {
                          color: 'success.main',
                          bgcolor: 'transparent',
                          border: '1px solid',
                          borderColor: 'success.main'
                        } : {
                          bgcolor: '#4CAF50',
                          color: 'white'
                        })
                      }}
                    />
                    
                    <T variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {format(notification.createdAt, 'MMM d, h:mm a')}
                    </T>
                  </Stack>
                </Bx>
              </MenuItem>
            ))}
            
            {notifications.length > 5 && (
              <MenuItem 
                onClick={handleViewAll}
                sx={{ 
                  justifyContent: 'center', 
                  py: 1.5,
                  bgcolor: 'grey.50',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <MoreHoriz fontSize="small" />
                  <T variant="body2" fontWeight="medium">
                    {notifications.length - 5} more notifications
                  </T>
                </Stack>
              </MenuItem>
            )}
          </Bx>
        ) : (
          /* Empty State */
          <MenuItem sx={{ py: 4, justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'grey.100', width: 56, height: 56 }}>
                <NotificationsNone sx={{ color: 'grey.400', fontSize: 28 }} />
              </Avatar>
              <Bx textAlign="center">
                <T variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  No notifications yet
                </T>
                <T variant="caption" color="text.secondary">
                  You'll see new announcements and updates here
                </T>
              </Bx>
            </Stack>
          </MenuItem>
        )}

        <Divider />

        {/* Actions */}
        <Bx sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            <B
              fullWidth
              variant="contained"
              onClick={handleViewAll}
              startIcon={<Visibility />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                py: 1.2,
                fontWeight: 600,
                bgcolor: '#4CAF50',
                '&:hover': {
                  bgcolor: '#45a049'
                }
              }}
            >
              View All Notifications
            </B>
            
            {unreadCount > 0 && (
              <B
                fullWidth
                variant="outlined"
                onClick={handleMarkAllRead}
                startIcon={actionLoading ? <CircularProgress size={16} /> : <MarkEmailRead />}
                disabled={actionLoading}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 1,
                  fontWeight: 500,
                  borderColor: '#4CAF50',
                  color: '#4CAF50',
                  '&:hover': {
                    bgcolor: 'rgba(76, 175, 80, 0.04)',
                    borderColor: '#45a049'
                  }
                }}
              >
                Mark All as Read
              </B>
            )}
          </Stack>
        </Bx>

        {/* Footer */}
        <Bx sx={{ px: 2, py: 1, bgcolor: 'grey.50', textAlign: 'center' }}>
          <T variant="caption" color="text.secondary">
            {loading ? 'Updating...' : `Last updated: ${format(new Date(), 'h:mm a')}`}
          </T>
        </Bx>
      </Menu>
    </>
  );
}