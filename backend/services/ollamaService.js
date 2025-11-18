const axios = require('axios');

class OllamaService {
  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.model = 'llama3.2:3b-instruct-q4_0';
    this.isConnected = false;
  }

  async testConnection() {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: "Hello, I'm ready to conduct interviews!",
        stream: false
      }, {
        timeout: 10000
      });
      
      this.isConnected = true;
      return response.data.response;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Ollama connection failed: ${error.message}`);
    }
  }

  async generateResponse(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.max_tokens || 500
        }
      }, {
        timeout: 30000 // 30 second timeout for AI responses
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Ollama generation error:', error.message);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  async isModelAvailable() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      const models = response.data.models || [];
      return models.some(model => model.name.includes(this.model));
    } catch (error) {
      return false;
    }
  }

  getModelName() {
    return this.model;
  }

  isConnected() {
    return this.isConnected;
  }
}

module.exports = OllamaService;








