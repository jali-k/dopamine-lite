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
  ListItemIcon,
  Pagination,
  Tooltip,
  Checkbox,
  Alert,
  Snackbar,
  Collapse
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
  DeleteForever,
  SelectAll,
  ClearAll,
  Person,
  Badge,
  ExpandMore,
  ExpandLess,
  Clear
} from "@mui/icons-material";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "../../contexts/UserProvider";
import { getRegularNotifications } from "../../services/backendNotificationService";
import { format } from "date-fns";
import { processMarkdownLinks } from "../../services/notificationService";

export default function NotificationHistory() {
  const { user } = useUser();

  // Safe date formatting function
  const formatDate = (date, formatString) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Keep the original value

  // Load notifications function
  const loadNotifications = async (page = 1, resetData = true) => {
    try {
      if (resetData) {
        setLoading(true);
        setNotifications([]);
      }
      
      const result = await getRegularNotifications(page, itemsPerPage);
      
      if (result.success) {
        const notificationList = result.data.map(notification => ({
          ...notification,
          // Ensure consistent date formatting
          createdAt: new Date(notification.createdAt),
          // Map backend fields to component expected fields
          targetUsers: notification.targetUsers || [],
          totalRecipients: notification.targetUsers ? notification.targetUsers.length : 0,
          readCount: notification.recipients ? notification.recipients.length : 0,
        }));
        
        if (resetData) {
          setNotifications(notificationList);
        } else {
          setNotifications(prev => [...prev, ...notificationList]);
        }
        
        // Update hasMore based on response
        setHasMore(notificationList.length === itemsPerPage);
      } else {
        throw new Error(result.error || 'Failed to load notifications');
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notification history");
      setLoading(false);
    }
  };

  // Refresh function
  const refresh = () => {
    setCurrentPage(1);
    loadNotifications(1, true);
  };

  // Load more function
  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadNotifications(nextPage, false);
  };

  // Permanent delete function (placeholder)
  const permanentlyDelete = async (id) => {
    // This would need to be implemented in the backend
    console.log('Delete notification:', id);
  };

  // Load initial data
  useEffect(() => {
    if (user?.email) {
      loadNotifications(1, true);
    }
  }, [user?.email]);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Recipients search state
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState('all'); // 'all', 'read', 'unread'

  // Delete functionality
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState({ open: false, message: "", severity: "success" });

  // Filter notifications based on search term
  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter recipients based on search query and read status
  const filteredtargetUsers = useMemo(() => {
    if (!selectedNotification?.targetUsers) {
      return [];
    }
    
    let filtered = selectedNotification.targetUsers;
    
    // Apply read status filter
    if (recipientFilter === 'read') {
      filtered = filtered.filter(user => 
        selectedNotification.recipients && selectedNotification.recipients.includes(user.email)
      );
    } else if (recipientFilter === 'unread') {
      filtered = filtered.filter(user => 
        !selectedNotification.recipients || !selectedNotification.recipients.includes(user.email)
      );
    }
    
    // Apply search filter
    if (recipientSearchQuery.trim()) {
      const query = recipientSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(targetUser =>
        targetUser.name?.toLowerCase().includes(query) ||
        targetUser.email?.toLowerCase().includes(query) ||
        targetUser.registration?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedNotification?.targetUsers, selectedNotification?.recipients, recipientSearchQuery, recipientFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Helper functions
  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);
    // Reset recipient search and filter when opening new notification
    setRecipientSearchQuery('');
    setRecipientFilter('all');
    setRecipientsExpanded(false);
    setRecipientsExpanded(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'success';
      case 'processing': return 'warning';
      case 'error': return 'error';
      case 'sent': return 'success';
      default: return 'success'; // Default to success for sent notifications
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return <CheckCircle fontSize="small" />;
      case 'processing': return <Schedule fontSize="small" />;
      case 'error': return <ErrorIcon fontSize="small" />;
      case 'sent': return <CheckCircle fontSize="small" />;
      default: return <CheckCircle fontSize="small" />; // Default to checkmark for sent notifications
    }
  };

  const calculateReadPercentage = (notification) => {
    if (!notification.totalRecipients || notification.totalRecipients === 0) return 0;
    return Math.round((notification.readCount / notification.totalRecipients) * 100);
  };

  // Helper function to highlight search text
  const highlightSearchText = (text, searchQuery) => {
    if (!searchQuery.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#FFEB3B', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Recipients helper functions
  const handleClearRecipientSearch = () => {
    setRecipientSearchQuery('');
  };

  const handleToggleRecipientsExpanded = () => {
    setRecipientsExpanded(!recipientsExpanded);
  };

  // Delete functions
  const handleDeleteClick = (notificationId) => {
    setDeletingId(notificationId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setActionLoading(true);
    try {
      const result = await permanentlyDelete(deletingId);

      if (result.success) {
        setActionAlert({
          open: true,
          message: result.message,
          severity: "success"
        });
        // Close dialog if the deleted notification was open
        if (selectedNotification?.id === deletingId) {
          setDetailsOpen(false);
          setSelectedNotification(null);
        }
      } else {
        setActionAlert({
          open: true,
          message: result.error,
          severity: "error"
        });
      }
    } catch (error) {
      setActionAlert({
        open: true,
        message: "An unexpected error occurred",
        severity: "error"
      });
    } finally {
      setActionLoading(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  // Recipients data
  const totalRecipients = selectedNotification?.recipients?.length || 0;
  const showingRecipientsCount = filteredtargetUsers.length;
  const hasRecipientSearch = recipientSearchQuery.trim().length > 0;

  return (
    <Bx>
      <Paper sx={{ p: 3, mb: 2 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <T variant="h5">Notification History</T>
        </Stack>

        {/* Search Bar */}
        <Tf
          fullWidth
          placeholder="Search notifications..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
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
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "error.light" }}>
            <T color="error">{error}</T>
          </Paper>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <Bx sx={{ textAlign: "center", py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
                  {/* Title and Delete Button */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <T variant="h6" noWrap sx={{ flex: 1, mr: 1 }}>
                      {notification.title}
                    </T>
                    
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={getStatusIcon(notification.status)}
                        label={notification.status || 'processing'}
                        size="small"
                        color={getStatusColor(notification.status)}
                      />
                    </Stack>
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
                      height: '4.2em',
                    }}
                  >
                    {notification.content}
                  </T>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <T variant="caption" color="text.secondary">
                        Sent: {formatDate(notification.createdAt, "MMM d, yyyy 'at' h:mm a")}
                      </T>
                      <Chip
                        label={`${notification.totalRecipients} recipients`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Stack>

                    <Bx>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <T variant="caption" color="text.secondary">Read Rate</T>
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
                          '& .MuiLinearProgress-bar': { borderRadius: 2 }
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

        {/* Load More */}
        {hasMore && !searchTerm && page === totalPages && (
          <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <B onClick={loadMore} disabled={loading}>
              Load More
            </B>
          </Bx>
        )}
      </Paper>

      {/* Notification Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Notification Details
          <IconButton
            aria-label="close"
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Bx>
              <Stack spacing={2}>
                {/* Basic Info with delete button */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <T variant="h6" sx={{ flex: 1 }}>{selectedNotification.title}</T>
                  </Stack>
                  
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
                    <strong>Sent:</strong> {formatDate(selectedNotification.createdAt, "PPpp")}
                  </T>
                  {selectedNotification.processedAt && (
                    <T variant="body2" color="text.secondary">
                      <strong>Processed:</strong> {formatDate(selectedNotification.processedAt, "PPpp")}
                    </T>
                  )}
                </Paper>

                {/* Content Section */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <T variant="subtitle1" gutterBottom>Content</T>
                  <Divider sx={{ mb: 2 }} />
                  <Bx 
                    sx={{
                      '& a': { color: 'primary.main', textDecoration: 'underline', transition: 'all 0.2s ease', '&:hover': { textDecoration: 'none', color: 'primary.dark' } },
                      '& strong': { fontWeight: 600, color: 'text.primary' },
                      '& em': { fontStyle: 'italic', color: 'text.secondary' },
                      '& p': { margin: '0 0 1.2em 0', lineHeight: 1.7, '&:last-child': { marginBottom: 0 }, '&:first-of-type': { marginTop: 0 } },
                      '& br': { lineHeight: 1.7 },
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      color: 'text.primary',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '8px 0',
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
                      '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '3px', '&:hover': { background: '#a1a1a1' } }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: selectedNotification.contentHtml || 
                             (selectedNotification.content ? processMarkdownLinks(selectedNotification.content) : "<em style='color: #999;'>No content available</em>") 
                    }}
                  />
                </Paper>

                {/* Enhanced Recipients Section with Search */}
                {selectedNotification.recipients && selectedNotification.recipients.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <T variant="subtitle1" fontWeight="bold">
                          Recipients
                        </T>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            icon={<CheckCircle fontSize="small" />}
                            label={`${selectedNotification.readCount || 0} Read`}
                            size="small" 
                            color={recipientFilter === 'read' ? 'success' : 'default'}
                            variant={recipientFilter === 'read' ? 'filled' : 'outlined'}
                            onClick={() => setRecipientFilter(recipientFilter === 'read' ? 'all' : 'read')}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip 
                            label={`${(selectedNotification.totalRecipients || 0) - (selectedNotification.readCount || 0)} Unread`}
                            size="small" 
                            color={recipientFilter === 'unread' ? 'warning' : 'default'}
                            variant={recipientFilter === 'unread' ? 'filled' : 'outlined'}
                            onClick={() => setRecipientFilter(recipientFilter === 'unread' ? 'all' : 'unread')}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip 
                            label="All"
                            size="small" 
                            color={recipientFilter === 'all' ? 'primary' : 'default'}
                            variant={recipientFilter === 'all' ? 'filled' : 'outlined'}
                            onClick={() => setRecipientFilter('all')}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                          icon={<Person fontSize="small" />}
                          label={`${totalRecipients} total`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        {hasRecipientSearch && (
                          <Chip 
                            icon={<Search fontSize="small" />}
                            label={`${showingRecipientsCount} found`}
                            size="small"
                            color="success"
                          />
                        )}
                      </Stack>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Search Bar */}
                    <Tf
                      fullWidth
                      size="small"
                      placeholder="Search by name, email, or registration number..."
                      value={recipientSearchQuery}
                      onChange={(e) => setRecipientSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: recipientSearchQuery && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={handleClearRecipientSearch}
                              edge="end"
                              sx={{ mr: -0.5 }}
                            >
                              <Clear fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />

                    {/* Search Results Info */}
                    {hasRecipientSearch && (
                      <Alert 
                        severity={showingRecipientsCount > 0 ? "info" : "warning"}
                        sx={{ mb: 2, py: 0.5 }}
                        variant="outlined"
                      >
                        {showingRecipientsCount > 0 ? (
                          <>
                            Found <strong>{showingRecipientsCount}</strong> recipient{showingRecipientsCount !== 1 ? 's' : ''} 
                            matching "<strong>{recipientSearchQuery}</strong>"
                          </>
                        ) : (
                          <>
                            No recipients found matching "<strong>{recipientSearchQuery}</strong>"
                          </>
                        )}
                      </Alert>
                    )}

                    {/* Recipients List */}
                    {showingRecipientsCount > 0 && (
                      <>
                        {/* Show/Hide Toggle for large lists */}
                        {totalRecipients > 10 && !hasRecipientSearch && (
                          <Stack direction="row" justifyContent="center" sx={{ mb: 1 }}>
                            <IconButton 
                              onClick={handleToggleRecipientsExpanded}
                              size="small"
                              sx={{ 
                                bgcolor: 'grey.100',
                                '&:hover': { bgcolor: 'grey.200' }
                              }}
                            >
                              {recipientsExpanded ? <ExpandLess /> : <ExpandMore />}
                              <T variant="caption" sx={{ ml: 0.5 }}>
                                {recipientsExpanded ? 'Show Less' : `Show All ${totalRecipients}`}
                              </T>
                            </IconButton>
                          </Stack>
                        )}

                        <List dense sx={{ maxHeight: recipientsExpanded || hasRecipientSearch ? 400 : 300, overflow: 'auto' }}>
                          {(recipientsExpanded || hasRecipientSearch ? filteredtargetUsers : filteredtargetUsers.slice(0, 10))
                            .map((targetUser, index) => {
                              // Check if this user has read the message
                              const hasRead = selectedNotification.recipients && 
                                selectedNotification.recipients.includes(targetUser.email);
                              
                              return (
                                <ListItem 
                                  key={`${targetUser.email}-${index}`}
                                  sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    bgcolor: hasRecipientSearch ? 'rgba(76, 175, 80, 0.04)' : 'transparent',
                                    border: hasRecipientSearch ? '1px solid rgba(76, 175, 80, 0.2)' : 'none',
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                    }
                                  }}
                                >
                                  <ListItemIcon>
                                    {hasRead ? (
                                      <CheckCircle fontSize="small" color="success" />
                                    ) : (
                                      <Email fontSize="small" color="action" />
                                    )}
                                  </ListItemIcon>
                                  
                                  <ListItemText
                                    primary={
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <span style={{ 
                                          color: hasRead ? '#2e7d32' : 'inherit',
                                          fontWeight: hasRead ? 500 : 'normal'
                                        }}>
                                          {highlightSearchText(targetUser.name || targetUser.email, recipientSearchQuery)}
                                        </span>
                                        {hasRead && (
                                          <Chip 
                                            label="Read" 
                                            size="small" 
                                            color="success" 
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: '20px' }}
                                          />
                                        )}
                                      </Stack>
                                    }
                                    secondary={
                                      <Bx>
                                        <T variant="body2" color={hasRead ? 'success.main' : 'text.secondary'} sx={{ mb: 0.5 }}>
                                          {highlightSearchText(targetUser.email, recipientSearchQuery)}
                                        </T>
                                        {targetUser.registration && (
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <Badge fontSize="small" sx={{ color: hasRead ? 'success.main' : 'text.secondary' }} />
                                            <T variant="caption" color={hasRead ? 'success.main' : 'text.secondary'}>
                                              Reg: {highlightSearchText(targetUser.registration, recipientSearchQuery)}
                                            </T>
                                          </Stack>
                                        )}
                                      </Bx>
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                        </List>

                        {/* Show more indicator */}
                        {!recipientsExpanded && !hasRecipientSearch && filteredtargetUsers.length > 10 && (
                          <Bx sx={{ textAlign: 'center', py: 1, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                            <T variant="caption" color="text.secondary">
                              Showing 10 of {filteredtargetUsers.length} {
                                recipientFilter === 'all' ? 'recipients' : 
                                recipientFilter === 'read' ? 'read recipients' : 'unread recipients'
                              }
                            </T>
                          </Bx>
                        )}
                      </>
                    )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => !actionLoading && setDeleteConfirmOpen(false)}>
        <DialogTitle>
          Permanently Delete Notification?
        </DialogTitle>
        <DialogContent>
          <T variant="body1">
            This will permanently delete the notification and all associated data. This action cannot be undone.
          </T>
          {deletingId && (
            <Bx sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 0, 0, 0.1)', borderRadius: 1 }}>
              <T variant="body2" color="text.secondary">
                <strong>Notification:</strong> {notifications.find(n => n.id === deletingId)?.title}
              </T>
            </Bx>
          )}
        </DialogContent>
        <DialogActions>
          <B onClick={() => setDeleteConfirmOpen(false)} disabled={actionLoading}>
            Cancel
          </B>
          <B 
            color="error" 
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={actionLoading}
            startIcon={<DeleteForever />}
          >
            Delete Permanently
          </B>
        </DialogActions>
      </Dialog>

      {/* Action Result Snackbar */}
      <Snackbar
        open={actionAlert.open}
        autoHideDuration={5000}
        onClose={() => setActionAlert({ ...actionAlert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setActionAlert({ ...actionAlert, open: false })} 
          severity={actionAlert.severity}
          variant="filled"
        >
          {actionAlert.message}
        </Alert>
      </Snackbar>
    </Bx>
  );
}