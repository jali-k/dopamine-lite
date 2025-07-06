// PersonalizedNotificationCenter.jsx
// This is the main admin interface for creating and managing notifications

import {
    Box as Bx,
    Button as B,
    Container,
    Tab,
    Tabs,
    Typography as T,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Stack,
    CircularProgress,
    Snackbar,
    Alert,
    LinearProgress,
    Tooltip,
    IconButton,
    Chip,
  } from "@mui/material";
  import { useState, useEffect } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import { 
    Notifications as NotificationsIcon,
    History,
    Description as TemplateIcon,
    Send,
    Edit, 
    ContentCopy,
    Delete, 
  } from "@mui/icons-material";
  import { useUser } from "../../contexts/UserProvider";
  import Appbar from "../../components/Appbar";
  import Loading from "../../components/Loading";
  
  // Import our custom components (we'll create these next)
  import PersonalizedNotificationTemplateForm from "../../components/admin/PersonalizedNotificationTemplateForm";
  import StudentImport from "../../components/admin/StudentImport"; // Reuse existing
  import PersonalizedNotificationPreview from "../../components/admin/PersonalizedNotificationPreview";
  import PersonalizedNotificationHistory from "../../components/admin/PersonalizedNotificationHistory";
  
  // Firebase imports
  import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    orderBy, 
    getDocs,
    deleteDoc,  // Add this
    doc        // Add this if not already imported
  } from "firebase/firestore";
  import { fireDB } from "../../../firebaseconfig";
  
  export default function PersonalizedNotificationCenter() {
    // ==================== STATE MANAGEMENT ====================
    
    // User authentication state
    const { isAdmin, uloading } = useUser(); // Check if user is admin
    const navigate = useNavigate();
    const location = useLocation();
    
    // Tab management - which tab is currently active
    const [tabValue, setTabValue] = useState(0);
    
    // Loading states for different operations
    const [loading, setLoading] = useState(false); // General loading
    const [sending, setSending] = useState(false); // When sending notifications
    
    // Error handling
    const [error, setError] = useState(null);
    
    // ==================== NOTIFICATION FORM STATE ====================
    
    // The main form data
    const [notificationTitle, setNotificationTitle] = useState("");
    const [notificationBody, setNotificationBody] = useState("");
    const [recipients, setRecipients] = useState([]); // Students from CSV
    
    // Template management
    const [templates, setTemplates] = useState([]); // Available templates
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // ==================== DIALOG/MODAL STATES ====================
    
    // Preview dialog
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewRecipient, setPreviewRecipient] = useState(null);
    
    // Confirmation dialog before sending
    const [confirmSendOpen, setConfirmSendOpen] = useState(false);
    
    // Success/error messages
    const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
    
    // Sending progress tracking
    const [sendingProgress, setSendingProgress] = useState({ 
      show: false, 
      processed: 0, 
      total: 0 
    });

    // Template deletion confirmation
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
    // ==================== SIDE EFFECTS (useEffect) ====================
    
    /**
     * Effect 1: Set active tab based on URL
     * 
     * Why do we need this?
     * - When user navigates directly to /admin/notifications/history
     * - We want to show the History tab automatically
     * - This creates better user experience with browser back/forward buttons
     */
    useEffect(() => {
      if (location.pathname.includes("/history")) {
        setTabValue(1); // History tab
      } else if (location.pathname.includes("/templates")) {
        setTabValue(2); // Templates tab
      } else {
        setTabValue(0); // Create tab (default)
      }
    }, [location]);
  
    /**
     * Effect 2: Load notification templates
     * 
     * Why do we need this?
     * - Admins can save frequently used notifications as templates
     * - We need to load these when the component mounts
     * - Only load after we confirm user is admin (security)
     */
    useEffect(() => {
      const loadTemplates = async () => {
        // Don't load if user status is still loading
        if (uloading) return;
        
        // Don't load if user is not admin
        if (!isAdmin) return;
        
        try {
          setLoading(true);
          
          // Query Firestore for templates, newest first
          const templatesRef = collection(fireDB, "personalizedNotificationTemplates");
          const q = query(templatesRef, orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          
          // Convert Firestore documents to JavaScript objects
          const templateList = [];
          querySnapshot.forEach((doc) => {
            templateList.push({ 
              id: doc.id, 
              ...doc.data() 
            });
          });

          console.log("Loaded templates:", templateList);
          
          setTemplates(templateList);
          setLoading(false);
        } catch (err) {
          console.error("Error loading templates:", err);
          setError("Failed to load notification templates");
          setLoading(false);
        }
      };
      
      loadTemplates();
    }, [isAdmin, uloading]); // Re-run when admin status changes
  
    // ==================== EVENT HANDLERS ====================
    
    /**
     * Handle tab changes and navigation
     * 
     * What happens when user clicks a tab?
     * 1. Update the URL (for browser history)
     * 2. Update the active tab state
     */
    const handleTabChange = (event, newValue) => {
      // Clear any errors when switching tabs
      setError(null);
      
      // Update URL based on tab selection
      switch (newValue) {
        case 0:
          navigate("/admin/personalizednotifications");
          break;
        case 1:
          navigate("/admin/personalizednotifications/history");
          break;
        case 2:
          navigate("/admin/personalizednotifications/templates");
          break;
        default:
          navigate("/admin/personalizednotifications");
      }
      
      setTabValue(newValue);
    };

    /**
 * Handle using a template (switch to Create tab and load template)
 */
const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setNotificationTitle(template.title);
    setNotificationBody(template.body);
    
    // Switch to Create tab
    setTabValue(0);
    navigate("/admin/personalizednotifications");
    
    setSuccessAlert({ 
      open: true, 
      message: `Template "${template.title}" loaded for editing!` 
    });
  };
  
  /**
   * Handle duplicating a template
   */
  const handleDuplicateTemplate = (template) => {
    setNotificationTitle(`${template.title} (Copy)`);
    setNotificationBody(template.body);
    setSelectedTemplate(null);
    
    // Switch to Create tab
    setTabValue(0);
    navigate("/admin/personalizednotifications");
    
    setSuccessAlert({ 
      open: true, 
      message: `Template duplicated! You can now modify and save it.` 
    });
  };
  
  /**
   * Handle template deletion
   */
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    
    try {
      setLoading(true);
      
      // Delete from Firestore
      await deleteDoc(doc(fireDB, "personalizedNotificationTemplates", templateToDelete.id));
      
      // Remove from local state
      setTemplates(prevTemplates => 
        prevTemplates.filter(template => template.id !== templateToDelete.id)
      );
      
      // Close dialog and reset
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      setLoading(false);
      
      setSuccessAlert({ 
        open: true, 
        message: `Template "${templateToDelete.title}" deleted successfully!` 
      });
      
    } catch (err) {
      console.error("Error deleting template:", err);
      setError("Failed to delete template");
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };
  
    /**
     * Handle template selection
     * 
     * When admin selects a template:
     * 1. Load the template content into the form
     * 2. User can then modify it before sending
     */
    const handleTemplateSelect = (template) => {
      setSelectedTemplate(template);
      setNotificationTitle(template.title);
      setNotificationBody(template.body);
      
      // Show success message
      setSuccessAlert({ 
        open: true, 
        message: `Template "${template.title}" loaded successfully!` 
      });
    };
  
    /**
     * Save current notification as a template
     * 
     * This allows admins to reuse common notifications
     */
    const handleSaveTemplate = async () => {
      try {
        // Validation
        if (!notificationTitle.trim()) {
          setError("Please enter a title before saving template");
          return;
        }
        
        if (!notificationBody.trim()) {
          setError("Please enter a message body before saving template");
          return;
        }
        
        setLoading(true);
        
        // Extract placeholders from the body text
        const placeholders = extractPlaceholders(notificationBody);
        
        // Create template document
        const templateData = {
          title: notificationTitle.trim(),
          body: notificationBody, // Preserve all formatting including newlines
          placeholders: placeholders,
          createdAt: serverTimestamp(),
          createdBy: "admin", // TODO: Replace with actual admin email
        };
        
        // Save to Firestore
        const docRef = await addDoc(
          collection(fireDB, "personalizedNotificationTemplates"), 
          templateData
        );
        
        // Update local state so it appears immediately
        setTemplates(prevTemplates => [
          { id: docRef.id, ...templateData }, 
          ...prevTemplates
        ]);
        
        setLoading(false);
        setSuccessAlert({ 
          open: true, 
          message: "Template saved successfully!" 
        });
        
      } catch (err) {
        console.error("Error saving template:", err);
        setError("Failed to save template");
        setLoading(false);
      }
    };
  
    /**
     * Handle notification preview
     * 
     * Show admin how the notification will look with real data
     */
    const handlePreview = () => {
      // Use first recipient for preview, or create sample data
      const sampleRecipient = recipients.length > 0 
        ? recipients[0] 
        : { 
            name: "John Doe", 
            email: "john@example.com", 
            registration: "REG12345" 
          };
      
      setPreviewRecipient(sampleRecipient);
      setPreviewOpen(true);
    };
  
    /**
     * Handle sending notifications - THE MAIN FUNCTION
     * 
     * This is where the magic happens:
     * 1. Validate the form data
     * 2. Create a queue document in Firestore
     * 3. Cloud Function automatically processes it
     * 4. Show progress to admin
     */
    const handleSendNotifications = async () => {
      try {
        // Close confirmation dialog
        setConfirmSendOpen(false);
        
        // Start showing progress
        setSending(true);
        setSendingProgress({ 
          show: true, 
          processed: 0, 
          total: recipients.length 
        });
        
        console.log("Creating notification queue document...");
        
        // Create the queue document - this triggers the Cloud Function
        const queueData = {
          title: notificationTitle.trim(),
          body: notificationBody, // Keep original formatting with newlines
          recipients: recipients, // Array of student objects from CSV
          status: "queued",
          queuedAt: serverTimestamp(),
          createdBy: "admin", // TODO: Replace with actual admin email
          totalTargets: recipients.length,
          processedCount: 0
        };
        
        // Add to Firestore - this automatically triggers our Cloud Function
        const queueRef = await addDoc(
          collection(fireDB, "personalizedNotificationQueue"), 
          queueData
        );
        
        console.log("Queue document created:", queueRef.id);
        
        // Reset form
        setNotificationTitle("");
        setNotificationBody("");
        setRecipients([]);
        setSelectedTemplate(null);
        
        // Hide progress and show success
        setSending(false);
        setSendingProgress({ show: false, processed: 0, total: 0 });
        
        setSuccessAlert({ 
          open: true, 
          message: `Notification queued successfully! Processing ${recipients.length} recipients...` 
        });
        
      } catch (err) {
        console.error("Error sending notifications:", err);
        setError("Failed to queue notifications for sending");
        setSending(false);
        setSendingProgress({ show: false, processed: 0, total: 0 });
      }
    };
  
    /**
     * Extract placeholders from text
     * 
     * This finds all {{placeholder}} patterns in the text
     * Used for template creation and validation
     */
    const extractPlaceholders = (text) => {
      if (!text) return [];
      
      // Regular expression to find {{anything}} patterns
      const placeholderRegex = /{{([^{}]+)}}/g;
      const matches = [...text.matchAll(placeholderRegex)];
      
      // Extract just the placeholder names (without the {{}})
      return matches.map(match => match[1].trim());
    };
  
    /**
     * Validation function
     * 
     * Check if form is ready to send
     */
    const isFormValid = () => {
      return notificationTitle.trim() && 
             notificationBody.trim() && 
             recipients.length > 0;
    };
  
    // ==================== AUTHORIZATION CHECKS ====================
    
    // Show loading while checking user permissions
    if (uloading) {
      return <Loading text="Checking authorization..." />;
    }
  
    // Redirect if user is not admin
    if (!isAdmin) {
      return (
        <Container>
          <Appbar />
          <Bx sx={{ p: 3, textAlign: "center" }}>
            <T color="error" variant="h6">
              You are not authorized to access this page.
            </T>
            <B 
              variant="contained" 
              color="primary" 
              onClick={() => navigate("/")}
              sx={{ mt: 2 }}
            >
              Return to Home
            </B>
          </Bx>
        </Container>
      );
    }
  
    // ==================== MAIN RENDER ====================
    
    return (
      <Container
        disableGutters
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f4f4f4",
        }}
      >
        <Appbar />
        
        {/* Tab Navigation */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<NotificationsIcon />} 
              label="Create Notification" 
              iconPosition="start"
            />
            <Tab 
              icon={<History />} 
              label="History" 
              iconPosition="start"
            />
            <Tab 
              icon={<TemplateIcon />} 
              label="Templates" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        
        {/* Loading indicator */}
        {loading && <LinearProgress />}
        
        {/* Tab Content */}
        <Bx sx={{ flex: 1, p: 2, overflowY: "auto" }}>
          
          {/* Tab 1: Create New Notification */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <T variant="h5" sx={{ mb: 3 }}>Create Personalized Notification</T>
              
              {/* Notification Template Form */}
              <PersonalizedNotificationTemplateForm 
                title={notificationTitle}
                body={notificationBody}
                onTitleChange={setNotificationTitle}
                onBodyChange={setNotificationBody}
                templates={templates}
                onTemplateSelect={handleTemplateSelect}
                onTemplatesChange={setTemplates}
              />
              
              {/* Student Recipients Section */}
              <Bx sx={{ mt: 4 }}>
                <T variant="h6" sx={{ mb: 2 }}>Recipients</T>
                <StudentImport 
                  students={recipients}
                  onStudentsChange={setRecipients}
                  onPreviewStudent={(student) => {
                    setPreviewRecipient(student);
                    setPreviewOpen(true);
                  }}
                />
              </Bx>
              
              {/* Action Buttons */}
              <Bx sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <B 
                  variant="outlined" 
                  color="primary" 
                  onClick={handlePreview}
                  disabled={!notificationBody || recipients.length === 0}
                >
                  Preview Notification
                </B>
                
                <Bx>
                  <B 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleSaveTemplate}
                    disabled={!notificationTitle || !notificationBody}
                    sx={{ mr: 2 }}
                  >
                    Save as Template
                  </B>
                  
                  <B 
                    variant="contained" 
                    color="success" 
                    onClick={() => setConfirmSendOpen(true)}
                    disabled={!isFormValid() || sending}
                    startIcon={sending ? <CircularProgress size={20} /> : <Send />}
                  >
                    {sending ? "Sending..." : "Send Notifications"}
                  </B>
                </Bx>
              </Bx>
              
              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>
          )}
          
          {/* Tab 2: History */}
          {tabValue === 1 && (
            <PersonalizedNotificationHistory />
          )}
          
          {/* Tab 3: Templates */}
          {tabValue === 2 && (
                <Paper sx={{ p: 3 }}>
                  <T variant="h5" gutterBottom>Message Templates</T>
                  <Divider sx={{ mb: 3 }} />
                  
                  {templates.length > 0 ? (
                    <Stack spacing={2}>
                      {templates.map((template) => (
                        <Paper 
                          key={template.id} 
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <T variant="h6">{template.title}</T>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Use template">
                                  <IconButton 
                                    onClick={() => handleUseTemplate(template)}
                                    color="primary"
                                    size="small"
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Duplicate template">
                                  <IconButton 
                                    onClick={() => handleDuplicateTemplate(template)}
                                    color="default"
                                    size="small"
                                  >
                                    <ContentCopy />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete template">
                                  <IconButton 
                                    onClick={() => {
                                      setTemplateToDelete(template);
                                      setDeleteConfirmOpen(true);
                                    }}
                                    color="error"
                                    size="small"
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                            
                            <Divider />
                            
                            <T variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {template.body.length > 200 
                                ? `${template.body.substring(0, 200)}...` 
                                : template.body}
                            </T>
                            
                            {template.placeholders && template.placeholders.length > 0 && (
                              <Bx>
                                <T variant="caption" color="text.secondary">Placeholders: </T>
                                <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                                  {template.placeholders.map((placeholder, index) => (
                                    <Chip 
                                      key={index} 
                                      label={placeholder} 
                                      size="small" 
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Stack>
                              </Bx>
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Bx sx={{ textAlign: "center", py: 4 }}>
                      <T variant="body1" color="text.secondary">
                        No templates found. Create a message and save it as a template.
                      </T>
                    </Bx>
                  )}
                </Paper>
              )}
        </Bx>
        
        {/* ==================== DIALOGS/MODALS ==================== */}
        
        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Notification Preview</DialogTitle>
          <DialogContent>
            <PersonalizedNotificationPreview 
              title={notificationTitle}
              body={notificationBody}
              recipient={previewRecipient}
            />
          </DialogContent>
          <DialogActions>
            <B onClick={() => setPreviewOpen(false)}>Close</B>
          </DialogActions>
        </Dialog>
        
        {/* Confirmation Dialog */}
        <Dialog
          open={confirmSendOpen}
          onClose={() => setConfirmSendOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Sending</DialogTitle>
          <DialogContent>
            <T variant="body1">
              You are about to send this notification to {recipients.length} recipient
              {recipients.length !== 1 ? 's' : ''}. This action cannot be undone.
            </T>
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Each recipient will receive a personalized version with their specific details.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setConfirmSendOpen(false)}>Cancel</B>
            <B 
              color="primary" 
              onClick={handleSendNotifications}
              variant="contained"
            >
              Send Now
            </B>
          </DialogActions>
        </Dialog>
        
        {/* Sending Progress Dialog */}
        <Dialog
          open={sendingProgress.show}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Processing Notifications</DialogTitle>
          <DialogContent>
            <T variant="body1" sx={{ mb: 2 }}>
              Creating personalized notifications for {sendingProgress.total} recipients...
            </T>
            <LinearProgress />
            <T variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              This process runs in the background. You can close this dialog.
            </T>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setSendingProgress({ ...sendingProgress, show: false })}>
              Close
            </B>
          </DialogActions>
        </Dialog>

        {/* Template Delete Confirmation Dialog */}
        <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
            setDeleteConfirmOpen(false);
            setTemplateToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        >
        <DialogTitle sx={{ color: 'error.main' }}>
            Delete Template
        </DialogTitle>
        <DialogContent>
            <T variant="body1">
            Are you sure you want to delete the template "{templateToDelete?.title}"?
            </T>
            <T variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            This action cannot be undone. The template will be permanently removed.
            </T>
        </DialogContent>
        <DialogActions>
            <B 
            onClick={() => {
                setDeleteConfirmOpen(false);
                setTemplateToDelete(null);
            }}
            color="inherit"
            >
            Cancel
            </B>
            <B 
            onClick={handleDeleteTemplate}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
            >
            {loading ? "Deleting..." : "Delete Template"}
            </B>
        </DialogActions>
        </Dialog>
        
        {/* Success/Error Snackbar */}
        <Snackbar
          open={successAlert.open}
          autoHideDuration={5000}
          onClose={() => setSuccessAlert({ ...successAlert, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSuccessAlert({ ...successAlert, open: false })} 
            severity="success"
            variant="filled"
          >
            {successAlert.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }
  
  /*
   * KEY CONCEPTS EXPLAINED:
   * 
   * 1. STATE MANAGEMENT:
   *    - We use useState to store component data (form inputs, loading states, etc.)
   *    - Each piece of data has its own state variable for better organization
   * 
   * 2. SIDE EFFECTS (useEffect):
   *    - Load templates when component mounts
   *    - Update tab based on URL changes
   *    - Only run when dependencies change (like [isAdmin, uloading])
   * 
   * 3. EVENT HANDLERS:
   *    - Functions that respond to user actions (clicking buttons, typing, etc.)
   *    - Always start with "handle" for clarity
   * 
   * 4. ASYNC OPERATIONS:
   *    - Use async/await for database operations
   *    - Always wrap in try/catch for error handling
   *    - Show loading states during operations
   * 
   * 5. FORM VALIDATION:
   *    - Check data before allowing submission
   *    - Provide clear error messages
   *    - Disable buttons when form is invalid
   * 
   * 6. NEWLINE PRESERVATION:
   *    - Store original text with \n characters
   *    - Display with CSS white-space: pre-wrap
   *    - Cloud Function preserves formatting when replacing placeholders
   */