const axios = require('axios');

class CodeExecutionService {
  constructor() {
    // Judge0 API configuration
    this.judge0Url = 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY;
    
    // Language ID mapping for Judge0
    this.languageIds = {
      'javascript': 63,
      'python': 71,
      'java': 62,
      'cpp': 54,
      'c': 50,
      'go': 60,
      'rust': 73,
      'typescript': 74
    };
  }

  /**
   * Execute code against multiple test cases
   */
  async executeCode(code, language, testCases) {
    console.log(`🔄 Executing ${language} code against ${testCases.length} test cases...`);
    
    if (!this.apiKey) {
      console.warn('⚠️ JUDGE0_API_KEY not found in environment variables');
      return null;
    }

    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      console.log(`   Test ${i + 1}/${testCases.length}...`);
      const result = await this.runSingleTest(code, language, testCases[i], i);
      results.push(result);
    }
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`✅ Execution complete: ${passed}/${testCases.length} passed`);
    
    return {
      totalTests: testCases.length,
      passed: passed,
      failed: failed,
      results: results,
      allPassed: results.every(r => r.passed)
    };
  }

  /**
   * Run code against a single test case
   */
  async runSingleTest(code, language, testCase, index) {
    try {
      const languageId = this.languageIds[language.toLowerCase()];
      
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Wrap code to handle input/output
      const wrappedCode = this.wrapCode(code, language, testCase.input);
      
      // Prepare submission
      const submission = {
        source_code: Buffer.from(wrappedCode).toString('base64'),
        language_id: languageId,
        stdin: testCase.input ? Buffer.from(testCase.input.toString()).toString('base64') : '',
        expected_output: Buffer.from(testCase.expected.toString()).toString('base64')
      };

      // Submit to Judge0 with wait=true to get immediate results
      const response = await axios.post(
        `${this.judge0Url}/submissions?base64_encoded=true&wait=true`,
        submission,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          },
          timeout: 10000
        }
      );

      const result = response.data;
      
      // Decode output
      const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '';
      const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '';
      const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : '';
      
      const actualOutput = stdout.trim();
      const expectedOutput = testCase.expected.toString().trim();
      const passed = actualOutput === expectedOutput && result.status.id === 3; // Status 3 = Accepted
      
      console.log(`      ${passed ? '✓' : '✗'} Test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed && stderr) {
        console.log(`        Error: ${stderr.substring(0, 100)}`);
      }
      
      return {
        testNumber: index + 1,
        input: testCase.input,
        expected: expectedOutput,
        actual: actualOutput,
        passed: passed,
        executionTime: result.time ? parseFloat(result.time) * 1000 : null, // Convert to ms
        memory: result.memory ? parseInt(result.memory) : null, // KB
        status: result.status.description,
        stderr: stderr,
        compileOutput: compileOutput
      };
      
    } catch (error) {
      console.error(`      ✗ Test ${index + 1}: ERROR - ${error.message}`);
      return {
        testNumber: index + 1,
        input: testCase.input,
        expected: testCase.expected,
        actual: null,
        passed: false,
        error: error.message,
        status: 'Error'
      };
    }
  }

  /**
   * Wrap user code to handle test input/output
   */
  wrapCode(code, language, input) {
    switch(language.toLowerCase()) {
      case 'javascript':
        // Assume user defines a function, we call it with input
        return `${code}\n\n// Test execution\nconst result = solution(${JSON.stringify(input)});\nconsole.log(JSON.stringify(result));`;
      
      case 'python':
        return `${code}\n\n# Test execution\nresult = solution(${this.pythonFormat(input)})\nprint(result)`;
      
      case 'java':
        // For Java, assume a Solution class with a method
        return `${code}\n\npublic class Main {\n  public static void main(String[] args) {\n    Solution sol = new Solution();\n    System.out.println(sol.solution(${this.javaFormat(input)}));\n  }\n}`;
      
      case 'cpp':
      case 'c':
        return `${code}\n\nint main() {\n  // Test execution\n  return 0;\n}`;
      
      default:
        return code;
    }
  }

  /**
   * Format input for Python
   */
  pythonFormat(input) {
    if (Array.isArray(input)) {
      return JSON.stringify(input);
    }
    if (typeof input === 'string') {
      return `"${input}"`;
    }
    return input;
  }

  /**
   * Format input for Java
   */
  javaFormat(input) {
    if (Array.isArray(input)) {
      return `new int[]{${input.join(',')}}`;
    }
    if (typeof input === 'string') {
      return `"${input}"`;
    }
    return input;
  }
}

module.exports = CodeExecutionService;
