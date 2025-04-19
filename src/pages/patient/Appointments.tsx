// src/pages/patient/Appointments.tsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

export default function Appointments() {
  // State for patient name (fetched from Firestore)
  const [patientName, setPatientName] = useState("");
  // List of doctors from Firestore
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error" | "warning" | "info">("info");

  // Helper for showing snackbar
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 1) Fetch the current patient's name from Firestore
  useEffect(() => {
    const fetchPatientName = async () => {
      if (!auth.currentUser) return;
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.name) {
            setPatientName(userData.name);
          }
        }
      } catch (error: any) {
        showSnackbar("Error fetching patient name: " + error.message, "error");
      }
    };
    fetchPatientName();
  }, []);

  // 2) Fetch list of doctors from Firestore (users with role "doctor")
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "doctor"));
        const querySnapshot = await getDocs(q);
        const doctorList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, name: data.name };
        });
        setDoctors(doctorList);
      } catch (error: any) {
        showSnackbar("Error fetching doctors: " + error.message, "error");
      }
    };
    fetchDoctors();
  }, []);

  // 3) Book Appointment (including patientName in the doc)
  const bookAppointment = async () => {
    if (!auth.currentUser) return;
    if (!doctorName) {
      showSnackbar("Please select a doctor.", "warning");
      return;
    }
    try {
      const appointmentTimestamp = appointmentDate
        ? Timestamp.fromDate(new Date(appointmentDate))
        : Timestamp.now();

      await addDoc(collection(db, "appointments"), {
        patientId: auth.currentUser.uid,
        patientName, // <-- Include the patient's name
        doctorName,
        appointmentDate: appointmentTimestamp,
        status: "Pending",
      });

      setDoctorName("");
      setAppointmentDate("");
      showSnackbar("Appointment booked successfully!", "success");
    } catch (error: any) {
      showSnackbar("Error booking appointment: " + error.message, "error");
    }
  };

  // 4) Real-time listener for appointments (for the current patient)
  useEffect(() => {
    if (!auth.currentUser) return;
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", auth.currentUser.uid)
    );
    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const apps = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAppointments(apps);
      },
      (error) => {
        showSnackbar("Error fetching appointments: " + error.message, "error");
      }
    );
    return () => unsubscribeAppointments();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Book Appointment Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Schedule an Appointment
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="doctor-select-label">Select Doctor</InputLabel>
            <Select
              labelId="doctor-select-label"
              value={doctorName}
              label="Select Doctor"
              onChange={(e) => setDoctorName(e.target.value)}
            >
              {doctors.map((doc) => (
                <MenuItem key={doc.id} value={doc.name}>
                  {doc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Appointment Date & Time"
            type="datetime-local"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            sx={{ minWidth: 220 }}
          />
        </Box>
        <Button variant="contained" onClick={bookAppointment}>
          Book Appointment
        </Button>
      </Box>

      {/* Display Appointments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Your Appointments
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="appointments-table">
            <TableHead>
              <TableRow>
                <TableCell>Doctor Name</TableCell>
                <TableCell>Appointment Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.doctorName}</TableCell>
                  <TableCell>
                    {app.appointmentDate
                      ? app.appointmentDate.toDate().toLocaleString()
                      : ""}
                  </TableCell>
                  <TableCell>{app.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
