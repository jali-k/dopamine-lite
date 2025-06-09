// src/services/notificationService.js
import { 
    collection, 
    addDoc, 
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
  
  // Admin Functions
  export const createNotification = async (notificationData) => {
    try {
      const notification = {
        ...notificationData,
        createdAt: serverTimestamp(),
        readCount: 0,
        isActive: true,
        status: 'processing', // Will be updated by Cloud Function
        totalRecipients: notificationData.targetUsers.length
      };
  
      const docRef = await addDoc(collection(fireDB, "notifications"), notification);
      
      return {
        success: true,
        id: docRef.id,
        message: "Notification sent successfully! Users will receive it within a few seconds."
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  export const getNotificationHistory = async (adminEmail, lastDoc = null, pageSize = 20) => {
    try {
      let q = query(
        collection(fireDB, "notifications"),
        where("createdBy", "==", adminEmail),
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
          processedAt: data.processedAt?.toDate() || null,
          docRef: doc // For pagination
        });
      });
  
      return {
        success: true,
        notifications,
        hasMore: notifications.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching notification history:", error);
      return {
        success: false,
        error: error.message,
        notifications: []
      };
    }
  };
  
  export const getNotificationById = async (notificationId) => {
    try {
      const docRef = doc(fireDB, "notifications", notificationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          success: true,
          notification: {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            processedAt: data.processedAt?.toDate() || null
          }
        };
      } else {
        return {
          success: false,
          error: "Notification not found"
        };
      }
    } catch (error) {
      console.error("Error fetching notification:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Student Functions
  export const getUserNotifications = async (userEmail, lastDoc = null, pageSize = 20) => {
    try {
      let q = query(
        collection(fireDB, "notifications"),
        where("targetUsers", "array-contains", userEmail),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
  
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
  
      const querySnapshot = await getDocs(q);
      
      // Get notification data and check read status
      const notificationPromises = querySnapshot.docs.map(async (notifDoc) => {
        const notifData = notifDoc.data();
        
        // Check if user has read this notification
        const readDocRef = doc(fireDB, "notificationReads", `${notifDoc.id}_${userEmail}`);
        const readDoc = await getDoc(readDocRef);
        
        return {
          id: notifDoc.id,
          ...notifData,
          createdAt: notifData.createdAt?.toDate() || new Date(),
          isRead: readDoc.exists(),
          readAt: readDoc.exists() ? readDoc.data().readAt?.toDate() : null,
          docRef: notifDoc // For pagination
        };
      });
  
      const notifications = await Promise.all(notificationPromises);
  
      return {
        success: true,
        notifications,
        hasMore: notifications.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return {
        success: false,
        error: error.message,
        notifications: []
      };
    }
  };
  
  export const markNotificationAsRead = async (notificationId, userEmail) => {
    try {
      const batch = writeBatch(fireDB);
      
      // Create read record
      const readRef = doc(fireDB, "notificationReads", `${notificationId}_${userEmail}`);
      batch.set(readRef, {
        notificationId,
        userEmail,
        readAt: serverTimestamp(),
        isRead: true
      });
      
      // Decrease unread count
      const summaryRef = doc(fireDB, "userNotificationSummary", userEmail);
      batch.set(summaryRef, {
        unreadCount: increment(-1),
        lastCheckedAt: serverTimestamp()
      }, { merge: true });
      
      // Increase notification read count
      const notifRef = doc(fireDB, "notifications", notificationId);
      batch.update(notifRef, {
        readCount: increment(1)
      });
      
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  export const markAllNotificationsAsRead = async (userEmail) => {
    try {
      // Get all unread notifications for user
      const unreadNotifications = await getUserNotifications(userEmail, null, 100);
      
      if (!unreadNotifications.success) {
        throw new Error(unreadNotifications.error);
      }
      
      const unreadNotifs = unreadNotifications.notifications.filter(n => !n.isRead);
      
      if (unreadNotifs.length === 0) {
        return { success: true, markedCount: 0 };
      }
      
      // Process in batches
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < unreadNotifs.length; i += batchSize) {
        const batch = writeBatch(fireDB);
        const chunk = unreadNotifs.slice(i, i + batchSize);
        
        chunk.forEach(notif => {
          // Create read record
          const readRef = doc(fireDB, "notificationReads", `${notif.id}_${userEmail}`);
          batch.set(readRef, {
            notificationId: notif.id,
            userEmail,
            readAt: serverTimestamp(),
            isRead: true
          });
          
          // Increase notification read count
          const notifRef = doc(fireDB, "notifications", notif.id);
          batch.update(notifRef, {
            readCount: increment(1)
          });
        });
        
        batches.push(batch.commit());
      }
      
      await Promise.all(batches);
      
      // Reset unread count
      const summaryRef = doc(fireDB, "userNotificationSummary", userEmail);
      await updateDoc(summaryRef, {
        unreadCount: 0,
        lastCheckedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        markedCount: unreadNotifs.length 
      };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Real-time listeners
  export const subscribeToUnreadCount = (userEmail, callback) => {
    const summaryRef = doc(fireDB, "userNotificationSummary", userEmail);
    
    return onSnapshot(summaryRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.unreadCount || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      console.error("Error subscribing to unread count:", error);
      callback(0);
    });
  };
  
  export const subscribeToNotifications = (userEmail, callback, pageSize = 20) => {
    const q = query(
      collection(fireDB, "notifications"),
      where("targetUsers", "array-contains", userEmail),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    
    return onSnapshot(q, async (querySnapshot) => {
      try {
        const notificationPromises = querySnapshot.docs.map(async (notifDoc) => {
          const notifData = notifDoc.data();
          
          // Check read status
          const readDocRef = doc(fireDB, "notificationReads", `${notifDoc.id}_${userEmail}`);
          const readDoc = await getDoc(readDocRef);
          
          return {
            id: notifDoc.id,
            ...notifData,
            createdAt: notifData.createdAt?.toDate() || new Date(),
            isRead: readDoc.exists(),
            readAt: readDoc.exists() ? readDoc.data().readAt?.toDate() : null
          };
        });
  
        const notifications = await Promise.all(notificationPromises);
        callback(notifications);
      } catch (error) {
        console.error("Error in notifications subscription:", error);
        callback([]);
      }
    }, (error) => {
      console.error("Error subscribing to notifications:", error);
      callback([]);
    });
  };
  
  // Utility functions
  export const processMarkdownLinks = (content) => {
    // Convert markdown links [text](url) to HTML
    return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  };
  
  export const extractPlainText = (htmlContent, maxLength = 100) => {
    // Remove HTML tags and truncate
    const plainText = htmlContent.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };