/**
 * Structured Interview Manager
 * Implements a 6-stage interview flow with strict stage progression
 */

class StructuredInterviewManager {
  constructor(ollamaService) {
    this.ollamaService = ollamaService;
    this.activeSessions = new Map();
    this.rolePrompts = this.initializeRolePrompts();
    this.interviewStages = this.defineInterviewStages();
  }

  initializeRolePrompts() {
    return {
      frontend: {
        name: "Frontend Developer",
        skills: ["React", "JavaScript", "HTML", "CSS"],
        technicalQuestions: [
          "Can you explain the difference between var, let, and const in JavaScript?",
          "What are React hooks and why do we use them?",
          "If a React component keeps re-rendering unnecessarily, what could cause that and how would you fix it?"
        ],
        codingChallenge: {
          title: "Filter Adults",
          description: "Write a JavaScript function called filterAdults(users) that takes an array of user objects with 'name' and 'age' properties, and returns a new array of users who are 18 or older, sorted by age.",
          example: `Example Input:
[
  { name: "Alice", age: 17 },
  { name: "Bob", age: 22 },
  { name: "Charlie", age: 19 }
]

Expected Output:
[
  { name: "Charlie", age: 19 },
  { name: "Bob", age: 22 }
]`,
          starterCode: {
            javascript: "function filterAdults(users) {\n  // Your code here\n  return [];\n}",
            python: "def filter_adults(users):\n    # Your code here\n    return []",
            typescript: "function filterAdults(users: {name: string, age: number}[]): {name: string, age: number}[] {\n  // Your code here\n  return [];\n}"
          },
          testCases: [
            { 
              input: '[{"name":"Alice","age":17},{"name":"Bob","age":22},{"name":"Charlie","age":19}]',
              expected: '[{"name":"Charlie","age":19},{"name":"Bob","age":22}]'
            },
            {
              input: '[{"name":"John","age":15},{"name":"Jane","age":25}]',
              expected: '[{"name":"Jane","age":25}]'
            }
          ]
        }
      },
      backend: {
        name: "Backend Developer",
        skills: ["Node.js", "Python", "APIs", "Databases"],
        technicalQuestions: [
          "Can you explain the difference between SQL and NoSQL databases?",
          "What is middleware in Express.js and how do you use it?",
          "How would you handle authentication in a REST API?"
        ],
        codingChallenge: {
          title: "API Response Parser",
          description: "Write a function called parseAPIResponse(data) that takes an array of API response objects and returns only the items with status 'success', sorted by timestamp.",
          example: `Example Input:
[
  { id: 1, status: "success", timestamp: 1000 },
  { id: 2, status: "error", timestamp: 900 },
  { id: 3, status: "success", timestamp: 1100 }
]

Expected Output:
[
  { id: 1, status: "success", timestamp: 1000 },
  { id: 3, status: "success", timestamp: 1100 }
]`,
          starterCode: {
            javascript: "function parseAPIResponse(data) {\n  // Your code here\n  return [];\n}",
            python: "def parse_api_response(data):\n    # Your code here\n    return []"
          },
          testCases: [
            {
              input: '[{"id":1,"status":"success","timestamp":1000},{"id":2,"status":"error","timestamp":900}]',
              expected: '[{"id":1,"status":"success","timestamp":1000}]'
            }
          ]
        }
      }
    };
  }

  defineInterviewStages() {
    return {
      GREETING: 'greeting',
      INTRODUCTION: 'introduction',
      TECHNICAL_Q1: 'technical_q1',
      TECHNICAL_Q2: 'technical_q2',
      TECHNICAL_Q3: 'technical_q3',
      CODING: 'coding',
      EXPLANATION: 'explanation',
      WRAPUP: 'wrapup'
    };
  }

  async startInterview(sessionId, role, candidateName) {
    const roleInfo = this.rolePrompts[role] || this.rolePrompts.frontend;
    
    const session = {
      id: sessionId,
      role: role,
      roleInfo: roleInfo,
      candidateName: candidateName,
      startTime: new Date(),
      conversationHistory: [],
      currentStage: this.interviewStages.GREETING,
      stageResponses: {},
      waitingForResponse: true,
      isReady: false
    };

    this.activeSessions.set(sessionId, session);
    console.log(`📝 Started structured interview for ${candidateName} as ${roleInfo.name}`);
    
    return session;
  }

