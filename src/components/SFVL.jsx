/* eslint-disable react/prop-types */
import { useCollectionData as uCDB } from "react-firebase-hooks/firestore";
import { fireDB } from "../../firebaseconfig";
import { collection } from "firebase/firestore";
import Lod from "./Loading";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import {
  Accordion,
  AccordionSummary,
  Box as B,
  List as L,
  ListItem as LI,
  ListItemIcon as LIc,
  ListItemText as LIt,
  Typography as T,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

export default function SFVL({ foldername }) {
  const tutorialref = collection(fireDB, "folders", foldername, "tutorials");

  const [tuts, loading] = uCDB(tutorialref);

  if (loading) {
    return <Lod text="Loading Tutorial Info" />;
  }

  return (
    <Accordion component={"div"}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <T variant="h6">Tutorials List</T>
      </AccordionSummary>
      <B
        sx={{
          px: 2,
        }}
      >
        <L>
          {tuts.length > 0 ? (
            tuts.map((video, index) => (
              <LI disablePadding key={index}>
                <LIc>
                  <TextSnippetIcon />
                </LIc>
                <LIt
                  primary={video.title}
                  secondary={
                    <>
                      {" "}
                      <T
                        sx={{ display: "inline" }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {video.lesson}
                      </T>
                      {` - ${video.description}`}
                    </>
                  }
                />
              </LI>
            ))
          ) : (
            <LI>
              <LIc>
                <ErrorOutlineIcon />
              </LIc>
              <LIt primary="No Tutorials Available" />
            </LI>
          )}
        </L>
      </B>
    </Accordion>
  );
}
