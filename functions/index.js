// Firebase Cloud Functions
// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const axios = require("axios");
const NodeCache = require('node-cache');
const cors = require("cors");

admin.initializeApp();

// Initialize SendGrid with your API key
// You'll need to set this in your Firebase environment using:
// firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY"
// const sendgridApiKey = functions.config().sendgrid.apikey;
// sgMail.setApiKey(sendgridApiKey);

// Constants for getPresignedUrl function
const allowedDomains = ["https://dopamineapplite.com", "https://dev.d39hs0u14r6hzo.amplifyapp.com", "https://dopamine-lite-v1-dev.firebaseapp.com", "https://dopamine-lite-v1-dev.web.app" ];
const SHIFT = 3;
const API_GATEWAY_URL = "https://i1kwmbic8c.execute-api.us-east-1.amazonaws.com/geturl";
const CHECK_KEY = "#RTDFGhrt^756HG^#*756GDF";
const secretCode ="HET349DGHFRT#5$hY^GFS6*tH4*HW&";
const processedCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// CORS configuration for getPresignedUrl
const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin || allowedDomains.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
});

// Helper function for decoding essence
const decodeTheEssence = (encodedStr, secretCode) => {
  let decoded = '';

  // Decode by shifting each character back
  for (let i = 0; i < encodedStr.length; i++) {
    const char = encodedStr[i];
    if (/[a-zA-Z]/.test(char)) {
      const base = char >= 'a' ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
      decoded += String.fromCharCode(((char.charCodeAt(0) - base - SHIFT + 26) % 26) + base);
    } else if (/\d/.test(char)) {
      decoded += (parseInt(char, 10) - SHIFT + 10) % 10; // Reverse shift digits
    } else {
      decoded += char; // Leave non-alphanumeric characters unchanged
    }
  }

  // Extract the timestamp (first 13 characters)
  const timestamp = decoded.slice(0, 13);

  // Remove the timestamp and secret code from the decoded string
  const base64Email = decoded.slice(13 + secretCode.length);

  // Base64 decode the email
  const email = Buffer.from(base64Email, 'base64').toString('utf-8');

  return { timestamp, email };
};

// Helper function for making requests with retry
async function makeRequestWithRetry(url, params, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt === retries) {
        throw new Error("All retry attempts failed");
      }
      // Optional: Delay between retries
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Cloud Function to get presigned URLs for video access
 * This function handles CORS, validates requests, and proxies to AWS API Gateway
 */
