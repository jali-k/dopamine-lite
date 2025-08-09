// src/hooks/usePersonalizedNotifications.js - CORRECTED VERSION
import { useState, useEffect, useCallback } from 'react';
import { 
  getUserPersonalizedNotifications, 
  subscribeToPersonalizedNotifications,
  markPersonalizedNotificationAsRead,
  markAllPersonalizedNotificationsAsRead,
  subscribeToPersonalizedUnreadCount,
  deletePersonalizedNotification,
  deletePersonalizedNotifications,
  deleteAllPersonalizedNotifications,
  deleteOldPersonalizedNotifications
} from '../services/personalizedNotificationService';

import { getNotifications } from '../services/backendNotificationService';

/**
 * Hook for managing personalized notifications - UPDATED with deletion functionality
 */
export const usePersonalizedNotifications = (userEmail, realTime = false) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      
      // const result = await getUserPersonalizedNotifications(
      //   userEmail, 
      //   reset ? null : lastDoc, 
      //   20
      // );

      const result = await getNotifications(userEmail);

      console.log('Personalized notifications fetched:', result);

      if (result.success) {
        if (reset) {
          setNotifications(result.notifications);
        } else {
          setNotifications(prev => [...prev, ...result.notifications]);
        }
        
        setHasMore(result.hasMore);
        
        if (result.notifications.length > 0) {
          setLastDoc(result.notifications[result.notifications.length - 1].docRef);
        }
      } else {
        setError(result.error);
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
      const result = await markPersonalizedNotificationAsRead(notificationId, userEmail);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
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
      const result = await markAllPersonalizedNotificationsAsRead(userEmail);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error marking all personalized notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  // NEW: Delete single notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      setDeleting(true);
      const result = await deletePersonalizedNotification(notificationId, userEmail);
      
      if (result.success) {
        // Remove from local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting personalized notification:', err);
      return { success: false, error: err.message };
    } finally {
      setDeleting(false);
    }
  }, [userEmail]);

  // NEW: Delete multiple notifications
  const deleteMultipleNotifications = useCallback(async (notificationIds) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return { success: false, error: 'No notification IDs provided' };
    }
    
    try {
      setDeleting(true);
      const result = await deletePersonalizedNotifications(notificationIds, userEmail);
      
      if (result.success) {
        // Remove deleted notifications from local state
        setNotifications(prev => 
          prev.filter(notif => !result.deletedIds.includes(notif.id))
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting multiple personalized notifications:', err);
      return { success: false, error: err.message };
    } finally {
      setDeleting(false);
    }
  }, [userEmail]);

  // NEW: Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      setDeleting(true);
      const result = await deleteAllPersonalizedNotifications(userEmail);
      
      if (result.success) {
        // Clear local state
        setNotifications([]);
        setHasMore(false);
        setLastDoc(null);
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting all personalized notifications:', err);
      return { success: false, error: err.message };
    } finally {
      setDeleting(false);
    }
  }, [userEmail]);

  // NEW: Delete old notifications
  const deleteOldNotifications = useCallback(async (daysOld = 30) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      setDeleting(true);
      const result = await deleteOldPersonalizedNotifications(userEmail, daysOld);
      
      if (result.success && result.deletedCount > 0) {
        // Refresh the list to reflect deletions
        await loadNotifications(true);
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting old personalized notifications:', err);
      return { success: false, error: err.message };
    } finally {
      setDeleting(false);
    }
  }, [userEmail, loadNotifications]);

  const refresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    if (!userEmail) return;

    if (realTime) {
      const unsubscribe = subscribeToPersonalizedNotifications(
        userEmail,
        (newNotifications) => {
          setNotifications(newNotifications);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      loadNotifications(true);
    }
  }, [userEmail, realTime, loadNotifications]);

  return {
    notifications,
    loading: refreshing ? false : loading,
    refreshing,
    deleting,
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultipleNotifications,
    deleteAllNotifications,
    deleteOldNotifications,
    refresh
  };
};

/**
 * Hook for unread count
 */
export const usePersonalizedNotificationCount = (userEmail) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToPersonalizedUnreadCount(userEmail, (count) => {
      setUnreadCount(count);
      setLoading(false);
    });

    return unsubscribe;
  }, [userEmail]);

  return { unreadCount, loading };
};

/**
 * Combined hook for badge usage - SIMPLIFIED (no deletion methods)
 */
export const usePersonalizedNotificationsBadge = (userEmail, previewCount = 5) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('usePersonalizedNotificationsBadge hook');

  const markAsRead = useCallback(async (notificationId) => {
    if (!userEmail) return;
    
    try {
      const result = await markPersonalizedNotificationAsRead(notificationId, userEmail);
      
      if (result.success) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
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
    if (!userEmail) return;
    
    try {
      const result = await markAllPersonalizedNotificationsAsRead(userEmail);
      
      if (result.success) {
        setUnreadCount(0);
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            isRead: true, 
            readAt: new Date() 
          }))
        );
      }
      
      return result;
    } catch (err) {
      console.error('Error marking all personalized notifications as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  // Simple delete function for badge (no complex state management)
  const deleteNotification = useCallback(async (notificationId) => {
    if (!userEmail) return { success: false, error: 'No user email' };
    
    try {
      const result = await deletePersonalizedNotification(notificationId, userEmail);
      
      if (result.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (result.wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error deleting personalized notification:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setUnreadCount(0);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribeCount = subscribeToPersonalizedUnreadCount(userEmail, (count) => {
      setUnreadCount(count);
      setLoading(false);
    });

    const unsubscribeNotifications = subscribeToPersonalizedNotifications(
      userEmail,
      (newNotifications) => {
        setNotifications(newNotifications.slice(0, previewCount));
        setLoading(false);
      },
      previewCount
    );

    return () => {
      unsubscribeCount();
      unsubscribeNotifications();
    };
  }, [userEmail, previewCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};