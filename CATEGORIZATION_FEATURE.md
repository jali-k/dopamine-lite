# Folder Categorization and Filtering System

## Overview

This update introduces a comprehensive categorization and filtering system for the Dopamine Lite application. Students can now easily find the folders they have access to using multiple filter criteria, while admins can organize folders into meaningful categories.

## Features

### For Students (FVStuPage)

- **Advanced Filtering**: Filter folders by class type, month, custom categories, and search terms
- **Smart Search**: Search folders by name with real-time filtering
- **Category Chips**: Visual indicators showing folder categories
- **Filter Count**: Shows how many folders match current filters
- **Collapsible Filters**: Clean UI with expandable filter options

### For Admins (FVAdPage)

- **Category Management**: Create, edit, and delete custom categories
- **Folder Assignment**: Assign multiple categories to folders
- **Visual Category Display**: See assigned categories as chips on folder cards
- **Batch Operations**: Manage categories for multiple folders
- **Default Categories**: Pre-configured class and month categories

## Category Types

### 1. By Class (Default Categories)

- Main Revision
- Quick Revision
- Paper Class
- Other

### 2. By Month (Default Categories)

- January through December

### 3. Custom Categories

- Admins can create unlimited custom categories
- Fully customizable names and organization

## How to Use

### For Students

1. Navigate to the video or PDF folder page
2. Use the search bar to find folders by name
3. Click the filter icon to expand category filters
4. Select one or more categories to filter folders
5. Clear individual filters or all filters at once

### For Admins

#### Managing Categories

1. Go to the admin folder page (video or PDF)
2. Click the "Manage" button in the top right
3. Select "Manage Categories"
4. Add, edit, or delete custom categories
5. Default categories cannot be deleted but can be renamed

#### Assigning Categories to Folders

1. **Method 1**: Right-click on any folder to open category assignment
2. **Method 2**: Click the "Categories" button below any folder
3. **Method 3**: Categories are automatically prompted when creating new folders
4. Select categories from each type (class, month, custom)
5. Save to apply the categories

## Database Structure

### Categories Collection

```javascript
{
  id: "category-id",
  name: "Category Name",
  type: "class|month|custom",
  order: 1,
  isDefault: true|false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Folder Categories

```javascript
{
  // Existing folder fields...
  categories: {
    class: ["main-revision", "quick-revision"],
    month: ["january", "february"],
    custom: ["advanced-topics"]
  },
  updatedAt: timestamp
}
```

## Implementation Details

### Key Components

- **FolderFilter**: Student-facing filter component
- **CategoryManagement**: Admin category management dialog
- **FolderCategoryAssignment**: Admin folder category assignment
- **categoryService**: Backend service for category operations

### Manual Initialization

- Admins can initialize default categories using the "Initialize Default Categories" button
- Only needs to be done once when setting up the system
- No automatic setup - gives admins full control

### Performance Considerations

- Client-side filtering for responsive user experience
- Optimized queries with proper indexing
- Lazy loading of category data

## Future Enhancements

1. **Bulk Category Assignment**: Assign categories to multiple folders at once
2. **Category Analytics**: Show usage statistics for categories
3. **Smart Suggestions**: AI-powered category suggestions based on folder names
4. **Category Hierarchies**: Nested categories for more complex organization
5. **Export/Import**: Backup and restore category configurations

## Technical Notes

- All category operations are optimized for Firebase Firestore
- Real-time updates ensure data consistency across users
- Error handling includes graceful fallbacks for network issues
- Mobile-responsive design for all screen sizes

## Migration

Existing folders will continue to work without categories. They will show up in searches and when no category filters are applied. Admins can gradually assign categories to existing folders as needed.
