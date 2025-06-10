// PersonalizedNotificationPreview.jsx
// This component shows how the notification will look to students

import {
    Box as Bx,
    Paper,
    Typography as T,
    Divider,
    Card,
    CardContent,
    CardHeader,
    Alert,
    Stack,
    Chip
  } from "@mui/material";
  import { useState, useEffect } from "react";
  import ReactMarkdown from 'react-markdown';
  import { Person, Email, Badge } from "@mui/icons-material";
  
  export default function PersonalizedNotificationPreview({ 
    title, 
    body, 
    recipient 
  }) {
    // ==================== STATE MANAGEMENT ====================
    
    // Processed content after replacing placeholders
    const [processedTitle, setProcessedTitle] = useState("");
    const [processedBody, setProcessedBody] = useState("");
    
    // Track any placeholder errors
    const [placeholderErrors, setPlaceholderErrors] = useState([]);
    
    // Track which placeholders were found and used
    const [usedPlaceholders, setUsedPlaceholders] = useState([]);
  
    // ==================== PLACEHOLDER PROCESSING ====================
    
    /**
     * Process the notification content whenever inputs change
     * 
     * This is the core function that:
     * 1. Finds all {{placeholder}} patterns
     * 2. Replaces them with actual recipient data
     * 3. Tracks any issues for admin feedback
     */
    useEffect(() => {
      // Default to empty strings if no content provided
      let processedTitleText = title || "";
      let processedBodyText = body || "";
      
      const errors = [];
      const foundPlaceholders = [];
      
      // Find all placeholders in both title and body
      const allText = (title || "") + " " + (body || "");
      const placeholderRegex = /{{([^{}]+)}}/g;
      const matches = [...allText.matchAll(placeholderRegex)];
      
      // Process each unique placeholder found
      const uniquePlaceholders = [...new Set(matches.map(match => match[1].trim()))];
      
      uniquePlaceholders.forEach(placeholder => {
        const placeholderPattern = new RegExp(`{{${placeholder}}}`, 'gi');
        let replacement = "";
        let placeholderInfo = {
          name: placeholder,
          found: false,
          value: ""
        };
        
        // Handle known placeholders
        switch (placeholder.toLowerCase()) {
          case "name":
            replacement = recipient?.name || "[Student Name]";
            placeholderInfo.found = !!recipient?.name;
            placeholderInfo.value = replacement;
            break;
            
          case "email":
            replacement = recipient?.email || "[Student Email]";
            placeholderInfo.found = !!recipient?.email;
            placeholderInfo.value = replacement;
            break;
            
          case "registration":
            replacement = recipient?.registration || "[Registration Number]";
            placeholderInfo.found = !!recipient?.registration;
            placeholderInfo.value = replacement;
            break;
            
          case "date":
            replacement = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            placeholderInfo.found = true;
            placeholderInfo.value = replacement;
            break;
            
          case "month":
            replacement = new Date().toLocaleString('default', { month: 'long' });
            placeholderInfo.found = true;
            placeholderInfo.value = replacement;
            break;
            
          default:
            // Unknown placeholder
            replacement = `[${placeholder.toUpperCase()}]`;
            errors.push(`Unknown placeholder: {{${placeholder}}}`);
            placeholderInfo.found = false;
            placeholderInfo.value = replacement;
        }
        
        foundPlaceholders.push(placeholderInfo);
        
        // Replace in both title and body
        processedTitleText = processedTitleText.replace(placeholderPattern, replacement);
        processedBodyText = processedBodyText.replace(placeholderPattern, replacement);
      });
      
      // Update state
      setProcessedTitle(processedTitleText);
      setProcessedBody(processedBodyText);
      setPlaceholderErrors(errors);
      setUsedPlaceholders(foundPlaceholders);
      
    }, [title, body, recipient]); // Re-run when any of these change
  
    // ==================== RECIPIENT INFO DISPLAY ====================
    
    /**
     * Get recipient display information
     * 
     * Shows admin what data is available for this recipient
     */
    const getRecipientInfo = () => {
      if (!recipient) {
        return {
          name: "No recipient selected",
          email: "No email available",
          registration: "No registration available"
        };
      }
      
      return {
        name: recipient.name || "Name not provided",
        email: recipient.email || "Email not provided", 
        registration: recipient.registration || "Registration not provided"
      };
    };
  
    const recipientInfo = getRecipientInfo();
  
    // ==================== RENDER COMPONENT ====================
    
    return (
      <Bx>
        {/* Error/Warning Messages */}
        {placeholderErrors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <T variant="body2" sx={{ fontWeight: 'bold' }}>
              Placeholder Issues Found:
            </T>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
              {placeholderErrors.map((error, index) => (
                <li key={index}>
                  <T variant="body2">{error}</T>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        
        {/* Recipient Information */}
        <Paper variant="outlined" sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
          <T variant="subtitle2" gutterBottom>
            Preview Data Source:
          </T>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Stack direction="row" spacing={1} alignItems="center">
              <Person fontSize="small" color="primary" />
              <T variant="body2">
                <strong>Name:</strong> {recipientInfo.name}
              </T>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Email fontSize="small" color="primary" />
              <T variant="body2">
                <strong>Email:</strong> {recipientInfo.email}
              </T>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge fontSize="small" color="primary" />
              <T variant="body2">
                <strong>Registration:</strong> {recipientInfo.registration}
              </T>
            </Stack>
          </Stack>
        </Paper>
        
        {/* Placeholder Usage Summary */}
        {usedPlaceholders.length > 0 && (
          <Paper variant="outlined" sx={{ mb: 2, p: 2, bgcolor: 'info.50' }}>
            <T variant="subtitle2" gutterBottom>
              Placeholders Used:
            </T>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {usedPlaceholders.map((placeholder, index) => (
                <Chip
                  key={index}
                  label={`{{${placeholder.name}}} → ${placeholder.value}`}
                  size="small"
                  color={placeholder.found ? "success" : "warning"}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Paper>
        )}
        
        {/* Main Preview Card */}
        <Card variant="outlined" sx={{ boxShadow: 2 }}>
          {/* Header - simulates notification appearance */}
          <CardHeader
            title={processedTitle || "Notification Title"}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              pb: 1,
            }}
          />
          
          {/* Notification Content */}
          <CardContent>
            {/* Recipient Info in notification */}
            <Bx sx={{ mb: 2 }}>
              <T variant="body2" color="text.secondary">
                To: {recipientInfo.email}
              </T>
              {recipient?.registration && (
                <T variant="body2" color="text.secondary">
                  Registration: {recipient.registration}
                </T>
              )}
            </Bx>
            
            <Divider sx={{ my: 2 }} />
            
            {/* THE MAIN CONTENT WITH PROPER FORMATTING */}
            <Bx 
              sx={{ 
                my: 2,
                // CRITICAL: These CSS properties preserve newlines and formatting
                whiteSpace: 'pre-wrap',        // Preserves line breaks and spaces
                wordWrap: 'break-word',        // Prevents long URLs from breaking layout
                '& p': {
                  margin: '0 0 1em 0',          // Consistent paragraph spacing
                  whiteSpace: 'pre-wrap'        // Preserve formatting in paragraphs
                },
                '& a': {
                  color: 'primary.main',        // Style links
                  textDecoration: 'underline'   // Make links clearly clickable
                },
                fontFamily: 'inherit',          // Use system font
                lineHeight: 1.6                // Comfortable reading line height
              }}
            >
              {/* 
                ReactMarkdown Component:
                - Converts markdown to HTML (links, bold, italic, etc.)
                - Preserves line breaks and formatting
                - Handles [text](url) link syntax
              */}
              <ReactMarkdown 
                components={{
                  // Custom paragraph renderer to preserve whitespace
                  p: ({ node, children, ...props }) => (
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1em' }} {...props}>
                      {children}
                    </p>
                  ),
                  
                  // Custom link renderer for better styling
                  a: ({ node, children, href, ...props }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#1976d2', 
                        textDecoration: 'underline',
                        fontWeight: 'medium'
                      }}
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  
                  // Handle line breaks properly
                  br: () => <br />
                }}
              >
                {processedBody || "Notification message will appear here..."}
              </ReactMarkdown>
            </Bx>
            
            {/* Footer - simulates timestamp */}
            <Divider sx={{ mt: 3, mb: 2 }} />
            <T variant="caption" color="text.secondary">
              Preview generated on {new Date().toLocaleString()}
            </T>
          </CardContent>
        </Card>
        
        {/* Instructions for Admin */}
        <Paper sx={{ mt: 2, p: 2, bgcolor: 'success.50' }}>
          <T variant="body2" color="success.dark">
            <strong>Preview Notes:</strong>
          </T>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
            <li>
              <T variant="body2" color="success.dark">
                Line breaks and spacing will appear exactly as shown
              </T>
            </li>
            <li>
              <T variant="body2" color="success.dark">
                Links will be clickable in the actual notification
              </T>
            </li>
            <li>
              <T variant="body2" color="success.dark">
                Each recipient will see their own personalized data
              </T>
            </li>
            <li>
              <T variant="body2" color="success.dark">
                Markdown formatting (**bold**, *italic*) will be applied
              </T>
            </li>
          </ul>
        </Paper>
      </Bx>
    );
  }
  
  /*
   * KEY CONCEPTS FOR NEWLINE PRESERVATION:
   * 
   * 1. CSS white-space: pre-wrap
   *    - This tells the browser to preserve all whitespace and line breaks
   *    - Without this, HTML would collapse multiple spaces and ignore \n
   * 
   * 2. ReactMarkdown Processing
   *    - Converts [text](url) to <a href="url">text</a>
   *    - Converts **text** to <strong>text</strong>
   *    - Preserves line breaks when configured properly
   * 
   * 3. Custom Component Renderers
   *    - We override how ReactMarkdown renders paragraphs and links
   *    - This ensures our formatting is preserved throughout the process
   * 
   * 4. String Processing
   *    - Original text: "Hi {{name}},\n\nYour payment is due."
   *    - After placeholder replacement: "Hi John Doe,\n\nYour payment is due."
   *    - After ReactMarkdown: HTML with preserved \n as line breaks
   *    - Final display: Exactly as admin typed it
   * 
   * 5. Data Flow for Newlines
   *    Admin types → Stored in state → Sent to database → Cloud Function processes → 
   *    Stored in notification document → Retrieved by student → Displayed with CSS
   * 
   * 6. Link Processing
   *    [Click here](https://example.com) → 
   *    <a href="https://example.com" target="_blank">Click here</a>
   * 
   * This ensures WYSIWYG (What You See Is What You Get) behavior!
   */