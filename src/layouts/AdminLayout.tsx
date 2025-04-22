// src/layouts/AdminLayout.tsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const drawerWidth = 240;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Determine the active path
  const currentPath = location.pathname;
  
  // Calculate which navigation item is active
  const getActiveNav = () => {
    if (currentPath === '/admin') return 0;
    if (currentPath === '/admin/appointments') return 1;
    if (currentPath === '/admin/patient-details') return 2;
    return 0;
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error: any) {
      console.error("Error signing out:", error);
      alert("Error signing out");
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ 
      height: '100%',
      display: 'flex', 
      flexDirection: 'column',
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Avatar 
          sx={{ 
            width: 60, 
            height: 60, 
            bgcolor: 'white', 
            color: 'primary.main',
            mb: 1
          }}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Health Monitor
        </Typography>
        <Typography variant="body2">
          Admin Panel
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPath === '/admin'} 
            onClick={() => handleNavigation('/admin')}
          >
            <ListItemIcon>
              <DashboardIcon color={currentPath === '/admin' ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Users Management" 
              primaryTypographyProps={{ 
                fontWeight: currentPath === '/admin' ? 'bold' : 'normal' 
              }}
            />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPath === '/admin/appointments'} 
            onClick={() => handleNavigation('/admin/appointments')}
          >
            <ListItemIcon>
              <EventIcon color={currentPath === '/admin/appointments' ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Appointments" 
              primaryTypographyProps={{ 
                fontWeight: currentPath === '/admin/appointments' ? 'bold' : 'normal' 
              }}
            />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPath === '/admin/patient-details'} 
            onClick={() => handleNavigation('/admin/patient-details')}
          >
            <ListItemIcon>
              <PersonSearchIcon color={currentPath === '/admin/patient-details' ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Patient Details" 
              primaryTypographyProps={{ 
                fontWeight: currentPath === '/admin/patient-details' ? 'bold' : 'normal' 
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
          Health Monitoring System
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* App Bar - Only visible on mobile */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          display: { sm: 'none' },
          bgcolor: 'white',
          color: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HealthAndSafetyIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div">
              Admin Dashboard
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Navigation drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop persistent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.05)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          pl: { sm: 0 },
          pt: { xs: 7, sm: 3 }, 
          pb: { xs: 7, sm: 3 },
          px: 3
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
      
      {/* Bottom Navigation - Mobile Only */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: { xs: 'block', sm: 'none' },
          zIndex: 2
        }}
      >
        <BottomNavigation
          showLabels
          value={getActiveNav()}
        >
          <BottomNavigationAction
            label="Users"
            icon={<PeopleIcon />}
            onClick={() => navigate('/admin')}
          />
          <BottomNavigationAction
            label="Appointments"
            icon={<EventIcon />}
            onClick={() => navigate('/admin/appointments')}
          />
          <BottomNavigationAction
            label="Patients"
            icon={<PersonSearchIcon />}
            onClick={() => navigate('/admin/patient-details')}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default AdminLayout;
