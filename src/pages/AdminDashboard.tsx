// src/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { User } from "../types";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  useTheme
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SearchIcon from "@mui/icons-material/Search";

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
        
        // Calculate user statistics
        const stats = {
          total: userData.length,
          patients: userData.filter(user => user.role === 'patient').length,
          doctors: userData.filter(user => user.role === 'doctor').length,
          admins: userData.filter(user => user.role === 'admin').length
        };
        
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
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      return true;
    } catch (err) {
      console.error("Error deleting user:", err);
      return false;
    }
  };

  return { users, userStats, loading, error, deleteUser };
};

export default function AdminDashboard() {
  const theme = useTheme();
  const { users, userStats, loading, error, deleteUser } = useUsers();
  
  // State for search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Status alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("success");

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === "" || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === null || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Sort users by name
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return (a.name && b.name) ? a.name.localeCompare(b.name) : 0;
  });

  // Get paginated list of users
  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle user deletion with confirmation
  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    const success = await deleteUser(userToDelete);
    if (success) {
      setDeleteSuccess(true);
      setAlertMessage("User deleted successfully");
      setAlertSeverity("success");
      setAlertOpen(true);
    } else {
      setDeleteError("Failed to delete user. Please try again.");
      setAlertMessage("Failed to delete user");
      setAlertSeverity("error");
      setAlertOpen(true);
    }
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  // Handle role filter
  const handleRoleFilter = (role: string | null) => {
    setRoleFilter(role === roleFilter ? null : role);
    setPage(0);
  };

  // Role chip color
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'error';
      case 'doctor': return 'primary';
      case 'patient': return 'success';
      default: return 'default';
    }
  };

  // Role icon
  const getRoleIcon = (role: string): React.ReactElement | undefined => {
    switch(role) {
      case 'admin': return <AdminPanelSettingsIcon fontSize="small" />;
      case 'doctor': return <LocalHospitalIcon fontSize="small" />;
      case 'patient': return <PersonIcon fontSize="small" />;
      default: return undefined;
    }
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
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all system users including patients, doctors and administrators
        </Typography>
      </Box>
      
      {/* Stats Cards */}
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
                  <PeopleIcon />
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
                {userStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
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
                  <PersonIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Patients" 
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
                {userStats.patients}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered Patients
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
                <Avatar sx={{ bgcolor: '#e3f2fd', color: theme.palette.primary.main }}>
                  <LocalHospitalIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Doctors" 
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
                {userStats.doctors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Doctors
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
                  <AdminPanelSettingsIcon />
                </Avatar>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label="Admins" 
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
                {userStats.admins}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Administrators
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Search and Filter */}
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
        <TextField
          placeholder="Search users..."
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
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            icon={<PersonIcon />}
            label="Patients"
            color={roleFilter === 'patient' ? 'success' : 'default'}
            variant={roleFilter === 'patient' ? "filled" : "outlined"}
            onClick={() => handleRoleFilter('patient')}
            clickable
          />
          <Chip 
            icon={<LocalHospitalIcon />}
            label="Doctors"
            color={roleFilter === 'doctor' ? 'primary' : 'default'}
            variant={roleFilter === 'doctor' ? "filled" : "outlined"}
            onClick={() => handleRoleFilter('doctor')}
            clickable
          />
          <Chip 
            icon={<AdminPanelSettingsIcon />}
            label="Admins"
            color={roleFilter === 'admin' ? 'error' : 'default'}
            variant={roleFilter === 'admin' ? "filled" : "outlined"}
            onClick={() => handleRoleFilter('admin')}
            clickable
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Users Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.light }}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                        <Typography variant="body2">
                          {user.name || "Unknown User"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={getRoleIcon(user.role || '')}
                        label={user.role} 
                        color={getRoleColor(user.role || '') as any} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete User">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteClick(user.id)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {users.length > 0 
                        ? 'No users match your search criteria'
                        : 'No users found in the system'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
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
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
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
      
      {/* Alert for success/error messages */}
      <Dialog
        open={alertOpen}
        onClose={handleAlertClose}
        maxWidth="xs"
        fullWidth
      >
        <Alert 
          severity={alertSeverity}
          onClose={handleAlertClose}
          sx={{ 
            '& .MuiAlert-message': { width: '100%' }
          }}
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
