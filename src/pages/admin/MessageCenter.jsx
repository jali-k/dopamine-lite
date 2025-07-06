import {
    Box as Bx,
    Button as B,
    Container,
    Tab,
    Tabs,
    Typography as T,
    Paper,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Snackbar,
    Alert,
    IconButton,
    Stack,
    Divider,
    Tooltip,
    Chip
  } from "@mui/material";
  import { useState, useEffect } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import { 
    Add, 
    History, 
    Save, 
    Send, 
    Delete, 
    Edit, 
    ContentCopy
  } from "@mui/icons-material";
  import EmailIcon from "@mui/icons-material/Email";
  import TemplateIcon from "@mui/icons-material/Description";
  import { useUser } from "../../contexts/UserProvider";
  import Appbar from "../../components/Appbar";
  import Loading from "../../components/Loading";
  import MessageTemplateForm from "../../components/admin/MessageTemplateForm";
  import StudentImport from "../../components/admin/StudentImport";
  import MessagePreview from "../../components/admin/MessagePreview";
  import MessageHistory from "../../components/admin/MessageHistory";
  import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";
  import { fireDB } from "../../../firebaseconfig";
  
  export default function MessageCenter() {
    const { isAdmin, uloading } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Message form state
    const [messageTitle, setMessageTitle] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [students, setStudents] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // Dialog states
    const [previewOpen, setPreviewOpen] = useState(false);
    const [confirmSendOpen, setConfirmSendOpen] = useState(false);
    const [sendingStatus, setSendingStatus] = useState({ sending: false, progress: 0, total: 0 });
    const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
    const [previewStudent, setPreviewStudent] = useState(null);
    
    // Template deletion states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
  
    // Determine active tab based on URL
    useEffect(() => {
      if (location.pathname.includes("/templates")) {
        setTabValue(2);
      } else if (location.pathname.includes("/history")) {
        setTabValue(1);
      } else {
        setTabValue(0);
      }
    }, [location]);
  
    // Load templates only after we know the user is an admin
    useEffect(() => {
      const loadTemplates = async () => {
        // Only proceed if user is confirmed as admin
        if (!isAdmin) return;
        
        try {
          setLoading(true);
          const templatesRef = collection(fireDB, "messageTemplates");
          const q = query(templatesRef, orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          
          const templateList = [];
          querySnapshot.forEach((doc) => {
            templateList.push({ id: doc.id, ...doc.data() });
          });
          
          setTemplates(templateList);
          setLoading(false);
        } catch (err) {
          console.error("Error loading templates:", err);
          setError("Failed to load message templates");
          setLoading(false);
        }
      };
      
      // Don't load templates while user status is loading
      if (!uloading) {
        loadTemplates();
      }
    }, [isAdmin, uloading]);
  
    const handleTabChange = (event, newValue) => {
      switch (newValue) {
        case 0:
          navigate("/admin/messages");
          break;
        case 1:
          navigate("/admin/messages/history");
          break;
        case 2:
          navigate("/admin/messages/templates");
          break;
        default:
          navigate("/admin/messages");
      }
      setTabValue(newValue);
    };
  
    const handleTemplateSelect = (template) => {
      setSelectedTemplate(template);
      setMessageTitle(template.title);
      setMessageBody(template.body);
    };
  
    const handleSaveTemplate = async () => {
      try {
        setLoading(true);
        const templateData = {
          title: messageTitle,
          body: messageBody,
          createdAt: serverTimestamp(),
          createdBy: "admin", // Replace with actual admin email
          placeholders: extractPlaceholders(messageBody),
        };
        
        const docRef = await addDoc(collection(fireDB, "messageTemplates"), templateData);
        setTemplates([...templates, { id: docRef.id, ...templateData }]);
        setLoading(false);
        setSuccessAlert({ open: true, message: "Template saved successfully!" });
      } catch (err) {
        console.error("Error saving template:", err);
        setError("Failed to save template");
        setLoading(false);
      }
    };
    
    const handleDeleteTemplate = async () => {
      if (!templateToDelete) return;
      
      try {
        setLoading(true);
        // Delete from Firestore
        await deleteDoc(doc(fireDB, "messageTemplates", templateToDelete.id));
        
        // Update local state
        setTemplates(templates.filter(t => t.id !== templateToDelete.id));
        
        // Clear selection if deleted template was selected
        if (selectedTemplate && selectedTemplate.id === templateToDelete.id) {
          setSelectedTemplate(null);
          setMessageTitle("");
          setMessageBody("");
        }
        
        setDeleteConfirmOpen(false);
        setTemplateToDelete(null);
        setLoading(false);
        
        setSuccessAlert({ open: true, message: "Template deleted successfully!" });
      } catch (error) {
        console.error("Error deleting template:", error);
        setError("Failed to delete template");
        setLoading(false);
      }
    };
  
    const handlePreview = () => {
      setPreviewStudent(students.length > 0 ? students[0] : null);
      setPreviewOpen(true);
    };
  
    const handleSendMessages = async () => {
      try {
        setConfirmSendOpen(false);
        setSendingStatus({ sending: true, progress: 0, total: students.length });
        
        // Get the current user's email
        const senderEmail = "admin@sddopamine.com";
    
        // Create a message in the messageQueue collection to trigger the Cloud Function
        const messageQueueRef = collection(fireDB, "messageQueue");
        await addDoc(messageQueueRef, {
          title: messageTitle,
          body: messageBody, // Store the original body with all newlines preserved
          htmlBody: messageBody.replace(/\n/g, '<br>'), // Add an HTML version with <br> tags for email clients
          recipients: students,
          sentBy: senderEmail,
          fromEmail: "payments@em6045.sddopamine.com", // Your SendGrid verified sender
          status: "queued",
          queuedAt: serverTimestamp(),
          progress: 0,
          successCount: 0,
          failureCount: 0,
          preserveWhitespace: true, // Flag to indicate whitespace should be preserved
        });
        
        // Show success message to user
        setSendingStatus({ sending: false, progress: 0, total: 0 });
        
        // Reset form and show success message
        setMessageTitle("");
        setMessageBody("");
        setStudents([]);
        setSuccessAlert({ open: true, message: "Message queued successfully!" });
        
        // Don't navigate - just stay on the current page with cleared form
        
      } catch (err) {
        console.error("Error queuing messages:", err);
        setError("Failed to queue messages for sending");
        setSendingStatus({ sending: false, progress: 0, total: 0 });
      }
    };
  
    // Helper function to extract placeholders from message body
    const extractPlaceholders = (text) => {
      const placeholderRegex = /{{([^{}]+)}}/g;
      const matches = [...text.matchAll(placeholderRegex)];
      return matches.map(match => match[1]);
    };
    
    // Function to handle previewing a specific student's message
    const handlePreviewStudent = (student) => {
      setPreviewStudent(student);
      setPreviewOpen(true);
    };
    
    // Function to use a template from the templates tab
    const handleUseTemplate = (template) => {
      handleTemplateSelect(template);
      navigate("/admin/messages"); // Navigate to the New Message tab
    };
    
    // Function to duplicate a template
    const handleDuplicateTemplate = async (template) => {
      try {
        setLoading(true);
        const templateData = {
          title: `${template.title} (Copy)`,
          body: template.body,
          createdAt: serverTimestamp(),
          createdBy: "admin", // Replace with actual admin email
          placeholders: template.placeholders || extractPlaceholders(template.body),
        };
        
        const docRef = await addDoc(collection(fireDB, "messageTemplates"), templateData);
        setTemplates([...templates, { id: docRef.id, ...templateData }]);
        setLoading(false);
        setSuccessAlert({ open: true, message: "Template duplicated successfully!" });
      } catch (err) {
        console.error("Error duplicating template:", err);
        setError("Failed to duplicate template");
        setLoading(false);
      }
    };
  
    // Show loading state while user authentication is being checked
    if (uloading) {
      return <Loading text="Checking authorization..." />;
    }
  
    // Check if user is admin
    if (!isAdmin) {
      return (
        <Container>
          <Appbar />
          <Bx sx={{ p: 3, textAlign: "center" }}>
            <T color="error" variant="h6">You are not authorized to access this page.</T>
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
  
    // Main content only renders after isAdmin is determined to be true
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
        
        {/* Tabs Navigation */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<EmailIcon />} 
              label="New Message" 
              iconPosition="start"
            />
            <Tab 
              icon={<History />} 
              label="Message History" 
              iconPosition="start"
            />
            <Tab 
              icon={<TemplateIcon />} 
              label="Templates" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        
        {/* Tab Content */}
        <Bx sx={{ flex: 1, p: 2, overflowY: "auto" }}>
          {loading && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Bx>
          )}
          
          {!loading && (
            <>
              {/* New Message Tab */}
              {tabValue === 0 && (
                <Paper sx={{ p: 3, mb: 2 }}>
                  <T variant="h5" sx={{ mb: 3 }}>Create New Message</T>
                  
                  {/* Message Form */}
                  <MessageTemplateForm 
                    title={messageTitle}
                    body={messageBody}
                    onTitleChange={setMessageTitle}
                    onBodyChange={setMessageBody}
                    templates={templates}
                    onTemplateSelect={handleTemplateSelect}
                    onTemplatesChange={setTemplates}
                  />
                  
                  {/* Student Import */}
                  <Bx sx={{ mt: 4 }}>
                    <T variant="h6" sx={{ mb: 2 }}>Student Recipients</T>
                    <StudentImport 
                      students={students}
                      onStudentsChange={setStudents}
                      onPreviewStudent={handlePreviewStudent}
                    />
                  </Bx>
                  
                  {/* Action Buttons */}
                  <Bx sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <B 
                      variant="contained" 
                      color="primary" 
                      onClick={handlePreview}
                      disabled={!messageBody || students.length === 0}
                      startIcon={<EmailIcon />}
                    >
                      Preview Message
                    </B>
                    
                    <Bx>
                      <B 
                        variant="outlined" 
                        color="primary" 
                        onClick={handleSaveTemplate}
                        disabled={!messageTitle || !messageBody}
                        startIcon={<Save />}
                        sx={{ mr: 2 }}
                      >
                        Save as Template
                      </B>
                      
                      <B 
                        variant="contained" 
                        color="success" 
                        onClick={() => setConfirmSendOpen(true)}
                        disabled={!messageBody || students.length === 0}
                        startIcon={<Send />}
                      >
                        Send Messages
                      </B>
                    </Bx>
                  </Bx>
                  
                  {/* Display error if any */}
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </Paper>
              )}
              
              {/* Message History Tab */}
              {tabValue === 1 && (
                <MessageHistory />
              )}
              
              {/* Templates Tab */}
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
            </>
          )}
        </Bx>
        
        {/* Message Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Message Preview</DialogTitle>
          <DialogContent>
            <MessagePreview 
              title={messageTitle}
              body={messageBody}
              student={previewStudent || { name: "Sample Student", email: "student@example.com" }}
            />
          </DialogContent>
          <DialogActions>
            <B onClick={() => setPreviewOpen(false)}>Close</B>
          </DialogActions>
        </Dialog>
        
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
        
        {/* Confirm Send Dialog */}
        <Dialog
          open={confirmSendOpen}
          onClose={() => !sendingStatus.sending && setConfirmSendOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Sending</DialogTitle>
          <DialogContent>
            <T variant="body1">
              You are about to send this message to {students.length} recipient{students.length !== 1 ? 's' : ''}. 
              Do you want to proceed?
            </T>
          </DialogContent>
          <DialogActions>
            <B 
              onClick={() => setConfirmSendOpen(false)}
              disabled={sendingStatus.sending}
            >
              Cancel
            </B>
            <B 
              color="primary" 
              onClick={handleSendMessages}
              disabled={sendingStatus.sending}
            >
              Confirm Send
            </B>
          </DialogActions>
        </Dialog>
        
        {/* Sending Progress Dialog */}
        <Dialog
          open={sendingStatus.sending}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Sending Messages</DialogTitle>
          <DialogContent>
            <T variant="body1">
              Sending message to {sendingStatus.progress} of {sendingStatus.total} recipients...
            </T>
            <Bx sx={{ mt: 2, bgcolor: '#f0f0f0', borderRadius: 1, height: 10, position: 'relative' }}>
              <Bx 
                sx={{ 
                  position: 'absolute', 
                  left: 0, 
                  top: 0, 
                  height: '100%', 
                  width: `${(sendingStatus.progress / sendingStatus.total) * 100}%`,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                  transition: 'width 0.3s ease-in-out'
                }} 
              />
            </Bx>
          </DialogContent>
        </Dialog>
        
        {/* Add New Template FAB - Only visible in Templates tab */}
        {tabValue === 2 && (
          <Fab
            color="secondary"
            sx={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
            }}
            onClick={() => navigate("/admin/messages")}
          >
            <Add />
          </Fab>
        )}
        
        {/* Success Alert Snackbar */}
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