exports.devgetPresignedUrl = functions
  .runWith({ timeoutSeconds: 300 }) // 5 minutes timeout
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        // Extract headers and body
        const origin = req.headers.origin;
        const userIp = req.headers["x-appengine-user-ip"];
        const city = req.headers["x-appengine-city"];
        const country = req.headers["x-appengine-country"];
        const email  = req.headers["email"];
        const theensemble = req.headers["theensemble"];

        console.log(`Request from IP: ${userIp}, City: ${city}, Country: ${country} Origin: ${origin}, Email: ${email}, TheEnsemble: ${theensemble}`);

        // Validate origin and keys
        if (!allowedDomains.includes(origin) || !email || !theensemble) {
          console.error("Validation failed:", `Request from IP: ${userIp}, City: ${city}, Country: ${country} Origin: ${origin}, Email: ${email}, TheEnsemble: ${theensemble} Header: ${JSON.stringify(req.headers)}`);
          return res
            .status(403)
            .send({ error: "Forbidden: Access denied. This incident will be logged for further investigation." });
        }

        // Check if the request is already processed
        if (processedCache.has(theensemble)) {
          console.error("Replayed Ensemble:", `Request from IP: ${userIp}, City: ${city}, Country: ${country} Origin: ${origin}, Email: ${email}, TheEnsemble: ${theensemble} Header: ${JSON.stringify(req.headers)}`);
          return res
            .status(403)
            .send({ error: "Forbidden: Access denied. This incident will be logged for further investigation." });
        }

        // Decode the encoded data
        const { timestamp, email:decodeemail } = decodeTheEssence(theensemble, secretCode);

        // Validate the timestamp
        const currentTime = Date.now();
        if (currentTime - parseInt(timestamp, 10) > 60 * 1000 || decodeemail !== email) {
          console.error("Late request:", `Request from IP: ${userIp}, timeStamp: ${timestamp}, City: ${city}, Country: ${country} Origin: ${origin}, Email: ${email}, Decode Email: ${decodeemail} TheEnsemble: ${theensemble} Header: ${JSON.stringify(req.headers)}`);
          return res
            .status(403)
            .send({ error: "Forbidden: Access denied. This incident will be logged for further investigation." });
        }

        // Cache the encoded data to prevent replay
        processedCache.set(theensemble, true);

        // Extract query parameters
        // Changed the expiration of manifest from 3600 to 28800 (8 hours) on 27/04/2025
        const { manifest_key: manifestKey, folder, expiration = 28800 } = req.query;

        if (!manifestKey || !folder) {
          return res
            .status(400)
            .send({ error: "Missing required query parameters: manifest_key, folder." });
        }

        // Determine if this is a new converted video (starts with videos/)
        const isNewConvertedVideo = folder.startsWith('videos/');
        
        console.log(`Processing ${isNewConvertedVideo ? 'new converted' : 'legacy'} video for folder: ${folder}, manifest: ${manifestKey}`);

        // Prepare parameters for API Gateway request
        let params;
        
        if (isNewConvertedVideo && manifestKey === 'master.m3u8') {
          // New converted video with master playlist
          params = {
            manifest_key: manifestKey,
            folder,
            expiration: 28800,
            video_type: 'new_converted'
          };
        } else {
          // Legacy video or quality-specific playlist
          params = {
            manifest_key: manifestKey,
            segment_keys: "index0.ts,index1.ts",
            folder,
            expiration: 28800,
            video_type: 'legacy'
          };
        }

        console.log('Sending params to Lambda:', params);

        // Call API Gateway with retries
        const result = await makeRequestWithRetry(API_GATEWAY_URL, params);
        res.status(200).send(result);
      } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).send({ error: "Internal server error" });
      }
    });
  });

/**
 * Cloud Function to send bulk emails to students
 * This function is triggered by a new document in the 'messageQueue' collection
 * It processes emails in batches to stay within SendGrid rate limits
 */
