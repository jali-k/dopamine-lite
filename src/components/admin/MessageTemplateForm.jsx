import {
  Box as Bx,
  TextField as Tf,
  Typography as T,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Divider,
  Chip,
  Button as B,
  Stack,
  Paper,
  InputAdornment,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useState } from "react";
import { Help, Title, Textsms, FormatBold, FormatItalic, FormatUnderlined, Delete, Edit } from "@mui/icons-material";
import { collection, doc, deleteDoc } from "firebase/firestore";
import { fireDB } from "../../../firebaseconfig";

export default function MessageTemplateForm({
  title,
  body,
  onTitleChange,
  onBodyChange,
  templates = [],
  onTemplateSelect,
  onTemplatesChange,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const handleTemplateChange = (event) => {
    const templateId = event.target.value;
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template && onTemplateSelect) {
        onTemplateSelect(template);
      }
    } else {
      // Clear form when "None (Create New)" is selected
      onTitleChange("");
      onBodyChange("");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(fireDB, "messageTemplates", templateToDelete.id));
      
      // Update local state
      if (onTemplatesChange) {
        onTemplatesChange(templates.filter(t => t.id !== templateToDelete.id));
      }
      
      // Clear selection if deleted template was selected
      if (selectedTemplateId === templateToDelete.id) {
        setSelectedTemplateId("");
        onTitleChange("");
        onBodyChange("");
      }
      
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      // Add error handling as needed
    }
  };

  const insertPlaceholder = (placeholder) => {
    // Get the textarea element
    const textarea = document.querySelector('textarea[name="messageBody"]');
    if (!textarea) {
      // If the textarea cannot be found, fall back to appending at the end
      const updatedBody = body + `{{${placeholder}}}`;
      onBodyChange(updatedBody);
      return;
    }
    
    // Get the current cursor position
    const cursorPosition = textarea.selectionStart;
    
    // Insert the placeholder at the cursor position
    const updatedBody = 
      body.substring(0, cursorPosition) + 
      `{{${placeholder}}}` + 
      body.substring(cursorPosition);
    
    onBodyChange(updatedBody);
    
    // Optional: Set focus back to the textarea and move cursor after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const newPosition = cursorPosition + placeholder.length + 4; // 4 is for the {{ and }}
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertFormattedText = (format) => {
    // Get the textarea element
    const textarea = document.querySelector('textarea[name="messageBody"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    
    let formattedText = '';
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      default:
        return;
    }
    
    const newBody = body.substring(0, start) + formattedText + body.substring(end);
    onBodyChange(newBody);
    
    // Set focus back to the textarea
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Updated placeholders with better names
  const commonPlaceholders = [
    { name: "name", description: "Student's full name" },
    { name: "email", description: "Student's email address" },
    { name: "registration", description: "Student's registration number" },
    { name: "month", description: "Current month" },
    { name: "date", description: "Today's date" },
  ];

  return (
    <Bx>
      {/* Template Selection with Delete Button */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel>Use Template</InputLabel>
          <Select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            label="Use Template"
          >
            <MenuItem value="">
              <em>None (Create New)</em>
            </MenuItem>
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Visible Delete Template Button */}
        {selectedTemplateId && (
          <Tooltip title="Delete this template">
            <IconButton 
              color="error"
              onClick={() => {
                const template = templates.find(t => t.id === selectedTemplateId);
                setTemplateToDelete(template);
                setDeleteConfirmOpen(true);
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Message Title */}
      <Tf
        label="Message Title"
        fullWidth
        variant="outlined"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        required
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Title fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Message Body */}
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
          <Tooltip title="Underline">
            <IconButton size="small" onClick={() => insertFormattedText('underline')}>
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Bx>
      <Tf
        name="messageBody"
        label="Message Body"
        fullWidth
        multiline
        rows={8}
        variant="outlined"
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        required
        helperText="Use {{placeholder}} for dynamic content. You can use Markdown: **bold**, *italic*, __underline__. All whitespace and empty lines will be preserved."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
              <Textsms fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{
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

      {/* Placeholders */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <T variant="subtitle1">Available Placeholders</T>
          <Tooltip title="Use these placeholders in your message to personalize content for each student. Click to insert at cursor position.">
            <IconButton size="small">
              <Help fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        
        <Divider sx={{ mb: 2 }} />
        
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {commonPlaceholders.map((placeholder) => (
            <Tooltip key={placeholder.name} title={placeholder.description}>
              <Chip
                label={placeholder.name}
                onClick={() => insertPlaceholder(placeholder.name)}
                clickable
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            </Tooltip>
          ))}
        </Stack>
      </Paper>
      
      {/* Delete Template Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <T variant="body1">
            Are you sure you want to delete the template "{templateToDelete?.title}"? This action cannot be undone.
          </T>
        </DialogContent>
        <DialogActions>
          <B onClick={() => setDeleteConfirmOpen(false)}>Cancel</B>
          <B color="error" onClick={handleDeleteTemplate}>Delete</B>
        </DialogActions>
      </Dialog>
    </Bx>
  );
}