# AI Interview Backend Server

Clean and simple backend server for the AI Interview Simulator that works 100% with the existing frontend.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **Ollama** running with `llama3.2:3b-instruct-q4_0` model

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start Ollama (in separate terminal):**
   ```bash
   ollama serve
   ```

3. **Pull the AI model:**
   ```bash
   ollama pull llama3.2:3b-instruct-q4_0
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```

5. **Test the server:**
   ```bash
   npm test
   ```

## 🎯 Features

- **Socket.io Integration**: Real-time communication with frontend
- **Ollama AI**: Uses `llama3.2:3b-instruct-q4_0` model for natural conversations
- **Interview Management**: Handles 12 different role types
- **Coding Questions**: Dynamic LeetCode-style challenges
- **Voice Metrics**: Processes speech analysis data
- **Session Management**: Tracks interview progress and cleanup

## 📡 API Endpoints

- `GET /health` - Server health check
- `GET /test-ollama` - Test Ollama connection

## 🔧 Socket Events

### Client → Server
- `start-interview` - Begin new interview session
- `candidate-response` - Send candidate's voice/text response
- `code-submission` - Submit code solution
- `end-interview` - End interview session

### Server → Client
- `interviewer-response` - AI interviewer's response
- `interview-ended` - Interview completion notification
- `error` - Error messages

## 🏗️ Architecture

```
backend/
├── server.js              # Main server with Socket.io
├── services/
│   ├── ollamaService.js   # Ollama AI integration
│   └── interviewManager.js # Interview logic & conversation
├── package.json
└── README.md
```

## 🎭 Interview Roles Supported

- Frontend Developer
- Backend Developer  
- Full Stack Developer
- Mobile Developer
- Data Scientist
- Machine Learning Engineer
- DevOps Engineer
- QA Engineer
- Product Manager
- Security Engineer
- Blockchain Developer
- Game Developer

## 🔄 Interview Flow

1. **Start**: Client connects and starts interview
2. **Introduction**: AI greets and asks about experience
3. **Conversation**: 2-3 technical questions with follow-ups
4. **Coding**: Dynamic coding challenge (if applicable)
5. **Wrap-up**: Final questions and closing
6. **End**: Generate feedback and cleanup session

## 🛠️ Configuration

Environment variables:
- `PORT` - Server port (default: 3001)
- `OLLAMA_URL` - Ollama server URL (default: http://localhost:11434)

## 🧪 Testing

```bash
# Test server health and Ollama connection
npm test

# Manual testing
curl http://localhost:3001/health
curl http://localhost:3001/test-ollama
```

## 🚨 Troubleshooting

**Ollama not responding:**
```bash
ollama serve
ollama pull llama3.2:3b-instruct-q4_0
```

**Port already in use:**
```bash
# Change port in server.js or kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

**Socket connection issues:**
- Check CORS settings in server.js
- Ensure frontend is running on http://localhost:3000
- Check browser console for errors

## 📊 Performance

- **Memory**: ~200MB base + ~2GB for Ollama model
- **Response Time**: 2-5 seconds for AI responses
- **Concurrent Sessions**: Supports multiple simultaneous interviews
- **Cleanup**: Automatic session cleanup on disconnect

## 🔒 Security

- CORS enabled for localhost:3000
- No persistent data storage
- All data processed in memory
- No external API calls during interviews








