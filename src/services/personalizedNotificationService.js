// src/services/personalizedNotificationService.js
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter,
    serverTimestamp,
    writeBatch,
    increment,
    onSnapshot,
    updateDoc
  } from "firebase/firestore";
  import { fireDB } from "../../firebaseconfig";
  
  /**
   * Get personalized notifications for a specific user
   */
  export const getUserPersonalizedNotifications = async (userEmail, lastDoc = null, pageSize = 20) => {
    try {
      let q = query(
        collection(fireDB, "personalizedNotifications"),
        where("userEmail", "==", userEmail),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
  
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
  
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate() || null,
          docRef: doc
        });
      });
  
      return {
        success: true,
        notifications,
        hasMore: notifications.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching personalized notifications:", error);
      return {
        success: false,
        error: error.message,
        notifications: []
      };
    }
  };
  
  /**
   * Mark personalized notification as read
   */
  export const markPersonalizedNotificationAsRead = async (notificationId, userEmail) => {
    try {
      const batch = writeBatch(fireDB);
      
      const notificationRef = doc(fireDB, "personalizedNotifications", notificationId);
      batch.update(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
      
      const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
      batch.update(summaryRef, {
        unreadCount: increment(-1),
        lastReadAt: serverTimestamp()
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Error marking personalized notification as read:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Mark all personalized notifications as read
   */
  export const markAllPersonalizedNotificationsAsRead = async (userEmail) => {
    try {
      const unreadQuery = query(
        collection(fireDB, "personalizedNotifications"),
        where("userEmail", "==", userEmail),
        where("isRead", "==", false),
        limit(100)
      );
      
      const unreadSnapshot = await getDocs(unreadQuery);
      
      if (unreadSnapshot.empty) {
        return { success: true, markedCount: 0 };
      }
      
      const batchSize = 400;
      const notifications = unreadSnapshot.docs;
      let totalMarked = 0;
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = writeBatch(fireDB);
        const chunk = notifications.slice(i, i + batchSize);
        
        chunk.forEach(notificationDoc => {
          batch.update(notificationDoc.ref, {
            isRead: true,
            readAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        totalMarked += chunk.length;
      }
      
      const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
      await updateDoc(summaryRef, {
        unreadCount: 0,
        lastReadAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        markedCount: totalMarked 
      };
    } catch (error) {
      console.error("Error marking all personalized notifications as read:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Real-time subscription to unread count
   */
  export const subscribeToPersonalizedUnreadCount = (userEmail, callback) => {
    const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
    
    return onSnapshot(summaryRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.unreadCount || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      console.error("Error subscribing to personalized unread count:", error);
      callback(0);
    });
  };
  
  /**
   * Real-time subscription to notifications
   */
  export const subscribeToPersonalizedNotifications = (userEmail, callback, pageSize = 20) => {
    const q = query(
      collection(fireDB, "personalizedNotifications"),
      where("userEmail", "==", userEmail),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      try {
        const notifications = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            readAt: data.readAt?.toDate() || null
          });
        });
  
        callback(notifications);
      } catch (error) {
        console.error("Error in personalized notifications subscription:", error);
        callback([]);
      }
    }, (error) => {
      console.error("Error subscribing to personalized notifications:", error);
      callback([]);
    });
  };
  
  /**
   * Process content for display with line breaks and formatting
   */
  export const processPersonalizedNotificationContent = (content) => {
    if (!content) return "";
    
    let processedContent = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    
    // Convert markdown links [text](url)
    processedContent = processedContent.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline; font-weight: 500;">$1</a>'
    );
    
    // Convert **bold**
    processedContent = processedContent.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong>$1</strong>'
    );
    
    // Convert *italic*
    processedContent = processedContent.replace(
      /(?<!\*)\*([^*]+)\*(?!\*)/g,
      '<em>$1</em>'
    );
    
    // Convert __underline__
    processedContent = processedContent.replace(
      /__([^_]+)__/g,
      '<u>$1</u>'
    );
    
    // Convert line breaks to HTML
    const paragraphs = processedContent.split(/\n\s*\n/);
    
    return paragraphs
      .map(paragraph => {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) return '';
        
        const withBreaks = trimmedParagraph.replace(/\n/g, '<br>');
        return `<p style="margin: 0 0 1em 0; line-height: 1.5;">${withBreaks}</p>`;
      })
      .filter(p => p)
      .join('');
  };

  /**
   * Process personalized content with template variable replacement
   */
  export const processPersonalizedNotificationContentWithUser = (content, user, notification = null) => {
    if (!content) return "";
    
    let processedContent = content;
    
    // Replace template variables with user data
    if (user) {
      // Replace common placeholders
      processedContent = processedContent.replace(/{{name}}/gi, user.displayName || user.name || '[Name]');
      processedContent = processedContent.replace(/{{email}}/gi, user.email || '[Email]');
      
      // Use registration from notification data if available, otherwise from user
      const registrationNumber = notification?.userRegistration || user.registration || '[Registration]';
      processedContent = processedContent.replace(/{{registration}}/gi, registrationNumber);
      
      // Replace date placeholders
      const now = new Date();
      processedContent = processedContent.replace(/{{date}}/gi, now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }));
      processedContent = processedContent.replace(/{{month}}/gi, now.toLocaleString('default', { month: 'long' }));
    }
    
    // Then apply HTML formatting
    return processPersonalizedNotificationContent(processedContent);
  };

  /**
   * Process template variables in plain text (for titles, etc.)
   */
  export const processTemplateVariables = (text, user, notification = null) => {
    if (!text) return "";
    
    let processedText = text;
    
    // Replace template variables with user data
    if (user) {
      // Replace common placeholders
      processedText = processedText.replace(/{{name}}/gi, user.displayName || user.name || '[Name]');
      processedText = processedText.replace(/{{email}}/gi, user.email || '[Email]');
      
      // Use registration from notification data if available, otherwise from user
      const registrationNumber = notification?.userRegistration || user.registration || '[Registration]';
      processedText = processedText.replace(/{{registration}}/gi, registrationNumber);
      
      // Replace date placeholders
      const now = new Date();
      processedText = processedText.replace(/{{date}}/gi, now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }));
      processedText = processedText.replace(/{{month}}/gi, now.toLocaleString('default', { month: 'long' }));
    }
    
    return processedText;
  };
  
  /**
   * Extract plain text for previews
   */
  export const extractPersonalizedPlainText = (content, maxLength = 100) => {
    if (!content) return "";
    
    let plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
    
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

/**
 * Get a single personalized notification by ID
 */
export const getPersonalizedNotificationById = async (notificationId, userEmail) => {
    try {
      const notificationRef = doc(fireDB, 'personalizedNotifications', notificationId);
      const docSnap = await getDoc(notificationRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: 'Notification not found' };
      }
      
      const data = docSnap.data();
      
      // Check if user has access to this notification
      if (data.userEmail !== userEmail && !data.sendToAll) {
        return { success: false, error: 'Access denied' };
      }
      
      const notification = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate() || null,
      };
      
      return { success: true, notification };
    } catch (error) {
      console.error('Error getting personalized notification:', error);
      return { success: false, error: error.message };
    }
  };

  /**
 * Delete a single personalized notification
 */
