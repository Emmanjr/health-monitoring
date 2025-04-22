// src/pages/Auth.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Link,
  Grid,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";

const Container = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "white",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  position: "relative", 
  // removed padding
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  }
}));

const FormWrapper = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  width: "100%",
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  boxShadow: "0 8px 40px -12px rgba(0,0,0,0.4)",
  position: "relative",
  zIndex: 2,
}));

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  // Form validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");

  // Check if user is already signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            navigate(`/${userData.role}`);
          }
        } catch (error) {
          console.error("Error checking user role:", error);
        }
      }
      setIsAuthChecked(true);
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setEmail("");
    setPassword("");
    setName("");
    setRole("patient");
    setEmailError("");
    setPasswordError("");
    setNameError("");
  };

  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    // Name validation for signup
    if (isSignup && !name) {
      setNameError("Name is required");
      isValid = false;
    } else {
      setNameError("");
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isSignup) {
        // Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), { 
          name, 
          email, 
          role,
          createdAt: new Date()
        });
        showSnackbar("Successfully signed up!", "success");
        setTimeout(() => {
          // Navigate to onboarding screens after signup
          navigate("/onboarding");
        }, 1500);
      } else {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData) {
          showSnackbar("No user profile found. Please sign up.", "warning");
          setLoading(false);
          return;
        }

        showSnackbar("Successfully logged in!", "success");
        setTimeout(() => {
          navigate(`/${userData.role}`);
        }, 1500);
      }
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        showSnackbar("No user found with this email. Please sign up.", "error");
      } else if (error.code === 'auth/wrong-password') {
        showSnackbar("Incorrect password. Please try again.", "error");
      } else if (error.code === 'auth/email-already-in-use') {
        showSnackbar("This email is already registered. Please log in instead.", "error");
      } else {
        showSnackbar(error.message || "Authentication failed", "error");
      }
      setLoading(false);
    } finally {
      if (!snackbarOpen) {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      showSnackbar("Please enter your email address", "warning");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      showSnackbar("Please enter a valid email address", "warning");
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showSnackbar("Password reset email sent. Please check your inbox.", "success");
      setResetDialogOpen(false);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        showSnackbar("No account found with this email address", "error");
      } else {
        showSnackbar(error.message || "Failed to send reset email", "error");
      }
    }
  };

  const handleAdminLogin = async () => {
    setEmail("admin@gmail.com");
    setPassword("1234567890");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, "admin@gmail.com", "1234567890");
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        showSnackbar("Admin account not found", "error");
        return;
      }
      
      showSnackbar("Logged in with Admin account!", "success");
      setTimeout(() => {
        navigate(`/${userData.role}`);
      }, 1500);
    } catch (error: any) {
      showSnackbar("Admin login failed. Please try again or use regular login.", "error");
    }
  };

  if (!isAuthChecked) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        backgroundColor: "white",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }
      }}>
        <CircularProgress sx={{ color: 'white', position: 'relative', zIndex: 2 }} />
      </Box>
    );
  }

  return (
    <Container>
      <FormWrapper elevation={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <HealthAndSafetyIcon sx={{ fontSize: 36, color: '#3498db', mb: 1 }} />
          <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
            Health Monitor
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            {isSignup ? "Create your account" : "Sign in to your account"}
          </Typography>
        </Box>

        {isSignup && (
          <TextField
            label="Full Name"
            variant="outlined"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#3498db' }} />
                </InputAdornment>
              ),
            }}
          />
        )}

        <TextField
          label="Email"
          type="email"
          variant="outlined"
          size="small"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!emailError}
          helperText={emailError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: '#3498db' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          size="small"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!passwordError}
          helperText={passwordError}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: '#3498db' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {isSignup && (
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as string)}
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        )}

        {!isSignup && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link 
              component="button"
              variant="body2"
              onClick={() => setResetDialogOpen(true)}
              sx={{ textDecoration: 'none', fontSize: '0.8rem' }}
            >
              Forgot password?
            </Link>
          </Box>
        )}

        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          onClick={handleSubmit}
          disabled={loading}
          sx={{ 
            py: 1,
            mt: 1,
            bgcolor: '#3498db',
            '&:hover': {
              bgcolor: '#2980b9',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            isSignup ? "Sign Up" : "Log In"
          )}
        </Button>

        <Divider sx={{ my: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            OR
          </Typography>
        </Divider>

        {!isSignup && (
          <Button
            variant="outlined"
            fullWidth
            onClick={handleAdminLogin}
            sx={{ mb: 1 }}
            size="small"
          >
          Login as Admin
          </Button>
        )}

        <Button 
          variant="text" 
          color="primary" 
          fullWidth 
          onClick={toggleMode}
          sx={{ fontWeight: 'medium', fontSize: '0.9rem' }}
        >
          {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </Button>
      </FormWrapper>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">Send Reset Link</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
