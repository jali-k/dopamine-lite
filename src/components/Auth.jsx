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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from 'firebase/auth';

export default function Auth({ open = true }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastGoogleUser, setLastGoogleUser] = useState(null);
  const navigator = useNavigate();

  useEffect(() => {
    // Check if user is already logged in with Google
    const auth = getAuth();
    const savedUser = localStorage.getItem('lastGoogleUser');

    if (savedUser) {
      setLastGoogleUser(JSON.parse(savedUser));
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.providerData[0].providerId === 'google.com') {
        const userData = {
          email: user.email,
          photoURL: user.photoURL,
          displayName: user.displayName
        };
        setLastGoogleUser(userData);
        localStorage.setItem('lastGoogleUser', JSON.stringify(userData));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = await swggle(!!lastGoogleUser);
      if (user) {
        navigator("/");
      }
    } catch (err) {
      setError(err.message);
      setLastGoogleUser(null);
      localStorage.removeItem('lastGoogleUser');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    setLastGoogleUser(null);
    localStorage.removeItem('lastGoogleUser');
    const auth = getAuth();
    await auth.signOut();
  };

  const handleEmailLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = await emailLogin(email, password);
      navigator("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = await emailRegister(email, password);
      navigator("/");
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

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        {lastGoogleUser ? (
          <>
            <BT
              variant="contained"
              color="success"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 2,
                padding: '10px 15px',
                textTransform: 'none'
              }}
            >
              {lastGoogleUser.photoURL && (
                <img
                  src={lastGoogleUser.photoURL}
                  alt="Profile"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%'
                  }}
                />
              )}
              Continue as {lastGoogleUser.displayName || lastGoogleUser.email}
            </BT>
            <T
              variant="body2"
              sx={{
                textAlign: 'center',
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={handleUseDifferentAccount}
            >
              Use a different account
            </T>
          </>
        ) : (
          <BT
            startIcon={<GoogleIcon />}
            variant="contained"
            color="success"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            fullWidth
          >
            Sign In With Google
          </BT>
        )}

        <T variant="body1" sx={{ textAlign: "center", color: 'text.secondary' }}>
          Or sign in with email
        </T>

        <TF
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          disabled={isLoading}
        />
        <TF
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          disabled={isLoading}
        />

        <BT
          variant="contained"
          color="primary"
          onClick={isRegistering ? handleEmailRegister : handleEmailLogin}
          disabled={isLoading}
          fullWidth
        >
          {isLoading
            ? "Processing..."
            : (isRegistering ? "Register" : "Sign In") + " with Email"
          }
        </BT>

        <T
          variant="body2"
          sx={{
            textAlign: "center",
            cursor: "pointer",
            color: 'primary.main',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={handleToggleMode}
        >
          {isRegistering
            ? "Already have an account? Sign In"
            : "Create an Account"
          }
        </T>

        <T variant="body2" sx={{ textAlign: "center", color: 'text.secondary' }}>
          Please sign in to continue
        </T>
      </P>
    </M>
  );
}