// This file should be created in your Firebase Cloud Functions directory
// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// Initialize SendGrid with your API key
// You'll need to set this in your Firebase environment using:
// firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY"
const sendgridApiKey = functions.config().sendgrid.apikey;
sgMail.setApiKey(sendgridApiKey);

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
          await new Promise(resolve => setTimeout(resolve, 1000));
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