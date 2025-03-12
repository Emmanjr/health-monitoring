import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// MUI Components
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
} from "@mui/material";

export default function PatientDashboard() {
  const navigate = useNavigate();

  // ---------------------------
  // State for Vital Signs and Records
  // ---------------------------
  const [bp, setBP] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [records, setRecords] = useState<any[]>([]);

  // ---------------------------
  // State for Appointment Scheduling
  // ---------------------------
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);

  // ---------------------------
  // Patient Name (fetched from Firestore)
  // ---------------------------
  const [patientName, setPatientName] = useState("");

  // ---------------------------
  // Snackbar State for Notifications
  // ---------------------------
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error" | "warning" | "info">("info");

  // ---------------------------
  // Snackbar Helper Functions
  // ---------------------------
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  // ---------------------------
  // Logout Handler
  // ---------------------------
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to the login page
    } catch (error: any) {
      showSnackbar("Error signing out: " + error.message, "error");
    }
  };

  // ---------------------------
  // Request Notification Permission on Load
  // ---------------------------
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ---------------------------
  // Device Notification Helper
  // ---------------------------
  const sendDeviceNotification = (message: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Health Alert", { body: message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Health Alert", { body: message });
          }
        });
      }
    }
  };

  // ---------------------------
  // Analyze Vital Signs and Trigger Alerts/Recommendations
  // ---------------------------
  const analyzeVitals = (bp: string, heartRate: string, temperature: string) => {
    let message = "";
    let severity: "info" | "warning" | "error" = "info";
    let shouldVibrate = false;

    // Expecting BP in "systolic/diastolic" format
    const [systolic, diastolic] = bp.split("/").map(Number);
    const hr = Number(heartRate);
    const temp = Number(temperature);

    if (!systolic || !diastolic || !hr || !temp) {
      showSnackbar("Invalid input. Please enter valid numerical values.", "error");
      return;
    }

    // Evaluate Blood Pressure
    if (systolic < 90 || diastolic < 60) {
      message += "Low blood pressure detected. Stay hydrated. ";
      severity = "warning";
    } else if (systolic > 140 || diastolic > 90) {
      message += "High blood pressure detected. Reduce salt intake. ";
      severity = "warning";
      shouldVibrate = true;
    }

    // Evaluate Heart Rate
    if (hr < 50) {
      message += "Bradycardia detected. Consult a doctor if you feel dizzy. ";
      severity = "error";
      shouldVibrate = true;
    } else if (hr > 100) {
      message += "Tachycardia detected. Rest and monitor your heart rate. ";
      severity = "warning";
    }

    // Evaluate Temperature
    if (temp < 35.5) {
      message += "Low body temperature detected. Stay warm. ";
      severity = "error";
      shouldVibrate = true;
    } else if (temp > 38) {
      message += "Fever detected. Stay hydrated and monitor symptoms. ";
      severity = "warning";
    }

    if (message) {
      showSnackbar(message, severity);
      if (shouldVibrate && navigator.vibrate) {
        navigator.vibrate(500);
      }
      sendDeviceNotification(message);
    }
  };

  // ---------------------------
  // Submit Vital Signs to Firestore
  //  (Now storing patientName in each health record)
  // ---------------------------
  const submitVitals = async () => {
    if (!auth.currentUser) return;
    // Analyze the vitals before submitting
    analyzeVitals(bp, heartRate, temperature);
    try {
      await addDoc(collection(db, "healthRecords"), {
        userId: auth.currentUser.uid,
        patientName, // <-- We store the patient's name here
        bp,
        heartRate,
        temperature,
        timestamp: Timestamp.now(),
      });
      setBP("");
      setHeartRate("");
      setTemperature("");
      showSnackbar("Vital signs submitted successfully!", "success");
    } catch (error: any) {
      showSnackbar("Error submitting vital signs: " + error.message, "error");
    }
  };

  // ---------------------------
  // Real-Time Listener for Health Records
  // ---------------------------
  useEffect(() => {
    if (!auth.currentUser) return;
    const recordsQuery = query(
      collection(db, "healthRecords"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribeRecords = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const recs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecords(recs);
      },
      (error) => {
        showSnackbar("Error fetching health records: " + error.message, "error");
      }
    );
    return () => unsubscribeRecords();
  }, []);

  // ---------------------------
  // Book Appointment Function
  // ---------------------------
  const bookAppointment = async () => {
    if (!auth.currentUser) return;
    try {
      const appointmentTimestamp = appointmentDate
        ? Timestamp.fromDate(new Date(appointmentDate))
        : Timestamp.now();
      await addDoc(collection(db, "appointments"), {
        patientId: auth.currentUser.uid,
        patientName,
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

  // ---------------------------
  // Real-Time Listener for Appointments
  // ---------------------------
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

  // ---------------------------
  // Fetch Patient Name from Firestore
  // ---------------------------
  useEffect(() => {
    const fetchPatientName = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData?.name) {
              setPatientName(userData.name);
            }
          }
        } catch (error: any) {
          showSnackbar("Error fetching patient name: " + error.message, "error");
        }
      }
    };
    fetchPatientName();
  }, []);

  // ---------------------------
  // Render Component
  // ---------------------------
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header with Logout Button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4">Patient Dashboard</Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Section: Enter Vital Signs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Enter Vital Signs
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <TextField
            label="Blood Pressure (e.g., 120/80)"
            value={bp}
            onChange={(e) => setBP(e.target.value)}
          />
          <TextField
            label="Heart Rate"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
          />
          <TextField
            label="Temperature (°C)"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </Box>
        <Button variant="contained" onClick={submitVitals}>
          Submit
        </Button>
      </Box>

      {/* Section: Display Health Records */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Health Records
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="health-records-table">
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell> {/* New Column */}
                <TableCell>Blood Pressure</TableCell>
                <TableCell>Heart Rate</TableCell>
                <TableCell>Temperature</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.patientName}</TableCell> {/* Display patientName */}
                  <TableCell>{record.bp}</TableCell>
                  <TableCell>{record.heartRate}</TableCell>
                  <TableCell>{record.temperature}</TableCell>
                  <TableCell>
                    {record.timestamp ? record.timestamp.toDate().toLocaleString() : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Section: Schedule Appointment */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Schedule an Appointment
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <TextField
            label="Doctor Name"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
          />
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

      {/* Section: Display Appointments */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
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
                    {app.appointmentDate ? app.appointmentDate.toDate().toLocaleString() : ""}
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
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
