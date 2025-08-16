/* eslint-disable no-debugger */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { fireDB, fireauth } from "../../firebaseconfig";
import { collection } from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Auth from "../components/Auth";
import Loading from "../components/Loading";
import { Fab } from "@mui/material";
import { AdminPanelSettingsOutlined, Visibility } from "@mui/icons-material";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, uloading, uerror] = useAuthState(fireauth);
  const adminsref = collection(fireDB, "admins");
  const [admins, admloading, admerror] = useCollectionData(adminsref, {
    idField: "email",
  });

  const [isAdmin, setAdmin] = useState(false);
  // Add a loading state that combines both auth and admin loading states
  const [loading, setLoading] = useState(true);

  // We'll keep the DevTools debugger functionality
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const t0 = Date.now();
  //     debugger;
  //     const t1 = Date.now();
  //     console.log(`DevTools ${t0 === t1 ? "is not" : "is"} open.`);
  //   }, 1000);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  useEffect(() => {
    setAdmin(false);

    // Only process the admin check when we have both user and admins data
    if (admins && user) {
      console.log("Checking admin status for:", user.email);
      const adminRecord = admins.find((admin) => admin.email === user.email);
      if (adminRecord) {
        console.log("User is admin:", user.email);
        setAdmin(true);
      } else {
        console.log("User is not admin:", user.email);
        setAdmin(false);
      }
      // Update the overall loading state when both auth and admin data are loaded
      setLoading(false);
    } else if (!uloading && !admloading) {
      // If loading is complete but no user or no admins, update loading state
      console.log("Loading complete, no user or no admins data");
      setLoading(false);
    }
  }, [user, admins, admloading, uloading]);

  // Show loading screen during initial load
  if (loading) {
    return <Loading text="Checking User Data" />;
  }

  // If user is authenticated, provide the user context
  if (user) {
    return (
      <UserContext.Provider value={{ 
        user, 
        isAdmin, 
        uloading: uloading || admloading, // Combine loading states for components
        error: uerror || admerror 
      }}>
        {children}
      </UserContext.Provider>
    );
  }

  // If no user is authenticated, show the auth component
  return <Auth />;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};