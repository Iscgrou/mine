import { db } from "./db";
import { sql } from "drizzle-orm";

// Event Types for Comprehensive Logging
export enum EventType {
  // Frontend Events
  USER_INTERACTION = 'user_interaction',
  NAVIGATION = 'navigation',
  FORM_SUBMISSION = 'form_submission',
  API_CALL = 'api_call',
  ERROR = 'error',
  PERFORMANCE = 'performance',
  
  // Backend Events
  DATABASE_OPERATION = 'database_operation',
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  AUTHENTICATION = 'authentication',
  FILE_OPERATION = 'file_operation',
  
  // AI Events (for Nova monitoring)
  AI_REQUEST = 'ai_request',
  AI_RESPONSE = 'ai_response',
  AI_FEEDBACK = 'ai_feedback',
  
  // CRM Events
  CRM_INTERACTION = 'crm_interaction',
  VOICE_PROCESSING = 'voice_processing',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  
  // System Events
  SYSTEM_HEALTH = 'system_health',
  BACKUP_OPERATION = 'backup_operation',
  NOTIFICATION = 'notification'
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
  CRITICAL = 'critical'
}

export interface AegisLogEntry {
  timestamp: Date;
  eventType: EventType;
  level: LogLevel;
  source: string; // component/module that generated the event
  userId?: number;
  sessionId?: string;
  message: string;
  metadata?: Record<string, any>;
  requestId?: string;
  performanceData?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  errorData?: {
    stack?: string;
    code?: string;
    details?: any;
  };
}

class AegisLogger {
  private logBuffer: AegisLogEntry[] = [];
  private flushInterval: NodeJS.Timeout;
  
  constructor() {
    // Flush logs every 30 seconds to prevent memory buildup
    this.flushInterval = setInterval(() => this.flushLogs(), 30000);
  }

  log(entry: Omit<AegisLogEntry, 'timestamp'>): void {
    const logEntry: AegisLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    this.logBuffer.push(logEntry);

    // Immediate flush for critical errors
    if (entry.level === LogLevel.CRITICAL || entry.level === LogLevel.ERROR) {
      this.flushLogs();
    }

    // Flush when buffer is full (reduce buffer size to prevent memory leaks)
    if (this.logBuffer.length >= 25) {
      this.flushLogs();
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AEGIS ${entry.level.toUpperCase()}] ${entry.source}: ${entry.message}`, 
        entry.metadata ? entry.metadata : '');
    }
  }

  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Store in database for persistent logging
      await this.storeLogs(logsToFlush);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put logs back in buffer if flush failed
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private async storeLogs(logs: AegisLogEntry[]): Promise<void> {
    try {
      // Create logs table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aegis_logs (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          event_type VARCHAR(50) NOT NULL,
          level VARCHAR(20) NOT NULL,
          source VARCHAR(100) NOT NULL,
          user_id INTEGER,
          session_id VARCHAR(100),
          message TEXT NOT NULL,
          metadata JSONB,
          request_id VARCHAR(100),
          performance_data JSONB,
          error_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Insert logs in batch
      for (const log of logs) {
        await db.execute(sql`
          INSERT INTO aegis_logs (
            timestamp, event_type, level, source, user_id, session_id, 
            message, metadata, request_id, performance_data, error_data
          ) VALUES (
            ${log.timestamp}, ${log.eventType}, ${log.level}, ${log.source},
            ${log.userId || null}, ${log.sessionId || null}, ${log.message},
            ${JSON.stringify(log.metadata || {})}, ${log.requestId || null},
            ${JSON.stringify(log.performanceData || {})}, 
            ${JSON.stringify(log.errorData || {})}
          )
        `);
      }
    } catch (error) {
      console.error('Database logging failed:', error);
    }
  }

  // Convenience methods for different log levels
  info(source: string, message: string, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.SYSTEM_HEALTH,
      level: LogLevel.INFO,
      source,
      message,
      metadata
    });
  }

  warn(source: string, message: string, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.ERROR,
      level: LogLevel.WARN,
      source,
      message,
      metadata
    });
  }

  error(source: string, message: string, error?: any, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.ERROR,
      level: LogLevel.ERROR,
      source,
      message,
      metadata,
      errorData: error ? {
        stack: error.stack,
        code: error.code,
        details: error
      } : undefined
    });
  }

  critical(source: string, message: string, error?: any, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.ERROR,
      level: LogLevel.CRITICAL,
      source,
      message,
      metadata,
      errorData: error ? {
        stack: error.stack,
        code: error.code,
        details: error
      } : undefined
    });
  }

  // AI-specific logging for Nova monitoring
  logAIRequest(source: string, aiService: string, prompt: string, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.AI_REQUEST,
      level: LogLevel.INFO,
      source,
      message: `AI request to ${aiService}`,
      metadata: {
        aiService,
        promptLength: prompt.length,
        ...metadata
      }
    });
  }

  logAIResponse(source: string, aiService: string, response: any, duration: number, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.AI_RESPONSE,
      level: LogLevel.INFO,
      source,
      message: `AI response from ${aiService}`,
      metadata: {
        aiService,
        responseLength: typeof response === 'string' ? response.length : JSON.stringify(response).length,
        success: true,
        ...metadata
      },
      performanceData: {
        duration
      }
    });
  }

  logAIError(source: string, aiService: string, error: any, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.AI_RESPONSE,
      level: LogLevel.ERROR,
      source,
      message: `AI error from ${aiService}`,
      metadata: {
        aiService,
        success: false,
        ...metadata
      },
      errorData: {
        stack: error.stack,
        code: error.code,
        details: error
      }
    });
  }

  // CRM-specific logging for Nova
  logCRMInteraction(source: string, interactionType: string, representativeId: number, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.CRM_INTERACTION,
      level: LogLevel.INFO,
      source,
      message: `CRM interaction: ${interactionType}`,
      metadata: {
        interactionType,
        representativeId,
        ...metadata
      }
    });
  }

  logVoiceProcessing(source: string, audioUrl: string, processingResult: any, metadata?: Record<string, any>): void {
    this.log({
      eventType: EventType.VOICE_PROCESSING,
      level: LogLevel.INFO,
      source,
      message: 'Voice note processed',
      metadata: {
        audioUrl,
        transcriptionLength: processingResult.transcription?.length || 0,
        sentimentScore: processingResult.sentiment?.score,
        ...metadata
      }
    });
  }

  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // Final flush
    // Clear buffer to free memory immediately
    this.logBuffer = [];
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Emergency memory cleanup function
  emergencyCleanup(): void {
    console.log('[AEGIS EMERGENCY] Performing emergency memory cleanup');
    this.logBuffer = [];
    if (global.gc) {
      global.gc();
    }
  }
}

// Global logger instance
export const aegisLogger = new AegisLogger();

// Graceful shutdown
process.on('SIGTERM', () => {
  aegisLogger.cleanup();
});

process.on('SIGINT', () => {
  aegisLogger.cleanup();
});