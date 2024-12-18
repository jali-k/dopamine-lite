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
import { collection, doc, setDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserProvider";
import SFVL from "../components/SFVL";
import { useUploadFile } from "react-firebase-hooks/storage";
import { ref } from "firebase/storage";

export default function VideoUPPage() {
  const params = useParams();
  const navigator = useNavigate();
  const { isAdmin } = useUser();
  const [upload, setUpload] = useState(false);
  const [values, setValues] = useState({
    title: "",
    thumbnail: null,
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
  ];

  const handleInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleUploaddata = async () => {
    if (!values.thumbnail || !values.title) {
      alert("Please fill in all required fields");
      return;
    }

    const tutorialref = collection(
      fireDB,
      "folders",
      params.fname,
      "tutorials"
    );
    alert("Don't close the tab until the upload is complete!");
    try {
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

      await setDoc(doc(tutorialref, values.title), {
        title: values.title,
        thumbnail: values.thumbnail.name,
        video: "", // Set empty string for video since we're not uploading it
        description: values.description,
        handler: values.handler,
        lesson: values.lesson,
        date: values.date,
      });
    } catch (err) {
      console.log(err);
      alert("An error occurred during upload");
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
        >
          Upload
        </Button>
        <SFVL foldername={params.fname} />
      </Box>
    </Container>
  );
}