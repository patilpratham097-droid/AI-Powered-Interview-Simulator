import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, Paper, Typography, Grid, Avatar, 
  IconButton, Chip, LinearProgress, Alert, Snackbar, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Mic as MicIcon, 
  MicOff as MicOffIcon, 
  Videocam as VideocamIcon, 
  VideocamOff as VideocamOffIcon, 
  VolumeOff as VolumeOffIcon, 
  Send as SendIcon, 
  Stop as StopIcon,
  CallEnd as CallEndIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import Editor from '@monaco-editor/react';
import Webcam from 'react-webcam';
import { useAIInterview } from '../context/AIInterviewContext';
import LeetCodeIDE from '../components/LeetCodeIDE';
import socketService from '../services/socketService';

function AIInterviewPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const webcamRef = useRef(null);
  
  // Local state
  const [stage, setStage] = useState('setup'); // setup, interview, completed
  const [selectedRole, setSelectedRole] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [cameraOn, setCameraOn] = useState(true);
  const [code, setCode] = useState('// Write your solution here\nfunction solution() {\n  // Your code\n}');
  const [language, setLanguage] = useState('javascript');
  const [codeExplanation, setCodeExplanation] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [problemData, setProblemData] = useState(null);
  const [showLeetCodeIDE, setShowLeetCodeIDE] = useState(false);

  // AI Interview context
  const {
    isInterviewActive,
    isConnected,
    currentMessage,
    conversationHistory,
    stage: interviewStage,
    isListening,
    isSpeaking,
    showIDE,
    problemData: contextProblemData,
    currentTranscript,
    interimTranscript,
    results,
    startInterview,
    endInterview,
    toggleListening,
    submitCode,
    sendTextMessage,
    stopSpeaking,
    speechSupported
  } = useAIInterview();

  const roles = [
    { value: 'frontend', label: 'Frontend Developer', description: 'React, Vue, Angular, JavaScript, CSS' },
    { value: 'backend', label: 'Backend Developer', description: 'Node.js, Python, Java, APIs, Databases' },
    { value: 'fullstack', label: 'Full Stack Developer', description: 'Frontend + Backend + System Design' },
    { value: 'mobile', label: 'Mobile Developer', description: 'React Native, Flutter, iOS, Android' },
    { value: 'datascience', label: 'Data Scientist', description: 'Python, ML, Statistics, Analytics' },
    { value: 'ml', label: 'Machine Learning Engineer', description: 'AI/ML, Deep Learning, MLOps' },
    { value: 'devops', label: 'DevOps Engineer', description: 'AWS, Docker, Kubernetes, CI/CD' },
    { value: 'qa', label: 'QA Engineer', description: 'Testing, Automation, Quality Assurance' },
    { value: 'product', label: 'Product Manager', description: 'Strategy, Roadmap, User Experience' },
    { value: 'security', label: 'Security Engineer', description: 'Cybersecurity, Penetration Testing' },
    { value: 'blockchain', label: 'Blockchain Developer', description: 'Web3, Smart Contracts, DeFi' },
    { value: 'gamedev', label: 'Game Developer', description: 'Unity, Unreal, Game Design' }
  ];

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'typescript', label: 'TypeScript' }
  ];

  // Handle interview completion - only when interview is actually completed
  useEffect(() => {
    if (results && results.completed && !isInterviewActive) {
      setStage('completed');
      setNotification({
        open: true,
        message: 'Interview completed! Check backend logs for report.',
        severity: 'success'
      });
    }
  }, [results, isInterviewActive]);

  // Handle IDE opening with problem data
  useEffect(() => {
    if (showIDE && contextProblemData) {
      setProblemData(contextProblemData);
      setShowLeetCodeIDE(true);
    } else if (showIDE && !contextProblemData) {
      setShowLeetCodeIDE(true);
    }
  }, [showIDE, contextProblemData]);

  // Handle connection status
  useEffect(() => {
    if (!isConnected) {
      setNotification({
        open: true,
        message: 'Connecting to AI Interview Server...',
        severity: 'warning'
      });
    } else {
      setNotification({
        open: true,
        message: 'Connected to AI Interview Server',
        severity: 'success'
      });
    }
  }, [isConnected]);

  // Test speech synthesis
  const testSpeech = () => {
    const msg = new SpeechSynthesisUtterance('Hello, this is a test of the speech synthesis.');
    window.speechSynthesis.speak(msg);
  };

  // Start interview
  const handleStartInterview = () => {
    if (selectedRole && candidateName.trim()) {
      // Reset stage to interview (clear any previous completed state)
      setStage('interview');
      // Clear any previous results/notifications
      setNotification({ open: false, message: '', severity: 'info' });
      // Start the interview
      startInterview(selectedRole, candidateName);
    }
  };

  const handleLeetCodeSubmit = (submissionData) => {
    const { code, language, explanation, testResults } = submissionData;
    
    // Submit to AI interviewer
    submitCode(code, language, explanation);
    
    // Close the LeetCode IDE
    setShowLeetCodeIDE(false);
    
    // Show success notification
    setNotification({
      open: true,
      message: 'Code submitted successfully! The interviewer will review your solution.',
      severity: 'success'
    });
  };

  const handleCloseLeetCodeIDE = () => {
    setShowLeetCodeIDE(false);
  };

  const handleEndInterview = async () => {
    if (!window.confirm('Are you sure you want to end the interview? This cannot be undone.')) {
      return;
    }

    console.log('Ending interview...');
    
    // Show loading state
    setNotification({
      open: true,
      message: 'Ending interview session...',
      severity: 'info'
    });

    try {
      // Set a timeout in case the server doesn't respond
      const timeout = setTimeout(() => {
        console.warn('Server response timeout');
        setNotification({
          open: true,
          message: 'Interview ended. Check backend logs for report.',
          severity: 'warning'
        });
        setStage('completed');
      }, 10000); // 10 second timeout

      // Create a promise to handle the interview end event
      const waitForInterviewEnd = new Promise((resolve) => {
        const socket = socketService.socket;
        if (!socket) {
          console.error('No active socket connection');
          throw new Error('No active connection to the interview server');
        }

        console.log('Setting up interview-ended listener');
        
        const onInterviewEnded = (data) => {
          console.log('Received interview-ended event:', data);
          clearTimeout(timeout);
          
          if (data.success) {
            setStage('completed');
            setNotification({
              open: true,
              message: data.closingMessage || 'Interview completed successfully! Check backend logs for report.',
              severity: 'success'
            });
          } else {
            setStage('completed');
            setNotification({
              open: true,
              message: data.message || 'Error ending interview',
              severity: 'error'
            });
          }
          
          resolve(data);
        };

        socket.on('interview-ended', onInterviewEnded);
        
        // Clean up the listener when the component unmounts or when the promise resolves
        return () => {
          socket.off('interview-ended', onInterviewEnded);
        };
      });

      // Trigger the end interview process
      console.log('Calling endInterview()');
      endInterview();
      
      // Wait for the interview to end or timeout
      const result = await Promise.race([
        waitForInterviewEnd,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Interview end timeout')), 10000)
        )
      ]);
      
      console.log('Interview end result:', result);
      
      // Don't navigate to results - just show completion message
      // Report is available in backend logs only
      
    } catch (error) {
      console.error('Error in handleEndInterview:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to end interview properly',
        severity: 'error'
      });
      
      // Don't navigate to results - just show completion message
    }
  };

  const handleCodeSubmit = () => {
    if (!code.trim()) {
      setNotification({
        open: true,
        message: 'Please write some code before submitting',
        severity: 'warning'
      });
      return;
    }

    submitCode(code, language, codeExplanation);
    setCodeExplanation('');
    setNotification({
      open: true,
      message: 'Code submitted successfully!',
      severity: 'success'
    });
  };

  const handleManualSend = () => {
    if (!manualInput.trim()) return;
    
    sendTextMessage(manualInput);
    setManualInput('');
    setShowManualInput(false);
  };

  // Setup screen
  if (stage === 'setup') {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
            AI Interview Setup
          </Typography>

          {!speechSupported && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Speech recognition not supported. You can still use text input during the interview.
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Your Name</Typography>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '16px'
              }}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Select Role</Typography>
            <Grid container spacing={2}>
              {roles.map((role) => (
                <Grid item xs={12} sm={6} md={4} key={role.value}>
                  <Button
                    fullWidth
                    variant={selectedRole === role.value ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRole(role.value)}
                    sx={{ py: 2, textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {role.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'none' }}>
                      {role.description}
                    </Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartInterview}
              disabled={!selectedRole || !candidateName.trim()}
              sx={{ px: 4, py: 1.5 }}
            >
              Start AI Interview
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Interview screen
  if (stage === 'interview') {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Status Bar */}
        <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6">AI Interview - {selectedRole}</Typography>
            <Typography variant="caption" color="text.secondary">
              Stage: {interviewStage}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip 
              label={isSpeaking ? 'AI Speaking' : isListening ? 'Listening' : 'Waiting'}
              color={isSpeaking ? 'secondary' : isListening ? 'primary' : 'default'}
              size="small"
            />
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={testSpeech}
                color="primary"
              >
                Test Speech
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleEndInterview}
                startIcon={<CallEndIcon />}
              >
                End Interview
              </Button>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Panel - Video and Controls */}
          <Grid item xs={12} lg={showIDE ? 4 : 6}>
            {/* Candidate Video */}
            <Paper sx={{ p: 2, mb: 2, height: '300px', overflow: 'hidden', borderRadius: 2 }}>
              {cameraOn ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.600' }}>
                    {candidateName.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
              )}
            </Paper>

            {/* Controls */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                <IconButton
                  color={isListening ? 'primary' : 'default'}
                  onClick={toggleListening}
                  disabled={isSpeaking || !speechSupported}
                  size="large"
                >
                  {isListening ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
                
                <IconButton
                  color={cameraOn ? 'primary' : 'default'}
                  onClick={() => setCameraOn(!cameraOn)}
                  size="large"
                >
                  {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>

                <IconButton
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  size="large"
                >
                  <VolumeOffIcon />
                </IconButton>

                <Button
                  variant="outlined"
                  onClick={() => setShowManualInput(!showManualInput)}
                  size="small"
                >
                  Type Response
                </Button>
              </Box>

              {/* Speech Transcript */}
              {(currentTranscript || interimTranscript) && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    You said: {currentTranscript}
                    <span style={{ opacity: 0.6 }}>{interimTranscript}</span>
                  </Typography>
                </Box>
              )}

              {/* Manual Input */}
              {showManualInput && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type your response..."
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSend()}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  />
                  <IconButton onClick={handleManualSend} color="primary">
                    <SendIcon />
                  </IconButton>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Middle Panel - AI Interviewer */}
          <Grid item xs={12} lg={showIDE ? 4 : 6}>
            <Paper sx={{ p: 2, mb: 2, height: '300px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>AI Interviewer</Typography>
              
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: 'primary.main',
                    animation: isSpeaking ? 'pulse 1.5s ease-in-out infinite' : 'none'
                  }}
                >
                  AI
                </Avatar>
              </Box>

              {isSpeaking && (
                <LinearProgress sx={{ mt: 2 }} />
              )}
            </Paper>

            {/* Current Message */}
            {currentMessage && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body1">
                  {(() => {
                    // Safely convert any value to string, handling objects, arrays, null, undefined
                    if (currentMessage === null || currentMessage === undefined) {
                      return '';
                    }
                    if (typeof currentMessage === 'string') {
                      return currentMessage;
                    }
                    if (typeof currentMessage === 'number' || typeof currentMessage === 'boolean') {
                      return String(currentMessage);
                    }
                    if (Array.isArray(currentMessage)) {
                      return currentMessage.map(item => {
                        if (typeof item === 'string') return item;
                        if (typeof item === 'object' && item !== null) return JSON.stringify(item);
                        return String(item);
                      }).join(' ');
                    }
                    if (typeof currentMessage === 'object') {
                      return JSON.stringify(currentMessage);
                    }
                    return String(currentMessage);
                  })()}
                </Typography>
              </Paper>
            )}

            {/* Conversation History */}
            <Paper sx={{ p: 2, maxHeight: '200px', overflowY: 'auto' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Conversation</Typography>
              {conversationHistory.slice(-5).map((msg, index) => {
                // Safely convert message to string (handle objects, arrays, nested objects, etc.)
                const messageText = (() => {
                  const message = msg.message;
                  if (message === null || message === undefined) {
                    return '';
                  }
                  if (typeof message === 'string') {
                    return message;
                  }
                  if (typeof message === 'number' || typeof message === 'boolean') {
                    return String(message);
                  }
                  if (Array.isArray(message)) {
                    return message.map(item => {
                      if (typeof item === 'string') return item;
                      if (typeof item === 'number' || typeof item === 'boolean') return String(item);
                      if (typeof item === 'object' && item !== null) {
                        // Handle objects - convert to JSON string
                        try {
                          return JSON.stringify(item);
                        } catch (e) {
                          return '[Object]';
                        }
                      }
                      return String(item);
                    }).join(' ');
                  }
                  if (typeof message === 'object') {
                    try {
                      return JSON.stringify(message);
                    } catch (e) {
                      return '[Object]';
                    }
                  }
                  return String(message);
                })();
                
                return (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: msg.speaker === 'interviewer' ? 'primary.light' : 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {msg.speaker === 'interviewer' ? 'AI' : 'You'}:
                    </Typography>
                    <Typography variant="body2">{messageText}</Typography>
                  </Box>
                );
              })}
            </Paper>
          </Grid>

          {/* Right Panel - Code Editor (Dynamic) */}
          {showIDE && (
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon /> Coding Challenge
                  </Typography>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    {languageOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </Box>

                <Box sx={{ height: '300px', border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Role</InputLabel>
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      label="Select Role"
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {role.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {role.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <input
                  type="text"
                  value={codeExplanation}
                  onChange={(e) => setCodeExplanation(e.target.value)}
                  placeholder="Explain your approach (optional)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    marginBottom: '12px'
                  }}
                />

                <Button
                  variant="contained"
                  onClick={handleCodeSubmit}
                  fullWidth
                  startIcon={<SendIcon />}
                >
                  Submit Code
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
            {notification.message}
          </Alert>
        </Snackbar>

        {/* LeetCode-style IDE */}
        {showLeetCodeIDE && (
          <LeetCodeIDE
            problemData={problemData}
            onSubmit={handleLeetCodeSubmit}
            onClose={handleCloseLeetCodeIDE}
          />
        )}
      </Container>
    );
  }

  // Completed screen
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
          Interview Completed!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
          Thank you for completing the AI interview.
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          The interview report with detailed scores and feedback has been generated and is available in the backend console logs.
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', fontStyle: 'italic' }}>
          Check your backend terminal to view the complete report with scores, strengths, and areas for improvement.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => {
            // Reset everything for a new interview
            setStage('setup');
            setSelectedRole('');
            setCandidateName('');
            setNotification({ open: false, message: '', severity: 'info' });
          }} 
          sx={{ mt: 2 }}
        >
          Start New Interview
        </Button>
      </Paper>
    </Container>
  );
}

export default AIInterviewPage;
