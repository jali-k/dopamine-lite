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

export const getNotificationHistory = async (adminEmail, lastDoc = null, pageSize = 20, includeDeleted = false) => {
  try {
    let q = query(
      collection(fireDB, "notifications"),
      where("createdBy", "==", adminEmail),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Only show active notifications by default
    if (!includeDeleted) {
      q = query(
        collection(fireDB, "notifications"),
        where("createdBy", "==", adminEmail),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }

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
        deletedAt: data.deletedAt?.toDate() || null,
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

// Utility functions - UPDATED WITH LINE BREAK SUPPORT

/**
 * Processes markdown links and line breaks to HTML
 * @param {string} content - Raw content with markdown links and line breaks
 * @returns {string} - HTML content with processed links and line breaks
 */
export const processMarkdownLinks = (content) => {
  if (!content) return "";
  
  // Step 1: Escape HTML to prevent XSS attacks
  let processedContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  
  // Step 2: Convert markdown links [text](url) to HTML <a> tags
  processedContent = processedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Step 3: Convert **bold** to <strong> tags
  processedContent = processedContent.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );
  
  // Step 4: Convert *italic* to <em> tags (but not the ** that we already processed)
  // Using negative lookbehind and lookahead to avoid matching ** patterns
  processedContent = processedContent.replace(
    /(?<!\*)\*([^*]+)\*(?!\*)/g,
    '<em>$1</em>'
  );
  
  // Step 5: Convert line breaks to HTML
  processedContent = convertLineBreaksToHTML(processedContent);
  
  return processedContent;
};

/**
 * Converts line breaks to HTML paragraphs and breaks
 * @param {string} content - Content with \n line breaks
 * @returns {string} - Content with HTML line breaks
 */
const convertLineBreaksToHTML = (content) => {
  // Split content by double line breaks (paragraphs)
  const paragraphs = content.split(/\n\s*\n/);
  
  return paragraphs
    .map(paragraph => {
      // Trim whitespace and skip empty paragraphs
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) return '';
      
      // Convert single line breaks within paragraphs to <br> tags
      const withBreaks = trimmedParagraph.replace(/\n/g, '<br>');
      
      // Wrap in paragraph tags
      return `<p>${withBreaks}</p>`;
    })
    .filter(p => p) // Remove empty paragraphs
    .join('');
};

/**
 * Alternative simpler approach - just convert all line breaks to <br>
 * Use this if you prefer simple line breaks over paragraph structure
 * @param {string} content - Raw content with line breaks
 * @returns {string} - Content with <br> tags
 */
export const simpleLineBreakConversion = (content) => {
  if (!content) return "";
  
  // Escape HTML first
  let processedContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  
  // Process markdown
  processedContent = processedContent.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  processedContent = processedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processedContent = processedContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Simple: Convert all \n to <br>
  processedContent = processedContent.replace(/\n/g, '<br>');
  
  return processedContent;
};

/**
 * Extract plain text from HTML content and truncate if needed
 * @param {string} htmlContent - HTML content
 * @param {number} maxLength - Maximum length for truncation
 * @returns {string} - Plain text, possibly truncated
 */
export const extractPlainText = (htmlContent, maxLength = 100) => {
  if (!htmlContent) return "";
  
  // Remove HTML tags and decode HTML entities
  let plainText = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  
  // Normalize whitespace
  plainText = plainText.replace(/\s+/g, ' ').trim();
  
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
};

// Add these new functions to your existing notificationService.js

/**
 * Delete a single notification (Admin only)
 * @param {string} notificationId - ID of notification to delete
 * @param {string} adminEmail - Email of admin performing deletion
 * @returns {Promise<Object>} - Result object
 */
export const deleteNotification = async (notificationId, adminEmail) => {
  try {
    const batch = writeBatch(fireDB);
    
    // First, verify the notification belongs to this admin
    const notifRef = doc(fireDB, "notifications", notificationId);
    const notifDoc = await getDoc(notifRef);
    
    if (!notifDoc.exists()) {
      return {
        success: false,
        error: "Notification not found"
      };
    }
    
    const notifData = notifDoc.data();
    if (notifData.createdBy !== adminEmail) {
      return {
        success: false,
        error: "You don't have permission to delete this notification"
      };
    }
    
    // Mark notification as inactive instead of hard delete (safer approach)
    batch.update(notifRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
      deletedBy: adminEmail
    });
    
    // Optional: Clean up related read records (you might want to keep these for analytics)
    // const readQuery = query(
    //   collection(fireDB, "notificationReads"),
    //   where("notificationId", "==", notificationId)
    // );
    // const readDocs = await getDocs(readQuery);
    // readDocs.forEach((doc) => {
    //   batch.delete(doc.ref);
    // });
    
    await batch.commit();
    
    return {
      success: true,
      message: "Notification deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete multiple notifications (Admin only)
 * @param {string[]} notificationIds - Array of notification IDs to delete
 * @param {string} adminEmail - Email of admin performing deletion
 * @returns {Promise<Object>} - Result object
 */
export const deleteMultipleNotifications = async (notificationIds, adminEmail) => {
  try {
    if (!notificationIds || notificationIds.length === 0) {
      return {
        success: false,
        error: "No notifications selected for deletion"
      };
    }
    
    const batch = writeBatch(fireDB);
    const errors = [];
    let successCount = 0;
    
    // Process each notification
    for (const notificationId of notificationIds) {
      try {
        const notifRef = doc(fireDB, "notifications", notificationId);
        const notifDoc = await getDoc(notifRef);
        
        if (!notifDoc.exists()) {
          errors.push(`Notification ${notificationId} not found`);
          continue;
        }
        
        const notifData = notifDoc.data();
        if (notifData.createdBy !== adminEmail) {
          errors.push(`No permission to delete notification ${notificationId}`);
          continue;
        }
        
        // Mark as inactive
        batch.update(notifRef, {
          isActive: false,
          deletedAt: serverTimestamp(),
          deletedBy: adminEmail
        });
        
        successCount++;
      } catch (error) {
        errors.push(`Error processing ${notificationId}: ${error.message}`);
      }
    }
    
    if (successCount > 0) {
      await batch.commit();
    }
    
    return {
      success: successCount > 0,
      message: `${successCount} notification(s) deleted successfully`,
      errors: errors.length > 0 ? errors : null,
      deletedCount: successCount
    };
  } catch (error) {
    console.error("Error deleting multiple notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Permanently delete a notification (use with caution)
 * @param {string} notificationId - ID of notification to permanently delete
 * @param {string} adminEmail - Email of admin performing deletion
 * @returns {Promise<Object>} - Result object
 */
export const permanentlyDeleteNotification = async (notificationId, adminEmail) => {
  try {
    const batch = writeBatch(fireDB);
    
    // Verify ownership
    const notifRef = doc(fireDB, "notifications", notificationId);
    const notifDoc = await getDoc(notifRef);
    
    if (!notifDoc.exists()) {
      return {
        success: false,
        error: "Notification not found"
      };
    }
    
    const notifData = notifDoc.data();
    if (notifData.createdBy !== adminEmail) {
      return {
        success: false,
        error: "You don't have permission to delete this notification"
      };
    }
    
    // Delete the notification document
    batch.delete(notifRef);
    
    // Clean up related read records
    const readQuery = query(
      collection(fireDB, "notificationReads"),
      where("notificationId", "==", notificationId)
    );
    const readDocs = await getDocs(readQuery);
    readDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return {
      success: true,
      message: "Notification permanently deleted"
    };
  } catch (error) {
    console.error("Error permanently deleting notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Restore a soft-deleted notification
 * @param {string} notificationId - ID of notification to restore
 * @param {string} adminEmail - Email of admin performing restoration
 * @returns {Promise<Object>} - Result object
 */
export const restoreNotification = async (notificationId, adminEmail) => {
  try {
    const notifRef = doc(fireDB, "notifications", notificationId);
    const notifDoc = await getDoc(notifRef);
    
    if (!notifDoc.exists()) {
      return {
        success: false,
        error: "Notification not found"
      };
    }
    
    const notifData = notifDoc.data();
    if (notifData.createdBy !== adminEmail) {
      return {
        success: false,
        error: "You don't have permission to restore this notification"
      };
    }
    
    await updateDoc(notifRef, {
      isActive: true,
      restoredAt: serverTimestamp(),
      restoredBy: adminEmail,
      deletedAt: null,
      deletedBy: null
    });
    
    return {
      success: true,
      message: "Notification restored successfully"
    };
  } catch (error) {
    console.error("Error restoring notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// New function to get deleted notifications
export const getDeletedNotifications = async (adminEmail, lastDoc = null, pageSize = 20) => {
  try {
    let q = query(
      collection(fireDB, "notifications"),
      where("createdBy", "==", adminEmail),
      where("isActive", "==", false),
      orderBy("deletedAt", "desc"),
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
        deletedAt: data.deletedAt?.toDate() || null,
        docRef: doc
      });
    });

    return {
      success: true,
      notifications,
      hasMore: notifications.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching deleted notifications:", error);
    return {
      success: false,
      error: error.message,
      notifications: []
    };
  }
};