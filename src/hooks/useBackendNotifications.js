// src/hooks/useBackendNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  getNotificationStats,
  createNotification 
} from '../services/backendNotificationService';

/**
 * Simple hook for backend notifications badge
 */
export const useBackendNotificationsBadge = (userEmail, previewCount = 5) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async (options = {}) => {
    if (!userEmail) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserNotifications(userEmail, {
        limit: previewCount,
        offset: 0,
        readStatus: 'all',
        ...options
      });
      
      if (response.success && response.data) {
        const allNotifications = response.data.map(notif => ({
          ...notif,
          // Convert Firebase timestamps to Date objects
          createdAt: new Date(notif.createdAt._seconds * 1000),
          readAt: notif.readAt ? new Date(notif.readAt._seconds * 1000) : null,
          // Map content to body for compatibility
          body: notif.content
        }));
        
        console.log('Badge - All notifications:', allNotifications);
        console.log('Badge - Personalized notifications check:', allNotifications.map(n => ({ id: n.notificationId, personalized: n.personalized })));
        
        // Filter for NON-personalized notifications only (for regular notification badge)
        const regularNotifications = allNotifications.filter(notif => notif.personalized !== true);
        
        console.log('Badge - Filtered regular notifications:', regularNotifications);
        
        // Take only the preview count for the badge
        const previewNotifications = regularNotifications.slice(0, previewCount);
        
        // Count unread regular notifications
        const unreadTotal = regularNotifications.filter(notif => !notif.isRead).length;
        
        console.log('Preview notifications for badge:', previewNotifications);
        console.log('Unread count:', unreadTotal);
        
        setNotifications(previewNotifications);
        setUnreadCount(unreadTotal);
      } else {
        setError('Failed to load notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error loading backend notifications:', err);
      setError(err.message);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userEmail, previewCount]);

  // Mark as read using backend API
  const markAsRead = useCallback(async (notificationId) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      const result = await markNotificationAsRead(notificationId, userEmail);
      console.log('Marking notification as read:', notificationId, result);
      
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationId === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        
        // Decrease unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return result;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  // Simple mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      // TODO: Implement backend API call to mark all as read
      console.log('Marking all notifications as read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      
      return { success: true };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
};

/**
 * Hook for managing all user notifications with pagination
 */
export const useBackendNotifications = (userEmail) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadNotifications = useCallback(async (options = {}) => {
    if (!userEmail) return;

    try {
      const { reset = false, ...otherOptions } = options;
      
      if (reset) {
        setOffset(0);
        setLoading(true);
      }

      const currentOffset = reset ? 0 : offset;
      
      const response = await getUserNotifications(userEmail, {
        limit: 20,
        offset: currentOffset,
        readStatus: 'all',
        ...otherOptions
      });

      if (response.success && response.data) {
        const allNotifications = response.data.map(notif => ({
          ...notif,
          createdAt: new Date(notif.createdAt._seconds * 1000),
          readAt: notif.readAt ? new Date(notif.readAt._seconds * 1000) : null,
          body: notif.content
        }));

        console.log('RegularNotifications - All notifications:', allNotifications);
        
        // Filter for non-personalized notifications only (personalized: false or undefined)
        const regularNotifications = allNotifications.filter(notif => notif.personalized !== true);

        console.log('RegularNotifications - Filtered regular:', regularNotifications);

        if (reset) {
          setNotifications(regularNotifications);
        } else {
          setNotifications(prev => [...prev, ...regularNotifications]);
        }

        setHasMore(regularNotifications.length === 20);
        setOffset(currentOffset + regularNotifications.length);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail, offset]);

  const loadStats = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      const response = await getNotificationStats(userEmail);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading notification stats:', err);
    }
  }, [userEmail]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      const result = await markNotificationAsRead(notificationId, userEmail);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationId === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1
        }));
      }
      
      return result;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  const refresh = useCallback(() => {
    loadNotifications({ reset: true });
    loadStats();
  }, [loadNotifications, loadStats]);

  useEffect(() => {
    if (userEmail) {
      loadNotifications({ reset: true });
      loadStats();
    }
  }, [userEmail]);

  return {
    notifications,
    loading,
    error,
    stats,
    hasMore,
    loadMore: () => loadNotifications(),
    markAsRead,
    refresh
  };
};

