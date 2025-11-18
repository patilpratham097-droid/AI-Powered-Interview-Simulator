const axios = require('axios');
const FormData = require('form-data');

/**
 * Whisper.cpp Service for high-quality speech recognition
 * Free, local, and excellent accuracy
 */
class WhisperService {
  constructor() {
    // Whisper.cpp server URL (will run locally)
    this.whisperUrl = process.env.WHISPER_URL || 'http://localhost:8080';
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    try {
      await axios.get(`${this.whisperUrl}/health`, { timeout: 2000 });
      this.isAvailable = true;
      console.log('✅ Whisper.cpp server is available');
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️ Whisper.cpp server not available, will use fallback');
    }
  }

  /**
   * Transcribe audio to text using Whisper.cpp
   * @param {Buffer} audioBuffer - Audio data (WAV, MP3, etc.)
   * @param {Object} options - Transcription options
   * @returns {Promise<string>} Transcribed text
   */
  async transcribe(audioBuffer, options = {}) {
    if (!this.isAvailable) {
      throw new Error('Whisper service not available');
    }

    try {
      const formData = new FormData();
      formData.append('audio_file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });

      // Add options for openai-whisper-asr-webservice
      if (options.language) {
        formData.append('language', options.language);
      }
      if (options.temperature !== undefined) {
        formData.append('temperature', options.temperature);
      }
      
      // Add task type (transcribe or translate)
      formData.append('task', 'transcribe');

      const response = await axios.post(
        `${this.whisperUrl}/asr`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'accept': 'application/json'
          },
          params: {
            task: 'transcribe',
            language: options.language || 'en',
            output: 'json'
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Handle different response formats
      const text = response.data.text || response.data.transcription || response.data.transcript || '';
      return text.trim();
    } catch (error) {
      console.error('Whisper transcription error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio stream in real-time
   * @param {Stream} audioStream - Audio stream
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeStream(audioStream) {
    // For real-time, we'll use the same endpoint but with streaming
    // This is a simplified version - full streaming requires WebSocket
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      audioStream.on('end', async () => {
        try {
          const audioBuffer = Buffer.concat(chunks);
          const text = await this.transcribe(audioBuffer);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      });

      audioStream.on('error', reject);
    });
  }

  /**
   * Check if Whisper service is ready
   */
  async isReady() {
    await this.checkAvailability();
    return this.isAvailable;
  }
}

module.exports = new WhisperService();
