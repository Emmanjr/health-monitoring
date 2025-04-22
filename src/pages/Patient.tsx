import React, { useState, useEffect } from "react";
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Box, 
  Button, 
  Avatar,
  Divider,
  CircularProgress,
  Chip,
  CardActionArea,
  Skeleton
} from "@mui/material";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EventIcon from "@mui/icons-material/Event";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ArticleIcon from "@mui/icons-material/Article";

export default function Patient() {
  const [userData, setUserData] = useState<any>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [latestVitals, setLatestVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const navigate = useNavigate();

  // Fetch user data and set up real-time listeners for health data
  useEffect(() => {
    if (!auth.currentUser) return;
    
    let unsubscribeVitals: () => void;
    let unsubscribeAppointments: () => void;

    const fetchData = async () => {
      try {
        // Fetch user profile data (one-time)
        if (!auth.currentUser?.uid) {
          throw new Error("User is not authenticated");
        }
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Set up real-time listener for vitals (just like in Vitals component)
        const vitalsQuery = query(
          collection(db, "healthRecords"),
          where("userId", "==", auth.currentUser?.uid),
        );
        
        unsubscribeVitals = onSnapshot(
          vitalsQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const allRecords = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              setHealthRecords(allRecords);
              
              // Set latest vitals (first record)
              setLatestVitals(allRecords[0]);
            }
          },
          (error) => {
            console.error("Error fetching vitals:", error);
          }
        );
        
        // Set up real-time listener for upcoming appointments
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("patientId", "==", auth.currentUser.uid),
        );
        
        unsubscribeAppointments = onSnapshot(
          appointmentsQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              setUpcomingAppointment({
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
              });
            }
          },
          (error) => {
            console.error("Error fetching appointments:", error);
          }
        );
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
    
    // Clean up listeners when component unmounts
    return () => {
      if (unsubscribeVitals) unsubscribeVitals();
      if (unsubscribeAppointments) unsubscribeAppointments();
    };
  }, []);

  // Navigate to specific sections using React Router (no page refresh)
  const navigateTo = (path: string) => {
    navigate(path);
  };
  
  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return "N/A";
    }
    return timestamp.toDate().toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      {/* User Profile Card */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: "0 8px 40px -12px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            height="140"
            image="https://images.unsplash.com/photo-1504813184591-01572f98c85f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
            alt="Health banner"
            sx={{ filter: "brightness(0.7)" }}
          />
          
          <Box 
            sx={{ 
              position: "absolute", 
              bottom: -50, 
              left: 20,
              display: "flex",
              alignItems: "flex-end"
            }}
          >
            <Avatar
              sx={{ 
                width: 100, 
                height: 100, 
                border: "4px solid white",
                bgcolor: "#3498db"
              }}
            >
              {userData?.name?.charAt(0) || "P"}
            </Avatar>
            
            <Box sx={{ ml: 2, color: "white", pb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.5)", textTransform: "capitalize" }}>
                {userData?.name || "Patient"}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <CardContent sx={{ pt: 7 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Age</Typography>
              <Typography variant="body1">{userData?.age || "Not set"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Gender</Typography>
              <Typography variant="body1">{userData?.gender || "Not set"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">BMI</Typography>
              <Typography variant="body1">{userData?.bmi || "Not set"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Activity Level</Typography>
              <Typography variant="body1">{userData?.physicalActivity || "Not set"}</Typography>
            </Grid>
          </Grid>
          
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => navigateTo("/patient/vitals")}
          >
            Update Health Profile
          </Button>
        </CardContent>
      </Card>

      {/* Health Stats Cards */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: "bold" }}>
        Health Overview
      </Typography>
      
      <Grid container spacing={3}>
        {/* Blood Pressure Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#e74c3c', mr: 1 }}>
                  <FavoriteIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Blood Pressure
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                  <Skeleton width="80%" height={40} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {latestVitals?.bp || "N/A"}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last measured: {latestVitals?.timestamp ? formatDate(latestVitals.timestamp) : "Never"}
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button 
                size="small" 
                onClick={() => navigateTo("/patient/vitals")}
                fullWidth
              >
                Update
              </Button>
            </Box>
          </Card>
        </Grid>
        
        {/* Heart Rate Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#3498db', mr: 1 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Heart Rate
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? (
                  <Skeleton width="80%" height={40} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : "N/A"}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last measured: {latestVitals?.timestamp ? formatDate(latestVitals.timestamp) : "Never"}
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button 
                size="small" 
                onClick={() => navigateTo("/patient/vitals")}
                fullWidth
              >
                Update
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Next Appointment Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#2ecc71', mr: 1 }}>
                  <EventIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Next Appointment
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ height: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {loading ? (
                  <Skeleton width="80%" height={40} />
                ) : upcomingAppointment ? (
                  <>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Dr. {upcomingAppointment.doctorName}
                    </Typography>
                    <Typography variant="body2">
                      {upcomingAppointment.appointmentDate ? 
                        formatDate(upcomingAppointment.appointmentDate) : ""}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No upcoming appointments
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Status: {upcomingAppointment?.status || "N/A"}
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button 
                size="small" 
                onClick={() => navigateTo("/patient/appointments")}
                fullWidth
              >
                Schedule
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Health Tips Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar sx={{ bgcolor: '#9b59b6', mr: 1 }}>
                  <LocalHospitalIcon />
                </Avatar>
                <Typography variant="h6" component="div">
                  Health Tips
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" align="center">
                  {latestVitals?.bp ? 
                    generateHealthTip(latestVitals.bp, latestVitals.heartRate) : 
                    "Stay hydrated and maintain a balanced diet"}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Updated: Today
              </Typography>
            </CardContent>
            <Box sx={{ px: 2, pb: 2 }}>
              <Button 
                size="small" 
                onClick={() => navigateTo("/patient/healthchart")}
                fullWidth
              >
                View Progress
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Health Progress Card */}
      <Card sx={{ mt: 4, mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Health Progress</Typography>
            <Button 
              size="small" 
              onClick={() => navigateTo("/patient/healthchart")}
            >
              View Details
            </Button>
          </Box>
          
          {healthRecords.length > 2 ? (
            <Box sx={{ 
              height: '150px', 
              bgcolor: '#f8f9fa', 
              borderRadius: 2,
              p: 2,
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Latest Blood Pressure Readings
              </Typography>
              <Box sx={{ display: 'flex', height: '70%', alignItems: 'flex-end' }}>
                {healthRecords.slice(0, 5).map((record, index) => {
                  // Calculate bar height based on BP
                  let height = 50; // Default height
                  if (record.bp) {
                    const systolic = parseInt(record.bp.split('/')[0]);
                    height = Math.min(Math.max((systolic / 180) * 100, 20), 100);
                  }
                  
                  // Determine color based on BP value
                  let color = '#3498db'; // Default color
                  if (record.bp) {
                    const systolic = parseInt(record.bp.split('/')[0]);
                    if (systolic > 140) color = '#e74c3c';
                    else if (systolic < 90) color = '#f39c12';
                  }
                  
                  return (
                    <Box 
                      key={index}
                      sx={{ 
                        flex: 1,
                        mx: 0.5,
                        height: `${height}%`,
                        bgcolor: color,
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        '&:hover': {
                          opacity: 0.8,
                        },
                        '&:hover::after': {
                          content: `"${record.bp || 'N/A'}"`,
                          position: 'absolute',
                          top: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap',
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              height: '150px', 
              bgcolor: '#f8f9fa', 
              borderRadius: 2, 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                Not enough data to display chart. Add more vitals.
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Blood Pressure" color="primary" size="small" />
            <Chip label="Heart Rate" color="secondary" size="small" />
            <Chip label="Exercise" color="success" size="small" />
            <Chip label="Sleep" color="info" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* Health Articles */}
      <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", display: 'flex', alignItems: 'center' }}>
          <ArticleIcon sx={{ mr: 1 }} />
          Health Resources
        </Typography>
        <Button 
          variant="text" 
          color="primary" 
          onClick={() => navigateTo('/patient/healthblog')}
        >
          View All Resources
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Article 1 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardActionArea onClick={() => navigateTo('/patient/healthblog')}>
              <CardMedia
                component="img"
                height="140"
                image="https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Healthy diet"
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  Balanced Diet Tips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Learn about the importance of a balanced diet and how it affects your heart health.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        {/* Article 2 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardActionArea onClick={() => navigateTo('/patient/healthblog')}>
              <CardMedia
                component="img"
                height="140"
                image="https://plus.unsplash.com/premium_photo-1664303370975-5c535d2fdf90?q=80&w=1455&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Exercise"
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  Home Workouts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Simple exercises you can do at home to maintain a healthy cardiovascular system.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        {/* Article 3 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
            },
          }}>
            <CardActionArea onClick={() => navigateTo('/patient/healthblog')}>
              <CardMedia
                component="img"
                height="140"
                image="https://images.unsplash.com/photo-1558451507-fa1a9432efb4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Meditation"
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  Stress Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Effective strategies to manage stress and improve your overall wellbeing.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

// Helper function to generate health tips based on vitals
function generateHealthTip(bp: string, heartRate: string | number) {
  // Default tips
  const tips = [
    "Stay hydrated and maintain a balanced diet",
    "Aim for 30 minutes of exercise daily",
    "Practice mindfulness to reduce stress",
    "Get 7-9 hours of quality sleep"
  ];
  
  // Parse BP values
  const [systolic, diastolic] = bp.split("/").map(Number);
  const hr = Number(heartRate);
  
  // Generate specific tips based on vitals
  if (systolic > 140 || diastolic > 90) {
    return "Consider reducing salt intake and monitoring your BP regularly";
  }
  
  if (systolic < 90 || diastolic < 60) {
    return "Ensure you're staying hydrated and eating regular meals";
  }
  
  if (hr > 100) {
    return "Practice relaxation techniques and avoid caffeine";
  }
  
  if (hr < 60) {
    return "Maintain regular physical activity for heart health";
  }
  
  // Return a random general tip if no specific conditions are met
  return tips[Math.floor(Math.random() * tips.length)];
}