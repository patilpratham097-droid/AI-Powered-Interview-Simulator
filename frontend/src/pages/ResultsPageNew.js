import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Container, Paper, Typography, Grid, 
  LinearProgress, Chip, Divider 
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import { styled } from '@mui/material/styles';
import AnimatedSection from '../components/AnimatedSection';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ScoreCard = ({ title, score, icon }) => {
  const getColor = (score) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#2196f3';
    if (score >= 55) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" mb={1}>
        {icon}
        <Typography variant="subtitle1" sx={{ ml: 1 }}>{title}</Typography>
        <Typography variant="h6" sx={{ ml: 'auto' }} color={getColor(score)}>
          {score}/100
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={score} 
        sx={{
          height: 10,
          borderRadius: 5,
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(score),
          },
        }}
      />
    </Box>
  );
};

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Get report from navigation state or localStorage
    if (location.state?.report) {
      setReport(location.state.report);
    } else {
      // Try to get the latest report from localStorage
      const reports = JSON.parse(localStorage.getItem('interviewReports') || '[]');
      if (reports.length > 0) {
        setReport(reports[reports.length - 1]);
      }
    }
  }, [location]);

  if (!report) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4">No report available</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Go Home
        </Button>
      </Container>
    );
  }

  const getRecommendationColor = (level) => {
    switch (level) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'average': return 'warning';
      default: return 'error';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <AnimatedSection sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Interview Report Card
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {report.candidateName} - {report.role}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(report.date).toLocaleDateString()} • {report.duration.formatted}
        </Typography>
        
        {/* Overall Score */}
        <Box mt={4}>
          <Typography variant="h1" color="primary" sx={{ fontWeight: 'bold' }}>
            {report.overallScore}
            <Typography component="span" variant="h3" color="text.secondary">
              /100
            </Typography>
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={report.overallScore} 
            sx={{ 
              height: 20, 
              borderRadius: 10, 
              mt: 2,
              maxWidth: 400,
              mx: 'auto'
            }}
          />
        </Box>

        {/* Recommendation */}
        <Box mt={3}>
          <Chip 
            label={report.recommendation.decision}
            color={getRecommendationColor(report.recommendation.level)}
            size="large"
            sx={{ fontSize: '1.1rem', py: 3, px: 2 }}
          />
        </Box>
      </AnimatedSection>

      <Grid container spacing={3}>
        {/* Detailed Scores */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom>
              Performance Breakdown
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <ScoreCard 
              title="Technical Knowledge" 
              score={report.technicalScore}
              icon={<TrendingUpIcon color="primary" />}
            />
            <ScoreCard 
              title="Coding Skills" 
              score={report.codingScore}
              icon={<CodeIcon color="primary" />}
            />
            <ScoreCard 
              title="Communication" 
              score={report.communicationScore}
              icon={<ChatIcon color="primary" />}
            />
          </StyledPaper>
        </Grid>

        {/* AI Feedback */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom>
              AI-Generated Feedback
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body1" paragraph>
              {report.feedback}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {report.recommendation.message}
            </Typography>
          </StyledPaper>
        </Grid>

        {/* Strengths */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              Strengths
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ul style={{ paddingLeft: '24px' }}>
              {report.strengths.map((strength, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <Typography>{strength}</Typography>
                </li>
              ))}
            </ul>
          </StyledPaper>
        </Grid>

        {/* Improvements */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
              Areas for Improvement
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ul style={{ paddingLeft: '24px' }}>
              {report.improvements.map((improvement, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <Typography>{improvement}</Typography>
                </li>
              ))}
            </ul>
          </StyledPaper>
        </Grid>

        {/* Code Results */}
        {report.codeResults && (
          <Grid item xs={12}>
            <StyledPaper elevation={2}>
              <Typography variant="h5" gutterBottom>
                Coding Challenge Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Language
                  </Typography>
                  <Typography variant="h6">
                    {report.codeResults.language.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Tests Passed
                  </Typography>
                  <Typography variant="h6" color={report.codeResults.allPassed ? 'success.main' : 'warning.main'}>
                    {report.codeResults.passedTests}/{report.codeResults.totalTests}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Execution Time
                  </Typography>
                  <Typography variant="h6">
                    {report.codeResults.executionTime}s
                  </Typography>
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>
        )}

        {/* Interview Stats */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom>
              Interview Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Questions Asked
                </Typography>
                <Typography variant="h6">
                  {report.questionsAsked}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Questions Answered
                </Typography>
                <Typography variant="h6">
                  {report.questionsAnswered}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="h6">
                  {report.duration.formatted}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Coding Challenge
                </Typography>
                <Typography variant="h6">
                  {report.codingChallengeCompleted ? '✅ Yes' : '❌ No'}
                </Typography>
              </Grid>
            </Grid>
          </StyledPaper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box mt={4} textAlign="center">
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/welcome')}
          sx={{ mr: 2 }}
        >
          Start New Interview
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard')}
        >
          View All Interviews
        </Button>
      </Box>

      <Box mt={6} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Thank you for using AI Interview Simulator. Keep practicing to improve your skills!
        </Typography>
      </Box>
    </Container>
  );
}

export default ResultsPage;
