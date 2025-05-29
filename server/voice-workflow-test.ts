import { Express } from "express";
import { aegisLogger, EventType, LogLevel } from "./aegis-logger";
import { novaAIEngine } from "./nova-ai-engine";
import { db } from "./db";
import { crmInteractions, crmVoiceNotes } from "@shared/schema";

export function registerVoiceWorkflowTests(app: Express) {

  // Test 1: Complete Voice Processing Pipeline Success
  app.post("/api/test/voice-workflow-success", async (req, res) => {
    const startTime = Date.now();
    const testId = `voice_test_${Date.now()}`;
    
    aegisLogger.log({
      eventType: EventType.VOICE_PROCESSING,
      level: LogLevel.INFO,
      source: 'VoiceWorkflowTest',
      message: 'Starting complete voice processing pipeline test',
      requestId: testId,
      metadata: { 
        testType: 'voice_workflow_success',
        sampleAudio: 'persian_customer_complaint.wav'
      }
    });

    try {
      // Step 1: Simulate Audio Upload
      const audioUrl = 'https://test-storage.marfanet.com/voice_samples/persian_complaint_001.wav';
      aegisLogger.log({
        eventType: EventType.FILE_OPERATION,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Audio file received for processing',
        requestId: testId,
        metadata: { audioUrl, audioSize: '2.3MB', duration: '45s' }
      });

      // Step 2: Simulate STT Service Call
      const sttStartTime = Date.now();
      aegisLogger.logAIRequest('VoiceWorkflowTest', 'STT-Service', 'Persian voice transcription request', {
        requestId: testId,
        audioLanguage: 'fa-IR',
        audioDuration: 45
      });

      // Simulate successful STT response
      await new Promise(resolve => setTimeout(resolve, 150)); // Simulate processing time
      const transcription = "سلام، من نماینده شماره ۱۲۳۴ هستم. متأسفانه مشکلی با سرویس اینترنت دارم که از دیروز شروع شده. سرعت خیلی کند شده و نمی‌تونم به درستی کار کنم. لطفاً کمکم کنید.";
      
      aegisLogger.logAIResponse('VoiceWorkflowTest', 'STT-Service', { transcription }, Date.now() - sttStartTime, {
        requestId: testId,
        transcriptionLength: transcription.length,
        confidence: 0.94
      });

      // Step 3: Simulate Sentiment Analysis Call
      const sentimentStartTime = Date.now();
      aegisLogger.logAIRequest('VoiceWorkflowTest', 'Sentiment-Grok', 'Persian sentiment analysis request', {
        requestId: testId,
        textLength: transcription.length
      });

      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
      const sentimentResult = {
        score: -0.6,
        label: 'منفی',
        confidence: 0.87,
        emotions: ['frustration', 'urgency'],
        urgencyLevel: 'high'
      };

      aegisLogger.logAIResponse('VoiceWorkflowTest', 'Sentiment-Grok', sentimentResult, Date.now() - sentimentStartTime, {
        requestId: testId,
        sentimentScore: sentimentResult.score,
        urgencyDetected: true
      });

      // Step 4: Extract Key Information
      const keyTopics = ['اینترنت', 'سرعت کند', 'مشکل فنی', 'نماینده'];
      const aiSuggestions = [
        'تماس فوری برای بررسی وضعیت خط',
        'تست سرعت از سمت دیتاسنتر',
        'ارائه راهکار موقت',
        'پیگیری در ۲۴ ساعت آینده'
      ];

      // Step 5: Database Storage
      const dbStartTime = Date.now();
      aegisLogger.log({
        eventType: EventType.DATABASE_OPERATION,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Storing voice processing results in database',
        requestId: testId,
        metadata: { operation: 'INSERT', tables: ['crmVoiceNotes', 'crmInteractions'] }
      });

      // Simulate successful database storage
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const voiceNoteId = Math.floor(Math.random() * 10000);
      const interactionId = Math.floor(Math.random() * 10000);

      aegisLogger.log({
        eventType: EventType.DATABASE_OPERATION,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Voice processing results stored successfully',
        requestId: testId,
        metadata: { 
          voiceNoteId,
          interactionId,
          dbResponseTime: Date.now() - dbStartTime
        },
        performanceData: {
          duration: Date.now() - dbStartTime
        }
      });

      const totalDuration = Date.now() - startTime;
      
      aegisLogger.log({
        eventType: EventType.VOICE_PROCESSING,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Voice processing pipeline completed successfully',
        requestId: testId,
        metadata: {
          totalDuration,
          stepsCompleted: 5,
          finalResult: 'success'
        },
        performanceData: {
          duration: totalDuration
        }
      });

      res.json({
        success: true,
        testId,
        totalDuration,
        pipeline: {
          audioUpload: { status: 'success', duration: '50ms' },
          speechToText: { status: 'success', duration: '150ms', confidence: 0.94 },
          sentimentAnalysis: { status: 'success', duration: '200ms', confidence: 0.87 },
          databaseStorage: { status: 'success', duration: '50ms' }
        },
        results: {
          transcription,
          sentiment: sentimentResult,
          keyTopics,
          aiSuggestions,
          voiceNoteId,
          interactionId
        }
      });

    } catch (error) {
      aegisLogger.error('VoiceWorkflowTest', 'Voice processing pipeline failed', error, {
        requestId: testId,
        stage: 'unknown',
        totalDuration: Date.now() - startTime
      });

      res.status(500).json({
        success: false,
        testId,
        error: error.message
      });
    }
  });

  // Test 2: STT Service Failure Simulation
  app.post("/api/test/voice-workflow-stt-failure", async (req, res) => {
    const testId = `stt_failure_${Date.now()}`;
    const startTime = Date.now();

    aegisLogger.log({
      eventType: EventType.VOICE_PROCESSING,
      level: LogLevel.INFO,
      source: 'VoiceWorkflowTest',
      message: 'Testing STT service failure scenario',
      requestId: testId,
      metadata: { testType: 'stt_failure_simulation' }
    });

    try {
      // Step 1: Audio received successfully
      const audioUrl = 'https://test-storage.marfanet.com/voice_samples/persian_complaint_002.wav';
      aegisLogger.log({
        eventType: EventType.FILE_OPERATION,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Audio file received',
        requestId: testId,
        metadata: { audioUrl }
      });

      // Step 2: STT Service failure
      const sttStartTime = Date.now();
      aegisLogger.logAIRequest('VoiceWorkflowTest', 'STT-Service', 'Persian voice transcription request', {
        requestId: testId
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const sttError = new Error('STT service timeout after 30 seconds');
      sttError.name = 'STTServiceTimeoutError';
      
      aegisLogger.logAIError('VoiceWorkflowTest', 'STT-Service', sttError, {
        requestId: testId,
        serviceUrl: 'https://stt-api.service.com/v1/transcribe',
        timeoutThreshold: 30000,
        actualDuration: Date.now() - sttStartTime,
        retryAttempts: 0
      });

      // Pipeline stops here - no further processing possible
      aegisLogger.log({
        eventType: EventType.VOICE_PROCESSING,
        level: LogLevel.ERROR,
        source: 'VoiceWorkflowTest',
        message: 'Voice processing pipeline failed at STT stage',
        requestId: testId,
        metadata: {
          failedStage: 'speech_to_text',
          stepsCompleted: 1,
          totalSteps: 5,
          finalResult: 'failure'
        },
        errorData: {
          stage: 'stt',
          details: sttError.message
        }
      });

      res.status(503).json({
        success: false,
        testId,
        error: 'STT service unavailable',
        failedStage: 'speech_to_text',
        pipeline: {
          audioUpload: { status: 'success' },
          speechToText: { status: 'failed', error: 'Service timeout' },
          sentimentAnalysis: { status: 'skipped' },
          databaseStorage: { status: 'skipped' }
        },
        totalDuration: Date.now() - startTime
      });

    } catch (error) {
      res.status(500).json({ success: false, testId, error: error.message });
    }
  });

  // Test 3: Sentiment Analysis Failure Simulation
  app.post("/api/test/voice-workflow-sentiment-failure", async (req, res) => {
    const testId = `sentiment_failure_${Date.now()}`;
    const startTime = Date.now();

    aegisLogger.log({
      eventType: EventType.VOICE_PROCESSING,
      level: LogLevel.INFO,
      source: 'VoiceWorkflowTest',
      message: 'Testing sentiment analysis failure scenario',
      requestId: testId,
      metadata: { testType: 'sentiment_failure_simulation' }
    });

    try {
      // Steps 1-2: Audio and STT successful
      const transcription = "سلام، سرویس خوب کار می‌کنه ولی یه سوالی داشتم در مورد تنظیمات.";
      
      aegisLogger.logAIResponse('VoiceWorkflowTest', 'STT-Service', { transcription }, 120, {
        requestId: testId,
        confidence: 0.96
      });

      // Step 3: Sentiment analysis failure
      const sentimentStartTime = Date.now();
      aegisLogger.logAIRequest('VoiceWorkflowTest', 'Sentiment-Grok', 'Persian sentiment analysis request', {
        requestId: testId,
        textLength: transcription.length
      });

      await new Promise(resolve => setTimeout(resolve, 80));

      const sentimentError = new Error('Unparseable response from sentiment analysis service');
      sentimentError.name = 'SentimentAnalysisError';

      aegisLogger.logAIError('VoiceWorkflowTest', 'Sentiment-Grok', sentimentError, {
        requestId: testId,
        serviceResponse: '{"error": "invalid_input_format"}',
        retryAttempts: 1
      });

      // Continue with partial results
      aegisLogger.log({
        eventType: EventType.VOICE_PROCESSING,
        level: LogLevel.WARN,
        source: 'VoiceWorkflowTest',
        message: 'Voice processing continuing with partial results',
        requestId: testId,
        metadata: {
          failedStage: 'sentiment_analysis',
          stepsCompleted: 2,
          totalSteps: 5,
          continuingWithPartialData: true
        }
      });

      res.json({
        success: true,
        testId,
        warnings: ['Sentiment analysis failed - continuing with transcription only'],
        pipeline: {
          audioUpload: { status: 'success' },
          speechToText: { status: 'success', confidence: 0.96 },
          sentimentAnalysis: { status: 'failed', error: 'Service error' },
          databaseStorage: { status: 'success', note: 'Stored with partial data' }
        },
        results: {
          transcription,
          sentiment: null,
          keyTopics: ['سرویس', 'تنظیمات', 'سوال'],
          aiSuggestions: ['پاسخ به سوال تنظیمات', 'راهنمایی کامل ارائه شود']
        },
        totalDuration: Date.now() - startTime
      });

    } catch (error) {
      res.status(500).json({ success: false, testId, error: error.message });
    }
  });

  // Test 4: Database Storage Failure Simulation
  app.post("/api/test/voice-workflow-db-failure", async (req, res) => {
    const testId = `db_failure_${Date.now()}`;
    const startTime = Date.now();

    try {
      // Steps 1-3: All AI processing successful
      const transcription = "درود، ممنون از خدماتتون. همه چیز عالیه.";
      const sentiment = { score: 0.8, label: 'مثبت', confidence: 0.92 };

      aegisLogger.logAIResponse('VoiceWorkflowTest', 'STT-Service', { transcription }, 110, {
        requestId: testId
      });
      
      aegisLogger.logAIResponse('VoiceWorkflowTest', 'Sentiment-Grok', sentiment, 180, {
        requestId: testId
      });

      // Step 4: Database failure
      const dbStartTime = Date.now();
      aegisLogger.log({
        eventType: EventType.DATABASE_OPERATION,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Attempting to store voice processing results',
        requestId: testId,
        metadata: { operation: 'INSERT' }
      });

      await new Promise(resolve => setTimeout(resolve, 30));

      const dbError = new Error('Connection to database lost');
      dbError.name = 'DatabaseConnectionError';

      aegisLogger.error('VoiceWorkflowTest', 'Failed to store voice processing results', dbError, {
        requestId: testId,
        operation: 'INSERT',
        table: 'crmVoiceNotes',
        connectionPool: 'primary',
        retryAttempts: 2
      });

      res.status(500).json({
        success: false,
        testId,
        error: 'Database storage failed',
        pipeline: {
          audioUpload: { status: 'success' },
          speechToText: { status: 'success' },
          sentimentAnalysis: { status: 'success' },
          databaseStorage: { status: 'failed', error: 'Connection lost' }
        },
        processedData: {
          transcription,
          sentiment,
          note: 'Data processed successfully but not persisted'
        },
        totalDuration: Date.now() - startTime
      });

    } catch (error) {
      res.status(500).json({ success: false, testId, error: error.message });
    }
  });

  // Test 5: Concurrent Processing Test
  app.post("/api/test/voice-workflow-concurrent", async (req, res) => {
    const concurrentTests = 3;
    const results = [];

    aegisLogger.log({
      eventType: EventType.PERFORMANCE,
      level: LogLevel.INFO,
      source: 'VoiceWorkflowTest',
      message: `Starting concurrent voice processing test with ${concurrentTests} simultaneous requests`,
      metadata: { testType: 'concurrent_processing', concurrentRequests: concurrentTests }
    });

    const promises = Array.from({ length: concurrentTests }, async (_, index) => {
      const testId = `concurrent_${Date.now()}_${index}`;
      const startTime = Date.now();

      try {
        // Simulate concurrent voice processing
        aegisLogger.logAIRequest('VoiceWorkflowTest', 'STT-Service', `Concurrent request ${index + 1}`, {
          requestId: testId,
          concurrentIndex: index + 1
        });

        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        aegisLogger.logAIResponse('VoiceWorkflowTest', 'STT-Service', { success: true }, Date.now() - startTime, {
          requestId: testId,
          concurrentIndex: index + 1
        });

        return {
          testId,
          index: index + 1,
          duration: Date.now() - startTime,
          status: 'success'
        };
      } catch (error) {
        return {
          testId,
          index: index + 1,
          duration: Date.now() - startTime,
          status: 'failed',
          error: error.message
        };
      }
    });

    try {
      const results = await Promise.all(promises);
      const totalDuration = Math.max(...results.map(r => r.duration));
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

      aegisLogger.log({
        eventType: EventType.PERFORMANCE,
        level: LogLevel.INFO,
        source: 'VoiceWorkflowTest',
        message: 'Concurrent voice processing test completed',
        metadata: {
          concurrentRequests: concurrentTests,
          successfulRequests: results.filter(r => r.status === 'success').length,
          averageDuration: avgDuration,
          maxDuration: totalDuration
        },
        performanceData: {
          duration: totalDuration
        }
      });

      res.json({
        success: true,
        concurrentRequests: concurrentTests,
        results,
        performance: {
          averageDuration: Math.round(avgDuration),
          maxDuration: totalDuration,
          minDuration: Math.min(...results.map(r => r.duration)),
          successRate: (results.filter(r => r.status === 'success').length / concurrentTests) * 100
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Concurrent test execution failed',
        message: error.message
      });
    }
  });
}