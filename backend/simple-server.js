const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const SimpleInterviewService = require('./services/simpleInterviewService');
const CodeExecutionService = require('./services/codeExecutionService');
const ReportService = require('./services/reportService');
const OllamaService = require('./services/ollamaService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const interviewService = new SimpleInterviewService();
const codeExecutionService = new CodeExecutionService();
const ollamaService = new OllamaService();
const reportService = new ReportService(ollamaService);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Simple Interview Server Running'
  });
});

// Test Ollama
app.get('/test-ollama', async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:latest', // Use same model as interview service
      prompt: 'Say hello!',
      stream: false
    }, { timeout: 10000 });
    
    res.json({ 
      success: true, 
      message: 'Ollama is working!',
      response: response.data.response 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Start interview
  socket.on('start-interview', async (data, callback) => {
    try {
      const { role, candidateName } = data;
      const sessionId = uuidv4();
      
      console.log(`\n🎬 ========== STARTING INTERVIEW ==========`);
      console.log(`👤 Candidate: ${candidateName}`);
      console.log(`💼 Role: ${role}`);
      console.log(`🆔 Session: ${sessionId}`);
      console.log(`==========================================\n`);
      
      // Start interview and get greeting
      const greeting = await interviewService.startInterview(sessionId, role, candidateName);
      
      // Store session ID in socket
      socket.sessionId = sessionId;
      
      // Send success callback
      callback({ 
        success: true, 
        sessionId,
        message: 'Interview started'
      });
      
      // Send greeting to client
      console.log(`📤 Sending greeting to client...`);
      socket.emit('interviewer-response', {
        message: greeting,
        stage: 'introduction',
        requiresCoding: false,
        isFinal: false
      });
      
      console.log(`✅ Greeting sent successfully\n`);
      
    } catch (error) {
      console.error('❌ Error starting interview:', error);
      callback({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Handle candidate response
  socket.on('candidate-response', async (data) => {
    try {
      const { message } = data;
      
      console.log(`\n💬 ========== CANDIDATE RESPONSE ==========`);
      console.log(`📝 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      console.log(`🆔 Session: ${socket.sessionId}`);
      console.log(`==========================================\n`);
      
      if (!socket.sessionId) {
        console.error('❌ No session ID found');
        return;
      }
      
      // Process response and get next question
      console.log(`🤖 Generating AI response...`);
      const response = await interviewService.processResponse(socket.sessionId, message);
      
      console.log(`📤 Sending AI response to client...`);
      console.log(`   Type: ${response.requiresCoding ? 'CODING' : 'VOICE'}`);
      console.log(`   Stage: ${response.stage}`);
      console.log(`   Message: ${response.message.substring(0, 100)}${response.message.length > 100 ? '...' : ''}`);
      
      // Send AI response
      socket.emit('interviewer-response', response);
      
      console.log(`✅ AI response sent successfully\n`);
      
    } catch (error) {
      console.error('❌ Error processing response:', error);
      socket.emit('error', { 
        message: 'Failed to process response' 
      });
    }
  });

  // Handle code submission with execution and AI analysis
  socket.on('code-submission', async (data) => {
    try {
      const { code, language, explanation } = data;
      
      console.log(`\n💻 ========== CODE SUBMISSION ==========`);
      console.log(`📝 Language: ${language}`);
      console.log(`🆔 Session: ${socket.sessionId}`);
      console.log(`📄 Code length: ${code.length} characters`);
      console.log(`==========================================\n`);
      
      if (!socket.sessionId) {
        console.error('❌ No session ID found');
        return;
      }
      
      // Get session and problem data
      const session = interviewService.getSession(socket.sessionId);
      if (!session) {
        console.error('❌ Session not found');
        return;
      }
      
      if (!session.problemData) {
        console.error('❌ No problem data found in session');
        return;
      }
      
      const problemData = session.problemData;
      console.log(`📋 Problem: ${problemData.title}`);
      
      // Step 1: Execute code against test cases (if available)
      let executionResults = null;
      
      if (problemData.testCases && problemData.testCases.length > 0) {
        console.log(`\n🔄 Step 1: Executing code against ${problemData.testCases.length} test cases...`);
        try {
          executionResults = await codeExecutionService.executeCode(
            code,
            language,
            problemData.testCases
          );
          console.log(`✅ Execution complete: ${executionResults.passed}/${executionResults.totalTests} passed\n`);
        } catch (execError) {
          console.error('⚠️ Code execution failed:', execError.message);
          console.log('   Continuing with code analysis only...\n');
        }
      } else {
        console.log('⚠️ No test cases available, skipping execution\n');
      }
      
      // Step 2: Analyze code with AI (with or without execution results)
      console.log(`🤖 Step 2: Analyzing code with AI...`);
      let codeReview;
      
      if (executionResults) {
        // Hybrid analysis: execution results + LLM review
        codeReview = await interviewService.analyzeCodeWithResults(
          code,
          language,
          explanation,
          problemData,
          executionResults
        );
      } else {
        // Fallback: LLM analysis only
        codeReview = await interviewService.analyzeCodeOnly(
          code,
          language,
          explanation,
          problemData
        );
      }
      
      console.log(`✅ Code review generated\n`);
      
      // Step 3: Send code review to frontend
      console.log(`📤 Step 3: Sending code review to frontend...`);
      socket.emit('interviewer-response', {
        message: codeReview,
        requiresCoding: false,
        stage: 'code-review',
        isFinal: false,
        executionResults: executionResults, // Include execution results for frontend display
        needsClosing: true // Signal that closing message should follow after speech ends
      });
      
      console.log(`✅ Code review sent successfully\n`);
      
    } catch (error) {
      console.error('❌ Error processing code:', error);
      socket.emit('error', { 
        message: 'Failed to process code submission' 
      });
    }
  });

  // Request closing message (after code review is spoken)
  socket.on('request-closing', async () => {
    try {
      console.log(`\n📤 ========== REQUESTING CLOSING MESSAGE ==========`);
      console.log(`🆔 Session: ${socket.sessionId}`);
      console.log(`==========================================\n`);
      
      if (!socket.sessionId) {
        console.error('❌ No session ID found');
        return;
      }
      
      // Generate and send closing message
      const closingResponse = await interviewService.processResponse(
        socket.sessionId,
        'Code review completed'
      );
      
      console.log(`📤 Sending closing message...`);
      socket.emit('interviewer-response', closingResponse);
      
      console.log(`✅ Closing message sent\n`);
      
    } catch (error) {
      console.error('❌ Error sending closing message:', error);
    }
  });

  // End interview
  socket.on('end-interview', async (data, callback) => {
    console.log(`\n🏁 ========== ENDING INTERVIEW ==========`);
    console.log(`🆔 Session: ${socket.sessionId}`);
    console.log(`==========================================\n`);
    
    if (!socket.sessionId) {
      if (callback) {
        callback({ success: false, error: 'No session ID found' });
      }
      return;
    }

    try {
      // Get session data
      const session = interviewService.getSession(socket.sessionId);
      
      if (!session) {
        console.error('❌ Session not found');
        if (callback) {
          callback({ success: false, error: 'Session not found' });
        }
        return;
      }

      // End the interview session
      interviewService.endInterview(socket.sessionId);
      
      // Prepare session data for report generation
      // The reportService expects a specific session structure
      const sessionForReport = {
        ...session,
        roleInfo: {
          name: session.role || 'Software Engineer'
        },
        questionsAsked: session.questionCount || 0,
        conversationHistory: session.conversationHistory || []
      };

      // Generate report with scores
      console.log('📊 Generating interview report...');
      const report = await reportService.generateReport(sessionForReport, session.codeResults || null);
      
      console.log('✅ Report generated:', {
        overallScore: report.overallScore,
        technicalScore: report.technicalScore,
        codingScore: report.codingScore,
        communicationScore: report.communicationScore
      });

      // Send report to frontend
      socket.emit('interview-ended', {
        success: true,
        message: 'Interview completed',
        report: {
          reportId: report.reportId,
          candidateName: report.candidateName,
          role: report.role,
          date: report.date,
          duration: report.duration.total,
          overallScore: report.overallScore,
          scores: {
            technical: report.technicalScore,
            codeQuality: report.codingScore,
            communication: report.communicationScore
          },
          technicalFeedback: {
            overallAssessment: report.feedback,
            codingChallenge: report.codeResults ? `Test Results: ${report.codeResults.passedTests}/${report.codeResults.totalTests} passed` : null
          },
          strengths: report.strengths,
          improvements: report.improvements,
          recommendations: [report.recommendation.message],
          nextSteps: report.recommendation.decision,
          codeSubmission: report.codeResults ? {
            submitted: true,
            language: report.codeResults.language,
            passed: report.codeResults.allPassed
          } : { submitted: false }
        },
        closingMessage: report.feedback,
        sessionData: session
      });

      if (callback) {
        callback({ success: true, report });
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      
      // Send error response
      socket.emit('interview-ended', {
        success: false,
        error: error.message || 'Failed to generate report'
      });

      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    if (socket.sessionId) {
      interviewService.endInterview(socket.sessionId);
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`   Simple Interview Server Started`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Time: ${new Date().toLocaleString()}`);
  console.log(`========================================\n`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /test-ollama - Test Ollama connection`);
  console.log(`\n🔌 Socket.IO Events:`);
  console.log(`   start-interview - Start new interview`);
  console.log(`   candidate-response - Send candidate answer`);
  console.log(`   code-submission - Submit code solution`);
  console.log(`   end-interview - End interview session`);
  console.log(`\n✅ Ready to accept connections!\n`);
});
