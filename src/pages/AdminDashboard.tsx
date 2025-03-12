// src/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { User, Appointment } from "../types";
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// Custom hook for managing users
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<User, "id">),
        }));
        setUsers(userData);
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
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  };

  return { users, loading, error, deleteUser };
};

// Custom hook for managing appointments
const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const appointmentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Appointment, "id">),
        }));
        setAppointments(appointmentData);
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
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
    } catch (err) {
      console.error("Error deleting appointment:", err);
      alert("Failed to delete appointment");
    }
  };

  return { appointments, loading, error, deleteAppointment };
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    users,
    loading: usersLoading,
    error: usersError,
    deleteUser,
  } = useUsers();

  const {
    appointments,
    loading: appsLoading,
    error: appsError,
    deleteAppointment,
  } = useAppointments();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out");
    }
  };

  if (usersLoading || appsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4
      }}>
        <Typography variant="h3" gutterBottom>
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ height: "fit-content" }}
        >
          Logout
        </Button>
      </Box>

      {usersError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {usersError}
        </Alert>
      )}
      {appsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {appsError}
        </Alert>
      )}

      {/* Users Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Manage Users ({users.length})
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => deleteUser(user.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Appointments Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Manage Appointments ({appointments.length})
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.patientName}</TableCell>
                  <TableCell>{app.doctorName}</TableCell>
                  <TableCell>
                    {app.appointmentDate?.toDate().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>{app.status}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => deleteAppointment(app.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}