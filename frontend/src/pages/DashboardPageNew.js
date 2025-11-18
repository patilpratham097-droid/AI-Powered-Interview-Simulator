import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  Button, Chip, Box, LinearProgress, Paper 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedSection from '../components/AnimatedSection';

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Load reports from localStorage
    const savedReports = JSON.parse(
      localStorage.getItem('interviewReports') || '[]'
    );
    setReports(savedReports.reverse()); // Most recent first
  }, []);

  const getScoreColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 55) return 'warning';
    return 'error';
  };

  // Calculate statistics
  const stats = {
    totalInterviews: reports.length,
    averageScore: reports.length > 0 
      ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length)
      : 0,
    passRate: reports.length > 0
      ? Math.round((reports.filter(r => r.overallScore >= 70).length / reports.length) * 100)
      : 0
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <AnimatedSection sx={{ p: 3, mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your interview progress and review past performances
        </Typography>
      </AnimatedSection>

      {/* Statistics */}
      {reports.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.totalInterviews}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Interviews
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.averageScore}/100
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats.passRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pass Rate (≥70)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Past Interviews */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Past Interviews
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Review your interview history and track your progress
        </Typography>
      </Box>

      {reports.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No interviews yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Start your first interview to see your results here
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={() => navigate('/welcome')}
          >
            Start Interview
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {reports.map((report, index) => (
            <Grid item xs={12} md={6} lg={4} key={report.reportId || index}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" noWrap>
                      {report.role}
                    </Typography>
                    <Chip 
                      label={report.overallScore}
                      color={getScoreColor(report.overallScore)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  {/* Date */}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(report.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>

                  {/* Score Progress */}
                  <Box mt={2} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Overall Score
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {report.overallScore}/100
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={report.overallScore} 
                      sx={{ height: 8, borderRadius: 4 }}
                      color={getScoreColor(report.overallScore)}
                    />
                  </Box>

                  {/* Detailed Scores */}
                  <Grid container spacing={1} mb={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Technical
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {report.technicalScore}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Coding
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {report.codingScore}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Communication
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {report.communicationScore}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Stats */}
                  <Grid container spacing={1} mb={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2">
                        {report.duration.formatted}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Questions
                      </Typography>
                      <Typography variant="body2">
                        {report.questionsAsked}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Recommendation */}
                  <Box mb={2}>
                    <Chip 
                      label={report.recommendation.decision}
                      size="small"
                      color={getScoreColor(report.overallScore)}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>

                  {/* View Button */}
                  <Button 
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/results', { state: { report } })}
                  >
                    View Full Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Start New Interview Button */}
      {reports.length > 0 && (
        <Box mt={4} textAlign="center">
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={() => navigate('/welcome')}
          >
            Start New Interview
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default DashboardPage;
