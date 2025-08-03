import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Alert,
  Snackbar,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import {
  Folder as FolderIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import {
  getCategories,
  assignCategoriesToFolder,
  initializeDefaultCategories
} from '../services/categoryService';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const FolderCategoryAssignment = ({ 
  open, 
  onClose, 
  folderName, 
  collectionName, 
  currentCategories = {} 
}) => {
  const [categories, setCategories] = useState({ class: [], month: [], custom: [] });
  const [selectedCategories, setSelectedCategories] = useState({
    class: [],
    month: [],
    custom: []
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open) {
      loadCategories();
      setSelectedCategories({
        class: currentCategories.class || [],
        month: currentCategories.month || [],
        custom: currentCategories.custom || []
      });
    }
  }, [open, currentCategories]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      showSnackbar('Error loading categories', 'error');
    }
  };

  const handleCategoryChange = (type, event) => {
    const value = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    setSelectedCategories(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleClearCategory = (type) => {
    setSelectedCategories(prev => ({
      ...prev,
      [type]: []
    }));
  };

  const handleClearAllCategories = () => {
    setSelectedCategories({
      class: [],
      month: [],
      custom: []
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await assignCategoriesToFolder(folderName, collectionName, selectedCategories);
      showSnackbar('Categories assigned successfully', 'success');
      onClose();
    } catch (error) {
      showSnackbar('Error assigning categories', 'error');
    }
    setLoading(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const renderCategorySelect = (type, label, categoryList) => (
    <Box>
      <Box display="flex" alignItems="center" gap={1}>
        <FormControl fullWidth margin="normal">
          <InputLabel>{label}</InputLabel>
          <Select
            multiple
            value={selectedCategories[type]}
            onChange={(e) => handleCategoryChange(type, e)}
            input={<OutlinedInput label={label} />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const category = categoryList.find(cat => cat.id === value);
                  return (
                    <Chip 
                      key={value} 
                      label={category?.name || value} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {categoryList.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedCategories[type].length > 0 && (
          <Button
            size="small"
            color="secondary"
            onClick={() => handleClearCategory(type)}
            sx={{ 
              mt: 1,
              minWidth: 'auto',
              px: 1
            }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Box>
  );

  const getTotalSelectedCount = () => {
    return selectedCategories.class.length + 
           selectedCategories.month.length + 
           selectedCategories.custom.length;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LabelIcon />
            Assign Categories to Folder
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <FolderIcon color="primary" />
              <Typography variant="h6">{folderName}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Collection: {collectionName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selected Categories: {getTotalSelectedCount()}
            </Typography>
          </Paper>

          <Alert severity="info" sx={{ mb: 2 }}>
            Select categories to help students filter and find this folder more easily.
            You can select multiple categories from each type.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              {renderCategorySelect('class', 'By Class', categories.class)}
            </Grid>
            
            <Grid item xs={12}>
              {renderCategorySelect('month', 'By Month', categories.month)}
            </Grid>
            
            {categories.custom.length > 0 && (
              <Grid item xs={12}>
                {renderCategorySelect('custom', 'Custom Categories', categories.custom)}
              </Grid>
            )}
          </Grid>

          {getTotalSelectedCount() > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Selected Categories Preview:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedCategories.class.map(catId => {
                  const cat = categories.class.find(c => c.id === catId);
                  return cat ? (
                    <Chip 
                      key={catId} 
                      label={`Class: ${cat.name}`} 
                      size="small" 
                      color="primary" 
                    />
                  ) : null;
                })}
                {selectedCategories.month.map(catId => {
                  const cat = categories.month.find(c => c.id === catId);
                  return cat ? (
                    <Chip 
                      key={catId} 
                      label={`Month: ${cat.name}`} 
                      size="small" 
                      color="secondary" 
                    />
                  ) : null;
                })}
                {selectedCategories.custom.map(catId => {
                  const cat = categories.custom.find(c => c.id === catId);
                  return cat ? (
                    <Chip 
                      key={catId} 
                      label={`Custom: ${cat.name}`} 
                      size="small" 
                      color="default" 
                    />
                  ) : null;
                })}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          {getTotalSelectedCount() > 0 && (
            <Button 
              onClick={handleClearAllCategories}
              color="secondary"
              sx={{ mr: 'auto' }}
            >
              Clear All Categories
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Categories'}
          </Button>
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

export default FolderCategoryAssignment;
