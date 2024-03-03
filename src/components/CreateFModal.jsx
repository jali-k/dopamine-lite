import {
  Accordion as AccorCom,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Fab,
  Grid,
  Modal,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { CreateNewFolder, ExpandMore } from "@mui/icons-material";
import { fireDB } from "../../firebaseconfig";
import { Timestamp, collection, doc, setDoc } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "./Loading";
import { useNavigate } from "react-router-dom";

export default function CreateFModal() {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [fNameError, setFNameError] = useState("");
  const [emailList, setEmailList] = useState("");

  const navigator = useNavigate();

  const [snackbar, setSnackbar] = useState({
    show: false,
    message: "",
    severity: "success",
  });

  const foldersRef = collection(fireDB, "folders");
  const [folders, loading] = useCollectionData(foldersRef, {
    idField: "fname",
  });

  const createFolder = async () => {
    try {
      setFNameError("");
      const foldernameList = folders.map((folder) => folder.fname);
      if (folderName === "") {
        setFNameError("Folder name can't be empty");
        return;
      }
      if (foldernameList.includes(folderName)) {
        setFNameError("Folder already exists");
        return;
      }
      setOpen(false);

      await setDoc(doc(fireDB, foldersRef.path, folderName), {
        fname: folderName,
        createdAt: Timestamp.now(),
      });

      setSnackbar({
        show: true,
        message: `Folder ${folderName} created successfully`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        show: true,
        message: "Failed to create folder",
        severity: "error",
      });
    }

    try {
      const emailListRef = collection(
        fireDB,
        "folders",
        folderName,
        "emailslist"
      );
      const emails = [
        ...new Set(
          emailList
            .replaceAll(",", "\n")
            .split("\n")
            .filter((email) => email !== "")
            .map((email) => email.trim())
        ),
      ];
      emails.forEach(async (email) => {
        await setDoc(doc(emailListRef, email), {
          email: email,
        });
      });
      setSnackbar({
        show: true,
        message: "Email list added successfully",
        severity: "success",
      });
      navigator(`/admin/${folderName}/add`);
    } catch (err) {
      setSnackbar({
        show: true,
        message: "Failed to add email list",
        severity: "error",
      });
    }
  };
  const handleCancle = () => {
    setOpen(false);
    setFNameError("");
  };

  return (
    <>
      <Snackbar
        open={snackbar.show}
        autoHideDuration={5000}
        onClose={() =>
          setSnackbar({ show: false, message: "", severity: "success" })
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      {loading ? (
        <Loading text="Loading Folders " />
      ) : open === true ? (
        <Modal open={open} onClose={handleCancle}>
          <Box
            sx={{
              bgcolor: "white",
              px: 4,
              py: 2,
              minWidth: "300px",
              maxWidth: "400px",
              width: { xs: "90%", sm: "400px" },
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRadius: "10px",
            }}
          >
            <Typography variant="h6">Create New Folder</Typography>
            <TextField
              label="Folder Name"
              variant="filled"
              onChange={(e) => setFolderName(e.target.value)}
              error={fNameError !== ""}
              helperText={fNameError}
            />
            <Grid container spacing={1} justifyContent="flex-end">
              <Grid item>
                <Button
                  variant="contained"
                  color="success"
                  onClick={createFolder}
                >
                  Create
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancle}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
            <AccorCom>
              <AccordionSummary expandIcon={<ExpandMore />}>
                Email List
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={5}
                  placeholder="Use comma or new line separated emails to give access to specific users. Leave empty to give free access."
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                />
              </AccordionDetails>
            </AccorCom>
          </Box>
        </Modal>
      ) : (
        <Tooltip title="Create New Folder">
          <Fab
            color="success"
            sx={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
            }}
            onClick={() => setOpen(true)}
          >
            <CreateNewFolder />
          </Fab>
        </Tooltip>
      )}
    </>
  );
}