  async getInitialGreeting(role, candidateName) {
    const roleInfo = this.rolePrompts[role] || this.rolePrompts.frontend;
    
    return `Hello! I'm your AI interviewer. Welcome to your ${roleInfo.name} interview session. We'll discuss your background, a few technical concepts, and do one coding challenge. Are you ready to begin?`;
  }

  async processCandidateResponse(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add to conversation history
    session.conversationHistory.push({
      role: 'candidate',
      message: message,
      timestamp: new Date(),
      stage: session.currentStage
    });

    // Store response for current stage
    session.stageResponses[session.currentStage] = message;

    // Process based on current stage
    return await this.handleStageProgression(session, message);
  }

  async handleStageProgression(session, message) {
    const stages = this.interviewStages;
    const currentStage = session.currentStage;

    console.log(`📍 Current stage: ${currentStage}`);

    switch (currentStage) {
      case stages.GREETING:
        return await this.handleGreetingResponse(session, message);
      
      case stages.INTRODUCTION:
        return await this.handleIntroductionResponse(session, message);
      
      case stages.TECHNICAL_Q1:
      case stages.TECHNICAL_Q2:
      case stages.TECHNICAL_Q3:
        return await this.handleTechnicalResponse(session, message);
      
      case stages.CODING:
        return await this.handleCodingStage(session, message);
      
      case stages.EXPLANATION:
        return await this.handleExplanationResponse(session, message);
      
      case stages.WRAPUP:
        return await this.handleWrapupResponse(session, message);
      
      default:
        return await this.handleIntroductionResponse(session, message);
    }
  }

  async handleGreetingResponse(session, message) {
    const lowerMessage = message.toLowerCase();
    
    // Check if candidate is ready
    if (lowerMessage.includes('yes') || lowerMessage.includes('ready') || lowerMessage.includes('sure')) {
      session.isReady = true;
      session.currentStage = this.interviewStages.INTRODUCTION;
      
      return {
        message: "Great! Let's start with a quick introduction. Could you briefly introduce yourself and tell me about your experience with frontend technologies?",
        stage: session.currentStage,
        requiresCoding: false,
        waitingForResponse: true
      };
    } else if (lowerMessage.includes('no') || lowerMessage.includes('not ready')) {
      return {
        message: "No worries, let me know when you're ready. Just say 'I'm ready' when you want to begin.",
        stage: session.currentStage,
        requiresCoding: false,
        waitingForResponse: true
      };
    } else {
      // Unclear response - ask again
      return {
        message: "I didn't catch that. Are you ready to begin the interview? Please say yes or no.",
        stage: session.currentStage,
        requiresCoding: false,
        waitingForResponse: true
      };
    }
  }

  async handleIntroductionResponse(session, message) {
    const roleInfo = session.roleInfo;
    
    // Analyze introduction for keywords
    const keywords = {
      react: message.toLowerCase().includes('react'),
      html: message.toLowerCase().includes('html') || message.toLowerCase().includes('css'),
      ui: message.toLowerCase().includes('ui') || message.toLowerCase().includes('ux') || message.toLowerCase().includes('design')
    };

    let followUp = "What's your favorite aspect of frontend development and why?";
    
    if (keywords.react) {
      followUp = "What's your favorite React feature and why?";
    } else if (keywords.html) {
      followUp = "How do you ensure your pages are responsive and accessible?";
    } else if (keywords.ui) {
      followUp = "How do you balance aesthetics with usability in your designs?";
    }

    // Move to first technical question
    session.currentStage = this.interviewStages.TECHNICAL_Q1;
    
    const response = `Thank you for that introduction! ${followUp}\n\nNow, let's move to some technical questions. ${roleInfo.technicalQuestions[0]}`;

    return {
      message: response,
      stage: session.currentStage,
      requiresCoding: false,
      waitingForResponse: true
    };
  }

