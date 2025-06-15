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
import { collection, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useState, useEffect } from "react";
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

export default function AdmFileView() {
  const params = useParams();
  const tutorialref = collection(fireDB, "folders", params.fname, "tutorials");
  const emailListref = collection(
    fireDB,
    "folders",
    params.fname,
    "emailslist"
  );

  const [editableemails, setEditableEmails] = useState("");
  const [openDeleteFolderConfirm, setOpenDeleteFolderConfirm] = useState(false);
  const [enrichedTuts, setEnrichedTuts] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // NEW: EC2 Instance State Management
  const [instanceState, setInstanceState] = useState({
    state: 'unknown', // 'running', 'stopped', 'pending', 'stopping', 'unknown'
    public_ip: null,
    public_dns: null,
    loading: true,
    actionLoading: false, // When start/stop button is clicked
    error: null,
    retryAttempt: 0, // Track current retry attempt
    maxRetries: 3, // Maximum retry attempts
    isRetrying: false // When manual retry is in progress
  });

  const { isAdmin } = useUser();

  const [tuts, loading] = useCollectionData(tutorialref);
  const [emails, emailLoading, error, snapshot] =
    useCollectionData(emailListref);

  const navigator = useNavigate();

  // API endpoint for EC2 control
  const EC2_API_ENDPOINT = "https://blkr53ji2k.execute-api.us-east-1.amazonaws.com/default/uploader_ec2_controller";

  // NEW: Function to fetch EC2 instance status with retry logic
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
      
      // If this is an initial load and we haven't exceeded max retries, try again
      if (!isRetry && retryAttempt < instanceState.maxRetries) {
        console.log(`Retry attempt ${retryAttempt + 1} of ${instanceState.maxRetries}`);
        setTimeout(() => {
          fetchInstanceStatus(false, retryAttempt + 1);
        }, 2000 * (retryAttempt + 1)); // Exponential backoff: 2s, 4s, 6s
        
        setInstanceState(prev => ({
          ...prev,
          retryAttempt: retryAttempt + 1,
          error: `Connection failed. Retrying... (${retryAttempt + 1}/${prev.maxRetries})`
        }));
      } else {
        // Max retries exceeded or manual retry failed
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

  // NEW: Manual retry function
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

  // NEW: Function to control EC2 instance (start/stop)
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

      // Start polling to check status changes
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

  // NEW: Polling function to wait for instance state change
  const pollInstanceStatus = async (targetState, maxAttempts = 30) => {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const data = await fetchInstanceStatus();
        
        // If we reached the target state, stop polling
        if (data.state === targetState) {
          setInstanceState(prev => ({
            ...prev,
            actionLoading: false
          }));
          return;
        }
        
        attempts++;
        
        // If we haven't reached max attempts, continue polling
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000); // Poll every 3 seconds
        } else {
          // Max attempts reached, stop loading but don't error
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

  // NEW: Initial load of instance status with retry logic
  useEffect(() => {
    // Initial fetch with retry logic
    fetchInstanceStatus();
  }, []);

  // Separate effect for periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      // Simple periodic refresh - let the component state determine if it should actually fetch
      if (instanceState.state !== 'unknown' && !instanceState.loading && !instanceState.isRetrying && !instanceState.actionLoading) {
        fetchInstanceStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [instanceState.loading, instanceState.isRetrying, instanceState.actionLoading, instanceState.state]);

  // NEW: Function to get status color and info
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

  // Helper function to get video status info (existing code)
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

  // Fetch video statuses for each tutorial (existing code)
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

  // Existing functions (unchanged)
  const dbemails = [
    ...new Set(
      editableemails
        .replaceAll(",", "\n")
        .split("\n")
        .filter((email) => email !== "")
        .map((email) => email.trim().toLowerCase().replace(/\s+/g, ""))
    ),
  ];

  const addEmailsToDB = async () => {
    dbemails.forEach(async (email) => {
      try {
        if (!isValidEmail(email)) {
          console.log("Invalid Email");
          return;
        }
        await setDoc(doc(emailListref, email), {
          email: email,
        });
      } catch (err) {
        setEditableEmails("An error occured while adding emails");
        console.log(err);
      }
    });
    setEditableEmails("");
  };

  const deleteEmailsfromDB = async () => {
    if (dbemails.includes("DELETE_ALL")) {
      snapshot.forEach(async (doc) => {
        try {
          await deleteDoc(doc.ref);
        } catch (err) {
          console.log(err);
        }
      });
      console.log("All emails deleted");
      return;
    }
    snapshot.forEach(async (doc) => {
      if (dbemails.includes(doc.data().email)) {
        try {
          await deleteDoc(doc.ref);
        } catch (err) {
          setEditableEmails("An error occured while deleting emails");
          console.log(err);
        }
      }
    });

    setEditableEmails("");
  };

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

      snapshot.forEach(async (doc) => {
        try {
          await deleteDoc(doc.ref);
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
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
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

        {/* NEW: EC2 Instance Status Card */}
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
                
                {/* Refresh button */}
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

            {/* Instance Details */}
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

            {/* Automatic retry progress indicator */}
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

            {/* Error Display with Retry Button */}
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

            {/* Control Buttons */}
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

            {/* Warning for uploads */}
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

        {/* Video Status Summary (existing code) */}
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

        {/* Tutorials Grid (existing code) */}
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

        {/* Authorized Users Accordion (existing code) */}
        <AuthorizedUsersAccordion emails={emails} />

        {/* Edit Access Accordion (existing code) */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <T variant="h6">Edit Access</T>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Tf
              fullWidth
              multiline
              minRows={3}
              maxRows={5}
              variant="outlined"
              placeholder="Use comma or new line separated emails to give or revoke access to specific users. Type DELETE_ALL to remove all emails and give free access."
              value={editableemails}
              onChange={(e) => setEditableEmails(e.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <B
                variant="contained"
                color="success"
                onClick={addEmailsToDB}
              >
                Add
              </B>
              <B
                variant="contained"
                color="error"
                onClick={deleteEmailsfromDB}
              >
                Remove
              </B>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Delete Folder Button (existing code) */}
        <B
          fullWidth
          color="error"
          variant="contained"
          onClick={() => setOpenDeleteFolderConfirm(true)}
        >
          Delete {params.fname} Folder
        </B>
      </Bx>

      {/* MODIFIED: Add Tutorial FAB - Now conditionally shown */}
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

      {/* NEW: Disabled FAB with tooltip when server is not running */}
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

      {/* Folder Delete Confirmation Dialog (existing code) */}
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
    </Container>
  );
}