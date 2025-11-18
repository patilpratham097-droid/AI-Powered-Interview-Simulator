const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testServer() {
  console.log('🧪 Testing AI Interview Backend Server...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Ollama Connection
    console.log('2. Testing Ollama connection...');
    const ollamaResponse = await axios.get(`${BASE_URL}/test-ollama`);
    console.log('✅ Ollama test passed:', ollamaResponse.data.message);
    console.log('');

    console.log('🎉 All tests passed! Backend is ready for frontend connection.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the frontend: cd ../frontend && npm start');
    console.log('2. Open http://localhost:3000');
    console.log('3. Navigate to AI Interview and start testing!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm start');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Make sure Ollama is running:');
      console.log('   ollama serve');
      console.log('   ollama pull llama3.2:3b-instruct-q4_0');
    }
  }
}

testServer();








