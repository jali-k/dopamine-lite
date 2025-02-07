import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List as L,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Stack,
  Typography as T,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import EmailIcon from '@mui/icons-material/Email';
import DoneIcon from '@mui/icons-material/Done';

const AuthorizedUsersAccordion = ({ emails }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter emails based on the search query
  const filteredEmails = emails.filter((email) =>
    email.email.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  return (
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
        {/* Search Field */}
        <TextField
          fullWidth
          label="Search Emails"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Email List */}
        <L>
          {filteredEmails.length > 0 ? (
            filteredEmails.map((email, index) => (
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
              <ListItemText primary="No results found" />
            </ListItem>
          )}
        </L>
      </AccordionDetails>
    </Accordion>
  );
};

export default AuthorizedUsersAccordion;
