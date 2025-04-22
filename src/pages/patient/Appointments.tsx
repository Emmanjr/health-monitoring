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
  orderBy,
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
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function Appointments() {
  // State for patient name (fetched from Firestore)
  const [patientName, setPatientName] = useState("");
  // List of doctors from Firestore
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
          return { id: doc.id, name: data.name || "Unknown Doctor" };
        });
        setDoctors(doctorList);
      } catch (error: any) {
        showSnackbar("Error fetching doctors: " + error.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // 3) Book Appointment (including patientName in the doc)
  const bookAppointment = async () => {
    if (!auth.currentUser) return;
    
    // Validate doctor selection
    if (!doctorName) {
      showSnackbar("Please select a doctor.", "warning");
      return;
    }
    
    // Validate appointment date
    if (!appointmentDate) {
      showSnackbar("Please select a date and time.", "warning");
      return;
    }
    
    // Validate appointment is not in the past
    const selectedDate = new Date(appointmentDate);
    const now = new Date();
    if (selectedDate < now) {
      showSnackbar("Cannot book appointments in the past.", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      const appointmentTimestamp = Timestamp.fromDate(new Date(appointmentDate));

      await addDoc(collection(db, "appointments"), {
        patientId: auth.currentUser.uid,
        patientName, // <-- Include the patient's name
        doctorName,
        appointmentDate: appointmentTimestamp,
        status: "Pending",
        createdAt: Timestamp.now(),
      });

      setDoctorName("");
      setAppointmentDate("");
      showSnackbar("Appointment booked successfully!", "success");
    } catch (error: any) {
      showSnackbar("Error booking appointment: " + error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time listener for appointments (for the current patient)
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Use a simple query without orderBy to avoid needing a composite index
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", auth.currentUser.uid)
    );
    
    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        try {
          const apps = snapshot.docs.map((doc) => ({
            id: doc.id,
            appointmentDate: doc.data().appointmentDate,
            ...doc.data(),
          }));
          
          // Sort on the client side instead of in the query
          const sortedApps = apps.sort((a, b) => {
            try {
              if (!a.appointmentDate || !b.appointmentDate) return 0;
              return b.appointmentDate.toDate().getTime() - a.appointmentDate.toDate().getTime();
            } catch (err) {
              console.error("Error sorting appointments:", err);
              return 0;
            }
          });
          
          setAppointments(sortedApps);
        } catch (error) {
          console.error("Error processing appointments data:", error);
          showSnackbar("Error processing appointments data", "error");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching appointments:", error);
        showSnackbar("Error fetching appointments: " + error.message, "error");
        setLoading(false);
      }
    );
    
    return () => unsubscribeAppointments();
  }, [auth.currentUser?.uid]); // Add proper dependency to ensure it re-runs when user changes

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'declined':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon fontSize="small" />;
      case 'pending':
        return <HourglassTopIcon fontSize="small" />;
      case 'declined':
        return <CancelIcon fontSize="small" />;
      default:
        return <span />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header with Banner */}
      <Box sx={{ 
        position: 'relative',
        height: '160px',
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1612349316228-5942a9b489c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(52, 152, 219, 0.5)'
          }}
        />
        <Box sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          px: 3
        }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              Your Appointments
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              Schedule and manage your doctor appointments
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Book Appointment Section */}
      <Card sx={{ 
        mb: 4, 
        borderRadius: 3, 
        boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
        },
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: '#3498db', mr: 2 }}>
              <BookOnlineIcon />
            </Avatar>
            <Typography variant="h5">
              Schedule an Appointment
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={doctorName === ""}>
                <InputLabel id="doctor-select-label">Select Doctor</InputLabel>
                <Select
                  labelId="doctor-select-label"
                  value={doctorName}
                  label="Select Doctor"
                  onChange={(e) => setDoctorName(e.target.value as string)}
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#3498db' }} />
                    </InputAdornment>
                  }
                >
                  {doctors.length > 0 ? (
                    doctors.map((doc) => (
                      <MenuItem key={doc.id} value={doc.name}>
                        {doc.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No doctors available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Appointment Date & Time"
                type="datetime-local"
                fullWidth
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ 
                  min: new Date().toISOString().slice(0, 16)
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon sx={{ color: '#3498db' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={bookAppointment}
              disabled={submitting}
              startIcon={<BookOnlineIcon />}
              sx={{ 
                minWidth: '200px',
                py: 1.5,
                bgcolor: '#3498db',
                '&:hover': {
                  bgcolor: '#2980b9',
                },
              }}
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Display Appointments */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: '#2ecc71', mr: 2 }}>
              <EventIcon />
            </Avatar>
            <Typography variant="h5">
              Your Appointments
            </Typography>
          </Box>
          
          {appointments.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 2 }}>
              <Table size="medium" aria-label="appointments-table">
                <TableHead sx={{ bgcolor: '#f5f9fc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Doctor Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.map((app) => (
                    <TableRow key={app.id} hover>
                      <TableCell sx={{ verticalAlign: 'middle' }}>{app.doctorName}</TableCell>
                      <TableCell sx={{ verticalAlign: 'middle' }}>
                        {app.appointmentDate
                          ? app.appointmentDate.toDate().toLocaleString(undefined, { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit' 
                            })
                          : "Not set"}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'middle' }}>
                        <Chip 
                          icon={getStatusIcon(app.status)} 
                          label={app.status} 
                          color={getStatusColor(app.status) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 4
            }}>
              <Box 
                component="img"
                src="/health.png"
                alt="No Appointments"
                sx={{
                  width: '80px',
                  height: '80px',
                  opacity: 0.7,
                  mb: 2
                }}
              />
              <Typography variant="body1" color="text.secondary" textAlign="center">
                You don't have any appointments scheduled yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                Book your first appointment above.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

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
