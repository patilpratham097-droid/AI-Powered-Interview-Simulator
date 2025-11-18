const axios = require('axios');

async function testOllama() {
  console.log('🧪 Testing Ollama connection directly...\n');

  try {
    // Test 1: Check if Ollama is running
    console.log('1. Checking Ollama service...');
    const response = await axios.get('http://localhost:11434/api/tags', {
      timeout: 5000
    });
    console.log('✅ Ollama service is running');
    console.log('Available models:', response.data.models?.map(m => m.name) || 'None');
    console.log('');

    // Test 2: Test model generation
    console.log('2. Testing model generation...');
    const generateResponse = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:3b-instruct-q4_0',
      prompt: 'Hello, I am ready to conduct interviews!',
      stream: false
    }, {
      timeout: 30000
    });
    
    console.log('✅ Model generation successful');
    console.log('Response:', generateResponse.data.response.substring(0, 100) + '...');
    console.log('');

    console.log('🎉 Ollama is working perfectly!');
    console.log('\n📋 Next steps:');
    console.log('1. The backend server should now work');
    console.log('2. Start the frontend: cd ../frontend && npm start');
    console.log('3. Test the complete system!');

  } catch (error) {
    console.error('❌ Ollama test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Ollama is not running. Start it with:');
      console.log('   ollama serve');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Model not found. Pull it with:');
      console.log('   ollama pull llama3.2:3b-instruct-q4_0');
    } else {
      console.log('\n💡 Check Ollama installation and try again');
    }
  }
}

testOllama();








