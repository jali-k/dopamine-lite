import {
  Box,
  Button,
  Container,
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
import { useUploadFile } from "react-firebase-hooks/storage";
import { ref } from "firebase/storage";
import { getDownloadURL } from "firebase/storage";

export default function PDFUploaderPage() {
  const params = useParams();
  const navigator = useNavigate();

  const { isAdmin } = useUser();

  const [upload, setUpload] = useState(false);
  const [values, setValues] = useState({
    title: "",
    pdf: null,
    description: "",
    date: "",
  });
  const [uploadFile, uploading, snapshot] = useUploadFile();

  const handleInputs = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleUploaddata = async () => {
    const pdfRef = collection(fireDB, "pdfFolders", params.fname, "pdfs");
    alert("Don't close the tab until the upload is complete!");
    try {
      // Upload the file
      const snapshot = await uploadFile(
        ref(
          fireStorage,
          `pdfs/${params.fname}/${values.title}/${values.pdf.name}`
        ),
        values.pdf,
        {
          contentType: values.pdf.type,
        }
      );

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save document with download URL
      await setDoc(doc(pdfRef, values.title), {
        title: values.title,
        pdf: values.pdf.name,
        url: downloadURL, // New field to store download URL
        description: values.description,
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
        text={`Uploading PDF to the server`}
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
          text="Upload the PDF file"
          type="pdfs"
          savetitle={`${params.fname}/${values.title}`}
          startupload={upload}
          onChange={(file) => {
            setValues({ ...values, pdf: file });
          }}
          name="pdfup"
          inerror={values.pdf === null}
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
      </Box>
    </Container>
  );
}
