/* eslint-disable react/prop-types */
import {
  Button as BT,
  Modal as M,
  Paper as P,
  Typography as T,
  TextField as TF,
  Alert,
} from "@mui/material";
import { swggle, emailLogin, emailRegister } from "../../af";
import GoogleIcon from "@mui/icons-material/Google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth({ open = true }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const navigator = useNavigate();

  // Reset error when switching between login and register
  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  };

  // Function to handle Google Login
  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = await swggle();
      if (user) {
        navigator("/"); // Redirect on success
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle Email login
  const handleEmailLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = await emailLogin(email, password);
      navigator("/"); // Redirect on success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle Email register
  const handleEmailRegister = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = await emailRegister(email, password);
      navigator("/"); // Redirect on success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          {isRegistering ? "Create Account" : "Sign In"}
        </T>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Google Login Button */}
        <BT
          startIcon={<GoogleIcon />}
          variant="contained"
          color="success"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          Sign In With Google
        </BT>

        {/* Or Email Login Section */}
        <T variant="body1" sx={{ textAlign: "center" }}>
          Or sign in with email
        </T>
        <TF
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ width: "100%" }}
          disabled={isLoading}
        />
        <TF
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ width: "100%" }}
          disabled={isLoading}
        />

        {/* Email Login/Registration Button */}
        <BT
          variant="contained"
          color="primary"
          onClick={isRegistering ? handleEmailRegister : handleEmailLogin}
          disabled={isLoading}
        >
          {isLoading 
            ? "Processing..." 
            : (isRegistering ? "Register" : "Sign In") + " with Email"
          }
        </BT>

        {/* Toggle between Register/Login */}
        <T
          variant="body2"
          sx={{ textAlign: "center", cursor: "pointer" }}
          onClick={handleToggleMode}
        >
          {isRegistering 
            ? "Already have an account? Sign In" 
            : "Create an Account"
          }
        </T>

        {/* Message */}
        <T variant="body2" sx={{ textAlign: "center" }}>
          Please sign in to continue
        </T>
      </P>
    </M>
  );
}