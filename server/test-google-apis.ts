/**
 * Test Google Cloud APIs with current credentials
 */

async function testGoogleCloudAPIs(): Promise<void> {
  console.log('\n🔍 Testing Google Cloud APIs...');
  
  try {
    // Check if we have GOOGLE_AI_STUDIO_API_KEY
    const googleAIKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    
    if (googleAIKey) {
      console.log('✅ Google AI Studio API Key found');
      
      // Test Gemini Pro API
      console.log('\n🧠 Testing Gemini Pro API...');
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + googleAIKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, this is a test for Persian V2Ray support system. Please respond in Persian.'
            }]
          }]
        })
      });
      
      if (geminiResponse.ok) {
        const result = await geminiResponse.json();
        console.log('✅ Gemini Pro API: Working');
        console.log('Sample response:', result.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100) + '...');
      } else {
        console.log('❌ Gemini Pro API: Failed -', geminiResponse.status, geminiResponse.statusText);
      }
    } else {
      console.log('❌ Google AI Studio API Key not found');
    }
    
    // Check other environment variables
    console.log('\n🔑 Environment Variables Status:');
    console.log('GOOGLE_AI_STUDIO_API_KEY:', process.env.GOOGLE_AI_STUDIO_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('GROK_API_KEY:', process.env.GROK_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('SENTIMENT_API_KEY:', process.env.SENTIMENT_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('STT_API_KEY:', process.env.STT_API_KEY ? '✅ Set' : '❌ Not set');
    
    // Test Speech-to-Text if we have credentials
    console.log('\n🎤 Testing Speech-to-Text API...');
    
    const sttKey = process.env.STT_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (sttKey) {
      const sttResponse = await fetch('https://speech.googleapis.com/v1/speech:recognize?key=' + sttKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'fa-IR'
          },
          audio: {
            content: ''
          }
        })
      });
      
      if (sttResponse.status === 400) {
        console.log('✅ Speech-to-Text API: Accessible (400 expected for empty audio)');
      } else if (sttResponse.status === 403) {
        console.log('❌ Speech-to-Text API: Not enabled (403 Forbidden)');
      } else {
        console.log('⚠️  Speech-to-Text API: Status', sttResponse.status);
      }
    } else {
      console.log('❌ No API key available for Speech-to-Text test');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

testGoogleCloudAPIs().catch(console.error);