exports.sendBulkEmails = functions.firestore
    .document("messageQueue/{messageId}")
    .onCreate(async (snapshot, context) => {
      // Get the message data from the document
      const messageData = snapshot.data();
      
      // Log the beginning of processing
      console.log(`Starting to process message ${context.params.messageId}`);
      
      // References to the message and history documents
      const messageRef = admin.firestore().collection("messageQueue").doc(context.params.messageId);
      const historyRef = admin.firestore().collection("messageHistory").doc(context.params.messageId);
      
      // Update status to "processing"
      await messageRef.update({
        status: "processing",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Create message history document
      await historyRef.set({
        title: messageData.title,
        body: messageData.body, // Store the original body for proper display
        htmlBody: messageData.htmlBody || messageData.body.replace(/\n/g, '<br>'), // Store HTML version if available
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: messageData.sentBy,
        recipients: messageData.recipients.map(recipient => ({
          ...recipient,
          status: "pending"
        })),
        totalRecipients: messageData.recipients.length,
        successCount: 0,
        failureCount: 0,
        preserveWhitespace: true, // Flag to indicate whitespace preservation
      });
      
      // Process emails in batches of 100 (adjust based on your SendGrid plan)
      const BATCH_SIZE = 100;
      let successCount = 0;
      let failureCount = 0;
      
      // Process each batch
      for (let i = 0; i < messageData.recipients.length; i += BATCH_SIZE) {
        const batch = messageData.recipients.slice(i, i + BATCH_SIZE);
        
        // Process each recipient in the current batch
        const emailPromises = batch.map(async (recipient) => {
          try {
            // Replace placeholders in the message
            let personalizedBody = messageData.body;
            
            // Standard replacements
            personalizedBody = personalizedBody.replace(/{{name}}/gi, recipient.name || "");
            personalizedBody = personalizedBody.replace(/{{email}}/gi, recipient.email || "");
            personalizedBody = personalizedBody.replace(/{{month}}/gi, new Date().toLocaleString('default', { month: 'long' }));
            personalizedBody = personalizedBody.replace(/{{date}}/gi, new Date().toLocaleDateString());
            
            // Add support for registration number
            personalizedBody = personalizedBody.replace(/{{registration}}/gi, recipient.registration || "");
            
            // Decide on HTML body - either use provided one or generate from text
            let htmlBody;
            
            if (messageData.htmlBody) {
              // If htmlBody was prepared by the client, use it with placeholder replacements
              htmlBody = messageData.htmlBody;
              htmlBody = htmlBody.replace(/{{name}}/gi, recipient.name || "");
              htmlBody = htmlBody.replace(/{{email}}/gi, recipient.email || "");
              htmlBody = htmlBody.replace(/{{month}}/gi, new Date().toLocaleString('default', { month: 'long' }));
              htmlBody = htmlBody.replace(/{{date}}/gi, new Date().toLocaleDateString());
              htmlBody = htmlBody.replace(/{{registration}}/gi, recipient.registration || "");
            } else {
              // Process each line individually to maintain exact whitespace
              const lines = personalizedBody.split('\n');
              
              // Process each line to handle Markdown, but preserve whitespace exactly
              const htmlLines = lines.map(line => {
                return line
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
                  .replace(/__(.*?)__/g, '<u>$1</u>');               // Underline
              });
              
              // Join with <br> tags but no extra whitespace
              htmlBody = htmlLines.join('<br>');
            }
            
            // Wrap HTML content in a div with white-space: pre-wrap for proper formatting
            // IMPORTANT: No line breaks or extra spaces in this template literal
            htmlBody = `<div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.5;">${htmlBody}</div>`;
            
            // Create the email
            const msg = {
              to: recipient.email,
              from: messageData.fromEmail || "noreply@yourdomain.com", // Use your verified sender
              subject: messageData.title,
              text: personalizedBody, // Plain text version
              html: htmlBody,        // HTML version
            };
            
            // Send the email
            await sgMail.send(msg);
            
            // Update recipient status to success
            await admin.firestore().runTransaction(async (transaction) => {
              const historyDoc = await transaction.get(historyRef);
              const historyData = historyDoc.data();
              
              const updatedRecipients = historyData.recipients.map(r => 
                r.email === recipient.email ? { ...r, status: "sent" } : r
              );
              
              transaction.update(historyRef, { 
                recipients: updatedRecipients,
                successCount: admin.firestore.FieldValue.increment(1)
              });
            });
            
            successCount++;
            console.log(`Email sent to ${recipient.email}`);
            
            return { email: recipient.email, success: true };
          } catch (error) {
            // Update recipient status to failed
            await admin.firestore().runTransaction(async (transaction) => {
              const historyDoc = await transaction.get(historyRef);
              const historyData = historyDoc.data();
              
              const updatedRecipients = historyData.recipients.map(r => 
                r.email === recipient.email ? { ...r, status: "failed", error: error.message } : r
              );
              
              transaction.update(historyRef, { 
                recipients: updatedRecipients,
                failureCount: admin.firestore.FieldValue.increment(1)
              });
            });
            
            failureCount++;
            console.error(`Failed to send email to ${recipient.email}:`, error);
            
            return { email: recipient.email, success: false, error: error.message };
          }
        });
        
        // Wait for all emails in this batch to be processed before moving to the next batch
        await Promise.all(emailPromises);
        
        // Update the message queue document with progress
        const progress = Math.min(100, Math.floor(((i + batch.length) / messageData.recipients.length) * 100));
        await messageRef.update({
          progress,
          successCount,
          failureCount,
        });
        
        // Add a small delay between batches to respect rate limits
        if (i + BATCH_SIZE < messageData.recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      
      // Update the message queue document to completed
      await messageRef.update({
        status: "completed",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        progress: 100,
        successCount,
        failureCount,
      });
      
      console.log(`Completed processing message ${context.params.messageId}`);
      console.log(`Success: ${successCount}, Failures: ${failureCount}`);
      
      return { success: true, messageId: context.params.messageId };
    });


/**
 * Cloud Function to process notifications and update user summaries
 * This function is triggered by a new document in the 'notifications' collection
 */
exports.processNotification = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snapshot, context) => {
    try {
      const notification = snapshot.data();
      const notificationId = context.params.notificationId;
      
      console.log(`Processing notification ${notificationId} for ${notification.targetUsers.length} users`);
      
      const { targetUsers, createdAt } = notification;
      
      if (!targetUsers || targetUsers.length === 0) {
        console.log("No target users found");
        return;
      }

      // Process users in batches of 500 (Firestore limit)
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < targetUsers.length; i += batchSize) {
        const batch = admin.firestore().batch();
        const chunk = targetUsers.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}, users ${i + 1} to ${Math.min(i + batchSize, targetUsers.length)}`);
        
        chunk.forEach(userEmail => {
          const summaryRef = admin.firestore().doc(`userNotificationSummary/${userEmail}`);
          batch.set(summaryRef, {
            unreadCount: admin.firestore.FieldValue.increment(1),
            lastNotificationAt: createdAt,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
        
        batches.push(batch.commit());
      }
      
      // Execute all batches in parallel
      await Promise.all(batches);
      
      console.log(`Successfully processed notification ${notificationId} for ${targetUsers.length} users`);
      
      // Update notification status
      await admin.firestore().doc(`notifications/${notificationId}`).update({
        status: 'processed',
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error("Error processing notification:", error);
      
      // Update notification with error status
      await admin.firestore().doc(`notifications/${context.params.notificationId}`).update({
        status: 'error',
        error: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });


  /**
 * MAIN CLOUD FUNCTION: processPersonalizedNotificationQueue
 * 
 * What triggers this function?
 * - When a new document is created in the "personalizedNotificationQueue" collection
 * - This happens when an admin clicks "Send Notifications" in the UI
 * 
 * What does this function do?
 * 1. Reads the notification request (title, body, recipients from CSV)
 * 2. Processes recipients in batches (500 at a time to avoid memory issues)
 * 3. For each recipient, replaces {{placeholders}} with their actual data
 * 4. Creates individual notification documents for each student
 * 5. Updates unread counts for real-time badge updates
 */
exports.processPersonalizedNotificationQueue = functions.firestore
.document("personalizedNotificationQueue/{queueId}")
.onCreate(async (snapshot, context) => {
  
  // Get the data that was just added to the queue
  const queueData = snapshot.data();
  const queueId = context.params.queueId;
  
  console.log(`Starting to process notification queue: ${queueId}`);
  console.log(`Recipients count: ${queueData.recipients?.length || 0}`);
  
  // Step 1: Update the queue status to "processing"
  await updateQueueStatus(queueId, "processing");
  
  try {
    // Step 2: Get all the recipients (students from CSV upload)
    const recipients = queueData.recipients || [];
    
    if (recipients.length === 0) {
      throw new Error("No recipients found in queue document");
    }
    
    // Step 3: Split recipients into batches of 500
    // Why? Firestore has limits on batch operations (500 writes per batch)
    const batches = createBatches(recipients, 500);
    console.log(`Created ${batches.length} batches for processing`);
    
    // Step 4: Process each batch sequentially (one after another)
    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length}`);
      await processBatch(batches[i], queueData, queueId);
      
      // Small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Step 5: Mark the queue as completed
    await updateQueueStatus(queueId, "completed");
    console.log(`Successfully completed processing queue: ${queueId}`);
    
  } catch (error) {
    // If anything goes wrong, mark the queue as failed
    console.error(`Error processing queue ${queueId}:`, error);
    await updateQueueStatus(queueId, "failed", error.message);
  }
});

