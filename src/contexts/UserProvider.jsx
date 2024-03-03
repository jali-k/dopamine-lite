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
  const [user, uloading, error] = useAuthState(fireauth);
  const adminsref = collection(fireDB, "admins");
  const [admins, admloading] = useCollectionData(adminsref, {
    idField: "email",
  });

  const [isAdmin, setAdmin] = useState(false);

  // how to use set interval
  useEffect(() => {
    const interval = setInterval(() => {
      const t0 = Date.now();
      debugger;
      const t1 = Date.now();
      console.log(`DevTools ${t0 === t1 ? "is not" : "is"} open.`);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setAdmin(false);

    if (admins && user) {
      const admin = admins.find((admin) => admin.email === user.email);
      if (admin) {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    }
  }, [user, admins, admloading, uloading]);

  if (uloading || admloading) {
    return <Loading text="Checking User Data" />;
  }
  if (user) {
    return (
      <UserContext.Provider value={{ user, isAdmin, uloading, error }}>
        {children}
      </UserContext.Provider>
    );
  }

  return <Auth />;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