  async handleTechnicalResponse(session, message) {
    const stages = this.interviewStages;
    const roleInfo = session.roleInfo;
    
    // Determine next stage
    if (session.currentStage === stages.TECHNICAL_Q1) {
      session.currentStage = stages.TECHNICAL_Q2;
      return {
        message: roleInfo.technicalQuestions[1],
        stage: session.currentStage,
        requiresCoding: false,
        waitingForResponse: true
      };
    } else if (session.currentStage === stages.TECHNICAL_Q2) {
      session.currentStage = stages.TECHNICAL_Q3;
      return {
        message: roleInfo.technicalQuestions[2],
        stage: session.currentStage,
        requiresCoding: false,
        waitingForResponse: true
      };
    } else if (session.currentStage === stages.TECHNICAL_Q3) {
      // Move to coding
      session.currentStage = stages.CODING;
      return await this.triggerCodingChallenge(session);
    }
  }

  async triggerCodingChallenge(session) {
    const roleInfo = session.roleInfo;
    const challenge = roleInfo.codingChallenge;
    
    const transitionMessage = "Great! Now let's test your practical skills with a small coding task. Now I'll open the IDE for you.";
    const fullMessage = `${transitionMessage}\n\n${challenge.description}\n\n${challenge.example}`;

    return {
      message: fullMessage,
      stage: session.currentStage,
      requiresCoding: true,
      openIDE: true,
      problemData: {
        title: challenge.title,
        difficulty: "Medium",
        description: challenge.description,
        examples: [challenge.example],
        testCases: challenge.testCases,
        starterCode: challenge.starterCode,
        constraints: []
      },
      waitingForResponse: false // Don't wait - user will submit code
    };
  }

  async handleCodingStage(session, message) {
    // This is called when code is submitted
    // For now, just acknowledge and move to explanation
    session.currentStage = this.interviewStages.EXPLANATION;
    
    return {
      message: "Nice work! Your code has been submitted. Could you explain your approach and its time complexity?",
      stage: session.currentStage,
      requiresCoding: false,
      waitingForResponse: true
    };
  }

  async handleExplanationResponse(session, message) {
    // Move to wrap-up
    session.currentStage = this.interviewStages.WRAPUP;
    
    const feedback = await this.generateFinalFeedback(session);
    
    return {
      message: feedback,
      stage: session.currentStage,
      requiresCoding: false,
      waitingForResponse: false,
      isFinal: true
    };
  }

  async handleWrapupResponse(session, message) {
    return {
      message: "Thank you for your time! The interview is now complete.",
      stage: session.currentStage,
      requiresCoding: false,
      isFinal: true
    };
  }

  async generateFinalFeedback(session) {
    const roleInfo = session.roleInfo;
    
    const prompt = `You are an AI interviewer concluding a ${roleInfo.name} interview.

Conversation history:
${session.conversationHistory.map(msg => `${msg.role}: ${msg.message}`).join('\n')}

Provide a brief, professional wrap-up (2-3 sentences):
1. Thank the candidate
2. Mention one strength you observed
3. Optionally suggest one area for improvement

Be encouraging and professional.`;

    try {
      const feedback = await this.ollamaService.generateResponse(prompt, {
        temperature: 0.7,
        max_tokens: 150
      });
      
      return `That concludes your interview. ${feedback.trim()}\n\nThank you for your time! Would you like a performance summary report?`;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return "That concludes your interview. You demonstrated solid technical understanding today. Thank you for your time!";
    }
  }

  async processCodeSubmission(sessionId, code, language) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Store code submission
    session.codeSubmission = { code, language, timestamp: new Date() };
    
    // Move to explanation stage
    session.currentStage = this.interviewStages.EXPLANATION;
    
    return {
      message: "Nice work! Your code has been submitted. Could you explain your approach and its time complexity?",
      stage: session.currentStage,
      requiresCoding: false,
      waitingForResponse: true
    };
  }

  async endInterview(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.endTime = new Date();
    session.duration = (session.endTime - session.startTime) / 1000; // in seconds

    const summary = {
      candidateName: session.candidateName,
      role: session.roleInfo.name,
      duration: session.duration,
      stagesCompleted: Object.keys(session.stageResponses).length,
      conversationHistory: session.conversationHistory,
      codeSubmission: session.codeSubmission
    };

    this.activeSessions.delete(sessionId);
    
    return summary;
  }
}

module.exports = InterviewManager;
