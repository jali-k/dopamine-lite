import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";

const NetworkStatus = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState(sessionStorage.getItem("networkError"));
  const [openSnackbar, setOpenSnackbar] = useState(!!error);

  useEffect(() => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        const errorMsg = "No internet connection. Please check your network.";
        setError(errorMsg);
        sessionStorage.setItem("networkError", errorMsg);
        setIsOnline(false);
        setOpenSnackbar(true);
      } else {
        setError(null);
        sessionStorage.removeItem("networkError");
        setIsOnline(true);
        setOpenSnackbar(false);
      }
    };

    window.addEventListener("offline", updateNetworkStatus);
    window.addEventListener("online", updateNetworkStatus);

    return () => {
      window.removeEventListener("offline", updateNetworkStatus);
      window.removeEventListener("online", updateNetworkStatus);
    };
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <>
      {/* Snackbar Alert for Network Errors */}
      <Snackbar
        open={openSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          severity="error" 
          sx={{ width: "100%" }} 
          onClose={() => setOpenSnackbar(false)} // Allow manual close
        >
          {error}
        </Alert>
      </Snackbar>

      {children}
    </>
  );
};

export default NetworkStatus;
