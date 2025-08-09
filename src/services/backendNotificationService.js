const getNotifications = async (userEmail) => {
  const encodedEmail = encodeURIComponent(userEmail);
  const response = await fetch(`http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/user/${encodedEmail}?limit=5&offset=0&readStatus=all`);
  return response.json();
};

// Create and send notifications
const createNotification = async (notificationData) => {
  const response = await fetch('http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notificationData),
  });
  return response.json();
};

// Upload CSV and send notifications
const uploadCsvNotifications = async (csvData) => {
  const response = await fetch('http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/csv-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(csvData),
  });
  return response.json();
};

// Get user notifications with pagination and filters
const getUserNotifications = async (userEmail, options = {}) => {
  const { limit = 10, offset = 0, readStatus = 'all', personalized = null } = options;
  const encodedEmail = encodeURIComponent(userEmail);
  
  let url = `http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/user/${encodedEmail}?limit=${limit}&offset=${offset}&readStatus=${readStatus}`;
  
  if (personalized !== null) {
    url += `&personalized=${personalized}`;
  }
  
  const response = await fetch(url);
  return response.json();
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, userEmail) => {
  const response = await fetch(`http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/${notificationId}/read`, {
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
  const response = await fetch(`http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/stats/${encodedEmail}`);
  return response.json();
};

// Get single notification by ID
const getNotificationById = async (notificationId, userEmail) => {
  const encodedEmail = encodeURIComponent(userEmail);
  const response = await fetch(`http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/${notificationId}/user/${encodedEmail}`);
  return response.json();
};

export { 
  getNotifications, 
  createNotification, 
  uploadCsvNotifications, 
  getUserNotifications, 
  markNotificationAsRead, 
  getNotificationStats,
  getNotificationById
};
