// src/pages/PersonalizedNotificationViewPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserProvider';
import { getNotificationById, markNotificationAsRead } from '../services/backendNotificationService';
import PersonalizedNotificationView from '../components/personalizednotifications/PersonalizedNotificationView';
import Loading from '../components/Loading';
import { Container, Alert } from '@mui/material';

export default function PersonalizedNotificationViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNotification = async () => {
      if (!user?.email || !id) return;
      
      try {
        setLoading(true);
        const result = await getNotificationById(id, user.email);
        
        if (result.success) {
          // Process the notification data
          const processedNotification = {
            ...result.data,
            createdAt: new Date(result.data.createdAt._seconds * 1000),
            readAt: result.data.readAt ? new Date(result.data.readAt._seconds * 1000) : null,
            body: result.data.content,
            id: result.data.notificationId
          };
          
          setNotification(processedNotification);
          
          // Mark as read if not already read
          if (!processedNotification.isRead) {
            await markNotificationAsRead(id, user.email);
            setNotification(prev => ({
              ...prev,
              isRead: true,
              readAt: new Date()
            }));
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load notification');
        console.error('Error loading notification:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotification();
  }, [id, user?.email]);

  const handleBack = () => {
    navigate('/personalizednotifications');
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const result = await markPersonalizedNotificationAsRead(notificationId, user.email);
      if (result.success) {
        setNotification(prev => ({
          ...prev,
          isRead: true,
          readAt: new Date()
        }));
      }
      return result;
    } catch (err) {
      console.error('Error marking as read:', err);
      return { success: false, error: err.message };
    }
  };

  if (loading) {
    return <Loading text="Loading message..." />;
  }

  if (error || !notification) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Notification not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <PersonalizedNotificationView 
      notification={notification}
      onBack={handleBack}
      onMarkAsRead={handleMarkAsRead}
    />
  );
}