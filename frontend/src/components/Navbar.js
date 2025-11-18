import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, Avatar, Menu, MenuItem } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../context/AuthContext';

function Navbar({ mode = 'light', onToggleTheme = () => {} }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(6px)' }}>
      <Toolbar sx={{ py: 1 }}>
        <Box display="flex" alignItems="center" flexGrow={1}>
          <MicIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            AI Interview Simulator
          </Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton onClick={onToggleTheme} sx={{ mr: 1 }} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to={isAuthenticated ? '/welcome' : '/'}
            sx={{ mx: 1 }}
          >
            Home
          </Button>

          {!isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/login" sx={{ ml: 2 }}>
                Log In
              </Button>
              <Button component={RouterLink} to="/signup" variant="outlined" sx={{ ml: 1 }}>
                Sign Up
              </Button>
            </>
          ) : (
            <>
              <IconButton onClick={handleMenu} sx={{ ml: 2 }} color="inherit">
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <MenuItem component={RouterLink} to="/dashboard" onClick={handleClose}>Dashboard</MenuItem>
                <MenuItem onClick={() => { handleClose(); logout(); }}>Logout</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
