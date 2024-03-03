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
import VCad from "../components/VCad";
import { useUser } from "../contexts/UserProvider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmailIcon from "@mui/icons-material/Email";
import DoneIcon from "@mui/icons-material/Done";
import { useState } from "react";
import { deleteTutorial, isValidEmail } from "../../funcs";
import { Add } from "@mui/icons-material";
import { jhsfg } from "../../af";

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
        .map((email) => email.trim())
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
        }}
      >
        <Grid container columns={12} spacing={1}>
          {tuts.length > 0 ? (
            tuts.map((tut, index) => (
              <Grid
                item
                key={index}
                justifyContent={"center"}
                display={"flex"}
                xs={12}
                sm={6}
                md={4}
              >
                <VCad tut={{ ...tut, fpath: params.fname }} />
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
                // position: "absolute",
                // top: "30%",
                // left: "50%",
                // transform: "translate(-50%, -50%)",
              }}
            >
              No Files Found
            </T>
          )}
        </Grid>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <T variant="h6">Authorized Users</T>
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
              placeholder="Use comma or new line separated emails to give or revoke access to specific users. type DELETE_ALL to remove all emails and give free access."
              value={editableemails}
              onChange={(e) => setEditableEmails(e.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <B
                variant="contained"
                color="success"
                onClick={() => {
                  addEmailsToDB();
                }}
              >
                Add
              </B>
              <B
                variant="contained"
                color="error"
                onClick={() => {
                  deleteEmailsfromDB();
                }}
              >
                Remove
              </B>
            </Stack>
          </AccordionDetails>
        </Accordion>
        <B
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          color="error"
          variant="contained"
          onClick={async () => {
            tuts.forEach((tut) => {
              deleteTutorial(params.fname, tut.title, tut.video, tut.thumbnail);
            });
            snapshot.forEach(async (doc) => {
              try {
                await deleteDoc(doc.ref);
              } catch (err) {
                console.log(err);
              }
            });
            console.log("All emails deleted");
            await deleteDoc(doc(fireDB, "folders", params.fname));
            console.log(`Folder ${params.fname} deleted`);
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
