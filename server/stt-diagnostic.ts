import { Express } from "express";
import { aegisLogger, EventType, LogLevel } from "./aegis-logger";

export function registerSTTDiagnostic(app: Express) {
  
  // STT Configuration Diagnostic Endpoint
  app.get("/api/test/stt-config", async (req, res) => {
    const testId = `stt_diagnostic_${Date.now()}`;
    
    aegisLogger.log({
      eventType: EventType.SYSTEM_HEALTH,
      level: LogLevel.INFO,
      source: 'STTDiagnostic',
      message: 'Starting STT configuration diagnostic',
      requestId: testId
    });

    try {
      // Check environment variables
      const sttApiKey = process.env.STT_API_KEY;
      const hasCredentials = !!sttApiKey;
      
      const diagnosticResult = {
        timestamp: new Date().toISOString(),
        testId,
        configuration: {
          apiKeyConfigured: hasCredentials,
          apiKeyLength: hasCredentials ? sttApiKey.length : 0,
          apiKeyPrefix: hasCredentials ? sttApiKey.substring(0, 8) + "..." : "Not configured"
        },
        endpoints: {
          targetService: "OpenAI Whisper API",
          baseUrl: "https://api.openai.com/v1/audio/transcriptions",
          method: "POST",
          expectedFormat: "multipart/form-data"
        },
        supportedLanguages: {
          persian: "fa",
          fallback: "auto"
        }
      };

      aegisLogger.log({
        eventType: EventType.SYSTEM_HEALTH,
        level: LogLevel.INFO,
        source: 'STTDiagnostic',
        message: 'STT configuration analysis completed',
        requestId: testId,
        metadata: {
          hasCredentials,
          serviceEndpoint: diagnosticResult.endpoints.baseUrl
        }
      });

      res.json({
        success: true,
        diagnostic: diagnosticResult,
        recommendation: hasCredentials ? 
          "Credentials configured - ready for audio processing test" :
          "STT_API_KEY not found in environment variables"
      });

    } catch (error) {
      aegisLogger.error('STTDiagnostic', 'Configuration diagnostic failed', error, {
        requestId: testId
      });

      res.status(500).json({
        success: false,
        testId,
        error: "Diagnostic failed",
        message: error.message
      });
    }
  });

  // STT Service Connection Test
  app.post("/api/test/stt-connection", async (req, res) => {
    const testId = `stt_connection_${Date.now()}`;
    const startTime = Date.now();

    aegisLogger.log({
      eventType: EventType.API_REQUEST,
      level: LogLevel.INFO,
      source: 'STTDiagnostic',
      message: 'Testing STT service connection',
      requestId: testId
    });

    try {
      const sttApiKey = process.env.STT_API_KEY;
      
      if (!sttApiKey) {
        throw new Error('STT_API_KEY not configured');
      }

      // Test connection with a minimal request to validate credentials
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sttApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const connectionTest = {
        statusCode: testResponse.status,
        statusText: testResponse.statusText,
        headers: {
          contentType: testResponse.headers.get('content-type'),
          server: testResponse.headers.get('server')
        }
      };

      if (testResponse.ok) {
        const responseData = await testResponse.json();
        
        aegisLogger.log({
          eventType: EventType.API_RESPONSE,
          level: LogLevel.INFO,
          source: 'STTDiagnostic',
          message: 'STT service connection successful',
          requestId: testId,
          metadata: {
            responseTime: Date.now() - startTime,
            modelsAvailable: responseData.data?.length || 0
          }
        });

        res.json({
          success: true,
          testId,
          connection: connectionTest,
          serviceStatus: "Connected successfully",
          responseTime: Date.now() - startTime,
          whisperModelsAvailable: responseData.data?.filter(model => 
            model.id.includes('whisper')).length || 0
        });

      } else {
        const errorText = await testResponse.text();
        
        aegisLogger.error('STTDiagnostic', 'STT service connection failed', null, {
          requestId: testId,
          statusCode: testResponse.status,
          errorResponse: errorText,
          responseTime: Date.now() - startTime
        });

        res.status(testResponse.status).json({
          success: false,
          testId,
          connection: connectionTest,
          error: `API returned ${testResponse.status}: ${testResponse.statusText}`,
          errorDetails: errorText,
          responseTime: Date.now() - startTime
        });
      }

    } catch (error) {
      aegisLogger.error('STTDiagnostic', 'STT connection test failed', error, {
        requestId: testId,
        responseTime: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        testId,
        error: error.message,
        responseTime: Date.now() - startTime,
        recommendation: "Check API credentials and network connectivity"
      });
    }
  });

  // STT Audio Processing Test
  app.post("/api/test/stt-audio-process", async (req, res) => {
    const { textToSpeak } = req.body;
    const testId = `stt_audio_${Date.now()}`;
    const startTime = Date.now();

    aegisLogger.log({
      eventType: EventType.VOICE_PROCESSING,
      level: LogLevel.INFO,
      source: 'STTDiagnostic',
      message: 'Testing STT audio processing',
      requestId: testId,
      metadata: { inputText: textToSpeak || 'Default test' }
    });

    try {
      const sttApiKey = process.env.STT_API_KEY;
      
      if (!sttApiKey) {
        throw new Error('STT_API_KEY not configured');
      }

      // Create a simple test audio blob (silent audio for testing)
      const testAudioData = new ArrayBuffer(44100 * 2); // 1 second of silent audio
      const formData = new FormData();
      formData.append('file', new Blob([testAudioData], { type: 'audio/wav' }), 'test.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'fa');

      aegisLogger.logAIRequest('STTDiagnostic', 'OpenAI-Whisper', 'Test audio processing', {
        requestId: testId,
        audioSize: testAudioData.byteLength,
        language: 'fa'
      });

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sttApiKey}`,
        },
        body: formData
      });

      const processingResult = {
        statusCode: response.status,
        statusText: response.statusText,
        responseTime: Date.now() - startTime
      };

      if (response.ok) {
        const result = await response.json();
        
        aegisLogger.logAIResponse('STTDiagnostic', 'OpenAI-Whisper', result, Date.now() - startTime, {
          requestId: testId,
          transcriptionReceived: !!result.text
        });

        res.json({
          success: true,
          testId,
          processing: processingResult,
          transcription: result.text || '',
          serviceStatus: "Audio processing endpoint operational",
          note: "Test completed with silent audio - ready for real audio files"
        });

      } else {
        const errorText = await response.text();
        
        aegisLogger.logAIError('STTDiagnostic', 'OpenAI-Whisper', new Error(errorText), {
          requestId: testId,
          statusCode: response.status,
          responseTime: Date.now() - startTime
        });

        res.status(response.status).json({
          success: false,
          testId,
          processing: processingResult,
          error: `STT processing failed: ${response.status}`,
          errorDetails: errorText
        });
      }

    } catch (error) {
      aegisLogger.error('STTDiagnostic', 'STT audio processing test failed', error, {
        requestId: testId,
        responseTime: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        testId,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    }
  });
}