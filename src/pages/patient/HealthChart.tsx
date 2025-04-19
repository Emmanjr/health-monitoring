// src/pages/patient/HealthChart.tsx
import React, { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface HealthRecord {
  heartRate: number;
  temperature: number;
  systolic: number;
  diastolic: number;
  timestamp: string; // formatted date string
}

const HealthChart = () => {
  const [chartData, setChartData] = useState<HealthRecord[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query health records for the current user
    const q = query(
      collection(db, "healthRecords"),
      where("userId", "==", auth.currentUser.uid)
    );

    // Listen for realtime updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const record = doc.data();
        // Parse bp if available, expecting format "systolic/diastolic"
        let systolic = 0;
        let diastolic = 0;
        if (record.bp) {
          const bpValues = (record.bp as string).split("/").map(Number);
          if (bpValues.length === 2) {
            systolic = bpValues[0];
            diastolic = bpValues[1];
          }
        }
        return {
          heartRate: Number(record.heartRate),
          temperature: Number(record.temperature),
          systolic,
          diastolic,
          timestamp: record.timestamp
            ? record.timestamp.toDate().toLocaleDateString()
            : "",
        };
      });

      // Sort data chronologically based on the timestamp
      data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setChartData(data);
      console.log("Fetched Chart Data:", data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Container>
      <Typography variant="h5" sx={{ my: 2 }}>
        Health Progress Over Time
      </Typography>
      {chartData.length > 0 ? (
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
            {/* Plot heart rate */}
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name="Heart Rate"
            />
            {/* Plot temperature */}
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#82ca9d"
              name="Temperature (°C)"
            />
            {/* Plot systolic blood pressure */}
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#ff7300"
              name="Systolic BP"
            />
            {/* Plot diastolic blood pressure */}
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#387908"
              name="Diastolic BP"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Typography variant="body1">
          No health records available.
        </Typography>
      )}
    </Container>
  );
};

export default HealthChart;
