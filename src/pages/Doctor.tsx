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
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { signOut } from "firebase/auth";

// Material UI Components
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
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
  Avatar,
  Divider,
  Tabs,
  Tab,
  Chip,
  Badge,
  CircularProgress,
  IconButton,
  useTheme,
  LinearProgress,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "@mui/material";

// Icons
import PersonIcon from "@mui/icons-material/Person";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FavoriteIcon from "@mui/icons-material/Favorite";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SmokingRoomsIcon from "@mui/icons-material/SmokingRooms";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SpaIcon from "@mui/icons-material/Spa";

// For appointments interface
interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: any;
  status: string;
  reason?: string;
  patientId?: string;
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

// Tab panel props interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Tab accessor 
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

// ------------------ Custom Hooks ------------------ //

// Fetch current doctor info
const useDoctorInfo = () => {
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setDoctorInfo({
            id: auth.currentUser.uid,
            ...userDoc.data()
          });
        }
      } catch (error: any) {
        setError("Error fetching doctor info: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorInfo();
  }, []);
  return { doctorInfo, loading, error };
};

// Fetch appointments for this doctor
const useAppointments = (doctorName: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.currentUser || !doctorName) return;
    const q = query(
      collection(db, "appointments"),
      where("doctorName", "==", doctorName),
      // orderBy("appointmentDate", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const appts = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            patientName: data.patientName || "Unknown Patient",
            patientId: data.patientId || "",
            doctorName: data.doctorName || doctorName,
            appointmentDate: data.appointmentDate,
            status: data.status || "Pending",
            reason: data.reason || "General Checkup",
          };
        });
        
        // Calculate pending appointments
        const pending = appts.filter(app => 
          app.status.toLowerCase() === "pending").length;
        
        setPendingCount(pending);
        setAppointments(appts);
        setLoading(false);
      },
      (error) => {
        setError("Error fetching appointments: " + error.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [doctorName]);

  const handleAppointmentAction = async (appointmentId: string, newStatus: string) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { 
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error: any) {
      console.error(`Error updating appointment: ${error.message}`);
      return false;
    }
  };

  return { appointments, pendingCount, loading, error, handleAppointmentAction };
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { doctorInfo, loading: doctorLoading, error: doctorError } = useDoctorInfo();
  const doctorName = doctorInfo?.name || "";
  const { 
    appointments, 
    pendingCount,
    loading: apptsLoading, 
    error: apptsError, 
    handleAppointmentAction 
  } = useAppointments(doctorName);

  // ------------------- State Management ------------------- //
  const [tabValue, setTabValue] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  // ------------------- Event Handlers ------------------- //
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

  const handleViewAppointments = () => {
    navigate("/doctor-appointments");
  };

  // ------------------- Data Fetching ------------------- //
  // Fetch all patients
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
        setLoading(false);
      } catch (error: any) {
        showSnackbar("Error fetching patients: " + error.message, "error");
        setLoading(false);
      }
    };
    
    fetchAllPatients();
  }, []);

  // Fetch patient data and health records when selected
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientData(null);
      setHealthRecords([]);
      return;
    }

    setLoading(true);
    
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
      } finally {
        setLoading(false);
      }
    };

    // Fetch health records for selected patient
    const q = query(
      collection(db, "healthRecords"), 
      where("userId", "==", selectedPatientId),
      // orderBy("timestamp", "desc"),
      // limit(10)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHealthRecords(records);
        setLoading(false);
      },
      (error) => {
        showSnackbar("Error fetching health records: " + error.message, "error");
        setLoading(false);
      }
    );

    fetchPatientData();
    return () => unsubscribe();
  }, [selectedPatientId]);

  // Helper functions for health status indicators
  const getBPStatus = (bp: string) => {
    if (!bp) return { color: "default", label: "N/A" };
    
    try {
      const [systolic, diastolic] = bp.split('/').map(Number);
      
      if (systolic > 140 || diastolic > 90) {
        return { color: "error", label: "High" };
      } else if (systolic < 90 || diastolic < 60) {
        return { color: "warning", label: "Low" };
      } else {
        return { color: "success", label: "Normal" };
      }
    } catch (e) {
      return { color: "default", label: "Invalid" };
    }
  };
  
  const getHRStatus = (hr: number | string) => {
    const heartRate = Number(hr);
    if (isNaN(heartRate)) return { color: "default", label: "N/A" };
    
    if (heartRate > 100) {
      return { color: "error", label: "High" };
    } else if (heartRate < 60) {
      return { color: "warning", label: "Low" };
    } else {
      return { color: "success", label: "Normal" };
    }
  };

  // Format date utility
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "N/A";
    try {
      return timestamp.toDate().toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  // Loading state
  if (doctorLoading || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#f8f9fa'
      }}>
        <Avatar sx={{ width: 80, height: 80, mb: 3, bgcolor: theme.palette.primary.main }}>
          <LocalHospitalIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h6" sx={{ mb: 3 }}>Loading Doctor Portal</Typography>
        <Box sx={{ width: '250px' }}>
          <LinearProgress color="primary" />
        </Box>
      </Box>
    );
  }

  // ------------------- Main Render ------------------- //
  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: 'primary.main' }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main', mr: 2 }}>
            <MedicalServicesIcon />
          </Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            Dr. {doctorName}'s Portal
          </Typography>
          <Badge badgeContent={pendingCount} color="error" sx={{ mr: 2 }}>
            <IconButton color="inherit" onClick={handleViewAppointments}>
              <NotificationsIcon />
            </IconButton>
          </Badge>
          <IconButton color="inherit" onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Doctor Banner */}
        <Paper 
          sx={{ 
            position: 'relative',
            height: '180px',
            borderRadius: 3,
            overflow: 'hidden',
            mb: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1250&q=80)',
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
              background: 'linear-gradient(90deg, rgba(21,101,192,0.8) 0%, rgba(25,118,210,0.4) 100%)'
            }}
          />
          <Box sx={{ 
            position: 'relative', 
            height: '100%',
            p: 4,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                border: '4px solid white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                bgcolor: '#fff',
                color: 'primary.main'
              }}
            >
              <PersonIcon sx={{ fontSize: 50 }} />
            </Avatar>
            <Box sx={{ ml: 3, color: '#fff' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Welcome, Dr. {doctorName}
              </Typography>
              <Typography variant="subtitle1">
                Healthcare Professional
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
              <Card sx={{ 
                minWidth: 140, 
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: 2
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {patients.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Patients
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ 
                minWidth: 140, 
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: 2
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {pendingCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Appointments
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>

        {/* Main Content with Tabs */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="doctor tabs"
              variant="fullWidth"
              sx={{ 
                '& .MuiTab-root': { 
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem' 
                }
              }}
            >
              <Tab 
                label="Patient Data" 
                icon={<PersonIcon />} 
                iconPosition="start" 
                {...a11yProps(0)} 
              />
              <Tab 
                label="Appointments" 
                icon={<CalendarMonthIcon />} 
                iconPosition="start" 
                {...a11yProps(1)}
                sx={{
                  '& .MuiBadge-root': { right: -15 }
                }}
              />
            </Tabs>
          </Box>
          
          {/* Patient Data Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 2, mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Select Patient
                      </Typography>
                    </Box>
                    <FormControl fullWidth>
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
                            {pt.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                {patientData && (
                  <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Box sx={{ 
                      bgcolor: '#1976d2', 
                      py: 2, 
                      px: 2, 
                      borderRadius: '8px 8px 0 0',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Avatar sx={{ bgcolor: '#fff', color: '#1976d2' }}>
                        {patientData.name ? patientData.name.charAt(0).toUpperCase() : 'P'}
                      </Avatar>
                      <Box sx={{ ml: 2, color: 'white' }}>
                        <Typography variant="h6">
                          {patientData.name || 'Patient'}
                        </Typography>
                        <Typography variant="body2">
                          {patientData.gender}, {patientData.age} years
                        </Typography>
                      </Box>
                    </Box>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Lifestyle Information
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip 
                              icon={<FitnessCenterIcon />}
                              label={`BMI: ${patientData.bmi || 'N/A'}`}
                              color={Number(patientData.bmi) > 25 ? "warning" : "success"}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              icon={<RestaurantIcon />}
                              label={`Diet: ${patientData.diet || 'N/A'}`}
                              color={patientData.diet === 'Poor' ? "warning" : "success"}
                              size="small"
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              icon={<SmokingRoomsIcon />}
                              label={patientData.smokingHabits || 'N/A'}
                              color={patientData.smokingHabits === 'Current smoker' ? "error" : "success"}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              icon={<SpaIcon />}
                              label={`Stress: ${patientData.stressLevels || 'N/A'}`}
                              color={patientData.stressLevels === 'High' ? "warning" : "success"}
                              size="small"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2">
                        Activity: <b>{patientData.physicalActivity || 'N/A'}</b>
                      </Typography>
                      <Typography variant="body2">
                        Alcohol Use: <b>{patientData.alcoholUse || 'N/A'}</b>
                      </Typography>
                      <Typography variant="body2">
                        Ethnicity: <b>{patientData.ethnicity || 'N/A'}</b>
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
              
              <Grid item xs={12} md={8}>
                {selectedPatientId ? (
                  healthRecords.length > 0 ? (
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <MonitorHeartIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            Health Records
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <Card sx={{ 
                            borderRadius: 2,
                            p: 2,
                            backgroundColor: theme.palette.grey[50],
                            boxShadow: 'none',
                            border: `1px solid ${theme.palette.grey[200]}`
                          }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Latest Vitals - {formatDate(healthRecords[0]?.timestamp)}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                  <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main', mx: 'auto', mb: 1 }}>
                                    <FavoriteIcon />
                                  </Avatar>
                                  <Typography variant="h6" color="primary">
                                    {healthRecords[0]?.bp || 'N/A'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chip 
                                      label={getBPStatus(healthRecords[0]?.bp).label} 
                                      color={getBPStatus(healthRecords[0]?.bp).color as any}
                                      size="small"
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Blood Pressure
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                  <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main', mx: 'auto', mb: 1 }}>
                                    <MonitorHeartIcon />
                                  </Avatar>
                                  <Typography variant="h6" color="primary">
                                    {healthRecords[0]?.heartRate || 'N/A'} bpm
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chip 
                                      label={getHRStatus(healthRecords[0]?.heartRate).label} 
                                      color={getHRStatus(healthRecords[0]?.heartRate).color as any}
                                      size="small"
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Heart Rate
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center', p: 1 }}>
                                  <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main', mx: 'auto', mb: 1 }}>
                                    <LocalHospitalIcon />
                                  </Avatar>
                                  <Typography variant="h6" color="primary">
                                    {healthRecords[0]?.temperature || 'N/A'}°C
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chip 
                                      label="Temperature" 
                                      color="default"
                                      size="small"
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Temperature
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Card>
                        </Box>
                        
                        <TableContainer component={Paper} elevation={0}>
                          <Table size="small">
                            <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>BP</TableCell>
                                <TableCell>Heart Rate</TableCell>
                                <TableCell>Temperature</TableCell>
                                <TableCell>Notes</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {healthRecords.map((record) => (
                                <TableRow key={record.id} sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                                  <TableCell>{formatDate(record.timestamp)}</TableCell>
                                  <TableCell>{record.bp || 'N/A'}</TableCell>
                                  <TableCell>{record.heartRate || 'N/A'} bpm</TableCell>
                                  <TableCell>{record.temperature || 'N/A'}°C</TableCell>
                                  <TableCell>{record.notes || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Box 
                          component="img"
                          src="/health.png"
                          alt="No health records"
                          sx={{ width: 80, height: 80, opacity: 0.6, mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No Health Records Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This patient hasn't logged any vital signs yet.
                        </Typography>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                      <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 2 }}>
                        <PersonIcon sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Patient Selected
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Please select a patient to view their health information.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Appointments Tab */}
          <TabPanel value={tabValue} index={1}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CalendarMonthIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Your Appointments
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    sx={{ ml: 'auto' }}
                    onClick={handleViewAppointments}
                  >
                    View All Appointments
                  </Button>
                </Box>
                
                {apptsError && (
                  <Alert severity="error" sx={{ mb: 2 }}>{apptsError}</Alert>
                )}

                {appointments.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 4
                  }}>
                    <Box 
                      component="img"
                      src="/health.png"
                      alt="No Appointments"
                      sx={{ width: 80, height: 80, opacity: 0.7, mb: 2 }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      No Appointments Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You don't have any upcoming appointments.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                        <TableRow>
                          <TableCell>Patient</TableCell>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appointments.slice(0, 5).map((appointment) => (
                          <TableRow key={appointment.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: theme.palette.primary.light, 
                                    width: 32, 
                                    height: 32, 
                                    mr: 1,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {appointment.patientName.charAt(0)}
                                </Avatar>
                                {appointment.patientName}
                              </Box>
                            </TableCell>
                            <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={appointment.status} 
                                color={appointment.status.toLowerCase() === "pending" 
                                  ? "warning" 
                                  : appointment.status.toLowerCase() === "approved"
                                    ? "success"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {appointment.status.toLowerCase() === "pending" ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleAppointmentAction(appointment.id, "Approved")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<CancelIcon />}
                                    onClick={() => handleAppointmentAction(appointment.id, "Declined")}
                                  >
                                    Decline
                                  </Button>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.status}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {appointments.length > 5 && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button 
                      color="primary" 
                      onClick={handleViewAppointments}
                    >
                      View All {appointments.length} Appointments
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </Container>
      
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
    </Box>
  );
}
