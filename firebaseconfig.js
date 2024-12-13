import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);
const gprovider = new GoogleAuthProvider();
// gprovider.setCustomParameters({
//   prompt: "select_account",
//   // Add your custom domain to allowed origins
//   authDomain: 'dopamineapplite.com'
// });
// gprovider.setCustomParameters({ prompt: "select_account" });

gprovider.addScope('email');
gprovider.addScope('profile');

// auth.onAuthStateChanged((user) => {
//   console.log('Auth state changed:', user);
// });

// auth.onIdTokenChanged((user) => {
//   console.log('ID token changed:', user);
// });

export {
  auth as fireauth,
  storage as fireStorage,
  db as fireDB,
  app as fireapp,
  gprovider,
};
