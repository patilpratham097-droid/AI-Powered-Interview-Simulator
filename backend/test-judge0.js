/**
 * Test Judge0 Integration
 * Run this to verify Judge0 is working correctly
 */

require('dotenv').config();
const Judge0Service = require('./services/judge0Service');

const judge0 = new Judge0Service();

async function testJudge0() {
  console.log('🧪 Testing Judge0 Integration...\n');

  // Test 1: Simple JavaScript execution
  console.log('Test 1: Simple JavaScript execution');
  try {
    const result1 = await judge0.runWithInput(
      'console.log("Hello from Judge0!");',
      'javascript',
      ''
    );
    console.log('✅ Output:', result1.output);
    console.log('⏱️  Time:', result1.executionTime, 'seconds');
    console.log('💾 Memory:', result1.memory, 'KB\n');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message, '\n');
  }

  // Test 2: Python execution
  console.log('Test 2: Python execution');
  try {
    const result2 = await judge0.runWithInput(
      'print("Hello from Python!")',
      'python',
      ''
    );
    console.log('✅ Output:', result2.output);
    console.log('⏱️  Time:', result2.executionTime, 'seconds\n');
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message, '\n');
  }

  // Test 3: Code with test cases (Two Sum problem)
  console.log('Test 3: Code with test cases');
  try {
    const code = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test the function
const nums = [2, 7, 11, 15];
const target = 9;
console.log(JSON.stringify(twoSum(nums, target)));
`;

    const testCases = [
      {
        input: '',
        expected: '[0,1]'
      }
    ];

    const result3 = await judge0.executeCode(code, 'javascript', testCases);
    console.log('✅ Tests passed:', result3.passedTests, '/', result3.totalTests);
    console.log('📊 Results:', JSON.stringify(result3.results[0], null, 2), '\n');
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message, '\n');
  }

  // Test 4: Syntax validation
  console.log('Test 4: Syntax validation');
  try {
    const validCode = 'console.log("Valid code");';
    const result4 = await judge0.validateSyntax(validCode, 'javascript');
    console.log('✅ Valid code:', result4.valid, '\n');
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message, '\n');
  }

  // Test 5: Invalid syntax
  console.log('Test 5: Invalid syntax detection');
  try {
    const invalidCode = 'console.log("Missing closing quote);';
    const result5 = await judge0.validateSyntax(invalidCode, 'javascript');
    console.log('❌ Invalid code detected:', !result5.valid);
    if (!result5.valid) {
      console.log('📝 Error:', result5.error.substring(0, 100), '...\n');
    }
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message, '\n');
  }

  // Test 6: Get supported languages
  console.log('Test 6: Supported languages');
  const languages = judge0.getSupportedLanguages();
  console.log('✅ Supported languages:', languages.join(', '), '\n');

  console.log('🎉 Judge0 integration test complete!');
  console.log('\n📝 Summary:');
  console.log('- If all tests passed, Judge0 is working correctly');
  console.log('- If tests failed, check your .env configuration');
  console.log('- Make sure JUDGE0_API_KEY is set correctly');
}

// Run tests
testJudge0().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});
