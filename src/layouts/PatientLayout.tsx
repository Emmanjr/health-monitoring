// src/layouts/PatientLayout.tsx
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LogoutIcon from "@mui/icons-material/Logout";

const PatientLayout = () => {
  const [navValue, setNavValue] = useState(0);
  const navigate = useNavigate();

  // Example logout function:
  const handleLogout = () => {
    // Implement your logout logic (e.g., signOut(auth)) then navigate
    navigate("/");
  };

  // Handle bottom navigation changes
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setNavValue(newValue);
    if (newValue === 0) {
      navigate("/patient"); // Home / Dashboard
    } else if (newValue === 1) {
      navigate("/patient/vitals");
    } else if (newValue === 2) {
      navigate("/patient/appointments");
    } else if (newValue === 3) {
      navigate("/patient/healthchart");
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Top Header / AppBar with Logout Button */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Patient Portal
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content (with bottom padding to avoid overlap with nav) */}
      <div style={{ paddingBottom: "56px" }}>
        <Outlet />
      </div>

      {/* Bottom Navigation with Blue Background */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "blue",
        }}
        elevation={3}
      >
        <BottomNavigation
          value={navValue}
          onChange={handleChange}
          showLabels
          sx={{ backgroundColor: "blue" }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<HomeIcon />}
            sx={{ color: "white" }}
          />
          <BottomNavigationAction
            label="Vitals"
            icon={<FavoriteIcon />}
            sx={{ color: "white" }}
          />
          <BottomNavigationAction
            label="Appointments"
            icon={<CalendarMonthIcon />}
            sx={{ color: "white" }}
          />
          <BottomNavigationAction
            label="Health Chart"
            icon={<ShowChartIcon />}
            sx={{ color: "white" }}
          />
        </BottomNavigation>
      </Paper>
    </div>
  );
};

export default PatientLayout;
