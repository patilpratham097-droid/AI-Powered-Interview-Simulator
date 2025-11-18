/**
 * VAPI Integration Adapter
 * Adapts VAPI service to work with the existing AIInterviewContext
 */

import vapiService from '../services/vapiService';
import socketService from '../services/socketService';

class VAPIIntegration {
  constructor() {
    this.vapiCall = null;
    this.isActive = false;
  }

  /**
   * Initialize VAPI integration
   */
  async initialize(apiKey, agentId) {
    return vapiService.initialize(apiKey, agentId);
  }

  /**
   * Start interview with VAPI
   */
  async startInterview(role, candidateName, callbacks = {}) {
    try {
      console.log('🎙️ Starting VAPI interview...');

      // Set up VAPI event handlers
      this.setupVAPIHandlers(callbacks);

      // Set up Socket.IO handlers for backend webhook events
      this.setupSocketHandlers(callbacks);

      // Start VAPI call
      this.vapiCall = await vapiService.startCall({
        role,
        candidateName,
        agentId: process.env.REACT_APP_VAPI_AGENT_ID,
        customVariables: {
          role,
          candidateName
        }
      });

      this.isActive = true;

      return {
        success: true,
        callId: this.vapiCall.id,
        sessionId: this.vapiCall.sessionId
      };
    } catch (error) {
      console.error('Error starting VAPI interview:', error);
      throw error;
    }
  }

  /**
   * Set up VAPI event handlers
   */
  setupVAPIHandlers(callbacks) {
    // Handle assistant messages
    vapiService.onMessage((message) => {
      if (message.role === 'assistant' && callbacks.onAssistantMessage) {
        callbacks.onAssistantMessage(message.content);
      }
    });

    // Handle user transcripts
    vapiService.onTranscript((transcript) => {
      if (callbacks.onUserTranscript) {
        callbacks.onUserTranscript(transcript);
      }
    });

    // Handle speech events
    vapiService.onUserSpeechStart(() => {
      if (callbacks.onUserSpeechStart) {
        callbacks.onUserSpeechStart();
      }
    });

    vapiService.onUserSpeechEnd(() => {
      if (callbacks.onUserSpeechEnd) {
        callbacks.onUserSpeechEnd();
      }
    });

    vapiService.onAssistantSpeechStart(() => {
      if (callbacks.onAssistantSpeechStart) {
        callbacks.onAssistantSpeechStart();
      }
    });

    vapiService.onAssistantSpeechEnd(() => {
      if (callbacks.onAssistantSpeechEnd) {
        callbacks.onAssistantSpeechEnd();
      }
    });

    // Handle errors
    vapiService.onError((error) => {
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    });

    // Handle status updates
    vapiService.onStatusUpdate((status) => {
      if (callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate(status);
      }
    });
  }

  /**
   * Set up Socket.IO handlers for backend webhook events
   */
  setupSocketHandlers(callbacks) {
    // Listen for VAPI events from backend webhooks
    socketService.on('vapi-event', (event) => {
      console.log('📨 VAPI event from backend:', event);

      switch (event.type) {
        case 'call-started':
          if (callbacks.onCallStarted) {
            callbacks.onCallStarted(event);
          }
          break;

        case 'call-ended':
          this.isActive = false;
          if (callbacks.onCallEnded) {
            callbacks.onCallEnded(event);
          }
          break;

        case 'message':
          if (event.role === 'assistant' && callbacks.onAssistantMessage) {
            callbacks.onAssistantMessage(event.content);
          } else if (event.role === 'user' && callbacks.onUserTranscript) {
            callbacks.onUserTranscript({
              final: event.content,
              isFinal: true
            });
          }
          break;

        case 'status-update':
          if (callbacks.onStatusUpdate) {
            callbacks.onStatusUpdate(event.status);
          }
          break;

        default:
          console.log('Unhandled VAPI event:', event.type);
      }
    });
  }

  /**
   * End interview
   */
  async endInterview() {
    try {
      if (this.vapiCall && this.isActive) {
        await vapiService.endCall();
      }
      this.isActive = false;
      this.vapiCall = null;
      return true;
    } catch (error) {
      console.error('Error ending VAPI interview:', error);
      return false;
    }
  }

  /**
   * Send text message (for manual input fallback)
   */
  sendMessage(text) {
    if (this.isActive) {
      vapiService.sendMessage(text);
    }
  }

  /**
   * Check if VAPI is supported
   */
  isSupported() {
    return vapiService.isSupported();
  }

  /**
   * Get current call status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      callId: this.vapiCall?.id,
      isConnected: vapiService.isConnected,
      isCallActive: vapiService.isCallActive
    };
  }
}

export default VAPIIntegration;




