import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Box, CircularProgress, Typography } from "@mui/material";

import AdminDashboard from "./pages/AdminDashboard";
import AdminAppointments from "./pages/AdminAppointments";
import AdminPatientDetails from "./pages/AdminPatientDetails";
import DoctorAppointments from "./pages/DoctorAppointments";
import Patient from "./pages/Patient";
import Doctor from "./pages/Doctor";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";

import PatientLayout from "./layouts/PatientLayout";
import AdminLayout from "./layouts/AdminLayout";
import Vitals from "./pages/patient/Vitals";
import Appointments from "./pages/patient/Appointments";
import HealthChart from "./pages/patient/HealthChart";
import HealthBlog from "./pages/patient/HealthBlog";

// Create auth context to track authentication state app-wide
const AuthContext = createContext<{
  currentUser: any;
  userRole: string | null;
  isLoading: boolean;
}>({
  currentUser: null,
  userRole: null,
  isLoading: true,
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
function useAuth() {
  return useContext(AuthContext);
}

// Loading screen component
function LoadingScreen() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: 0,
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative"
    }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        <CircularProgress sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'white' }}>
          Loading Health Monitor...
        </Typography>
      </Box>
    </Box>
  );
}

// Updated ProtectedRoute that uses the auth context
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles: string[];
}) {
  const { currentUser, userRole, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  return userRole && allowedRoles.includes(userRole) ? children : <Navigate to="/" />;
}

// Main App component with the router wrapped in AuthProvider
function AppContent() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
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
        <Route path="healthblog" element={<HealthBlog />} />
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
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;