// src/AdminPatientDetails.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import PersonIcon from "@mui/icons-material/Person";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SmokingRoomsIcon from "@mui/icons-material/SmokingRooms";
import FavoriteIcon from "@mui/icons-material/Favorite";
import InfoIcon from "@mui/icons-material/Info";
import SpaIcon from "@mui/icons-material/Spa";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HealthDataIcon from '@mui/icons-material/HealthAndSafety';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

interface HealthRecord {
  id: string;
  bp: string;         // e.g., "120/80"
  heartRate: number;
  temperature?: number;
  timestamp: any;
  notes?: string;
  glucoseLevel?: number;
  weight?: number;
}

// Tab panel component properties
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `patient-tab-${index}`,
    'aria-controls': `patient-tabpanel-${index}`,
  };
}

const AdminPatientDetails = () => {
  const theme = useTheme();
  
  // State for patients list (users with role "patient")
  const [patients, setPatients] = useState<any[]>([]);
  // Selected patient's UID
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  // Patient's lifestyle data
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  // Patient's health records (vitals)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Snackbar state for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error" | "warning" | "info">("info");

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 1. Fetch all patients from the "users" collection with role "patient"
  useEffect(() => {
    const fetchPatients = async () => {
      try {
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
    fetchPatients();
  }, []);

  // 2. When a patient is selected, fetch their lifestyle data and health records
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientData(null);
      setHealthRecords([]);
      return;
    }
    
    setLoading(true);
    
    // Fetch patient lifestyle data
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
        setLoading(false);
      }
    };

    // Fetch patient health records (vitals)
    const q = query(
      collection(db, "healthRecords"), 
      where("userId", "==", selectedPatientId),
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recordsData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            bp: data.bp || "N/A",
            heartRate: data.heartRate ? Number(data.heartRate) : 0,
            temperature: data.temperature ? Number(data.temperature) : 0,
            notes: data.notes || "",
            glucoseLevel: data.glucoseLevel ? Number(data.glucoseLevel) : 0,
            weight: data.weight ? Number(data.weight) : 0,
            timestamp: data.timestamp,
          };
        });
        
        // Sort health records by timestamp (newest first)
        recordsData.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
        });
        
        setHealthRecords(recordsData);
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

  // Prepare chart data: parse bp => systolic/diastolic, plus heartRate
  const prepareChartData = () => {
    return healthRecords
      .map((record) => {
        // Split the bp string (e.g., "120/80") into two values
        let systolic = 0;
        let diastolic = 0;
        if (record.bp && record.bp !== "N/A") {
          const bpParts = record.bp.split("/");
          if (bpParts.length === 2) {
            systolic = parseInt(bpParts[0]) || 0;
            diastolic = parseInt(bpParts[1]) || 0;
          }
        }

        return {
          timestamp: record.timestamp
            ? record.timestamp.toDate().toLocaleDateString()
            : "",
          heartRate: record.heartRate || 0,
          systolic,
          diastolic,
          temperature: record.temperature || 0,
        };
      })
      .filter(record => record.timestamp) // Filter out records without valid timestamp
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const chartData = prepareChartData();

  // Format date nicely
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

  // Health risk assessment based on lifestyle factors
  const getHealthRisk = () => {
    if (!patientData) return { risk: "Unknown", color: "grey" };
    
    let riskScore = 0;
    
    // BMI risk
    if (patientData.bmi) {
      const bmi = parseFloat(patientData.bmi);
      if (bmi > 30) riskScore += 3;
      else if (bmi > 25) riskScore += 2;
    }
    
    // Smoking risk
    if (patientData.smokingHabits) {
      if (patientData.smokingHabits === "Current smoker") riskScore += 3;
      else if (patientData.smokingHabits === "Former smoker") riskScore += 1;
    }
    
    // Alcohol risk
    if (patientData.alcoholUse) {
      if (patientData.alcoholUse === "Heavy drinker") riskScore += 3;
      else if (patientData.alcoholUse === "Social drinker") riskScore += 1;
    }
    
    // Stress risk
    if (patientData.stressLevels) {
      if (patientData.stressLevels === "High") riskScore += 2;
      else if (patientData.stressLevels === "Moderate") riskScore += 1;
    }
    
    // Diet risk
    if (patientData.diet) {
      if (patientData.diet === "Poor") riskScore += 2;
      else if (patientData.diet === "Moderate") riskScore += 1;
    }
    
    // Activity risk
    if (patientData.physicalActivity) {
      if (patientData.physicalActivity === "Sedentary") riskScore += 2;
      else if (patientData.physicalActivity === "Light activity") riskScore += 1;
    }
    
    // Calculate risk level
    let risk;
    let color;
    if (riskScore >= 8) {
      risk = "High";
      color = "#f44336"; // red
    } else if (riskScore >= 5) {
      risk = "Moderate";
      color = "#ff9800"; // orange
    } else {
      risk = "Low";
      color = "#4caf50"; // green
    }
    
    return { risk, color };
  };

  // Helper functions for health status indicators
  const getBPStatus = (bp: string) => {
    if (!bp || bp === "N/A") return { color: "default", label: "N/A" };
    
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

  const healthRisk = getHealthRisk();

  // Generate patient lifestyle data for pie chart
  const getLifestylePieData = () => {
    // Create categories based on patient lifestyle
    const pieData = [
      {
        name: "Diet",
        value: patientData?.diet === "Good" ? 30 : 
               patientData?.diet === "Moderate" ? 20 : 10,
        color: "#4caf50"
      },
      {
        name: "Activity",
        value: patientData?.physicalActivity === "Active" ? 30 :
               patientData?.physicalActivity === "Light activity" ? 20 : 10,
        color: "#2196f3"
      },
      {
        name: "Stress",
        value: patientData?.stressLevels === "Low" ? 30 :
               patientData?.stressLevels === "Moderate" ? 20 : 10,
        color: "#ff9800"
      },
      {
        name: "Smoking",
        value: patientData?.smokingHabits === "Non-smoker" ? 30 :
               patientData?.smokingHabits === "Former smoker" ? 20 : 10,
        color: "#f44336"
      }
    ];
    return pieData;
  };

  const lifestylePieData = getLifestylePieData();
  
  if (loading && !selectedPatientId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'medium' }}>
          Patient Health Records
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed patient information and health metrics
        </Typography>
      </Box>

      {/* Patient Selection and Overview */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HealthDataIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Patient Selection
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="patient-select-label">Select Patient</InputLabel>
                <Select
                  labelId="patient-select-label"
                  value={selectedPatientId}
                  label="Select Patient"
                  onChange={(e) => setSelectedPatientId(e.target.value as string)}
                >
                  <MenuItem value="">-- Select Patient --</MenuItem>
                  {patients.map((pt) => (
                    <MenuItem key={pt.id} value={pt.id}>
                      {pt.name || "Unknown Patient"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && selectedPatientId ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : patientData && selectedPatientId ? (
        <>
          {/* Patient Profile Banner */}
          <Card sx={{ 
            mb: 3, 
            borderRadius: 2,
            backgroundImage: 'linear-gradient(to right, #bbdefb, #e3f2fd)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ py: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: theme.palette.primary.main,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {patientData.name ? patientData.name.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h5" fontWeight="bold">
                    {patientData.name || "Unknown Patient"}
                  </Typography>
                  <Typography variant="body1">
                    {patientData.gender || "Unknown"}, {patientData.age || "?"} years old
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID: {selectedPatientId.substring(0, 8)}...
                  </Typography>
                </Grid>
                <Grid item>
                  <Chip 
                    label={`Health Risk: ${healthRisk.risk}`}
                    sx={{ 
                      bgcolor: healthRisk.color,
                      color: 'white',
                      fontWeight: 'bold',
                      px: 2
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for Patient Data Sections */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="patient data tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 'medium',
                  fontSize: '1rem'
                }
              }}
            >
              <Tab 
                icon={<PersonIcon />}
                iconPosition="start" 
                label="Profile & Lifestyle" 
                {...a11yProps(0)} 
              />
              <Tab 
                icon={<MonitorHeartIcon />}
                iconPosition="start" 
                label="Health Records" 
                {...a11yProps(1)} 
              />
              <Tab 
                icon={<FavoriteIcon />}
                iconPosition="start" 
                label="Health Trends" 
                {...a11yProps(2)} 
              />
            </Tabs>
          </Box>

          {/* Profile & Lifestyle Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardHeader 
                    title="Personal Information"
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                        <PersonIcon />
                      </Avatar>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1">
                          {patientData.name || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {patientData.email || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Age
                        </Typography>
                        <Typography variant="body1">
                          {patientData.age || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Gender
                        </Typography>
                        <Typography variant="body1">
                          {patientData.gender || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Ethnicity
                        </Typography>
                        <Typography variant="body1">
                          {patientData.ethnicity || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          BMI
                        </Typography>
                        <Typography variant="body1">
                          {patientData.bmi || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {patientData.phone || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Emergency Contact
                        </Typography>
                        <Typography variant="body1">
                          {patientData.emergencyContact || "Not provided"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1">
                          {patientData.address || "Not provided"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardHeader 
                    title="Lifestyle Factors"
                    avatar={
                      <Avatar sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.dark }}>
                        <FitnessCenterIcon />
                      </Avatar>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={lifestylePieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name }) => name}
                          >
                            {lifestylePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    
                    <List>
                      <ListItem sx={{ px: 0 }}>
                        <Chip 
                          icon={<RestaurantIcon />}
                          label={`Diet: ${patientData.diet || "Unknown"}`}
                          color={patientData.diet === 'Good' ? 'success' : 
                                  patientData.diet === 'Moderate' ? 'warning' : 'error'}
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          icon={<SmokingRoomsIcon />}
                          label={`Smoking: ${patientData.smokingHabits || "Unknown"}`}
                          color={patientData.smokingHabits === 'Non-smoker' ? 'success' : 
                                  patientData.smokingHabits === 'Former smoker' ? 'warning' : 'error'}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <Chip 
                          icon={<LocalHospitalIcon />}
                          label={`Alcohol: ${patientData.alcoholUse || "Unknown"}`}
                          color={patientData.alcoholUse === 'Non-drinker' ? 'success' : 
                                  patientData.alcoholUse === 'Social drinker' ? 'warning' : 'error'}
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          icon={<SpaIcon />}
                          label={`Stress: ${patientData.stressLevels || "Unknown"}`}
                          color={patientData.stressLevels === 'Low' ? 'success' : 
                                  patientData.stressLevels === 'Moderate' ? 'warning' : 'error'}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <Chip 
                          icon={<FitnessCenterIcon />}
                          label={`Activity: ${patientData.physicalActivity || "Unknown"}`}
                          color={patientData.physicalActivity === 'Active' ? 'success' : 
                                  patientData.physicalActivity === 'Light activity' ? 'warning' : 'error'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Health Records Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {healthRecords.length > 0 ? (
                <>
                  {/* Latest Vitals Overview */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, mb: 3 }}>
                      <CardHeader 
                        title="Latest Health Metrics" 
                        avatar={
                          <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                            <MonitorHeartIcon />
                          </Avatar>
                        }
                        subheader={`Recorded on ${formatDate(healthRecords[0]?.timestamp)}`}
                      />
                      <Divider />
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={4}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: '#e3f2fd',
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Avatar 
                                sx={{ 
                                  bgcolor: 'white', 
                                  color: theme.palette.primary.main,
                                  width: 56,
                                  height: 56,
                                  mb: 1
                                }}
                              >
                                <FavoriteIcon sx={{ fontSize: 32 }} />
                              </Avatar>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Blood Pressure
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {healthRecords[0]?.bp || 'N/A'}
                              </Typography>
                              <Chip 
                                label={getBPStatus(healthRecords[0]?.bp || '').label} 
                                color={getBPStatus(healthRecords[0]?.bp || '').color as any}
                                size="small"
                              />
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: '#fff8e1',
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Avatar 
                                sx={{ 
                                  bgcolor: 'white', 
                                  color: theme.palette.warning.main,
                                  width: 56,
                                  height: 56,
                                  mb: 1
                                }}
                              >
                                <MonitorHeartIcon sx={{ fontSize: 32 }} />
                              </Avatar>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Heart Rate
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {healthRecords[0]?.heartRate || 'N/A'} <small>bpm</small>
                              </Typography>
                              <Chip 
                                label={getHRStatus(healthRecords[0]?.heartRate || 0).label} 
                                color={getHRStatus(healthRecords[0]?.heartRate || 0).color as any}
                                size="small"
                              />
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                bgcolor: '#e8f5e9',
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Avatar 
                                sx={{ 
                                  bgcolor: 'white', 
                                  color: theme.palette.success.main,
                                  width: 56,
                                  height: 56,
                                  mb: 1
                                }}
                              >
                                <LocalHospitalIcon sx={{ fontSize: 32 }} />
                              </Avatar>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Temperature
                              </Typography>
                              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {healthRecords[0]?.temperature ? `${healthRecords[0].temperature}°C` : 'N/A'}
                              </Typography>
                              <Chip 
                                label={healthRecords[0]?.temperature ? 
                                  (healthRecords[0].temperature > 38 ? 'Elevated' : 'Normal') : 'N/A'} 
                                color={healthRecords[0]?.temperature ? 
                                  (healthRecords[0].temperature > 38 ? 'warning' : 'success') : 'default'}
                                size="small"
                              />
                            </Paper>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Health Records Table */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardHeader 
                        title="Health Records History" 
                        avatar={
                          <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                            <AccessTimeIcon />
                          </Avatar>
                        }
                      />
                      <Divider />
                      <CardContent>
                        <TableContainer>
                          <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                              <TableRow>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Blood Pressure</TableCell>
                                <TableCell>Heart Rate</TableCell>
                                <TableCell>Temperature</TableCell>
                                <TableCell>Notes</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {healthRecords.map((record) => (
                                <TableRow key={record.id} hover>
                                  <TableCell>{formatDate(record.timestamp)}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {record.bp}
                                      <Chip 
                                        label={getBPStatus(record.bp).label} 
                                        color={getBPStatus(record.bp).color as any}
                                        size="small"
                                        sx={{ ml: 1, height: 20 }}
                                      />
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {record.heartRate} bpm
                                      <Chip 
                                        label={getHRStatus(record.heartRate).label} 
                                        color={getHRStatus(record.heartRate).color as any}
                                        size="small"
                                        sx={{ ml: 1, height: 20 }}
                                      />
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {record.temperature ? `${record.temperature}°C` : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        maxWidth: 200, 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis' 
                                      }}
                                    >
                                      {record.notes || "-"}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2
                    }}
                  >
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: '#e3f2fd', color: 'primary.main' }}>
                      <MonitorHeartIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      No Health Records Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      This patient has not logged any health data yet.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Health Trends Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {chartData.length > 0 ? (
                <>
                  {/* Heart Rate Trend Chart */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 2, height: '100%' }}>
                      <CardHeader 
                        title="Heart Rate Trends" 
                        avatar={
                          <Avatar sx={{ bgcolor: '#e3f2fd', color: 'primary.main' }}>
                            <MonitorHeartIcon />
                          </Avatar>
                        }
                      />
                      <Divider />
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="heartRate" 
                              stroke={theme.palette.primary.main} 
                              name="Heart Rate (bpm)" 
                              strokeWidth={2} 
                              dot={{ fill: theme.palette.primary.main, r: 3 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Blood Pressure Trend Chart */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 2, height: '100%' }}>
                      <CardHeader 
                        title="Blood Pressure Trends" 
                        avatar={
                          <Avatar sx={{ bgcolor: '#ffebee', color: 'error.main' }}>
                            <FavoriteIcon />
                          </Avatar>
                        }
                      />
                      <Divider />
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="systolic" 
                              stackId="1"
                              stroke={theme.palette.error.main} 
                              fill={theme.palette.error.light + '80'}
                              name="Systolic" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="diastolic" 
                              stackId="2"
                              stroke={theme.palette.warning.main} 
                              fill={theme.palette.warning.light + '80'} 
                              name="Diastolic" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Temperature Trend Chart */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 2, height: '100%' }}>
                      <CardHeader 
                        title="Temperature History" 
                        avatar={
                          <Avatar sx={{ bgcolor: '#e8f5e9', color: 'success.main' }}>
                            <LocalHospitalIcon />
                          </Avatar>
                        }
                      />
                      <Divider />
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis domain={[35, 40]} />
                            <RechartsTooltip />
                            <Legend />
                            <Bar 
                              dataKey="temperature" 
                              fill={theme.palette.success.light} 
                              name="Temperature (°C)" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Health Risk Assessment */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 2, height: '100%' }}>
                      <CardHeader 
                        title="Health Risk Assessment" 
                        avatar={
                          <Avatar sx={{ bgcolor: '#fff3e0', color: 'warning.main' }}>
                            <InfoIcon />
                          </Avatar>
                        }
                      />
                      <Divider />
                      <CardContent sx={{ pt: 3 }}>
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Overall Health Risk
                          </Typography>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: healthRisk.color
                            }}
                          >
                            {healthRisk.risk}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body1" paragraph>
                          This assessment is based on the patient's lifestyle factors, vital signs, and health history.
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Risk Factors
                          </Typography>
                          <List dense>
                            {patientData.smokingHabits === "Current smoker" && (
                              <ListItem>
                                <ListItemText 
                                  primary="Smoking - High Risk" 
                                  secondary="Current smoker status increases risk for cardiovascular and respiratory issues"
                                />
                              </ListItem>
                            )}
                            {patientData.diet === "Poor" && (
                              <ListItem>
                                <ListItemText 
                                  primary="Dietary Habits - High Risk" 
                                  secondary="Poor diet may lead to nutritional deficiencies and increased risk of chronic diseases"
                                />
                              </ListItem>
                            )}
                            {patientData.physicalActivity === "Sedentary" && (
                              <ListItem>
                                <ListItemText 
                                  primary="Physical Activity - High Risk" 
                                  secondary="Sedentary lifestyle increases risk for cardiovascular disease and metabolic disorders"
                                />
                              </ListItem>
                            )}
                            {parseFloat(patientData.bmi || "0") > 30 && (
                              <ListItem>
                                <ListItemText 
                                  primary="BMI - High Risk" 
                                  secondary={`BMI of ${patientData.bmi} indicates obesity, increasing risk for multiple conditions`}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2
                    }}
                  >
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: '#e3f2fd', color: 'primary.main' }}>
                      <FavoriteIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      No Trend Data Available
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Health trends will appear once the patient has multiple health records.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </>
      ) : (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        >
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              bgcolor: theme.palette.primary.light
            }}
          >
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Select a Patient
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Please select a patient from the dropdown above to view their health records and lifestyle information
          </Typography>
        </Paper>
      )}

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
};

export default AdminPatientDetails;
