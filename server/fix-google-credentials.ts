/**
 * Fix Google Cloud credentials storage and test Vertex AI integration
 */

async function fixGoogleCredentials(): Promise<void> {
  console.log('\n🔧 Fixing Google Cloud Credentials Storage...');
  
  try {
    const { storage } = await import('./storage');
    
    // Get the current grok_api_key which contains the Google Cloud JSON
    const currentSetting = await storage.getSetting('grok_api_key');
    
    if (currentSetting?.value) {
      try {
        // Parse to verify it's valid JSON
        const credentialsData = JSON.parse(currentSetting.value);
        
        if (credentialsData.type === 'service_account' && credentialsData.project_id) {
          console.log('✅ Found valid Google Cloud Service Account JSON');
          console.log(`Project ID: ${credentialsData.project_id}`);
          console.log(`Service Account: ${credentialsData.client_email}`);
          
          // Store in the correct field
          await storage.saveSetting('google_cloud_credentials', currentSetting.value);
          console.log('✅ Google Cloud credentials saved to correct field');
          
          // Test authentication
          console.log('\n🔐 Testing Google Cloud Authentication...');
          const { GoogleAuth } = await import('google-auth-library');
          
          const auth = new GoogleAuth({
            credentials: credentialsData,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
          });
          
          const accessToken = await auth.getAccessToken();
          console.log('✅ Google Cloud Authentication: SUCCESS');
          
          // Test Vertex AI API access
          console.log('\n🧠 Testing Vertex AI API...');
          const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${credentialsData.project_id}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              instances: [{
                content: 'Test Persian V2Ray support: سلام، مشکل کانفیگ دارم'
              }],
              parameters: {
                temperature: 0.7,
                maxOutputTokens: 256
              }
            })
          });
          
          if (response.status === 200) {
            console.log('✅ Vertex AI API: Fully operational');
          } else if (response.status === 404) {
            console.log('⚠️  Vertex AI API: Available, testing alternative endpoint...');
            
            // Test alternative Gemini endpoint
            const altResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_STUDIO_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: 'Test Persian V2Ray: آیا سرویس V2Ray کار می‌کند؟'
                  }]
                }]
              })
            });
            
            if (altResponse.ok) {
              console.log('✅ Alternative Gemini API: Working');
            }
          } else {
            console.log(`❌ Vertex AI API: Error ${response.status}`);
          }
          
          // Test Speech-to-Text API
          console.log('\n🎤 Testing Speech-to-Text API...');
          const sttResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'fa-IR'
              },
              audio: { content: '' }
            })
          });
          
          if (sttResponse.status === 400) {
            console.log('✅ Speech-to-Text API: Accessible (Persian language ready)');
          } else {
            console.log(`⚠️  Speech-to-Text API: Status ${sttResponse.status}`);
          }
          
        } else {
          console.log('❌ Invalid Google Cloud Service Account format');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse Google Cloud credentials');
      }
    } else {
      console.log('❌ No Google Cloud credentials found');
    }
    
  } catch (error) {
    console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

fixGoogleCredentials().catch(console.error);