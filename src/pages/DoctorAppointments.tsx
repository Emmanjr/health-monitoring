import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, Timestamp, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Badge
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MoreTimeIcon from "@mui/icons-material/MoreTime";
import TodayIcon from "@mui/icons-material/Today";
import DateRangeIcon from "@mui/icons-material/DateRange";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";

// Define the Appointment interface for type safety
interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  patientId: string;
  appointmentDate: Timestamp;
  status: string;
  reason?: string;
  notes?: string;
  patientImage?: string;
  createdAt?: Timestamp;
}
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return <CheckCircleIcon fontSize="small" />;
    case 'pending':
      return <AccessTimeIcon fontSize="small" />;
    case 'declined':
      return <CancelIcon fontSize="small" />;
    default:
      return undefined;
  }
};
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

// Calendar view helper component for appointment card
const AppointmentCard = ({ appointment, updateAppointmentStatus }: { 
  appointment: Appointment,
  updateAppointmentStatus: (id: string, status: string) => Promise<void>
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean; action: string}>({
    open: false,
    action: ""
  });

  const toggleExpand = () => setExpanded(!expanded);

  const handleAction = (action: string) => {
    setConfirmDialog({
      open: true,
      action
    });
  };

  const confirmAction = async () => {
    await updateAppointmentStatus(appointment.id, confirmDialog.action);
    setConfirmDialog({ open: false, action: "" });
  };

  const closeDialog = () => {
    setConfirmDialog({ open: false, action: "" });
  };

  // Generate background color based on appointment time
  const getBgColor = () => {
    try {
      const hour = appointment.appointmentDate.toDate().getHours();
      if (hour < 10) return "rgba(236, 245, 255, 0.7)"; // Morning
      else if (hour < 14) return "rgba(255, 248, 225, 0.7)"; // Mid-day
      else return "rgba(237, 247, 237, 0.7)"; // Afternoon
    } catch (e) {
      return "rgba(236, 245, 255, 0.7)";
    }
  };
 
  // Format appointment time
  const formatTime = () => {
    try {
      return appointment.appointmentDate.toDate().toLocaleTimeString([], {
        hour: '2-digit', 
        minute:'2-digit'
      });
    } catch (e) {
      return "Invalid time";
    }
  };

  // Format appointment date
  const formatDate = () => {
    try {
      return appointment.appointmentDate.toDate().toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        backgroundColor: getBgColor(),
        borderLeft: `4px solid ${
          appointment.status.toLowerCase() === "approved" ? theme.palette.success.main :
          appointment.status.toLowerCase() === "declined" ? theme.palette.error.main :
          theme.palette.warning.main
        }`,
        transition: "all 0.3s ease",
        '&:hover': {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: theme.palette.primary.main, lineHeight: 1 }}>
              {formatDate().split(' ')[1]}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: "medium", textTransform: "uppercase" }}>
              {formatDate().split(' ')[0]}
            </Typography>
            <Chip 
              label={formatTime()} 
              size="small" 
              sx={{ mt: 1, fontSize: "0.7rem" }}
              icon={<AccessTimeIcon fontSize="small" />}
            />
          </Box>
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Avatar 
                src={appointment.patientImage}
                sx={{ width: 32, height: 32, mr: 1 }}
              >
                {appointment.patientName.charAt(0)}
              </Avatar>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {appointment.patientName}
              </Typography>
            </Box>
            
            {appointment.reason && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Reason: {appointment.reason}
              </Typography>
            )}
            
            <Chip 
              icon={getStatusIcon(appointment.status)}
              label={appointment.status} 
              color={getStatusColor(appointment.status) as any}
              size="small"
              variant="outlined"
            />
            
            {expanded && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Appointment Notes
                </Typography>
                <Typography variant="body2">
                  {appointment.notes || "No notes provided for this appointment."}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box>
            {appointment.status.toLowerCase() === "pending" ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button 
                  size="small"
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleAction("Approved")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => handleAction("Declined")}
                >
                  Decline
                </Button>
              </Box>
            ) : (
              <Button
                size="small"
                onClick={toggleExpand}
                color="primary"
              >
                {expanded ? "Less" : "More"}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeDialog}>
        <DialogTitle>
          Confirm {confirmDialog.action === "Approved" ? "Approval" : "Declining"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {confirmDialog.action === "Approved" ? "approve" : "decline"} the appointment with {appointment.patientName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmAction} 
            color={confirmDialog.action === "Approved" ? "success" : "error"}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorName, setDoctorName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"all" | "today" | "upcoming" | "past">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // For snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info"
  });

  // Filtered appointments based on view and status
  const filteredAppointments = appointments.filter(app => {
    // Filter by view
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dateMatch = true;
    try {
      const appDate = app.appointmentDate.toDate();

      switch(view) {
        case "today":
          const endOfToday = new Date(today);
          endOfToday.setHours(23, 59, 59, 999);
          dateMatch = appDate >= today && appDate <= endOfToday;
          break;
        case "upcoming":
          dateMatch = appDate >= today;
          break;
        case "past":
          dateMatch = appDate < today;
          break;
        default:
          dateMatch = true;
      }
    } catch (e) {
      console.error("Date comparison error:", e);
    }

    // Filter by status
    const statusMatch = statusFilter === "all" || app.status.toLowerCase() === statusFilter.toLowerCase();
    
    return dateMatch && statusMatch;
  });

  // Sort appointments by date
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    try {
      return a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime();
    } catch (e) {
      return 0;
    }
  });

  // Get counts for tabs
  const todayCount = appointments.filter(app => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      
      const appDate = app.appointmentDate.toDate();
      return appDate >= today && appDate <= endOfToday;
    } catch (e) {
      return false;
    }
  }).length;

  const pendingCount = appointments.filter(app => app.status.toLowerCase() === "pending").length;

  // Fetch the doctor's name from Firestore for the current user
  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!auth.currentUser) {
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.name) {
            setDoctorName(data.name);
          } else {
            setError("Doctor profile not complete");
          }
        } else {
          setError("Doctor profile not found");
        }
      } catch (error: any) {
        console.error("Error fetching doctor data:", error);
        setError("Failed to fetch doctor data: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorName();
  }, []);

  // Real-time listener: fetch appointments for the current doctor by their name
  useEffect(() => {
    if (!auth.currentUser || !doctorName) return;
    
    setLoading(true);
    
    const q = query(
      collection(db, "appointments"),
      where("doctorName", "==", doctorName),
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (querySnapshot) => {
        try {
          const appointmentData: Appointment[] = querySnapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            // Ensure all necessary fields are present to avoid errors
            return {
              id: docSnap.id,
              patientName: data.patientName || "Unknown Patient",
              patientId: data.patientId || "",
              doctorName: data.doctorName || doctorName,
              appointmentDate: data.appointmentDate,
              status: data.status || "Pending",
              reason: data.reason || "General Checkup",
              notes: data.notes || "",
              patientImage: data.patientImage || "",
              createdAt: data.createdAt || Timestamp.now()
            };
          });
          
          setAppointments(appointmentData);
          setLoading(false);
          setError(null);
        } catch (err: any) {
          console.error("Error processing appointments:", err);
          setError("Error loading appointments: " + err.message);
          setLoading(false);
        }
      },
      (err: any) => {
        console.error("Error fetching appointments:", err);
        setError(`Error fetching appointments: ${err.message}`);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [doctorName, auth.currentUser]);

  // Function to update appointment status (approve or decline)
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { 
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      setSnackbar({
        open: true,
        message: `Appointment ${newStatus.toLowerCase()} successfully`,
        severity: newStatus.toLowerCase() === "approved" ? "success" : "info"
      });
      
      // Update already handled by the real-time listener
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update appointment status: " + error.message,
        severity: "error"
      });
    }
  };
  const handleViewChange = (event: React.SyntheticEvent, newValue: "all" | "today" | "upcoming" | "past") => {
    setView(newValue);
  };

  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return "N/A";
    }
    try {
      return timestamp.toDate().toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error("Date conversion error:", err);
      return "Invalid date";
    }
  };

  // Navigate back to doctor dashboard
  const handleNavigateBack = () => {
    navigate(-1);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography variant="h6" color="text.secondary">Loading appointments...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", pb: 4 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: 'primary.main' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleNavigateBack}>
            <ArrowBackIcon />
          </IconButton>
          <MedicalInformationIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            Appointment Management
          </Typography>
          <Badge badgeContent={pendingCount} color="error">
            <Chip 
              icon={<AccessTimeIcon />} 
              label="Pending" 
              size="small"
              color="warning"
              variant="outlined"
            />
          </Badge>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Header with Banner */}
        <Paper 
          sx={{ 
            position: 'relative',
            height: '160px',
            mb: 4,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url(https://images.unsplash.com/photo-1631217868264-e6f75cc0d349?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1191&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.8)'
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
            display: 'flex',
            alignItems: 'center',
            px: 3
          }}>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Dr. {doctorName}'s Appointments
              </Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>
                You have {appointments.length} appointments 
                {todayCount > 0 && ` (${todayCount} today)`}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {/* Tabs and Filters */}
        <Box sx={{ display: 'flex', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Tabs 
            value={view} 
            onChange={handleViewChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              bgcolor: 'white', 
              borderRadius: 1,
              boxShadow: 1,
              flexGrow: 1,
              '& .MuiTab-root': { 
                minHeight: 48,
                textTransform: 'none',
              },
            }}
          >
            <Tab 
              icon={<DateRangeIcon />} 
              iconPosition="start" 
              label="All Appointments" 
              value="all" 
            />
            <Tab 
              icon={<TodayIcon />}
              iconPosition="start" 
              label={
                <Box component="span">
                  Today
                  {todayCount > 0 && (
                    <Chip 
                      label={todayCount} 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1, height: 20, minWidth: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              } 
              value="today" 
            />
            <Tab 
              icon={<MoreTimeIcon />} 
              iconPosition="start" 
              label="Upcoming" 
              value="upcoming" 
            />
            <Tab 
              icon={<EventIcon />} 
              iconPosition="start" 
              label="Past" 
              value="past" 
            />
          </Tabs>

          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150, 
              ml: { xs: 0, sm: 2 },
              bgcolor: 'white',
              borderRadius: 1,
              boxShadow: 1
            }}
          >
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ height: 48 }}
              startAdornment={
                <FilterListIcon sx={{ mr: 1, color: 'action.active' }} />
              }
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {/* Calendar View / Appointment Cards */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 40px -12px rgba(0,0,0,0.1)", mb: 4, overflow: 'visible' }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: "#e3f2fd", color: 'primary.main', mr: 1 }}>
                    <CalendarMonthIcon />
                  </Avatar>
                  <Typography variant="h5">
                    {view === "all" ? "All Appointments" : 
                     view === "today" ? "Today's Appointments" :
                     view === "upcoming" ? "Upcoming Appointments" : "Past Appointments"}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {filteredAppointments.length} appointments
                  </Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {sortedAppointments.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
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
                    <Typography variant="body1" color="text.secondary">
                      No appointments found for the selected filters.
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {sortedAppointments.map((appointment) => (
                      <AppointmentCard 
                        key={appointment.id}
                        appointment={appointment}
                        updateAppointmentStatus={updateAppointmentStatus}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Stats and Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 8px 40px -12px rgba(0,0,0,0.1)", mb: 4, height: 'fit-content' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Appointment Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        bgcolor: 'rgba(255, 152, 0, 0.1)',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                        {appointments.filter(a => a.status.toLowerCase() === 'pending').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {appointments.filter(a => a.status.toLowerCase() === 'approved').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                        {appointments.filter(a => a.status.toLowerCase() === 'declined').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Declined
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Today's Schedule
                </Typography>
                
                {todayCount > 0 ? (
                  appointments
                    .filter(app => {
                      try {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endOfToday = new Date(today);
                        endOfToday.setHours(23, 59, 59, 999);
                        
                        const appDate = app.appointmentDate.toDate();
                        return appDate >= today && appDate <= endOfToday;
                      } catch (e) {
                        return false;
                      }
                    })
                    .sort((a, b) => {
                      try {
                        return a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime();
                      } catch (e) {
                        return 0;
                      }
                    })
                    .map((app) => (
                      <Box key={app.id} sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        py: 1,
                        borderBottom: `1px dashed ${theme.palette.divider}`
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%',
                          bgcolor: getStatusColor(app.status) === 'success' 
                            ? theme.palette.success.main 
                            : getStatusColor(app.status) === 'warning'
                              ? theme.palette.warning.main
                              : theme.palette.error.main,
                          mr: 1.5
                        }} />
                        <Box>
                          <Typography variant="body2">
                            {app.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {app.appointmentDate?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto' }}>
                          <Chip 
                            label={app.status} 
                            size="small" 
                            color={getStatusColor(app.status) as any}
                            sx={{ height: 24 }}
                          />
                        </Box>
                      </Box>
                    ))
                ) : (
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No appointments scheduled for today
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Quick Tips
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                    • Review appointment details before approval
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Check patient records for relevant history
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    • Schedule follow-ups for critical cases
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Box 
                component="img"
                src="https://img.freepik.com/free-vector/doctors-concept-illustration_114360-1515.jpg"
                alt="Doctor illustration"
                sx={{
                  width: '100%',
                  maxWidth: 250,
                  borderRadius: 2,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
      
      {/* Success/Error Messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}