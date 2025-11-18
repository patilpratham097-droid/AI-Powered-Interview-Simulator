import React from 'react';
import { Box, Button, Container, Grid, Paper, Typography, useTheme, Stack, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { keyframes } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import CodeIcon from '@mui/icons-material/Code';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TerminalIcon from '@mui/icons-material/Terminal';
import InsightsIcon from '@mui/icons-material/Insights';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
 

const features = [
  {
    icon: <MicIcon fontSize="large" color="primary" />,
    title: 'Voice-Driven Interaction',
    description: 'Natural conversation with AI interviewer using advanced speech recognition and synthesis.'
  },
  {
    icon: <CodeIcon fontSize="large" color="primary" />,
    title: 'Real-time Coding',
    description: 'Integrated code editor with syntax highlighting and execution powered by Judge0.'
  },
  {
    icon: <AssessmentIcon fontSize="large" color="primary" />,
    title: 'Detailed Feedback',
    description: 'Comprehensive performance analysis with actionable insights.'
  }
];

function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const floatSlow = keyframes`
    0% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(3%, -4%, 0) scale(1.05); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
  `;

  const floatAlt = keyframes`
    0% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(-4%, 3%, 0) scale(1.03); }
    100% { transform: translate3d(0, 0, 0) scale(1); }
  `;

  const hueShift = keyframes`
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  `;

  const shimmer = keyframes`
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  `;

  const [parallax, setParallax] = React.useState({ x: 0, y: 0 });

  const handleHeroMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x, y });
  };

  const blink = keyframes`
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  `;

  const TypewriterObjective = () => {
    const fullText = 'Our objective: Help you practice realistic, voice-driven technical interviews with live coding and instant, actionable feedback — improve faster, gain confidence, and ace your next interview.';
    const [text, setText] = React.useState('');
    const [phase, setPhase] = React.useState('delay'); // delay -> typing -> hold -> reset

    React.useEffect(() => {
      let timeoutId = 0;
      let intervalId = 0;

      if (phase === 'delay') {
        timeoutId = window.setTimeout(() => setPhase('typing'), 2000);
      }

      if (phase === 'typing') {
        let i = 0;
        intervalId = window.setInterval(() => {
          i += 1;
          setText(fullText.slice(0, i));
          if (i >= fullText.length) {
            window.clearInterval(intervalId);
            setPhase('hold');
          }
        }, 22); // ~45 chars/sec, readable
      }

      if (phase === 'hold') {
        timeoutId = window.setTimeout(() => {
          setText('');
          setPhase('typing');
        }, 3000);
      }

      return () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        if (intervalId) window.clearInterval(intervalId);
      };
    }, [phase]);

    return (
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
          background: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.6)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          textAlign: 'center'
        }}
      >
        <Typography component="span" sx={{ fontWeight: 600 }}>
          {text}
        </Typography>
        <Box component="span" sx={{ display: 'inline-block', width: 8, ml: 0.5, backgroundColor: 'currentColor', height: '1em', verticalAlign: 'text-bottom', animation: `${blink} 1s steps(2, jump-none) infinite` }} />
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          mt: { xs: 4, md: 8 },
          mb: { xs: 6, md: 10 },
          p: { xs: 2, md: 4 },
          textAlign: 'center',
          borderRadius: 4,
          background: `linear-gradient(135deg, ${theme.palette.mode === 'light' ? '#eef2ff' : '#0b1220'} 0%, ${theme.palette.mode === 'light' ? '#f8fafc' : '#111827'} 100%)`,
          boxShadow: theme.palette.mode === 'light' ? 'inset 0 1px 0 rgba(255,255,255,0.6)' : 'inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseMove={handleHeroMouseMove}
      >
        {/* OpenAI-like animated background layers */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: theme.palette.mode === 'light' ? 0.6 : 0.35,
            pointerEvents: 'none',
            backgroundImage: `
              radial-gradient(40% 60% at 20% 10%, ${theme.palette.primary.main}33, transparent 60%),
              radial-gradient(50% 70% at 80% 30%, ${theme.palette.secondary.main}33, transparent 60%),
              radial-gradient(60% 50% at 50% 90%, ${theme.palette.success.main || '#22c55e'}33, transparent 60%)
            `,
            filter: 'blur(30px)',
            animation: `${hueShift} 30s linear infinite`
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50%',
            height: '80%',
            background: `radial-gradient(closest-side, ${theme.palette.primary.main}22, transparent)`,
            filter: 'blur(20px)',
            animation: `${floatSlow} 16s ease-in-out infinite`,
            transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0)`
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: '-15%',
            right: '-10%',
            width: '45%',
            height: '70%',
            background: `radial-gradient(closest-side, ${theme.palette.secondary.main}22, transparent)`,
            filter: 'blur(22px)',
            animation: `${floatAlt} 18s ease-in-out infinite`,
            transform: `translate3d(${parallax.x * -10}px, ${parallax.y * -10}px, 0)`
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(0deg, ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'} 1px, transparent 1px),
              linear-gradient(90deg, ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'} 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
            opacity: 0.5
          }}
        />

        {/* Foreground content */}
        <Typography
          component="h1"
          variant="h2"
          sx={{
            fontWeight: 800,
            mb: 2,
            lineHeight: 1.1,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundSize: '200% 200%',
            animation: `${shimmer} 12s ease-in-out infinite`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI-Powered Interview Simulator
        </Typography>

        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: 900, mx: 'auto' }}>
          Practice realistic, voice-driven technical interviews with live coding and instant, insightful feedback.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.05rem',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[10]
              },
              '&:active': { transform: 'translateY(0)' }
            }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.05rem',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[6],
                backgroundColor: theme.palette.action.hover
              },
              '&:active': { transform: 'translateY(0)' }
            }}
          >
            Log In
          </Button>
        </Stack>
      </Box>

      {/* Objective typewriter animation */}
      <TypewriterObjective />

      {/* Features */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 3,
                border: `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
                background: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(17,24,39,0.7)',
                backdropFilter: 'blur(4px)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: theme.shadows[6],
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Box sx={{ mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h5" component="h3" gutterBottom>
                {feature.title}
              </Typography>
              <Typography color="text.secondary" textAlign="center">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* How it works */}
      <Box sx={{ mt: { xs: 6, md: 10 } }}>
        <Divider sx={{ mb: 4 }} />
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>
          How it works
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}` }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ mt: 0.5 }}>
                  <RecordVoiceOverIcon color="primary" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>1. Speak naturally</Typography>
                  <Typography color="text.secondary">The AI asks questions and listens to your answers in real-time.</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}` }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ mt: 0.5 }}>
                  <TerminalIcon color="primary" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>2. Code your solution</Typography>
                  <Typography color="text.secondary">Use the built-in editor to implement solutions as you explain.</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}` }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ mt: 0.5 }}>
                  <InsightsIcon color="primary" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>3. Review feedback</Typography>
                  <Typography color="text.secondary">Get instant strengths, gaps, and next steps to improve faster.</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* FAQ */}
      <Box sx={{ mt: { xs: 6, md: 10 } }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700, textAlign: 'center', mb: 3 }}>
          FAQ
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} sx={{ mx: 'auto' }}>
            {[
              { q: 'Is this free to use?', a: 'Yes, the demo is free. More features are coming soon.' },
              { q: 'Do I need a microphone?', a: 'It works best with a mic for voice Q&A, but you can type too.' },
              { q: 'What topics are covered?', a: 'Core DS&A, system design basics, and common behavioral prompts.' },
            ].map((f, i) => (
              <Accordion key={i} sx={{ borderRadius: 2, mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>{f.q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{f.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      </Box>

      {/* Footer CTA */}
      <Box sx={{ mt: { xs: 6, md: 10 }, mb: { xs: 2, md: 4 } }}>
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            borderRadius: 3,
            border: `1px solid ${theme.palette.mode === 'light' ? '#e5e7eb' : '#1f2937'}`,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Ready to level up your interviews?</Typography>
            <Typography color="text.secondary">Create an account or log in to get started.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" size="large" onClick={() => navigate('/signup')}>Get Started</Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}>Log In</Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}

export default HomePage;
