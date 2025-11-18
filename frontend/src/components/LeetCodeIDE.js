import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Alert,
  TextField
} from '@mui/material';
import { PlayArrow, CheckCircle, Error } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useAIInterview } from '../context/AIInterviewContext';

const LeetCodeIDE = ({ problemData, onSubmit, onClose }) => {
  const { executeCode, testResults: contextTestResults, isExecutingCode } = useAIInterview();
  const [activeTab, setActiveTab] = useState(0);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'java', label: 'Java', extension: 'java' },
    { value: 'cpp', label: 'C++', extension: 'cpp' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' }
  ];

  // Default problem data if none provided
  const defaultProblem = {
    title: "Coding Challenge",
    difficulty: "Medium",
    description: "Solve the coding problem presented by the interviewer.",
    constraints: ["Follow best practices", "Optimize for readability"],
    examples: [
      {
        input: "Example input will be provided",
        output: "Expected output format",
        explanation: "Explanation of the solution approach"
      }
    ],
    testCases: [
      {
        input: "test input",
        expected: "expected output"
      }
    ],
    starterCode: {
      javascript: "function solution() {\n    // Your code here\n    return null;\n}",
      python: "def solution():\n    # Your code here\n    return None",
      java: "public class Solution {\n    public Object solution() {\n        // Your code here\n        return null;\n    }\n}",
      cpp: "#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    auto solution() {\n        // Your code here\n        return nullptr;\n    }\n};",
      typescript: "function solution(): any {\n    // Your code here\n    return null;\n}"
    }
  };

  // Normalize problem data to handle different field names
  const problem = problemData ? {
    title: problemData.title || defaultProblem.title,
    difficulty: problemData.difficulty || defaultProblem.difficulty,
    description: problemData.description || problemData.question || defaultProblem.description,
    constraints: problemData.constraints || defaultProblem.constraints,
    examples: problemData.examples || defaultProblem.examples,
    testCases: problemData.testCases || defaultProblem.testCases,
    starterCode: problemData.starterCode || defaultProblem.starterCode
  } : defaultProblem;

  // Initialize code only once when component mounts
  useEffect(() => {
    if (problem.starterCode && problem.starterCode[language]) {
      setCode(problem.starterCode[language]);
    } else {
      setCode(defaultProblem.starterCode[language]);
    }
  }, []); // Empty dependency array - only run once on mount

  // Handle language changes separately - only update if code is still default
  useEffect(() => {
    // Skip the initial mount
    if (code) {
      const newStarterCode = problem.starterCode?.[language] || defaultProblem.starterCode[language];
      // Only update if code hasn't been modified (still matches a starter template)
      const isDefaultCode = languageOptions.some(lang => 
        code === (problem.starterCode?.[lang.value] || defaultProblem.starterCode[lang.value])
      );
      if (isDefaultCode) {
        setCode(newStarterCode);
      }
    }
  }, [language]); // Only run when language changes

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'info';
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab(1); // Switch to Test Results tab
    
    try {
      console.log('💻 Running code with Judge0...');
      
      // Execute code with Judge0
      const testCases = problem.testCases || [];
      const result = await executeCode(code, language, testCases);
      
      if (result && result.results) {
        // Format results for display
        const formattedResults = result.results.map((r, index) => ({
          id: index + 1,
          input: r.input,
          expected: r.expectedOutput,
          actual: r.actualOutput,
          passed: r.passed,
          executionTime: r.executionTime,
          status: r.status
        }));
        
        setTestResults(formattedResults);
        console.log(`✅ Tests: ${result.passedTests}/${result.totalTests} passed`);
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults([{
        id: 1,
        input: 'Error',
        expected: 'N/A',
        actual: error.message,
        passed: false
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      code,
      language,
      explanation: explanation.trim(),
      testResults
    });
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      bgcolor: 'background.default',
      zIndex: 1300,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">{problem.title}</Typography>
            <Chip 
              label={problem.difficulty} 
              color={getDifficultyColor(problem.difficulty)}
              size="small"
            />
          </Box>
          <Button variant="outlined" onClick={onClose}>
            Close IDE
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Problem Description */}
        <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography variant="body1" paragraph>
              {problem.description}
            </Typography>

            {problem.examples && problem.examples.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Examples</Typography>
                {problem.examples.map((example, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Example {index + 1}:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                      <strong>Input:</strong> {example.input}
                      {'\n'}<strong>Output:</strong> {example.output}
                      {example.explanation && `\n\nExplanation: ${example.explanation}`}
                    </Typography>
                  </Paper>
                ))}
              </>
            )}

            {problem.constraints && problem.constraints.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Constraints</Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {problem.constraints.map((constraint, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {constraint}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Right Panel - Code Editor */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Editor Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  label="Language"
                >
                  {languageOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={!isRunning && !isExecutingCode && <PlayArrow />}
                  onClick={handleRunCode}
                  disabled={isRunning || isExecutingCode || !code.trim()}
                >
                  {isRunning || isExecutingCode ? 'Running Tests...' : 'Run Code'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!code.trim()}
                >
                  Submit Solution
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Code" />
              <Tab label="Test Results" />
              <Tab label="Explanation" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <TabPanel value={activeTab} index={0}>
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                {testResults.length === 0 ? (
                  <Alert severity="info">
                    Click "Run Code" to execute test cases and see results.
                  </Alert>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Test Results ({testResults.filter(r => r.passed).length}/{testResults.length} passed)
                    </Typography>
                    {testResults.map((result) => (
                      <Paper 
                        key={result.id} 
                        sx={{ 
                          p: 2, 
                          mb: 2,
                          borderLeft: 4,
                          borderColor: result.passed ? 'success.main' : 'error.main'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {result.passed ? (
                              <CheckCircle color="success" />
                            ) : (
                              <Error color="error" />
                            )}
                            <Typography variant="subtitle2">
                              Test Case {result.id} - {result.passed ? 'Passed' : 'Failed'}
                            </Typography>
                          </Box>
                          {result.executionTime && (
                            <Chip 
                              label={`${result.executionTime}s`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          Input: {result.input}
                          {'\n'}Expected: {result.expected}
                          {'\n'}Actual: {result.actual}
                          {result.status && `\nStatus: ${result.status}`}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Explain Your Approach
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain your solution approach, time complexity, space complexity, and any trade-offs you considered..."
                  variant="outlined"
                />
              </Box>
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LeetCodeIDE;
