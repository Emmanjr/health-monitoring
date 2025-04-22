// src/layouts/PatientLayout.tsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  Container,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton, // Ensure ListItemButton is imported
  useTheme,
  useMediaQuery,
  IconButton,
  Tabs,
  Tab, // Ensure Tab is imported
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const PatientLayout = () => {
  const [navValue, setNavValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to login page if user is not authenticated
        navigate('/');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  // Set active navigation item based on current URL
  useEffect(() => {
    const path = location.pathname;
    const index = navigationItems.findIndex(item => item.route === path);
    if (index !== -1) {
      setNavValue(index);
    }
  }, [location.pathname]);

  // Logout function using Firebase
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle bottom navigation changes
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setNavValue(newValue);
    navigate(navigationItems[newValue].route);
    if (drawerOpen) setDrawerOpen(false);
  };

  // Navigation options for sidebar/drawer
  const navigationItems = [
    { label: "Home", icon: <HomeIcon />, route: "/patient" },
    { label: "Vitals", icon: <FavoriteIcon />, route: "/patient/vitals" },
    { label: "Appointments", icon: <CalendarMonthIcon />, route: "/patient/appointments" },
    { label: "Health Chart", icon: <ShowChartIcon />, route: "/patient/healthchart" },
    { label: "Resources", icon: <ArticleIcon />, route: "/patient/healthblog" },
  ];

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <Box sx={{ 
      position: "relative", 
      minHeight: "100vh", 
      backgroundColor: "#f5f9fc",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header / AppBar with Improved Design */}
      <AppBar position="static" sx={{ bgcolor: "#2c3e50" }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar
              src="/health.png"
              alt="Health Monitor Logo"
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                boxShadow: '0 0 8px rgba(255,255,255,0.5)' 
              }}
              onClick={() => navigate('/patient')}
            />
            
            <Typography 
              variant="h6" 
              sx={{ display: { xs: 'none', sm: 'block' }, cursor: 'pointer' }}
              onClick={() => navigate('/patient')}
            >
              Health Monitor
            </Typography>
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Tabs 
              value={navValue} 
              onChange={handleChange}
              sx={{ 
                mx: 2,
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3498db',
                  height: 3,
                },
                '& .Mui-selected': {
                  color: '#3498db !important',
                }
              }}
            >
              {navigationItems.map((item, index) => (
                <Tab
                  key={item.label}
                  icon={React.cloneElement(item.icon, { fontSize: 'small' })}
                  label={item.label}
                  sx={{ 
                    color: 'white',
                    minWidth: 100,
                    textTransform: 'none',
                  }}
                />
              ))}
            </Tabs>
          )}
          
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={toggleDrawer(true)}
              sx={{ ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logout Button */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer for Mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            px: 2,
            pb: 2
          }}>
            <Typography variant="h6">Menu</Typography>
            <IconButton onClick={toggleDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* User Profile Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            py: 3,
            borderBottom: '1px solid #eaeaea',
            mb: 2
          }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mb: 1,
                bgcolor: '#3498db'
              }}
            >
              P
            </Avatar>
            <Typography variant="body1">Patient Profile</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your health
            </Typography>
          </Box>
          
          <List>
              {navigationItems.map((item, index) => (
                <ListItem 
                  key={item.label}
                  disablePadding
                >
                  <ListItemButton
                    onClick={() => handleChange({} as React.SyntheticEvent, index)}
                    selected={navValue === index}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
              
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
    </List>
        </Box>
      </Drawer>

      {/* Banner Section for Home Page */}
      {location.pathname === "/patient" && (
        <Box 
          sx={{
            height: '200px',
            backgroundImage: 'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)',
            borderRadius: { xs: '0 0 20px 20px', md: '0 0 50px 50px' },
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 3,
            color: 'white',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box 
            component="img" 
            src="/health.png" 
            alt="Health Background"
            sx={{
              position: 'absolute',
              right: -20,
              bottom: -20,
              opacity: 0.2,
              width: '200px',
              height: 'auto',
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 'bold', zIndex: 1 }}>
            Welcome Back 
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, maxWidth: '600px', zIndex: 1 }}>
            Monitor your health metrics, schedule appointments, and view your progress
          </Typography>
        </Box>
      )}

      {/* Main Content Container */}
      <Container sx={{ 
        py: 2, 
        pb: { xs: 10, sm: 4 }, 
        px: { xs: 2, sm: 3 },
        flexGrow: 1,
      }}>
        <Outlet />
      </Container>

      {/* Bottom Navigation - ONLY for Mobile */}
      {isMobile && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#2c3e50",
            borderRadius: "20px 20px 0 0",
            overflow: 'hidden',
            zIndex: 1000,
          }}
          elevation={3}
        >
          <BottomNavigation
            value={navValue}
            onChange={handleChange}
            showLabels
            sx={{ 
              backgroundColor: "#2c3e50", 
              height: '60px' 
            }}
          >
            {navigationItems.map((item, index) => (
              <BottomNavigationAction
                key={item.label}
                label={item.label}
                icon={item.icon}
                sx={{ 
                  color: navValue === index ? '#3498db' : 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': {
                    color: '#3498db',
                  }
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default PatientLayout;
