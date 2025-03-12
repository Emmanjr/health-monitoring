import { useState, useEffect } from "react";
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
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// MUI Components
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";

// For appointments
interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: any;
  status: string;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "warning" | "info"
  >("info");

  // Doctor's name
  const [doctorName, setDoctorName] = useState<string>("");

  // Patient search
  const [searchName, setSearchName] = useState("");
  const [healthRecords, setHealthRecords] = useState<any[]>([]);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Snackbar handler
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

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error: any) {
      showSnackbar("Error signing out: " + error.message, "error");
    }
  };

  // Fetch doctor name
  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          data.name && setDoctorName(data.name);
        }
      } catch (error: any) {
        showSnackbar("Error fetching doctor name: " + error.message, "error");
      }
    };
    fetchDoctorName();
  }, []);

  // Search health records
  const handleSearch = () => {
    if (!searchName) {
      showSnackbar("Please enter a patient name to search.", "warning");
      return;
    }
    const q = query(
      collection(db, "healthRecords"),
      where("patientName", "==", searchName)
    );
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
  };

  // Real-time appointments listener
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
        showSnackbar("Error fetching appointments: " + error.message, "error");
      }
    );
    return () => unsubscribe();
  }, [auth.currentUser, doctorName]);

  // Appointment actions
  const handleAppointmentAction = async (appointmentId: string, newStatus: string) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });
      showSnackbar(
        `Appointment ${newStatus === "approved" ? "approved" : "declined"}!`,
        "success"
      );
    } catch (error: any) {
      showSnackbar(
        `Error ${newStatus === "approved" ? "approving" : "declining"} appointment: ${error.message}`,
        "error"
      );
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Typography variant="h4">Doctor Dashboard</Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Patient Search Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Search Patient Health Records
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Patient Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell>
                <TableCell>Blood Pressure</TableCell>
                <TableCell>Heart Rate</TableCell>
                <TableCell>Temperature</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {healthRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.patientName}</TableCell>
                  <TableCell>{record.bp}</TableCell>
                  <TableCell>{record.heartRate}</TableCell>
                  <TableCell>{record.temperature}</TableCell>
                  <TableCell>
                    {record.timestamp?.toDate().toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Appointments Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Appointments
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell>
                <TableCell>Appointment Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>{appt.patientName}</TableCell>
                  <TableCell>
                    {appt.appointmentDate?.toDate().toLocaleString()}
                  </TableCell>
                  <TableCell>{appt.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleAppointmentAction(appt.id, "approved")}
                      sx={{ mr: 1 }}
                      disabled={appt.status === "approved"}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleAppointmentAction(appt.id, "declined")}
                      disabled={appt.status === "declined"}
                    >
                      Decline
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
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