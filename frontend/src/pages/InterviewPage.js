import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, Grid, Chip, Stack, Avatar, Switch, FormControlLabel, Tooltip, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import StopIcon from '@mui/icons-material/Stop';
import CallEndIcon from '@mui/icons-material/CallEnd';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import SettingsIcon from '@mui/icons-material/Settings';
import Editor from '@monaco-editor/react';
import Webcam from 'react-webcam';
import { useInterview } from '../context/InterviewContext';
import speechService from '../services/speechService';

function InterviewPage() {
  // UI stage: intro -> setup -> session
  const [stage, setStage] = useState('intro');
  const [selectedTrack, setSelectedTrack] = useState(''); // 'frontend' | 'backend'
  const [selectedRole, setSelectedRole] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // null | 'code'
  const [callSeconds, setCallSeconds] = useState(0);
  const [code, setCode] = useState('// Write your code here\nfunction solution() {\n  // Your solution\n}');
  const [language, setLanguage] = useState('javascript');
  const [cameraOn, setCameraOn] = useState(true);
  const [allowEditAlways, setAllowEditAlways] = useState(true);
  const [questionSpoken, setQuestionSpoken] = useState(false); // Track if current question has been spoken
  const [transcript, setTranscript] = useState(''); // User's spoken answer
  const [interimTranscript, setInterimTranscript] = useState(''); // Interim speech results
  const [aiSpeaking, setAiSpeaking] = useState(false); // Track if AI is currently speaking
  const webcamRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'swift', label: 'Swift' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'xml', label: 'XML' },
    { value: 'sql', label: 'SQL' },
    { value: 'shell', label: 'Shell' },
  ];
  const monacoLanguageMap = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    csharp: 'csharp',
    go: 'go',
    ruby: 'ruby',
    php: 'php',
    kotlin: 'kotlin',
    swift: 'swift',
    rust: 'rust',
    html: 'html',
    css: 'css',
    json: 'json',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    shell: 'shell',
  };
  const codeTemplates = {
    javascript: `// JavaScript
function solution(input) {
  // TODO: implement
  return input;
}
console.log(solution('hello'));
`,
    typescript: `// TypeScript
function solution(input: string): string {
  // TODO: implement
  return input;
}
console.log(solution('hello'));
`,
    python: `# Python
def solution(x):
    # TODO: implement
    return x

print(solution('hello'))
`,
    java: `// Java
public class Main {
  public static void main(String[] args) {
    System.out.println(solution("hello"));
  }
  static String solution(String s) {
    // TODO: implement
    return s;
  }
}
`,
    c: `// C
#include <stdio.h>

int main() {
  printf("hello\n");
  return 0;
}
`,
    cpp: `// C++
#include <bits/stdc++.h>
using namespace std;

int main(){
  cout << "hello" << endl;
  return 0;
}
`,
    csharp: `// C#
using System;
class Program {
  static void Main() {
    Console.WriteLine(Solution("hello"));
  }
  static string Solution(string s) {
    // TODO
    return s;
  }
}
`,
    go: `// Go
package main
import "fmt"

func solution(s string) string { return s }

func main(){
  fmt.Println(solution("hello"))
}
`,
    ruby: `# Ruby
def solution(s)
  s
end
puts solution('hello')
`,
    php: `<?php
function solution($s){
  return $s;
}
echo solution('hello');
`,
    kotlin: `// Kotlin
fun solution(s: String): String = s
fun main() { println(solution("hello")) }
`,
    swift: `// Swift
func solution(_ s: String) -> String { s }
print(solution("hello"))
`,
    rust: `// Rust
fn solution(s: &str) -> &str { s }
fn main(){ println!("{}", solution("hello")); }
`,
    html: `<!-- HTML -->
<!doctype html>
<html><head><meta charset="utf-8"><title>Interview</title></head>
<body>
  <h1>Hello</h1>
</body></html>
`,
    css: `/* CSS */
body { font-family: system-ui; }
`,
    json: `{
  "message": "hello"
}
`,
    yaml: `message: hello
`,
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<root><message>hello</message></root>
`,
    sql: `-- SQL
SELECT 'hello' AS message;
`,
    shell: `#!/usr/bin/env bash
echo "hello"
`,
  };
  const monacoTheme = muiTheme.palette.mode === 'light' ? 'vs-light' : 'vs-dark';
  const editorLanguage = monacoLanguageMap[language] || 'plaintext';
  const rolesByTrack = {
    frontend: [
      'Frontend Engineer (React)',
      'Frontend Engineer (Vue)',
      'Frontend Engineer (Angular)',
      'UI Engineer',
      'Web Performance Engineer',
      'Accessibility Engineer',
      'Frontend Architect',
      'Mobile Web Engineer',
      'Design Systems Engineer',
      'Full-Stack Engineer (Frontend)'
    ],
    backend: [
      'Backend Engineer (Node.js)',
      'Backend Engineer (Python/Django)',
      'Backend Engineer (Java/Spring)',
      'Backend Engineer (Go)',
      'Backend Engineer (C#/.NET)',
      'Distributed Systems Engineer',
      'Platform Engineer',
      'API Engineer',
      'Database Engineer (SQL/NoSQL)',
      'Full-Stack Engineer (Backend)'
    ],
  };
  const {
    isInterviewActive,
    currentQuestion,
    currentType,
    questions,
    ttsUrl,
    startInterview,
    submitAnswer,
    proceedToNextQuestion,
    updateCode,
    results,
    aiResponding,
    aiFeedback,
    pendingQuestionType,
  } = useInterview();

  const handleRunCode = () => {
    // In a real app, this would send the code to Judge0 API
    console.log('Running code:', code);
  };

  const handleEndInterview = () => {
    navigate('/results');
  };

  // Toggle microphone and speech recognition
  const toggleMicrophone = () => {
    if (isListening) {
      // Stop listening and submit answer
      speechService.stopListening();
      setIsListening(false);
      
      // Submit the transcript as answer if it's not empty
      if (transcript.trim()) {
        console.log('Submitting voice answer:', transcript);
        submitAnswer({ type: 'voice', text: transcript });
        setTranscript('');
        setInterimTranscript('');
      }
    } else {
      // Start listening
      setTranscript('');
      setInterimTranscript('');
      
      // Set up speech recognition callbacks
      speechService.onResultCallback = (result) => {
        if (result.final) {
          setTranscript(prev => prev + ' ' + result.final);
        }
        if (result.interim) {
          setInterimTranscript(result.interim);
        }
      };
      
      speechService.onErrorCallback = (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      };
      
      const started = speechService.startListening();
      if (started) {
        setIsListening(true);
      }
    }
  };

  // Auto-proceed to next question after AI feedback
  useEffect(() => {
    if (aiResponding && aiFeedback) {
      console.log('AI giving feedback:', aiFeedback);
      setAiSpeaking(true);
      
      // Speak the AI feedback using speech service
      speechService.speak(aiFeedback, {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        onEnd: () => {
          console.log('Feedback speech completed, proceeding to next question');
          setAiSpeaking(false);
          setTimeout(() => {
            proceedToNextQuestion();
          }, 1000); // 1 second pause after feedback
        },
        onError: (error) => {
          console.error('Feedback speech error:', error);
          setAiSpeaking(false);
          setTimeout(() => {
            proceedToNextQuestion();
          }, 1000);
        }
      });
      
      // Fallback: proceed after 10 seconds if speech fails
      const fallbackTimer = setTimeout(() => {
        console.log('Feedback speech timeout, proceeding anyway');
        setAiSpeaking(false);
        proceedToNextQuestion();
      }, 10000);
      
      return () => {
        clearTimeout(fallbackTimer);
      };
    }
  }, [aiResponding, aiFeedback, proceedToNextQuestion]);

  // Speak the current question when it changes (only after feedback is complete)
  useEffect(() => {
    console.log('Speech effect triggered:', {
      isInterviewActive,
      currentQuestion,
      aiResponding,
      hasQuestions: questions.length > 0,
      hasCurrentQuestion: questions[currentQuestion] ? true : false
    });

    if (isInterviewActive && currentQuestion !== null && !aiResponding && questions[currentQuestion]) {
      const question = questions[currentQuestion];
      
      console.log('✅ All conditions met! Question ready to speak:', question.text);
      console.log('Speech service supported:', speechService.isSupported());
      console.log('Available voices:', speechService.getVoices().length);
      
      // Reset questionSpoken flag when question changes
      setQuestionSpoken(false);
      
      // Small delay to ensure clean transition
      const timer = setTimeout(() => {
        console.log('⏰ Timer fired! Now speaking question:', question.text);
        setAiSpeaking(true);
        
        speechService.speak(question.text, {
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0,
          onEnd: () => {
            console.log('✅ Question spoken, marking as complete');
            setAiSpeaking(false);
            setQuestionSpoken(true);
          },
          onError: (error) => {
            console.error('❌ Question speech error:', error);
            setAiSpeaking(false);
            setQuestionSpoken(true);
          }
        });
      }, 800); // Delay after feedback completes
      
      return () => {
        console.log('🧹 Cleanup: Clearing timer and stopping speech');
        clearTimeout(timer);
        // Don't stop speech on cleanup - let it finish naturally
        // speechService.stopSpeaking();
        // setAiSpeaking(false);
      };
    } else {
      console.log('❌ Conditions not met for speaking');
    }
  }, [isInterviewActive, currentQuestion, aiResponding, questions]);

  // When question type changes, auto-open the relevant tool
  // Only open IDE after AI feedback is complete AND question has been spoken
  useEffect(() => {
    if (isInterviewActive && currentType === 'coding' && !aiResponding && questionSpoken) {
      console.log('Opening IDE after coding question was spoken');
      setActiveTool('code');
    } else if (!aiResponding && currentType !== 'coding') {
      setActiveTool(null);
    }
    // During AI feedback or before question is spoken, keep IDE closed
  }, [isInterviewActive, currentType, aiResponding, questionSpoken]);

  // Simple call timer when in session
  useEffect(() => {
    if (stage !== 'session') return;
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [stage]);

  const formatTime = (total) => {
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmitCode = () => {
    if (!isInterviewActive) return;
    updateCode(currentQuestion, code);
    submitAnswer({ type: 'coding', language, code });
    // Close the IDE when submitting to show AI feedback
    setActiveTool(null);
  };

  const playQuestionAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // Navigate to results when interview completes
  useEffect(() => {
    if (!isInterviewActive && results) {
      navigate('/results');
    }
  }, [isInterviewActive, results, navigate]);

  // Initialize speech synthesis voices on mount
  useEffect(() => {
    // Force voice loading
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Voices loaded:', voices.length);
        if (voices.length > 0) {
          console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
        }
      };
      
      // Load voices immediately
      loadVoices();
      
      // Also listen for voiceschanged event (for Chrome)
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        speechService.stopListening();
      }
      speechService.stopSpeaking();
    };
  }, []);

  // Intro screen (formal, minimal)
  if (stage === 'intro') {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper
          sx={{
            p: 5,
            borderRadius: 4,
            textAlign: 'center',
            border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
            background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Technical Interview</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Prepare for a professional, voice-driven interview. You can be asked verbal or coding questions.
          </Typography>
          <Button size="large" variant="contained" onClick={() => setStage('setup')}>Start Interview</Button>
        </Paper>
      </Container>
    );
  }

  // Setup screen: track (frontend/backend) + roles under it
  if (stage === 'setup') {
    const roles = selectedTrack ? rolesByTrack[selectedTrack] : [];
    const backendDisabled = false; // Allow selection to preview roles
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
            background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)'
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Select your track</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose the area you want to practice. More tracks coming soon.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
            <Button
              variant={selectedTrack === 'frontend' ? 'contained' : 'outlined'}
              onClick={() => { setSelectedTrack('frontend'); setSelectedRole(''); }}
            >
              Frontend
            </Button>
            <Button
              variant={selectedTrack === 'backend' ? 'contained' : 'outlined'}
              disabled={backendDisabled}
              onClick={() => { setSelectedTrack('backend'); setSelectedRole(''); }}
            >
              Backend
            </Button>
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Select your role</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Pick a role to tailor the interview.</Typography>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {roles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role}>
                <Button
                  fullWidth
                  variant={selectedRole === role ? 'contained' : 'outlined'}
                  onClick={() => setSelectedRole(role)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontWeight: 600,
                    height: 56,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    borderRadius: 2,
                  }}
                >
                  {role}
                </Button>
              </Grid>
            ))}
            {!selectedTrack && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Select a track to see available roles.</Typography>
              </Grid>
            )}
          </Grid>

          <Box display="flex" justifyContent="space-between">
            <Button onClick={() => setStage('intro')}>Back</Button>
            <Button
              variant="contained"
              disabled={!selectedRole}
              onClick={() => {
                setStage('session');
                setCallSeconds(0);
                
                // Initialize speech synthesis with user interaction
                if (window.speechSynthesis) {
                  // Trigger voice loading
                  window.speechSynthesis.getVoices();
                  console.log('Speech synthesis initialized with user interaction');
                }
                
                if (!isInterviewActive) startInterview(selectedRole);
              }}
            >
              Start
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Top status bar */}
      <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}` }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Technical Interview</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Test Speech Button */}
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => {
              console.log('🧪 Test button clicked');
              speechService.speak('Hello, this is a test of the speech system.', {
                onEnd: () => console.log('✅ Test speech completed'),
                onError: (e) => console.error('❌ Test speech error:', e)
              });
            }}
          >
            Test Speech
          </Button>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption" color="text.secondary">Connected</Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatTime(callSeconds)}</Typography>
        </Box>
      </Paper>
      <Grid container spacing={3}>
        {/* Left pane - Candidate Video and Controls */}
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 2, 
              mb: 1.5, 
              height: '360px', 
              overflow: 'hidden',
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
              background: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)',
              backdropFilter: 'blur(4px)'
            }}
          >
            {cameraOn ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Avatar sx={{ width: 96, height: 96, bgcolor: 'grey.700' }}>You</Avatar>
              </Box>
            )}
          </Paper>
          <Typography variant="caption" color="text.secondary">Candidate</Typography>

          {/* Bottom call controls */}
          <Paper sx={{ p: 1, mt: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}` }}>
            <Tooltip title={isListening ? 'Stop & Submit Answer' : 'Start Speaking'}>
              <IconButton 
                size="small" 
                color={isListening ? 'error' : 'primary'} 
                onClick={toggleMicrophone}
                disabled={!isInterviewActive || currentType === 'coding' || aiResponding}
              >
                {isListening ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
            <IconButton size="small" color="inherit" onClick={() => setCameraOn(v => !v)}>
              {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <Box flexGrow={1} />
            <IconButton size="small" color="error">
              <CallEndIcon />
            </IconButton>
          </Paper>
        </Grid>

        {/* Right pane - AI Interviewer or Coding IDE */}
        <Grid item xs={12} md={6}>
          {!(isInterviewActive && activeTool === 'code') && (
            <>
              <Paper
                sx={{
                  p: 2,
                  mb: 1.5,
                  height: '360px',
                  overflow: 'hidden',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: (t) => `1px solid ${t.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
                  background: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)',
                  '& .ai-avatar': {
                    animation: aiResponding ? 'pulse 1.8s ease-in-out infinite' : 'none',
                  },
                  '@keyframes pulse': {
                    '0%': { boxShadow: (t) => `0 0 0 0 ${t.palette.primary.main}66` },
                    '70%': { boxShadow: (t) => `0 0 0 16px ${t.palette.primary.main}00` },
                    '100%': { boxShadow: (t) => `0 0 0 0 ${t.palette.primary.main}00` },
                  }
                }}
              >
                <Avatar className="ai-avatar" sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontWeight: 700, mb: 2 }}>AI</Avatar>
                
                {/* AI Speaking indicator */}
                {aiSpeaking && !aiResponding && (
                  <Box sx={{ textAlign: 'center', px: 3, maxWidth: '100%' }}>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                      🔊 AI is speaking...
                    </Typography>
                    {questions[currentQuestion] && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        "{questions[currentQuestion].text}"
                      </Typography>
                    )}
                  </Box>
                )}
                
                {/* AI Feedback */}
                {aiResponding && aiFeedback && (
                  <Box sx={{ textAlign: 'center', px: 3, maxWidth: '100%' }}>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                      {aiSpeaking ? '🔊 AI is speaking...' : '💬 AI Feedback'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      "{aiFeedback}"
                    </Typography>
                  </Box>
                )}
                
                {/* User Speaking */}
                {!aiResponding && !aiSpeaking && isListening && (
                  <Box sx={{ textAlign: 'center', px: 3, maxWidth: '100%', mt: 2 }}>
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                      🎤 Listening...
                    </Typography>
                    {(transcript || interimTranscript) && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {transcript} <span style={{ opacity: 0.6 }}>{interimTranscript}</span>
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
              <Typography variant="caption" color="text.secondary">Interviewer</Typography>
            </>
          )}

          {/* Code Editor and Output appear only for coding questions */}
          {isInterviewActive && activeTool === 'code' && (
            <>
              {/* Coding Question Display */}
              <Paper
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 3,
                  border: (theme) => `2px solid ${theme.palette.primary.main}`,
                  background: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(17,24,39,0.8)'
                }}
              >
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                  💻 Coding Challenge
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {questions[currentQuestion]?.text || 'Write your solution below'}
                </Typography>
              </Paper>

              {/* Code Editor */}
              <Paper
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: 3,
                  border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
                  background: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)'
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Code Editor</Typography>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <select
                      value={language}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (currentType === 'coding') {
                          const tpl = codeTemplates[next];
                          if (tpl) setCode(tpl);
                        }
                        setLanguage(next);
                      }}
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: '8px', 
                        border: '1px solid #64748b', 
                        background: 'transparent', 
                        color: 'inherit',
                        fontWeight: 500
                      }}
                      disabled={!isInterviewActive}
                    >
                      {languageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Box>
                </Box>

                <Box sx={{ height: '420px', border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`, borderRadius: '8px' }}>
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    theme={monacoTheme}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      wordWrap: 'on',
                    }}
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmitCode}
                    disabled={!isInterviewActive || currentType !== 'coding'}
                  >
                    Submit Code
                  </Button>
                </Box>
              </Paper>
              <Typography variant="caption" color="text.secondary">Coding IDE</Typography>

              <Paper 
                sx={{ 
                  p: 3,
                  borderRadius: 3,
                  border: (theme) => `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
                  background: (theme) => theme.palette.mode === 'light' ? '#0b1220' : '#0b1220'
                }}
              >
                <Typography variant="h6" gutterBottom>Output</Typography>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'transparent', 
                    color: '#a7f3d0', 
                    fontFamily: 'monospace',
                    minHeight: '100px',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    maxHeight: '200px'
                  }}
                >
                  $ Run your code to see the output here
                </Box>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default InterviewPage;
