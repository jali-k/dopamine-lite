export const getNotifications = async (userEmail) => {
  const encodedEmail = encodeURIComponent(userEmail);
  const response = await fetch(`http://ec2-100-29-40-217.compute-1.amazonaws.com:3000/api/notifications/user/${encodedEmail}?limit=5&offset=0&readStatus=all`);
  return response.json();
};

// export default getNotifications;
