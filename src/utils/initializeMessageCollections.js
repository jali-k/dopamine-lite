// src/utils/initializeMessageCollections.js
// This utility script creates the necessary collections for the Message Center

import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";

/**
 * Initialize the required collections for the Message Center
 * Run this function once in your app to set up the necessary collections
 */
export const initializeMessageCollections = async () => {
  try {
    console.log("Initializing Message Center collections...");
    
    // Create a sample template in messageTemplates collection
    const templateRef = doc(collection(fireDB, "messageTemplates"), "welcome_template");
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      console.log("Creating sample message template...");
      await setDoc(templateRef, {
        title: "Payment Confirmation Template",
        body: "Dear {{name}},\n\nYour payment for the month of {{month}} has been received and processed successfully.\n\nThank you for your continued support.\n\nBest regards,\nDopamine Lite Team",
        createdAt: serverTimestamp(),
        createdBy: "system",
        placeholders: ["name", "month"]
      });
    }
    
    // Create a document in messageQueue collection to initialize it
    const queueRef = doc(collection(fireDB, "messageQueue"), "initialization");
    const queueDoc = await getDoc(queueRef);
    
    if (!queueDoc.exists()) {
      console.log("Initializing message queue collection...");
      await setDoc(queueRef, {
        title: "Collection Initialization",
        body: "This is a placeholder document to initialize the collection.",
        status: "system",
        createdAt: serverTimestamp()
      });
    }
    
    // Create a document in messageHistory collection to initialize it
    const historyRef = doc(collection(fireDB, "messageHistory"), "initialization");
    const historyDoc = await getDoc(historyRef);
    
    if (!historyDoc.exists()) {
      console.log("Initializing message history collection...");
      await setDoc(historyRef, {
        title: "Collection Initialization",
        body: "This is a placeholder document to initialize the collection.",
        sentAt: serverTimestamp(),
        sentBy: "system",
        recipients: [],
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0
      });
    }
    
    console.log("Message Center collections initialized successfully");
    return { success: true };
  } catch (error) {
    console.error("Error initializing Message Center collections:", error);
    return { success: false, error };
  }
};

/**
 * Call this function in a useEffect in your App.jsx or a similar component that loads early
 * Example:
 * 
 * useEffect(() => {
 *   // Only run for admin users
 *   if (isAdmin) {
 *     initializeMessageCollections();
 *   }
 * }, [isAdmin]);
 */

export default initializeMessageCollections;