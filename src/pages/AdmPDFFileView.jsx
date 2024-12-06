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
} from "@mui/material";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { fireDB } from "../../firebaseconfig";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { useUser } from "../contexts/UserProvider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import DoneIcon from "@mui/icons-material/Done";
import { PictureAsPdf } from "@mui/icons-material"; // Icon for PDF
import { useState } from "react";
import { Add } from "@mui/icons-material";

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
        }}
      >
        <Grid container columns={12} spacing={1}>
          {pdfs?.length > 0 ? (
            pdfs.map((pdf, index) => (
              <Grid
                item
                key={index}
                justifyContent={"center"}
                display={"flex"}
                xs={12}
                sm={6}
                md={4}
              >
                <Bx
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    p: 2,
                    width: "100%",
                  }}
                >
                  <PictureAsPdf
                    sx={{ fontSize: 100, color: "red", mb: 2 }}
                  />
                  <T variant="h6">{pdf.title}</T>
                  <B
                    variant="contained"
                    color="primary"
                    href={pdf.url}
                    target="_blank"
                    sx={{ mt: 2 }}
                  >
                    View PDF
                  </B>
                </Bx>
              </Grid>
            ))
          ) : (
            <T
              variant="h3"
              sx={{
                textAlign: "center",
                my: 4,
                fontSize: "24px",
                width: "100%",
              }}
            >
              No PDFs Found
            </T>
          )}
        </Grid>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <T variant="h6">Authorized Users</T>
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
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Edit Access
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
        <B
          color="error"
          variant="contained"
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
        >
          Delete {params.fname} Folder
        </B>
      </Bx>
      <Fab
        color="success"
        sx={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
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
