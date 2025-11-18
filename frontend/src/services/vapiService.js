/**
 * VAPI Service - Handles real-time voice conversations with VAPI voice agents
 * Replaces Web Speech API, TTS, and LLM processing with VAPI's unified solution
 */

class VAPIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_VAPI_API_KEY || '';
    this.agentId = process.env.REACT_APP_VAPI_AGENT_ID || '';
    this.baseUrl = 'https://api.vapi.ai';
    this.websocketUrl = 'wss://api.vapi.ai';
    
    this.call = null;
    this.websocket = null;
    this.isConnected = false;
    this.isCallActive = false;
    
    // Audio context for handling audio streams
    this.audioContext = null;
    this.audioWorkletNode = null;
    this.mediaStream = null;
    this.audioDestination = null;
    
    // Event callbacks
    this.onMessageCallback = null;
    this.onTranscriptCallback = null;
    this.onUserSpeechStartCallback = null;
    this.onUserSpeechEndCallback = null;
    this.onAssistantSpeechStartCallback = null;
    this.onAssistantSpeechEndCallback = null;
    this.onErrorCallback = null;
    this.onStatusUpdateCallback = null;
    
    // State tracking
    this.currentTranscript = '';
    this.interimTranscript = '';
    this.isUserSpeaking = false;
    this.isAssistantSpeaking = false;
  }

  /**
   * Initialize VAPI service
   */
  initialize(apiKey = null, agentId = null) {
    if (apiKey) this.apiKey = apiKey;
    if (agentId) this.agentId = agentId;
    
    if (!this.apiKey) {
      console.error('VAPI API key is required');
      return false;
    }
    
    if (!this.agentId) {
      console.error('VAPI Agent ID is required');
      return false;
    }
    
    return true;
  }

  /**
   * Start a call with the VAPI voice agent via backend
   * @param {Object} params - Call parameters (candidateName, role, agentId, etc.)
   */
  async startCall(params = {}) {
    try {
      console.log('🎙️ Starting VAPI call via backend...');
      
      // Request microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      this.mediaStream = stream;
      
      // Create call via backend API (backend handles VAPI API call)
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const callResponse = await fetch(`${backendUrl}/api/vapi/create-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: params.role || 'Software Engineer',
          candidateName: params.candidateName || 'Candidate',
          agentId: params.agentId || this.agentId || process.env.REACT_APP_VAPI_AGENT_ID,
          customVariables: params.customVariables || {}
        })
      });

      if (!callResponse.ok) {
        const error = await callResponse.json();
        throw new Error(error.error || 'Failed to create call');
      }

      const callData = await callResponse.json();
      this.call = {
        id: callData.callId,
        sessionId: callData.sessionId,
        ...callData.callData
      };
      
      console.log('✅ VAPI call created:', callData.callId);
      
      // If VAPI provides a WebSocket URL, connect to it
      // Otherwise, we'll receive updates via backend webhooks -> Socket.IO
      if (callData.websocketUrl) {
        await this.connectWebSocket(callData.callId, stream, callData.websocketUrl);
      } else {
        console.log('📡 Using backend webhooks for real-time updates');
        // Real-time updates will come via Socket.IO from backend webhooks
      }
      
      return this.call;
      
    } catch (error) {
      console.error('❌ Error starting VAPI call:', error);
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }
      throw error;
    }
  }

  /**
   * Connect to VAPI WebSocket for real-time audio streaming
   * Note: This may not be needed if using backend webhooks + Socket.IO
   */
  async connectWebSocket(callId, mediaStream, websocketUrl = null) {
    if (!websocketUrl) {
      console.log('No WebSocket URL provided, using backend webhooks instead');
      return;
    }
    return new Promise((resolve, reject) => {
      try {
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
        
        // Create WebSocket connection
        const wsUrl = `${this.websocketUrl}/call/${callId}/stream`;
        this.websocket = new WebSocket(wsUrl, [], {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        this.websocket.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.isCallActive = true;
          
          // Setup audio streaming
          this.setupAudioStreaming(mediaStream);
          
          if (this.onStatusUpdateCallback) {
            this.onStatusUpdateCallback({ status: 'connected', callId });
          }
          
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback(error);
          }
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('⚠️ WebSocket closed');
          this.isConnected = false;
          this.isCallActive = false;
          
          if (this.onStatusUpdateCallback) {
            this.onStatusUpdateCallback({ status: 'disconnected' });
          }
        };

      } catch (error) {
        console.error('❌ Error connecting WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup audio streaming (send user audio to VAPI, receive agent audio)
   */
  async setupAudioStreaming(mediaStream) {
    try {
      // Create MediaStreamAudioSourceNode for user's microphone
      const source = this.audioContext.createMediaStreamSource(mediaStream);
      
      // Create ScriptProcessorNode to process audio chunks
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!this.isConnected || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
          return;
        }
        
        // Get audio data
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array (PCM format)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp and convert to 16-bit integer
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Send audio data to VAPI
        if (this.websocket.readyState === WebSocket.OPEN) {
          this.websocket.send(pcmData.buffer);
        }
      };
      
      // Connect audio processing chain
      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      // Setup audio playback for agent's voice
      this.setupAudioPlayback();
      
    } catch (error) {
      console.error('Error setting up audio streaming:', error);
    }
  }

  /**
   * Setup audio playback for agent's voice responses
   */
  setupAudioPlayback() {
    // This will be handled by VAPI's WebSocket messages
    // Audio data will come through the WebSocket and be played via AudioContext
  }

  /**
   * Handle WebSocket messages from VAPI
   */
  handleWebSocketMessage(message) {
    console.log('📨 VAPI message:', message.type, message);
    
    switch (message.type) {
      case 'conversation-item-created':
        // New message in conversation
        if (message.conversationItem?.role === 'assistant') {
          const content = message.conversationItem?.content || '';
          if (content && this.onMessageCallback) {
            this.onMessageCallback({
              role: 'assistant',
              content: content,
              timestamp: new Date().toISOString()
            });
          }
        } else if (message.conversationItem?.role === 'user') {
          const content = message.conversationItem?.content || '';
          if (content && this.onTranscriptCallback) {
            this.onTranscriptCallback({
              final: content,
              isFinal: true
            });
          }
        }
        break;
        
      case 'user-speech-start':
        this.isUserSpeaking = true;
        if (this.onUserSpeechStartCallback) {
          this.onUserSpeechStartCallback();
        }
        break;
        
      case 'user-speech-end':
        this.isUserSpeaking = false;
        if (this.onUserSpeechEndCallback) {
          this.onUserSpeechEndCallback();
        }
        break;
        
      case 'assistant-speech-start':
        this.isAssistantSpeaking = true;
        if (this.onAssistantSpeechStartCallback) {
          this.onAssistantSpeechStartCallback();
        }
        break;
        
      case 'assistant-speech-end':
        this.isAssistantSpeaking = false;
        if (this.onAssistantSpeechEndCallback) {
          this.onAssistantSpeechEndCallback();
        }
        break;
        
      case 'function-call':
        // Handle function calls from the agent
        console.log('Function call:', message.functionCall);
        break;
        
      case 'status-update':
        if (this.onStatusUpdateCallback) {
          this.onStatusUpdateCallback(message.status);
        }
        break;
        
      case 'audio':
        // Handle audio data from agent
        this.handleAudioData(message.audio);
        break;
        
      case 'error':
        console.error('VAPI error:', message.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(message.error));
        }
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  /**
   * Handle audio data from agent
   */
  handleAudioData(audioData) {
    // VAPI sends audio as base64 or ArrayBuffer
    // This needs to be decoded and played through AudioContext
    // Implementation depends on VAPI's audio format
    console.log('Audio data received:', audioData);
  }

  /**
   * End the current call via backend
   */
  async endCall() {
    try {
      if (this.call && this.call.id) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        await fetch(`${backendUrl}/api/vapi/end-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callId: this.call.id
          })
        });
      }
      
      this.closeConnection();
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      this.closeConnection();
      return false;
    }
  }

  /**
   * Close WebSocket connection and cleanup
   */
  closeConnection() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.isCallActive = false;
    this.call = null;
  }

  /**
   * Send a message/text input to the agent (for manual input)
   */
  sendMessage(text) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'user-message',
        message: text
      }));
    }
  }

  /**
   * Check if VAPI is supported (requires WebSocket and Web Audio API)
   */
  isSupported() {
    return !!(
      window.WebSocket &&
      (window.AudioContext || window.webkitAudioContext) &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  // Event handler setters
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onTranscript(callback) {
    this.onTranscriptCallback = callback;
  }

  onUserSpeechStart(callback) {
    this.onUserSpeechStartCallback = callback;
  }

  onUserSpeechEnd(callback) {
    this.onUserSpeechEndCallback = callback;
  }

  onAssistantSpeechStart(callback) {
    this.onAssistantSpeechStartCallback = callback;
  }

  onAssistantSpeechEnd(callback) {
    this.onAssistantSpeechEndCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onStatusUpdate(callback) {
    this.onStatusUpdateCallback = callback;
  }
}

// Export singleton instance
export default new VAPIService();

