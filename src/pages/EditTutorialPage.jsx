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
import { useState, useEffect } from "react";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import Loading from "../components/Loading";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserProvider";
import { useUploadFile } from "react-firebase-hooks/storage";
import { ref } from "firebase/storage";

export default function EditTutorialPage() {
  const params = useParams();
  const location = useLocation();
  const navigator = useNavigate();
  const { isAdmin } = useUser();
  const [uploadFile, uploading, snapshot] = useUploadFile();
  const [upload, setUpload] = useState(false);

  const [values, setValues] = useState({
    title: "",
    thumbnail: null,
    description: "",
    handler: "",
    lesson: "",
    date: "",
    originalTitle: "",
  });

  useEffect(() => {
    if (location.state?.tutorial) {
      const { tutorial } = location.state;
      setValues({
        title: tutorial.title || "",
        thumbnail: null,
        description: tutorial.description || "",
        handler: tutorial.handler || "",
        lesson: tutorial.lesson || "",
        date: tutorial.date || "",
        originalTitle: tutorial.title || "",
      });
    }
  }, [location.state]);

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
  ];

  const handleInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleUpdateData = async () => {
    if (!values.thumbnail || !values.title) {
      alert("Please select a new thumbnail and fill all required fields");
      return;
    }

    const tutorialref = collection(
      fireDB,
      "folders",
      params.fname,
      "tutorials"
    );

    try {
      // Upload new thumbnail
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

      // If title has changed, delete old document
      if (values.title !== values.originalTitle) {
        await deleteDoc(doc(tutorialref, values.originalTitle));
      }

      // Create/Update document
      await setDoc(doc(tutorialref, values.title), {
        title: values.title,
        thumbnail: values.thumbnail.name,
        video: "",
        description: values.description,
        handler: values.handler,
        lesson: values.lesson,
        date: values.date,
      });

      navigator(`/admin/video/${params.fname}`);
    } catch (err) {
      console.error("Error updating tutorial:", err);
      alert("An error occurred while updating the tutorial");
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
    return <Loading text="Uploading Files" />;
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
          setUpload(true);
          handleUpdateData();
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Edit Tutorial
        </Typography>

        <TextField
          label="Title"
          placeholder="Title"
          variant="filled"
          required
          name="title"
          value={values.title}
          onChange={handleInputs}
        />

        <Uploader
          text="Upload new thumbnail"
          type="thumbnails"
          savetitle={`${params.fname}/${values.title || 'untitled'}`}
          startupload={upload}
          onChange={(file) => {
            setValues({ ...values, thumbnail: file });
          }}
          inerror={!values.thumbnail}
          name="thumbnail-upload"
          helperText="Please select a new thumbnail"
        />

        <TextField
          label="Description"
          placeholder="Description"
          variant="filled"
          required
          name="description"
          value={values.description}
          onChange={handleInputs}
        />
        <TextField
          label="Handler"
          placeholder="Handler"
          variant="filled"
          required
          name="handler"
          value={values.handler}
          onChange={handleInputs}
        />
        <Select
          label="Lesson"
          id="select"
          required
          name="lesson"
          value={values.lesson}
          onChange={handleInputs}
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
          value={values.date}
          onChange={handleInputs}
        />

        <Button type="submit" variant="contained" color="primary">
          Update Tutorial
        </Button>
      </Box>
    </Container>
  );
}