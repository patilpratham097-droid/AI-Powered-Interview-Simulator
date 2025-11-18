/**
 * Report Generation Service
 * Creates comprehensive interview report cards with AI-powered feedback
 */

class ReportService {
  constructor(ollamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * Generate comprehensive interview report
   */
  async generateReport(session, codeResults = null) {
    const duration = this.calculateDuration(session.startTime, new Date());
    const performance = this.analyzePerformance(session, codeResults);
    const aiFeedback = await this.generateAIFeedback(session, performance);

    const report = {
      // Basic Info
      reportId: `REPORT-${Date.now()}`,
      candidateName: session.candidateName,
      role: session.roleInfo.name,
      date: new Date().toISOString(),
      duration: duration,

      // Performance Metrics
      overallScore: performance.overallScore,
      technicalScore: performance.technicalScore,
      codingScore: performance.codingScore,
      communicationScore: performance.communicationScore,

      // Detailed Breakdown
      questionsAsked: session.questionsAsked,
      questionsAnswered: session.conversationHistory.filter(m => m.role === 'candidate').length,
      codingChallengeCompleted: session.codingQuestionAsked || false,

      // Code Execution Results
      codeResults: codeResults ? {
        language: codeResults.language,
        passedTests: codeResults.passedTests || 0,
        totalTests: codeResults.totalTests || 0,
        executionTime: codeResults.executionTime,
        allPassed: codeResults.allPassed || false
      } : null,

      // AI-Generated Feedback
      feedback: aiFeedback,

      // Strengths & Improvements
      strengths: performance.strengths,
      improvements: performance.improvements,

      // Conversation Summary
      conversationHighlights: this.extractHighlights(session),

      // Recommendation
      recommendation: this.getRecommendation(performance.overallScore),
      
      // Raw Data (for detailed view)
      rawData: {
        conversationHistory: session.conversationHistory,
        stageResponses: session.stageResponses || {}
      }
    };

    return report;
  }

  /**
   * Calculate interview duration
   */
  calculateDuration(startTime, endTime) {
    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return {
      total: durationMs,
      minutes: minutes,
      seconds: seconds,
      formatted: `${minutes}m ${seconds}s`
    };
  }

  /**
   * Analyze candidate performance
   */
  analyzePerformance(session, codeResults) {
    // Technical Score (based on question responses)
    const technicalScore = this.calculateTechnicalScore(session);
    
    // Coding Score (based on test results)
    const codingScore = this.calculateCodingScore(codeResults);
    
    // Communication Score (based on response quality)
    const communicationScore = this.calculateCommunicationScore(session);
    
    // Overall Score (weighted average)
    const overallScore = Math.round(
      (technicalScore * 0.4) + 
      (codingScore * 0.4) + 
      (communicationScore * 0.2)
    );

    // Identify strengths and improvements
    const strengths = this.identifyStrengths(session, codeResults, {
      technicalScore,
      codingScore,
      communicationScore
    });

    const improvements = this.identifyImprovements(session, codeResults, {
      technicalScore,
      codingScore,
      communicationScore
    });

    return {
      overallScore,
      technicalScore,
      codingScore,
      communicationScore,
      strengths,
      improvements
    };
  }

  /**
   * Calculate technical knowledge score
   */
  calculateTechnicalScore(session) {
    const candidateResponses = session.conversationHistory.filter(m => m.role === 'candidate');
    
    if (candidateResponses.length === 0) return 0;

    let score = 70; // Base score

    // Bonus for completing all questions
    if (session.questionsAsked >= 3) score += 10;

    // Penalty for uncertainty
    if (session.lastCandidateUncertain) score -= 10;

    // Bonus for detailed responses (avg length > 50 chars)
    const avgLength = candidateResponses.reduce((sum, r) => sum + (r.message?.length || 0), 0) / candidateResponses.length;
    if (avgLength > 50) score += 10;
    if (avgLength > 100) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate coding score
   */
  calculateCodingScore(codeResults) {
    if (!codeResults) return 60; // Default if no coding challenge

    const { passedTests = 0, totalTests = 1, executionTime } = codeResults;
    
    let score = 0;

    // Base score from test results
    const testPassRate = (passedTests / totalTests) * 100;
    score += testPassRate * 0.7; // 70% weight on correctness

    // Bonus for all tests passing
    if (passedTests === totalTests) score += 20;

    // Bonus for efficient code (execution time < 1s)
    if (executionTime && parseFloat(executionTime) < 1.0) score += 10;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate communication score
   */
  calculateCommunicationScore(session) {
    const candidateResponses = session.conversationHistory.filter(m => m.role === 'candidate');
    
    if (candidateResponses.length === 0) return 0;

    let score = 75; // Base score

    // Check response clarity (not too short, not too long)
    const avgLength = candidateResponses.reduce((sum, r) => sum + (r.message?.length || 0), 0) / candidateResponses.length;
    
    if (avgLength > 30 && avgLength < 200) score += 15; // Good length
    if (avgLength < 20) score -= 10; // Too brief
    if (avgLength > 300) score -= 5; // Too verbose

    // Bonus for consistent responses
    if (candidateResponses.length >= 3) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Identify candidate strengths
   */
  identifyStrengths(session, codeResults, scores) {
    const strengths = [];

    if (scores.technicalScore >= 80) {
      strengths.push("Strong technical knowledge and understanding of core concepts");
    }

    if (scores.codingScore >= 80) {
      strengths.push("Excellent problem-solving and coding skills");
    }

    if (scores.communicationScore >= 80) {
      strengths.push("Clear and effective communication");
    }

    if (codeResults?.allPassed) {
      strengths.push("All test cases passed - demonstrates attention to detail");
    }

    if (session.questionsAsked >= 3) {
      strengths.push("Completed all interview questions");
    }

    const candidateResponses = session.conversationHistory.filter(m => m.role === 'candidate');
    const avgLength = candidateResponses.reduce((sum, r) => sum + (r.message?.length || 0), 0) / candidateResponses.length;
    
    if (avgLength > 100) {
      strengths.push("Provides detailed and thoughtful responses");
    }

    return strengths.length > 0 ? strengths : ["Shows potential and willingness to learn"];
  }

  /**
   * Identify areas for improvement
   */
  identifyImprovements(session, codeResults, scores) {
    const improvements = [];

    if (scores.technicalScore < 70) {
      improvements.push("Review fundamental concepts and technical knowledge");
    }

    if (scores.codingScore < 70) {
      improvements.push("Practice more coding problems and algorithm challenges");
    }

    if (scores.communicationScore < 70) {
      improvements.push("Work on articulating thoughts more clearly and concisely");
    }

    if (codeResults && !codeResults.allPassed) {
      improvements.push("Focus on edge cases and thorough testing of solutions");
    }

    if (session.lastCandidateUncertain) {
      improvements.push("Build confidence by practicing common interview questions");
    }

    const candidateResponses = session.conversationHistory.filter(m => m.role === 'candidate');
    const avgLength = candidateResponses.reduce((sum, r) => sum + (r.message?.length || 0), 0) / candidateResponses.length;
    
    if (avgLength < 30) {
      improvements.push("Provide more detailed explanations and examples");
    }

    return improvements.length > 0 ? improvements : ["Continue practicing to maintain strong performance"];
  }

  /**
   * Generate AI-powered feedback
   */
  async generateAIFeedback(session, performance) {
    const prompt = `You are an expert technical interviewer providing feedback for a ${session.roleInfo.name} interview.

Candidate: ${session.candidateName}
Duration: ${this.calculateDuration(session.startTime, new Date()).formatted}
Questions Asked: ${session.questionsAsked}
Overall Score: ${performance.overallScore}/100

Conversation Summary:
${session.conversationHistory.slice(-6).map(msg => 
  `${msg.role === 'candidate' ? 'Candidate' : 'Interviewer'}: ${msg.message?.substring(0, 100)}...`
).join('\n')}

Provide a professional, encouraging 3-4 sentence summary of the candidate's performance. 
Focus on:
1. Overall impression
2. One key strength
3. One area for growth
4. Encouragement

Be specific, constructive, and professional.`;

    try {
      const feedback = await this.ollamaService.generateResponse(prompt, {
        temperature: 0.7,
        max_tokens: 200
      });
      return feedback.trim();
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      return `${session.candidateName} demonstrated solid technical understanding during the interview. With a score of ${performance.overallScore}/100, they showed good potential. Continue practicing and refining your skills to excel in future interviews.`;
    }
  }

  /**
   * Extract conversation highlights
   */
  extractHighlights(session) {
    const highlights = [];
    const candidateResponses = session.conversationHistory.filter(m => m.role === 'candidate');

    if (candidateResponses.length > 0) {
      // First response
      highlights.push({
        stage: 'Introduction',
        response: candidateResponses[0].message?.substring(0, 150) + '...'
      });

      // Technical questions
      if (candidateResponses.length > 1) {
        highlights.push({
          stage: 'Technical Discussion',
          response: candidateResponses[Math.floor(candidateResponses.length / 2)].message?.substring(0, 150) + '...'
        });
      }

      // Last response
      if (candidateResponses.length > 2) {
        highlights.push({
          stage: 'Final Response',
          response: candidateResponses[candidateResponses.length - 1].message?.substring(0, 150) + '...'
        });
      }
    }

    return highlights;
  }

  /**
   * Get hiring recommendation
   */
  getRecommendation(overallScore) {
    if (overallScore >= 85) {
      return {
        decision: "Strongly Recommend",
        level: "excellent",
        message: "Exceptional candidate with strong technical skills and communication abilities."
      };
    } else if (overallScore >= 70) {
      return {
        decision: "Recommend",
        level: "good",
        message: "Solid candidate with good technical foundation and potential for growth."
      };
    } else if (overallScore >= 55) {
      return {
        decision: "Consider",
        level: "average",
        message: "Shows potential but may need additional training or experience."
      };
    } else {
      return {
        decision: "Not Recommended",
        level: "needs-improvement",
        message: "Candidate would benefit from more preparation and practice."
      };
    }
  }

  /**
   * Generate summary statistics
   */
  generateStatistics(reports) {
    if (!reports || reports.length === 0) {
      return {
        totalInterviews: 0,
        averageScore: 0,
        passRate: 0,
        averageDuration: 0
      };
    }

    const totalInterviews = reports.length;
    const averageScore = Math.round(
      reports.reduce((sum, r) => sum + r.overallScore, 0) / totalInterviews
    );
    const passRate = Math.round(
      (reports.filter(r => r.overallScore >= 70).length / totalInterviews) * 100
    );
    const averageDuration = Math.round(
      reports.reduce((sum, r) => sum + r.duration.minutes, 0) / totalInterviews
    );

    return {
      totalInterviews,
      averageScore,
      passRate,
      averageDuration
    };
  }
}

module.exports = ReportService;
