/**
 * High-Quality Speech Service using Whisper
 * Replaces Web Speech API with Whisper for better accuracy
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const USE_WHISPER = process.env.REACT_APP_USE_WHISPER !== 'false'; // Default to true

class WhisperSpeechService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isSpeaking = false;
    this.synthesis = window.speechSynthesis;
    
    // Callbacks
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    
    // Recording state
    this.stream = null;
    this.silenceTimer = null;
    this.silenceThreshold = 3000; // 3 seconds of silence
    this.isProcessing = false;
  }

  async startListening() {
    if (this.isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      console.log('🎤 Starting Whisper recording...');
      console.log('⏱️ Recording will auto-stop after 30 seconds. Click mic button to stop earlier.');
      
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('🎤 Recording stopped, processing...');
        await this.processAudio();
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Auto-stop after 30 seconds to prevent infinite recording
      this.autoStopTimer = setTimeout(() => {
        if (this.isRecording) {
          console.log('⏱️ Auto-stopping recording after 30 seconds');
          this.stopListening();
        }
      }, 30000);

      if (this.onStartCallback) {
        this.onStartCallback();
      }

      console.log('✅ Whisper recording started - Click mic button again to stop');

    } catch (error) {
      console.error('Error starting recording:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  stopListening() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    console.log('⏹️ Stopping recording...');
    
    // Clear auto-stop timer
    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }
    
    this.mediaRecorder.stop();
    this.isRecording = false;

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.onEndCallback) {
      this.onEndCallback();
    }
  }

  async processAudio() {
    if (this.isProcessing || this.audioChunks.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log(`📦 Audio blob size: ${audioBlob.size} bytes`);

      // Convert to WAV if needed (Whisper prefers WAV)
      const wavBlob = await this.convertToWav(audioBlob);

      // Send to backend for transcription
      const formData = new FormData();
      formData.append('audio_file', wavBlob, 'audio.wav');

      console.log('📤 Sending audio to Whisper...');

      const response = await fetch(`${BACKEND_URL}/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.text) {
        console.log('✅ Whisper transcription:', result.text);

        if (this.onResultCallback) {
          this.onResultCallback({
            final: result.text,
            interim: '',
            isFinal: true,
            voiceMetrics: {
              duration: 0,
              wordCount: result.text.split(' ').length,
              avgConfidence: 0.95 // Whisper is highly accurate
            }
          });
        }
      } else {
        throw new Error(result.error || 'Transcription failed');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    } finally {
      this.isProcessing = false;
      this.audioChunks = [];
    }
  }

  async convertToWav(blob) {
    // For now, just return the blob
    // In production, you might want to convert webm to wav
    // using a library like lamejs or sending as-is if Whisper supports it
    return blob;
  }

  // Text-to-Speech (same as before, using browser TTS)
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!text || text.trim() === '') {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))
      ) || voices.find(v => v.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Speaking:', text.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('✅ Speech ended');
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (error) => {
        this.isSpeaking = false;
        console.warn('Speech synthesis error (non-critical):', error.error || error);
        // Don't reject - just resolve to continue flow
        if (options.onError) {
          options.onError(error);
        } else {
          // Silently continue if no error handler
          resolve();
        }
      };

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  // Event handlers
  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  isAvailable() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }

  isSupported() {
    return this.isAvailable() && window.speechSynthesis;
  }

  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
}

// Fallback to Web Speech API if Whisper not available
class WebSpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    
    this.initializeRecognition();
  }

  initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStartCallback) this.onStartCallback();
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (this.onResultCallback) {
          this.onResultCallback({
            final: finalTranscript,
            interim: interimTranscript,
            isFinal: finalTranscript.length > 0
          });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) this.onEndCallback();
      };

      this.recognition.onerror = (error) => {
        console.error('Speech recognition error:', error);
        if (this.onErrorCallback) this.onErrorCallback(error);
      };
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!text || text.trim() === '') {
        resolve();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        if (options.onEnd) options.onEnd();
        resolve();
      };
      utterance.onerror = (error) => {
        console.warn('Speech synthesis error (non-critical):', error.error || error);
        if (options.onError) {
          options.onError(error);
        } else {
          resolve(); // Continue flow even on error
        }
      };
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking() {
    this.synthesis.cancel();
  }

  onResult(callback) { this.onResultCallback = callback; }
  onError(callback) { this.onErrorCallback = callback; }
  onStart(callback) { this.onStartCallback = callback; }
  onEnd(callback) { this.onEndCallback = callback; }

  isAvailable() {
    return this.recognition !== null;
  }

  isSupported() {
    return this.recognition !== null && this.synthesis !== null;
  }

  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
}

// Export the appropriate service
const speechService = USE_WHISPER ? new WhisperSpeechService() : new WebSpeechService();

console.log(`🎤 Speech Service: ${USE_WHISPER ? 'Whisper (High Quality)' : 'Web Speech API'}`);

export default speechService;
