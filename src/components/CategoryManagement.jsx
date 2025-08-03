import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  initializeDefaultCategories
} from '../services/categoryService';

const CategoryManagement = ({ open, onClose }) => {
  const [categories, setCategories] = useState({ class: [], month: [], custom: [] });
  const [loading, setLoading] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'custom' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [needsInitialization, setNeedsInitialization] = useState(false);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      
      // Check if categories need initialization
      const totalCategories = categoriesData.class.length + categoriesData.month.length + categoriesData.custom.length;
      setNeedsInitialization(totalCategories === 0);
    } catch (error) {
      showSnackbar('Error loading categories', 'error');
    }
    setLoading(false);
  };

  const handleInitializeCategories = async () => {
    setLoading(true);
    try {
      await initializeDefaultCategories();
      loadCategories();
      showSnackbar('Default categories initialized successfully', 'success');
    } catch (error) {
      showSnackbar('Error initializing categories', 'error');
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    setAddingCategory(true);
    try {
      await addCategory(newCategory.name, newCategory.type);
      setNewCategory({ name: '', type: 'custom' });
      loadCategories();
      showSnackbar('Category added successfully', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Error adding category', 'error');
    }
    setAddingCategory(false);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory.name.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    try {
      await updateCategory(editingCategory.id, { name: editingCategory.name });
      setEditingCategory(null);
      loadCategories();
      showSnackbar('Category updated successfully', 'success');
    } catch (error) {
      showSnackbar('Error updating category', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      loadCategories();
      showSnackbar('Category deleted successfully', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Error deleting category', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getCurrentCategories = () => {
    switch (activeTab) {
      case 0: return categories.class;
      case 1: return categories.month;
      case 2: return categories.custom;
      default: return [];
    }
  };

  const getTabLabel = (tab) => {
    switch (tab) {
      case 0: return 'By Class';
      case 1: return 'By Month';
      case 2: return 'Custom';
      default: return '';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryIcon />
            Category Management
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {needsInitialization && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleInitializeCategories}
                  disabled={loading}
                >
                  Initialize Default Categories
                </Button>
              }
            >
              No categories found. Click to initialize default categories (By Class and By Month).
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="By Class" />
              <Tab label="By Month" />
              <Tab label="Custom Categories" />
            </Tabs>
          </Box>

          {/* Add new category section - only for custom categories */}
          {activeTab === 2 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Add New Category
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={addingCategory ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                    onClick={handleAddCategory}
                    disabled={loading || addingCategory}
                  >
                    {addingCategory ? 'Adding...' : 'Add'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Categories list */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {getTabLabel(activeTab)} Categories
              <Chip 
                label={getCurrentCategories().length} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Typography>
            
            {getCurrentCategories().length === 0 ? (
              <Alert severity="info">No categories found</Alert>
            ) : (
              <List>
                {getCurrentCategories().map((category) => (
                  <ListItem 
                    key={category.id}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 1, 
                      mb: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    {editingCategory && editingCategory.id === category.id ? (
                      <Box display="flex" alignItems="center" width="100%" gap={1}>
                        <TextField
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          size="small"
                          fullWidth
                        />
                        <Button onClick={handleUpdateCategory} size="small">Save</Button>
                        <Button onClick={() => setEditingCategory(null)} size="small">Cancel</Button>
                      </Box>
                    ) : (
                      <>
                        <ListItemText
                          primary={category.name}
                          secondary={`Type: ${category.type}${category.isDefault ? ' (Default)' : ''}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => setEditingCategory({ ...category })}
                            disabled={activeTab !== 2 && category.isDefault}
                          >
                            <EditIcon />
                          </IconButton>
                          {!category.isDefault && (
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteCategory(category.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CategoryManagement;
