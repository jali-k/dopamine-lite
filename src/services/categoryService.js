import { fireDB } from '../../firebaseconfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';

const CATEGORIES_COLLECTION = 'categories';

// Initialize default categories if they don't exist
export const initializeDefaultCategories = async () => {
  try {
    const categoriesRef = collection(fireDB, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(categoriesRef);
    
    if (snapshot.empty) {
      // Create default categories
      const defaultCategories = [
        // By Class
        { id: 'main-revision', name: 'Main Revision', type: 'class', order: 1 },
        { id: 'quick-revision', name: 'Quick Revision', type: 'class', order: 2 },
        { id: 'paper-class', name: 'Paper Class', type: 'class', order: 3 },
        { id: 'other-class', name: 'Other', type: 'class', order: 4 },
        
        // By Month
        { id: 'january', name: 'January', type: 'month', order: 1 },
        { id: 'february', name: 'February', type: 'month', order: 2 },
        { id: 'march', name: 'March', type: 'month', order: 3 },
        { id: 'april', name: 'April', type: 'month', order: 4 },
        { id: 'may', name: 'May', type: 'month', order: 5 },
        { id: 'june', name: 'June', type: 'month', order: 6 },
        { id: 'july', name: 'July', type: 'month', order: 7 },
        { id: 'august', name: 'August', type: 'month', order: 8 },
        { id: 'september', name: 'September', type: 'month', order: 9 },
        { id: 'october', name: 'October', type: 'month', order: 10 },
        { id: 'november', name: 'November', type: 'month', order: 11 },
        { id: 'december', name: 'December', type: 'month', order: 12 }
      ];

      // Add each category to Firestore
      for (const category of defaultCategories) {
        await setDoc(doc(fireDB, CATEGORIES_COLLECTION, category.id), {
          ...category,
          createdAt: Timestamp.now(),
          isDefault: true
        });
      }
      
      console.log('Default categories initialized');
    }
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};

// Get all categories
export const getCategories = async () => {
  try {
    const categoriesRef = collection(fireDB, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(categoriesRef);
    
    const categories = {
      class: [],
      month: [],
      custom: []
    };
    
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      if (data.type === 'class') {
        categories.class.push(data);
      } else if (data.type === 'month') {
        categories.month.push(data);
      } else {
        categories.custom.push(data);
      }
    });
    
    // Sort by order
    categories.class.sort((a, b) => a.order - b.order);
    categories.month.sort((a, b) => a.order - b.order);
    categories.custom.sort((a, b) => a.order - b.order);
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { class: [], month: [], custom: [] };
  }
};

// Add a new category
export const addCategory = async (name, type, order = null) => {
  try {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const categoryDoc = doc(fireDB, CATEGORIES_COLLECTION, id);
    
    // Check if category already exists
    const existingDoc = await getDoc(categoryDoc);
    if (existingDoc.exists()) {
      throw new Error('Category already exists');
    }
    
    // If no order specified, get the next order number
    if (order === null) {
      const categories = await getCategories();
      const typeCategories = categories[type] || [];
      order = typeCategories.length > 0 ? Math.max(...typeCategories.map(c => c.order)) + 1 : 1;
    }
    
    await setDoc(categoryDoc, {
      id,
      name,
      type,
      order,
      createdAt: Timestamp.now(),
      isDefault: false
    });
    
    return { id, name, type, order };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (id, updates) => {
  try {
    const categoryDoc = doc(fireDB, CATEGORIES_COLLECTION, id);
    await updateDoc(categoryDoc, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category (only custom categories can be deleted)
export const deleteCategory = async (id) => {
  try {
    const categoryDoc = doc(fireDB, CATEGORIES_COLLECTION, id);
    const docSnap = await getDoc(categoryDoc);
    
    if (docSnap.exists() && !docSnap.data().isDefault) {
      await deleteDoc(categoryDoc);
    } else {
      throw new Error('Cannot delete default category');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Assign categories to a folder
export const assignCategoriesToFolder = async (folderName, collectionName, categories) => {
  try {
    const folderDoc = doc(fireDB, collectionName, folderName);
    await updateDoc(folderDoc, {
      categories: categories,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error assigning categories to folder:', error);
    throw error;
  }
};

// Get folders by categories
export const getFoldersByCategories = async (collectionName, categoryFilters = {}) => {
  try {
    const foldersRef = collection(fireDB, collectionName);
    const snapshot = await getDocs(foldersRef);
    
    let folders = [];
    snapshot.forEach((doc) => {
      folders.push({ id: doc.id, ...doc.data() });
    });
    
    // Apply category filters
    if (categoryFilters.class && categoryFilters.class.length > 0) {
      folders = folders.filter(folder => 
        folder.categories?.class && 
        categoryFilters.class.some(cat => folder.categories.class.includes(cat))
      );
    }
    
    if (categoryFilters.month && categoryFilters.month.length > 0) {
      folders = folders.filter(folder => 
        folder.categories?.month && 
        categoryFilters.month.some(cat => folder.categories.month.includes(cat))
      );
    }
    
    if (categoryFilters.custom && categoryFilters.custom.length > 0) {
      folders = folders.filter(folder => 
        folder.categories?.custom && 
        categoryFilters.custom.some(cat => folder.categories.custom.includes(cat))
      );
    }
    
    return folders;
  } catch (error) {
    console.error('Error getting folders by categories:', error);
    return [];
  }
};
