/* eslint-disable react/prop-types */
import {
  Button as BT,
  Modal as M,
  Paper as P,
  Typography as T,
} from "@mui/material";
import { swggle } from "../../af";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Auth({ open = true }) {
  const navigator = useNavigate();

  useEffect(() => {
    navigator("/");
  }, []);
  return (
    <M open={open}>
      <P
        sx={{
          bgcolor: "#f4f4f4",
          p: 4,
          minWidth: "300px",
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: "10px",
        }}
      >
        <T variant="h4" sx={{ fontWeight: "bold" }}>
          Educator
        </T>
        <BT
          startIcon={<GoogleIcon />}
          variant="contained"
          color="success"
          onClick={swggle}
        >
          Sign In With Google
        </BT>
        Please sign in to continue
      </P>
    </M>
  );
}
