// PersonalizedNotificationTemplateForm.jsx
// This component handles creating notification content with placeholders and markdown

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
    Stack,
    Paper,
    InputAdornment,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button as B
  } from "@mui/material";
  import { useState, useRef } from "react";
  import { 
    Title, 
    Textsms, 
    FormatBold, 
    FormatItalic, 
    FormatUnderlined,
    Link,
    Help 
  } from "@mui/icons-material";
  
  export default function PersonalizedNotificationTemplateForm({
    title,
    body,
    onTitleChange,
    onBodyChange,
    templates = [],
    onTemplateSelect,
    onTemplatesChange,
  }) {
    // ==================== STATE MANAGEMENT ====================
    
    // Template selection state
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    
    // Link dialog state
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    
    // Reference to the textarea for cursor position management
    const textareaRef = useRef(null);
  
    // ==================== PLACEHOLDER SYSTEM ====================
    
    /**
     * Available placeholders that admins can use
     * 
     * These will be replaced with actual student data when notifications are sent
     * Format: {{placeholderName}} in the text becomes actual data
     */
    const availablePlaceholders = [
      { 
        name: "name", 
        description: "Student's full name",
        example: "John Doe"
      },
      { 
        name: "email", 
        description: "Student's email address",
        example: "john@example.com"
      },
      { 
        name: "registration", 
        description: "Student's registration number",
        example: "REG12345"
      },
      { 
        name: "date", 
        description: "Today's date",
        example: "January 15, 2024"
      },
      { 
        name: "month", 
        description: "Current month",
        example: "January"
      }
    ];
  
    // ==================== TEMPLATE MANAGEMENT ====================
    
    /**
     * Handle template selection from dropdown
     * 
     * When admin selects a template:
     * 1. Load the template content into the form
     * 2. Allow them to modify it before sending
     */
    const handleTemplateChange = (event) => {
      const templateId = event.target.value;
      setSelectedTemplateId(templateId);
      
      if (templateId) {
        // Find the selected template
        const template = templates.find((t) => t.id === templateId);
        if (template && onTemplateSelect) {
          onTemplateSelect(template);
        }
      } else {
        // "None (Create New)" selected - clear the form
        onTitleChange("");
        onBodyChange("");
      }
    };
  
    // ==================== TEXT FORMATTING FUNCTIONS ====================
    
    /**
     * Insert placeholder at cursor position
     * 
     * How this works:
     * 1. Get current cursor position in textarea
     * 2. Insert {{placeholderName}} at that position
     * 3. Move cursor to after the inserted text
     */
    const insertPlaceholder = (placeholderName) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        // Fallback: append to end if we can't find textarea
        const updatedBody = body + `{{${placeholderName}}}`;
        onBodyChange(updatedBody);
        return;
      }
      
      // Get current cursor position
      const cursorStart = textarea.selectionStart;
      const cursorEnd = textarea.selectionEnd;
      
      // Create the placeholder text
      const placeholderText = `{{${placeholderName}}}`;
      
      // Insert at cursor position
      const updatedBody = 
        body.substring(0, cursorStart) + 
        placeholderText + 
        body.substring(cursorEnd);
      
      onBodyChange(updatedBody);
      
      // Move cursor to after the inserted placeholder
      setTimeout(() => {
        const newPosition = cursorStart + placeholderText.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    };
  
    /**
     * Insert formatted text (bold, italic, underline)
     * 
     * How this works:
     * 1. If text is selected, wrap it with markdown
     * 2. If no text selected, insert markdown placeholder
     */
    const insertFormattedText = (format) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
  
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = body.substring(start, end);
      
      let markdownText = '';
      switch(format) {
        case 'bold':
          markdownText = selectedText ? `**${selectedText}**` : `**bold text**`;
          break;
        case 'italic':
          markdownText = selectedText ? `*${selectedText}*` : `*italic text*`;
          break;
        case 'underline':
          markdownText = selectedText ? `__${selectedText}__` : `__underlined text__`;
          break;
        default:
          return;
      }
      
      // Replace selected text or insert at cursor
      const newBody = body.substring(0, start) + markdownText + body.substring(end);
      onBodyChange(newBody);
      
      // Focus and select the inserted text
      setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          // If we wrapped existing text, select the content inside the markdown
          const contentStart = start + (markdownText.length - selectedText.length) / 2;
          const contentEnd = contentStart + selectedText.length;
          textarea.setSelectionRange(contentStart, contentEnd);
        } else {
          // If we inserted placeholder text, select it for easy replacement
          const placeholderStart = start + markdownText.indexOf('text');
          const placeholderEnd = placeholderStart + 4; // "text".length
          textarea.setSelectionRange(placeholderStart, placeholderEnd);
        }
      }, 0);
    };
  
    /**
     * Handle link insertion - NEW FEATURE
     * 
     * This opens a dialog to get link text and URL,
     * then inserts markdown link format: [text](url)
     */
    const handleInsertLink = () => {
      setLinkDialogOpen(true);
    };
  
    /**
     * Confirm link insertion
     * 
     * Creates markdown link and inserts at cursor position
     */
    const confirmLinkInsertion = () => {
      if (!linkText.trim() || !linkUrl.trim()) return;
      
      const textarea = textareaRef.current;
      const markdownLink = `[${linkText.trim()}](${linkUrl.trim()})`;
      
      if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const updatedBody = 
          body.substring(0, cursorPosition) + 
          markdownLink + 
          body.substring(cursorPosition);
        
        onBodyChange(updatedBody);
        
        // Focus and move cursor after the link
        setTimeout(() => {
          const newPosition = cursorPosition + markdownLink.length;
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else {
        // Fallback: append to end
        onBodyChange(body + markdownLink);
      }
      
      // Reset dialog state
      setLinkText("");
      setLinkUrl("");
      setLinkDialogOpen(false);
    };
  
    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * Extract placeholders from current text
     * 
     * This finds all {{placeholder}} patterns in the text
     * Used to show admin what placeholders they're using
     */
    const extractPlaceholders = (text) => {
      if (!text) return [];
      
      const placeholderRegex = /{{([^{}]+)}}/g;
      const matches = [...text.matchAll(placeholderRegex)];
      return [...new Set(matches.map(match => match[1].trim()))]; // Remove duplicates
    };
  
    // Get placeholders currently in use
    const usedPlaceholders = extractPlaceholders(body);
  
    // ==================== RENDER COMPONENT ====================
    
    return (
      <Bx>
        {/* Template Selection Dropdown */}
        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
          <InputLabel>Use Existing Template</InputLabel>
          <Select
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            label="Use Existing Template"
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
  
        {/* Notification Title Input */}
        <Tf
          label="Notification Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          sx={{ mb: 3 }}
          placeholder="Enter notification title (e.g., Payment Reminder)"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Title fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
  
        {/* Formatting Toolbar */}
        <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <T variant="caption" color="text.secondary">Format:</T>
            
            <Tooltip title="Bold Text (**text**)">
              <IconButton 
                size="small" 
                onClick={() => insertFormattedText('bold')}
                color="primary"
              >
                <FormatBold fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Italic Text (*text*)">
              <IconButton 
                size="small" 
                onClick={() => insertFormattedText('italic')}
                color="primary"
              >
                <FormatItalic fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Underlined Text (__text__)">
              <IconButton 
                size="small" 
                onClick={() => insertFormattedText('underline')}
                color="primary"
              >
                <FormatUnderlined fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* NEW: Link Button */}
            <Tooltip title="Insert Link ([text](url))">
              <IconButton 
                size="small" 
                onClick={handleInsertLink}
                color="primary"
              >
                <Link fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem />
            
            <T variant="caption" color="text.secondary">Placeholders:</T>
            
            {/* Placeholder Buttons */}
            {availablePlaceholders.map((placeholder) => (
              <Tooltip 
                key={placeholder.name} 
                title={`${placeholder.description} (e.g., ${placeholder.example})`}
              >
                <Chip
                  label={placeholder.name}
                  onClick={() => insertPlaceholder(placeholder.name)}
                  clickable
                  size="small"
                  color={usedPlaceholders.includes(placeholder.name) ? "primary" : "default"}
                  variant="outlined"
                />
              </Tooltip>
            ))}
          </Stack>
        </Paper>
  
        {/* Notification Body Input */}
        <Tf
          inputRef={textareaRef} // This allows us to control cursor position
          label="Notification Message"
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          required
          placeholder={`Write your notification message here...
  
  You can use:
  - {{name}} for student's name
  - {{registration}} for registration number
  - **bold text** for emphasis
  - [link text](https://example.com) for links
  
  All formatting and line breaks will be preserved exactly as you type them.`}
          helperText="Use {{placeholders}} for dynamic content. Markdown formatting: **bold**, *italic*, __underline__, [links](url). Line breaks are preserved."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                <Textsms fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace', // Monospace font for better editing
              fontSize: '0.9rem',
              lineHeight: 1.5,
            },
            '& textarea': {
              whiteSpace: 'pre-wrap', // IMPORTANT: This preserves line breaks and spaces
            }
          }}
        />
  
        {/* Used Placeholders Display */}
        {usedPlaceholders.length > 0 && (
          <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Help fontSize="small" color="primary" />
              <T variant="subtitle2" color="primary">
                Placeholders in your message:
              </T>
            </Stack>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {usedPlaceholders.map((placeholder) => {
                const info = availablePlaceholders.find(p => p.name === placeholder);
                return (
                  <Chip
                    key={placeholder}
                    label={`{{${placeholder}}}`}
                    color="success"
                    size="small"
                    title={info ? `Will be replaced with: ${info.description}` : "Custom placeholder"}
                  />
                );
              })}
            </Stack>
            
            <T variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              These will be replaced with actual student data when sending notifications.
            </T>
          </Paper>
        )}
  
        {/* Link Insertion Dialog */}
        <Dialog
          open={linkDialogOpen}
          onClose={() => setLinkDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Insert Link</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Tf
                label="Link Text"
                fullWidth
                variant="outlined"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g., Click here to pay"
                helperText="This is what users will see and click on"
              />
              
              <Tf
                label="Link URL"
                fullWidth
                variant="outlined"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g., https://portal.yourschool.com/payment"
                helperText="Where the link should take users"
              />
              
              {linkText && linkUrl && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <T variant="caption" color="text.secondary">Preview:</T>
                  <T variant="body2" sx={{ mt: 0.5 }}>
                    This will create: <code>[{linkText}]({linkUrl})</code>
                  </T>
                </Paper>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setLinkDialogOpen(false)}>Cancel</B>
            <B 
              onClick={confirmLinkInsertion}
              variant="contained"
              disabled={!linkText.trim() || !linkUrl.trim()}
            >
              Insert Link
            </B>
          </DialogActions>
        </Dialog>
      </Bx>
    );
  }
  
  /*
   * KEY CONCEPTS EXPLAINED FOR ENTRY-LEVEL ENGINEERS:
   * 
   * 1. CURSOR POSITION MANAGEMENT:
   *    - textareaRef.current.selectionStart gives us where the cursor is
   *    - We can insert text at the exact cursor position
   *    - setTimeout(() => {...}, 0) lets React update the DOM first, then we focus
   * 
   * 2. STRING MANIPULATION:
   *    - body.substring(0, start) = text before cursor
   *    - body.substring(end) = text after cursor
   *    - We insert new text in between these parts
   * 
   * 3. REGULAR EXPRESSIONS (REGEX):
   *    - /{{([^{}]+)}}/g finds all {{anything}} patterns
   *    - [^{}]+ means "one or more characters that are not { or }"
   *    - The g flag means "find all matches, not just the first one"
   * 
   * 4. EVENT HANDLING:
   *    - onChange fires every time user types
   *    - onClick fires when user clicks a button
   *    - We pass these events up to parent component via props
   * 
   * 5. CONDITIONAL RENDERING:
   *    - {condition && <Component />} only shows component if condition is true
   *    - {array.map(item => <Component key={item.id} />)} renders list of components
   * 
   * 6. MARKDOWN SUPPORT:
   *    - **text** becomes bold
   *    - *text* becomes italic
   *    - __text__ becomes underlined
   *    - [text](url) becomes a clickable link
   * 
   * 7. NEWLINE PRESERVATION:
   *    - CSS white-space: pre-wrap preserves line breaks and spaces
   *    - We store the original text exactly as typed
   *    - No conversion needed - just preserve the \n characters
   */