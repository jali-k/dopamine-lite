// src/hooks/useBackendNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { getNotifications } from '../services/backendNotificationService';

/**
 * Simple hook for backend notifications badge
 */
export const useBackendNotificationsBadge = (userEmail, previewCount = 5) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!userEmail) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getNotifications(userEmail);
      
      if (response.success && response.data) {
        const allNotifications = response.data.map(notif => ({
          ...notif,
          // Convert Firebase timestamps to Date objects
          createdAt: new Date(notif.createdAt._seconds * 1000),
          readAt: notif.readAt ? new Date(notif.readAt._seconds * 1000) : null,
          // Map content to body for compatibility
          body: notif.content
        }));
        
        // Take only the preview count for the badge
        const previewNotifications = allNotifications.slice(0, previewCount);
        
        // Count unread notifications from all notifications
        const unreadTotal = allNotifications.filter(notif => !notif.isRead).length;
        
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

  // Simple mark as read (for now just update local state)
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // TODO: Implement backend API call to mark as read
      console.log('Marking notification as read:', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.notificationId === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return { success: true };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, []);

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
