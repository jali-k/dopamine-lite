// src/components/admin/NotificationPreview.jsx
import {
  Box as Bx,
  Paper,
  Typography as T,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Notifications } from "@mui/icons-material";
import { processMarkdownLinks } from "../../services/notificationService";

export default function NotificationPreview({ title, content, student }) {
  const [processedContent, setProcessedContent] = useState("");

  useEffect(() => {
    // Process markdown links and line breaks to HTML
    const htmlContent = processMarkdownLinks(content || "");
    setProcessedContent(htmlContent);
  }, [content]);

  return (
    <Bx>
      <T variant="body2" color="text.secondary" gutterBottom>
        This is how the notification will appear to students:
      </T>
      
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Notifications />
            </Avatar>
          }
          title={title || "Notification Title"}
          subheader={`To: ${student?.name || 'Student Name'} (${student?.email || 'student@email.com'})`}
          action={
            <Chip 
              label="New" 
              color="error" 
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          }
          sx={{
            bgcolor: "rgba(33, 150, 243, 0.05)",
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        />
        <CardContent>
          <Bx 
            sx={{ 
              my: 2,
              // Styling for links
              '& a': {
                color: 'primary.main',
                textDecoration: 'underline',
                transition: 'all 0.2s ease',
                '&:hover': {
                  textDecoration: 'none',
                  color: 'primary.dark'
                }
              },
              // Styling for bold text
              '& strong': {
                fontWeight: 600,
                color: 'text.primary'
              },
              // Styling for italic text
              '& em': {
                fontStyle: 'italic',
                color: 'text.secondary'
              },
              // Styling for paragraphs - proper spacing
              '& p': {
                margin: '0 0 1em 0',
                lineHeight: 1.7,
                '&:last-child': {
                  marginBottom: 0
                },
                '&:first-of-type': {
                  marginTop: 0
                }
              },
              // Styling for line breaks
              '& br': {
                lineHeight: 1.7
              },
              // General text styling
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'text.primary',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              // Handle empty content gracefully
              minHeight: '1.5em'
            }}
            dangerouslySetInnerHTML={{ 
              __html: processedContent || "<em style='color: #999;'>Notification content will appear here</em>" 
            }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <T variant="caption" color="text.secondary">
            Received: {new Date().toLocaleString()}
          </T>
        </CardContent>
      </Card>
    </Bx>
  );
}