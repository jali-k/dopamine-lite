import {
  Box as Bx,
  Paper,
  Typography as T,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Alert,
} from "@mui/material";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

export default function MessagePreview({ title, body, student }) {
  const [processedBody, setProcessedBody] = useState("");
  const [placeholderErrors, setPlaceholderErrors] = useState([]);

  useEffect(() => {
    let processedText = body || "";
    const errors = [];
    
    // Replace placeholders with actual values
    const placeholderRegex = /{{([^{}]+)}}/g;
    let match;
    
    while ((match = placeholderRegex.exec(body)) !== null) {
      const placeholder = match[1];
      let replacement = "";
      
      // Handle common placeholders
      switch (placeholder.toLowerCase()) {
        case "name":
          replacement = student?.name || "[STUDENT NAME]";
          break;
        case "email":
          replacement = student?.email || "[STUDENT EMAIL]";
          break;
        case "registration":
          replacement = student?.registration || "[REGISTRATION NUMBER]";
          break;
        case "month":
          replacement = new Date().toLocaleString('default', { month: 'long' });
          break;
        case "date":
          replacement = new Date().toLocaleDateString();
          break;
        default:
          errors.push(`Unknown placeholder: {{${placeholder}}}`);
          replacement = `[${placeholder.toUpperCase()}]`;
      }
      
      processedText = processedText.replace(`{{${placeholder}}}`, replacement);
    }
    
    setProcessedBody(processedText);
    setPlaceholderErrors(errors);
  }, [body, student]);

  return (
    <Bx>
      {placeholderErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <T variant="body2">
            Some placeholders could not be replaced. Please check your message content.
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
      
      <Card variant="outlined">
        <CardHeader
          title={title || "Payment Confirmation"}
          sx={{
            bgcolor: "primary.light",
            color: "primary.contrastText",
            pb: 1,
          }}
        />
        <CardContent>
          <Bx sx={{ px: 1 }}>
            <T variant="body2" color="text.secondary" gutterBottom>
              To: {student?.email || "student@example.com"}
              {student?.registration && (
                <span style={{ display: 'block' }}>
                  Registration: {student.registration}
                </span>
              )}
            </T>
            <Divider sx={{ my: 1 }} />
            <Bx 
              sx={{ 
                my: 2,
                whiteSpace: 'pre-wrap',
                '& p': {
                  margin: '0 0 1em 0',
                  whiteSpace: 'pre-wrap'
                },
                '& .markdown-body': {
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  wordBreak: 'break-word'
                }
              }}
              className="markdown-body"
            >
              <div className="preserve-whitespace" style={{ whiteSpace: 'pre-wrap' }}>
                <ReactMarkdown components={{
                  // Override the default paragraph renderer to preserve whitespace
                  p: ({ node, ...props }) => (
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1em' }} {...props} />
                  )
                }}>
                  {processedBody || "Message body will appear here"}
                </ReactMarkdown>
              </div>
            </Bx>
          </Bx>
        </CardContent>
      </Card>
    </Bx>
  );
}