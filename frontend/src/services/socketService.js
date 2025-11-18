import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.sessionId = null;
    this.connectionPromise = null;
    this.eventQueue = [];
    this.defaultHandlers = new Map();
  }

  // Connect to the socket server
  connect(url = 'http://localhost:3001') {
    // Return existing connection promise if available
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // If already connected, resolve immediately
        if (this.socket?.connected) {
          console.log('Using existing socket connection');
          resolve(this.socket);
          return;
        }

        // Create new socket connection
        console.log('🔌 Connecting to socket server at:', url);
        this.socket = io(url, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 3000,
          timeout: 10000,
          autoConnect: true,
          forceNew: false
        });

        // Connection established
        this.socket.on('connect', () => {
          console.log('✅ Socket connected with ID:', this.socket.id);
          this.isConnected = true;
          this.emit('connection-established');  // Changed from 'connect'
          
          // Re-emit any queued events
          this.flushEventQueue();
          
          resolve(this.socket);
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error.message);
          this.isConnected = false;
          this.emit('connection-error', error);  // Changed from 'error'
          
          // Only reject on initial connection
          if (this.connectionPromise) {
            reject(error);
            this.connectionPromise = null;
          }
        });

        // Disconnect handler
        this.socket.on('disconnect', (reason) => {
          console.log('⚠️ Socket disconnected:', reason);
          this.isConnected = false;
          this.emit('connection-closed', reason);  // Changed from 'disconnect'
          
          // Clear connection promise to allow reconnection
          this.connectionPromise = null;
        });

        // Handle reconnection attempts
        this.socket.on('reconnect_attempt', (attempt) => {
          console.log(`🔄 Reconnection attempt ${attempt}...`);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('❌ Failed to reconnect to server');
          this.connectionPromise = null;
        });

        // Set up default event handlers
        this.setupDefaultHandlers();

      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Disconnect from the socket server
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
      this.eventQueue = [];
      console.log('Socket disconnected');
    }
  }
  
  // Set up default event handlers
  setupDefaultHandlers() {
    // Handle interviewer responses
    this.defaultHandlers.set('interviewer-response', (response) => {
      console.log('📨 Received interviewer response:', response);
      this.emit('interviewer-response', response);
    });
    
    // Handle interview end
    this.defaultHandlers.set('interview-ended', (data) => {
      console.log('🏁 Interview ended:', data);
      this.emit('interview-ended', data);
    });
    
    // Handle errors
    this.defaultHandlers.set('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emit('socket-error', error);  // Changed from 'error' to avoid reserved name
    });
    
    // Apply all default handlers
    this.defaultHandlers.forEach((handler, event) => {
      this.socket.on(event, handler);
    });
  }
  
  // Queue events when disconnected
  queueEvent(event, data) {
    if (!this.isConnected) {
      console.log(`📬 Queuing ${event} event (not connected)`);
      this.eventQueue.push({ event, data });
      return false;
    }
    return true;
  }
  
  // Flush queued events when reconnected
  flushEventQueue() {
    if (this.eventQueue.length === 0) return;
    
    console.log(`📨 Flushing ${this.eventQueue.length} queued events`);
    
    // Process all queued events
    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift();
      try {
        console.log(`  ➡️ Processing queued ${event} event`);
        this.emit(event, data);
      } catch (error) {
        console.error(`Error processing queued ${event} event:`, error);
      }
    }
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Cleanup all listeners and disconnect
  cleanup() {
    if (this.socket) {
      this.listeners.forEach((callbacks, event) => {
        if (Array.isArray(callbacks)) {
          callbacks.forEach(callback => {
            this.socket.off(event, callback);
          });
        }
      });
      this.listeners.clear();
      this.disconnect();
    }
  }

  // Start interview session
  startInterview(role, candidateName) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected, cannot start interview');
      throw new Error('Not connected to interview server');
    }
    
    console.log('Emitting start-interview event with role:', role);
    return new Promise((resolve, reject) => {
      try {
        this.socket.emit('start-interview', { 
          role, 
          candidateName,
          timestamp: new Date().toISOString()
        }, (response) => {
          if (response && response.success) {
            console.log('Interview started successfully');
            resolve(response);
          } else {
            console.error('Failed to start interview:', response?.error);
            reject(new Error(response?.error || 'Failed to start interview'));
          }
        });
      } catch (error) {
        console.error('Error starting interview:', error);
        reject(error);
      }
    });
  }

  // Send candidate response with voice metrics to backend
  sendCandidateResponse(message, voiceMetrics = null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('candidate-response', {
        message,
        sessionId: this.sessionId,
        voiceMetrics: voiceMetrics,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Submit code
  submitCode(code, language, explanation) {
    if (this.socket) {
      this.socket.emit('code-submission', { code, language, explanation });
    }
  }

  // End interview
  endInterview() {
    if (this.socket) {
      this.socket.emit('end-interview');
      // Do not disconnect immediately; wait for 'interview-ended'
    }
  }

  // Listen for interviewer responses
  onInterviewerResponse(callback) {
    if (this.socket) {
      // Support both legacy and current event names
      this.socket.on('interviewer-response', callback);
      this.socket.on('ai-response', callback);
    }
  }

  // Listen for interview end
  onInterviewEnd(callback) {
    if (this.socket) {
      this.socket.on('interview-ended', callback);
    }
  }

  // Listen for errors
  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Generic event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Generic event emitter
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // One-time listener helper
  once(event, callback) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }
}

// Create and export singleton instance
export const socketService = new SocketService();

export default socketService;
