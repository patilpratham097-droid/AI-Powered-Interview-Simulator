/**
 * Judge0 Service
 * Handles code execution and testing using Judge0 API
 */

const axios = require('axios');

class Judge0Service {
  constructor() {
    // Judge0 CE (Community Edition) - Free API
    this.apiUrl = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY || '';
    this.apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
    
    // Language IDs for Judge0
    this.languageIds = {
      javascript: 63,  // Node.js
      python: 71,      // Python 3
      java: 62,        // Java
      cpp: 54,         // C++ (GCC 9.2.0)
      c: 50,           // C (GCC 9.2.0)
      typescript: 74,  // TypeScript
      go: 60,          // Go
      rust: 73,        // Rust
      ruby: 72,        // Ruby
      php: 68,         // PHP
      csharp: 51       // C#
    };
  }

  /**
   * Execute code with test cases
   */
  async executeCode(code, language, testCases = []) {
    const languageId = this.languageIds[language.toLowerCase()];
    
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      // If no test cases, just run the code
      if (!testCases || testCases.length === 0) {
        return await this.runSingleExecution(code, languageId, '');
      }

      // Run code with each test case
      const results = [];
      for (const testCase of testCases) {
        const result = await this.runSingleExecution(
          code, 
          languageId, 
          testCase.input || ''
        );
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expected,
          actualOutput: result.stdout?.trim() || '',
          passed: this.compareOutputs(result.stdout?.trim(), testCase.expected),
          executionTime: result.time,
          memory: result.memory,
          status: result.status.description,
          error: result.stderr || result.compile_output || null
        });
      }

      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;

      return {
        success: passedCount === totalCount,
        passedTests: passedCount,
        totalTests: totalCount,
        results: results,
        allPassed: passedCount === totalCount
      };

    } catch (error) {
      console.error('Judge0 execution error:', error);
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  /**
   * Run a single code execution
   */
  async runSingleExecution(code, languageId, stdin = '') {
    try {
      // Prepare headers based on whether using RapidAPI or self-hosted
      const headers = this.apiKey ? {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost
      } : {
        'Content-Type': 'application/json'
      };

      // Step 1: Submit code for execution
      const submissionResponse = await axios.post(
        `${this.apiUrl}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: code,
          language_id: languageId,
          stdin: stdin,
          cpu_time_limit: 5,
          memory_limit: 128000
        },
        { headers }
      );

      const token = submissionResponse.data.token;

      // Step 2: Get execution result
      const resultResponse = await axios.get(
        `${this.apiUrl}/submissions/${token}?base64_encoded=false`,
        { headers }
      );

      return resultResponse.data;

    } catch (error) {
      if (error.response) {
        throw new Error(`Judge0 API error: ${error.response.data.message || error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Compare expected and actual outputs
   */
  compareOutputs(actual, expected) {
    if (!actual && !expected) return true;
    if (!actual || !expected) return false;

    // Normalize outputs
    const normalizeOutput = (str) => {
      return str
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\s+/g, ' ')
        .toLowerCase();
    };

    const normalizedActual = normalizeOutput(actual);
    const normalizedExpected = normalizeOutput(expected);

    // Try exact match first
    if (normalizedActual === normalizedExpected) return true;

    // Try JSON comparison for array/object outputs
    try {
      const actualJson = JSON.parse(actual);
      const expectedJson = JSON.parse(expected);
      return JSON.stringify(actualJson) === JSON.stringify(expectedJson);
    } catch (e) {
      // Not JSON, continue with string comparison
    }

    return normalizedActual === normalizedExpected;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languageIds);
  }

  /**
   * Validate code syntax (basic check)
   */
  async validateSyntax(code, language) {
    const languageId = this.languageIds[language.toLowerCase()];
    
    if (!languageId) {
      return { valid: false, error: 'Unsupported language' };
    }

    try {
      const result = await this.runSingleExecution(code, languageId, '');
      
      if (result.status.id === 6) { // Compilation Error
        return {
          valid: false,
          error: result.compile_output || 'Compilation error'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Execute code with custom input
   */
  async runWithInput(code, language, input = '') {
    const languageId = this.languageIds[language.toLowerCase()];
    
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      const result = await this.runSingleExecution(code, languageId, input);
      
      return {
        output: result.stdout || '',
        error: result.stderr || result.compile_output || null,
        status: result.status.description,
        executionTime: result.time,
        memory: result.memory
      };
    } catch (error) {
      throw new Error(`Execution failed: ${error.message}`);
    }
  }
}

module.exports = Judge0Service;
