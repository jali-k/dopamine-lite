/* eslint-disable react/prop-types */
import {
  LinearProgress as LP,
  Modal as M,
  Paper as P,
  Typography as T,
} from "@mui/material";
import React, { useEffect as uE } from "react";
import NetworkStatus from "../components/NetworkStatus";


export default function Loading({
  text = "Loading",
  progressbar = false,
  progress,
}) {
  const [dots, setDots] = React.useState(".");

  uE(() => {
    const interval = setInterval(() => {
      setDots((dots) => {
        if (dots.length < 3) {
          return dots + ".";
        } else {
          return "";
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <NetworkStatus loading={true}>
    <M open={true}>
      <P
        sx={{
          bgcolor: "white",
          p: 4,
          // minWidth: "300px",
          position: "absolute",
          py: 4,
          px: 6,
          width: { xs: "90%", sm: "450px" },
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          textAlign: "left",
        }}
      >
        <T variant="h7">
          {progressbar && `(${Math.round(progress)}%) `}
          {text + dots}
        </T>
        {progressbar ? <LP variant="determinate" value={progress} /> : <LP />}
      </P>
    </M>
    </NetworkStatus>
  );
}
