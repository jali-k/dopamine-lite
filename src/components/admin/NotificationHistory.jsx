// src/components/admin/NotificationHistory.jsx
import {
    Box as Bx,
    Paper,
    Typography as T,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button as B,
    Chip,
    Stack,
    InputAdornment,
    TextField as Tf,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    LinearProgress,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Pagination,
    Tooltip,
  } from "@mui/material";
  import {
    RemoveRedEye,
    Search,
    CheckCircle,
    Schedule,
    Error as ErrorIcon,
    Close,
    Email,
    Notifications,
    TrendingUp,
  } from "@mui/icons-material";
  import { useState, useEffect } from "react";
  import { useUser } from "../../contexts/UserProvider";
  import { useNotificationHistory } from "../../hooks/useNotifications";
  import { format } from "date-fns";
  
  export default function NotificationHistory() {
    const { user } = useUser();
    const {
      notifications,
      loading,
      error,
      hasMore,
      loadMore,
      refresh
    } = useNotificationHistory(user.email);
  
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;
  
    // Filter notifications based on search term
    const filteredNotifications = notifications.filter(notification =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Pagination
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
  
    const handleViewDetails = (notification) => {
      setSelectedNotification(notification);
      setDetailsOpen(true);
    };
  
    const getStatusColor = (status) => {
      switch (status) {
        case 'processed':
          return 'success';
        case 'processing':
          return 'warning';
        case 'error':
          return 'error';
        default:
          return 'default';
      }
    };
  
    const getStatusIcon = (status) => {
      switch (status) {
        case 'processed':
          return <CheckCircle fontSize="small" />;
        case 'processing':
          return <Schedule fontSize="small" />;
        case 'error':
          return <ErrorIcon fontSize="small" />;
        default:
          return <Schedule fontSize="small" />;
      }
    };
  
    const calculateReadPercentage = (notification) => {
      if (!notification.totalRecipients || notification.totalRecipients === 0) return 0;
      return Math.round((notification.readCount / notification.totalRecipients) * 100);
    };
  
    return (
      <Bx>
        <Paper sx={{ p: 3, mb: 2 }}>
          <T variant="h5" gutterBottom>Notification History</T>
  
          {/* Search Bar */}
          <Tf
            fullWidth
            placeholder="Search notifications..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page when searching
            }}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
  
          {loading && <LinearProgress sx={{ mb: 2 }} />}
  
          {error && (
            <Paper
              variant="outlined"
              sx={{ p: 2, mb: 2, bgcolor: "error.light" }}
            >
              <T color="error">{error}</T>
            </Paper>
          )}
  
          {!loading && filteredNotifications.length === 0 && (
            <Bx
              sx={{
                textAlign: "center",
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
              {searchTerm ? (
                <T variant="body1" color="text.secondary">
                  No notifications match your search criteria
                </T>
              ) : (
                <T variant="body1" color="text.secondary">
                  No notifications sent yet. Create your first notification to see it here.
                </T>
              )}
            </Bx>
          )}
  
          <Grid container spacing={2}>
            {paginatedNotifications.map((notification) => (
              <Grid item xs={12} md={6} key={notification.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <T variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>
                        {notification.title}
                      </T>
                      <Chip
                        icon={getStatusIcon(notification.status)}
                        label={notification.status || 'processing'}
                        size="small"
                        color={getStatusColor(notification.status)}
                      />
                    </Stack>
  
                    <T
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        lineHeight: 1.4,
                        height: '4.2em', // 3 lines * 1.4 line height
                      }}
                    >
                      {notification.content}
                    </T>
  
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <T variant="caption" color="text.secondary">
                          Sent: {format(notification.createdAt, "MMM d, yyyy 'at' h:mm a")}
                        </T>
                        <Chip
                          label={`${notification.totalRecipients} recipients`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Stack>
  
                      {/* Read Statistics */}
                      <Bx>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <T variant="caption" color="text.secondary">
                            Read Rate
                          </T>
                          <T variant="caption" color="text.secondary">
                            {notification.readCount || 0} / {notification.totalRecipients} ({calculateReadPercentage(notification)}%)
                          </T>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={calculateReadPercentage(notification)}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Bx>
                    </Stack>
                  </CardContent>
  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                    <B
                      startIcon={<RemoveRedEye />}
                      onClick={() => handleViewDetails(notification)}
                      size="small"
                      variant="outlined"
                    >
                      View Details
                    </B>
  
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Total Recipients">
                        <Chip
                          icon={<Email fontSize="small" />}
                          label={notification.totalRecipients}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                      <Tooltip title="Read Count">
                        <Chip
                          icon={<TrendingUp fontSize="small" />}
                          label={notification.readCount || 0}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
  
          {/* Pagination */}
          {totalPages > 1 && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Bx>
          )}
  
          {/* Load More for infinite scrolling */}
          {hasMore && !searchTerm && page === totalPages && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <B onClick={loadMore} disabled={loading}>
                Load More
              </B>
            </Bx>
          )}
        </Paper>
  
        {/* Notification Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Notification Details
            <IconButton
              aria-label="close"
              onClick={() => setDetailsOpen(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedNotification && (
              <Bx>
                <Stack spacing={2}>
                  {/* Basic Info */}
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <T variant="h6" gutterBottom>{selectedNotification.title}</T>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(selectedNotification.status)}
                        label={selectedNotification.status || 'processing'}
                        color={getStatusColor(selectedNotification.status)}
                      />
                      <Chip
                        label={`${selectedNotification.totalRecipients} recipients`}
                        variant="outlined"
                      />
                      <Chip
                        label={`${selectedNotification.readCount || 0} read (${calculateReadPercentage(selectedNotification)}%)`}
                        color="success"
                        variant="outlined"
                      />
                    </Stack>
                    <T variant="body2" color="text.secondary">
                      <strong>Sent:</strong> {format(selectedNotification.createdAt, "PPpp")}
                    </T>
                    {selectedNotification.processedAt && (
                      <T variant="body2" color="text.secondary">
                        <strong>Processed:</strong> {format(selectedNotification.processedAt, "PPpp")}
                      </T>
                    )}
                  </Paper>
  
                  {/* Content */}
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <T variant="subtitle1" gutterBottom>Content</T>
                    <Divider sx={{ mb: 2 }} />
                    <Bx 
                      sx={{
                        '& a': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                        '& strong': {
                          fontWeight: 'bold'
                        },
                        '& em': {
                          fontStyle: 'italic'
                        }
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: selectedNotification.contentHtml || selectedNotification.content 
                      }}
                    />
                  </Paper>
  
                  {/* Recipients Sample */}
                  {selectedNotification.recipients && selectedNotification.recipients.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <T variant="subtitle1" gutterBottom>
                        Recipients ({selectedNotification.recipients.length})
                      </T>
                      <Divider sx={{ mb: 2 }} />
                      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {selectedNotification.recipients.slice(0, 10).map((recipient, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                <Email fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={recipient.name}
                              secondary={
                                <>
                                  {recipient.email}
                                  {recipient.registration && (
                                    <span style={{ display: 'block' }}>
                                      Reg: {recipient.registration}
                                    </span>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                        {selectedNotification.recipients.length > 10 && (
                          <ListItem>
                            <ListItemText
                              primary={`... and ${selectedNotification.recipients.length - 10} more recipients`}
                              sx={{ textAlign: 'center', fontStyle: 'italic' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Paper>
                  )}
                </Stack>
              </Bx>
            )}
          </DialogContent>
          <DialogActions>
            <B onClick={() => setDetailsOpen(false)}>Close</B>
          </DialogActions>
        </Dialog>
      </Bx>
    );
  }