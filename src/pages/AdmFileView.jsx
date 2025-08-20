import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box as Bx,
  Button as B,
  Container,
  Fab,
  Grid,
  List as L,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  Alert,
  CircularProgress,
  Divider,
  IconButton
} from "@mui/material";
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CloudIcon from '@mui/icons-material/Cloud';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { collection, deleteDoc, doc, setDoc, getDoc, getDocs, query, limit } from "firebase/firestore";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useState, useEffect, useCallback, useMemo } from "react";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import VCad from "../components/VCad";
import DeleteIcon from "@mui/icons-material/Delete";
import { useUser } from "../contexts/UserProvider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import { deleteTutorial, isValidEmail } from "../../funcs";
import { Add } from "@mui/icons-material";
import { jhsfg } from "../../af";
import AuthorizedUsersAccordion from "../components/AuthorizedUsersAccordion ";

// Cache for admin data
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

export default function AdmFileView() {
  const params = useParams();
  const tutorialref = collection(fireDB, "folders", params.fname, "tutorials");
  const emailListref = collection(fireDB, "folders", params.fname, "emailslist");

  const [editableemails, setEditableEmails] = useState("");
  const [openDeleteFolderConfirm, setOpenDeleteFolderConfirm] = useState(false);
  const [enrichedTuts, setEnrichedTuts] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // NEW: Enhanced loading states for email operations
  const [addingEmails, setAddingEmails] = useState(false);
  const [deletingEmails, setDeletingEmails] = useState(false);

  // NEW: Optimized email state
  const [emails, setEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(true);

  // EC2 Instance State Management
  const [instanceState, setInstanceState] = useState({
    state: 'unknown',
    public_ip: null,
    public_dns: null,
    loading: true,
    actionLoading: false,
    error: null,
    retryAttempt: 0,
    maxRetries: 3,
    isRetrying: false
  });

  const { isAdmin } = useUser();
  const [tuts, loading] = useCollectionData(tutorialref);
  const navigator = useNavigate();

  // API endpoint for EC2 control
  const EC2_API_ENDPOINT = "https://blkr53ji2k.execute-api.us-east-1.amazonaws.com/default/uploader_ec2_controller";
  // const EC2_API_ENDPOINT = "https://z8hbx8zvyb.execute-api.us-east-1.amazonaws.com/default/uploader_ec2_controller";

  // NEW: Enhanced email processing with safety checks
  const processEmailInput = useCallback((rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') return [];

    const rawEmails = rawInput
      .replace(/[,;]/g, '\n')
      .split('\n')
      .map(email => {
        return email
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/['"]/g, '')
          .replace(/[<>]/g, '');
      })
      .filter(email => {
        return email && 
               email.length > 0 && 
               email.includes('@') &&
               email.indexOf('@') > 0 &&
               email.lastIndexOf('@') === email.indexOf('@') &&
               email.length > 3;
      });

    return [...new Set(rawEmails)];
  }, []);

  // NEW: Enhanced email validation
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length >= 5 && email.length <= 254;
  }, []);

  // NEW: Optimized data fetching for emails - FIXED to fetch ALL emails
  const fetchEmails = useCallback(async () => {
    try {
      setEmailsLoading(true);
      
      // Check cache first
      const cacheKey = `admin_emails_${params.fname}`;
      const cachedData = getCachedAdminData(cacheKey);
      
      if (cachedData) {
        setEmails(cachedData);
        setEmailsLoading(false);
        return;
      }

      // FIXED: Remove limit to fetch ALL emails (even 2000+)
      console.log('Fetching all emails for admin view...');
      
      // Add timeout for large datasets
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Large email list is taking too long to load')), 30000);
      });
      
      const fetchPromise = getDocs(emailListref);
      
      const emailsSnapshot = await Promise.race([fetchPromise, timeoutPromise]);
      const emailsData = emailsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Successfully fetched ${emailsData.length} emails for ${params.fname}`);
      setCachedAdminData(cacheKey, emailsData);
      setEmails(emailsData);
      
    } catch (error) {
      console.error("Error fetching emails:", error);
      // Set empty array on error but don't break the app
      setEmails([]);
      
      // Show user-friendly error (could be expanded to show error message in UI)
      if (error.message.includes('Timeout')) {
        console.warn('Large email list took too long to load. Some features may be limited.');
      }
    } finally {
      setEmailsLoading(false);
    }
  }, [params.fname, emailListref]);

  // NEW: Memoized processed emails
  const dbemails = useMemo(() => {
    return processEmailInput(editableemails);
  }, [editableemails, processEmailInput]);

  // NEW: Enhanced addEmailsToDB with visual effects
  const addEmailsToDB = useCallback(async () => {
    setAddingEmails(true);
    
    try {
      const processedEmails = processEmailInput(editableemails);
      const validEmails = processedEmails.filter(email => validateEmail(email));
      const invalidEmails = processedEmails.filter(email => !validateEmail(email));

      if (invalidEmails.length > 0) {
        const errorMessage = `Invalid emails found: ${invalidEmails.join(', ')}`;
        setEditableEmails(prev => prev + `\n\n❌ ${errorMessage}`);
        
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

      const promises = newEmails.map(email => 
        setDoc(doc(emailListref, email), {
          email: email,
          addedAt: new Date(),
          addedBy: "admin"
        })
      );

      await Promise.all(promises);
      
      let successMessage = `✅ Successfully added ${newEmails.length} email(s)`;
      if (duplicateEmails.length > 0) {
        successMessage += `, skipped ${duplicateEmails.length} duplicate(s)`;
      }
      
      setEditableEmails(successMessage);
      setTimeout(() => setEditableEmails(""), 2000);

      const newEmailObjects = newEmails.map(email => ({ 
        email, 
        id: email,
        addedAt: new Date()
      }));
      setEmails(prev => [...prev, ...newEmailObjects]);
      
      adminDataCache.delete(`admin_emails_${params.fname}`);
      
    } catch (err) {
      setEditableEmails("❌ An error occurred while adding emails. Please try again.");
      console.error("Error adding emails:", err);
      setTimeout(() => setEditableEmails(""), 3000);
    } finally {
      setAddingEmails(false);
    }
  }, [editableemails, processEmailInput, validateEmail, emails, params.fname, emailListref]);

  // NEW: Enhanced deleteEmailsfromDB with visual effects
  const deleteEmailsfromDB = useCallback(async () => {
    setDeletingEmails(true);
    
    try {
      const processedEmails = processEmailInput(editableemails);
      
      if (processedEmails.includes("delete_all") || processedEmails.includes("deleteall")) {
        const deletePromises = emails.map(email => 
          deleteDoc(doc(emailListref, email.id))
        );
        await Promise.all(deletePromises);
        setEmails([]);
        setEditableEmails(`✅ Deleted all ${emails.length} emails`);
      } else {
        const emailsToDelete = emails.filter(email => processedEmails.includes(email.email));
        
        if (emailsToDelete.length === 0) {
          setEditableEmails("❌ No matching emails found to delete");
          setTimeout(() => setEditableEmails(""), 2000);
          return;
        }
        
        const deletePromises = emailsToDelete.map(email => 
          deleteDoc(doc(emailListref, email.id))
        );
        await Promise.all(deletePromises);
        setEmails(prev => prev.filter(email => !processedEmails.includes(email.email)));
        setEditableEmails(`✅ Deleted ${emailsToDelete.length} email(s)`);
      }
      
      setTimeout(() => setEditableEmails(""), 2000);
      adminDataCache.delete(`admin_emails_${params.fname}`);
      
    } catch (err) {
      setEditableEmails("❌ An error occurred while deleting emails");
      console.error("Error deleting emails:", err);
      setTimeout(() => setEditableEmails(""), 3000);
    } finally {
      setDeletingEmails(false);
    }
  }, [editableemails, processEmailInput, emails, params.fname, emailListref]);

  // EC2 Instance functions (unchanged)
  const fetchInstanceStatus = async (isRetry = false, retryAttempt = 0) => {
    try {
      if (isRetry) {
        setInstanceState(prev => ({
          ...prev,
          isRetrying: true,
          retryAttempt: retryAttempt
        }));
      }

      const response = await fetch(EC2_API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('response', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setInstanceState(prev => ({
        ...prev,
        state: data.state,
        public_ip: data.public_ip || null,
        public_dns: data.public_dns || null,
        loading: false,
        isRetrying: false,
        error: null,
        retryAttempt: 0
      }));
      
      return data;
    } catch (error) {
      console.error('Error fetching instance status:', error);
      
      if (!isRetry && retryAttempt < instanceState.maxRetries) {
        console.log(`Retry attempt ${retryAttempt + 1} of ${instanceState.maxRetries}`);
        setTimeout(() => {
          fetchInstanceStatus(false, retryAttempt + 1);
        }, 2000 * (retryAttempt + 1));
        
        setInstanceState(prev => ({
          ...prev,
          retryAttempt: retryAttempt + 1,
          error: `Connection failed. Retrying... (${retryAttempt + 1}/${prev.maxRetries})`
        }));
      } else {
        setInstanceState(prev => ({
          ...prev,
          loading: false,
          isRetrying: false,
          error: error.message,
          retryAttempt: 0
        }));
      }
      throw error;
    }
  };

  const retryFetchStatus = async () => {
    setInstanceState(prev => ({
      ...prev,
      error: null,
      isRetrying: true
    }));
    
    try {
      await fetchInstanceStatus(true);
    } catch (error) {
      // Error already handled in fetchInstanceStatus
    }
  };

  const controlInstance = async (action) => {
    if (action !== 'start' && action !== 'stop') {
      console.error('Invalid action. Use "start" or "stop"');
      return;
    }

    setInstanceState(prev => ({
      ...prev,
      actionLoading: true,
      error: null
    }));

    try {
      const response = await fetch(EC2_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      pollInstanceStatus(action === 'start' ? 'running' : 'stopped');
      
    } catch (error) {
      console.error(`Error ${action}ing instance:`, error);
      setInstanceState(prev => ({
        ...prev,
        actionLoading: false,
        error: error.message
      }));
    }
  };

  const pollInstanceStatus = async (targetState, maxAttempts = 30) => {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const data = await fetchInstanceStatus();
        
        if (data.state === targetState) {
          setInstanceState(prev => ({
            ...prev,
            actionLoading: false
          }));
          return;
        }
        
        attempts++;
        
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setInstanceState(prev => ({
            ...prev,
            actionLoading: false
          }));
        }
      } catch (error) {
        setInstanceState(prev => ({
          ...prev,
          actionLoading: false,
          error: error.message
        }));
      }
    };
    
    poll();
  };

  const getInstanceStatusInfo = (state) => {
    switch (state) {
      case 'running':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Running',
          description: 'Instance is ready for uploads'
        };
      case 'stopped':
        return {
          color: 'error',
          icon: <StopIcon />,
          label: 'Stopped',
          description: 'Instance is stopped - uploads unavailable'
        };
      case 'pending':
        return {
          color: 'warning',
          icon: <HourglassEmptyIcon />,
          label: 'Starting',
          description: 'Instance is starting up...'
        };
      case 'stopping':
        return {
          color: 'warning',
          icon: <HourglassEmptyIcon />,
          label: 'Stopping',
          description: 'Instance is shutting down...'
        };
      default:
        return {
          color: 'default',
          icon: <CloudIcon />,
          label: 'Unknown',
          description: 'Unable to determine instance status'
        };
    }
  };

  const getVideoStatusInfo = (videoStatus, errorMessage = null, failedAt = null) => {
    switch (videoStatus) {
      case 'processing':
        return {
          status: 'processing',
          color: 'warning',
          icon: <HourglassEmptyIcon />,
          label: 'Processing',
          description: 'Video is being converted...'
        };
      case 'completed':
        return {
          status: 'completed',
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Completed',
          description: 'Video conversion successful'
        };
      case 'error':
        return {
          status: 'error',
          color: 'error',
          icon: <ErrorIcon />,
          label: 'Failed',
          description: errorMessage || 'Video conversion failed',
          failedAt: failedAt
        };
      default:
        return {
          status: 'legacy',
          color: 'default',
          icon: <ScienceIcon />,
          label: 'Legacy',
          description: 'Legacy video (no conversion tracking)'
        };
    }
  };

  // Initialize data fetching
  useEffect(() => {
    fetchInstanceStatus();
    fetchEmails();
  }, [fetchEmails]);

  // Periodic refresh for instance status
  useEffect(() => {
    const interval = setInterval(() => {
      if (instanceState.state !== 'unknown' && !instanceState.loading && !instanceState.isRetrying && !instanceState.actionLoading) {
        fetchInstanceStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [instanceState.loading, instanceState.isRetrying, instanceState.actionLoading, instanceState.state]);

  // Fetch video statuses
  useEffect(() => {
    const fetchVideoStatuses = async () => {
      if (!tuts || tuts.length === 0) return;
      
      setStatusLoading(true);
      try {
        const enrichedTutorials = await Promise.all(
          tuts.map(async (tut) => {
            if (tut.handler) {
              try {
                const videoDocRef = doc(fireDB, "videos", tut.handler);
                const videoDoc = await getDoc(videoDocRef);
                
                if (videoDoc.exists()) {
                  const videoData = videoDoc.data();
                  return {
                    ...tut,
                    videoStatus: videoData.status || 'processing',
                    errorMessage: videoData.error || null,
                    failedAt: videoData.failedAt || null,
                    isLegacyVideo: false,
                    statusInfo: getVideoStatusInfo(
                      videoData.status || 'processing',
                      videoData.error,
                      videoData.failedAt
                    )
                  };
                } else {
                  return {
                    ...tut,
                    videoStatus: null,
                    isLegacyVideo: true,
                    statusInfo: getVideoStatusInfo(null)
                  };
                }
              } catch (error) {
                console.error(`Error fetching video status for ${tut.handler}:`, error);
                return {
                  ...tut,
                  videoStatus: null,
                  isLegacyVideo: true,
                  statusInfo: getVideoStatusInfo(null)
                };
              }
            }
            
            return {
              ...tut,
              videoStatus: null,
              isLegacyVideo: true,
              statusInfo: getVideoStatusInfo(null)
            };
          })
        );
        
        setEnrichedTuts(enrichedTutorials);
      } catch (error) {
        console.error('Error enriching tutorials with video status:', error);
        setEnrichedTuts(tuts.map(tut => ({ 
          ...tut, 
          videoStatus: null, 
          isLegacyVideo: true,
          statusInfo: getVideoStatusInfo(null)
        })));
      } finally {
        setStatusLoading(false);
      }
    };

    fetchVideoStatuses();
  }, [tuts]);

  // Other functions (unchanged)
  const deleteIndividualTutorial = async (tut) => {
    try {
      await deleteTutorial(params.fname, tut.title, null, tut.thumbnail);
      console.log(`Tutorial ${tut.title} deleted`);
    } catch (err) {
      console.error("Error deleting tutorial:", err);
    }
  };

  const handleEditTutorial = (tut) => {
    navigator(`edit/${tut.title}`, {
      state: {
        tutorial: tut,
        folderName: params.fname
      }
    });
  };

  const handleDeleteFolder = async () => {
    try {
      enrichedTuts.forEach((tut) => {
        deleteTutorial(params.fname, tut.title, tut.video, tut.thumbnail);
      });

      emails.forEach(async (email) => {
        try {
          await deleteDoc(doc(emailListref, email.id));
        } catch (err) {
          console.log(err);
        }
      });

      await deleteDoc(doc(fireDB, "folders", params.fname));

      console.log(`Folder ${params.fname} deleted`);
      navigator("/admin");
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  // Loading screens
  if (loading) {
    return <Loading text="Loading Tutorials" />;
  }
  if (emailsLoading) {
    return <Loading text="Loading All Authorized Emails (This may take a moment for large lists)" />;
  }
  if (statusLoading) {
    return <Loading text="Loading Video Status" />;
  }
  if (instanceState.loading && instanceState.retryAttempt === 0) {
    return <Loading text="Connecting to AWS Server" />;
  }
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

  const statusInfo = getInstanceStatusInfo(instanceState.state);

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
        {/* Header with DNA animation */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'customColors.cytoplasm',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <ScienceIcon
            sx={{
              fontSize: 32,
              color: 'primary.main'
            }}
            className="rotating-dna"
          />
          <T variant="h4">
            {params.fname} Tutorials
          </T>
        </Paper>

        {/* EC2 Instance Status Card */}
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 2,
            border: 2,
            borderColor: instanceState.error ? 'error.main' : 
                        statusInfo.color === 'success' ? 'success.main' : 
                        statusInfo.color === 'error' ? 'error.main' : 'warning.main',
            bgcolor: instanceState.error ? 'error.light' :
                     statusInfo.color === 'success' ? 'success.light' : 
                     statusInfo.color === 'error' ? 'error.light' : 'warning.light',
            '& .MuiCardContent-root': {
              '&:last-child': { pb: 2 }
            }
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CloudIcon sx={{ fontSize: 28, color: statusInfo.color + '.main' }} />
                <Bx>
                  <T variant="h6" sx={{ fontWeight: 'bold' }}>
                    Upload Server Status
                  </T>
                  <T variant="body2" color="text.secondary">
                    {statusInfo.description}
                  </T>
                </Bx>
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  icon={instanceState.loading || instanceState.isRetrying ? 
                    <CircularProgress size={16} /> : statusInfo.icon}
                  label={instanceState.loading ? 'Loading...' : 
                         instanceState.isRetrying ? 'Retrying...' : 
                         instanceState.retryAttempt > 0 && instanceState.error ? 
                         `Retry ${instanceState.retryAttempt}/${instanceState.maxRetries}` : statusInfo.label}
                  color={statusInfo.color}
                  sx={{ fontWeight: 'bold' }}
                />
                
                <IconButton 
                  size="small" 
                  onClick={retryFetchStatus}
                  disabled={instanceState.loading || instanceState.isRetrying}
                  sx={{ 
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                  title="Refresh status"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            {instanceState.public_ip && (
              <Bx sx={{ mb: 2 }}>
                <T variant="body2" color="text.secondary">
                  <strong>Public IP:</strong> {instanceState.public_ip}
                </T>
                {instanceState.public_dns && (
                  <T variant="body2" color="text.secondary">
                    <strong>DNS:</strong> {instanceState.public_dns}
                  </T>
                )}
              </Bx>
            )}

            {instanceState.retryAttempt > 0 && instanceState.loading && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={16} />
                  <T variant="body2">
                    Connecting to AWS server... (Attempt {instanceState.retryAttempt}/{instanceState.maxRetries})
                  </T>
                </Stack>
              </Alert>
            )}

            {instanceState.error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                action={
                  <B
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={instanceState.isRetrying ? 
                      <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
                    onClick={retryFetchStatus}
                    disabled={instanceState.isRetrying}
                    sx={{ ml: 1 }}
                  >
                    {instanceState.isRetrying ? 'Retrying...' : 'Retry'}
                  </B>
                }
              >
                <T variant="body2">
                  <strong>Connection Error:</strong> {instanceState.error}
                </T>
                {instanceState.retryAttempt > 0 && !instanceState.isRetrying && (
                  <T variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    Failed after {instanceState.retryAttempt} automatic retry attempts. 
                    Click retry to try again manually.
                  </T>
                )}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2} justifyContent="center">
              <B
                variant="contained"
                color="success"
                startIcon={instanceState.actionLoading && instanceState.state !== 'running' ? 
                  <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => controlInstance('start')}
                disabled={instanceState.actionLoading || instanceState.state === 'running' || instanceState.state === 'pending'}
                sx={{ minWidth: 120 }}
              >
                {instanceState.actionLoading && instanceState.state !== 'running' ? 'Starting...' : 'Start Server'}
              </B>
              
              <B
                variant="contained"
                color="error"
                startIcon={instanceState.actionLoading && instanceState.state !== 'stopped' ? 
                  <CircularProgress size={16} color="inherit" /> : <StopIcon />}
                onClick={() => controlInstance('stop')}
                disabled={instanceState.actionLoading || instanceState.state === 'stopped' || instanceState.state === 'stopping'}
                sx={{ minWidth: 120 }}
              >
                {instanceState.actionLoading && instanceState.state !== 'stopped' ? 'Stopping...' : 'Stop Server'}
              </B>
            </Stack>

            {instanceState.state !== 'running' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <T variant="body2">
                  <strong>Notice:</strong> Video uploads are disabled when the server is not running. 
                  Start the server to enable video uploads.
                </T>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Video Status Summary */}
        {enrichedTuts.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <T variant="h6" gutterBottom>Video Status Overview</T>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {['processing', 'completed', 'error', 'legacy'].map(status => {
                  const count = enrichedTuts.filter(tut => tut.statusInfo.status === status).length;
                  if (count === 0) return null;
                  
                  const statusInfo = getVideoStatusInfo(status === 'legacy' ? null : status);
                  return (
                    <Chip
                      key={status}
                      icon={statusInfo.icon}
                      label={`${statusInfo.label}: ${count}`}
                      color={statusInfo.color}
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Tutorials Grid */}
        <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <CardContent>
            <Grid container spacing={2} columns={12}>
              {enrichedTuts.length > 0 ? (
                enrichedTuts.map((tut, index) => (
                  <Grid item key={index} xs={12} sm={6} md={4}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <VCad tut={{ ...tut, fpath: params.fname }} />
                      
                      <Bx sx={{ p: 2, pt: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <Chip
                            icon={tut.statusInfo.icon}
                            label={tut.statusInfo.label}
                            color={tut.statusInfo.color}
                            size="small"
                          />
                        </Stack>
                        
                        {tut.statusInfo.status === 'error' && (
                          <Alert severity="error" sx={{ mb: 1 }}>
                            <T variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              Conversion Failed
                            </T>
                            {tut.errorMessage && (
                              <T variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                Error: {tut.errorMessage}
                              </T>
                            )}
                            {tut.failedAt && (
                              <T variant="body2" sx={{ fontSize: '0.75rem' }}>
                                Failed at: {new Date(tut.failedAt).toLocaleString()}
                              </T>
                            )}
                          </Alert>
                        )}
                        
                        {tut.statusInfo.status === 'processing' && (
                          <Alert severity="info" sx={{ mb: 1 }}>
                            <T variant="body2">
                              Video is currently being processed. This may take several minutes.
                            </T>
                          </Alert>
                        )}
                      </Bx>

                      <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2, pt: 0 }}>
                        <B
                          fullWidth
                          startIcon={<BiotechIcon />}
                          variant="contained"
                          color="primary"
                          onClick={() => handleEditTutorial(tut)}
                        >
                          Edit Tutorial
                        </B>
                        <B
                          fullWidth
                          startIcon={<DeleteIcon />}
                          variant="contained"
                          color="error"
                          onClick={() => deleteIndividualTutorial(tut)}
                        >
                          Delete Tutorial
                        </B>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Bx
                    sx={{
                      textAlign: "center",
                      py: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <ScienceIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
                    <T color="text.secondary">
                      No Tutorials Found in {params.fname}
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

        {/* ENHANCED: Edit Access Accordion with UI Effects */}
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
                Edit Access
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
          onClick={() => setOpenDeleteFolderConfirm(true)}
        >
          Delete {params.fname} Folder
        </B>
      </Bx>

      {/* Add Tutorial FAB - Conditionally shown */}
      {instanceState.state === 'running' && (
        <Fab
          color="secondary"
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
      )}

      {/* Disabled FAB when server is not running */}
      {instanceState.state !== 'running' && (
        <Fab
          disabled
          sx={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
            bgcolor: 'grey.300',
            '&:hover': {
              bgcolor: 'grey.400'
            }
          }}
          title="Start the server to enable video uploads"
        >
          <Add />
        </Fab>
      )}

      {/* Folder Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteFolderConfirm}
        onClose={() => setOpenDeleteFolderConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Folder</DialogTitle>
        <DialogContent>
          <T variant="body1">
            Are you sure you want to delete the folder "{params.fname}"?
            This will remove all tutorials and email access settings.
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