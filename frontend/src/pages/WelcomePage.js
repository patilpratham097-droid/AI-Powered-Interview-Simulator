import React from 'react';
import { Box, Button, Container, Grid, Paper, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';

function WelcomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AnimatedSection sx={{ p: 4, borderRadius: 4, mb: 3, border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`, background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(17,24,39,0.6)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Welcome back</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Pick up where you left off or start a new mock interview.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" onClick={() => navigate('/ai-interview')} sx={{ transition: 'transform 0.2s ease, boxShadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>Start AI Interview</Button>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ transition: 'transform 0.2s ease, boxShadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>Go to Dashboard</Button>
        </Stack>
      </AnimatedSection>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Recommended next steps</Typography>
            <Typography color="text.secondary">Set your target role and aim for a 10-minute warm-up session. Review your feedback to plan what to practice next.</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Tips</Typography>
            <Typography color="text.secondary">Use concise answers, think aloud, and review feedback to iterate quickly.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default WelcomePage;

