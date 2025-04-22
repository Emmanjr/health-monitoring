// src/pages/patient/Vitals.tsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
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
  List,
  ListItem,
  ListItemText,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import InfoIcon from "@mui/icons-material/Info";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function Vitals() {
  // Input state for vitals
  const [bp, setBP] = useState("");
  const [heartRate, setHeartRate] = useState("");

  // Fetched user data (onboarding / lifestyle info)
  const [userData, setUserData] = useState<any>(null);

  // Health records
  const [records, setRecords] = useState<any[]>([]);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error" | "warning" | "info">("info");

  // Recommendation states
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [displayedRecommendations, setDisplayedRecommendations] = useState<string[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Animations
  const [animate, setAnimate] = useState(false);
  
  // Theme for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

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

  // Fetch user data on mount (lifestyle info from onboarding)
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        } catch (error: any) {
          showSnackbar("Error fetching user data: " + error.message, "error");
        }
      }
    };
    fetchUserData();
  }, []);

  // Real-time listener for health records
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
        })).sort((a: any, b: any) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime();
          }
          return 0;
        });
        setRecords(recs);
        setLoading(false);
      },
      (error) => {
        showSnackbar("Error fetching health records: " + error.message, "error");
        setLoading(false);
      }
    );
    return () => unsubscribeRecords();
  }, []);

  // Analyze vitals for immediate feedback
  const analyzeVitals = (bp: string, heartRate: string) => {
    let message = "";
    let severity: "info" | "warning" | "error" = "info";
    let shouldVibrate = false;

    // Expecting BP in "systolic/diastolic" format
    const [systolic, diastolic] = bp.split("/").map(Number);
    const hr = Number(heartRate);

    if (!systolic || !diastolic || !hr) {
      showSnackbar("Invalid input. Please enter valid numerical values.", "error");
      return false;
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

    if (message) {
      showSnackbar(message, severity);
      if (shouldVibrate && navigator.vibrate) {
        navigator.vibrate(500);
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Health Alert", { body: message });
      }
    }
    return true;
  };

  // Generate detailed recommendations based on vitals and user data
  const generateRecommendations = (bp: string, hr: number) => {
    const recs: string[] = [];
    const [systolic, diastolic] = bp.split("/").map(Number);

    // Blood Pressure recommendations
    if (systolic > 140 || diastolic > 90) {
      recs.push("Your blood pressure is high.");
      if (userData) {
        if (userData.smokingHabits === "Current smoker") {
          recs.push("Since you are a current smoker, quitting smoking can help lower your blood pressure.");
        }
        if (userData.alcoholUse === "Regular") {
          recs.push("Regular alcohol consumption might be contributing to your high blood pressure. Consider reducing your intake.");
        }
        if (userData.bmi && Number(userData.bmi) > 30) {
          recs.push("A high BMI coupled with high blood pressure increases your cardiovascular risk. Consider weight management strategies.");
        }
        if (userData.stressLevels === "High") {
          recs.push("High stress levels may be affecting your blood pressure. Consider stress-reduction techniques like mindfulness or therapy.");
        }
      }
    } else if (systolic < 90 || diastolic < 60) {
      recs.push("Your blood pressure is low. Ensure you are staying well-hydrated.");
    } else {
      recs.push("Your blood pressure is within a normal range.");
    }

    // Heart Rate recommendations
    if (hr > 100) {
      recs.push("Your heart rate is elevated. Please consider resting and monitoring your heart rate.");
    } else if (hr < 60) {
      recs.push("Your heart rate is slightly low. If you experience dizziness, consult a doctor.");
    } else {
      recs.push("Your heart rate is normal. Great job!");
    }

    // Additional recommendations based on lifestyle data
    if (userData) {
      if (userData.bmi) {
        const bmi = Number(userData.bmi);
        if (bmi > 25) {
          recs.push("Your BMI is high. Consider adopting a healthier diet and increasing your physical activity.");
        } else if (bmi < 18.5) {
          recs.push("Your BMI is low. Consider consulting a nutritionist to ensure you're getting enough nutrients.");
        }
      }
      if (userData.physicalActivity === "Sedentary") {
        recs.push("Increasing your physical activity could greatly benefit your overall health.");
      }
      if (userData.diet === "Poor") {
        recs.push("Improving your diet by incorporating more fruits and vegetables can improve your health.");
      }
    }

    return recs;
  };

  // Submit Vitals and generate recommendations
  const submitVitals = async () => {
    if (!auth.currentUser) return;

    // Validate input
    const isValid = analyzeVitals(bp, heartRate);
    if (!isValid) return;

    try {
      // Save to Firestore
      await addDoc(collection(db, "healthRecords"), {
        userId: auth.currentUser.uid,
        bp,
        heartRate,
        timestamp: Timestamp.now(),
      });

      // Clear input fields
      setBP("");
      setHeartRate("");
      showSnackbar("Vital signs submitted successfully!", "success");
      
      // Trigger animation
      setAnimate(true);

      // Generate recommendations
      const recs = generateRecommendations(bp, Number(heartRate));
      setRecommendations(recs);
      setDisplayedRecommendations([]);
    } catch (error: any) {
      showSnackbar("Error submitting vital signs: " + error.message, "error");
    }
  };

  // Simulate recommendations being generated in real time
  useEffect(() => {
    if (recommendations.length > 0) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedRecommendations((prev) => [...prev, recommendations[i]]);
        i++;
        if (i >= recommendations.length) {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [recommendations]);

  // Reset animation after it completes
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimate(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  // Replace the old navigate function with proper React Router navigation
  const navigateTo = (path: string) => {
    navigate(path);
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80)',
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
              Track Your Vitals
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              Monitor your health indicators and get personalized recommendations
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Form Card */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 3, 
            height: '100%',
            boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3498db', mr: 2 }}>
                  <MonitorHeartIcon />
                </Avatar>
                <Typography variant="h5">
                  Enter Vital Signs
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    Blood Pressure (mmHg)
                  </Typography>
                  <Tooltip title="Format as systolic/diastolic (e.g., 120/80)">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  fullWidth
                  placeholder="e.g., 120/80"
                  value={bp}
                  onChange={(e) => setBP(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <FavoriteIcon sx={{ color: '#e74c3c', mr: 1 }} />
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    Heart Rate (bpm)
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  placeholder="e.g., 75"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <MonitorHeartIcon sx={{ color: '#3498db', mr: 1 }} />
                    ),
                  }}
                />
              </Box>
              
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                onClick={submitVitals}
                startIcon={<AddCircleIcon />}
                sx={{ 
                  py: 1.5,
                  bgcolor: '#3498db',
                  '&:hover': {
                    bgcolor: '#2980b9',
                  },
                }}
              >
                Submit Vitals
              </Button>
              
              <Fade in={animate}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mt: 2
                }}>
                  <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography color="success.main">Recorded successfully!</Typography>
                </Box>
              </Fade>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recommendations Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 3, 
            height: '100%',
            boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2ecc71', mr: 2 }}>
                  <NotificationsIcon />
                </Avatar>
                <Typography variant="h5">
                  Recommendations
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {displayedRecommendations.length > 0 ? (
                <List>
                  {displayedRecommendations.map((rec, idx) => (
                    <ListItem key={idx} sx={{ py: 1, px: 0 }}>
                      <Box sx={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        bgcolor: '#2ecc71', 
                        mr: 2 
                      }} />
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  minHeight: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  p: 2
                }}>
                  <Box 
                    component="img"
                    src="/health.png"
                    alt="Health Recommendations"
                    sx={{
                      width: '80px',
                      height: '80px',
                      opacity: 0.7,
                      mb: 2
                    }}
                  />
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    {recommendations.length > 0 
                      ? "Generating recommendations..." 
                      : "Submit your vitals to get personalized recommendations"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Health Records Card */}
      <Card sx={{ mt: 4, borderRadius: 3, boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#e67e22', mr: 2 }}>
                <FavoriteIcon />
              </Avatar>
              <Typography variant="h5">
                Your Health Records
              </Typography>
            </Box>
            
            <Button 
              variant="outlined" 
              onClick={() => navigateTo('/patient/healthchart')}
              size="small"
            >
              View Charts
            </Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f9fc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Blood Pressure</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Heart Rate</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length > 0 ? (
                  records.map((record) => {
                    // Analyze the record for status
                    let status = "Normal";
                    let statusColor = "#2ecc71";
                    
                    if (record.bp) {
                      const [systolic, diastolic] = record.bp.split("/").map(Number);
                      if (systolic > 140 || diastolic > 90) {
                        status = "High BP";
                        statusColor = "#e74c3c";
                      } else if (systolic < 90 || diastolic < 60) {
                        status = "Low BP";
                        statusColor = "#f39c12";
                      }
                    }
                    
                    if (record.heartRate) {
                      const hr = Number(record.heartRate);
                      if (hr > 100) {
                        status = "High HR";
                        statusColor = "#e74c3c";
                      } else if (hr < 60) {
                        status = "Low HR";
                        statusColor = "#f39c12";
                      }
                    }
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.timestamp
                            ? record.timestamp.toDate().toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell>{record.bp}</TableCell>
                        <TableCell>{record.heartRate}</TableCell>
                        <TableCell>
                          <Box 
                            sx={{
                              display: 'inline-block',
                              px: 1.5,
                              py: 0.5,
                              bgcolor: `${statusColor}20`,
                              color: statusColor,
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {status}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No health records found. Start tracking your vitals.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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
