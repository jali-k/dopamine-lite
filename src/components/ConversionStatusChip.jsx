import {
    Chip,
    CircularProgress,
    Box,
    Tooltip,
    LinearProgress
  } from "@mui/material";
  import {
    CheckCircle,
    Error,
    Upload,
    VideoFile,
    Schedule,
    Build
  } from "@mui/icons-material";
  import { useState, useEffect } from "react";
  import { doc, onSnapshot } from "firebase/firestore";
  import { fireDB } from "../../firebaseconfig";
  
  export default function ConversionStatusChip({ tutorial, folderName }) {
    const [status, setStatus] = useState(tutorial.conversionStatus || 'unknown');
    const [isConverted, setIsConverted] = useState(tutorial.converted || false);
    const [lastUpdated, setLastUpdated] = useState(null);
  
    // Real-time listener for status updates
    useEffect(() => {
      const tutorialRef = doc(fireDB, "folders", folderName, "tutorials", tutorial.title);
      
      const unsubscribe = onSnapshot(tutorialRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStatus(data.conversionStatus || 'unknown');
          setIsConverted(data.converted || false);
          setLastUpdated(new Date().toLocaleTimeString());
          
          console.log(`Status updated for ${tutorial.title}:`, data.conversionStatus);
        }
      });
  
      // Cleanup listener on unmount
      return () => unsubscribe();
    }, [tutorial.title, folderName]);
  
    const getStatusConfig = () => {
      switch (status) {
        case 'uploading':
          return {
            label: 'Uploading',
            color: 'info',
            icon: <Upload sx={{ fontSize: 16 }} />,
            tooltip: 'Video is being uploaded to conversion server'
          };
        case 'pending':
          return {
            label: 'Pending',
            color: 'warning',
            icon: <Schedule sx={{ fontSize: 16 }} />,
            tooltip: 'Waiting in conversion queue'
          };
        case 'converting':
          return {
            label: 'Converting',
            color: 'secondary',
            icon: <CircularProgress size={16} thickness={6} />,
            tooltip: 'Video is being converted to multiple qualities'
          };
        case 'uploading_to_s3':
          return {
            label: 'Uploading to S3',
            color: 'info',
            icon: <Build sx={{ fontSize: 16 }} />,
            tooltip: 'Converted files are being uploaded to storage'
          };
        case 'completed':
          return {
            label: isConverted ? 'Multi-Quality' : 'Ready',
            color: 'success',
            icon: <CheckCircle sx={{ fontSize: 16 }} />,
            tooltip: isConverted ? 'Available in 144p, 360p, and 720p' : 'Video is ready to play'
          };
        case 'error':
          return {
            label: 'Error',
            color: 'error',
            icon: <Error sx={{ fontSize: 16 }} />,
            tooltip: `Conversion failed: ${tutorial.conversionError || 'Unknown error'}`
          };
        default:
          return {
            label: 'Unknown',
            color: 'default',
            icon: <VideoFile sx={{ fontSize: 16 }} />,
            tooltip: 'Status unknown'
          };
      }
    };
  
    const config = getStatusConfig();
  
    // Show progress bar for active states
    const showProgress = ['uploading', 'converting', 'uploading_to_s3'].includes(status);
  
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={config.tooltip} arrow>
          <Chip
            label={config.label}
            color={config.color}
            icon={config.icon}
            size="small"
            variant={status === 'completed' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: status === 'completed' ? 'bold' : 'normal',
              minWidth: 100,
              '& .MuiChip-icon': {
                color: 'inherit'
              }
            }}
          />
        </Tooltip>
        
        {showProgress && (
          <LinearProgress
            sx={{
              width: 100,
              height: 3,
              borderRadius: 1.5,
              mt: 0.5
            }}
            color={config.color}
          />
        )}
        
        {lastUpdated && status !== 'completed' && (
          <Box
            component="span"
            sx={{
              fontSize: '0.7rem',
              color: 'text.secondary',
              mt: 0.25
            }}
          >
            {lastUpdated}
          </Box>
        )}
      </Box>
    );
  }