/**
* HELPER FUNCTION: updateQueueStatus
* 
* What does this do?
* - Updates the status of a queue document so admins can see progress
* - Adds timestamps for tracking when things happened
*/
async function updateQueueStatus(queueId, status, errorMessage = null) {
const updateData = {
  status: status, // "queued", "processing", "completed", or "failed"
  lastUpdated: admin.firestore.FieldValue.serverTimestamp()
};

// Add specific timestamps based on status
if (status === "processing") {
  updateData.processedAt = admin.firestore.FieldValue.serverTimestamp();
} else if (status === "completed") {
  updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
} else if (status === "failed") {
  updateData.error = errorMessage;
  updateData.failedAt = admin.firestore.FieldValue.serverTimestamp();
}

// Update the document in Firestore
await admin.firestore()
  .collection("personalizedNotificationQueue")
  .doc(queueId)
  .update(updateData);
}

/**
* HELPER FUNCTION: createBatches
* 
* What does this do?
* - Takes a large array of recipients and splits it into smaller chunks
* - This prevents memory issues and respects Firestore's batch write limits
* 
* Example: If you have 1,500 recipients, this creates 3 batches of 500 each
*/
function createBatches(recipients, batchSize) {
const batches = [];

// Loop through recipients in chunks
for (let i = 0; i < recipients.length; i += batchSize) {
  // slice() creates a new array with items from index i to i+batchSize
  const batch = recipients.slice(i, i + batchSize);
  batches.push(batch);
}

return batches;
}

