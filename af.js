import { getAuth, signInWithPopup as sgnp, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { fireauth, gprovider } from "./firebaseconfig";

// Centralized error mapping for Firebase authentication errors
const mapAuthError = (error) => {
  // Firebase error codes reference
  const errorMap = {
    // User-related errors
    'auth/invalid-email': 'The email address is not valid.',
    'auth/user-disabled': 'This user account has been disabled.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect credentials. Please try again.',
    
    // Registration-specific errors
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    
    // Password-related errors
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    
    // Network and other errors
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/too-many-requests': 'Too many login attempts. Please try again later.',
    
    // Google Sign-In specific errors
    'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
  };

  // Check if the error has a specific code, otherwise use a generic message
  return errorMap[error.code] || 'An unexpected error occurred. Please try again.';
};

// This is your Google login function
export const swggle = async () => {
  try {
    // Try to sign out any existing session
    try {
      await fireauth.signOut();
    } catch (e) {
      // Ignore signout errors
    }

    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const res = await sgnp(fireauth, gprovider);
    if (!res || !res.user) {
      throw new Error('Login failed. Please try again.');
    }
    return res.user;
  } catch (error) {
    console.error("Google login error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('The sign-in was cancelled. Please try again.');
    }
    throw new Error(mapAuthError(error));
  }
};

// Email/Password login
export const emailLogin = async (email, password) => {
  // Basic client-side validation
  if (!email) throw new Error('Please enter an email address.');
  if (!password) throw new Error('Please enter a password.');

  try {
    const userCredential = await signInWithEmailAndPassword(fireauth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Email login error:", error);
    throw new Error(mapAuthError(error));
  }
};

// Function to register with email and password
export const emailRegister = async (email, password) => {
  // Enhanced client-side validation
  if (!email) throw new Error('Please enter an email address.');
  if (!password) throw new Error('Please enter a password.');
  
  // Optional: Add password strength check
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(fireauth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw new Error(mapAuthError(error));
  }
};

export const signOut = async () => {
  try {
    await fireauth.signOut();
  } catch (error) {
    console.error("Sign out error:", error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const jhsfg = (xgf) => {
  return String.fromCharCode(...xgf);
};
