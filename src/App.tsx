// src/App.tsx
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

import AdminDashboard from "./pages/AdminDashboard";
import AdminAppointments from "./pages/AdminAppointments";
import AdminPatientDetails from "./pages/AdminPatientDetails"; // New admin patient details page
import DoctorAppointments from "./pages/DoctorAppointments";
import HealthRecords from "./pages/HealthRecords";
import Patient from "./pages/Patient"; // If you still have a main "Patient" file
import Doctor from "./pages/Doctor";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";

import PatientLayout from "./layouts/PatientLayout"; // Layout for patients
import AdminLayout from "./layouts/AdminLayout";     // Layout for admins
import Vitals from "./pages/patient/Vitals";           // New
import Appointments from "./pages/patient/Appointments"; // New
import HealthChart from "./pages/patient/HealthChart";   // New health chart route

// ProtectedRoute ensures that only allowed roles can access certain routes
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles: string[];
}) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) return <p>Loading...</p>;
  return userRole && allowedRoles.includes(userRole) ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Patient Routes (Nested under PatientLayout) */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Patient />} />
          <Route path="vitals" element={<Vitals />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="healthchart" element={<HealthChart />} />
        </Route>

        {/* Doctor Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <Doctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-appointments"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes (Nested under AdminLayout) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="patient-details" element={<AdminPatientDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
