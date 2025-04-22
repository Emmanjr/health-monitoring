// src/pages/Admin.tsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, query, getDocs, limit, orderBy, where } from "firebase/firestore";
import { User, Appointment } from "../types";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  Tooltip
} from "@mui/material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import PatientIcon from "@mui/icons-material/PersonOutline";
import DoctorIcon from "@mui/icons-material/LocalHospital";
import AdminIcon from "@mui/icons-material/AdminPanelSettings";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/PendingActions";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Link } from "react-router-dom";
import { deleteUser as deleteFirebaseUser } from "../utils/deleteUser";

// Custom hook for managing users
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userStats, setUserStats] = useState({
    total: 0,
    patients: 0,
    doctors: 0,
    admins: 0
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<User, "id">),
        }));
        
        // Calculate user statistics by role
        const stats = userData.reduce((acc, user) => {
          acc.total += 1;
          if (user.role === "patient") acc.patients += 1;
          else if (user.role === "doctor") acc.doctors += 1;
          else if (user.role === "admin") acc.admins += 1;
          return acc;
        }, { total: 0, patients: 0, doctors: 0, admins: 0 });
        
        setUsers(userData);
        setUserStats(stats);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load users");
        setLoading(false);
        console.error("Error fetching users:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const deleteUser = async (userId: string) => {
    try {
      // Using our deleteUser utility that handles both auth and firestore
      await deleteFirebaseUser(userId);
      return true;
    } catch (err) {
      console.error("Error deleting user:", err);
      return false;
    }
  };

  return { users, userStats, loading, error, deleteUser };
};

// Custom hook for managing appointments
const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0
  });

  useEffect(() => {
    // Get all appointments for stats
    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const appointmentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Appointment, "id">),
        }));
        
        // Calculate appointment statistics by status
        const stats = appointmentData.reduce((acc, app) => {
          acc.total += 1;
          const status = app.status?.toLowerCase() || "";
          if (status === "pending") acc.pending += 1;
          else if (status === "approved") acc.approved += 1;
          else if (status === "declined") acc.declined += 1;
          return acc;
        }, { total: 0, pending: 0, approved: 0, declined: 0 });
        
        setAppointments(appointmentData);
        setAppointmentStats(stats);
        
        // Get only the recent/upcoming appointments for the dashboard
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recentApps = appointmentData
          .filter(app => app.appointmentDate && app.appointmentDate.toDate() >= today)
          .sort((a, b) => {
            if (!a.appointmentDate || !b.appointmentDate) return 0;
            return a.appointmentDate.toDate().getTime() - b.appointmentDate.toDate().getTime();
          })
          .slice(0, 5); // Limit to 5 upcoming appointments
        
        setRecentAppointments(recentApps);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load appointments");
        setLoading(false);
        console.error("Error fetching appointments:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const deleteAppointment = async (appointmentId: string) => {
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
      return true;
    } catch (err) {
      console.error("Error deleting appointment:", err);
      return false;
    }
  };

  return { 
    appointments, 
    recentAppointments,
    appointmentStats, 
    loading, 
    error, 
    deleteAppointment 
  };
};

