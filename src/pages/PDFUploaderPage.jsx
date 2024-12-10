import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Stack,
  Card
} from "@mui/material";
import {
  BiotechOutlined,
  CloudUpload,
} from '@mui/icons-material';
import Appbar from "../components/Appbar";
import Uploader from "../components/Uploader";
import { useState } from "react";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import { collection, doc, setDoc } from "firebase/firestore";
import { useUser } from "../contexts/UserProvider";
import { useUploadFile } from "react-firebase-hooks/storage";
import { ref, getDownloadURL } from "firebase/storage";

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

  const handleUploadData = async () => {
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
        url: downloadURL,
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
        bgcolor: 'background.default',
        minHeight: "100vh",
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
          gap: 3,
          px: 2,
          pb: 4,
        }}
        component={"form"}
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          console.log("Form Submitted");
          setUpload(true);
          handleUploadData();
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'customColors.cytoplasm',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <BiotechOutlined sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">
            Upload New PDF
          </Typography>
        </Paper>

        <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={3}>
            <Uploader
              text="Upload the PDF file"
              type="pdfs"
              savetitle={`${params.fname}/${values.title}`}
              startupload={upload}
              onChange={(file) => setValues({ ...values, pdf: file })}
              name="pdfup"
              inerror={values.pdf === null}
            />

            <TextField
              label="Title"
              placeholder="Enter document title"
              variant="outlined"
              required
              name="title"
              onChange={handleInputs}
              fullWidth
            />

            <TextField
              label="Description"
              placeholder="Enter document description"
              variant="outlined"
              required
              multiline
              rows={4}
              name="description"
              onChange={handleInputs}
              fullWidth
            />

            <TextField
              type="date"
              label="Date"
              required
              name="date"
              onChange={handleInputs}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CloudUpload />}
              sx={{
                mt: 2,
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Upload Document
            </Button>
          </Stack>
        </Card>
      </Box>
    </Container>
  );
}