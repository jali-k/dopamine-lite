// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { 
  getUserNotifications, 
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead 
} from '../services/notificationService';

// src/hooks/useNotificationCount.js
import { subscribeToUnreadCount } from '../services/notificationService';

// src/hooks/useNotificationHistory.js (for admin)
import { getNotificationHistory } from '../services/notificationService';


export const useNotifications = (userEmail, realTime = false) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // Load initial notifications
  const loadNotifications = useCallback(async (reset = true) => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await getUserNotifications(
        userEmail, 
        reset ? null : lastDoc, 
        20
      );
      
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
      console.error('Error loading notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail, lastDoc]);

  // Load more notifications (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadNotifications(false);
    }
  }, [loading, hasMore, loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!userEmail) return;
    
    try {
      const result = await markNotificationAsRead(notificationId, userEmail);
      
      if (result.success) {
        // Optimistically update the notification in the list
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
      } else {
        console.error('Error marking as read:', result.error);
      }
      
      return result;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      const result = await markAllNotificationsAsRead(userEmail);
      
      if (result.success) {
        // Optimistically update all notifications
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
      console.error('Error marking all as read:', err);
      return { success: false, error: err.message };
    }
  }, [userEmail]);

  // Refresh notifications
  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    loadNotifications(true);
  }, [loadNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userEmail) return;

    if (realTime) {
      // Use real-time subscription
      const unsubscribe = subscribeToNotifications(
        userEmail,
        (newNotifications) => {
          setNotifications(newNotifications);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // Load notifications once
      loadNotifications(true);
    }
  }, [userEmail, realTime, loadNotifications]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh
  };
};



export const useNotificationCount = (userEmail) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time unread count updates
    const unsubscribe = subscribeToUnreadCount(userEmail, (count) => {
      setUnreadCount(count);
      setLoading(false);
    });

    return unsubscribe;
  }, [userEmail]);

  return { unreadCount, loading };
};



export const useNotificationHistory = (adminEmail) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  const loadHistory = useCallback(async (reset = true) => {
    if (!adminEmail) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getNotificationHistory(
        adminEmail,
        reset ? null : lastDoc,
        20
      );

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
      console.error('Error loading notification history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminEmail, lastDoc]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadHistory(false);
    }
  }, [loading, hasMore, loadHistory]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    loadHistory(true);
  }, [loadHistory]);

  useEffect(() => {
    loadHistory(true);
  }, [adminEmail]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};