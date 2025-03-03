import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";

const NetworkStatus = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("networkError"); // Clear old errors on mount

    const checkInternetConnection = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setError("No internet connection. Please check your network.");
        sessionStorage.setItem("networkError", "No internet connection.");
        setOpenSnackbar(true);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch("https://1.1.1.1/cdn-cgi/trace", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setIsOnline(true);
          setError(null);
          sessionStorage.removeItem("networkError");
          setOpenSnackbar(false);
        } else {
          throw new Error("No internet connection.");
        }
      } catch (err) {
        setIsOnline(false);
        setError("No internet connection. Please check your network.");
        sessionStorage.setItem("networkError", "No internet connection.");
        setOpenSnackbar(true);
      }
    };

    // Check network status every 5 seconds to detect changes
    const interval = setInterval(checkInternetConnection, 5000);

    // Listen for offline/online events
    window.addEventListener("offline", checkInternetConnection);
    window.addEventListener("online", checkInternetConnection);

    return () => {
      clearInterval(interval);
      window.removeEventListener("offline", checkInternetConnection);
      window.removeEventListener("online", checkInternetConnection);
    };
  }, []);

  const handleCloseSnackbar = () => {
    setTimeout(() => setOpenSnackbar(false), 500);
  };

  return (
    <>
      {/* Snackbar Alert for Network Errors */}
      <Snackbar
        open={openSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }} onClose={handleCloseSnackbar}>
          {error}
        </Alert>
      </Snackbar>

      {children}
    </>
  );
};

export default NetworkStatus;