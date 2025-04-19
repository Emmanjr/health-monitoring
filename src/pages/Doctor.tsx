// src/DoctorDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// Material UI Components
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

// For appointments interface
interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: any;
  status: string;
}

// For patient user data
interface PatientData {
  age?: string;
  gender?: string;
  bmi?: string;
  ethnicity?: string;
  diet?: string;
  alcoholUse?: string;
  smokingHabits?: string;
  stressLevels?: string;
  physicalActivity?: string;
  name?: string;
  email?: string;
  // etc...
}

// ------------------ Custom Hooks ------------------ //

// Fetch current doctor name
const useDoctorName = () => {
  const [doctorName, setDoctorName] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.name) {
            setDoctorName(data.name);
          }
        }
      } catch (error: any) {
        setError("Error fetching doctor name: " + error.message);
      }
    };
    fetchDoctorName();
  }, []);
  return { doctorName, error };
};

// Fetch appointments for this doctor
const useAppointments = (doctorName: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.currentUser || !doctorName) return;
    const q = query(
      collection(db, "appointments"),
      where("doctorName", "==", doctorName)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const appts = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            patientName: data.patientName,
            doctorName: data.doctorName,
            appointmentDate: data.appointmentDate,
            status: data.status,
          };
        });
        setAppointments(appts);
      },
      (error) => {
        setError("Error fetching appointments: " + error.message);
      }
    );
    return () => unsubscribe();
  }, [doctorName]);

  const handleAppointmentAction = async (appointmentId: string, newStatus: string) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });
    } catch (error: any) {
      alert(`Error updating appointment: ${error.message}`);
    }
  };

  return { appointments, error, handleAppointmentAction };
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { doctorName, error: doctorError } = useDoctorName();
  const { appointments, error: appsError, handleAppointmentAction } = useAppointments(doctorName);

  // ------------------- New States for Patient Selection ------------------- //
  const [patients, setPatients] = useState<any[]>([]); // all patients from Firestore
  const [selectedPatientId, setSelectedPatientId] = useState(""); // ID of selected patient
  const [patientData, setPatientData] = useState<PatientData | null>(null); // lifestyle data
  const [healthRecords, setHealthRecords] = useState<any[]>([]); // vitals for selected patient

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  // ------------------- Helpers ------------------- //
  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error: any) {
      showSnackbar("Error signing out: " + error.message, "error");
    }
  };

  // ------------------- 1) Fetch All Patients ------------------- //
  useEffect(() => {
    const fetchAllPatients = async () => {
      try {
        // Query users with role "patient"
        const q = query(collection(db, "users"), where("role", "==", "patient"));
        const snapshot = await getDocs(q);
        const patientList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPatients(patientList);
      } catch (error: any) {
        showSnackbar("Error fetching patients: " + error.message, "error");
      }
    };
    fetchAllPatients();
  }, []);

  // ------------------- 2) When a Patient is Selected, Fetch Their User Doc & Health Records ------------------- //
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientData(null);
      setHealthRecords([]);
      return;
    }

    // Fetch user doc for lifestyle data
    const fetchPatientData = async () => {
      try {
        const userRef = doc(db, "users", selectedPatientId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setPatientData(userSnap.data() as PatientData);
        } else {
          setPatientData(null);
        }
      } catch (error: any) {
        showSnackbar("Error fetching patient data: " + error.message, "error");
      }
    };

    // Fetch health records for selected patient
    // (We assume the 'healthRecords' doc has a 'userId' field matching the patient's UID)
    const q = query(collection(db, "healthRecords"), where("userId", "==", selectedPatientId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHealthRecords(records);
      },
      (error) => {
        showSnackbar("Error fetching health records: " + error.message, "error");
      }
    );

    fetchPatientData();
    return () => unsubscribe();
  }, [selectedPatientId]);

  // ------------------- Render ------------------- //
  return (
    <Container maxWidth="sm" sx={{ py: 2, px: 1 }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Doctor Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Select a Patient */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select a Patient
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="patient-select-label">Patient</InputLabel>
          <Select
            labelId="patient-select-label"
            value={selectedPatientId}
            label="Patient"
            onChange={(e) => setSelectedPatientId(e.target.value as string)}
          >
            <MenuItem value="">-- Select Patient --</MenuItem>
            {patients.map((pt) => (
              <MenuItem key={pt.id} value={pt.id}>
                {pt.name} {/* the 'name' field from Firestore */}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Patient Lifestyle Data */}
      {patientData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {patientData.name}'s Lifestyle Info
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">Age: {patientData.age}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Gender: {patientData.gender}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">BMI: {patientData.bmi}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Ethnicity: {patientData.ethnicity}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Diet: {patientData.diet}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Alcohol Use: {patientData.alcoholUse}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Smoking: {patientData.smokingHabits}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Stress: {patientData.stressLevels}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Activity: {patientData.physicalActivity}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Patient Health Records */}
      {healthRecords.length > 0 && (
        <Paper sx={{ mb: 3, p: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            {patientData?.name}'s Health Records
          </Typography>
          <List>
            {healthRecords.map((record) => (
              <ListItem key={record.id} divider>
                <ListItemText
                  primary={`BP: ${record.bp} | HR: ${record.heartRate} | Temp: ${record.temperature}`}
                  secondary={
                    record.timestamp
                      ? new Date(record.timestamp.toDate()).toLocaleString()
                      : ""
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Appointments Section */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Your Appointments ({appointments.length})
        </Typography>
        {appsError && (
          <Typography color="error" variant="body2">
            {appsError}
          </Typography>
        )}
        {appointments.length > 0 ? (
          <Paper sx={{ p: 1 }}>
            <List>
              {appointments.map((appt) => (
                <ListItem key={appt.id} divider>
                  <ListItemText
                    primary={`${appt.patientName}`}
                    secondary={
                      <>
                        <Typography variant="body2">
                          Date: {appt.appointmentDate?.toDate().toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          Status: {appt.status}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleAppointmentAction(appt.id, "approved")}
                        disabled={appt.status === "approved"}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleAppointmentAction(appt.id, "declined")}
                        disabled={appt.status === "declined"}
                      >
                        Decline
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <Typography variant="body2">No appointments found.</Typography>
        )}
      </Box>

      {/* Snackbar */}
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
