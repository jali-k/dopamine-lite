import React, { useEffect } from "react";
import { fireDB } from "../../firebaseconfig"; // Adjust the path to your Firebase config
import { addDoc, collection } from "firebase/firestore";
import { useUser } from "../contexts/UserProvider";

export default function KeyPressTracker() {
  const { user, isAdmin } = useUser(); // Get the currently logged-in user

  useEffect(() => {
    const handleKeyDown = async (event) => {

      // Check for key combinations
      if ((event.ctrlKey || event.metaKey) && event.key === "I") {
        console.log("DevTools shortcut detected: Ctrl+I or Cmd+I");
        await logKeyCombination(user?.email, "Ctrl+I / Cmd+I");
        event.preventDefault();
      }

      if (event.key === "F12") {
        console.log("DevTools shortcut detected: F12");
        await logKeyCombination(user?.email, "F12");
        event.preventDefault();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "U") {
        console.log("View source shortcut detected: Ctrl+U or Cmd+U");
        await logKeyCombination(user?.email, "Ctrl+U / Cmd+U");
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const logKeyCombination = async (email, combination) => {
    try {
      if (!email) {
        console.warn("User not logged in, cannot log key combination.");
        return;
      }

      const docRef = await addDoc(collection(fireDB, "keypress_logs"), {
        email,
        keyCombination: combination,
        timestamp: new Date().toISOString(),
      });

      console.log("Warning: Unauthorized key combination detected. This action has been logged.");
    } catch (error) {
      console.error("Error logging key combination:", error);
    }
  };

  return null;
};

