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
      // Process markdown links to HTML
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
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'none'
                  }
                },
                '& strong': {
                  fontWeight: 'bold'
                },
                '& em': {
                  fontStyle: 'italic'
                }
              }}
              dangerouslySetInnerHTML={{ 
                __html: processedContent || "Notification content will appear here" 
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
  
  