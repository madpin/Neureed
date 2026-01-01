/**
 * Simple verification script for JSON parser
 * Run with: node scripts/verify-json-parser.js
 */

// Mock extractJSON function
function extractJSON(rawResponse) {
  let cleaned = rawResponse.trim();

  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch?.[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Remove any leading text before the first { or [
  const jsonStartMatch = cleaned.match(/^[^{[]*([{[][\s\S]*)/);
  if (jsonStartMatch?.[1]) {
    cleaned = jsonStartMatch[1];
  }

  // Remove any trailing text after the last } or ]
  const jsonEndMatch = cleaned.match(/([\s\S]*[}\]])[^}\]]*$/);
  if (jsonEndMatch?.[1]) {
    cleaned = jsonEndMatch[1];
  }

  return cleaned.trim();
}

// Test cases
const tests = [
  {
    name: "Plain JSON",
    input: '{"key": "value"}',
    expected: '{"key": "value"}'
  },
  {
    name: "JSON in markdown with json tag",
    input: 'Here is the result:\n```json\n{"key": "value"}\n```',
    expected: '{"key": "value"}'
  },
  {
    name: "JSON in markdown without tag",
    input: '```\n{"key": "value"}\n```',
    expected: '{"key": "value"}'
  },
  {
    name: "JSON with intro text",
    input: 'Sure! Here you go: {"key": "value"}',
    expected: '{"key": "value"}'
  },
  {
    name: "JSON with trailing text",
    input: '{"key": "value"} I hope this helps!',
    expected: '{"key": "value"}'
  },
  {
    name: "Complex JSON with markdown",
    input: 'Here\'s the summary:\n```json\n{\n  "summary": "Test",\n  "keyPoints": ["a", "b"],\n  "topics": ["topic1"]\n}\n```\nLet me know if you need anything else!',
    expected: '{\n  "summary": "Test",\n  "keyPoints": ["a", "b"],\n  "topics": ["topic1"]\n}'
  },
  {
    name: "Empty response",
    input: '',
    expected: ''
  }
];

console.log('🧪 Testing JSON Parser\n');

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  try {
    const result = extractJSON(test.input);

    if (result === test.expected) {
      console.log(`✅ Test ${index + 1}: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Got:      ${result}`);
      failed++;
    }

    // Try to parse the extracted JSON (if not empty)
    if (result && result.trim()) {
      JSON.parse(result);
      console.log(`   ✓ Valid JSON`);
    }
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${test.name} - ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('\n✨ All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed');
  process.exit(1);
}
