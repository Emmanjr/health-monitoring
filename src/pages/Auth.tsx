// src/pages/Auth.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
} from "@mui/material";
import { styled } from "@mui/material/styles";

const Container = styled(Box)(() => ({
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f5f5f5",
}));

const FormWrapper = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  width: "100%",
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export default function Auth() {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const navigate = useNavigate();

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
    setSnackbarMessage("");
  };

  const handleSubmit = async () => {
    try {
      if (!email || !password || (isSignup && !name)) {
        showSnackbar("Please fill in all required fields.", "error");
        return;
      }

      if (isSignup) {
        // Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), { name, email, role });
        showSnackbar("Successfully signed up!", "success");
        setTimeout(() => {
          // Navigate to onboarding screens after signup
          navigate("/onboarding");
        }, 2000);
      } else {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData) {
          showSnackbar("No user profile found. Please sign up.", "warning");
          return;
        }

        showSnackbar("Successfully logged in!", "success");
        setTimeout(() => {
          navigate(`/${userData.role}`);
        }, 2000);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  return (
    <Container>
      <FormWrapper elevation={3}>
        <Typography variant="h5" align="center" gutterBottom>
          {isSignup ? "Create an Account" : "Login to Your Account"}
        </Typography>

        {isSignup && (
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <TextField
          label="Email"
          type="email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isSignup && (
          <FormControl fullWidth>
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

        <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
          {isSignup ? "Sign Up" : "Log In"}
        </Button>

        <Button variant="text" color="secondary" fullWidth onClick={toggleMode}>
          {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </Button>
      </FormWrapper>

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
