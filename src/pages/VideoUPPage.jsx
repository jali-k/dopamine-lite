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
    video: null,
    description: "",
    lesson: "",
    date: "",
  });
  const [uploadFile, uploading, snapshot] = useUploadFile();

  // Where i want to upload the file is, inside the folders collection, there is a document with the name of the folder. and I want to store data there

  //const folderref
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
          `videos/${params.fname}/${values.title}/${values.video.name}`
        ),
        values.video,
        {
          contentType: values.video.type,
        }
      );

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
        video: values.video.name,
        description: values.description,
        lesson: values.lesson,
        date: values.date,
      });
    } catch (err) {
      console.log(err);
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
        text={`Uploading ${
          snapshot.metadata.contentType.includes("video")
            ? "Video"
            : "Thumbnail"
        } to the server`}
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
        <Uploader
          text="Upload the thumbnail"
          type="thumbnails"
          savetitle={`${params.fname}/${values.title}`}
          startupload={upload}
          onChange={(file) => {
            setValues({ ...values, thumbnail: file });
          }}
          inerror={values.thumbnail === null}
          name="thup"
        />
        <Uploader
          text="Upload the video file"
          type="videos"
          savetitle={`${params.fname}/${values.title}`}
          startupload={upload}
          onChange={(file) => {
            setValues({ ...values, video: file });
          }}
          name="vdup"
          inerror={values.video === null}
        />

        <TextField
          label="Title"
          placeholder="Title"
          variant="filled"
          required
          name="title"
          onChange={handleInputs}
        />
        <TextField
          label="Description"
          placeholder="Description"
          variant="filled"
          required
          name="description"
          onChange={handleInputs}
        />
        <Select
          label="Lesson"
          id="select"
          required
          name="lesson"
          onChange={handleInputs}
          defaultValue={0}
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
        />

        <Button
          type="submit"
          variant="contained"
          onClick={() => {
            console.log("Vals", values);
          }}
        >
          Upload
        </Button>
        <SFVL foldername={params.fname} />
      </Box>
    </Container>
  );
}
