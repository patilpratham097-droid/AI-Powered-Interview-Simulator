import React, { createContext, useState, useContext } from 'react';

const InterviewContext = createContext();

export function useInterview() {
  return useContext(InterviewContext);
}

export function InterviewProvider({ children }) {
  const [interviewState, setInterviewState] = useState({
    isInterviewActive: false,
    currentQuestion: null,
    currentType: null, // 'voice' | 'coding'
    ttsUrl: null, // URL to AI question audio (Coqui output)
    selectedRole: null, // user-selected role for tailoring
    questions: [],
    answers: [],
    code: {},
    isRecording: false,
    isProcessing: false,
    results: null,
    aiResponding: false, // AI is giving feedback before next question
    aiFeedback: null, // Current AI feedback message
    pendingQuestionIndex: null, // Next question index (used during AI feedback)
    pendingQuestionType: null, // Next question type (used during AI feedback)
  });

  const getQuestionsForRole = (role) => {
    const common = [
      { type: 'voice', text: `Briefly introduce yourself and your experience relevant to the ${role} role.`, ttsUrl: null },
    ];
    switch (role) {
      case 'Data Scientist':
        return [
          ...common,
          { type: 'voice', text: 'Explain bias-variance tradeoff with an example.', ttsUrl: null },
          { type: 'voice', text: 'How do you handle data leakage in your models?', ttsUrl: null },
          { type: 'voice', text: 'What evaluation metrics do you use for classification problems?', ttsUrl: null },
          { type: 'coding', text: 'Write a function to compute the mean squared error between predicted and actual values.', ttsUrl: null },
        ];
      case 'Machine Learning Engineer':
        return [
          ...common,
          { type: 'voice', text: 'Describe your approach to serving a real-time ML model.', ttsUrl: null },
          { type: 'voice', text: 'How do you monitor model drift in production?', ttsUrl: null },
          { type: 'voice', text: 'Explain the difference between batch and online learning.', ttsUrl: null },
          { type: 'coding', text: 'Implement a simple softmax function that takes an array of numbers.', ttsUrl: null },
        ];
      case 'Backend Developer':
        return [
          ...common,
          { type: 'voice', text: 'Explain database transactions and isolation levels.', ttsUrl: null },
          { type: 'voice', text: 'How would you design a REST API for a social media platform?', ttsUrl: null },
          { type: 'voice', text: 'Discuss strategies for scaling a high-traffic API.', ttsUrl: null },
          { type: 'coding', text: 'Implement an LRU cache with get and set operations in O(1) time.', ttsUrl: null },
        ];
      case 'Frontend Developer':
        return [
          ...common,
          { type: 'voice', text: 'How do you improve performance in a React application?', ttsUrl: null },
          { type: 'voice', text: 'Explain the virtual DOM and reconciliation in React.', ttsUrl: null },
          { type: 'voice', text: 'What are your strategies for managing state in large applications?', ttsUrl: null },
          { type: 'coding', text: 'Implement a debounce function that delays execution until after a specified wait time.', ttsUrl: null },
        ];
      case 'DevOps Engineer':
        return [
          ...common,
          { type: 'voice', text: 'Explain CI/CD and the key stages in your pipeline.', ttsUrl: null },
          { type: 'voice', text: 'How do you design observability for microservices?', ttsUrl: null },
          { type: 'voice', text: 'What is your approach to infrastructure as code?', ttsUrl: null },
          { type: 'coding', text: 'Write a basic Dockerfile for a Node.js application.', ttsUrl: null },
        ];
      case 'Cloud Engineer':
        return [
          ...common,
          { type: 'voice', text: 'Compare IAM roles vs policies in AWS or your preferred cloud provider.', ttsUrl: null },
          { type: 'voice', text: 'Discuss cost optimization strategies in the cloud.', ttsUrl: null },
          { type: 'voice', text: 'How do you ensure security in cloud deployments?', ttsUrl: null },
          { type: 'coding', text: 'Write a Terraform or CloudFormation snippet to provision an S3 bucket.', ttsUrl: null },
        ];
      case 'AI Researcher':
        return [
          ...common,
          { type: 'voice', text: 'What is the difference between empirical and structural risk minimization?', ttsUrl: null },
          { type: 'voice', text: 'How do you evaluate a new model beyond standard metrics?', ttsUrl: null },
          { type: 'voice', text: 'Explain the bias-variance tradeoff in machine learning.', ttsUrl: null },
          { type: 'coding', text: 'Implement gradient descent for simple linear regression.', ttsUrl: null },
        ];
      default: // Software Engineer or other
        return [
          ...common,
          { type: 'voice', text: 'Explain the difference between processes and threads.', ttsUrl: null },
          { type: 'voice', text: 'What are the key principles of object-oriented programming?', ttsUrl: null },
          { type: 'voice', text: 'Discuss trade-offs between monolith and microservices architecture.', ttsUrl: null },
          { type: 'coding', text: 'Given an array of integers and a target sum, return the indices of two numbers that add up to the target.', ttsUrl: null },
        ];
    }
  };

  const startInterview = (role) => {
    console.log('🎬 Starting interview for role:', role);
    const qs = getQuestionsForRole(role || 'Software Engineer');
    console.log('📝 Generated questions:', qs.length, 'questions');
    console.log('📝 First question:', qs[0]);
    
    // Use all questions including the coding one (exactly 5 questions)
    setInterviewState(prev => ({
      ...prev,
      isInterviewActive: true,
      selectedRole: role || 'Software Engineer',
      currentQuestion: 0,
      currentType: qs[0]?.type || 'voice',
      ttsUrl: qs[0]?.ttsUrl || null,
      questions: qs,
      answers: [],
      code: {},
      results: null,
      aiResponding: false, // Ensure AI is not responding at start
      aiFeedback: null,
    }));
    
    console.log('✅ Interview state updated');
  };

  const generateAIFeedback = (answer, questionType) => {
    // Generate contextual feedback based on answer type
    const feedbackOptions = {
      voice: [
        "Thank you for that explanation. That's a good perspective.",
        "I appreciate your detailed response. That makes sense.",
        "Interesting approach. I can see you've thought about this.",
        "Good answer. Your experience shows through.",
        "That's a solid explanation. Well articulated.",
      ],
      coding: [
        "Let me review your code... Okay, I see your approach here.",
        "Interesting solution. Let me note that down.",
        "I can see the logic you're following. Good work.",
        "Alright, I've reviewed your implementation.",
        "Thank you for walking me through your code.",
      ],
    };
    const options = feedbackOptions[questionType] || feedbackOptions.voice;
    return options[Math.floor(Math.random() * options.length)];
  };

  const submitAnswer = (answer) => {
    setInterviewState(prev => {
      const nextIndex = (prev.currentQuestion ?? -1) + 1;
      const nextQuestion = prev.questions[nextIndex];
      const feedback = generateAIFeedback(answer, prev.currentType);
      
      // Stop any ongoing speech recognition to prevent interruptions
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      return {
        ...prev,
        answers: [...prev.answers, answer],
        aiResponding: true,
        aiFeedback: feedback,
        isListening: false, // Ensure listening is stopped
        // Store next question info but don't activate it yet
        pendingQuestionIndex: nextIndex,
        pendingQuestionType: nextQuestion?.type || null,
      };
    });
  };

  const proceedToNextQuestion = () => {
    setInterviewState(prev => {
      const nextIndex = prev.pendingQuestionIndex ?? (prev.currentQuestion ?? -1) + 1;
      const reachedEnd = nextIndex >= prev.questions.length;
      if (reachedEnd) {
        // End interview and compute results (mock)
        const results = {
          overallScore: 7.8,
          role: prev.selectedRole,
          categories: [
            { name: 'Technical Knowledge', score: 8 },
            { name: 'Problem Solving', score: 7.5 },
            { name: 'Communication', score: 8.2 },
          ],
          feedback: [
            { type: 'positive', text: 'Clear communication and structured answers.' },
            { type: 'neutral', text: 'Consider deeper optimization discussion for coding tasks.' },
          ],
        };
        // Persist history locally
        try {
          const existing = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
          const entry = {
            id: `${Date.now()}`,
            completedAt: new Date().toISOString(),
            role: prev.selectedRole,
            results,
          };
          localStorage.setItem('interviewHistory', JSON.stringify([entry, ...existing]));
        } catch (e) {
          console.warn('Failed to save interview history', e);
        }
        return {
          ...prev,
          isInterviewActive: false,
          results,
          aiResponding: false,
          aiFeedback: null,
          pendingQuestionIndex: null,
          pendingQuestionType: null,
        };
      }
      const nextType = prev.questions[nextIndex]?.type ?? null;
      return ({
        ...prev,
        currentQuestion: nextIndex,
        currentType: nextType,
        ttsUrl: prev.questions[nextIndex]?.ttsUrl ?? null,
        aiResponding: false,
        aiFeedback: null,
        pendingQuestionIndex: null,
        pendingQuestionType: null,
      });
    });
  };

  const updateCode = (questionIndex, code) => {
    setInterviewState(prev => ({
      ...prev,
      code: {
        ...prev.code,
        [questionIndex]: code,
      },
    }));
  };

  const setTtsForCurrent = (url) => {
    setInterviewState(prev => ({ ...prev, ttsUrl: url }));
  };

  const endInterview = () => {
    // In a real app, this would send all answers to the backend for evaluation
    const results = {
      overallScore: 7.5,
      role: interviewState.selectedRole,
      categories: [
        { name: 'Technical Knowledge', score: 8 },
        { name: 'Problem Solving', score: 7 },
        { name: 'Code Quality', score: 6.5 },
        { name: 'Communication', score: 8.5 },
      ],
      feedback: [
        { type: 'positive', text: 'Strong understanding of JavaScript fundamentals' },
        { type: 'warning', text: 'Could improve time complexity in some solutions' },
      ],
    };
    try {
      const existing = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
      const entry = {
        id: `${Date.now()}`,
        completedAt: new Date().toISOString(),
        role: interviewState.selectedRole,
        results,
      };
      localStorage.setItem('interviewHistory', JSON.stringify([entry, ...existing]));
    } catch (e) {
      console.warn('Failed to save interview history', e);
    }
    setInterviewState(prev => ({
      ...prev,
      isInterviewActive: false,
      results,
    }));
  };

  const value = {
    ...interviewState,
    startInterview,
    submitAnswer,
    proceedToNextQuestion,
    updateCode,
    setTtsForCurrent,
    endInterview,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export default InterviewContext;
