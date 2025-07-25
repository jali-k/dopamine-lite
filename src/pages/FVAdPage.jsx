import React, { useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip
} from "@mui/material";
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import VideocamIcon from '@mui/icons-material/Videocam';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import LabelIcon from '@mui/icons-material/Label';
import FButton from "../components/FButton";
import CreateFModal from "../components/CreateFModal";
import CategoryManagement from "../components/CategoryManagement";
import FolderCategoryAssignment from "../components/FolderCategoryAssignment";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { fireDB } from "../../firebaseconfig";
import Loading from "../components/Loading";
import Appbar from "../components/Appbar";
import { NavLink, useLocation } from "react-router-dom"; // Added useLocation import
import { useUser } from "../contexts/UserProvider";

// Custom styled tab component
const StyledTab = ({ icon, ...props }) => (
  <Tab
    {...props}
    icon={icon}
    sx={{
      textTransform: 'none',
      fontFamily: 'Quicksand, Arial, sans-serif',
      fontWeight: 500,
      fontSize: '1rem',
      '&.Mui-selected': {
        color: 'primary.main',
      }
    }}
  />
);

export default function FVAdPage() {
  const location = useLocation(); // Add location hook
  
  // Determine initial tab based on URL - same logic as FVStuPage
  const getInitialTab = () => {
    return location.pathname.includes('/pdf') ? 1 : 0;
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab()); // Update to use URL detection
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
  const [folderCategoryAssignment, setFolderCategoryAssignment] = useState({
    open: false,
    folderName: '',
    currentCategories: {}
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const videoFoldersRef = collection(fireDB, "folders");
  const pdfFoldersRef = collection(fireDB, "pdfFolders");

  const [videoFolders, videoLoading] = useCollectionData(videoFoldersRef, {
    idField: "fname",
  });
  const [pdfFolders, pdfLoading] = useCollectionData(pdfFoldersRef, {
    idField: "fname",
  });

  const { isAdmin } = useUser();

  // Update tab when URL changes - same as FVStuPage
  React.useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCategoryManagement = () => {
    setCategoryManagementOpen(true);
    setAnchorEl(null);
  };

  const handleFolderCategoryAssignment = (folderName, currentCategories = {}) => {
    setFolderCategoryAssignment({
      open: true,
      folderName,
      currentCategories
    });
    setAnchorEl(null);
  };

  const renderManageCategoriesButton = (file) => {
    return (
      <Button
        size="small"
        startIcon={<LabelIcon />}
        onClick={() => handleFolderCategoryAssignment(file.fname, file.categories)}
        sx={{ 
          position: 'absolute',
          top: 5,
          right: 5,
          fontSize: '0.6rem',
          minHeight: '20px',
          height: '20px',
          bgcolor: 'white',
          border: '1px solid #ccc',
          color: 'primary.main',
          px: 0.5,
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white'
          },
          '& .MuiButton-startIcon': {
            marginRight: '2px',
            '& > svg': {
              fontSize: '12px'
            }
          }
        }}
      >
        Categories
      </Button>
    );
  };

  if (videoLoading || pdfLoading) {
    return <Loading text="Loading Files" />;
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
        }}
      >
        <Typography color={"error.main"}>
          You are not authorized to view this page. Click here to go back
        </Typography>
      </NavLink>
    );
  }

  const renderFolderGrid = (folders, type) => (
    <Grid
      container
      spacing={2}
      sx={{
        p: 2,
        width: '100%',
        margin: 0,
        minHeight: '80vh'
      }}
    >
      {folders && folders.length > 0 ? (
        folders.map((file, index) => (
          <Grid
            item
            xs={6}
            sm={4}
            md={3}
            lg={2}
            key={index}
          >
            <Box sx={{ position: 'relative' }}>
              <FButton
                fname={file.fname}
                to={isAdmin ? `/admin/${type}/${file.fname}` : `/${type}/${file.fname}`}
                sx={{
                  height: '100%',
                  minHeight: '150px',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleFolderCategoryAssignment(file.fname, file.categories);
                }}
              />
              {renderManageCategoriesButton(file)}
            </Box>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Card
            sx={{
              textAlign: 'center',
              py: 6,
              backgroundColor: 'customColors.cytoplasm',
              border: '1px dashed',
              borderColor: 'primary.main'
            }}
          >
            <CardContent>
              <ScienceIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7, mb: 2 }} />
              <Typography variant="h6" color="primary">
                No {type === 'video' ? 'Video' : 'PDF'} Folders Found
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
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

        {isAdmin && <CreateFModal activeTab={activeTab} />}

        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" px={2}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              centered
              variant="fullWidth"
              TabIndicatorProps={{
                style: {
                  backgroundColor: '#2e7d32'
                }
              }}
              sx={{ flexGrow: 1 }}
            >
              <StyledTab
                icon={<VideocamIcon />}
                label="Video Folders"
              />
              <StyledTab
                icon={<PictureAsPdfIcon />}
                label="PDF Folders"
              />
            </Tabs>
            
            <Button
              startIcon={<SettingsIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: 2 }}
            >
              Manage
            </Button>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleCategoryManagement}>
                <ListItemIcon>
                  <CategoryIcon />
                </ListItemIcon>
                <ListItemText primary="Manage Categories" />
              </MenuItem>
            </Menu>
          </Box>
        </Paper>

        <Box
          sx={{
            flexGrow: 1,
            bgcolor: activeTab === 0 ? 'customColors.cytoplasm' : 'customColors.membrane',
            transition: 'background-color 0.3s ease'
          }}
        >
          {activeTab === 0 && renderFolderGrid(videoFolders, 'video')}
          {activeTab === 1 && renderFolderGrid(pdfFolders, 'pdf')}
        </Box>

        {/* Category Management Dialog */}
        <CategoryManagement
          open={categoryManagementOpen}
          onClose={() => setCategoryManagementOpen(false)}
        />

        {/* Folder Category Assignment Dialog */}
        <FolderCategoryAssignment
          open={folderCategoryAssignment.open}
          onClose={() => setFolderCategoryAssignment({ open: false, folderName: '', currentCategories: {} })}
          folderName={folderCategoryAssignment.folderName}
          collectionName={activeTab === 0 ? 'folders' : 'pdfFolders'}
          currentCategories={folderCategoryAssignment.currentCategories}
        />
      </Container>
    </Box>
  );
}