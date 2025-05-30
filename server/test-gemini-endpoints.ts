/**
 * Test different Gemini Pro endpoints to find the working one
 */

async function testGeminiEndpoints(): Promise<void> {
  console.log('\n🔍 Testing Different Gemini Pro Endpoints');
  console.log('='.repeat(60));

  const googleAIKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  
  const endpoints = [
    {
      name: 'Google AI Studio v1beta',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleAIKey}`
    },
    {
      name: 'Google AI Studio v1',
      url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${googleAIKey}`
    },
    {
      name: 'Alternative Gemini endpoint',
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleAIKey}`
    }
  ];

  const testPayload = {
    contents: [{
      parts: [{
        text: 'Hello! Please respond in Persian: سلام'
      }]
    }]
  };

  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint.name}`);
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ SUCCESS! This endpoint works');
        console.log('Response:', result.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100));
        return;
      } else {
        const error = await response.text();
        console.log('❌ Failed:', error.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Network error:', (error as Error).message);
    }
  }

  console.log('\n⚠️  None of the Gemini endpoints worked with your current API key');
  console.log('\nPossible solutions:');
  console.log('1. Your API key might be for a different Google service');
  console.log('2. You might need to enable the Generative AI API in Google Cloud Console');
  console.log('3. You might need a different type of API key');
  
  console.log('\nCurrent API key starts with:', googleAIKey?.substring(0, 10) + '...');
  console.log('Expected format for Google AI Studio: AIza...');
}

testGeminiEndpoints().catch(console.error);