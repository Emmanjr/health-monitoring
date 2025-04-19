// src/pages/patient/Vitals.tsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
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
} from "@mui/material";

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
        }));
        setRecords(recs);
      },
      (error) => {
        showSnackbar("Error fetching health records: " + error.message, "error");
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Form Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Enter Vital Signs
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <TextField
            label="Blood Pressure (e.g., 120/80)"
            value={bp}
            onChange={(e) => setBP(e.target.value)}
          />
          <TextField
            label="Heart Rate"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
          />
        </Box>
        <Button variant="contained" onClick={submitVitals}>
          Submit
        </Button>
      </Box>

      {/* Health Records Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Your Health Records
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="health-records-table">
            <TableHead>
              <TableRow>
                <TableCell>Blood Pressure</TableCell>
                <TableCell>Heart Rate</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.bp}</TableCell>
                  <TableCell>{record.heartRate}</TableCell>
                  <TableCell>
                    {record.timestamp
                      ? record.timestamp.toDate().toLocaleString()
                      : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Recommendations Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recommendations
        </Typography>
        {displayedRecommendations.length > 0 ? (
          <List>
            {displayedRecommendations.map((rec, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">
            {recommendations.length > 0 ? "Generating recommendations..." : ""}
          </Typography>
        )}
      </Box>

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
