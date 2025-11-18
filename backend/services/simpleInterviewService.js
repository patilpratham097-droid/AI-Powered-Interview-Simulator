const axios = require('axios');

class SimpleInterviewService {
  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    // Use smaller model for faster responses (3-5 seconds instead of 15)
    // Options: 'llama3.2:latest' (fast), 'llama3.1:8b' (slow but better), 'llama3.2:3b-instruct-q4_0' (fastest)
    this.model = 'llama3.2:latest'; // Balanced: good quality + faster speed
    this.sessions = new Map();
  }

  // Clean meta-text from AI responses
  cleanResponse(text) {
    let cleaned = text.trim();
    
    // Remove common meta-text patterns
    const metaPatterns = [
      /^Here's a possible (response|question|greeting|transition):?\s*/i,
      /^Here's (a|an|the) (response|question|greeting|transition):?\s*/i,
      /^Note:.*$/gm,
      /^\(.*?\)$/gm,  // Remove lines that are only parentheses
      /\[.*?\]/g,     // Remove text in brackets
      /^This (question|response) (tests|checks|evaluates).*$/gm
    ];
    
    metaPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    // Remove extra whitespace and newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    
    return cleaned;
  }

  // Start a new interview session
  async startInterview(sessionId, role, candidateName) {
    console.log(`🎬 Starting interview: ${sessionId}, Role: ${role}, Name: ${candidateName}`);
    
    const session = {
      sessionId,
      role,
      candidateName,
      questionCount: 0,
      maxQuestions: 4, // 3 voice + 1 coding
      conversationHistory: [],
      startTime: new Date()
    };
    
    this.sessions.set(sessionId, session);
    
    // Generate initial greeting
    const greeting = await this.generateGreeting(candidateName, role);
    
    session.conversationHistory.push({
      role: 'interviewer',
      content: greeting,
      timestamp: new Date()
    });
    
    return greeting;
  }

  // Generate greeting using LLM
  async generateGreeting(candidateName, role) {
    // Add randomization to make each greeting unique
    const greetingStyles = [
      'warm and enthusiastic',
      'professional and welcoming',
      'friendly and encouraging',
      'casual yet professional'
    ];
    const style = greetingStyles[Math.floor(Math.random() * greetingStyles.length)];
    const randomSeed = Math.random().toString(36).substring(7);

    const prompt = `You are a professional technical interviewer with a ${style} personality. 
Greet ${candidateName} who is interviewing for a ${role} position. 
Session: ${randomSeed}

Requirements:
- Keep it brief (2-3 sentences)
- Be ${style}
- Then ask them to briefly introduce themselves
- Make it sound natural and conversational
- Don't use the exact same wording as typical interviews

CRITICAL: Speak DIRECTLY as the interviewer. DO NOT include:
- "Here's a possible response"
- "Note:"
- Text in [brackets] or (parentheses)
- Meta-commentary
- Explanations about what you're doing

Just speak naturally as if you're talking to the candidate right now.

Your greeting:`;

    try {
      console.log('Calling Ollama API for greeting...');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.85,
          num_predict: 100,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      }, {
        timeout: 30000
      });
      console.log('Ollama response received');

      const greeting = this.cleanResponse(response.data.response);
      console.log('✅ Generated greeting:', greeting.substring(0, 100) + '...');
      return greeting;
    } catch (error) {
      console.error('❌ Error generating greeting:', error.message);
      // Fallback greeting
      return `Hello ${candidateName}, welcome to your ${role} interview. I'm excited to learn more about your experience today. Could you please start by briefly introducing yourself?`;
    }
  }

  // Process candidate's response and generate next question
  async processResponse(sessionId, candidateResponse) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`💬 Processing response for session ${sessionId}`);
    console.log(`📊 Current question count: ${session.questionCount}/${session.maxQuestions}`);

    // Add candidate response to history
    session.conversationHistory.push({
      role: 'candidate',
      content: candidateResponse,
      timestamp: new Date()
    });

    // Increment question count
    session.questionCount++;
    console.log(`📊 After increment: ${session.questionCount}/${session.maxQuestions}`);

    // Check if we should ask coding question (after 3 voice questions)
    if (session.questionCount === 3) {
      console.log('🎯 Time for coding question (question 4)');
      
      // Generate acknowledgment and transition message
      const transitionMessage = await this.generateCodingTransition(session, candidateResponse);
      
      // Generate the actual coding question
      const codingQuestion = await this.generateCodingQuestion(session.role);
      
      // IMPORTANT: Store problemData in session for code analysis later
      session.problemData = codingQuestion;
      
      // Combine transition + coding question
      const fullMessage = `${transitionMessage}\n\n${codingQuestion.question}`;
      
      session.conversationHistory.push({
        role: 'interviewer',
        content: fullMessage,
        type: 'coding',
        timestamp: new Date()
      });

      return {
        message: fullMessage,
        requiresCoding: true,
        problemData: codingQuestion,
        stage: 'coding',
        isFinal: false
      };
    }

    // Check if interview should end (after coding question is answered)
    if (session.questionCount === 4) {
      console.log('🏁 Interview complete, generating closing message');
      const closingMessage = await this.generateClosingMessage(session);
      
      session.conversationHistory.push({
        role: 'interviewer',
        content: closingMessage,
        timestamp: new Date()
      });

      return {
        message: closingMessage,
        requiresCoding: false,
        stage: 'wrap-up',
        isFinal: true
      };
    }

    // Generate next voice question (questions 1-3 only)
    if (session.questionCount <= 3) {
      console.log(`🗣️ Generating voice question ${session.questionCount}`);
      const nextQuestion = await this.generateNextQuestion(session, candidateResponse);
      
      session.conversationHistory.push({
        role: 'interviewer',
        content: nextQuestion,
        type: 'voice',
        timestamp: new Date()
      });

      return {
        message: nextQuestion,
        requiresCoding: false,
        stage: 'conversation',
        isFinal: false
      };
    }

    // Fallback - should not reach here
    console.error('❌ Unexpected question count:', session.questionCount);
    throw new Error('Invalid interview state');
  }

  // Generate next voice question using LLM
  async generateNextQuestion(session, candidateResponse) {
    const { role, conversationHistory, questionCount, candidateName } = session;

    // Build conversation context
    const context = conversationHistory
      .slice(-4) // Last 4 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    // Add randomization seed to ensure different questions each time
    const randomSeed = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();

    // Check for special responses that need acknowledgment
    const lowerResponse = candidateResponse.toLowerCase().trim();
    const needsAcknowledgment = 
      lowerResponse.includes("don't know") || 
      lowerResponse.includes("not sure") ||
      lowerResponse.includes("repeat") ||
      lowerResponse.includes("again") ||
      lowerResponse.includes("can you") ||
      lowerResponse.length < 20; // Very short answer

    // Determine question type based on count
    let questionType = '';
    let technicalLevel = '';
    
    if (questionCount === 1) {
      questionType = 'introductory follow-up';
      technicalLevel = 'Ask about their background, experience level, or general familiarity with the role.';
    } else if (questionCount === 2) {
      questionType = 'TECHNICAL question';
      technicalLevel = `Ask a DEEP TECHNICAL question about ${role} concepts, tools, or best practices. This should test their actual technical knowledge. Examples: architecture decisions, performance optimization, specific frameworks, design patterns, etc.`;
    } else if (questionCount === 3) {
      questionType = 'ADVANCED TECHNICAL question';
      technicalLevel = `Ask an ADVANCED TECHNICAL question that tests their expertise in ${role}. This should be challenging and specific. Examples: scalability challenges, complex algorithms, system design, debugging scenarios, trade-offs in technical decisions.`;
    }

    const prompt = `You are a professional technical interviewer conducting a ${role} interview with ${candidateName}.
Session ID: ${randomSeed} | Time: ${timestamp}

Previous conversation:
${context}

Candidate's latest response: "${candidateResponse}"

This is question ${questionCount} out of 3 voice questions (question 4 will be a coding question).
Question Type: ${questionType}

${technicalLevel}

IMPORTANT INSTRUCTIONS:
${needsAcknowledgment ? `
The candidate's response needs acknowledgment. Start with a brief, natural acknowledgment (e.g., "I understand", "No problem", "That's okay", "Great", "Interesting") before asking the next question.
` : `
Start with a brief acknowledgment of their answer (e.g., "I see", "Good point", "Interesting", "Thanks for sharing") then ask the next question.
`}

Generate a response that:
1. FIRST: Acknowledge their answer naturally (1 sentence)
2. THEN: Ask the ${questionType}
3. ${questionCount === 1 ? 'Follows up on their introduction naturally' : 'Tests their TECHNICAL knowledge deeply'}
4. Is specific to ${role} position
5. ${questionCount > 1 ? 'Is TECHNICAL and challenging (not generic or soft skills)' : 'Is conversational and helps understand their background'}
6. Total length: 2-3 sentences maximum

${questionCount > 1 ? 'CRITICAL: The question MUST be TECHNICAL about code, architecture, tools, or technical concepts. NOT about projects, teamwork, or general experience.' : ''}

CRITICAL: Speak DIRECTLY as the interviewer. DO NOT include:
- "Here's a possible response"
- "Here's a question"
- "Note:"
- Text in [brackets] or (parentheses)
- Meta-commentary like "This question tests..."
- Explanations about what you're doing

Just speak naturally as if you're talking to the candidate right now.

Your response:`;

    try {
      console.log('Calling Ollama API for next question...');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.85,
          num_predict: 120,
          top_p: 0.9,
          repeat_penalty: 1.2
        }
      }, {
        timeout: 30000
      });
      console.log('Ollama response received');

      const question = this.cleanResponse(response.data.response);
      console.log('✅ Generated question:', question);
      return question;
    } catch (error) {
      console.error('❌ Error generating question:', error.message);
      // Fallback questions based on question count
      const fallbackQuestions = {
        1: `Tell me about your experience with ${role} technologies. What have you worked with most recently?`,
        2: `Let's get technical - Can you explain how you would optimize performance in a ${role} application? What specific techniques do you use?`,
        3: `Here's an advanced scenario: How would you design a scalable system for ${role}? Walk me through your architecture decisions and trade-offs.`
      };
      return fallbackQuestions[questionCount] || fallbackQuestions[1];
    }
  }

  // Generate transition message before coding challenge
  async generateCodingTransition(session, candidateResponse) {
    const { role, candidateName } = session;
    
    const prompt = `You are a professional technical interviewer conducting a ${role} interview with ${candidateName}.

The candidate just answered: "${candidateResponse}"

Now you need to transition to a coding challenge. Generate a brief, natural transition that:
1. Acknowledges their previous answer (1 sentence)
2. Says you're moving to a coding task (1 sentence)
3. Sounds encouraging and professional
4. Keep it very brief (2-3 sentences maximum)

IMPORTANT: DO NOT describe the coding problem or question. Just acknowledge and say you're opening the IDE for a coding task.

Example transitions:
- "Great! I appreciate that answer. Now, let's do a coding task. I'm opening the coding environment for you."
- "Excellent insights! Let's move to a practical coding challenge now. Opening the IDE."
- "Thank you for sharing that. Now I'd like to see your coding skills in action. Let me open the coding environment."
- "Perfect! Now let's test your problem-solving with some code. I'm opening the editor for you."

CRITICAL: Speak DIRECTLY as the interviewer. DO NOT include:
- "Here's a possible transition"
- "Note:"
- Text in [brackets] or (parentheses)
- Meta-commentary
- The actual coding question or problem description
- Explanations

Just acknowledge their answer and mention opening the IDE for a coding task.

Your transition:`;

    try {
      console.log('Generating coding transition...');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8,
          num_predict: 80,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      }, {
        timeout: 15000
      });

      const transition = this.cleanResponse(response.data.response);
      console.log('✅ Generated transition:', transition);
      return transition;
    } catch (error) {
      console.error('❌ Error generating transition:', error.message);
      // Fallback transition
      return `Great! Thanks for that answer. Now let's do a coding task. I'm opening the coding environment for you.`;
    }
  }

  // Generate coding question dynamically using LLM
  async generateCodingQuestion(role) {
    const prompt = `You are a technical interviewer for a ${role} position. Generate a coding challenge appropriate for this role.

Generate a JSON response with this EXACT format (no extra text):
{
  "title": "Short title (2-4 words)",
  "question": "Clear problem description with requirements and constraints",
  "difficulty": "Easy/Medium/Hard",
  "examples": [
    {"input": "example input", "output": "expected output", "explanation": "why"}
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "testCases": [
    {"input": "test input", "expected": "expected output"}
  ]
}

Make it relevant to ${role} work. Keep it practical and interview-appropriate.

IMPORTANT: Generate a UNIQUE problem. Avoid common problems like Two Sum, FizzBuzz, or Palindrome. Be creative!
Random seed: ${Math.random().toString(36).substring(7)}`;

    try {
      console.log('Calling Ollama API for coding question...');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.85,
          num_predict: 300,
          top_p: 0.9,
          repeat_penalty: 1.2
        }
      }, {
        timeout: 30000
      });
      console.log('Ollama response received');

      const generatedText = response.data.response.trim();
      console.log('Generated coding question:', generatedText.substring(0, 200) + '...');
      
      // Try to parse JSON from response
      try {
        // Extract JSON if wrapped in markdown code blocks
        let jsonText = generatedText;
        if (generatedText.includes('```json')) {
          jsonText = generatedText.split('```json')[1].split('```')[0].trim();
        } else if (generatedText.includes('```')) {
          jsonText = generatedText.split('```')[1].split('```')[0].trim();
        }
        
        const codingQuestion = JSON.parse(jsonText);
        console.log('✅ Parsed coding question:', codingQuestion.title);
        return codingQuestion;
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON, using fallback');
        throw parseError;
      }
    } catch (error) {
      console.error('❌ Error generating coding question:', error.message);
      // Fallback questions
      const fallbackQuestions = {
        'frontend': {
          title: 'Debounce Function',
          question: 'Implement a debounce function that delays execution until after a specified wait time has elapsed since the last invocation. This is commonly used in search inputs to avoid excessive API calls.',
          difficulty: 'Medium',
          examples: [
            { input: 'debounce(fn, 300)', output: 'Function that waits 300ms', explanation: 'Multiple rapid calls only execute once after delay' }
          ],
          constraints: ['Must handle multiple rapid calls', 'Should cancel pending executions'],
          testCases: [
            { input: 'Multiple rapid calls within 300ms', expected: 'Only last call executes after delay' }
          ]
        },
        'backend': {
          title: 'API Rate Limiter',
          question: 'Implement a rate limiter that allows a maximum of N requests per time window. This is essential for protecting APIs from abuse.',
          difficulty: 'Medium',
          examples: [
            { input: 'RateLimiter(5, 1000)', output: 'Allows 5 requests per second', explanation: 'Blocks additional requests until window resets' }
          ],
          constraints: ['Must track requests per user/IP', 'Should reset after time window'],
          testCases: [
            { input: '10 requests in 1 second with limit 5/sec', expected: 'First 5 pass, rest blocked' }
          ]
        },
        'fullstack': {
          title: 'Two Sum Problem',
          question: 'Given an array of integers and a target sum, return the indices of two numbers that add up to the target. You may assume each input has exactly one solution.',
          difficulty: 'Easy',
          examples: [
            { input: '[2,7,11,15], target=9', output: '[0,1]', explanation: '2 + 7 = 9' }
          ],
          constraints: ['Each input has exactly one solution', 'Cannot use same element twice'],
          testCases: [
            { input: '[2,7,11,15], target=9', expected: '[0,1]' },
            { input: '[3,2,4], target=6', expected: '[1,2]' }
          ]
        }
      };
      
      const roleKey = role.toLowerCase().includes('frontend') ? 'frontend' 
                    : role.toLowerCase().includes('backend') ? 'backend' 
                    : 'fullstack';
      
      return fallbackQuestions[roleKey];
    }
  }

  // Generate closing message
  async generateClosingMessage(session) {
    const prompt = `You are a professional interviewer concluding an interview for ${session.candidateName} for a ${session.role} position.

Generate a brief, professional closing statement (2-3 sentences) that:
1. Thanks them for their time
2. Mentions they'll hear back soon
3. Is warm and encouraging

Generate ONLY the closing message:`;

    try {
      console.log('Calling Ollama API for closing message...');
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 150
        }
      }, {
        timeout: 30000
      });
      console.log('Ollama response received');

      return response.data.response.trim();
    } catch (error) {
      console.error('❌ Error generating closing:', error.message);
      return `Thank you for your time today, ${session.candidateName}. We really enjoyed learning about your experience and skills. We'll be in touch soon with next steps. Have a great day!`;
    }
  }

  // Get session
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  // Analyze code with execution results (hybrid approach)
  async analyzeCodeWithResults(code, language, explanation, problemData, executionResults) {
    console.log('🤖 Generating AI code review with execution results...');
    
    // Build test summary
    const testSummary = executionResults.allPassed 
      ? `Excellent! All ${executionResults.totalTests} test cases passed successfully.`
      : `${executionResults.passed} out of ${executionResults.totalTests} test cases passed.`;
    
    // Get failed test details
    const failedTests = executionResults.results
      .filter(r => !r.passed)
      .map(r => `  - Test ${r.testNumber}: Input: ${JSON.stringify(r.input)}, Expected: ${r.expected}, Got: ${r.actual || 'Error'}`)
      .join('\n');

    // Calculate performance metrics
    const avgTime = this.calculateAvgTime(executionResults.results);
    const avgMemory = this.calculateAvgMemory(executionResults.results);

    const prompt = `You are a professional technical interviewer reviewing a candidate's code submission.

Problem: ${problemData.title}
Description: ${problemData.question}

Programming Language: ${language}
Candidate's explanation: "${explanation || 'No explanation provided'}"

Code submitted:
\`\`\`${language}
${code}
\`\`\`

Execution Results:
${testSummary}
${failedTests ? `\nFailed tests:\n${failedTests}` : ''}

Performance Metrics:
- Average execution time: ${avgTime}
- Average memory usage: ${avgMemory}

Provide a comprehensive but conversational code review (4-5 sentences):

1. Start by commenting on the test results (praise if all passed, or gently point out issues if some failed)
2. Analyze the time and space complexity based on the code structure
3. Highlight one or two strengths in their approach or code quality
4. If applicable, suggest one improvement (code quality, edge cases, or optimization)
5. End with an encouraging note

IMPORTANT: Speak DIRECTLY to the candidate in a natural, conversational tone. DO NOT include:
- "Here's my review"
- Meta-commentary
- Text in brackets
- Formal report structure

Just speak naturally as if you're talking to them in person.

Your review:`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.75,
          num_predict: 250,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      }, {
        timeout: 30000
      });

      const review = this.cleanResponse(response.data.response);
      console.log('✅ AI code review generated');
      return review;
      
    } catch (error) {
      console.error('❌ Error generating code review:', error.message);
      // Fallback review based on test results
      if (executionResults.allPassed) {
        return `Excellent work! All ${executionResults.totalTests} test cases passed successfully. Your solution demonstrates good problem-solving skills and handles the requirements well. The code is clean and achieves the desired outcome. Great job!`;
      } else {
        return `Thank you for your solution. ${testSummary} I can see you've put thought into this approach. There are a few edge cases that need attention, but your overall logic is on the right track. With some refinement, this could be a solid solution.`;
      }
    }
  }

  // Fallback: Analyze code without execution (if Judge0 fails)
  async analyzeCodeOnly(code, language, explanation, problemData) {
    console.log('🤖 Generating AI code review (without execution)...');
    
    const prompt = `You are a professional technical interviewer reviewing a candidate's code submission.

Problem: ${problemData.title}
Description: ${problemData.question}

Programming Language: ${language}
Candidate's explanation: "${explanation || 'No explanation provided'}"

Code submitted:
\`\`\`${language}
${code}
\`\`\`

Note: Code execution was not available, so provide a review based on code analysis only.

Provide a brief, constructive code review (3-4 sentences):

1. Assess if the approach seems correct for the problem
2. Estimate time and space complexity
3. Comment on code quality and structure
4. Suggest one improvement if applicable

Speak directly to the candidate in a conversational, encouraging tone.

Your review:`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.75,
          num_predict: 200,
          top_p: 0.9
        }
      }, {
        timeout: 30000
      });

      const review = this.cleanResponse(response.data.response);
      console.log('✅ AI code review generated');
      return review;
      
    } catch (error) {
      console.error('❌ Error generating code review:', error.message);
      return `Thank you for walking me through your code. I can see you've put thought into the solution. Your approach demonstrates good problem-solving skills. Let's wrap up the interview now.`;
    }
  }

  // Calculate average execution time
  calculateAvgTime(results) {
    const times = results.filter(r => r.executionTime !== null).map(r => r.executionTime);
    if (times.length === 0) return 'N/A';
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `${avg.toFixed(2)}ms`;
  }

  // Calculate average memory usage
  calculateAvgMemory(results) {
    const memory = results.filter(r => r.memory !== null).map(r => r.memory);
    if (memory.length === 0) return 'N/A';
    const avg = Math.round(memory.reduce((a, b) => a + b, 0) / memory.length);
    return `${avg}KB`;
  }

  // End interview
  endInterview(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      console.log(`🏁 Interview ended: ${sessionId}`);
    }
    return session;
  }
}

module.exports = SimpleInterviewService;
