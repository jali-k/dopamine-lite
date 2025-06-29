import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  Description as PdfIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
  MenuBook as BookIcon,
  CloudDownload as CloudDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { collection, doc, getDocs, getDoc, query, limit } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { useUser } from "../contexts/UserProvider";

// Cache for frequently accessed data
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Optimized cache helper
const getCachedData = (key) => {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  dataCache.set(key, { data, timestamp: Date.now() });
};

export default function PDFFileView() {
  const params = useParams();
  const { user, isAdmin } = useUser();

  // State management
  const [pdfs, setPdfs] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [coverText, setCoverText] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingPdf, setProcessingPdf] = useState(null);
  const [processResult, setProcessResult] = useState(null);

  // ENHANCED authorization check with CASE-INSENSITIVE email matching
  const checkUserAuthorization = useCallback(async () => {
    // Admin always has access
    if (isAdmin) {
      console.log("✅ Admin access granted for:", user.email);
      return true;
    }

    if (!user.email) {
      console.error("❌ No user email available for authorization check");
      return false;
    }

    try {
      console.log(`🔍 Checking authorization for user: "${user.email}" in folder: "${params.fname}"`);
      
      // Clean the user's email (remove spaces, normalize case)
      const cleanUserEmail = user.email.trim().toLowerCase();
      console.log(`📧 User email normalized to: "${cleanUserEmail}"`);
      
      // IMPORTANT: Always fetch ALL emails because of case sensitivity issues
      // Emails might be stored as "John.Doe@Gmail.com" but user logs in as "john.doe@gmail.com"
      console.log("🔄 Fetching ALL authorized emails for case-insensitive comparison...");
      
      const emailsSnapshot = await getDocs(
        collection(fireDB, "pdfFolders", params.fname, "emailslist")
      );
      
      console.log(`📊 Found ${emailsSnapshot.docs.length} total email documents in folder`);
      
      if (emailsSnapshot.docs.length === 0) {
        console.log("⚠️ No authorized emails found in folder - this might be an open access folder");
        return true; // If no emails are set, assume open access
      }
      
      // Check ALL documents with case-insensitive comparison
      const authorizedEmails = [];
      let accessGranted = false;
      let matchDetails = null;
      
      for (const emailDoc of emailsSnapshot.docs) {
        const emailData = emailDoc.data();
        const docId = emailDoc.id;
        
        // Store for debugging
        authorizedEmails.push({
          docId: docId,
          emailField: emailData.email,
          normalizedDocId: docId.toLowerCase().trim(),
          normalizedEmailField: emailData.email ? emailData.email.toLowerCase().trim() : null
        });
        
        // Case-insensitive comparison of document ID
        const docIdMatch = docId.toLowerCase().trim() === cleanUserEmail;
        
        // Case-insensitive comparison of email field (if it exists)
        const emailFieldMatch = emailData.email && 
                               emailData.email.toLowerCase().trim() === cleanUserEmail;
        
        if (docIdMatch || emailFieldMatch) {
          accessGranted = true;
          matchDetails = {
            originalDocId: docId,
            originalEmailField: emailData.email,
            matchedBy: docIdMatch ? 'Document ID' : 'Email Field',
            userEmail: user.email,
            normalizedUserEmail: cleanUserEmail
          };
          break;
        }
      }
      
      if (accessGranted) {
        console.log(`✅ ACCESS GRANTED! Found case-insensitive match:`, matchDetails);
        return true;
      } else {
        console.log(`❌ ACCESS DENIED. User "${cleanUserEmail}" not found in any of the ${emailsSnapshot.docs.length} authorized emails`);
        
        // Debug: Show all authorized emails with their normalized versions
        console.log("📝 All authorized emails (showing original and normalized):", 
          authorizedEmails.slice(0, 10).map(email => ({
            original: email.docId,
            normalized: email.normalizedDocId,
            fieldOriginal: email.emailField,
            fieldNormalized: email.normalizedEmailField
          }))
        );
        
        // Extra debug: Show if there are any partial matches
        const partialMatches = authorizedEmails.filter(email => 
          email.normalizedDocId.includes(cleanUserEmail.split('@')[0]) ||
          (email.normalizedEmailField && email.normalizedEmailField.includes(cleanUserEmail.split('@')[0]))
        );
        
        if (partialMatches.length > 0) {
          console.log("🔍 Found partial matches (might help with debugging):", partialMatches);
        }
        
        return false;
      }
      
    } catch (error) {
      console.error("❌ Authorization check error:", error);
      return false;
    }
  }, [isAdmin, params.fname, user.email]);

  // Optimized data fetching function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = `folder_${params.fname}_${user.email}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        setPdfs(cachedData.pdfs);
        setIsAuthorized(cachedData.isAuthorized);
        setCoverText(cachedData.coverText);
        setLoading(false);
        return;
      }

      // Parallel data fetching for better performance
      const [pdfsSnapshot, authCheckResult, coverTextDoc] = await Promise.all([
        // Fetch PDFs with limit for better performance
        getDocs(query(collection(fireDB, "pdfFolders", params.fname, "pdfs"), limit(50))),
        
        // ENHANCED authorization check
        checkUserAuthorization(),
        
        // Fetch cover text
        getDoc(doc(fireDB, "settings", "coverText"))
      ]);

      // Process PDFs data
      const pdfsData = pdfsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process cover text
      const coverTextData = coverTextDoc.exists() 
        ? coverTextDoc.data().text 
        : 'A key tip for long-term success in biology is to actively engage with the material beyond rote memorization. This involves understanding the "why" behind biological processes, connecting concepts, and practicing application through various methods like drawing diagrams, explaining concepts to others, and answering practice questions that require critical thinking. Regularly reviewing material, even in shorter sessions, and breaking down complex topics into smaller, manageable parts can also help with retention and prevent overwhelming feelings. ';

      // Cache the results
      const dataToCache = {
        pdfs: pdfsData,
        isAuthorized: authCheckResult,
        coverText: coverTextData
      };
      setCachedData(cacheKey, dataToCache);

      // Update state
      setPdfs(pdfsData);
      setIsAuthorized(authCheckResult);
      setCoverText(coverTextData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [params.fname, user.email, checkUserAuthorization]);

  // Memoized PDF submission handler
  const handlePdfSubmissionAdvanced = useCallback(async (pdf) => {
    try {
      setIsProcessing(true);
      setProcessingPdf(pdf);
      setProcessingStep('Preparing document...');
      setProcessResult(null);

      if (!pdf.url) {
        throw new Error("PDF file URL is missing");
      }

      setProcessingStep('Downloading PDF file...');
      const pdfResponse = await fetch(pdf.url);

      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }

      setProcessingStep('Processing document...');
      const pdfBlob = await pdfResponse.blob();

      const formData = new FormData();
      formData.append('pdf_file', pdfBlob, `${pdf.title}.pdf`);
      
      const metadata = {
        enable_watermark: true,
        enable_qr_code: true,
        enable_font_stego: true,
        watermark_text: user.email,
        email: user.email,
        secret_message: user.email,
        cover_text: coverText
      };

      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });

      setProcessingStep('Generating PDF...');
      const apiResponse = await fetch('https://gmark.sddopamine.com/api/all/', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`API Error ${apiResponse.status}: ${errorText}`);
      }

      setProcessingStep('Finalizing download...');
      const contentType = apiResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const result = await apiResponse.json();
        setProcessResult({ type: 'success', message: 'PDF has been processed successfully!' });
      } else if (contentType && contentType.includes('application/pdf')) {
        const pdfBlob = await apiResponse.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdf.title}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        setProcessResult({ type: 'success', message: 'PDF downloaded successfully!' });
      } else {
        const text = await apiResponse.text();
        setProcessResult({ type: 'success', message: 'PDF loaded successfully!' });
      }

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        setProcessingPdf(null);
        setProcessResult(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error processing PDF:", error);
      setProcessResult({ type: 'error', message: error.message });
      
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep('');
        setProcessingPdf(null);
        setProcessResult(null);
      }, 3000);
    }
  }, [user.email, coverText]);

  // Memoized utility functions
  const formatFileSize = useMemo(() => (bytes) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  }, []);

  const formatDate = useMemo(() => (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  // Memoized PDF cards to prevent unnecessary re-renders
  const PdfCard = React.memo(({ pdf, index }) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={pdf.id || index}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease-in-out',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          opacity: isProcessing ? 0.7 : 1,
          pointerEvents: isProcessing ? 'none' : 'auto',
          '&:hover': {
            transform: isProcessing ? 'none' : 'translateY(-8px)',
            boxShadow: isProcessing ? 'none' : '0 8px 32px rgba(211, 47, 47, 0.15)',
            '& .pdf-icon': {
              transform: isProcessing ? 'none' : 'scale(1.1)',
              color: isProcessing ? '#d32f2f' : '#b71c1c'
            }
          }
        }}
        onClick={() => !isProcessing && handlePdfSubmissionAdvanced(pdf)}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'linear-gradient(45deg, rgba(211, 47, 47, 0.05) 0%, transparent 50%)',
            borderRadius: '0 0 0 100px'
          }}
        />

        <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
          <PdfIcon
            className="pdf-icon"
            sx={{
              fontSize: 72,
              color: '#d32f2f',
              mb: 2,
              transition: 'all 0.3s ease-in-out',
              filter: 'drop-shadow(0 4px 8px rgba(211, 47, 47, 0.2))'
            }}
          />

          <Typography
            variant="h6"
            sx={{
              fontFamily: 'Quicksand, Arial, sans-serif',
              fontWeight: 600,
              color: '#2c2c2c',
              mb: 1,
              lineHeight: 1.3,
              height: '3.6em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {pdf.title}
          </Typography>

          {pdf.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ 
                mb: 2,
                height: '2.4em',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {pdf.description}
            </Typography>
          )}

          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            {pdf.size && (
              <Chip
                label={formatFileSize(pdf.size)}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  fontSize: '0.75rem'
                }}
              />
            )}
            {pdf.uploadedAt && (
              <Chip
                label={formatDate(pdf.uploadedAt)}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: '#666',
                  color: '#666',
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Stack>

          <Tooltip title="Process & Download PDF">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                if (!isProcessing) {
                  handlePdfSubmissionAdvanced(pdf);
                }
              }}
              disabled={isProcessing}
              sx={{
                bgcolor: 'rgba(211, 47, 47, 0.1)',
                color: '#d32f2f',
                '&:hover': {
                  bgcolor: 'rgba(211, 47, 47, 0.2)',
                  transform: 'scale(1.1)'
                },
                '&:disabled': {
                  bgcolor: 'rgba(211, 47, 47, 0.05)',
                  color: 'rgba(211, 47, 47, 0.5)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </CardContent>
      </Card>
    </Grid>
  ));

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return <Loading text="Loading PDF Documents" />;
  }

  // Authorization check
  if (isAuthorized === false) {
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
        <Typography
          color="error.main"
          textAlign="center"
          variant="h6"
          sx={{
            backgroundColor: 'error.light',
            padding: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)'
          }}
        >
          You are not authorized to view this page. Click here to go back
        </Typography>
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
        bgcolor: "#f5f5f5",
        position: "relative",
      }}
    >
      <Appbar />
      
      {/* Processing Dialog */}
      <Dialog
        open={isProcessing}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fff 0%, #f8f8f8 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
          <Box sx={{ position: 'relative', mb: 3 }}>
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                left: -20,
                right: -20,
                bottom: -20,
                background: 'linear-gradient(45deg, rgba(211, 47, 47, 0.1), rgba(244, 67, 54, 0.05))',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {processResult?.type === 'success' ? (
                <CheckCircleIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: '#4caf50',
                    filter: 'drop-shadow(0 4px 12px rgba(76, 175, 80, 0.3))'
                  }} 
                />
              ) : processResult?.type === 'error' ? (
                <ErrorIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: '#f44336',
                    filter: 'drop-shadow(0 4px 12px rgba(244, 67, 54, 0.3))'
                  }} 
                />
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <CloudDownloadIcon 
                    sx={{ 
                      fontSize: 80, 
                      color: '#d32f2f',
                      filter: 'drop-shadow(0 4px 12px rgba(211, 47, 47, 0.3))'
                    }} 
                  />
                  <CircularProgress
                    size={100}
                    thickness={2}
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: -10,
                      color: '#d32f2f',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {processingPdf && (
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Quicksand, Arial, sans-serif',
                fontWeight: 600,
                color: '#2c2c2c',
                mb: 1
              }}
            >
              {processingPdf.title}
            </Typography>
          )}

          <Typography
            variant="body1"
            sx={{
              color: processResult ? 
                (processResult.type === 'success' ? '#4caf50' : '#f44336') : 
                '#d32f2f',
              fontWeight: 500,
              mb: 2
            }}
          >
            {processResult ? processResult.message : processingStep}
          </Typography>

          {!processResult && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Please wait while we fetch your document...
            </Typography>
          )}

          {!processResult && (
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
              {['Preparing', 'Downloading', 'Processing', 'Finalizing'].map((step, index) => (
                <Box
                  key={step}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: processingStep.toLowerCase().includes(step.toLowerCase()) ? 
                      '#d32f2f' : 'rgba(211, 47, 47, 0.2)',
                    animation: processingStep.toLowerCase().includes(step.toLowerCase()) ? 
                      'pulse 1s ease-in-out infinite' : 'none'
                  }}
                />
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          px: 2,
          py: 2,
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            border: '1px solid rgba(211, 47, 47, 0.1)'
          }}
        >
          <BookIcon sx={{ fontSize: 32, color: '#d32f2f' }} />
          <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 600 }}>
            {params.fname} Documents
          </Typography>
        </Paper>

        {/* PDF Documents Grid */}
        <Grid container spacing={3}>
          {pdfs && pdfs.length > 0 ? (
            pdfs.map((pdf, index) => (
              <PdfCard key={pdf.id || index} pdf={pdf} index={index} />
            ))
          ) : (
            <Grid item xs={12}>
              <Card
                sx={{
                  textAlign: 'center',
                  py: 8,
                  background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.02) 0%, rgba(244, 67, 54, 0.01) 100%)',
                  border: '2px dashed rgba(211, 47, 47, 0.3)',
                  borderRadius: 3
                }}
              >
                <CardContent>
                  <Stack spacing={2} alignItems="center">
                    <FileIcon
                      sx={{
                        fontSize: 80,
                        color: 'rgba(211, 47, 47, 0.3)'
                      }}
                    />
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#d32f2f',
                        fontFamily: 'Quicksand, Arial, sans-serif',
                        fontWeight: 600
                      }}
                    >
                      No Documents Available
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ maxWidth: '400px' }}
                    >
                      There are no PDF documents in this folder yet. Check back later or contact your instructor.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </Container>
  );
}