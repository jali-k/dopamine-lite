// PersonalizedNotificationHistory.jsx
// This component shows admins all sent notifications with optimization for large datasets

import {
    Box as Bx,
    Paper,
    Typography as T,
    Divider,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button as B,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    IconButton,
    InputAdornment,
    TextField as Tf,
    LinearProgress,
    CircularProgress,
    Alert,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Menu,
    Snackbar,
    Tooltip
  } from "@mui/material";
  import {
    Email,
    History,
    RemoveRedEye,
    Search,
    CheckCircle,
    ErrorOutline,
    Warning,
    Send,
    Close,
    FilterList,
    Refresh,
    Delete,
    DeleteForever,
    DeleteSweep,
    SelectAll,
    MoreVert,
    CheckBox,
    CheckBoxOutlineBlank
  } from "@mui/icons-material";
  import { useState, useEffect, useCallback } from "react";
  import { format } from "date-fns";
  import PersonalizedNotificationPreview from "./PersonalizedNotificationPreview";
  import { getPersonalizedNotifications, getCombinedNotifications } from "../../services/backendNotificationService";
  
  export default function PersonalizedNotificationHistory() {
    
    // ==================== HELPER FUNCTIONS ====================
    
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
    
    // ==================== STATE MANAGEMENT ====================
    
    // Main data states
    const [notifications, setNotifications] = useState([]); // List of notifications
    const [loading, setLoading] = useState(true); // Initial loading
    const [loadingMore, setLoadingMore] = useState(false); // Loading more pages
    const [deleting, setDeleting] = useState(false); // Deletion in progress
    const [error, setError] = useState(null);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 12; // Show 12 notifications per page
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, completed, processing, failed
    const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
    
    // Selection states for bulk operations
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    
    // Dialog states
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [showAllRecipients, setShowAllRecipients] = useState(false);
    const [recipientFilter, setRecipientFilter] = useState('all'); // 'all', 'read', 'unread'
    const [confirmResendOpen, setConfirmResendOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
    const [deleteOldDialogOpen, setDeleteOldDialogOpen] = useState(false);
    const [deleteOldDays, setDeleteOldDays] = useState(30);
    
    // Menu states
    const [menuAnchor, setMenuAnchor] = useState(null);
    
    // Success/error messages
    const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
  
    // ==================== DATA LOADING FUNCTIONS ====================
    
    /**
     * Load notifications with pagination and filters
     */
    const loadNotifications = useCallback(async (page = 1, resetData = true) => {
      try {
        if (resetData) {
          setLoading(true);
          setNotifications([]);
          setSelectedNotifications(new Set());
          setSelectAll(false);
        } else {
          setLoadingMore(true);
        }
        
        console.log(`Loading notifications for page ${page}`);
        
        // Use the new backend endpoint
        const result = await getPersonalizedNotifications(page, ITEMS_PER_PAGE);
        
        if (result.success) {
          const notificationList = result.data.map(notification => ({
            ...notification,
            // Convert timestamps safely with validation
            queuedAt: notification.createdAt ? new Date(notification.createdAt) : 
                     notification.queuedAt ? new Date(notification.queuedAt) : new Date(),
            processedAt: notification.processedAt ? new Date(notification.processedAt) : null,
            completedAt: notification.completedAt ? new Date(notification.completedAt) : null,
            // Map backend fields to component expected fields
            body: notification.content || notification.body || "No content",
            totalTargets: notification.targetUsers ? notification.targetUsers.length : 0,
            processedCount: notification.recipients ? notification.recipients.length : 0,
          }));

          console.log(`Loaded notifications for page ${page}:`, notificationList);

          // Update state
          if (resetData) {
            setNotifications(notificationList);
          } else {
            setNotifications(prev => [...prev, ...notificationList]);
          }
          
          // Update pagination info from meta
          if (result.meta) {
            setTotalCount(result.meta.count || notificationList.length);
            setTotalPages(Math.ceil((result.meta.count || notificationList.length) / ITEMS_PER_PAGE));
          }
        } else {
          throw new Error(result.error || 'Failed to load notifications');
        }
        
        setLoading(false);
        setLoadingMore(false);
        
      } catch (err) {
        console.error("Error loading notifications:", err);
        setError("Failed to load notification history");
        setLoading(false);
        setLoadingMore(false);
      }
    }, [statusFilter, dateFilter, notifications.length]);
  
    /**
     * Search through notifications
     */
    const searchNotifications = useCallback(async () => {
      if (!searchTerm.trim()) {
        // If no search term, reload normal data
        await loadNotifications(1, true);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Searching for: ${searchTerm}`);
        
        const q = query(
          collection(fireDB, "personalizedNotificationQueue"),
          orderBy("queuedAt", "desc"),
          limit(50) // Limit search results for performance
        );
        
        const querySnapshot = await getDocs(q);
        const allNotifications = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allNotifications.push({
            id: doc.id,
            ...data,
            queuedAt: data.queuedAt?.toDate() || new Date(),
            processedAt: data.processedAt?.toDate() || null,
            completedAt: data.completedAt?.toDate() || null,
          });
        });
        
        // Filter by search term (client-side for now)
        const filteredNotifications = allNotifications.filter(notification =>
          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.body?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        setNotifications(filteredNotifications);
        setTotalCount(filteredNotifications.length);
        setTotalPages(Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));
        setCurrentPage(1);
        setSelectedNotifications(new Set());
        setSelectAll(false);
        setLoading(false);
        
      } catch (err) {
        console.error("Error searching notifications:", err);
        setError("Failed to search notifications");
        setLoading(false);
      }
    }, [searchTerm, loadNotifications]);
  
    // ==================== DELETION FUNCTIONS ====================
    
    /**
     * Delete single notification
     */
    const handleDeleteNotification = async (notificationId) => {
      try {
        setDeleting(true);
        
        // Delete from Firestore
        const notificationRef = doc(fireDB, "personalizedNotificationQueue", notificationId);
        await deleteDoc(notificationRef);
        
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setSelectedNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
        
        setSuccessAlert({ 
          open: true, 
          message: "Notification deleted successfully!" 
        });
        
        setConfirmDeleteOpen(false);
        setDetailDialogOpen(false);
        
      } catch (err) {
        console.error("Error deleting notification:", err);
        setError("Failed to delete notification");
      } finally {
        setDeleting(false);
      }
    };
    
    /**
     * Delete multiple selected notifications
     */
    const handleBulkDelete = async () => {
      if (selectedNotifications.size === 0) return;
      
      try {
        setDeleting(true);
        
        // Delete notifications in batches
        const notificationIds = Array.from(selectedNotifications);
        const batchSize = 100;
        
        for (let i = 0; i < notificationIds.length; i += batchSize) {
          const batch = notificationIds.slice(i, i + batchSize);
          
          // Delete each notification in the batch
          await Promise.all(
            batch.map(id => {
              const notificationRef = doc(fireDB, "personalizedNotificationQueue", id);
              return deleteDoc(notificationRef);
            })
          );
        }
        
        // Update local state
        setNotifications(prev => 
          prev.filter(n => !selectedNotifications.has(n.id))
        );
        setSelectedNotifications(new Set());
        setSelectAll(false);
        setSelectionMode(false);
        
        setSuccessAlert({ 
          open: true, 
          message: `Successfully deleted ${notificationIds.length} notifications!` 
        });
        
        setConfirmBulkDeleteOpen(false);
        
      } catch (err) {
        console.error("Error deleting notifications:", err);
        setError("Failed to delete notifications");
      } finally {
        setDeleting(false);
      }
    };
    
    /**
     * Delete all notifications
     */
    const handleDeleteAll = async () => {
      try {
        setDeleting(true);
        
        // Get all notifications and delete in batches
        let hasMore = true;
        let totalDeleted = 0;
        
        while (hasMore) {
          const q = query(
            collection(fireDB, "personalizedNotificationQueue"),
            orderBy("queuedAt", "desc"),
            limit(100)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            hasMore = false;
            break;
          }
          
          // Delete this batch
          await Promise.all(
            querySnapshot.docs.map(doc => deleteDoc(doc.ref))
          );
          
          totalDeleted += querySnapshot.docs.length;
          
          // If we got less than the limit, we're done
          if (querySnapshot.docs.length < 100) {
            hasMore = false;
          }
        }
        
        // Clear local state
        setNotifications([]);
        setSelectedNotifications(new Set());
        setSelectAll(false);
        setSelectionMode(false);
        
        setSuccessAlert({ 
          open: true, 
          message: `Successfully deleted all ${totalDeleted} notifications!` 
        });
        
        setConfirmDeleteAllOpen(false);
        
      } catch (err) {
        console.error("Error deleting all notifications:", err);
        setError("Failed to delete all notifications");
      } finally {
        setDeleting(false);
      }
    };
    
    /**
     * Delete old notifications
     */
    const handleDeleteOld = async () => {
      try {
        setDeleting(true);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - deleteOldDays);
        
        const q = query(
          collection(fireDB, "personalizedNotificationQueue"),
          where("queuedAt", "<", cutoffDate),
          limit(500)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setSuccessAlert({ 
            open: true, 
            message: `No notifications older than ${deleteOldDays} days found.` 
          });
          setDeleteOldDialogOpen(false);
          setDeleting(false);
          return;
        }
        
        // Delete old notifications
        await Promise.all(
          querySnapshot.docs.map(doc => deleteDoc(doc.ref))
        );
        
        // Refresh the list
        await loadNotifications(1, true);
        
        setSuccessAlert({ 
          open: true, 
          message: `Successfully deleted ${querySnapshot.docs.length} notifications older than ${deleteOldDays} days!` 
        });
        
        setDeleteOldDialogOpen(false);
        
      } catch (err) {
        console.error("Error deleting old notifications:", err);
        setError("Failed to delete old notifications");
      } finally {
        setDeleting(false);
      }
    };
  
    // ==================== SELECTION FUNCTIONS ====================
    
    /**
     * Toggle selection mode
     */
    const toggleSelectionMode = () => {
      setSelectionMode(!selectionMode);
      setSelectedNotifications(new Set());
      setSelectAll(false);
    };
    
    /**
     * Toggle individual notification selection
     */
    const toggleNotificationSelection = (notificationId) => {
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        if (newSet.has(notificationId)) {
          newSet.delete(notificationId);
        } else {
          newSet.add(notificationId);
        }
        return newSet;
      });
    };
    
    /**
     * Toggle select all
     */
    const toggleSelectAll = () => {
      if (selectAll) {
        setSelectedNotifications(new Set());
        setSelectAll(false);
      } else {
        const currentPageData = getCurrentPageData();
        setSelectedNotifications(new Set(currentPageData.map(n => n.id)));
        setSelectAll(true);
      }
    };
  
    // ==================== SIDE EFFECTS ====================
    
    /**
     * Load initial data when component mounts
     */
    useEffect(() => {
      loadNotifications(1, true);
    }, []); // Only run once when component mounts
    
    /**
     * Reload data when filters change
     */
    useEffect(() => {
      if (statusFilter !== "all" || dateFilter !== "all") {
        loadNotifications(1, true);
      }
    }, [statusFilter, dateFilter]);
  
    // ==================== EVENT HANDLERS ====================
    
    /**
     * Handle page changes
     */
    const handlePageChange = (event, newPage) => {
      setCurrentPage(newPage);
      
      // If we don't have data for this page, load it
      const startIndex = (newPage - 1) * ITEMS_PER_PAGE;
      if (startIndex >= notifications.length) {
        loadNotifications(newPage, false);
      }
    };
  
    /**
     * Handle search input with debouncing
     */
    const handleSearchChange = (event) => {
      setSearchTerm(event.target.value);
    };
  
    /**
     * Execute search when user presses Enter or clicks search
     */
    const handleSearchSubmit = () => {
      searchNotifications();
    };
  
    /**
     * Clear search and reload all data
     */
    const handleClearSearch = () => {
      setSearchTerm("");
      loadNotifications(1, true);
    };
  
    const handleViewNotification = (notification) => {
      setSelectedNotification(notification);
      setShowAllRecipients(false); // Reset to show only first 10 recipients
      setRecipientFilter('all'); // Reset filter to show all recipients
      
      // Debug: Let's see the structure of the data
      console.log('Notification data:', notification);
      console.log('Target Users:', notification.targetUsers);
      console.log('Recipients (who read):', notification.recipients);
      
      setDetailDialogOpen(true);
    };
  
    /**
     * Resend notification
     */
    const handleResendNotification = async () => {
      if (!selectedNotification) return;
      
      try {
        setConfirmResendOpen(false);
        setDetailDialogOpen(false);
        setLoading(true);
        
        console.log("Resending notification:", selectedNotification.id);
        
        // Create a new queue document based on the original
        const resendData = {
          title: selectedNotification.title,
          body: selectedNotification.body,
          recipients: selectedNotification.targetUsers || [],
          status: "queued",
          queuedAt: serverTimestamp(),
          createdBy: "admin", // TODO: Replace with actual admin email
          totalTargets: selectedNotification.totalTargets || 0,
          processedCount: 0,
          originalNotificationId: selectedNotification.id // Reference to original
        };
        
        // Add to queue - this triggers the Cloud Function
        await addDoc(collection(fireDB, "personalizedNotificationQueue"), resendData);
        
        setSuccessAlert({ 
          open: true, 
          message: `Notification queued for resending to ${resendData.totalTargets} recipients!` 
        });
        
        // Reload the list to show the new notification
        await loadNotifications(1, true);
        
      } catch (err) {
        console.error("Error resending notification:", err);
        setError("Failed to resend notification");
        setLoading(false);
      }
    };
  
    /**
     * Refresh the notification list
     */
    const handleRefresh = () => {
      loadNotifications(1, true);
    };
  
    // ==================== UTILITY FUNCTIONS ====================
    
    /**
     * Get status color for chips
     */
    const getStatusColor = (status) => {
      switch (status) {
        case "completed":
          return "success";
        case "processing":
          return "info";
        case "failed":
          return "error";
        case "queued":
          return "warning";
        default:
          return "default";
      }
    };
  
    /**
     * Get status icon
     */
    const getStatusIcon = (status) => {
      switch (status) {
        case "completed":
          return <CheckCircle fontSize="small" />;
        case "processing":
          return <CircularProgress size={16} />;
        case "failed":
          return <ErrorOutline fontSize="small" />;
        case "queued":
          return <Warning fontSize="small" />;
        default:
          return null;
      }
    };
  
    /**
     * Calculate display data for current page
     */
    const getCurrentPageData = () => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return notifications.slice(startIndex, endIndex);
    };
  
    // ==================== RENDER COMPONENT ====================
    
    return (
      <Bx>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <T variant="h5">Notification History</T>
            
            <Stack direction="row" spacing={1}>
              {/* Selection Mode Toggle */}
              <Tooltip title={selectionMode ? "Exit selection mode" : "Enter selection mode"}>
                <IconButton 
                  onClick={toggleSelectionMode}
                  color={selectionMode ? "primary" : "default"}
                >
                  {selectionMode ? <CheckBox /> : <CheckBoxOutlineBlank />}
                </IconButton>
              </Tooltip>
              
              {/* Bulk Actions Menu */}
              <IconButton 
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                disabled={loading || deleting}
              >
                <MoreVert />
              </IconButton>
              
              {/* Refresh Button */}
              <B
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={loading || deleting}
              >
                Refresh
              </B>
            </Stack>
          </Stack>
          
          {/* Bulk Actions Menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem 
              onClick={() => {
                setConfirmBulkDeleteOpen(true);
                setMenuAnchor(null);
              }}
              disabled={selectedNotifications.size === 0 || !selectionMode}
            >
              <Delete sx={{ mr: 1 }} />
              Delete Selected ({selectedNotifications.size})
            </MenuItem>
            <MenuItem 
              onClick={() => {
                setDeleteOldDialogOpen(true);
                setMenuAnchor(null);
              }}
            >
              <DeleteSweep sx={{ mr: 1 }} />
              Delete Old Notifications
            </MenuItem>
            <MenuItem 
              onClick={() => {
                setConfirmDeleteAllOpen(true);
                setMenuAnchor(null);
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteForever sx={{ mr: 1 }} />
              Delete All Notifications
            </MenuItem>
          </Menu>

          {/* Selection Controls */}
          {selectionMode && (
            <Bx sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        indeterminate={selectedNotifications.size > 0 && !selectAll}
                      />
                    }
                    label={`Select all on this page (${getCurrentPageData().length})`}
                  />
                  <T variant="body2" color="text.secondary">
                    {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
                  </T>
                </Stack>
                
                <Stack direction="row" spacing={1}>
                  <B
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setConfirmBulkDeleteOpen(true)}
                    disabled={selectedNotifications.size === 0 || deleting}
                  >
                    Delete Selected
                  </B>
                  <B
                    variant="outlined"
                    onClick={toggleSelectionMode}
                  >
                    Cancel
                  </B>
                </Stack>
              </Stack>
            </Bx>
          )}

          {/* Search and Filter Bar */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
            {/* Search Input */}
            <Tf
              fullWidth
              placeholder="Search notifications by title or content..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Status Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="queued">Queued</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
            
            {/* Date Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Date</InputLabel>
              <Select
                value={dateFilter}
                label="Date"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
            
            {/* Search Button */}
            <B
              variant="contained"
              onClick={handleSearchSubmit}
              disabled={loading}
              sx={{ minWidth: 100 }}
            >
              Search
            </B>
          </Stack>

          {/* Loading indicator */}
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Deleting indicator */}
          {deleting && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={16} />
                <span>Deleting notifications...</span>
              </Stack>
            </Alert>
          )}

          {/* Error display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Results Summary */}
          {!loading && (
            <T variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Found {totalCount} notification{totalCount !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
              {statusFilter !== "all" && ` with status "${statusFilter}"`}
              {dateFilter !== "all" && ` from ${dateFilter}`}
            </T>
          )}

          {/* Notifications Grid */}
          {!loading && getCurrentPageData().length === 0 && (
            <Bx
              sx={{
                textAlign: "center",
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <History sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
              {searchTerm ? (
                <T variant="h6" color="text.secondary">
                  No notifications found matching your search
                </T>
              ) : (
                <T variant="h6" color="text.secondary">
                  No notifications found. Create your first notification to see it here.
                </T>
              )}
            </Bx>
          )}

          <Grid container spacing={3}>
            {getCurrentPageData().map((notification) => (
              <Grid item xs={12} md={6} lg={4} key={notification.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: 2
                    },
                    ...(selectedNotifications.has(notification.id) && {
                      bgcolor: 'action.selected',
                      borderColor: 'primary.main'
                    })
                  }}
                >
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <Checkbox
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'background.paper' }
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flex: 1 }}>
                    {/* Status and Date */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(notification.status)}
                        label={notification.status || "unknown"}
                        size="small"
                        color={getStatusColor(notification.status)}
                        variant="outlined"
                      />
                      <T variant="caption" color="text.secondary">
                        {formatDate(notification.queuedAt, "MMM d, yyyy")}
                      </T>
                    </Stack>

                    {/* Title */}
                    <T variant="h6" noWrap sx={{ mb: 1 }}>
                      {notification.title || "Untitled Notification"}
                    </T>

                    {/* Body Preview */}
                    <T
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        minHeight: '3.6em' // Reserve space for 3 lines
                      }}
                    >
                      {notification.body || "No content"}
                    </T>

                    {/* Statistics */}
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Email fontSize="small" color="primary" />
                        <T variant="caption">
                          {notification.totalTargets || 0} sent
                        </T>
                      </Stack>
                      
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CheckCircle fontSize="small" color="success" />
                        <T variant="caption" color="success.main">
                          {notification.processedCount || 0} read
                        </T>
                      </Stack>
                    </Stack>

                    {/* Read Progress Bar */}
                    {notification.totalTargets > 0 && (
                      <Bx sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <T variant="caption" color="text.secondary">
                            Read Progress
                          </T>
                          <T variant="caption" color="text.secondary">
                            {Math.round(((notification.processedCount || 0) / notification.totalTargets) * 100)}%
                          </T>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((notification.processedCount || 0) / notification.totalTargets) * 100, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: notification.processedCount === notification.totalTargets ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                      </Bx>
                    )}

                    {/* Timestamps */}
                    <T variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Queued: {formatDate(notification.queuedAt, "MMM d, h:mm a")}
                    </T>
                    {notification.completedAt && (
                      <T variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Completed: {formatDate(notification.completedAt, "MMM d, h:mm a")}
                      </T>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Stack direction="row" spacing={1}>
                      <B
                        startIcon={<RemoveRedEye />}
                        onClick={() => handleViewNotification(notification)}
                        size="small"
                      >
                        View
                      </B>

                      <B
                        startIcon={<Send />}
                        color="primary"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setConfirmResendOpen(true);
                        }}
                        size="small"
                        disabled={!notification.targetUsers || notification.targetUsers.length === 0}
                      >
                        Resend
                      </B>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                disabled={loading || loadingMore || deleting}
              />
            </Bx>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Bx>
          )}
        </Paper>

        {/* ==================== DIALOGS ==================== */}

        {/* Notification Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Notification Details
            <IconButton
              aria-label="close"
              onClick={() => setDetailDialogOpen(false)}
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
                {/* Notification Info */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <T variant="body2">
                      <strong>Status:</strong>
                    </T>
                    <Chip
                      icon={getStatusIcon(selectedNotification.status)}
                      label={selectedNotification.status}
                      size="small"
                      color={getStatusColor(selectedNotification.status)}
                    />
                  </Stack>
                  
                  <T variant="body2">
                    <strong>Queued:</strong> {formatDate(selectedNotification.queuedAt, "PPpp")}
                  </T>
                  
                  {selectedNotification.completedAt && (
                    <T variant="body2">
                      <strong>Completed:</strong> {formatDate(selectedNotification.completedAt, "PPpp")}
                    </T>
                  )}
                  
                  <T variant="body2">
                    <strong>Recipients:</strong> {selectedNotification.totalTargets || 0}
                  </T>
                  
                  {selectedNotification.processedCount > 0 && (
                    <T variant="body2">
                      <strong>Successfully Sent:</strong> {selectedNotification.processedCount}
                    </T>
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Preview the notification */}
                <PersonalizedNotificationPreview
                  title={selectedNotification.title}
                  body={selectedNotification.body}
                  recipient={selectedNotification.recipients?.[0] || {
                    name: "Sample Student",
                    email: "student@example.com",
                    registration: "REG12345"
                  }}
                />

                {/* Recipients List */}
                {selectedNotification.targetUsers && selectedNotification.targetUsers.length > 0 && (
                  <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <T variant="subtitle2">Recipients ({selectedNotification.targetUsers.length})</T>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            icon={<CheckCircle fontSize="small" />}
                            label={`${selectedNotification.processedCount || 0} Read`}
                            size="small" 
                            color={recipientFilter === 'read' ? 'success' : 'default'}
                            variant={recipientFilter === 'read' ? 'filled' : 'outlined'}
                            onClick={() => setRecipientFilter(recipientFilter === 'read' ? 'all' : 'read')}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip 
                            label={`${(selectedNotification.totalTargets || selectedNotification.targetUsers.length) - (selectedNotification.processedCount || 0)} Unread`}
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
                      {selectedNotification.targetUsers.filter(user => {
                        const hasRead = selectedNotification.recipients && selectedNotification.recipients.includes(user.email);
                        if (recipientFilter === 'read') return hasRead;
                        if (recipientFilter === 'unread') return !hasRead;
                        return true;
                      }).length > 10 && (
                        <B
                          size="small"
                          variant="outlined"
                          onClick={() => setShowAllRecipients(!showAllRecipients)}
                        >
                          {showAllRecipients ? 'Show Less' : 'Show All'}
                        </B>
                      )}
                    </Stack>
                    <List dense>
                      {(() => {
                        // First filter based on read status
                        const filteredUsers = selectedNotification.targetUsers.filter(user => {
                          const hasRead = selectedNotification.recipients && selectedNotification.recipients.includes(user.email);
                          if (recipientFilter === 'read') return hasRead;
                          if (recipientFilter === 'unread') return !hasRead;
                          return true; // show all
                        });
                        
                        // Then apply pagination
                        const usersToShow = showAllRecipients ? filteredUsers : filteredUsers.slice(0, 10);
                        
                        return usersToShow.map((recipient, index) => {
                          const hasRead = selectedNotification.recipients && selectedNotification.recipients.includes(recipient.email);
                          
                          return (
                            <ListItem key={index} divider={index < usersToShow.length - 1}>
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
                                    <span style={{ color: hasRead ? '#2e7d32' : 'inherit', fontWeight: hasRead ? 500 : 'normal' }}>
                                      {recipient.name || recipient.email}
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
                                  <>
                                    <span style={{ color: hasRead ? '#4caf50' : 'inherit' }}>
                                      {recipient.email}
                                    </span>
                                    {recipient.registration && (
                                      <span style={{ display: 'block', color: hasRead ? '#4caf50' : 'inherit' }}>
                                        Reg: {recipient.registration}
                                      </span>
                                    )}
                                  </>
                                }
                              />
                            </ListItem>
                          );
                        });
                      })()}
                    </List>
                    {(() => {
                      const filteredUsers = selectedNotification.targetUsers.filter(user => {
                        const hasRead = selectedNotification.recipients && selectedNotification.recipients.includes(user.email);
                        if (recipientFilter === 'read') return hasRead;
                        if (recipientFilter === 'unread') return !hasRead;
                        return true;
                      });
                      
                      if (!showAllRecipients && filteredUsers.length > 10) {
                        const filterText = recipientFilter === 'all' ? 'recipients' : 
                                         recipientFilter === 'read' ? 'read recipients' : 'unread recipients';
                        return (
                          <T variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Showing 10 of {filteredUsers.length} {filterText}
                          </T>
                        );
                      }
                      return null;
                    })()}
                  </Paper>
                )}
              </Bx>
            )}
          </DialogContent>
          <DialogActions>
            <B
              color="primary"
              variant="contained"
              startIcon={<Send />}
              onClick={() => setConfirmResendOpen(true)}
              disabled={!selectedNotification?.targetUsers || selectedNotification.targetUsers.length === 0}
            >
              Resend
            </B>
          </DialogActions>
        </Dialog>

        {/* Confirm Resend Dialog */}
        <Dialog
          open={confirmResendOpen}
          onClose={() => setConfirmResendOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Resend</DialogTitle>
          <DialogContent>
            <T variant="body1">
              Are you sure you want to resend this notification to{" "}
              {selectedNotification?.totalTargets || 0} recipients?
            </T>
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              This will create a new notification queue and process all recipients again.
              They will receive the same message with their personalized data.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setConfirmResendOpen(false)}>Cancel</B>
            <B 
              color="primary" 
              onClick={handleResendNotification}
              variant="contained"
            >
              Resend Now
            </B>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete Single Dialog */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <T variant="body1">
              Are you sure you want to delete this notification?
            </T>
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              This action cannot be undone. The notification and all its data will be permanently removed.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setConfirmDeleteOpen(false)}>Cancel</B>
            <B 
              color="error" 
              onClick={() => handleDeleteNotification(selectedNotification?.id)}
              variant="contained"
              disabled={deleting}
            >
              Delete
            </B>
          </DialogActions>
        </Dialog>

        {/* Confirm Bulk Delete Dialog */}
        <Dialog
          open={confirmBulkDeleteOpen}
          onClose={() => setConfirmBulkDeleteOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Bulk Delete</DialogTitle>
          <DialogContent>
            <T variant="body1">
              Are you sure you want to delete {selectedNotifications.size} selected notifications?
            </T>
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              This action cannot be undone. All selected notifications and their data will be permanently removed.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setConfirmBulkDeleteOpen(false)}>Cancel</B>
            <B 
              color="error" 
              onClick={handleBulkDelete}
              variant="contained"
              disabled={deleting}
            >
              Delete {selectedNotifications.size} Notifications
            </B>
          </DialogActions>
        </Dialog>

        {/* Confirm Delete All Dialog */}
        <Dialog
          open={confirmDeleteAllOpen}
          onClose={() => setConfirmDeleteAllOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>Confirm Delete All</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>DANGER:</strong> This will delete ALL notifications in the system!
            </Alert>
            <T variant="body1">
              Are you absolutely sure you want to delete all notification history?
            </T>
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              This action cannot be undone. All notifications, recipients, and historical data will be permanently removed.
              Consider creating a backup before proceeding.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setConfirmDeleteAllOpen(false)}>Cancel</B>
            <B 
              color="error" 
              onClick={handleDeleteAll}
              variant="contained"
              disabled={deleting}
            >
              Yes, Delete Everything
            </B>
          </DialogActions>
        </Dialog>

        {/* Delete Old Notifications Dialog */}
        <Dialog
          open={deleteOldDialogOpen}
          onClose={() => setDeleteOldDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Old Notifications</DialogTitle>
          <DialogContent>
            <T variant="body1" sx={{ mb: 3 }}>
              Delete notifications older than a specific number of days:
            </T>
            <Tf
              fullWidth
              label="Days old"
              type="number"
              value={deleteOldDays}
              onChange={(e) => setDeleteOldDays(Math.max(1, parseInt(e.target.value) || 30))}
              inputProps={{ min: 1, max: 365 }}
              helperText="Notifications older than this many days will be deleted"
            />
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              This action cannot be undone. Only notifications older than {deleteOldDays} days will be affected.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setDeleteOldDialogOpen(false)}>Cancel</B>
            <B 
              color="warning" 
              onClick={handleDeleteOld}
              variant="contained"
              disabled={deleting}
            >
              Delete Old Notifications
            </B>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={successAlert.open}
          autoHideDuration={6000}
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
      </Bx>
    );
  }