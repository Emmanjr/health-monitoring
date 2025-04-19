// src/layouts/AdminLayout.tsx
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction 
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import PersonSearchIcon from "@mui/icons-material/PersonSearch"; // New icon for Patient Details
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [navValue, setNavValue] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error: any) {
      console.error("Error signing out:", error);
      alert("Error signing out");
    }
  };

  const handleNavChange = (event: React.SyntheticEvent, newValue: number) => {
    setNavValue(newValue);
    // Navigate based on the selected tab
    if (newValue === 0) {
      navigate("/admin"); // Users management (AdminDashboard)
    } else if (newValue === 1) {
      navigate("/admin/appointments"); // Appointments management (AdminAppointments)
    } else if (newValue === 2) {
      navigate("/admin/patient-details"); // Patient details page
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: 1 }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ mt: 3, mb: 7 }}>
        <Outlet />
      </Box>

      {/* Bottom Navigation */}
      <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation value={navValue} onChange={handleNavChange} showLabels>
          <BottomNavigationAction label="Users" icon={<PeopleIcon />} />
          <BottomNavigationAction label="Appointments" icon={<EventIcon />} />
          <BottomNavigationAction label="Patient Details" icon={<PersonSearchIcon />} />
        </BottomNavigation>
      </Paper>
    </Container>
  );
};

export default AdminLayout;
