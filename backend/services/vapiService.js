/**
 * VAPI Backend Service
 * Handles VAPI API calls, webhooks, and call management
 */

const axios = require('axios');

class VAPIService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY || '';
    this.baseUrl = 'https://api.vapi.ai';
    this.webhookUrl = process.env.VAPI_WEBHOOK_URL || 'http://localhost:3001/api/vapi/webhook';
  }

  /**
   * Create a call with VAPI voice agent
   * @param {Object} params - Call parameters
   * @param {String} params.agentId - VAPI agent ID
   * @param {String} params.candidateName - Candidate name
   * @param {String} params.role - Interview role
   * @param {Object} params.variables - Additional variables for the agent
   */
  async createCall(params) {
    try {
      const { agentId, candidateName, role, variables = {} } = params;

      if (!this.apiKey) {
        throw new Error('VAPI API key is required. Set VAPI_API_KEY environment variable.');
      }

      if (!agentId) {
        throw new Error('Agent ID is required. Set VAPI_AGENT_ID environment variable or pass in request.');
      }

      const response = await axios.post(
        `${this.baseUrl}/call`,
        {
          phoneNumberId: null, // For web calls, this is null
          customer: {
            number: null // Not needed for web calls
          },
          assistantId: agentId,
          assistantOverrides: {
            // Pass interview context to the agent
            variables: {
              candidateName: candidateName || 'Candidate',
              role: role || 'Software Engineer',
              ...variables
            },
            // You can override the first message if needed
            firstMessage: variables.firstMessage || null
          },
          // Webhook configuration for status updates
          webhookUrl: this.webhookUrl,
          // Enable streaming for real-time updates
          streaming: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating VAPI call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get call status
   * @param {String} callId - VAPI call ID
   */
  async getCall(callId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/call/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting VAPI call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * End a call
   * @param {String} callId - VAPI call ID
   * @param {String} reason - Reason for ending the call
   */
  async endCall(callId, reason = 'user-ended') {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/call/${callId}`,
        {
          endedReason: reason
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error ending VAPI call:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Parse JSON actions from message content
   * Handles actions like: start_coding, finish_coding, end_interview
   */
  parseActionFromMessage(content) {
    if (!content) return null;

    try {
      // Try to parse JSON from message content
      // Look for JSON objects in the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action) {
          return parsed;
        }
      }
    } catch (error) {
      // Not JSON, continue with regular message
    }

    return null;
  }

  /**
   * Handle webhook events from VAPI
   * @param {Object} event - Webhook event data
   */
  handleWebhook(event) {
    console.log('📨 VAPI Webhook event:', event.type);

    switch (event.type) {
      case 'call-start':
        return {
          type: 'call-started',
          callId: event.call?.id,
          timestamp: event.timestamp
        };

      case 'call-end':
        return {
          type: 'call-ended',
          callId: event.call?.id,
          duration: event.call?.duration,
          endedReason: event.call?.endedReason,
          transcript: event.call?.transcript,
          timestamp: event.timestamp
        };

      case 'conversation-item-create':
        const content = event.conversationItem?.content || '';
        const role = event.conversationItem?.role; // 'user' or 'assistant'
        
        // Parse actions from assistant messages
        if (role === 'assistant') {
          const action = this.parseActionFromMessage(content);
          if (action) {
            console.log('🎯 Parsed action from message:', action.action);
            return {
              type: 'action',
              action: action.action,
              data: action,
              originalMessage: content,
              timestamp: event.timestamp
            };
          }
        }

        return {
          type: 'message',
          role: role,
          content: content,
          timestamp: event.timestamp
        };

      case 'function-call':
        // Handle function calls from VAPI agent
        const functionCall = event.functionCall || event.function;
        console.log('🔧 Function call received:', functionCall?.name);
        
        // Map function calls to actions
        let actionType = null;
        let actionData = null;

        if (functionCall?.name === 'start_coding') {
          actionType = 'start_coding';
          actionData = {
            action: 'start_coding',
            question: functionCall.parameters?.question || 'Solve this coding problem',
            difficulty: functionCall.parameters?.difficulty || 'medium'
          };
        } else if (functionCall?.name === 'finish_coding') {
          actionType = 'finish_coding';
          actionData = {
            action: 'finish_coding'
          };
        } else if (functionCall?.name === 'end_interview') {
          actionType = 'end_interview';
          actionData = {
            action: 'end_interview',
            report: functionCall.parameters?.report || {}
          };
        }

        if (actionType) {
          return {
            type: 'action',
            action: actionType,
            data: actionData,
            functionCall: functionCall,
            timestamp: event.timestamp
          };
        }

        return {
          type: 'function-call',
          functionCall: functionCall,
          timestamp: event.timestamp
        };

      case 'status-update':
        return {
          type: 'status-update',
          status: event.status,
          timestamp: event.timestamp
        };

      default:
        console.log('Unhandled webhook event type:', event.type);
        return null;
    }
  }

  /**
   * Get call transcript
   * @param {String} callId - VAPI call ID
   */
  async getTranscript(callId) {
    try {
      const call = await this.getCall(callId);
      return call.transcript || [];
    } catch (error) {
      console.error('Error getting transcript:', error);
      return [];
    }
  }

  /**
   * Get call recording (if available)
   * @param {String} callId - VAPI call ID
   */
  async getRecording(callId) {
    try {
      const call = await this.getCall(callId);
      return call.recordingUrl || null;
    } catch (error) {
      console.error('Error getting recording:', error);
      return null;
    }
  }
}

module.exports = VAPIService;

