import {
  Button as BT,
  Modal as M,
  Paper as P,
  Typography as T,
  TextField as TF,
  Alert,
  Box,
  Divider,
  Stack
} from "@mui/material";
import {
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  School as SchoolIcon,
  Google as GoogleIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { swggle, emailLogin, emailRegister } from "../../af";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from 'firebase/auth';

const GoogleButton = ({ onClick, disabled, children }) => (
  <BT
    onClick={onClick}
    disabled={disabled}
    fullWidth
    sx={{
      py: 1.5,
      textTransform: 'none',
      bgcolor: '#ffffff',
      color: '#444444',
      border: '1px solid #dddddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      '&:hover': {
        bgcolor: '#f8f8f8',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      },
      display: 'flex',
      gap: 2,
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
    {children}
  </BT>
);

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
          bgcolor: 'background.paper',
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: '90%', sm: '450px' },
          maxWidth: '500px',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header with DNA-like design */}
        <Box
          sx={{
            bgcolor: 'customColors.cytoplasm',
            p: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(46, 125, 50, 0.15) 0%, transparent 50%),
                               radial-gradient(circle at 80% 70%, rgba(46, 125, 50, 0.1) 0%, transparent 50%)`,
            }
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <BiotechIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <T variant="h4" sx={{
              fontFamily: 'Quicksand, Arial, sans-serif',
              fontWeight: 600,
              color: 'primary.main'
            }}>
              Dopamine Lite
            </T>
          </Stack>
          <T variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
            {isRegistering ? "Join our biology learning community" : "Welcome back to your studies"}
          </T>
        </Box>

        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {lastGoogleUser ? (
            <Stack spacing={2}>
              <GoogleButton
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                Continue as {lastGoogleUser.displayName || lastGoogleUser.email}
              </GoogleButton>
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
            </Stack>
          ) : (
            <GoogleButton
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Sign in with Google
            </GoogleButton>
          )}

          <Divider sx={{ my: 3 }}>
            <T variant="body2" sx={{ color: 'text.secondary', px: 1 }}>
              or continue with email
            </T>
          </Divider>

          <Stack spacing={2}>
            <TF
              label="Email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={isLoading}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
              }}
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
              onClick={isRegistering ? handleEmailRegister : handleEmailLogin}
              disabled={isLoading}
              fullWidth
              sx={{
                py: 1.5,
                textTransform: 'none',
                mt: 1
              }}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <EmailIcon sx={{ mr: 1 }} />
                  {isRegistering ? "Sign up with Email" : "Sign in with Email"}
                </>
              )}
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
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </T>

            <T
              variant="body2"
              sx={{
                textAlign: "center",
                color: 'text.secondary',
                bgcolor: 'customColors.cytoplasm',
                p: 1,
                borderRadius: 1
              }}
            >
              Your gateway to biology education
            </T>
          </Stack>
        </Box>
      </P>
    </M>
  );
}