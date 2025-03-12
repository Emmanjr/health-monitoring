import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAppointments from "./pages/AdminAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";
import HealthRecords from "./pages/HealthRecords";
import Patient from "./pages/Patient";
import Doctor from "./pages/Doctor";
import Auth from "./pages/Auth";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactElement; allowedRoles: string[] }) {
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
        <Route path="/" element={<Auth />} />
        {/* Patient Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <Patient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-records"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <HealthRecords />
            </ProtectedRoute>
          }
        />
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
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-appointments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
