// src/AdminPatientDetails.tsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
} from "@mui/material";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

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
}

interface HealthRecord {
  id: string;
  bp: string;         // e.g., "120/80"
  heartRate: number;
  timestamp: any;
}

const AdminPatientDetails = () => {
  // State for patients list (users with role "patient")
  const [patients, setPatients] = useState<any[]>([]);
  // Selected patient's UID
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  // Patient's lifestyle data
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  // Patient's health records (vitals)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
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
      } catch (error: any) {
        showSnackbar("Error fetching patients: " + error.message, "error");
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
      }
    };

    // Fetch patient health records (vitals)
    const q = query(collection(db, "healthRecords"), where("userId", "==", selectedPatientId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recordsData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            bp: data.bp || "",
            heartRate: data.heartRate ? Number(data.heartRate) : 0,
            timestamp: data.timestamp,
          };
        });
        setHealthRecords(recordsData);
      },
      (error) => {
        showSnackbar("Error fetching health records: " + error.message, "error");
      }
    );

    fetchPatientData();
    return () => unsubscribe();
  }, [selectedPatientId]);

  // Prepare chart data: parse bp => systolic/diastolic, plus heartRate
  const chartData = healthRecords
    .map((record) => {
      // Split the bp string (e.g., "120/80") into two values
      let systolic = 0;
      let diastolic = 0;
      if (record.bp) {
        const [sys, dia] = record.bp.split("/").map(Number);
        systolic = sys || 0;
        diastolic = dia || 0;
      }

      return {
        timestamp: record.timestamp
          ? record.timestamp.toDate().toLocaleString()
          : "",
        heartRate: record.heartRate,
        systolic,
        diastolic,
      };
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Patient Details
      </Typography>

      {/* Patient Selection Dropdown */}
      <FormControl fullWidth sx={{ mb: 2 }}>
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
              {pt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Display Patient Lifestyle Data */}
      {patientData && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {patientData.name}'s Lifestyle Info
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2">Age: {patientData.age}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Gender: {patientData.gender}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">BMI: {patientData.bmi}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Ethnicity: {patientData.ethnicity}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Diet: {patientData.diet}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Alcohol Use: {patientData.alcoholUse}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Smoking: {patientData.smokingHabits}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Stress: {patientData.stressLevels}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Activity: {patientData.physicalActivity}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Display Patient Health Records */}
      {healthRecords.length > 0 && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {patientData?.name}'s Health Records
          </Typography>
          <List>
            {healthRecords.map((record) => (
              <ListItem key={record.id} divider>
                <ListItemText
                  primary={`BP: ${record.bp} | HR: ${record.heartRate}`}
                  secondary={
                    record.timestamp
                      ? record.timestamp.toDate().toLocaleString()
                      : ""
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Display Chart (Systolic/Diastolic/HeartRate) */}
      {chartData.length > 0 && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Vitals Over Time
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Heart Rate Line */}
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Heart Rate"
              />
              {/* Systolic BP */}
              <Line
                type="monotone"
                dataKey="systolic"
                stroke="#82ca9d"
                name="Systolic"
              />
              {/* Diastolic BP */}
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke="#ff7300"
                name="Diastolic"
              />
            </LineChart>
          </ResponsiveContainer>
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
    </Container>
  );
};

export default AdminPatientDetails;
