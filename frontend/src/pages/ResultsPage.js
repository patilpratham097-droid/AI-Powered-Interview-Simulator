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
    // Get report from navigation state, sessionStorage, or localStorage
    if (location.state?.report) {
      console.log('📊 Report from location.state:', location.state.report);
      setReport(location.state.report);
    } else {
      // Try sessionStorage first (most recent)
      const lastReport = sessionStorage.getItem('lastInterviewReport');
      if (lastReport) {
        try {
          const parsed = JSON.parse(lastReport);
          console.log('📊 Report from sessionStorage:', parsed);
          console.log('📊 Scores in report:', parsed.scores);
          setReport(parsed);
          return;
        } catch (e) {
          console.error('Error parsing sessionStorage report:', e);
        }
      }
      // Fallback to localStorage
      const reports = JSON.parse(localStorage.getItem('interviewReports') || '[]');
      if (reports.length > 0) {
        const latestReport = reports[reports.length - 1];
        console.log('📊 Report from localStorage:', latestReport);
        console.log('📊 Scores in report:', latestReport.scores);
        setReport(latestReport);
      } else {
        console.warn('⚠️ No report found in any storage location!');
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <AnimatedSection sx={{ p: 3, mb: 4, textAlign: 'center', background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(17,24,39,0.6)' }}>
        <Typography variant="h3" gutterBottom>
          Interview Report Card
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {report.candidateName} • {report.role}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'} • {report.duration ? `${Math.floor(report.duration / 60)}m ${report.duration % 60}s` : 'N/A'}
        </Typography>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold' }}>
            {report.overallScore}/100
          </Typography>
          <Chip 
            label={report.nextSteps || (report.overallScore >= 75 ? 'Recommended' : 'Needs Improvement')}
            color={report.overallScore >= 75 ? 'success' : 'warning'}
            sx={{ mt: 2, fontSize: '1rem', px: 2, py: 1 }}
          />
        </Box>

        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/welcome')}
          sx={{ mt: 2, mr: 2 }}
        >
          Start New Interview
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          View Dashboard
        </Button>
      </AnimatedSection>

      <Grid container spacing={3}>
        {/* Performance Breakdown */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} /> Performance Breakdown
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <ScoreCard 
              title="Technical Skills"
              score={report.scores?.technical ?? report.technicalScore ?? 70}
              icon={<CodeIcon color="primary" />}
            />
            <ScoreCard 
              title="Coding Challenge"
              score={report.scores?.codeQuality ?? report.codingScore ?? 70}
              icon={<CodeIcon color="secondary" />}
            />
            <ScoreCard 
              title="Communication"
              score={report.scores?.communication ?? report.communicationScore ?? 70}
              icon={<ChatIcon color="success" />}
            />
          </StyledPaper>
        </Grid>

        {/* AI Feedback */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ChatIcon sx={{ mr: 1 }} /> AI Feedback
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {report.technicalFeedback?.overallAssessment || 'Interview completed successfully.'}
            </Typography>
          </StyledPaper>
        </Grid>

        {/* Strengths */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
              <CheckCircleIcon sx={{ mr: 1 }} /> Strengths
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box component="ul" sx={{ pl: 3 }}>
              {report.strengths.map((strength, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {strength}
                </Typography>
              ))}
            </Box>
          </StyledPaper>
        </Grid>

        {/* Areas for Improvement */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
              <TrendingUpIcon sx={{ mr: 1 }} /> Areas for Improvement
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box component="ul" sx={{ pl: 3 }}>
              {report.improvements.map((improvement, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {improvement}
                </Typography>
              ))}
            </Box>
          </StyledPaper>
        </Grid>

        {/* Code Results */}
        {report.codeSubmission?.submitted && (
          <Grid item xs={12}>
            <StyledPaper elevation={2}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CodeIcon sx={{ mr: 1 }} /> Coding Challenge Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Language</Typography>
                  <Typography variant="h6">{report.codeSubmission.language.toUpperCase()}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={report.codeSubmission.passed ? 'Passed' : 'Attempted'}
                    color={report.codeSubmission.passed ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Feedback</Typography>
                  <Typography variant="body1">
                    {report.technicalFeedback?.codingChallenge || 'Coding challenge completed.'}
                  </Typography>
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>
        )}

        {/* Interview Statistics */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h5" gutterBottom>Interview Statistics</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} md={4}>
                <Typography variant="body2" color="text.secondary">Duration</Typography>
                <Typography variant="h6">{Math.floor(report.duration / 60)}m {report.duration % 60}s</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="body2" color="text.secondary">Role</Typography>
                <Typography variant="h6">{report.role}</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="body2" color="text.secondary">Coding Challenge</Typography>
                <Chip 
                  label={report.codeSubmission?.submitted ? 'Completed' : 'Not Completed'}
                  color={report.codeSubmission?.submitted ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
            </Grid>
          </StyledPaper>
        </Grid>

        {/* Recommendation */}
        <Grid item xs={12}>
          <StyledPaper elevation={3} sx={{ 
            background: (theme) => theme.palette.mode === 'light' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #434343 0%, #000000 100%)',
            color: 'white'
          }}>
            <Typography variant="h5" gutterBottom>Recommendations</Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {report.nextSteps}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mt: 2 }}>
              {report.recommendations?.map((rec, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {rec}
                </Typography>
              ))}
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>

      <Box mt={6} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Report ID: {report.reportId}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Thank you for using AI Interview Simulator. Keep practicing to improve your skills!
        </Typography>
      </Box>
    </Container>
  );
}

export default ResultsPage;
