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
  Paper
} from "@mui/material";
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import VCad from "../components/VCad";
import DeleteIcon from "@mui/icons-material/Delete";
import { useUser } from "../contexts/UserProvider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import { useState } from "react";
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

  const { isAdmin } = useUser();

  const [tuts, loading] = useCollectionData(tutorialref);
  const [emails, emailLoading, error, snapshot] =
    useCollectionData(emailListref);

  const navigator = useNavigate();

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
      // Delete all tutorials in the folder
      tuts.forEach((tut) => {
        deleteTutorial(params.fname, tut.title, tut.video, tut.thumbnail);
      });

      // Delete all emails
      snapshot.forEach(async (doc) => {
        try {
          await deleteDoc(doc.ref);
        } catch (err) {
          console.log(err);
        }
      });

      // Delete the folder itself
      await deleteDoc(doc(fireDB, "folders", params.fname));

      console.log(`Folder ${params.fname} deleted`);
      navigator("/admin");
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  if (loading) {
    return <Loading text="Loading Tutorials" />;
  }
  if (emailLoading) {
    return <Loading text="Checking Emails" />;
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
        {/* Tutorials Grid */}
        <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <CardContent>
            <Grid container spacing={2} columns={12}>
              {tuts.length > 0 ? (
                tuts.map((tut, index) => (
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
                      <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
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


        {/* Authorized Users Accordion */}
        <AuthorizedUsersAccordion emails={emails} />
        {/* <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'customColors.membrane' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PrecisionManufacturingIcon />
              <T variant="h6">Authorized Users</T>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <L>
              {emails.length > 0 ? (
                emails.map((email, index) => (
                  <ListItem disablePadding key={index}>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText primary={email.email} />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemIcon>
                    <DoneIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Free Access" />
                </ListItem>
              )}
            </L>
          </AccordionDetails>
        </Accordion> */}

        {/* Edit Access Accordion */}
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

        {/* Delete Folder Button */}
        <B
          fullWidth
          color="error"
          variant="contained"
          onClick={() => setOpenDeleteFolderConfirm(true)}
        >
          Delete {params.fname} Folder
        </B>
      </Bx>

      {/* Add Tutorial FAB */}
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

      {/* Folder Delete Confirmation Dialog */}
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