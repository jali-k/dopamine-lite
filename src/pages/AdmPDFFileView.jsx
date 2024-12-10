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
  Paper,
  Card,
  CardContent,
  CardActions
} from "@mui/material";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { fireDB, fireStorage } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { useUser } from "../contexts/UserProvider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import DoneIcon from "@mui/icons-material/Done";
import { PictureAsPdf, DeleteForever } from "@mui/icons-material";
import { useState } from "react";
import { Add } from "@mui/icons-material";
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

export default function AdmPDFFileView() {
  const params = useParams();
  const pdfRef = collection(fireDB, "pdfFolders", params.fname, "pdfs");
  const emailListref = collection(
    fireDB,
    "pdfFolders",
    params.fname,
    "emailslist"
  );

  const [editableemails, setEditableEmails] = useState("");

  const { isAdmin } = useUser();

  const [pdfs, loading] = useCollectionData(pdfRef);
  const [emails, emailLoading, error, snapshot] =
    useCollectionData(emailListref);

  const navigator = useNavigate();

  const dbemails = [
    ...new Set(
      editableemails
        .replaceAll(",", "\n")
        .split("\n")
        .filter((email) => email !== "")
        .map((email) => email.trim().toLowerCase())
    ),
  ];

  const addEmailsToDB = async () => {
    dbemails.forEach(async (email) => {
      try {
        await setDoc(doc(emailListref, email), { email });
      } catch (err) {
        setEditableEmails("An error occurred while adding emails");
        console.error(err);
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
          console.error(err);
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
          setEditableEmails("An error occurred while deleting emails");
          console.error(err);
        }
      }
    });

    setEditableEmails("");
  };

  // Modified function to delete individual PDF from Firestore and Storage
  const deletePDF = async (pdf) => {
    try {
      // Validate PDF title
      if (!pdf.title || pdf.title.trim() === '') {
        console.error("Invalid PDF title");
        return;
      }

      // Delete PDF document from Firestore
      await deleteDoc(doc(pdfRef, pdf.title));

      // Use full path from storage root
      const storageRef = ref(fireStorage, `${pdf.url}`);
      await deleteObject(storageRef);
    } catch (err) {
      console.error("Error deleting PDF:", err);
    }
  };

  if (loading) {
    return <Loading text="Loading PDFs" />;
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
        <T color={"error.main"}>You are not authorized to view this page.</T>
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
        bgcolor: "background.default",
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
        {/* Header */}
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
          <BiotechIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <T variant="h4">
            {params.fname} PDF Documents
          </T>
        </Paper>

        {/* PDF Grid */}
        <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              {pdfs?.length > 0 ? (
                pdfs.map((pdf, index) => (
                  <Grid
                    item
                    key={index}
                    xs={12}
                    sm={6}
                    md={4}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                        }
                      }}
                    >
                      <CardContent sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <PictureAsPdf
                          sx={{
                            fontSize: 64,
                            color: 'error.main',
                            opacity: 0.9
                          }}
                        />
                        <T variant="h6" sx={{ textAlign: 'center', wordBreak: 'break-word' }}>
                          {pdf.title}
                        </T>
                      </CardContent>
                      <CardActions sx={{
                        justifyContent: 'center',
                        p: 2,
                        pt: 0,
                        gap: 1
                      }}>
                        <B
                          variant="contained"
                          color="primary"
                          href={pdf.url}
                          target="_blank"
                          startIcon={<PictureAsPdf />}
                          sx={{ textTransform: 'none' }}
                        >
                          View PDF
                        </B>
                        <B
                          variant="contained"
                          color="error"
                          startIcon={<DeleteForever />}
                          onClick={() => deletePDF(pdf)}
                          sx={{ textTransform: 'none' }}
                        >
                          Delete
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
                      py: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <ScienceIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
                    <T variant="h6" color="text.secondary">
                      No PDFs Found in {params.fname}
                    </T>
                  </Bx>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Authorized Users Accordion */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'customColors.membrane' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <PrecisionManufacturingIcon />
              <T variant="h6">Authorized Users</T>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <L>
              {emails?.length > 0 ? (
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
        </Accordion>

        {/* Edit Access Accordion */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'customColors.membrane' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <EmailIcon />
              <T variant="h6">Edit Access</T>
            </Stack>
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
              placeholder="Use comma or new line separated emails to give or revoke access. Type DELETE_ALL to remove all emails and give free access."
              value={editableemails}
              onChange={(e) => setEditableEmails(e.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <B
                variant="contained"
                color="success"
                onClick={addEmailsToDB}
                sx={{ textTransform: 'none' }}
              >
                Add
              </B>
              <B
                variant="contained"
                color="error"
                onClick={deleteEmailsfromDB}
                sx={{ textTransform: 'none' }}
              >
                Remove
              </B>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Delete Folder Button */}
        <B
          color="error"
          variant="contained"
          startIcon={<DeleteForever />}
          onClick={async () => {
            pdfs.forEach(async (pdf) => {
              try {
                await deleteDoc(doc(pdfRef, pdf.title));
              } catch (err) {
                console.error(err);
              }
            });
            snapshot.forEach(async (doc) => {
              try {
                await deleteDoc(doc.ref);
              } catch (err) {
                console.error(err);
              }
            });
            await deleteDoc(doc(fireDB, "pdfFolders", params.fname));
            navigator("/admin");
          }}
          sx={{
            textTransform: 'none',
            py: 1.5
          }}
        >
          Delete {params.fname} Folder
        </B>
      </Bx>

      {/* Add PDF FAB */}
      <Fab
        color="secondary"
        sx={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(46, 125, 50, 0.2)',
        }}
        onClick={() => {
          navigator("add");
        }}
      >
        <Add />
      </Fab>
    </Container>
  );
}