export default function AdminDashboard() {
  const theme = useTheme();
  const {
    users,
    userStats,
    loading: usersLoading,
    error: usersError,
    deleteUser,
  } = useUsers();

  const {
    appointments,
    recentAppointments,
    appointmentStats,
    loading: appsLoading,
    error: appsError,
    deleteAppointment,
  } = useAppointments();

  // State for managing user delete dialog
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // State for managing appointment delete dialog
  const [deleteAppDialogOpen, setDeleteAppDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<string | null>(null);

  // Alert/snackbar state
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning"
  });

  // Format date for display
  const formatDate = (date: any) => {
    if (!date || !date.toDate) return "N/A";
    try {
      return date.toDate().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  // User role icons and colors
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <AdminIcon />;
      case "doctor":
        return <DoctorIcon />;
      case "patient":
        return <PatientIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#8c9eff"; // indigo
      case "doctor":
        return "#4caf50"; // green
      case "patient":
        return "#2196f3"; // blue
      default:
        return "#9e9e9e"; // grey
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  // Delete user handlers
  const handleDeleteUserClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteUserDialogOpen(true);
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    
    const success = await deleteUser(userToDelete);
    if (success) {
      setAlert({
        open: true,
        message: "User deleted successfully",
        severity: "success"
      });
    } else {
      setAlert({
        open: true,
        message: "Failed to delete user",
        severity: "error"
      });
    }
    
    setDeleteUserDialogOpen(false);
    setUserToDelete(null);
  };

  // Delete appointment handlers
  const handleDeleteAppClick = (appId: string) => {
    setAppToDelete(appId);
    setDeleteAppDialogOpen(true);
  };

  const handleDeleteAppConfirm = async () => {
    if (!appToDelete) return;
    
    const success = await deleteAppointment(appToDelete);
    if (success) {
      setAlert({
        open: true,
        message: "Appointment deleted successfully",
        severity: "success"
      });
    } else {
      setAlert({
        open: true,
        message: "Failed to delete appointment",
        severity: "error"
      });
    }
    
    setDeleteAppDialogOpen(false);
    setAppToDelete(null);
  };

  // Close dialog handlers
  const handleDeleteUserCancel = () => {
    setDeleteUserDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteAppCancel = () => {
    setDeleteAppDialogOpen(false);
    setAppToDelete(null);
  };

  // Close alert handler
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Prepare data for user role pie chart
  const userRoleData = [
    { name: "Patients", value: userStats.patients, color: "#2196f3" },
    { name: "Doctors", value: userStats.doctors, color: "#4caf50" },
    { name: "Admins", value: userStats.admins, color: "#8c9eff" }
  ];

  // Prepare data for appointment status pie chart
  const appointmentStatusData = [
    { name: "Approved", value: appointmentStats.approved, color: "#4caf50" },
    { name: "Pending", value: appointmentStats.pending, color: "#ff9800" },
    { name: "Declined", value: appointmentStats.declined, color: "#f44336" }
  ];

  if (usersLoading || appsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'medium' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage all users, appointments, and system activities
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Users */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${theme.palette.primary.light}22, transparent 70%)`,
                borderRadius: '0 0 0 100%'
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}>
                  <PersonIcon />
                </Avatar>
                <Typography 
                  variant="subtitle2" 
                  color="textSecondary" 
                  sx={{ ml: 'auto', fontWeight: 500 }}
                >
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                {userStats.total}
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mt: 1
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Active Users
                  </Typography>
                </Box>
                <Button 
                  variant="text" 
                  size="small" 
                  component={Link} 
                  to="/admin/patient-details"
                  sx={{ p: 0, minWidth: 0 }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Patient Users */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${theme.palette.info.light}22, transparent 70%)`,
                borderRadius: '0 0 0 100%'
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#e3f2fd', color: theme.palette.info.main }}>
                  <PatientIcon />
                </Avatar>
                <Typography 
                  variant="subtitle2" 
                  color="textSecondary" 
                  sx={{ ml: 'auto', fontWeight: 500 }}
                >
                  Patients
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                {userStats.patients}
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mt: 1
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Registered Patients
                  </Typography>
                </Box>
                <Button 
                  variant="text" 
                  size="small" 
                  component={Link} 
                  to="/admin/patient-details"
                  sx={{ p: 0, minWidth: 0 }}
                  endIcon={<ArrowForwardIcon />}
                >
                  View All
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Doctor Users */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${theme.palette.success.light}22, transparent 70%)`,
                borderRadius: '0 0 0 100%'
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#e8f5e9', color: theme.palette.success.main }}>
                  <DoctorIcon />
                </Avatar>
                <Typography 
                  variant="subtitle2" 
                  color="textSecondary" 
                  sx={{ ml: 'auto', fontWeight: 500 }}
                >
                  Doctors
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                {userStats.doctors}
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mt: 1
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Medical Staff
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Appointment Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${theme.palette.warning.light}22, transparent 70%)`,
                borderRadius: '0 0 0 100%'
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#fff8e1', color: theme.palette.warning.main }}>
                  <EventIcon />
                </Avatar>
                <Typography 
                  variant="subtitle2" 
                  color="textSecondary" 
                  sx={{ ml: 'auto', fontWeight: 500 }}
                >
                  Appointments
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ my: 1, fontWeight: 'bold' }}>
                {appointmentStats.total}
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mt: 1
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    {appointmentStats.pending} pending
                  </Typography>
                </Box>
                <Button 
                  variant="text" 
                  size="small" 
                  component={Link} 
                  to="/admin/appointments"
                  sx={{ p: 0, minWidth: 0 }}
                  endIcon={<ArrowForwardIcon />}
                >
                  View All
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Alerts for errors */}
      {usersError && <Alert severity="error" sx={{ mb: 3 }}>{usersError}</Alert>}
      {appsError && <Alert severity="error" sx={{ mb: 3 }}>{appsError}</Alert>}

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Recent Appointments */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Upcoming Appointments
                </Typography>
                <Button 
                  component={Link} 
                  to="/admin/appointments"
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                >
                  View All
                </Button>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentAppointments.length > 0 ? (
                      recentAppointments.map((app) => (
                        <TableRow key={app.id} hover>
                          <TableCell>{app.patientName || "Unknown"}</TableCell>
                          <TableCell>{app.doctorName || "Unassigned"}</TableCell>
                          <TableCell>{formatDate(app.appointmentDate)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={app.status || "Pending"}
                              color={getStatusColor(app.status || "Pending") as any}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete appointment">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteAppClick(app.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="textSecondary">
                            No upcoming appointments
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          
          {/* Users Management */}
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Users Management
                </Typography>
                <Button 
                  component={Link} 
                  to="/admin/patient-details"
                  variant="outlined" 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                >
                  Patient Details
                </Button>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.slice(0, 6).map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                width: 28, 
                                height: 28, 
                                mr: 1,
                                bgcolor: getRoleColor(user.role || ""),
                                fontSize: '0.8rem'
                              }}
                            >
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </Avatar>
                            <Typography variant="body2">
                              {user.name || "Unnamed User"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email || "No email"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={user.role || "user"}
                            icon={getRoleIcon(user.role || "")}
                            sx={{ 
                              bgcolor: getRoleColor(user.role || "") + "20",
                              color: getRoleColor(user.role || ""),
                              borderColor: getRoleColor(user.role || "") + "50",
                              border: "1px solid"
                            }}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete user">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteUserClick(user.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {users.length > 6 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    component={Link} 
                    to="/admin/patient-details" 
                    variant="text" 
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                  >
                    View All Users ({users.length})
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* User Distribution Chart */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                User Distribution
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 220 }}>
                {userStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No user data available
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {userStats.total > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    {userRoleData.map((role) => (
                      <Chip
                        key={role.name}
                        label={`${role.name}: ${role.value}`}
                        sx={{
                          bgcolor: role.color + "20",
                          color: role.color,
                          borderColor: role.color,
                          border: "1px solid"
                        }}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {/* Appointment Status Chart */}
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                Appointment Status
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 220 }}>
                {appointmentStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={appointmentStatusData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Appointments">
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      No appointment data available
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {appointmentStats.total > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    {appointmentStatusData.map((status) => (
                      <Chip
                        key={status.name}
                        label={`${status.name}: ${status.value}`}
                        sx={{
                          bgcolor: status.color + "20",
                          color: status.color,
                          borderColor: status.color,
                          border: "1px solid"
                        }}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                Quick Actions
              </Typography>
              
              <Stack spacing={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link}
                  to="/admin/appointments"
                  fullWidth
                >
                  Manage Appointments
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  component={Link}
                  to="/admin/patient-details"
                  fullWidth
                >
                  View Patient Details
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteUserDialogOpen}
        onClose={handleDeleteUserCancel}
      >
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone and will delete all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteUserCancel}>Cancel</Button>
          <Button onClick={handleDeleteUserConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Appointment Dialog */}
      <Dialog
        open={deleteAppDialogOpen}
        onClose={handleDeleteAppCancel}
      >
        <DialogTitle>Delete Appointment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this appointment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAppCancel}>Cancel</Button>
          <Button onClick={handleDeleteAppConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={5000}
        onClose={handleAlertClose}
      >
        <Alert onClose={handleAlertClose} severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}