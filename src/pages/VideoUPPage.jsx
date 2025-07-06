import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { CheckCircle, Upload, Warning, CloudUpload, VideoFile, Speed, AccessTime, DataUsage } from "@mui/icons-material";
import Appbar from "../components/Appbar";
import Uploader from "../components/Uploader";
import { useState } from "react";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { collection, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserProvider";
import SFVL from "../components/SFVL";
import { uploadBytesResumable, ref } from "firebase/storage";

// Enhanced Upload Progress Page Component with Speed & Time Tracking
function UploadProgressPage({ 
  thumbnailProgress, 
  videoProgress, 
  uploadStatus, 
  currentStep,
  uploadSpeed,
  estimatedTime,
  uploadedSize,
  totalSize,
  onClose,
  folderName // Add folderName prop
}) {
  const combinedProgress = (thumbnailProgress + videoProgress) / 2;
  const hasError = uploadStatus.toLowerCase().includes('error') || uploadStatus.toLowerCase().includes('failed');
  
  const steps = ['Uploading Thumbnail', 'Uploading Video', 'Finalizing'];

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (seconds) => {
    if (seconds === 0 || isNaN(seconds)) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Container 
      sx={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        bgcolor: "#f5f5f5",
        p: 2
      }}
    >
      {/* Warning Banner */}
      <Alert 
        severity="warning" 
        icon={<Warning />}
        sx={{ 
          mb: 3, 
          width: "100%", 
          maxWidth: 700,
          fontSize: "16px",
          fontWeight: "bold"
        }}
      >
        ⚠️ DO NOT close this tab until upload is complete! Your upload will be lost.
      </Alert>

      {/* Main Progress Card */}
      <Paper 
        elevation={8} 
        sx={{ 
          p: 4, 
          borderRadius: 3, 
          width: "100%", 
          maxWidth: 700,
          textAlign: "center"
        }}
      >
        <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
          Uploading Your Video Tutorial
        </Typography>

        {/* Step Indicator */}
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel 
                error={hasError && index === currentStep}
                completed={index < currentStep}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Typography 
          variant="body1" 
          color={hasError ? "error" : "text.secondary"} 
          sx={{ mb: 4, fontWeight: hasError ? "bold" : "normal", minHeight: "24px" }}
        >
          {uploadStatus}
        </Typography>

        {/* Speed & Time Tracking Stats */}
        {(uploadSpeed > 0 || estimatedTime > 0 || totalSize > 0) && (
          <Box sx={{ display: "flex", gap: 2, mb: 4, justifyContent: "center", flexWrap: "wrap" }}>
            {/* Upload Speed */}
            {uploadSpeed > 0 && (
              <Paper elevation={2} sx={{ p: 2, minWidth: 140 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                  <Speed sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body2" fontWeight="bold">Speed</Typography>
                </Box>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {uploadSpeed.toFixed(2)} MB/s
                </Typography>
              </Paper>
            )}

            {/* Estimated Time */}
            {estimatedTime > 0 && (
              <Paper elevation={2} sx={{ p: 2, minWidth: 140 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                  <AccessTime sx={{ mr: 1, color: "warning.main" }} />
                  <Typography variant="body2" fontWeight="bold">Time Left</Typography>
                </Box>
                <Typography variant="h6" color="warning.main" fontWeight="bold">
                  {formatTime(estimatedTime)}
                </Typography>
              </Paper>
            )}

            {/* Data Usage */}
            {totalSize > 0 && (
              <Paper elevation={2} sx={{ p: 2, minWidth: 140 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                  <DataUsage sx={{ mr: 1, color: "info.main" }} />
                  <Typography variant="body2" fontWeight="bold">Data</Typography>
                </Box>
                <Typography variant="h6" color="info.main" fontWeight="bold">
                  {formatFileSize(uploadedSize)} / {formatFileSize(totalSize)}
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Overall Progress */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
            Overall Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={combinedProgress} 
            sx={{ 
              height: 16, 
              borderRadius: 8,
              bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 8,
                bgcolor: hasError ? "#f44336" : combinedProgress === 100 ? "#4caf50" : "#2196f3"
              }
            }} 
          />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold", color: "primary.main" }}>
            {Math.round(combinedProgress)}%
          </Typography>
        </Box>

        {/* Individual Progress Cards */}
        <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
          {/* Thumbnail Progress Card */}
          <Paper 
            elevation={4} 
            sx={{ 
              flex: 1, 
              p: 3, 
              bgcolor: thumbnailProgress === 100 ? "#e8f5e8" : "#fff",
              border: currentStep === 0 ? "2px solid #2196f3" : "1px solid #e0e0e0"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "center" }}>
              <CloudUpload sx={{ mr: 1, fontSize: 24, color: thumbnailProgress === 100 ? "success.main" : "primary.main" }} />
              <Typography variant="h6" fontWeight="bold">
                Thumbnail
              </Typography>
              {thumbnailProgress === 100 && (
                <CheckCircle sx={{ ml: 1, color: "success.main", fontSize: 24 }} />
              )}
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={thumbnailProgress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: "#e0e0e0",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  bgcolor: thumbnailProgress === 100 ? "#4caf50" : "#ff9800"
                }
              }} 
            />
            
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`${Math.round(thumbnailProgress)}%`}
                size="medium"
                color={thumbnailProgress === 100 ? "success" : currentStep === 0 ? "primary" : "default"}
                sx={{ fontWeight: "bold", fontSize: "14px" }}
              />
            </Box>
          </Paper>

          {/* Video Progress Card */}
          <Paper 
            elevation={4} 
            sx={{ 
              flex: 1, 
              p: 3, 
              bgcolor: videoProgress === 100 ? "#e8f5e8" : "#fff",
              border: currentStep === 1 ? "2px solid #2196f3" : "1px solid #e0e0e0"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "center" }}>
              <VideoFile sx={{ mr: 1, fontSize: 24, color: videoProgress === 100 ? "success.main" : "primary.main" }} />
              <Typography variant="h6" fontWeight="bold">
                Video
              </Typography>
              {videoProgress === 100 && (
                <CheckCircle sx={{ ml: 1, color: "success.main", fontSize: 24 }} />
              )}
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={videoProgress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                bgcolor: "#e0e0e0",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  bgcolor: videoProgress === 100 ? "#4caf50" : "#9c27b0"
                }
              }} 
            />
            
            <Box sx={{ mt: 2 }}>
              <Chip 
                label={`${Math.round(videoProgress)}%`}
                size="medium"
                color={videoProgress === 100 ? "success" : currentStep === 1 ? "primary" : "default"}
                sx={{ fontWeight: "bold", fontSize: "14px" }}
              />
            </Box>
          </Paper>
        </Box>

        {/* Error Actions */}
        {hasError && (
          <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={onClose}
              size="large"
            >
              Go Back & Try Again
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                console.log("=== UPLOAD DEBUG INFO ===");
                console.log("Check the browser console for detailed error messages");
                console.log("Common issues:");
                console.log("1. Network connectivity problems");
                console.log("2. File size too large");
                console.log("3. Server temporarily unavailable");
                console.log("4. Invalid file format");
              }}
              size="large"
            >
              Debug Info
            </Button>
          </Box>
        )}

        {/* Completion Message */}
        {combinedProgress === 100 && !hasError && (
          <Alert 
            severity="success" 
            sx={{ mt: 3 }}
            icon={<CheckCircle />}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Upload completed successfully!
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={() => {
                  // Navigate to admin file view page
                  window.location.href = `/admin/video/${folderName}`;
                }}
                sx={{ 
                  fontWeight: "bold",
                  fontSize: "16px",
                  px: 3,
                  py: 1
                }}
              >
                Click here to check the video status
              </Button>
            </Box>
          </Alert>
        )}
      </Paper>
    </Container>
  );
}

export default function VideoUPPage() {
  const params = useParams();
  const navigator = useNavigate();
  const { isAdmin } = useUser();
  const [upload, setUpload] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // NEW: Speed and time tracking state
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [uploadedSize, setUploadedSize] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  // NEW: Handler validation state
  const [handlerValidation, setHandlerValidation] = useState({
    isChecking: false,
    isAvailable: null,
    message: ""
  });

  const [values, setValues] = useState({
    title: "",
    thumbnail: null,
    video: null,
    description: "",
    handler: "",
    lesson: "",
    date: "",
  });

  const lessonlist = [
    "ජීව විද්‍යාව හැඳින්වීම",
    "ජීවයේ රසායනික හා සෛලීය පදනම",
    "ජීවීන්ගේ පරිණාමය හා විවිධත්වය",
    "ශාක ආකාරය සහ ක්‍රියාකාරිත්වය",
    "සත්ත්ව ආකාරය සහ ක්‍රියාකාරීත්වය 01",
    "සත්ත්ව ආකාරය සහ ක්‍රියාකාරීත්වය 02",
    "ප්‍රවේණිය",
    "අණුක ජීව විද්‍යාව",
    "පාරිසරික ජීව විද්‍යාව",
    "ක්ෂුද්‍ර ජීව විද්‍යාව",
    "ව්‍යවහාරික ජීව විද්‍යාව",
    "Paper Discussion",
  ];

  const handleInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    
    // Validate handler uniqueness when handler field changes
    if (e.target.name === "handler") {
      validateHandler(e.target.value);
    }
  };

  // Function to check if handler already exists in videos collection
  const validateHandler = async (handlerValue) => {
    if (!handlerValue.trim()) {
      setHandlerValidation({
        isChecking: false,
        isAvailable: null,
        message: ""
      });
      return;
    }

    setHandlerValidation({
      isChecking: true,
      isAvailable: null,
      message: "Checking availability..."
    });

    try {
      const handlerDocRef = doc(fireDB, "videos", handlerValue.trim());
      const handlerDoc = await getDoc(handlerDocRef);
      
      if (handlerDoc.exists()) {
        setHandlerValidation({
          isChecking: false,
          isAvailable: false,
          message: "Handler already exists! Please choose a different one."
        });
      } else {
        setHandlerValidation({
          isChecking: false,
          isAvailable: true,
          message: "Handler is available!"
        });
      }
    } catch (error) {
      console.error("Error checking handler:", error);
      setHandlerValidation({
        isChecking: false,
        isAvailable: null,
        message: "Error checking handler. Please try again."
      });
    }
  };

  // Sequential thumbnail upload with progress tracking
  const uploadThumbnailToFirebase = async (thumbnailFile) => {
    console.log("🖼️ Starting thumbnail upload...");
    setCurrentStep(0);
    setUploadStatus("Uploading thumbnail image...");
    
    return new Promise((resolve, reject) => {
      const storageRef = ref(
        fireStorage,
        `thumbnails/${params.fname}/${values.title}/${thumbnailFile.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, thumbnailFile, {
        contentType: thumbnailFile.type,
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setThumbnailProgress(progress);
          setUploadStatus(`Uploading thumbnail: ${Math.round(progress)}%`);
          console.log(`Thumbnail progress: ${Math.round(progress)}%`);
        },
        (error) => {
          console.error("❌ Thumbnail upload error:", error);
          setUploadStatus(`Thumbnail upload failed: ${error.message}`);
          reject(error);
        },
        () => {
          console.log("✅ Thumbnail upload completed!");
          setThumbnailProgress(100);
          setUploadStatus("Thumbnail uploaded successfully!");
          resolve(true);
        }
      );
    });
  };

  // Enhanced video upload with chunked upload support and speed tracking
  const uploadVideoToEC2 = async (videoFile) => {
    if (!videoFile) return null;
    
    console.log("🎥 Starting chunked video upload...");
    setCurrentStep(1);
    setUploadStatus("Analyzing file for chunked upload...");
    
    const fileSizeMB = videoFile.size / (1024 * 1024);
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE);
    
    // Set total size for tracking
    setTotalSize(videoFile.size);
    
    console.log("Video file details:", {
      fileName: videoFile.name,
      fileSize: `${fileSizeMB.toFixed(2)} MB`,
      fileType: videoFile.type,
      handler: values.handler,
      chunkSize: `${CHUNK_SIZE / (1024 * 1024)}MB`,
      totalChunks: totalChunks
    });
    
    setUploadStatus(`Preparing ${totalChunks} chunks (${(CHUNK_SIZE / (1024 * 1024))}MB each)...`);
    
    // Suppress browser extension errors for large file uploads
    const originalOnError = window.onerror;
    const originalOnUnhandledRejection = window.onunhandledrejection;
    
    window.onerror = (message, source, lineno, colno, error) => {
      if (message && typeof message === 'string' && 
          (message.includes('message channel closed') || 
           message.includes('listener indicated') ||
           message.includes('Extension context invalidated'))) {
        console.log("🔇 Suppressed browser extension error during upload:", message);
        return true;
      }
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
    
    window.onunhandledrejection = (event) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('message channel closed') ||
           event.reason.message.includes('listener indicated') ||
           event.reason.message.includes('Extension context invalidated'))) {
        console.log("🔇 Suppressed browser extension promise rejection during upload:", event.reason.message);
        event.preventDefault();
        return;
      }
      return originalOnUnhandledRejection ? originalOnUnhandledRejection(event) : undefined;
    };
    
    try {
      const ec2BaseUrl = "https://upload.sddopamine.com/api";
      let uploadedChunks = 0;
      const startTime = Date.now();
      
      // Upload chunks sequentially for better reliability
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, videoFile.size);
        const chunk = videoFile.slice(start, end);
        
        const chunkSizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
        console.log(`📦 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunkSizeMB}MB)`);
        
        setUploadStatus(`Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunkSizeMB}MB)...`);
        
        // Upload this chunk with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount <= maxRetries) {
          try {
            const formData = new FormData();
            formData.append("chunk", chunk);
            formData.append("videoId", values.handler);
            formData.append("chunkIndex", chunkIndex.toString());
            formData.append("totalChunks", totalChunks.toString());
            formData.append("originalFilename", videoFile.name);
            
            const response = await fetch(`${ec2BaseUrl}/upload-chunk`, {
              method: "POST",
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Chunk upload failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ Chunk ${chunkIndex + 1} uploaded:`, result);
            
            uploadedChunks++;
            const overallProgress = (uploadedChunks / totalChunks) * 100;
            setVideoProgress(overallProgress);
            
            // Calculate upload speed and statistics
            const elapsedTime = (Date.now() - startTime) / 1000;
            const uploadedBytes = uploadedChunks * CHUNK_SIZE;
            const currentUploadedSize = Math.min(uploadedBytes, videoFile.size);
            const speedMBps = (uploadedBytes / (1024 * 1024)) / elapsedTime;
            const remainingChunks = totalChunks - uploadedChunks;
            const estimatedTimeRemaining = remainingChunks > 0 ? remainingChunks / (uploadedChunks / elapsedTime) : 0;
            
            // Update speed tracking state
            setUploadSpeed(speedMBps);
            setEstimatedTime(estimatedTimeRemaining);
            setUploadedSize(currentUploadedSize);
            
            setUploadStatus(
              `Uploaded ${uploadedChunks}/${totalChunks} chunks (${overallProgress.toFixed(1)}%) @ ${speedMBps.toFixed(2)}MB/s`
            );
            
            break; // Success, exit retry loop
            
          } catch (error) {
            retryCount++;
            console.warn(`⚠️ Chunk ${chunkIndex + 1} upload attempt ${retryCount} failed:`, error.message);
            
            if (retryCount <= maxRetries) {
              const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
              setUploadStatus(`Retrying chunk ${chunkIndex + 1} in ${retryDelay/1000}s (attempt ${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
              throw new Error(`Failed to upload chunk ${chunkIndex + 1} after ${maxRetries} retries: ${error.message}`);
            }
          }
        }
      }
      
      console.log("📦 All chunks uploaded successfully. Finalizing...");
      setUploadStatus("All chunks uploaded! Assembling file on server...");
      setVideoProgress(100);
      
      // Reset speed tracking for finalization
      setUploadSpeed(0);
      setEstimatedTime(0);
      
      // Finalize the upload (assemble chunks and start conversion)
      const finalizeResponse = await fetch(`${ec2BaseUrl}/finalize-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: values.handler
        }),
      });
      
      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json().catch(() => ({}));
        throw new Error(`Finalization failed: ${errorData.error || finalizeResponse.statusText}`);
      }
      
      const finalResult = await finalizeResponse.json();
      console.log("✅ Upload finalized:", finalResult);
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      setUploadStatus(`🎉 Upload completed in ${totalTime}s! Server is processing video...`);
      
      return finalResult;
      
    } catch (error) {
      console.error("❌ Chunked upload error:", error);
      setUploadStatus(`Chunked upload failed: ${error.message}`);
      throw error;
    } finally {
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
      console.log("🔊 Restored original error handlers");
    }
  };

  const handleUploaddata = async () => {
    if (!values.thumbnail || !values.title || !values.video) {
      alert("Please fill in all required fields and upload both thumbnail and video");
      return;
    }

    // Check if handler is available before proceeding
    if (!handlerValidation.isAvailable) {
      alert("Please enter a unique handler before uploading");
      return;
    }

    console.log("🚀 Starting sequential upload process...");
    console.log("Upload details:", {
      title: values.title,
      thumbnailSize: `${(values.thumbnail?.size / 1024).toFixed(1)} KB`,
      videoSize: `${(values.video?.size / (1024 * 1024)).toFixed(2)} MB`,
      videoType: values.video?.type,
      handler: values.handler
    });

    const tutorialref = collection(fireDB, "folders", params.fname, "tutorials");
    const docRef = doc(tutorialref, values.title);
    
    try {
      // Show upload progress page
      setShowUploadProgress(true);
      setUploadStatus("Initializing upload...");
      setThumbnailProgress(0);
      setVideoProgress(0);
      setCurrentStep(0);
      
      // Reset speed tracking
      setUploadSpeed(0);
      setEstimatedTime(0);
      setUploadedSize(0);
      setTotalSize(0);

      // Create the initial document
      console.log("📄 Creating initial document in Firestore...");
      await setDoc(docRef, {
        title: values.title,
        thumbnail: values.thumbnail.name,
        video: "pending",
        description: values.description,
        handler: values.handler,
        lesson: values.lesson,
        date: values.date,
        converted: false,
        conversionStatus: "pending",
        uploadDate: new Date().toISOString(),
      });
      
      console.log("✅ Document created, starting sequential uploads...");
      
      // STEP 1: Upload thumbnail first
      await uploadThumbnailToFirebase(values.thumbnail);
      
      // STEP 2: Upload video second
      const conversionResult = await uploadVideoToEC2(values.video);
      
      // STEP 3: Finalize
      setCurrentStep(2);
      setUploadStatus("Finalizing upload...");
      console.log("🔄 Finalizing upload with result:", conversionResult);
      
      if (conversionResult && conversionResult.videoId) {
        await updateDoc(docRef, {
          video: "converted",
          converted: true,
          conversionStatus: "completed",
          folderid: conversionResult.videoId,
          conversionCompleteDate: new Date().toISOString(),
        });
        
        setUploadStatus("Upload completed successfully!");
        console.log("✅ Upload process completed successfully!");
      } else {
        await updateDoc(docRef, {
          conversionStatus: "error",
          conversionError: "Invalid response from conversion server",
        });
        
        setUploadStatus("⚠️ Upload completed with warnings!");
      }
      
    } catch (err) {
      console.error("❌ Upload process error:", err);
      
      try {
        await updateDoc(docRef, {
          conversionStatus: "error",
          conversionError: err.message || "Unknown error",
        });
      } catch (updateErr) {
        console.error("❌ Failed to update error status:", updateErr);
      }
      
      setUploadStatus(`Error: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <NavLink
        to="/admin"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      >
        <Typography color={"error.main"}>
          You are not authorized to view this page. Click here to go back
        </Typography>
      </NavLink>
    );
  }

  if (params.fname === undefined || params.fname === null) {
    return <Loading text="Please wait" />;
  }

  // Show dedicated upload progress page with speed & time tracking
  if (showUploadProgress) {
    return (
      <UploadProgressPage
        thumbnailProgress={thumbnailProgress}
        videoProgress={videoProgress}
        uploadStatus={uploadStatus}
        currentStep={currentStep}
        uploadSpeed={uploadSpeed}
        estimatedTime={estimatedTime}
        uploadedSize={uploadedSize}
        totalSize={totalSize}
        onClose={() => setShowUploadProgress(false)}
        folderName={params.fname}
      />
    );
  }

  return (
    <Container
      disableGutters
      sx={{
        bgcolor: "#f4f4f4",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Appbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          px: 2,
          pb: 4,
        }}
        component={"form"}
        autoFocus
        onSubmit={(e) => {
          e.preventDefault();
          console.log("📝 Form Submitted");
          setUpload(true);
          handleUploaddata();
        }}
      >
        <TextField
          label="Title"
          placeholder="Title"
          variant="filled"
          required
          name="title"
          onChange={handleInputs}
          value={values.title}
        />

        <Uploader
          text="Upload the thumbnail"
          type="thumbnails"
          savetitle={`${params.fname}/${values.title || 'untitled'}`}
          startupload={upload}
          onChange={(file) => {
            setValues({ ...values, thumbnail: file });
          }}
          inerror={values.thumbnail === null}
          name="thumbnail-upload"
        />
        
        <Uploader
          text="Upload the video (MP4)"
          type="videos"
          savetitle={`${params.fname}/${values.title || 'untitled'}`}
          startupload={false}
          onChange={(file) => {
            setValues({ ...values, video: file });
          }}
          inerror={values.video === null}
          name="video-upload"
          acceptType="video/mp4"
        />

        <TextField
          label="Handler"
          placeholder="Handler"
          variant="filled"
          required
          name="handler"
          onChange={handleInputs}
          value={values.handler}
          error={handlerValidation.isAvailable === false}
          helperText={
            handlerValidation.isChecking ? (
              <Typography variant="caption" color="info.main">
                🔍 {handlerValidation.message}
              </Typography>
            ) : handlerValidation.isAvailable === true ? (
              <Typography variant="caption" color="success.main">
                ✅ {handlerValidation.message}
              </Typography>
            ) : handlerValidation.isAvailable === false ? (
              <Typography variant="caption" color="error.main">
                ❌ {handlerValidation.message}
              </Typography>
            ) : null
          }
        />
        <TextField
          label="Description"
          placeholder="Description"
          variant="filled"
          required
          name="description"
          onChange={handleInputs}
          value={values.description}
        />
        <Select
          displayEmpty
          id="select"
          required
          name="lesson"
          onChange={handleInputs}
          value={values.lesson}
          renderValue={(selected) => {
            if (!selected) {
              return <Typography color="text.secondary">Select a lesson</Typography>;
            }
            return selected;
          }}
        >
          {lessonlist.map((lesson, index) => (
            <MenuItem key={index} value={lesson}>
              {lesson}
            </MenuItem>
          ))}
        </Select>

        <Box
          component={"input"}
          sx={{
            px: 4,
            py: 2,
            borderRadius: "4px",
            border: "2px solid #bbb",
            fontSize: "16px",
            color: "#777",
          }}
          type="date"
          required
          name="date"
          onChange={handleInputs}
          value={values.date}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={
            !values.thumbnail || 
            !values.video || 
            !values.title || 
            showUploadProgress || 
            handlerValidation.isChecking || 
            handlerValidation.isAvailable !== true
          }
          sx={{ py: 1.5, fontSize: "16px", fontWeight: "bold" }}
        >
          {showUploadProgress ? "Uploading..." : "🚀 Start Upload"}
        </Button>
        <SFVL foldername={params.fname} />
      </Box>
    </Container>
  );
}