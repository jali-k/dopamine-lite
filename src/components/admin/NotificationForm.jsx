// src/components/admin/NotificationForm.jsx
import {
    Box as Bx,
    Button as B,
    TextField as Tf,
    Typography as T,
    Stack,
    Paper,
    InputAdornment,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Tooltip,
    IconButton,
    Divider,
    CircularProgress,
  } from "@mui/material";
  import { useState } from "react";
  import { 
    Title, 
    Textsms, 
    Send, 
    Preview,
    Help,
    FormatBold,
    FormatItalic,
    Link as LinkIcon,
    Group
  } from "@mui/icons-material";
  import { useUser } from "../../contexts/UserProvider";
  import StudentImport from "./StudentImport";
  import NotificationPreview from "./NotificationPreview";
  import { sendNotificationsWithRecipients } from "../../services/backendNotificationService";
  
  // Helper function to process markdown links
  const processMarkdownLinks = (text) => {
    if (!text) return "";
    // Convert [text](url) to <a href="url">text</a>
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  };
  
  export default function NotificationForm({ onNotificationSent }) {
    const { user } = useUser();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  
    // Validation
    const isFormValid = title.trim() && content.trim() && students.length > 0;
  
    const handlePreview = () => {
      if (!isFormValid) {
        setError("Please fill in all fields and add at least one recipient.");
        return;
      }
      setError("");
      setPreviewOpen(true);
    };
  
    const handleSendNotification = async () => {
      if (!isFormValid) {
        setError("Please fill in all fields and add at least one recipient.");
        return;
      }
  
      setLoading(true);
      setConfirmSendOpen(false);
      setError("");
  
      try {
        // Process content to convert markdown links to HTML
        const contentHtml = processMarkdownLinks(content);
        
        // Prepare notification data for backend service
        const notificationData = {
          title: title.trim(),
          content: content.trim(),
          contentHtml,
          createdBy: user.email,
          personalized: false, // This is regular notification, not personalized
          targetUsers: students.map(student => ({
            name: student.name,
            email: student.email,
            registration: student.registration || ""
          }))
        };

        const result = await sendNotificationsWithRecipients(notificationData);

        if (result.success) {
          // Reset form
          setTitle("");
          setContent("");
          setStudents([]);
          
          // Show success message
          if (onNotificationSent) {
            onNotificationSent("Notification sent successfully!");
          }
        } else {
          setError(result.error || "Failed to send notification");
        }
      } catch (err) {
        console.error("Error sending notification:", err);
        setError("An unexpected error occurred while sending the notification");
      } finally {
        setLoading(false);
      }
    };
  
    const insertMarkdownLink = () => {
      const textarea = document.querySelector('textarea[name="notificationContent"]');
      if (!textarea) {
        const updatedContent = content + "[Link Text](https://example.com)";
        setContent(updatedContent);
        return;
      }
      
      const cursorPosition = textarea.selectionStart;
      const linkText = "[Link Text](https://example.com)";
      const updatedContent = 
        content.substring(0, cursorPosition) + 
        linkText + 
        content.substring(cursorPosition);
      
      setContent(updatedContent);
      
      setTimeout(() => {
        textarea.focus();
        const newPosition = cursorPosition + linkText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    };
  
    const insertFormattedText = (format) => {
      const textarea = document.querySelector('textarea[name="notificationContent"]');
      if (!textarea) return;
  
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end) || "text";
      
      let formattedText = '';
      switch(format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        default:
          return;
      }
      
      const newContent = content.substring(0, start) + formattedText + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + formattedText.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    };
  
    return (
      <Bx>
        {/* Notification Title */}
        <Tf
          label="Notification Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Title fontSize="small" />
              </InputAdornment>
            ),
          }}
          helperText="A clear, descriptive title for your notification"
        />
  
        {/* Formatting Toolbar */}
        <Bx sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Tooltip title="Bold">
              <IconButton size="small" onClick={() => insertFormattedText('bold')}>
                <FormatBold fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton size="small" onClick={() => insertFormattedText('italic')}>
                <FormatItalic fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Insert Link">
              <IconButton size="small" onClick={insertMarkdownLink}>
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Bx>
  
        {/* Notification Content */}
        <Tf
          name="notificationContent"
          label="Notification Content"
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          helperText="Write your notification content. Use [text](url) for links, **bold**, *italic*"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                <Textsms fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            },
            '& textarea': {
              whiteSpace: 'pre-wrap',
            }
          }}
        />
  
        {/* Link Format Help */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Help fontSize="small" color="primary" />
            <T variant="subtitle2" color="primary">
              Formatting Guide
            </T>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={0.5}>
            <T variant="body2" color="text.secondary">
              • Links: [Click here](https://example.com)
            </T>
            <T variant="body2" color="text.secondary">
              • Bold: **important text**
            </T>
            <T variant="body2" color="text.secondary">
              • Italic: *emphasized text*
            </T>
          </Stack>
        </Paper>
  
        {/* Student Recipients */}
        <Bx sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Group color="primary" />
            <T variant="h6">Recipients...</T>
            {students.length > 0 && (
              <Chip 
                label={`${students.length} students`}
                color="primary"
                size="small"
              />
            )}
          </Stack>
          <StudentImport 
            students={students}
            onStudentsChange={setStudents}
          />
        </Bx>
  
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
  
        {/* Action Buttons */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <B 
            variant="outlined" 
            color="primary" 
            onClick={handlePreview}
            disabled={!isFormValid || loading}
            startIcon={<Preview />}
          >
            Preview Notification
          </B>
          
          <B 
            variant="contained" 
            color="primary" 
            onClick={() => setConfirmSendOpen(true)}
            disabled={!isFormValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </B>
        </Stack>
  
        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Notification Preview</DialogTitle>
          <DialogContent>
            <NotificationPreview 
              title={title}
              content={content}
              student={students.length > 0 ? students[0] : { name: "Sample Student", email: "student@example.com" }}
            />
          </DialogContent>
          <DialogActions>
            <B onClick={() => setPreviewOpen(false)}>Close</B>
          </DialogActions>
        </Dialog>
        
        {/* Confirm Send Dialog */}
        <Dialog
          open={confirmSendOpen}
          onClose={() => !loading && setConfirmSendOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Sending</DialogTitle>
          <DialogContent>
            <T variant="body1">
              You are about to send this notification to {students.length} recipient{students.length !== 1 ? 's' : ''}. 
              Do you want to proceed?
            </T>
            <Bx sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <T variant="body2" color="text.secondary">
                <strong>Title:</strong> {title}
              </T>
              <T variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Recipients:</strong> {students.length} students
              </T>
            </Bx>
          </DialogContent>
          <DialogActions>
            <B 
              onClick={() => setConfirmSendOpen(false)}
              disabled={loading}
            >
              Cancel
            </B>
            <B 
              color="primary" 
              variant="contained"
              onClick={handleSendNotification}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
            >
              {loading ? 'Sending...' : 'Confirm Send'}
            </B>
          </DialogActions>
        </Dialog>
      </Bx>
    );
  }