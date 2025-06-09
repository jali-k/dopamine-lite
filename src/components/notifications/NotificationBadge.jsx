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
  } from "@mui/material";
  import {
    Notifications,
    NotificationsNone,
    MarkEmailRead,
    Visibility,
  } from "@mui/icons-material";
  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { useNotificationCount } from "../../hooks/useNotifications";
  import { useUser } from "../../contexts/UserProvider";
  import { format } from "date-fns";
  
  export default function NotificationBadge() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { unreadCount, loading } = useNotificationCount(user?.email);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
  
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
  
    if (loading) {
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
                  '0%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                  },
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
          onClick={handleClose}
          PaperProps={{
            elevation: 4,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              minWidth: 320,
              maxWidth: 400,
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
          <Bx sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Notifications />
                <T variant="subtitle1" fontWeight="bold">
                  Notifications
                </T>
              </Stack>
              {unreadCount > 0 && (
                <Chip 
                  label={`${unreadCount} new`}
                  size="small"
                  sx={{ 
                    bgcolor: 'error.main', 
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Stack>
          </Bx>
  
          <Divider />
  
          {/* Quick Preview */}
          {unreadCount > 0 ? (
            <MenuItem sx={{ py: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                <Notifications />
              </Avatar>
              <ListItemText
                primary={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                secondary="Click to view all notifications"
                primaryTypographyProps={{
                  fontWeight: 'medium',
                  color: 'success.main'
                }}
              />
            </MenuItem>
          ) : (
            <MenuItem sx={{ py: 2 }}>
              <Avatar sx={{ bgcolor: 'grey.300', mr: 2 }}>
                <NotificationsNone />
              </Avatar>
              <ListItemText
                primary="All caught up!"
                secondary="No new notifications"
                primaryTypographyProps={{
                  fontWeight: 'medium'
                }}
              />
            </MenuItem>
          )}
  
          <Divider />
  
          {/* Actions */}
          <Bx sx={{ p: 1 }}>
            <B
              fullWidth
              variant="contained"
              onClick={handleViewAll}
              startIcon={<Visibility />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                py: 1.5
              }}
            >
              View All Notifications
            </B>
          </Bx>
  
          {/* Footer */}
          <Bx sx={{ px: 2, py: 1, bgcolor: 'grey.50', textAlign: 'center' }}>
            <T variant="caption" color="text.secondary">
              Last updated: {format(new Date(), 'h:mm a')}
            </T>
          </Bx>
        </Menu>
      </>
    );
  }