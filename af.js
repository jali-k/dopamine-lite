import { getAuth, signInWithPopup as sgnp, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider } from "firebase/auth";
import { fireauth, gprovider } from "./firebaseconfig";

const mapAuthError = (error) => {
  const errorMap = {
    'auth/invalid-email': 'The email address is not valid.',
    'auth/user-disabled': 'This user account has been disabled.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect credentials. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/too-many-requests': 'Too many login attempts. Please try again later.',
    'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
  };
  return errorMap[error.code] || 'An unexpected error occurred. Please try again.';
};

export const swggle = async (skipPrompt = false) => {
  try {
    const auth = getAuth();

    if (skipPrompt) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser?.providerData?.[0]?.providerId === 'google.com') {
          return currentUser;
        }
      } catch (e) {
        console.error("Error checking current user:", e);
      }
    }

    const provider = new GoogleAuthProvider();
    if (!skipPrompt) {
      provider.setCustomParameters({
        prompt: 'select_account'
      });
    }

    const result = await sgnp(auth, provider);
    if (result?.user) {
      const userData = {
        email: result.user.email,
        photoURL: result.user.photoURL,
        displayName: result.user.displayName
      };
      localStorage.setItem('lastGoogleUser', JSON.stringify(userData));
      return result.user;
    }
    throw new Error('Login failed. Please try again.');
  } catch (error) {
    console.error("Google login error:", error);
    localStorage.removeItem('lastGoogleUser');
    throw new Error(mapAuthError(error));
  }
};

export const emailLogin = async (email, password) => {
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

export const emailRegister = async (email, password) => {
  if (!email) throw new Error('Please enter an email address.');
  if (!password) throw new Error('Please enter a password.');

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
    const auth = getAuth();
    await auth.signOut();
    localStorage.removeItem('lastGoogleUser');
  } catch (error) {
    console.error("Sign out error:", error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const jhsfg = (xgf) => {
  return String.fromCharCode(...xgf);
};