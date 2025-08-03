import React from 'react';
import { Container, Grid, Typography, Box, Tabs, Tab } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useLocation } from 'react-router-dom'; // Add this import
import FButton from "../components/FButton";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import FolderFilter from "../components/FolderFilter";

export default function FVStuPage() {
  const location = useLocation(); // Add this line
  
  // Determine initial tab based on URL
  const getInitialTab = () => {
    return location.pathname.includes('/pdf') ? 1 : 0;
  };
  
  const [activeTab, setActiveTab] = React.useState(getInitialTab()); // Update this line
  const [filters, setFilters] = React.useState({
    class: [],
    month: [],
    custom: [],
    search: ''
  });

  // Update tab when URL changes
  React.useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]); // Add this useEffect

  const videoFoldersRef = collection(fireDB, "folders");
  const pdfFoldersRef = collection(fireDB, "pdfFolders");

  const [videoFolders, videoLoading] = useCollectionData(videoFoldersRef, {
    idField: "fname",
  });

  const [pdfFolders, pdfLoading] = useCollectionData(pdfFoldersRef, {
    idField: "fname",
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = React.useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const filterFolders = (folders) => {
    if (!folders) return [];

    return folders.filter(folder => {
      // Search filter
      if (filters.search && !folder.fname.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filters
      const hasClassFilter = filters.class.length > 0;
      const hasMonthFilter = filters.month.length > 0;
      const hasCustomFilter = filters.custom.length > 0;

      // If no category filters are applied, show all folders
      if (!hasClassFilter && !hasMonthFilter && !hasCustomFilter) {
        return true;
      }

      // Check if folder has any of the selected categories
      const folderCategories = folder.categories || {};
      
      let matchesClass = !hasClassFilter;
      let matchesMonth = !hasMonthFilter;
      let matchesCustom = !hasCustomFilter;

      if (hasClassFilter && folderCategories.class) {
        matchesClass = filters.class.some(cat => folderCategories.class.includes(cat));
      }

      if (hasMonthFilter && folderCategories.month) {
        matchesMonth = filters.month.some(cat => folderCategories.month.includes(cat));
      }

      if (hasCustomFilter && folderCategories.custom) {
        matchesCustom = filters.custom.some(cat => folderCategories.custom.includes(cat));
      }

      // Return true if matches any of the selected category types
      return matchesClass && matchesMonth && matchesCustom;
    });
  };

  if (videoLoading || pdfLoading) {
    return <Loading text="Loading Files" />;
  }

  const truncateText = (text, maxLength = 30) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "..."; // Truncate and add ellipsis
    }
    return text;
  };

  const renderFolderGrid = (folders, type) => {
    const filteredFolders = filterFolders(folders);
    
    return (
      <Box
        bgcolor='#f5f5f5'
        minHeight='90vh'
      >
        <Grid
          container
          spacing={7}
          sx={{
            px: 2,
            width: '100%',
            margin: 0,
          }}
        >
          {filteredFolders && filteredFolders.length > 0 ? (
            filteredFolders.map((file, index) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
                lg={2}
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <FButton
                  fname={truncateText(file.fname)} // Truncate before passing
                  to={`/${type}/${file.fname}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: '150px',
                  }}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                {folders && folders.length > 0 ? 
                  `No ${type === 'video' ? 'Video' : 'PDF'} Folders Match Your Filters` :
                  `No ${type === 'video' ? 'Video' : 'PDF'} Folders Found`
                }
              </Typography>
              {folders && folders.length > 0 && filteredFolders.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Try adjusting your filters to see more folders
                </Typography>
              )}
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: '#f0f0f0',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          width: '100%',
          padding: 0,
        }}
      >
        <Appbar />

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            width: '100%',
            bgcolor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            variant="fullWidth"
            TabIndicatorProps={{
              style: {
                backgroundColor: '#2e7d32' // Green indicator
              }
            }}
            sx={{
              '& .MuiTab-root': {
                minHeight: '64px',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              },
              '& .Mui-selected': {
                color: '#2e7d32 !important', // Green text for selected tab
                '& .MuiSvgIcon-root': {
                  color: '#2e7d32 !important', // Green icon for selected tab
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<VideocamIcon sx={{ mr: 1 }} />}
              label="Video Folders"
              iconPosition="start"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.3rem',
                },
              }}
            />
            <Tab
              icon={<PictureAsPdfIcon sx={{ mr: 1 }} />}
              label="PDF Folders"
              iconPosition="start"
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: '1.3rem',
                },
              }}
            />
          </Tabs>
        </Box>

        <Box
          sx={{
            height: 'calc(100vh - 112px)',
            overflowY: 'auto',
            backgroundColor: '#eeeeee',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Filter Component */}
          <Box sx={{ p: 2, bgcolor: '#eeeeee' }}>
            <FolderFilter
              onFilterChange={handleFilterChange}
              totalFolders={activeTab === 0 ? (videoFolders?.length || 0) : (pdfFolders?.length || 0)}
              filteredCount={activeTab === 0 ? 
                filterFolders(videoFolders).length : 
                filterFolders(pdfFolders).length
              }
            />
          </Box>
  
          {activeTab === 0 && renderFolderGrid(videoFolders, 'video')}
          {activeTab === 1 && renderFolderGrid(pdfFolders, 'pdf')}
        </Box>
      </Container>
    </Box>
    
  );
}