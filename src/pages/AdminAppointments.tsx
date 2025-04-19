// src/AdminAppointments.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Appointment } from "../types";
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Pagination from "@mui/material/Pagination";

const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Appointment, "id">),
        }));
        setAppointments(data);
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

export default function AdminAppointments() {
  const navigate = useNavigate();
  const { appointments, loading, error, deleteAppointment } = useAppointments();

  // Pagination states for Appointments
  const [page, setPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.ceil(appointments.length / perPage);
  const displayedApps = appointments.slice((page - 1) * perPage, page * perPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Manage Appointments ({appointments.length})
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ mb: 2 }}>
        <List>
          {displayedApps.map((app) => (
            <ListItem key={app.id} divider>
              <ListItemText
                primary={`${app.patientName} with Dr. ${app.doctorName}`}
                secondary={`Date: ${app.appointmentDate?.toDate().toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })} • Status: ${app.status}`}
              />
              <ListItemSecondaryAction>
                <IconButton color="error" onClick={() => deleteAppointment(app.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
      </Box>
    </Container>
  );
}
