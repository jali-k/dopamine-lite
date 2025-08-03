import { initializeDefaultCategories } from './services/categoryService';

// Initialize categories when the app starts
export const initializeApp = async () => {
  try {
    console.log('Initializing application...');
    await initializeDefaultCategories();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
};

// Call this function when the app starts
initializeApp();
