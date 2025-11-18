class ElevenLabsService {
  constructor(apiKey = '') {
    this.apiKey = apiKey || process.env.REACT_APP_ELEVENLABS_API_KEY || '';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.isAvailable = false;
    this.voices = [];
    this.initialize();
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not provided. Using browser TTS as fallback.');
      return false;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.voices = data.voices || [];
        this.isAvailable = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize ElevenLabs:', error);
      return false;
    }
  }

  async speak(text, options = {}) {
    if (!this.isAvailable) {
      throw new Error('ElevenLabs TTS not available');
    }

    const {
      voiceId = '21m00Tcm4TlvDq8ikWAM', // Default voice: Rachel (English, Female)
      modelId = 'eleven_monolingual_v1',
      stability = 0.5,
      similarityBoost = 0.5,
      style = 0,
      speakerBoost = true
    } = options;

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
              style,
              speaker_boost: speakerBoost
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audio.onended = resolve;
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          resolve();
        };
        audio.play().catch(error => {
          console.error('Failed to play audio:', error);
          resolve();
        });
      });
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  getAvailableVoices() {
    return this.voices;
  }
}

export default ElevenLabsService;
