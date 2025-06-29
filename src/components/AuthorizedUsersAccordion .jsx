import React, { useState, useMemo } from 'react';
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
  Pagination,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PrecisionManufacturing as PrecisionManufacturingIcon,
  Email as EmailIcon,
  Done as DoneIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const AuthorizedUsersAccordion = ({ emails = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter emails based on the search query
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    return emails.filter((email) =>
      email.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [emails, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmails = filteredEmails.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          bgcolor: 'rgba(76, 175, 80, 0.05)',
          '&:hover': {
            bgcolor: 'rgba(76, 175, 80, 0.1)',
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <PrecisionManufacturingIcon sx={{ color: '#4caf50' }} />
          <T variant="h6" sx={{ color: '#4caf50' }}>
            Authorized Users
          </T>
          <Chip 
            label={emails.length} 
            size="small" 
            color="success" 
            variant="outlined"
          />
        </Stack>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 0 }}>
        {/* Search Section */}
        <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.02)' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              label="Search Users"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by email address..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchQuery && (
                  <Tooltip title="Clear search">
                    <IconButton 
                      size="small" 
                      onClick={clearSearch}
                      sx={{ mr: -0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#4caf50',
                  },
                },
              }}
            />
          </Stack>
          
          {/* Results Summary */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <T variant="body2" color="text.secondary">
              {searchQuery ? (
                <>
                  Found <strong>{filteredEmails.length}</strong> of {emails.length} users
                </>
              ) : (
                <>
                  Total <strong>{emails.length}</strong> authorized users
                </>
              )}
            </T>
            
            {totalPages > 1 && (
              <T variant="body2" color="text.secondary">
                Page {currentPage} of {totalPages}
              </T>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Email List */}
        <Box sx={{ minHeight: '200px' }}>
          {currentEmails.length > 0 ? (
            <L disablePadding>
              {currentEmails.map((email, index) => (
                <ListItem 
                  key={email.id || email.email || index}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: index < currentEmails.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    '&:hover': {
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <EmailIcon sx={{ color: '#4caf50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={email.email}
                    primaryTypographyProps={{
                      sx: { 
                        fontFamily: 'monospace',
                        fontSize: '0.95rem'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </L>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                py: 6,
                px: 2,
                textAlign: 'center'
              }}
            >
              {searchQuery ? (
                <>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <T variant="body1" color="text.secondary" gutterBottom>
                    No users found matching "{searchQuery}"
                  </T>
                  <T variant="body2" color="text.disabled">
                    Try adjusting your search terms
                  </T>
                </>
              ) : (
                <>
                  <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <T variant="body1" color="text.secondary" gutterBottom>
                    No authorized users yet
                  </T>
                  <T variant="body2" color="text.disabled">
                    Add email addresses to grant access
                  </T>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Divider />
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 2,
                bgcolor: 'rgba(76, 175, 80, 0.02)'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <T variant="body2" color="text.secondary">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredEmails.length)} of {filteredEmails.length}
                </T>
                
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                  siblingCount={1}
                  boundaryCount={1}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      '&.Mui-selected': {
                        bgcolor: '#4caf50',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#45a049',
                        }
                      }
                    }
                  }}
                />
              </Stack>
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default AuthorizedUsersAccordion;