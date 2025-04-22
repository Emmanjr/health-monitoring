// src/AdminAppointments.tsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Appointment } from "../types";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  Tooltip,
  Divider
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TodayIcon from "@mui/icons-material/Today";
import FilterListIcon from "@mui/icons-material/FilterList";

const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add appointment statistics state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0
  });

  useEffect(() => {
    // Use query with orderBy to sort by date
    const q = query(collection(db, "appointments"), orderBy("appointmentDate", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Appointment, "id">),
        }));

        // Calculate appointment statistics
        const appointmentStats = {
          total: data.length,
          pending: data.filter(app => app.status.toLowerCase() === 'pending').length,
          approved: data.filter(app => app.status.toLowerCase() === 'approved').length,
          declined: data.filter(app => app.status.toLowerCase() === 'declined').length
        };
        
        setAppointments(data);
        setStats(appointmentStats);
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
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
      return true;
    } catch (err) {
      console.error("Error deleting appointment:", err);
      return false;
    }
  };

  return { appointments, stats, loading, error, deleteAppointment };
};

export default function AdminAppointments() {
  const theme = useTheme();
  const { appointments, stats, loading, error, deleteAppointment } = useAppointments();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  
  // Status alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("success");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Apply filters to appointments
  const filteredAppointments = appointments.filter(app => {
    // Search filter: name, doctor or reason
  const searchMatch = 
    searchTerm === "" || 
    (app.patientName && app.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.doctorName && app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));

  const statusMatch = statusFilter === "all" || (app.status && app.status.toLowerCase() === statusFilter.toLowerCase());
    
    // Time filter
    let timeMatch = true;
    if (timeFilter !== "all" && app.appointmentDate) {
      const now = new Date();
      const appDate = app.appointmentDate.toDate();

      if (timeFilter === "upcoming") {
        timeMatch = appDate >= now;
      } else if (timeFilter === "past") {
        timeMatch = appDate < now;
      } else if (timeFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        timeMatch = appDate >= today && appDate < tomorrow;
      }
    }
    
    return searchMatch && statusMatch && timeMatch;
  });

  // Apply pagination
  const paginatedAppointments = filteredAppointments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format appointment date nicely
  const formatDate = (date: any) => {
    if (!date || !date.toDate) return "Invalid date";
    
    try {
      return date.toDate().toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid date";
    }
  };

  // Get status chip color
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircleIcon fontSize="small" />;
      case "pending":
        return <AccessTimeIcon fontSize="small" />;
      case "declined":
        return <CancelIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Delete appointment handlers
  const handleDeleteClick = (id: string) => {
    setAppointmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    
    const success = await deleteAppointment(appointmentToDelete);
    if (success) {
      setAlertMessage("Appointment deleted successfully");
      setAlertSeverity("success");
      setAlertOpen(true);
    } else {
      setAlertMessage("Failed to delete appointment");
      setAlertSeverity("error");
      setAlertOpen(true);
    }
    
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  if (loading) {
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
          Appointments Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all patient appointments in the system
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#e3f2fd', color: theme.palette.primary.main }}>
                  <CalendarMonthIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Total" 
                    size="small" 
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#fff9c4', color: theme.palette.warning.main }}>
                  <AccessTimeIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Pending" 
                    size="small" 
                    sx={{ 
                      bgcolor: theme.palette.warning.main,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#e8f5e9', color: theme.palette.success.main }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Approved" 
                    size="small" 
                    sx={{ 
                      bgcolor: theme.palette.success.main,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: '#ffebee', color: theme.palette.error.main }}>
                  <CancelIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Declined" 
                    size="small" 
                    sx={{ 
                      bgcolor: theme.palette.error.main,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 2 }}>
                {stats.declined}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Declined Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}
      >
        {/* Search field */}
        <TextField
          placeholder="Search appointments..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              startAdornment={
                <FilterListIcon sx={{ color: 'action.active', mr: 1 }} />
              }
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-filter-label">Time</InputLabel>
            <Select
              labelId="time-filter-label"
              id="time-filter"
              value={timeFilter}
              label="Time"
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPage(0);
              }}
              startAdornment={
                <TodayIcon sx={{ color: 'action.active', mr: 1 }} />
              }
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="past">Past</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Appointments Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1, bgcolor: theme.palette.primary.light, width: 32, height: 32 }}>
                          {app.patientName ? app.patientName.charAt(0).toUpperCase() : 'P'}
                        </Avatar>
                        <Typography variant="body2">
                          {app.patientName || "Unknown Patient"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            mr: 1, 
                            bgcolor: '#e3f2fd', 
                            color: theme.palette.primary.main,
                            width: 28,
                            height: 28,
                            fontSize: '0.9rem'
                          }}
                        >
                          <LocalHospitalIcon sx={{ fontSize: '1rem' }} />
                        </Avatar>
                        <Typography variant="body2">Dr. {app.doctorName || "Unknown"}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(app.appointmentDate)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(app.status || "") || undefined}
                        label={app.status}
                        size="small"
                        color={getStatusColor(app.status || "") as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 150, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}
                      >
                        {"General Checkup"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete Appointment">
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleDeleteClick(app.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                      <EventIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        {appointments.length > 0
                          ? 'No appointments match your search criteria'
                          : 'No appointments found in the system'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAppointments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Appointment Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this appointment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog
        open={alertOpen}
        onClose={handleAlertClose}
        maxWidth="xs"
        fullWidth
      >
        <Alert 
          severity={alertSeverity}
          onClose={handleAlertClose}
          sx={{ '& .MuiAlert-message': { width: '100%' } }}
        >
          <Box sx={{ py: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {alertMessage}
            </Typography>
          </Box>
        </Alert>
      </Dialog>
    </Box>
  );
}
