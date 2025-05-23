import {
  Box,
  Button,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Appbar from "../components/Appbar";
import Uploader from "../components/Uploader";
import { useState } from "react";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserProvider";
import SFVL from "../components/SFVL";
import { useUploadFile } from "react-firebase-hooks/storage";
import { ref } from "firebase/storage";

export default function VideoUPPage() {
  const params = useParams();
  const navigator = useNavigate();
  const { isAdmin } = useUser();
  const [upload, setUpload] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [conversionStatus, setConversionStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [values, setValues] = useState({
    title: "",
    thumbnail: null,
    video: null,
    description: "",
    handler: "",
    lesson: "",
    date: "",
  });
  const [uploadFile, uploading, snapshot] = useUploadFile();

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
  };

  // Function to upload video to EC2
  const uploadVideoToEC2 = async (videoFile) => {
    if (!videoFile) return null;
    
    setUploadingVideo(true);
    setConversionStatus("Uploading video to conversion server...");
    
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Setup progress tracking
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // Wait for the response using a Promise
      const response = await new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result);
              } catch (error) {
                reject(new Error("Invalid response from server"));
              }
            } else {
              reject(new Error(`Server returned ${xhr.status}: ${xhr.statusText}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error("Network error occurred"));
        };
        
        xhr.open("POST", "http://ec2-54-235-226-177.compute-1.amazonaws.com:3000/api/convert-to-hls", true);
        xhr.send(formData);
      });
      
      setConversionStatus("Video uploaded successfully! Conversion in progress...");
      return response;
    } catch (error) {
      console.error("Error uploading video:", error);
      setConversionStatus(`Error: ${error.message}`);
      throw error;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleUploaddata = async () => {
    if (!values.thumbnail || !values.title || !values.video) {
      alert("Please fill in all required fields and upload both thumbnail and video");
      return;
    }

    const tutorialref = collection(
      fireDB,
      "folders",
      params.fname,
      "tutorials"
    );
    
    const docRef = doc(tutorialref, values.title);
    
    alert("Don't close the tab until the upload is complete!");
    
    try {
      // First, upload the thumbnail to Firebase Storage
      await uploadFile(
        ref(
          fireStorage,
          `thumbnails/${params.fname}/${values.title}/${values.thumbnail.name}`
        ),
        values.thumbnail,
        {
          contentType: values.thumbnail.type,
        }
      );
      
      // Create the initial document with "pending" status
      await setDoc(docRef, {
        title: values.title,
        thumbnail: values.thumbnail.name,
        video: "pending", // Mark as pending
        description: values.description,
        handler: values.handler,
        lesson: values.lesson,
        date: values.date,
        converted: false, // Initially false
        conversionStatus: "pending", // Status field
        uploadDate: new Date().toISOString(), // Add upload timestamp
      });
      
      // Upload video to EC2 for conversion
      const conversionResult = await uploadVideoToEC2(values.video);
      
      if (conversionResult && conversionResult.videoId) {
        // Update the document with the conversion result
        await updateDoc(docRef, {
          video: "converted", // Mark as converted
          converted: true, // Set to true for EC2 conversion
          conversionStatus: "completed",
          folderid: conversionResult.videoId, // Store the ID from EC2 response
          conversionCompleteDate: new Date().toISOString(),
        });
        
        alert("Video upload and conversion completed successfully!");
      } else {
        // Update with error if no valid response
        await updateDoc(docRef, {
          conversionStatus: "error",
          conversionError: "Invalid response from conversion server",
        });
        
        alert("Video uploaded but conversion status is unknown.");
      }
      
    } catch (err) {
      console.log(err);
      
      // Try to update the document with the error if it exists
      try {
        await updateDoc(docRef, {
          conversionStatus: "error",
          conversionError: err.message || "Unknown error",
        });
      } catch (updateErr) {
        console.error("Failed to update error status:", updateErr);
      }
      
      alert("An error occurred during upload: " + err.message);
      return;
    }

    navigator("/admin");
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

  if (snapshot) {
    return (
      <Loading
        progressbar
        progress={(snapshot.bytesTransferred / snapshot.totalBytes) * 100}
        text="Uploading thumbnail to the server"
      />
    );
  }

  if (uploading) {
    return <Loading text="Uploading Thumbnail" />;
  }
  
  if (uploadingVideo) {
    return (
      <Loading
        progressbar
        progress={uploadProgress}
        text={conversionStatus || "Processing video..."}
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
          console.log("Form Submitted");
          setUpload(true);
          handleUploaddata();
        }}
      >
        {/* Move title field to top */}
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
        
        {/* Video uploader */}
        <Uploader
          text="Upload the video (MP4)"
          type="videos"
          savetitle={`${params.fname}/${values.title || 'untitled'}`}
          startupload={false} // Don't auto-upload, we'll handle it separately
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
          label="Lesson"
          id="select"
          required
          name="lesson"
          onChange={handleInputs}
          value={values.lesson || ""}
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
          disabled={!values.thumbnail || !values.video || !values.title}
        >
          Upload
        </Button>
        <SFVL foldername={params.fname} />
      </Box>
    </Container>
  );
}