import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import InterviewPage from './pages/InterviewPage';
import AIInterviewPage from './pages/AIInterviewPage';
import ResultsPage from './pages/ResultsPage';
import { InterviewProvider } from './context/InterviewContext';
import { AIInterviewProvider } from './context/AIInterviewContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RequireAuth from './components/RequireAuth';
import DashboardPage from './pages/DashboardPage';
import WelcomePage from './pages/WelcomePage';

function App() {
  const [mode, setMode] = React.useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9',
      },
      secondary: {
        main: mode === 'light' ? '#dc004e' : '#f48fb1',
      },
      background: {
        default: mode === 'light' ? '#f5f7fb' : '#0b0f19',
        paper: mode === 'light' ? '#ffffff' : '#111827',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h2: { fontWeight: 700 },
      h4: { fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
        },
      },
    },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <InterviewProvider>
          <AIInterviewProvider>
            <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar mode={mode} onToggleTheme={toggleTheme} />
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
              <Routes>
                <Route path="/" element={<LandingRoute />} />
                <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
                <Route path="/welcome" element={<RequireAuth><WelcomePage /></RequireAuth>} />
                <Route path="/interview" element={<RequireAuth><InterviewPage /></RequireAuth>} />
                <Route path="/ai-interview" element={<RequireAuth><AIInterviewPage /></RequireAuth>} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Routes>
            </Box>
          </Box>
            </Router>
          </AIInterviewProvider>
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function LandingRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return <HomePage />;
}

export default App;
