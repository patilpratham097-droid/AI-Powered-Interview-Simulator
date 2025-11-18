import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import SpeechService from '../services/speechService';

const AIInterviewContext = createContext();

export function useAIInterview() {
  return useContext(AIInterviewContext);
}

export function AIInterviewProvider({ children }) {
  const [interviewState, setInterviewState] = useState({
    isInterviewActive: false,
    isConnected: false,
    currentMessage: '',
    conversationHistory: [],
    selectedRole: null,
    candidateName: '',
    stage: 'setup', // setup, introduction, conversation, coding, wrap-up
    isListening: false,
    isSpeaking: false,
    showIDE: false,
    problemData: null,
    currentTranscript: '',
    interimTranscript: '',
    results: null,
  });

  const speechServiceRef = useRef(null);
  const [speechService] = useState(() => new SpeechService());

  // Initialize services
  useEffect(() => {
    console.log('Initializing AI Interview context...');
    speechServiceRef.current = speechService;
    
    // Set up speech service callbacks first
    speechService.onResultCallback = (result) => {
      console.log('Speech result:', result);
      if (result.isFinal && result.final.trim()) {
        const message = result.final.trim();
        console.log('Final transcript:', message);
        setInterviewState(prev => ({
          ...prev,
          currentTranscript: prev.currentTranscript + ' ' + message,
          interimTranscript: ''
        }));
        
        // Send to backend with voice metrics for AI processing
        if (socketService.socket?.connected) {
          socketService.sendCandidateResponse(message, result.voiceMetrics);
          
          // Clear transcript after sending
          setTimeout(() => setInterviewState(prev => ({ 
            ...prev, 
            currentTranscript: '' 
          })), 1000);
        } else {
          console.error('Cannot send message - socket not connected');
        }
      } else if (result.interim) {
        // Show interim results
        console.log('Interim transcript:', result.interim);
        setInterviewState(prev => ({ 
          ...prev, 
          interimTranscript: result.interim 
        }));
      }
    };

    speechService.onStartCallback = () => {
      console.log('Speech recognition started');
      setInterviewState(prev => ({ ...prev, isListening: true }));
    };

    speechService.onEndCallback = () => {
      console.log('Speech recognition ended');
      setInterviewState(prev => ({ ...prev, isListening: false }));
    };

    speechService.onErrorCallback = (error) => {
      console.error('Speech recognition error:', error);
      setInterviewState(prev => ({
        ...prev, 
        isListening: false,
        notification: {
          open: true,
          message: `Speech recognition error: ${error.message || 'Unknown error'}`,
          severity: 'error'
        }
      }));
    };
    
    // Connect to backend
    console.log('Connecting to socket server...');
    socketService.connect();
    
    // Set up socket connection status handler
    const handleConnectionStatus = (status) => {
      console.log('Socket connection status:', status);
      setInterviewState(prev => ({ 
        ...prev, 
        isConnected: status.connected 
      }));
      
      if (!status.connected) {
        // Try to reconnect after a delay if disconnected
        console.log('Attempting to reconnect in 3 seconds...');
        setTimeout(() => {
          console.log('Reconnecting to socket server...');
          socketService.connect();
        }, 3000);
      }
    };
    
    // Set up socket event listeners
    socketService.on('connection-status', handleConnectionStatus);
    
    socketService.onInterviewerResponse((response) => {
      console.log('Received interviewer response:', response);
      handleInterviewerResponse(response);
    });
    
    socketService.onInterviewEnd((data) => {
      console.log('Interview ended:', data);
      handleInterviewEnd(data);
    });
    
    // Listen for coding-finished event
    socketService.on('coding-finished', (data) => {
      console.log('Coding session finished:', data);
      setInterviewState(prev => ({
        ...prev,
        showIDE: false,
        stage: 'conversation'
      }));
    });
    
    socketService.onError((error) => {
      console.error('Socket error:', error);
      setInterviewState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: `Connection error: ${error.message || 'Unknown error'}`,
          severity: 'error'
        }
      }));
    });
    
    // Clean up function
    return () => {
      console.log('Cleaning up AI Interview context...');
      // Remove all event listeners
      socketService.off('connection-status', handleConnectionStatus);
      socketService.off('interviewer-response');
      socketService.off('interview-ended');
      socketService.off('error');
      
      // Stop speech services
      speechService.stopListening();
      speechService.stopSpeaking();
      
      // Clean up socket connection
      if (socketService.socket) {
        socketService.socket.off('connect');
        socketService.socket.off('disconnect');
        socketService.socket.off('connect_error');
        socketService.disconnect();
      }
    };
  }, [speechService]);

  // Handle interviewer responses
  const handleInterviewerResponse = async (response) => {
    console.log('Handling interviewer response:', response);
    const { message, requiresCoding, stage, isFinal, action, problemData, waitForTrigger, needsClosing } = response;
    
    // Ensure message is a string (handle objects, arrays, nested objects, etc.)
    let messageText = message;
    if (typeof message !== 'string') {
      if (Array.isArray(message)) {
        // Handle arrays - convert each element to string and join
        messageText = message.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            // Try to extract meaningful content from objects
            if (item.content) return String(item.content);
            if (item.text) return String(item.text);
            if (item.message) return String(item.message);
            // Otherwise stringify (but this should be avoided if possible)
            try {
              return JSON.stringify(item);
            } catch (e) {
              return '[Object]';
            }
          }
          return String(item || '');
        }).join(' ');
      } else if (typeof message === 'object' && message !== null) {
        // If it's an object, try to extract a meaningful string
        if (message.content) {
          messageText = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
        } else if (message.text) {
          messageText = typeof message.text === 'string' ? message.text : JSON.stringify(message.text);
        } else if (message.message) {
          messageText = typeof message.message === 'string' ? message.message : JSON.stringify(message.message);
        } else {
          // Stringify the object, but filter out problematic properties like width/height if they exist
          try {
            const sanitized = { ...message };
            // Remove any properties that might cause rendering issues
            delete sanitized.width;
            delete sanitized.height;
            messageText = JSON.stringify(sanitized);
          } catch (e) {
            messageText = '[Object]';
          }
        }
      } else {
        messageText = String(message || '');
      }
    }
    
    // Add to conversation history
    const newMessage = {
      role: 'interviewer',
      content: messageText,
      timestamp: new Date().toISOString(),
      requiresCoding,
      isFinal: isFinal || false,
      action: action || null
    };
    
    setInterviewState(prev => {
      const updatedHistory = [...prev.conversationHistory, {
        speaker: 'interviewer',
        message: messageText,
        timestamp: new Date(),
        requiresCoding,
        isFinal: isFinal || false,
        action: action || null
      }];
      
      // Handle action: start_coding - open IDE with problem data
      if (action === 'start_coding' && problemData) {
        console.log('🎯 Opening IDE with coding challenge:', problemData);
        // The IDE will be opened automatically when showIDE is true and problemData is set
      }
      
      // Always speak the interviewer's message (unless it's a JSON action)
      // Skip speaking if message is just JSON
      const isJsonOnly = messageText.trim().startsWith('{') && messageText.trim().endsWith('}');
      if (!isJsonOnly && messageText) {
        console.log('Speaking interviewer message:', messageText);
        
        speechService.speak(messageText, {
          onEnd: () => {
            console.log('Finished speaking interviewer message');
            setInterviewState(prevState => ({
              ...prevState,
              isSpeaking: false
            }));
            
            // If this was code review, request closing message
            if (needsClosing && stage === 'code-review') {
              console.log('🎯 Code review finished, requesting closing message...');
              setTimeout(() => {
                socketService.emit('request-closing', {});
              }, 500); // Small delay before requesting closing
            }
            // If this was a question and not coding, start listening for response
            else if (!requiresCoding && (messageText.endsWith('?') || messageText.includes('tell me') || messageText.includes('describe'))) {
              console.log('Question detected, starting listening...');
              setTimeout(() => {
                speechService.startListening();
              }, 500); // Small delay to ensure speech has fully stopped
            }
          },
          onError: (error) => {
            console.error('Error speaking message:', error);
            setInterviewState(prevState => ({
              ...prevState,
              isSpeaking: false,
              notification: {
                open: true,
                message: `Error with speech synthesis: ${error.message || 'Unknown error'}`,
                severity: 'error'
              }
            }));
          }
        });
      }
      
      return {
        ...prev,
        conversationHistory: updatedHistory,
        currentMessage: messageText,
        isSpeaking: !isJsonOnly && messageText ? true : false,
        stage: stage || prev.stage,
        showIDE: requiresCoding || prev.showIDE,
        problemData: problemData || prev.problemData // Store problem data for IDE
      };
    });
  };

  // Handle candidate responses
  const handleCandidateResponse = (message) => {
    if (!message.trim()) return;

    // Add to conversation history
    setInterviewState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, {
        speaker: 'candidate',
        message,
        timestamp: new Date(),
        isVoice: true
      }],
      currentTranscript: '',
      interimTranscript: ''
    }));

    // Send to backend
    socketService.sendResponse(message, true);
    
    // Stop listening while AI processes
    stopListening();
  };

  // Start interview
  const startInterview = async (role, candidateName = 'Candidate') => {
    console.log('Starting interview with role:', role, 'candidate:', candidateName);
    
    // Validate inputs
    if (!role || !candidateName.trim()) {
      console.error('Invalid role or candidate name');
      return false;
    }

    // Ensure socket is connected
    if (!socketService.isSocketConnected()) {
      console.log('Socket not connected, attempting to connect...');
      try {
        await socketService.connect();
      } catch (error) {
        console.error('Failed to connect to server:', error);
        setInterviewState(prev => ({
          ...prev,
          notification: {
            open: true,
            message: 'Failed to connect to interview server. Please try again.',
            severity: 'error'
          }
        }));
        return false;
      }
    }

    // Update UI state optimistically - clear any previous results
    setInterviewState(prev => ({
      ...prev,
      isInterviewActive: true,
      selectedRole: role,
      candidateName: candidateName.trim(),
      stage: 'introduction',
      conversationHistory: [],
      showIDE: false,
      isConnecting: true,
      results: null, // Clear previous results
      notification: {
        open: true,
        message: 'Starting interview session...',
        severity: 'info'
      }
    }));

    try {
      console.log('Sending start-interview event');
      // Start interview session
      socketService.startInterview(role, candidateName.trim());
      return true;
    } catch (error) {
      console.error('Failed to start interview:', error);
      setInterviewState(prev => ({
        ...prev,
        isInterviewActive: false,
        isConnecting: false,
        notification: {
          open: true,
          message: 'Failed to start interview. Please try again.',
          severity: 'error'
        }
      }));
      return false;
    }
  };

  // Start listening
  const startListening = () => {
    if (speechService.isSupported() && !interviewState.isSpeaking) {
      const success = speechService.startListening();
      if (success) {
        setInterviewState(prev => ({ ...prev, isListening: true }));
      }
      return success;
    }
    return false;
  };

  // Stop listening
  const stopListening = () => {
    speechService.stopListening();
    setInterviewState(prev => ({ ...prev, isListening: false }));
  };

  // Toggle listening
  const toggleListening = () => {
    if (interviewState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Submit code
  const submitCode = (code, language, explanation = '') => {
    // Add to conversation history
    setInterviewState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, {
        speaker: 'candidate',
        message: `Code submission: ${explanation}`,
        code,
        language,
        timestamp: new Date(),
        isCode: true
      }]
    }));

    // Send to backend
    socketService.submitCode(code, language, explanation);
    
    // Hide IDE after submission
    setInterviewState(prev => ({ ...prev, showIDE: false }));
  };

  // End interview
  const endInterview = async () => {
    console.log('Ending interview...');
    
    // Update UI state optimistically
    setInterviewState(prev => ({
      ...prev,
      isEnding: true,
      isInterviewActive: false,
      isListening: false,
      isSpeaking: false,
      stage: 'completed',
      notification: {
        open: true,
        message: 'Ending interview session and generating final feedback...',
        severity: 'info'
      }
    }));

    try {
      // Ensure socket is connected
      if (!socketService.isSocketConnected()) {
        console.log('Socket not connected, attempting to connect...');
        await socketService.connect();
      }

      // Send end-interview event
      console.log('Sending end-interview event');
      socketService.endInterview();
      
      // Set a timeout in case the server doesn't respond
      const timeout = setTimeout(() => {
        console.warn('Server response timeout, forcing end of interview');
        handleInterviewEnd({
          success: true,
          message: 'Interview session ended',
          closingMessage: 'Thank you for the interview! Your responses have been recorded.'
        });
      }, 10000); // 10 second timeout

      // Return a promise that resolves when the interview ends
      return new Promise((resolve) => {
        const onInterviewEnded = (data) => {
          clearTimeout(timeout);
          handleInterviewEnd(data);
          resolve(true);
        };
        
        // Listen for interview-ended event
        socketService.once('interview-ended', onInterviewEnded);
      });
    } catch (error) {
      console.error('Failed to end interview:', error);
      setInterviewState(prev => ({
        ...prev,
        isEnding: false,
        notification: {
          open: true,
          message: `Error ending interview: ${error.message || 'Please try again.'}`,
          severity: 'error'
        }
      }));
      return false;
    }
  };

  // Handle interview end event from server
  const handleInterviewEnd = (data) => {
    console.log('Handling interview end event:', data);
    const { success, message, closingMessage, error, sessionData } = data;
    
    // Stop any ongoing speech or listening
    speechService.stopListening();
    speechService.stopSpeaking();
    
    if (success) {
      // Calculate interview duration if session data is available
      const duration = sessionData && sessionData.startTime 
        ? Math.round((new Date() - new Date(sessionData.startTime)) / 1000) 
        : 0;
      
      // Speak the closing message if available
      if (closingMessage) {
        speechService.speak(closingMessage);
      } else if (message) {
        speechService.speak(message);
      }
      
      // Log report to console (for backend debugging only)
      if (data.report) {
        console.log('📊 Interview Report Generated (Backend Only):', {
          reportId: data.report.reportId,
          candidateName: data.report.candidateName,
          role: data.report.role,
          overallScore: data.report.overallScore,
          scores: {
            technical: data.report.scores?.technical,
            codeQuality: data.report.scores?.codeQuality,
            communication: data.report.scores?.communication
          },
          strengths: data.report.strengths,
          improvements: data.report.improvements
        });
        console.log('📊 Full Report Object:', data.report);
      }
      
      // Update state with success message (no navigation to results page)
      setInterviewState(prev => ({
        ...prev,
        isInterviewActive: false,
        isListening: false,
        isSpeaking: false,
        stage: 'completed',
        notification: {
          open: true,
          message: closingMessage || 'Interview completed successfully! Check backend logs for detailed report.',
          severity: 'success'
        },
        results: {
          ...prev.results,
          message: message || 'Interview completed',
          sessionData,
          completed: true,
          completedAt: new Date().toISOString(),
          duration,
          feedback: closingMessage || 'Thank you for completing the interview.'
        }
      }));
      
      // Don't navigate to results page - just show completion message
      // Report is available in backend logs only
      
    } else {
      // Handle error case
      console.error('Error ending interview:', error || message);
      
      // Speak the error message if available
      if (error || message) {
        speechService.speak(`Error: ${error || message}`);
      }
      
      setInterviewState(prev => ({
        ...prev,
        isInterviewActive: false,
        isListening: false,
        isSpeaking: false,
        stage: 'completed',
        notification: {
          open: true,
          message: error || message || 'Error ending interview',
          severity: 'error'
        },
        results: {
          ...prev.results,
          message: 'Interview ended with error',
          completed: false,
          error: error || message || 'Unknown error',
          completedAt: new Date().toISOString()
        }
      }));
    }
  };

  // Manual text input (fallback)
  const sendTextMessage = (text) => {
    handleCandidateResponse(text);
  };

  // Stop AI speaking
  const stopSpeaking = () => {
    speechService.stopSpeaking();
    setInterviewState(prev => ({ ...prev, isSpeaking: false }));
  };

  // Get conversation summary
  const getConversationSummary = () => {
    return {
      totalMessages: interviewState.conversationHistory.length,
      candidateMessages: interviewState.conversationHistory.filter(m => m.speaker === 'candidate').length,
      interviewerMessages: interviewState.conversationHistory.filter(m => m.speaker === 'interviewer').length,
      codeSubmissions: interviewState.conversationHistory.filter(m => m.isCode).length,
      duration: interviewState.isInterviewActive ? 
        Math.round((new Date() - new Date()) / 1000) : 0
    };
  };

  const value = {
    // State
    ...interviewState,
    
    // Actions
    startInterview,
    endInterview,
    startListening,
    stopListening,
    toggleListening,
    submitCode,
    sendTextMessage,
    stopSpeaking,
    
    // Utilities
    getConversationSummary,
    isConnected: interviewState.isConnected,
    speechSupported: speechService.isSupported(),
  };

  return (
    <AIInterviewContext.Provider value={value}>
      {children}
    </AIInterviewContext.Provider>
  );
}

export default AIInterviewContext;
