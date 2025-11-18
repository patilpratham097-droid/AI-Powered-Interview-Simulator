import ElevenLabsService from './elevenLabsService';

// Speech Recognition and Synthesis Service
class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    
    // Voice analysis tracking
    this.speechStartTime = null;
    this.speechEndTime = null;
    this.wordCount = 0;
    this.pauseStartTime = null;
    this.totalPauseDuration = 0;
    this.confidenceScores = [];
    
    // Use browser TTS only (ElevenLabs disabled)
    this.elevenLabs = null;
    this.useElevenLabs = false;
    console.log('Using browser TTS for speech synthesis');
    
    this.initializeRecognition();
  }

  initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configuration for optimal interview experience
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      // Event handlers with voice analysis
      this.recognition.onstart = () => {
        this.isListening = true;
        this.speechStartTime = Date.now();
        this.wordCount = 0;
        this.confidenceScores = [];
        this.totalPauseDuration = 0;
        if (this.onStartCallback) this.onStartCallback();
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence || 0.8;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            this.confidenceScores.push(confidence);
            this.wordCount += transcript.trim().split(/\s+/).length;
          } else {
            interimTranscript += transcript;
          }
        }

        if (this.onResultCallback) {
          this.onResultCallback({
            final: finalTranscript,
            interim: interimTranscript,
            isFinal: finalTranscript.length > 0,
            voiceMetrics: finalTranscript.length > 0 ? this.calculateVoiceMetrics() : null
          });
        }
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        this.speechEndTime = Date.now();
        if (this.onEndCallback) this.onEndCallback();
        if (this.onEnd) this.onEnd();
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        if (this.onError) this.onError(event.error);
      };
      
      this.recognition.onstart = () => {
        this.isListening = true;
      };
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        return true;
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        return false;
      }
    }
    return false;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Calculate voice metrics for analysis
  calculateVoiceMetrics() {
    const now = Date.now();
    const totalDuration = (now - this.speechStartTime) / 1000; // in seconds
    
    const metrics = {
      wordsPerMinute: this.wordCount > 0 ? Math.round((this.wordCount / totalDuration) * 60) : 0,
      confidence: this.confidenceScores.length > 0 ? 
        this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length : 0,
      pauseDuration: this.totalPauseDuration,
      clarity: this.confidenceScores.length > 0 ? 
        this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length : 0,
      totalDuration: totalDuration,
      wordCount: this.wordCount
    };
    
    return metrics;
  }

  async speak(text, options = {}) {
    console.log('Attempting to speak:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    if (!text) {
      console.error('Cannot speak - no text provided');
      if (options.onEnd) options.onEnd();
      return;
    }

    // Stop any ongoing speech
    this.stopSpeaking();

    // Check if browser supports speech synthesis
    if (!this.synthesis) {
      console.error('Browser speech synthesis not supported');
      if (options.onEnd) options.onEnd();
      return;
    }

    // Use browser TTS directly
    return this.speakWithBrowserTTS(text, options);
  }

  speakWithBrowserTTS(text, options = {}) {
    try {
      console.log('Using browser TTS');
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices
      const voices = this.synthesis.getVoices();
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      // Try to find a good voice
      const preferredVoices = voices.filter(voice => 
        voice.lang.startsWith('en-') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('us') ||
         voice.name.toLowerCase().includes('uk'))
      );
      
      if (preferredVoices.length > 0) {
        console.log('Using preferred voice:', preferredVoices[0].name);
        utterance.voice = preferredVoices[0];
      } else if (voices.length > 0) {
        console.log('Using default voice:', voices[0].name);
        utterance.voice = voices[0];
      }
      
      // Set voice properties
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log('Browser TTS started');
        this.isSpeaking = true;
        if (this.onStartCallback) this.onStartCallback();
      };
      
      utterance.onend = () => {
        console.log('Browser TTS ended');
        this.isSpeaking = false;
        if (this.onEndCallback) this.onEndCallback();
        if (options.onEnd) options.onEnd();
      };
      
      utterance.onerror = (event) => {
        console.error('Browser TTS error:', event);
        this.isSpeaking = false;
        if (this.onErrorCallback) this.onErrorCallback(event);
        if (options.onEnd) options.onEnd();
      };
      
      console.log('Starting browser speech synthesis...');
      this.synthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error in browser TTS:', error);
      this.isSpeaking = false;
      if (this.onErrorCallback) this.onErrorCallback(error);
      if (options.onEnd) options.onEnd();
    }
  }

  stopSpeaking() {
    // Stop any ongoing speech from both ElevenLabs and Web Speech API
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    // Stop any audio elements that might be playing from ElevenLabs
    const audioElements = document.getElementsByTagName('audio');
    for (let audio of audioElements) {
      audio.pause();
      audio.currentTime = 0;
    }
    
    this.isSpeaking = false;
  }

  isSupported() {
    return !!(this.recognition && this.synthesis);
  }

  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
}

export default SpeechService;