/**
 * Hook for personalized notifications (filters for personalized: true)
 */
export const useBackendPersonalizedNotifications = (userEmail, realTime = false) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (reset = false) => {
    if (!userEmail) return;

    try {
      if (reset) {
        setRefreshing(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await getUserNotifications(userEmail, {
        limit: 20,
        offset: reset ? 0 : lastDoc || 0,
        readStatus: 'all'
      });

      console.log("User Notifications hook Response......... :", response);

      if (response.success && response.data) {
        const allNotifications = response.data.map(notif => ({
          ...notif,
          createdAt: new Date(notif.createdAt._seconds * 1000),
          readAt: notif.readAt ? new Date(notif.readAt._seconds * 1000) : null,
          body: notif.content
        }));

        console.log('PersonalizedNotifications - All notifications:', allNotifications);
        
        // Filter for personalized notifications only
        const personalizedNotifications = allNotifications.filter(notif => notif.personalized === true);

        console.log('PersonalizedNotifications - Filtered personalized:', personalizedNotifications);

        if (reset) {
          setNotifications(personalizedNotifications);
        } else {
          setNotifications(prev => [...prev, ...personalizedNotifications]);
        }

        setHasMore(allNotifications.length === 20);
        setLastDoc((reset ? 0 : lastDoc || 0) + allNotifications.length);
      } else {
        setError('Failed to load notifications');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error loading personalized notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail, lastDoc]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && notifications.length > 0) {
      loadNotifications(false);
    }
  }, [loading, hasMore, notifications.length, loadNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      const result = await markNotificationAsRead(notificationId, userEmail);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationId === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error marking personalized notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  const markAllAsRead = useCallback(async () => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      // Mark all unread personalized notifications as read
      const unreadNotifications = notifications.filter(notif => !notif.isRead);
      
      for (const notif of unreadNotifications) {
        await markNotificationAsRead(notif.notificationId, userEmail);
      }
      
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error marking all personalized notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail, notifications]);

  const refresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    if (userEmail) {
      loadNotifications(true);
    }
  }, [userEmail]);

  return {
    notifications,
    loading,
    refreshing,
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh
  };
};

/**
 * Hook for creating and sending notifications
 */
export const useCreateNotification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendNotification = useCallback(async (notificationData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await createNotification(notificationData);
      
      if (!result.success) {
        setError(result.error || 'Failed to send notification');
      }
      
      return result;
    } catch (err) {
      console.error('Error sending notification:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendNotification,
    loading,
    error
  };
};

/**
 * Hook specifically for personalized notifications badge
 */
export const useBackendPersonalizedNotificationsBadge = (userEmail, previewCount = 5) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async (options = {}) => {
    if (!userEmail) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserNotifications(userEmail, {
        limit: previewCount,
        offset: 0,
        readStatus: 'all',
        ...options
      });
      
      if (response.success && response.data) {
        const allNotifications = response.data.map(notif => ({
          ...notif,
          createdAt: new Date(notif.createdAt._seconds * 1000),
          readAt: notif.readAt ? new Date(notif.readAt._seconds * 1000) : null,
          body: notif.content
        }));
        
        console.log('PersonalizedBadge - All notifications:', allNotifications);
        
        // Filter for PERSONALIZED notifications only
        const personalizedNotifications = allNotifications.filter(notif => notif.personalized === true);
        
        console.log('PersonalizedBadge - Filtered personalized notifications:', personalizedNotifications);
        
        // Take only the preview count for the badge
        const previewNotifications = personalizedNotifications.slice(0, previewCount);
        
        // Count unread personalized notifications
        const unreadTotal = personalizedNotifications.filter(notif => !notif.isRead).length;
        
        console.log('PersonalizedBadge - Preview notifications:', previewNotifications);
        console.log('PersonalizedBadge - Unread count:', unreadTotal);
        
        setNotifications(previewNotifications);
        setUnreadCount(unreadTotal);
      } else {
        setError('Failed to load notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error loading personalized notifications:', err);
      setError(err.message);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userEmail, previewCount]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      const result = await markNotificationAsRead(notificationId, userEmail);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationId === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return result;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  const markAllAsRead = useCallback(async () => {
    try {
      console.log('Marking all personalized notifications as read');
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      
      return { success: true };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
};