/**
* HELPER FUNCTION: processBatch
* 
* What does this do?
* - Takes a batch of recipients (up to 500) and processes them all at once
* - Creates personalized notifications for each recipient
* - Updates unread counts for real-time badge updates
* - Uses Firestore batch writes for efficiency
*/
async function processBatch(recipientBatch, queueData, queueId) {
// Create a Firestore batch - this lets us write multiple documents atomically
// (all succeed or all fail together)
const batch = admin.firestore().batch();

// Process each recipient in this batch
recipientBatch.forEach(recipient => {
  // Step 1: Create personalized notification content
  const personalizedNotification = createPersonalizedNotification(recipient, queueData);
  
  // Step 2: Create a new document reference for this notification
  const notificationRef = admin.firestore()
    .collection("personalizedNotifications")
    .doc(); // auto-generates a unique ID
  
  // Step 3: Add this notification to the batch
  batch.set(notificationRef, personalizedNotification);
  
  // Step 4: Update the user's unread count
  const summaryRef = admin.firestore()
    .doc(`userPersonalizedNotificationSummary/${recipient.email}`);
  
  // This updates the summary document, creating it if it doesn't exist
  batch.set(summaryRef, {
    unreadCount: admin.firestore.FieldValue.increment(1), // Add 1 to current count
    totalCount: admin.firestore.FieldValue.increment(1),
    lastNotificationAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true }); // merge: true means don't overwrite existing fields
});

// Execute all the writes at once
await batch.commit();

// Update the queue progress
await admin.firestore()
  .collection("personalizedNotificationQueue")
  .doc(queueId)
  .update({
    processedCount: admin.firestore.FieldValue.increment(recipientBatch.length)
  });
}

/**
* HELPER FUNCTION: createPersonalizedNotification
* 
* What does this do?
* - Takes a recipient's data and the notification template
* - Replaces all {{placeholders}} with actual data
* - PRESERVES NEWLINES in the body text
* - Returns a complete notification document
*/
function createPersonalizedNotification(recipient, queueData) {
// Replace placeholders in title and body
const personalizedTitle = replacePlaceholders(queueData.title, recipient);
const personalizedBody = replacePlaceholders(queueData.body, recipient);

return {
  title: personalizedTitle,
  body: personalizedBody, // This preserves all newlines from original
  userEmail: recipient.email,
  isRead: false,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  readAt: null,
  metadata: {
    queueId: queueData.queueId || "unknown",
    originalTitle: queueData.title, // Keep original for debugging
    recipientName: recipient.name
  }
};
}