export const deletePersonalizedNotification = async (notificationId, userEmail) => {
  try {
    // First, check if the notification exists and belongs to the user
    const notificationRef = doc(fireDB, "personalizedNotifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);
    
    if (!notificationDoc.exists()) {
      return {
        success: false,
        error: "Notification not found"
      };
    }
    
    const notificationData = notificationDoc.data();
    
    // Check if user owns this notification
    if (notificationData.userEmail !== userEmail) {
      return {
        success: false,
        error: "You don't have permission to delete this notification"
      };
    }
    
    const batch = writeBatch(fireDB);
    
    // Delete the notification
    batch.delete(notificationRef);
    
    // Update summary if notification was unread
    if (!notificationData.isRead) {
      const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
      batch.update(summaryRef, {
        unreadCount: increment(-1),
        lastUpdatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    
    return { 
      success: true,
      deletedId: notificationId,
      wasUnread: !notificationData.isRead
    };
  } catch (error) {
    console.error("Error deleting personalized notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete multiple personalized notifications
 */
export const deletePersonalizedNotifications = async (notificationIds, userEmail) => {
  try {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return {
        success: false,
        error: "No notification IDs provided"
      };
    }

    // Firestore batch limit is 500 operations
    const batchSize = 400;
    let totalDeleted = 0;
    let unreadDeleted = 0;
    const deletedIds = [];
    
    // Process in chunks
    for (let i = 0; i < notificationIds.length; i += batchSize) {
      const chunk = notificationIds.slice(i, i + batchSize);
      const batch = writeBatch(fireDB);
      
      // Verify ownership and count unread before deletion
      for (const notificationId of chunk) {
        const notificationRef = doc(fireDB, "personalizedNotifications", notificationId);
        const notificationDoc = await getDoc(notificationRef);
        
        if (notificationDoc.exists()) {
          const data = notificationDoc.data();
          
          // Check ownership
          if (data.userEmail === userEmail) {
            batch.delete(notificationRef);
            deletedIds.push(notificationId);
            totalDeleted++;
            
            if (!data.isRead) {
              unreadDeleted++;
            }
          }
        }
      }
      
      // Execute batch
      if (totalDeleted > 0) {
        await batch.commit();
      }
    }
    
    // Update summary count if any unread notifications were deleted
    if (unreadDeleted > 0) {
      const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
      await updateDoc(summaryRef, {
        unreadCount: increment(-unreadDeleted),
        lastUpdatedAt: serverTimestamp()
      });
    }
    
    return {
      success: true,
      deletedCount: totalDeleted,
      deletedIds,
      unreadDeleted
    };
  } catch (error) {
    console.error("Error deleting personalized notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete all personalized notifications for a user
 */
export const deleteAllPersonalizedNotifications = async (userEmail) => {
  try {
    // Get all notifications for the user in batches
    let allDeleted = true;
    let totalDeleted = 0;
    let unreadDeleted = 0;
    
    while (allDeleted) {
      const q = query(
        collection(fireDB, "personalizedNotifications"),
        where("userEmail", "==", userEmail),
        limit(400) // Leave room for batch operations
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        break; // No more notifications to delete
      }
      
      const batch = writeBatch(fireDB);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        batch.delete(doc.ref);
        totalDeleted++;
        
        if (!data.isRead) {
          unreadDeleted++;
        }
      });
      
      await batch.commit();
      
      // If we deleted less than the limit, we're done
      if (querySnapshot.docs.length < 400) {
        allDeleted = false;
      }
    }
    
    // Reset summary
    const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
    await updateDoc(summaryRef, {
      unreadCount: 0,
      lastUpdatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      deletedCount: totalDeleted,
      unreadDeleted
    };
  } catch (error) {
    console.error("Error deleting all personalized notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete old notifications (older than specified days)
 */
export const deleteOldPersonalizedNotifications = async (userEmail, daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const q = query(
      collection(fireDB, "personalizedNotifications"),
      where("userEmail", "==", userEmail),
      where("createdAt", "<", cutoffDate),
      limit(500)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: true,
        deletedCount: 0,
        message: `No notifications older than ${daysOld} days found`
      };
    }
    
    let totalDeleted = 0;
    let unreadDeleted = 0;
    const batchSize = 400;
    
    // Process in batches
    for (let i = 0; i < querySnapshot.docs.length; i += batchSize) {
      const batch = writeBatch(fireDB);
      const chunk = querySnapshot.docs.slice(i, i + batchSize);
      
      chunk.forEach((doc) => {
        const data = doc.data();
        batch.delete(doc.ref);
        totalDeleted++;
        
        if (!data.isRead) {
          unreadDeleted++;
        }
      });
      
      await batch.commit();
    }
    
    // Update summary if unread notifications were deleted
    if (unreadDeleted > 0) {
      const summaryRef = doc(fireDB, "userPersonalizedNotificationSummary", userEmail);
      await updateDoc(summaryRef, {
        unreadCount: increment(-unreadDeleted),
        lastUpdatedAt: serverTimestamp()
      });
    }
    
    return {
      success: true,
      deletedCount: totalDeleted,
      unreadDeleted,
      message: `Successfully deleted ${totalDeleted} notifications older than ${daysOld} days`
    };
  } catch (error) {
    console.error("Error deleting old personalized notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};