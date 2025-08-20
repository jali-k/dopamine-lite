const getNotifications = async (userEmail) => {
  const encodedEmail = encodeURIComponent(userEmail);
  const response = await fetch(`https://bcend.sddopamine.com/api/notifications/user/${encodedEmail}?limit=5&offset=0&readStatus=all`);
  return response.json();
};

// Create and send notifications (for manually added individual users)
const createNotification = async (notificationData) => {
  const response = await fetch('https://bcend.sddopamine.com/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notificationData),
  });
  return response.json();
};

// Upload CSV and send notifications (for CSV file uploads)
const uploadCsvNotifications = async (csvFile, notificationData) => {
  const formData = new FormData();
  
  // Add the CSV file
  formData.append('csvFile', csvFile);
  
  // Add notification data as form fields
  formData.append('title', notificationData.title);
  formData.append('content', notificationData.content);
  if (notificationData.contentHtml) {
    formData.append('contentHtml', notificationData.contentHtml);
  }
  formData.append('createdBy', notificationData.createdBy);
  formData.append('personalized', notificationData.personalized);

  const response = await fetch('https://bcend.sddopamine.com/api/notifications/csv-upload', {
    method: 'POST',
    body: formData, // Don't set Content-Type header, let browser set it for multipart/form-data
  });
  return response.json();
};

// Send notifications with recipient array (alternative to CSV for programmatic use)
const sendNotificationsWithRecipients = async (notificationData) => {
  const response = await fetch('https://bcend.sddopamine.com/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notificationData),
  });
  return response.json();
};

// Get user notifications with pagination and filters
const getUserNotifications = async (userEmail, options = {}) => {
  const { limit = 10, offset = 0, readStatus = 'all', personalized = null } = options;
  const encodedEmail = encodeURIComponent(userEmail);
  
  let url = `https://bcend.sddopamine.com/api/notifications/user/${encodedEmail}?limit=${limit}&offset=${offset}&readStatus=${readStatus}`;
  
  if (personalized !== null) {
    url += `&personalized=${personalized}`;
  }
  
  const response = await fetch(url);
  console.log("User Notifications Response:", response);
  return response.json();
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userEmail) => {
  const response = await fetch(`https://bcend.sddopamine.com/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userEmail }),
  });
  return response.json();
};

// Get notification statistics
const getNotificationStats = async (userEmail) => {
  const encodedEmail = encodeURIComponent(userEmail);
  const response = await fetch(`https://bcend.sddopamine.com/api/notifications/stats/${encodedEmail}`);
  return response.json();
};

// Get single notification by ID
const getNotificationById = async (notificationId, userEmail) => {
  const encodedEmail = encodeURIComponent(userEmail);
  const response = await fetch(`https://bcend.sddopamine.com/api/notifications/${notificationId}/user/${encodedEmail}`);
  return response.json();
};

export { 
  getNotifications, 
  createNotification, 
  uploadCsvNotifications,
  sendNotificationsWithRecipients, 
  getUserNotifications, 
  markNotificationAsRead, 
  getNotificationStats,
  getNotificationById
};
