import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Grid, Paper, Typography, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedSection from '../components/AnimatedSection';

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
      setHistory(data);
    } catch (e) {
      setHistory([]);
    }
  }, []);

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  const downloadReport = (entry) => {
    const report = {
      id: entry.id,
      completedAt: entry.completedAt,
      role: entry.role,
      results: entry.results,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${entry.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AnimatedSection sx={{ p: 3, mb: 4, background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(17,24,39,0.6)' }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Welcome{user?.name ? `, ${user.name}` : ''}</Typography>
        <Typography color="text.secondary">Your interview practice hub</Typography>
      </AnimatedSection>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Account</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Your profile details</Typography>
            <Stack spacing={0.5}>
              <Typography><strong>Name:</strong> {user?.name || '—'}</Typography>
              <Typography><strong>Email:</strong> {user?.email || '—'}</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Your progress</Typography>
            <Typography color="text.secondary">Complete your first session to see insights here.</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Past Interviews</Typography>
            {history.length === 0 ? (
              <Typography color="text.secondary">No interviews yet. Start your first session to see history here.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Overall Score</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>{formatDateTime(entry.completedAt)}</TableCell>
                      <TableCell>{entry.role}</TableCell>
                      <TableCell>{entry.results?.overallScore ?? '-'}/10</TableCell>
                      <TableCell align="right">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<DownloadIcon />} 
                          onClick={() => downloadReport(entry)}
                          sx={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 } }}
                        >
                          Download report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;

