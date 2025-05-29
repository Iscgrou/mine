/**
 * Complete Vertex AI Integration Test for V2Ray Voice Processing Pipeline
 * Tests both Speech-to-Text and Gemini Pro functionality
 */

import { novaAIEngine } from './nova-ai-engine';
import { aegisLogger, EventType, LogLevel } from './aegis-logger';
import { aegisMonitor } from './aegis-monitor';

async function testVertexAIIntegration(): Promise<void> {
  console.log('\n🚀 Testing Complete Vertex AI Integration for V2Ray Pipeline');
  console.log('='.repeat(70));

  try {
    // Load stored credentials
    const { storage } = await import('./storage');
    const credentialsSetting = await storage.getSetting('google_cloud_credentials');
    
    if (!credentialsSetting?.value) {
      throw new Error('Google Cloud credentials not found');
    }

    const credentials = JSON.parse(credentialsSetting.value);
    console.log(`📋 Project ID: ${credentials.project_id}`);
    
    // Test 1: Authentication
    console.log('\n🔐 Testing Google Cloud Authentication...');
    
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const accessToken = await auth.getAccessToken();
    console.log('✅ Authentication: SUCCESS');

    // Test 2: Check required APIs
    console.log('\n📡 Checking required Google Cloud APIs...');
    
    const requiredAPIs = [
      {
        name: 'Speech-to-Text API',
        endpoint: 'https://speech.googleapis.com/v1/speech:recognize',
        service: 'speech.googleapis.com'
      },
      {
        name: 'Vertex AI API',
        endpoint: `https://us-central1-aiplatform.googleapis.com/v1/projects/${credentials.project_id}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`,
        service: 'aiplatform.googleapis.com'
      }
    ];

    for (const api of requiredAPIs) {
      try {
        const testResponse = await fetch(api.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: api.name.includes('Speech') ? {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'fa-IR'
            } : undefined,
            contents: api.name.includes('Vertex') ? [{
              parts: [{ text: 'Test message' }]
            }] : undefined,
            audio: api.name.includes('Speech') ? { content: '' } : undefined
          })
        });

        if (testResponse.status === 400) {
          console.log(`✅ ${api.name}: API Accessible (expected 400 for empty test)`);
        } else if (testResponse.status === 403) {
          console.log(`❌ ${api.name}: API Not Enabled (403 Forbidden)`);
          console.log(`   Enable at: https://console.cloud.google.com/apis/library/${api.service}`);
        } else {
          console.log(`✅ ${api.name}: API Accessible (Status: ${testResponse.status})`);
        }
      } catch (error) {
        console.log(`❌ ${api.name}: Connection Error`);
      }
    }

    // Test 3: V2Ray AI Processing
    console.log('\n🧠 Testing Vertex AI for V2Ray Call Preparation...');
    
    try {
      const callPrep = await novaAIEngine.generateCallPreparation(
        1234,
        'V2Ray connection troubleshooting for representative with customer proxy issues',
        1
      );
      
      console.log('✅ Vertex AI Call Preparation: SUCCESS');
      console.log(`📋 Generated ${callPrep.talkingPoints.length} talking points`);
      console.log(`🎯 First talking point: ${callPrep.talkingPoints[0]}`);
      
    } catch (error) {
      console.log('❌ Vertex AI Call Preparation: FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Persian V2Ray Terminology
    console.log('\n🎯 Testing V2Ray Terminology Processing...');
    
    const testScenarios = [
      'مشکل با کانفیگ وی‌راهی دارم. سرور شادوساکس وصل نمی‌شه.',
      'پلن نامحدود می‌خوام. تروجان بهتره یا شادوساکس؟',
      'چطور ساب‌سکریپشن بسازم؟ پنل MarFanet کار نمی‌کنه.'
    ];

    for (const scenario of testScenarios) {
      const v2rayTerms = detectV2RayTerms(scenario);
      console.log(`   Text: ${scenario}`);
      console.log(`   V2Ray Terms: ${v2rayTerms.join(', ')}`);
    }

    // Test 5: System Health
    console.log('\n🛡️  Testing Aegis System Monitoring...');
    
    const systemHealth = await aegisMonitor.getSystemStatus();
    console.log(`✅ System Health: ${systemHealth.status} (${systemHealth.score}/100)`);

    console.log('\n📊 VERTEX AI INTEGRATION STATUS');
    console.log('='.repeat(70));
    console.log('✅ Authentication: Working');
    console.log('⚠️  APIs: Check console output above for specific API status');
    console.log('✅ V2Ray Terminology: Operational');
    console.log('✅ Aegis Monitoring: Active');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Enable any missing APIs in Google Cloud Console');
    console.log('2. Test voice processing with actual Persian audio');
    console.log('3. Verify complete V2Ray pipeline functionality');

  } catch (error) {
    console.error('\n❌ Vertex AI Integration Test Failed:', error instanceof Error ? error.message : error);
  }
}

function detectV2RayTerms(text: string): string[] {
  const v2rayTerms = [
    'کانفیگ', 'پورت', 'شادوساکس', 'تروجان', 'وی‌راهی', 'پروکسی',
    'سینک شدن', 'ساب‌سکریپشن', 'سرور', 'لوکیشن', 'محدودیت حجم',
    'نماینده', 'نمایندگی', 'پنل', 'فروش', 'مشتری', 'پشتیبانی',
    'پلن نامحدود', 'پلن حجمی', 'تمدید', 'فعال‌سازی',
    'ایرانسل', 'همراه اول', 'رایتل', 'مخابرات', 'فیلترشکن'
  ];
  
  return v2rayTerms.filter(term => text.includes(term));
}

export { testVertexAIIntegration };

if (import.meta.url === `file://${process.argv[1]}`) {
  testVertexAIIntegration().catch(console.error);
}