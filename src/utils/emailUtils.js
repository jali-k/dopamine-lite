// src/utils/emailUtils.js

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";

/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {boolean} - Whether the email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Extracts placeholders from a message template
 * @param {string} text - The message template
 * @returns {string[]} - Array of placeholders
 */
export const extractPlaceholders = (text) => {
  const placeholderRegex = /{{([^{}]+)}}/g;
  const matches = [...text.matchAll(placeholderRegex)];
  return matches.map(match => match[1]);
};

/**
 * Replaces placeholders in a message with actual values
 * @param {string} text - The message template
 * @param {Object} data - Object containing values for placeholders
 * @returns {string} - The processed message
 */
export const replacePlaceholders = (text, data) => {
  let processedText = text;
  const placeholders = extractPlaceholders(text);
  
  placeholders.forEach(placeholder => {
    const value = data[placeholder] || `[${placeholder.toUpperCase()}]`;
    processedText = processedText.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
  });
  
  return processedText;
};

/**
 * Queue a bulk email message for sending
 * This adds the message to a Firestore collection that triggers the Cloud Function
 * @param {Object} messageData - The message data
 * @returns {Promise<string>} - Promise resolving to the messageId
 */
export const queueBulkEmail = async (messageData) => {
  try {
    // Validate required fields
    if (!messageData.title) throw new Error("Message title is required");
    if (!messageData.body) throw new Error("Message body is required");
    if (!messageData.recipients || !messageData.recipients.length) {
      throw new Error("Recipients are required");
    }
    
    // Create the message queue document
    const queueRef = collection(fireDB, "messageQueue");
    const docRef = await addDoc(queueRef, {
      ...messageData,
      status: "queued",
      queuedAt: serverTimestamp(),
      progress: 0,
      successCount: 0,
      failureCount: 0,
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error queueing email:", error);
    throw error;
  }
};

/**
 * Get common placeholders with descriptions
 * @returns {Array} - Array of placeholder objects with name and description
 */
export const getCommonPlaceholders = () => {
  return [
    { name: "name", description: "Student's full name" },
    { name: "email", description: "Student's email address" },
    { name: "month", description: "Payment month" },
    { name: "amount", description: "Payment amount" },
    { name: "date", description: "Current date" },
  ];
};

/**
 * Parse CSV data for student emails
 * @param {string} csvData - The CSV data as string
 * @returns {Promise<Array>} - Promise resolving to an array of student objects
 */
export const parseStudentCsv = async (csvData) => {
  try {
    // Import PapaParse dynamically to ensure client-side only
    const Papa = (await import('papaparse')).default;
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            return;
          }
          
          const students = [];
          const emails = new Set();
          
          results.data.forEach((row) => {
            // Find name and email columns
            const nameKey = Object.keys(row).find(
              key => key.toLowerCase().includes("name")
            );
            const emailKey = Object.keys(row).find(
              key => key.toLowerCase().includes("email")
            );
            
            if (!nameKey || !emailKey) {
              reject(new Error("CSV must contain columns for name and email"));
              return;
            }
            
            const name = row[nameKey].trim();
            const email = row[emailKey].trim().toLowerCase();
            
            if (!name || !email || !isValidEmail(email)) return;
            if (emails.has(email)) return;
            
            emails.add(email);
            students.push({ name, email });
          });
          
          resolve(students);
        },
        error: (error) => {
          reject(new Error(`Error reading CSV file: ${error.message}`));
        }
      });
    });
  } catch (error) {
    console.error("Error parsing student CSV:", error);
    throw error;
  }
};