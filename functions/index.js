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
        body: messageData.body,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentBy: messageData.sentBy,
        recipients: messageData.recipients.map(recipient => ({
          ...recipient,
          status: "pending"
        })),
        totalRecipients: messageData.recipients.length,
        successCount: 0,
        failureCount: 0,
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
            personalizedBody = personalizedBody.replace(/{{name}}/gi, recipient.name);
            personalizedBody = personalizedBody.replace(/{{email}}/gi, recipient.email);
            personalizedBody = personalizedBody.replace(/{{month}}/gi, new Date().toLocaleString('default', { month: 'long' }));
            personalizedBody = personalizedBody.replace(/{{date}}/gi, new Date().toLocaleDateString());
            
            // If you have other placeholders, add them here
            
            // Convert Markdown to HTML (you may want to use a proper markdown parser)
            // This is a simple example
            let htmlBody = personalizedBody
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
              .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
              .replace(/__(.*?)__/g, '<u>$1</u>')                // Underline
              .replace(/\n/g, '<br>');                           // Line breaks
            
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