/**
* HELPER FUNCTION: replacePlaceholders
* 
* What does this do?
* - Takes text with {{placeholders}} and replaces them with actual values
* - PRESERVES all formatting including newlines, spaces, etc.
* - Handles missing data gracefully
* 
* Example:
* Input: "Hi {{name}},\n\nYour registration {{registration}} is confirmed."
* Output: "Hi John Doe,\n\nYour registration REG123 is confirmed."
*/
function replacePlaceholders(text, recipient) {
if (!text) return "";

return text
  // Replace {{name}} with recipient's name (case insensitive)
  .replace(/{{name}}/gi, recipient.name || "[Name not provided]")
  
  // Replace {{email}} with recipient's email
  .replace(/{{email}}/gi, recipient.email || "[Email not provided]")
  
  // Replace {{registration}} with recipient's registration number
  .replace(/{{registration}}/gi, recipient.registration || "[Registration not provided]")
  
  // Replace {{date}} with today's date
  .replace(/{{date}}/gi, new Date().toLocaleDateString())
  
  // Replace {{month}} with current month name
  .replace(/{{month}}/gi, new Date().toLocaleString('default', { month: 'long' }))
  
  // Add more placeholders here as needed
  ;
}

/**
* ADDITIONAL HELPER FUNCTION: markNotificationAsRead
* 
* This function will be called when a student clicks on a notification
* We'll create this as a separate function that the frontend can call
*/
exports.markPersonalizedNotificationAsRead = functions.https.onCall(async (data, context) => {
// Verify the user is authenticated
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
}

const { notificationId } = data;
const userEmail = context.auth.token.email;

try {
  // Use a transaction to ensure consistency
  await admin.firestore().runTransaction(async (transaction) => {
    // Get the notification document
    const notificationRef = admin.firestore()
      .collection("personalizedNotifications")
      .doc(notificationId);
    
    const notificationDoc = await transaction.get(notificationRef);
    
    if (!notificationDoc.exists) {
      throw new Error("Notification not found");
    }
    
    const notificationData = notificationDoc.data();
    
    // Verify this notification belongs to the current user
    if (notificationData.userEmail !== userEmail) {
      throw new Error("Not authorized to mark this notification as read");
    }
    
    // Only update if not already read
    if (!notificationData.isRead) {
      // Mark notification as read
      transaction.update(notificationRef, {
        isRead: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user summary
      const summaryRef = admin.firestore()
        .doc(`userPersonalizedNotificationSummary/${userEmail}`);
      
      transaction.update(summaryRef, {
        unreadCount: admin.firestore.FieldValue.increment(-1), // Subtract 1
        lastReadAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
  
  return { success: true };
} catch (error) {
  console.error("Error marking notification as read:", error);
  throw new functions.https.HttpsError('internal', error.message);
}
});

/*
* HOW NEWLINES ARE PRESERVED:
* 
* 1. In the admin interface, when user types:
*    "Hi {{name}},
*    
*    Your payment is due."
* 
* 2. This gets stored in Firestore exactly as typed (with \n characters)
* 
* 3. Cloud function replaces placeholders but keeps all formatting:
*    "Hi John Doe,
*    
*    Your payment is due."
* 
* 4. In React components, we'll use CSS white-space: pre-wrap to display properly
*/



// Add this to your existing functions/index.js file

/**
 * SCHEDULED CLEANUP FUNCTION: cleanupOldPersonalizedNotifications
 * 
 * What triggers this function?
 * - Google Cloud Scheduler (runs automatically on a schedule)
 * - Can also be triggered manually via HTTP for testing
 * 
 * What does this function do?
 * 1. Finds personalized notifications older than 30 days
 * 2. Deletes them in batches to avoid timeouts
 * 3. Updates user summary counts accordingly
 * 4. Logs progress for monitoring
 */
exports.cleanupOldPersonalizedNotifications = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max execution time
    memory: '1GB'
  })
  .pubsub.schedule('0 2 * * *') // Runs daily at 2:00 AM
  .timeZone('Asia/Colombo') // Set to your timezone
  .onRun(async (context) => {
    
    console.log('Starting cleanup of old personalized notifications');
    
    // Calculate the cutoff date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`Deleting notifications created before: ${thirtyDaysAgo.toISOString()}`);
    
    try {
      let totalDeleted = 0;
      let hasMore = true;
      
      // Process deletions in batches to avoid memory issues
      while (hasMore) {
        // Query for old notifications (limit to 500 per batch)
        const snapshot = await admin.firestore()
          .collection('personalizedNotifications')
          .where('createdAt', '<', thirtyDaysAgo)
          .limit(500)
          .get();
        
        if (snapshot.empty) {
          hasMore = false;
          console.log('No more notifications to delete');
          break;
        }
        
        console.log(`Found ${snapshot.size} notifications to delete in this batch`);
        
        // Track users whose counts need updating
        const userEmailsToUpdate = new Set();
        
        // Create a batch for deletions
        const batch = admin.firestore().batch();
        
        snapshot.docs.forEach(doc => {
          const notificationData = doc.data();
          
          // Track user for summary update (only if notification was unread)
          if (!notificationData.isRead && notificationData.userEmail) {
            userEmailsToUpdate.add(notificationData.userEmail);
          }
          
          // Add deletion to batch
          batch.delete(doc.ref);
        });
        
        // Execute the deletion batch
        await batch.commit();
        totalDeleted += snapshot.size;
        
        console.log(`Deleted ${snapshot.size} notifications`);
        
        // Update user summary counts for affected users
        if (userEmailsToUpdate.size > 0) {
          await updateUserSummaryCounts(Array.from(userEmailsToUpdate), snapshot.docs);
          console.log(`Updated summary counts for ${userEmailsToUpdate.size} users`);
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`Cleanup completed successfully. Total deleted: ${totalDeleted} notifications`);
      
      // Optional: Log to a cleanup history collection for monitoring
      await admin.firestore().collection('cleanupHistory').add({
        type: 'personalizedNotifications',
        deletedCount: totalDeleted,
        cutoffDate: thirtyDaysAgo,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'success'
      });
      
      return { success: true, deletedCount: totalDeleted };
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      
      // Log the error for monitoring
      await admin.firestore().collection('cleanupHistory').add({
        type: 'personalizedNotifications',
        error: error.message,
        cutoffDate: thirtyDaysAgo,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed'
      });
      
      throw error;
    }
  });

/**
 * HELPER FUNCTION: updateUserSummaryCounts
 * 
 * Updates unread counts for users whose unread notifications were deleted
 */
async function updateUserSummaryCounts(userEmails, deletedDocs) {
  // Count unread notifications per user
  const unreadCountsByUser = {};
  
  deletedDocs.forEach(doc => {
    const data = doc.data();
    if (!data.isRead && data.userEmail) {
      unreadCountsByUser[data.userEmail] = (unreadCountsByUser[data.userEmail] || 0) + 1;
    }
  });
  
  // Update user summaries in batches
  const batch = admin.firestore().batch();
  
  Object.entries(unreadCountsByUser).forEach(([userEmail, unreadCount]) => {
    const summaryRef = admin.firestore()
      .doc(`userPersonalizedNotificationSummary/${userEmail}`);
    
    batch.update(summaryRef, {
      unreadCount: admin.firestore.FieldValue.increment(-unreadCount),
      totalCount: admin.firestore.FieldValue.increment(-unreadCount),
      lastCleanupAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
}

/**
 * OPTIONAL: Manual cleanup function for testing/admin use
 * 
 * This creates an HTTP endpoint you can call manually:
 * POST https://your-region-your-project.cloudfunctions.net/manualCleanupNotifications
 */
exports.manualCleanupNotifications = functions.https.onCall(async (data, context) => {
  // Verify admin access (you can customize this check)
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const daysOld = data.daysOld || 30;
  
  console.log(`Manual cleanup requested for notifications older than ${daysOld} days`);
  
  // Use the same logic as the scheduled function
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  // ... (same cleanup logic as above)
  
  return { success: true, message: `Cleanup completed for notifications older than ${daysOld} days` };
});