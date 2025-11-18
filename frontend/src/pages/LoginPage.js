import React, { useState } from 'react';
import { Box, Button, Container, Paper, TextField, Typography, Link, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import AnimatedSection from '../components/AnimatedSection';

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const redirectTo = location.state?.from?.pathname || '/welcome';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <AnimatedSection sx={{ p: 2, mb: 2, background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(17,24,39,0.5)' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>Welcome back</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>Log in to continue your practice interviews.</Typography>
      </AnimatedSection>
      <Paper
        sx={{
          p: 4,
          borderRadius: 4,
          border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
          background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)'
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />

          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2, transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
            Log In
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Link component={RouterLink} to="/signup" underline="hover" color="primary.main">
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}

export default LoginPage;

