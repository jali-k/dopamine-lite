import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Grid,
  Button,
  Collapse,
  IconButton,
  Badge,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import {
  getCategories,
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

const FolderFilter = ({ onFilterChange, totalFolders, filteredCount }) => {
  const [categories, setCategories] = useState({ class: [], month: [], custom: [] });
  const [selectedFilters, setSelectedFilters] = useState({
    class: [],
    month: [],
    custom: [],
    search: ''
  });
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    onFilterChange(selectedFilters);
  }, [selectedFilters, onFilterChange]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    setLoading(false);
  };

  const handleCategoryChange = (type, event) => {
    const value = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    setSelectedFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSearchChange = (event) => {
    setSelectedFilters(prev => ({
      ...prev,
      search: event.target.value
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      class: [],
      month: [],
      custom: [],
      search: ''
    });
  };

  const clearFilter = (type, value = null) => {
    if (type === 'search') {
      setSelectedFilters(prev => ({ ...prev, search: '' }));
    } else if (value) {
      setSelectedFilters(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item !== value)
      }));
    } else {
      setSelectedFilters(prev => ({ ...prev, [type]: [] }));
    }
  };

  const getActiveFiltersCount = () => {
    return selectedFilters.class.length + 
           selectedFilters.month.length + 
           selectedFilters.custom.length +
           (selectedFilters.search ? 1 : 0);
  };

  const hasActiveFilters = () => {
    return getActiveFiltersCount() > 0;
  };

  const renderCategorySelect = (type, label, categoryList) => (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selectedFilters[type]}
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
                  onDelete={() => clearFilter(type, value)}
                  onMouseDown={(e) => e.stopPropagation()}
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
  );

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
      {/* Filter Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Badge badgeContent={getActiveFiltersCount()} color="primary">
            <FilterIcon />
          </Badge>
          <Typography variant="h6">
            Filter Folders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({filteredCount} of {totalFolders} folders)
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {hasActiveFilters() && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              color="secondary"
            >
              Clear All
            </Button>
          )}
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Search Bar - Always Visible */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search folders by name..."
        value={selectedFilters.search}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: selectedFilters.search && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => clearFilter('search')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: expanded ? 2 : 0 }}
      />

      {/* Category Filters - Collapsible */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            {renderCategorySelect('class', 'By Class', categories.class)}
          </Grid>
          
          <Grid item xs={12} sm={4}>
            {renderCategorySelect('month', 'By Month', categories.month)}
          </Grid>
          
          {categories.custom.length > 0 && (
            <Grid item xs={12} sm={4}>
              {renderCategorySelect('custom', 'Custom', categories.custom)}
            </Grid>
          )}
        </Grid>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedFilters.search && (
                <Chip
                  label={`Search: "${selectedFilters.search}"`}
                  size="small"
                  onDelete={() => clearFilter('search')}
                  color="default"
                />
              )}
              {selectedFilters.class.map(catId => {
                const cat = categories.class.find(c => c.id === catId);
                return cat ? (
                  <Chip 
                    key={catId} 
                    label={`Class: ${cat.name}`} 
                    size="small" 
                    onDelete={() => clearFilter('class', catId)}
                    color="primary" 
                  />
                ) : null;
              })}
              {selectedFilters.month.map(catId => {
                const cat = categories.month.find(c => c.id === catId);
                return cat ? (
                  <Chip 
                    key={catId} 
                    label={`Month: ${cat.name}`} 
                    size="small" 
                    onDelete={() => clearFilter('month', catId)}
                    color="secondary" 
                  />
                ) : null;
              })}
              {selectedFilters.custom.map(catId => {
                const cat = categories.custom.find(c => c.id === catId);
                return cat ? (
                  <Chip 
                    key={catId} 
                    label={`${cat.name}`} 
                    size="small" 
                    onDelete={() => clearFilter('custom', catId)}
                    color="default" 
                  />
                ) : null;
              })}
            </Box>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default FolderFilter;
