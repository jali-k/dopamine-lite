import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box as Bx,
  Button as B,
  Container,
  Fab,
  Grid,
  Stack,
  TextField as Tf,
  Typography as T,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material";
import React from "react";
import {
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  MenuBook as BookIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Add,
  ExpandMore as ExpandMoreIcon,
  FolderOpen as FolderIcon,
  Save as SaveIcon,
  TextFields as TextFieldsIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { collection, deleteDoc, doc, setDoc, getDoc, getDocs, query, limit, updateDoc } from "firebase/firestore";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { useUser } from "../contexts/UserProvider";
import { useState, useEffect, useCallback, useMemo } from "react";
import { deleteTutorial, isValidEmail } from "../../funcs";
import { jhsfg } from "../../af";
import AuthorizedUsersAccordion from "../components/AuthorizedUsersAccordion ";

// Cache for admin data with longer duration
const adminDataCache = new Map();
const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (extended for large email lists)

const getCachedAdminData = (key) => {
  const cached = adminDataCache.get(key);
  if (cached && Date.now() - cached.timestamp < ADMIN_CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedAdminData = (key, data) => {
  adminDataCache.set(key, { data, timestamp: Date.now() });
};

export default function AdmPDFFileView() {
  const params = useParams();
  const navigator = useNavigate();
  const { isAdmin } = useUser();

  // State management
  const [pdfs, setPdfs] = useState([]);
  const [emails, setEmails] = useState([]);
  const [coverText, setCoverText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [editableemails, setEditableEmails] = useState("");
  const [openDeleteFolderConfirm, setOpenDeleteFolderConfirm] = useState(false);
  
  // Cover text states
  const [coverTextError, setCoverTextError] = useState("");
  const [coverTextSuccess, setCoverTextSuccess] = useState(false);
  const [savingCoverText, setSavingCoverText] = useState(false);

  // New loading states for email operations
  const [addingEmails, setAddingEmails] = useState(false);
  const [deletingEmails, setDeletingEmails] = useState(false);

  // PDF Edit/Delete states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: ''
  });
  const [editingSaving, setEditingSaving] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);

  // Enhanced email processing with safety checks
  const processEmailInput = useCallback((rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') return [];

    // Split by both comma and newline, then process each email
    const rawEmails = rawInput
      .replace(/[,;]/g, '\n') // Replace commas and semicolons with newlines
      .split('\n')
      .map(email => {
        // Comprehensive email cleaning
        return email
          .trim()                    // Remove front and back spaces
          .toLowerCase()             // Convert to lowercase
          .replace(/\s+/g, '')       // Remove all internal spaces
          .replace(/['"]/g, '')      // Remove quotes that might be added accidentally
          .replace(/[<>]/g, '');     // Remove angle brackets
      })
      .filter(email => {
        // Filter out empty strings and invalid patterns
        return email && 
               email.length > 0 && 
               email.includes('@') &&     // Must contain @
               email.indexOf('@') > 0 &&  // @ cannot be first character
               email.lastIndexOf('@') === email.indexOf('@') && // Only one @
               email.length > 3;          // Minimum reasonable length
      });

    // Remove duplicates and return
    return [...new Set(rawEmails)];
  }, []);

  // Updated dbemails using the safe processor
  const dbemails = useMemo(() => {
    return processEmailInput(editableemails);
  }, [editableemails, processEmailInput]);

  // Enhanced email validation
  const validateEmail = useCallback((email) => {
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length >= 5 && email.length <= 254;
  }, []);

  // FIXED: Optimized data fetching - Remove email limit to fetch ALL emails
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = `admin_${params.fname}`;
      const cachedData = getCachedAdminData(cacheKey);
      
      if (cachedData) {
        setPdfs(cachedData.pdfs);
        setEmails(cachedData.emails);
        setCoverText(cachedData.coverText);
        setLoading(false);
        return;
      }

      console.log('Fetching all admin data including ALL emails...');

      // Add timeout for large datasets
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Large dataset is taking too long to load')), 45000);
      });

      // FIXED: Remove limit from emails query to fetch ALL emails (even 2000+)
      const fetchPromise = Promise.all([
        getDocs(query(collection(fireDB, "pdfFolders", params.fname, "pdfs"), limit(100))), // Keep PDF limit for performance
        getDocs(collection(fireDB, "pdfFolders", params.fname, "emailslist")), // REMOVED LIMIT HERE
        getDoc(doc(fireDB, "settings", "coverText"))
      ]);

      const [pdfsSnapshot, emailsSnapshot, coverTextDoc] = await Promise.race([fetchPromise, timeoutPromise]);

      // Process data
      const pdfsData = pdfsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const emailsData = emailsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const coverTextData = coverTextDoc.exists() 
        ? coverTextDoc.data().text 
        : 'A key tip for long-term success in biology is to actively engage with the material beyond rote memorization. This involves understanding the "why" behind biological processes, connecting concepts, and practicing application through various methods like drawing diagrams, explaining concepts to others, and answering practice questions that require critical thinking. Regularly reviewing material, even in shorter sessions, and breaking down complex topics into smaller, manageable parts can also help with retention and prevent overwhelming feelings. ';

      console.log(`Successfully fetched ${pdfsData.length} PDFs and ${emailsData.length} emails for ${params.fname}`);

      // Cache the results
      const dataToCache = {
        pdfs: pdfsData,
        emails: emailsData,
        coverText: coverTextData
      };
      setCachedAdminData(cacheKey, dataToCache);

      // Update state
      setPdfs(pdfsData);
      setEmails(emailsData);
      setCoverText(coverTextData);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      
      // Set empty arrays on error but don't break the app
      if (error.message.includes('Timeout')) {
        console.warn('Large dataset took too long to load. Some features may be limited.');
        // Try to set what we can
        setEmails([]);
        setPdfs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [params.fname]);

  // Updated addEmailsToDB with visual effects
  const addEmailsToDB = useCallback(async () => {
    setAddingEmails(true); // Start loading animation
    
    try {
      // Process and validate emails
      const processedEmails = processEmailInput(editableemails);
      const validEmails = processedEmails.filter(email => validateEmail(email));
      const invalidEmails = processedEmails.filter(email => !validateEmail(email));

      // Show validation feedback
      if (invalidEmails.length > 0) {
        const errorMessage = `Invalid emails found: ${invalidEmails.join(', ')}`;
        setEditableEmails(prev => prev + `\n\n❌ ${errorMessage}`);
        
        // Auto-clear error message after 3 seconds
        setTimeout(() => {
          setEditableEmails(prev => 
            prev.replace(/\n\n❌.*$/, '')
          );
        }, 3000);
      }

      if (validEmails.length === 0) {
        setEditableEmails("❌ No valid emails to add. Please check your input.");
        setTimeout(() => setEditableEmails(""), 2000);
        return;
      }

      // Check for duplicates with existing emails
      const existingEmailAddresses = emails.map(e => e.email);
      const newEmails = validEmails.filter(email => !existingEmailAddresses.includes(email));
      const duplicateEmails = validEmails.filter(email => existingEmailAddresses.includes(email));

      if (duplicateEmails.length > 0) {
        console.log(`Skipping duplicate emails: ${duplicateEmails.join(', ')}`);
      }

      if (newEmails.length === 0) {
        setEditableEmails("❌ All emails already exist in the system.");
        setTimeout(() => setEditableEmails(""), 2000);
        return;
      }

      // Batch operations for better performance
      const promises = newEmails.map(email => 
        setDoc(doc(fireDB, "pdfFolders", params.fname, "emailslist", email), {
          email: email,
          addedAt: new Date(),
          addedBy: "admin"
        })
      );

      await Promise.all(promises);
      
      // Success feedback
      let successMessage = `✅ Successfully added ${newEmails.length} email(s)`;
      if (duplicateEmails.length > 0) {
        successMessage += `, skipped ${duplicateEmails.length} duplicate(s)`;
      }
      
      setEditableEmails(successMessage);
      setTimeout(() => setEditableEmails(""), 2000);

      // Update local state
      const newEmailObjects = newEmails.map(email => ({ 
        email, 
        id: email,
        addedAt: new Date()
      }));
      setEmails(prev => [...prev, ...newEmailObjects]);
      
      // Clear cache to force refresh on next load
      adminDataCache.delete(`admin_${params.fname}`);
      
    } catch (err) {
      setEditableEmails("❌ An error occurred while adding emails. Please try again.");
      console.error("Error adding emails:", err);
      setTimeout(() => setEditableEmails(""), 3000);
    } finally {
      setAddingEmails(false); // Stop loading animation
    }
  }, [editableemails, processEmailInput, validateEmail, emails, params.fname]);

  // Updated deleteEmailsfromDB with visual effects
  const deleteEmailsfromDB = useCallback(async () => {
    setDeletingEmails(true); // Start loading animation
    
    try {
      const processedEmails = processEmailInput(editableemails);
      
      if (processedEmails.includes("delete_all") || processedEmails.includes("deleteall")) {
        // Delete all emails
        const deletePromises = emails.map(email => 
          deleteDoc(doc(fireDB, "pdfFolders", params.fname, "emailslist", email.id))
        );
        await Promise.all(deletePromises);
        setEmails([]);
        setEditableEmails(`✅ Deleted all ${emails.length} emails`);
      } else {
        // Delete specific emails
        const emailsToDelete = emails.filter(email => processedEmails.includes(email.email));
        
        if (emailsToDelete.length === 0) {
          setEditableEmails("❌ No matching emails found to delete");
          setTimeout(() => setEditableEmails(""), 2000);
          return;
        }
        
        const deletePromises = emailsToDelete.map(email => 
          deleteDoc(doc(fireDB, "pdfFolders", params.fname, "emailslist", email.id))
        );
        await Promise.all(deletePromises);
        setEmails(prev => prev.filter(email => !processedEmails.includes(email.email)));
        setEditableEmails(`✅ Deleted ${emailsToDelete.length} email(s)`);
      }
      
      setTimeout(() => setEditableEmails(""), 2000);
      
      // Clear cache
      adminDataCache.delete(`admin_${params.fname}`);
    } catch (err) {
      setEditableEmails("❌ An error occurred while deleting emails");
      console.error("Error deleting emails:", err);
      setTimeout(() => setEditableEmails(""), 3000);
    } finally {
      setDeletingEmails(false); // Stop loading animation
    }
  }, [editableemails, processEmailInput, emails, params.fname]);

  // Optimized cover text save
  const saveCoverText = useCallback(async () => {
    setCoverTextError("");
    
    if (coverText.length < 305) {
      setCoverTextError("Cover text must be at least 305 characters long.");
      return;
    }

    setSavingCoverText(true);
    
    try {
      await setDoc(doc(fireDB, "settings", "coverText"), {
        text: coverText,
        updatedAt: new Date(),
        updatedBy: "admin"
      });
      
      setCoverTextSuccess(true);
      
      // Update cache
      const cacheKey = `admin_${params.fname}`;
      const existingCache = getCachedAdminData(cacheKey);
      if (existingCache) {
        setCachedAdminData(cacheKey, {
          ...existingCache,
          coverText: coverText
        });
      }
      
    } catch (error) {
      console.error("Error saving cover text:", error);
      setCoverTextError("Failed to save cover text. Please try again.");
    } finally {
      setSavingCoverText(false);
    }
  }, [coverText, params.fname]);

  // PDF Edit Functions
  const handleEditPDF = useCallback((pdf) => {
    setSelectedPdf(pdf);
    setEditFormData({
      title: pdf.title || '',
      description: pdf.description || ''
    });
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedPdf || !editFormData.title.trim()) {
      alert("Title is required");
      return;
    }

    setEditingSaving(true);
    
    try {
      const pdfDocRef = doc(fireDB, "pdfFolders", params.fname, "pdfs", selectedPdf.id);
      
      await updateDoc(pdfDocRef, {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        updatedAt: new Date(),
        updatedBy: "admin"
      });

      // Update local state
      setPdfs(prev => prev.map(pdf => 
        pdf.id === selectedPdf.id 
          ? { ...pdf, title: editFormData.title.trim(), description: editFormData.description.trim() }
          : pdf
      ));

      // Clear cache
      adminDataCache.delete(`admin_${params.fname}`);
      
      // Close dialog
      setEditDialogOpen(false);
      setSelectedPdf(null);
      
      console.log(`PDF ${selectedPdf.title} updated successfully`);
      
    } catch (error) {
      console.error("Error updating PDF:", error);
      alert("Failed to update PDF. Please try again.");
    } finally {
      setEditingSaving(false);
    }
  }, [selectedPdf, editFormData, params.fname]);

  // PDF Delete Functions
  const handleDeletePDF = useCallback((pdf) => {
    setSelectedPdf(pdf);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeletePDF = useCallback(async () => {
    if (!selectedPdf) return;

    setDeletingPdf(true);
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(fireDB, "pdfFolders", params.fname, "pdfs", selectedPdf.id));
      
      // Update local state
      setPdfs(prev => prev.filter(p => p.id !== selectedPdf.id));
      
      // Clear cache
      adminDataCache.delete(`admin_${params.fname}`);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setSelectedPdf(null);
      
      console.log(`PDF ${selectedPdf.title} deleted successfully`);
      
    } catch (error) {
      console.error("Error deleting PDF:", error);
      alert("Failed to delete PDF. Please try again.");
    } finally {
      setDeletingPdf(false);
    }
  }, [selectedPdf, params.fname]);

  const handleViewPDF = useCallback((pdf) => {
    if (pdf.url) {
      window.open(pdf.url, '_blank');
    } else {
      alert("PDF URL not available");
    }
  }, []);

  const handleDownloadPDF = useCallback(async (pdf) => {
    try {
      if (!pdf.url) {
        alert("PDF file URL is missing.");
        return;
      }

      const link = document.createElement("a");
      link.href = pdf.url;
      link.setAttribute("download", `${pdf.title}.pdf`);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download the PDF. Please try again.");
    }
  }, []);

  // Memoized utility functions
  const formatFileSize = useMemo(() => (bytes) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  }, []);

  const handleDeleteFolder = useCallback(async () => {
    try {
      // Batch delete operations
      const deletePromises = [
        // Delete all PDFs
        ...pdfs.map(pdf => deleteDoc(doc(fireDB, "pdfFolders", params.fname, "pdfs", pdf.id))),
        
        // Delete all emails
        ...emails.map(email => deleteDoc(doc(fireDB, "pdfFolders", params.fname, "emailslist", email.id))),
        
        // Delete the folder itself
        deleteDoc(doc(fireDB, "pdfFolders", params.fname))
      ];

      await Promise.all(deletePromises);
      
      // Clear cache
      adminDataCache.delete(`admin_${params.fname}`);
      
      console.log(`Folder ${params.fname} deleted`);
      navigator("/admin");
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  }, [pdfs, emails, params.fname, navigator]);

  // Memoized PDF Card component
  const PdfCard = React.memo(({ pdf, index }) => (
    <Grid item key={pdf.id || index} xs={12} sm={6} md={4} lg={3}>
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.15)',
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Bx
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 2
            }}
          >
            <PdfIcon
              sx={{
                fontSize: 64,
                color: '#d32f2f',
                mb: 1
              }}
            />
            <T variant="h6" textAlign="center" sx={{ mb: 1 }}>
              {pdf.title}
            </T>
            {pdf.description && (
              <T variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
                {pdf.description}
              </T>
            )}
            <Chip
              label={formatFileSize(pdf.size)}
              size="small"
              variant="outlined"
              color="info"
            />
          </Bx>
        </CardContent>
        
        <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <IconButton
              color="primary"
              onClick={() => handleViewPDF(pdf)}
              sx={{ flex: 1 }}
              title="View PDF"
            >
              <ViewIcon />
            </IconButton>
            <IconButton
              color="success"
              onClick={() => handleDownloadPDF(pdf)}
              sx={{ flex: 1 }}
              title="Download PDF"
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              color="warning"
              onClick={() => handleEditPDF(pdf)}
              sx={{ flex: 1 }}
              title="Edit PDF"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeletePDF(pdf)}
              sx={{ flex: 1 }}
              title="Delete PDF"
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </CardActions>
      </Card>
    </Grid>
  ));

  // Load data on component mount
  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Loading state
  if (loading) {
    return <Loading text="Loading PDF Documents and All Authorized Emails (This may take a moment for large lists)" />;
  }

  // Authorization check
  if (!isAdmin) {
    return (
      <NavLink
        to="/"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          textDecoration: "none",
        }}
      >
        <T color={"error.main"}>
          {jhsfg([
            89, 111, 117, 32, 97, 114, 101, 32, 110, 111, 116, 32, 97, 117, 116,
            104, 111, 114, 105, 122, 101, 100, 32, 116, 111, 32, 118, 105, 101,
            119, 32, 116, 104, 105, 115, 32, 112, 97, 103, 101, 46, 32, 67, 108,
            105, 99, 107, 32, 104, 101, 114, 101, 32, 116, 111, 32, 103, 111,
            32, 98, 97, 99, 107,
          ])}
        </T>
      </NavLink>
    );
  }

  return (
    <Container
      disableGutters
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f4f4",
        position: "relative",
      }}
    >
      <Appbar />
      <Bx
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: 2,
          overflowY: "auto",
          pb: 10,
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'rgba(244, 67, 54, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <FolderIcon
            sx={{
              fontSize: 32,
              color: '#d32f2f'
            }}
          />
          <T variant="h4">
            {params.fname} - PDF Documents (Admin)
          </T>
        </Paper>

        {/* Cover Text Management Accordion */}
        <Accordion>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: 'rgba(33, 150, 243, 0.05)',
              '&:hover': {
                bgcolor: 'rgba(33, 150, 243, 0.1)',
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <TextFieldsIcon sx={{ color: '#1976d2' }} />
              <T variant="h6" sx={{ color: '#1976d2' }}>
                Steganography Cover Text Management
              </T>
            </Stack>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: 'rgba(33, 150, 243, 0.02)',
            }}
          >
            <T variant="body2" color="text.secondary">
              This text will be embedded as cover text in all processed PDFs. Must be at least 305 characters long.
            </T>
            
            <Tf
              fullWidth
              multiline
              minRows={6}
              maxRows={10}
              variant="outlined"
              label="Cover Text for PDF Steganography"
              placeholder="Enter the cover text that will be used for steganography in PDFs..."
              value={coverText}
              onChange={(e) => {
                setCoverText(e.target.value);
                setCoverTextError("");
              }}
              error={!!coverTextError}
              helperText={
                coverTextError || 
                `${coverText.length}/305 characters minimum required`
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: coverText.length >= 305 ? '#4caf50' : '#1976d2',
                  },
                },
              }}
            />
            
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Bx>
                <Chip 
                  label={`${coverText.length} characters`}
                  color={coverText.length >= 305 ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Bx>
              
              <B
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveCoverText}
                disabled={savingCoverText || coverText.length < 305}
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  }
                }}
              >
                {savingCoverText ? 'Saving...' : 'Save Cover Text'}
              </B>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* PDF Files Grid */}
        <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <CardContent>
            <Grid container spacing={3}>
              {pdfs && pdfs.length > 0 ? (
                pdfs.map((pdf, index) => (
                  <PdfCard key={pdf.id || index} pdf={pdf} index={index} />
                ))
              ) : (
                <Grid item xs={12}>
                  <Bx
                    sx={{
                      textAlign: "center",
                      py: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                    <T variant="h6" color="text.secondary">
                      No PDF Documents Found
                    </T>
                    <T variant="body2" color="text.secondary">
                      Upload some PDF files to get started
                    </T>
                  </Bx>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Authorized Users Accordion with email count */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <T variant="h6">Authorized Users</T>
              <Chip 
                label={`${emails.length} Total Users`}
                color="info"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>
            <AuthorizedUsersAccordion emails={emails} />
          </CardContent>
        </Card>

        {/* Edit Access Accordion */}
        <Accordion>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: 'rgba(255, 152, 0, 0.05)',
              '&:hover': {
                bgcolor: 'rgba(255, 152, 0, 0.1)',
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonAddIcon sx={{ color: '#ff9800' }} />
              <T variant="h6" sx={{ color: '#ff9800' }}>
                Edit PDF Access
              </T>
              {(addingEmails || deletingEmails) && (
                <CircularProgress 
                  size={20} 
                  sx={{ 
                    color: '#ff9800',
                    ml: 1
                  }} 
                />
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: 'rgba(255, 152, 0, 0.02)',
            }}
          >
            <T variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Enter email addresses separated by commas, semicolons, or new lines. 
              Type "DELETE_ALL" to remove all emails. All emails are automatically cleaned and validated.
              <br />
              <strong>Currently managing {emails.length} authorized users.</strong>
            </T>
            <Tf
              fullWidth
              multiline
              minRows={3}
              maxRows={5}
              variant="outlined"
              placeholder="john.doe@gmail.com, jane.smith@yahoo.com&#10;bob@example.com&#10;DELETE_ALL (to remove all)"
              value={editableemails}
              onChange={(e) => setEditableEmails(e.target.value)}
              disabled={addingEmails || deletingEmails}
              helperText={
                addingEmails ? "Adding emails..." :
                deletingEmails ? "Deleting emails..." :
                dbemails.length > 0 ? `${dbemails.length} valid email(s) ready to process` : "Enter emails above"
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }
                }
              }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <B
                variant="contained"
                color="success"
                onClick={addEmailsToDB}
                disabled={dbemails.length === 0 || addingEmails || deletingEmails}
                startIcon={
                  addingEmails ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <PersonAddIcon />
                  )
                }
                sx={{
                  minWidth: '120px',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:disabled': {
                    opacity: addingEmails ? 0.8 : 0.6,
                  },
                  ...(addingEmails && {
                    animation: 'pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                  })
                }}
              >
                {addingEmails ? 'Adding...' : `Add (${dbemails.length})`}
              </B>
              <B
                variant="contained"
                color="error"
                onClick={deleteEmailsfromDB}
                disabled={dbemails.length === 0 || addingEmails || deletingEmails}
                startIcon={
                  deletingEmails ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <PersonRemoveIcon />
                  )
                }
                sx={{
                  minWidth: '120px',
                  position: 'relative',
                  transition: 'all 0.3s ease-in-out',
                  '&:disabled': {
                    opacity: deletingEmails ? 0.8 : 0.6,
                  },
                  ...(deletingEmails && {
                    animation: 'pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 20px rgba(244, 67, 54, 0.4)',
                  })
                }}
              >
                {deletingEmails ? 'Removing...' : `Remove (${dbemails.length})`}
              </B>
            </Stack>
            
            {/* Progress indicator */}
            {(addingEmails || deletingEmails) && (
              <Bx
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  bgcolor: addingEmails ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  borderRadius: 2,
                  border: `1px solid ${addingEmails ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
                }}
              >
                <CircularProgress 
                  size={20} 
                  sx={{ 
                    color: addingEmails ? '#4caf50' : '#f44336'
                  }} 
                />
                <T variant="body2" sx={{ color: addingEmails ? '#4caf50' : '#f44336' }}>
                  {addingEmails ? 'Processing email additions...' : 'Processing email deletions...'}
                </T>
              </Bx>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Delete Folder Button */}
        <B
          fullWidth
          color="error"
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={() => setOpenDeleteFolderConfirm(true)}
        >
          Delete {params.fname} Folder
        </B>
      </Bx>

      {/* Add PDF FAB */}
      <Fab
        color="error"
        sx={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}
        onClick={() => {
          navigator("add");
        }}
      >
        <Add />
      </Fab>

      {/* Edit PDF Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editingSaving && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon color="warning" />
            <T variant="h6">Edit PDF Document</T>
          </Stack>
          {!editingSaving && (
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Tf
              label="Title"
              fullWidth
              value={editFormData.title}
              onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={editingSaving}
              required
              helperText="Required field"
            />
            <Tf
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={editingSaving}
              helperText="Optional description"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <B 
            onClick={() => setEditDialogOpen(false)}
            disabled={editingSaving}
          >
            Cancel
          </B>
          <B
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editingSaving || !editFormData.title.trim()}
            startIcon={editingSaving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {editingSaving ? 'Saving...' : 'Save Changes'}
          </B>
        </DialogActions>
      </Dialog>

      {/* Delete PDF Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingPdf && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DeleteIcon />
            <T variant="h6">Delete PDF Document</T>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <T variant="body1">
            Are you sure you want to delete "{selectedPdf?.title}"?
          </T>
        </DialogContent>
        <DialogActions>
          <B 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingPdf}
          >
            Cancel
          </B>
          <B
            variant="contained"
            color="error"
            onClick={confirmDeletePDF}
            disabled={deletingPdf}
            startIcon={deletingPdf ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deletingPdf ? 'Deleting...' : 'Delete PDF'}
          </B>
        </DialogActions>
      </Dialog>

      {/* Folder Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteFolderConfirm}
        onClose={() => setOpenDeleteFolderConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete PDF Folder</DialogTitle>
        <DialogContent>
          <T variant="body1">
            Are you sure you want to delete the folder "{params.fname}"?
            This will remove all PDF documents and email access settings.
          </T>
        </DialogContent>
        <DialogActions>
          <B onClick={() => setOpenDeleteFolderConfirm(false)}>
            Cancel
          </B>
          <B
            color="error"
            onClick={handleDeleteFolder}
          >
            Delete
          </B>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={coverTextSuccess}
        autoHideDuration={4000}
        onClose={() => setCoverTextSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setCoverTextSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Cover text saved successfully!
        </Alert>
      </Snackbar>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Container>
  );
}