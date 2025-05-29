import { Express } from "express";
import { aegisLogger, EventType, LogLevel } from "./aegis-logger";

// Test endpoints for Error Detection validation
export function registerTestEndpoints(app: Express) {
  
  // Test 1: Simulated 500 Internal Server Error
  app.get("/api/test/server-error", (req, res) => {
    aegisLogger.log({
      eventType: EventType.API_REQUEST,
      level: LogLevel.INFO,
      source: 'TestEndpoint',
      message: 'Simulated server error endpoint accessed',
      metadata: { testType: 'server_error_simulation' }
    });

    // Simulate a critical server error
    const error = new Error('Simulated database connection failure');
    error.name = 'DatabaseConnectionError';
    
    aegisLogger.critical('TestEndpoint', 'Simulated critical server error for testing', error, {
      endpoint: '/api/test/server-error',
      errorType: 'database_connection',
      severity: 'critical'
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Database connection failed - simulated error for Aegis testing',
      code: 'DB_CONNECTION_FAILED',
      timestamp: new Date().toISOString()
    });
  });

  // Test 2: Simulated 401 Unauthorized Error
  app.get("/api/test/auth-error", (req, res) => {
    aegisLogger.log({
      eventType: EventType.AUTHENTICATION,
      level: LogLevel.WARN,
      source: 'TestEndpoint',
      message: 'Simulated authentication failure',
      metadata: { 
        testType: 'auth_error_simulation',
        requestPath: '/api/test/auth-error',
        userAgent: req.get('User-Agent')
      }
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token - simulated for Aegis testing',
      code: 'AUTH_TOKEN_INVALID',
      timestamp: new Date().toISOString()
    });
  });

  // Test 3: Simulated 400 Bad Request Error
  app.post("/api/test/validation-error", (req, res) => {
    aegisLogger.log({
      eventType: EventType.API_REQUEST,
      level: LogLevel.INFO,
      source: 'TestEndpoint',
      message: 'Validation error test endpoint accessed',
      metadata: { 
        testType: 'validation_error_simulation',
        requestBody: req.body
      }
    });

    const validationError = {
      field: 'email',
      message: 'Invalid email format',
      receivedValue: req.body?.email || 'undefined'
    };

    aegisLogger.error('TestEndpoint', 'Simulated validation error for testing', validationError, {
      endpoint: '/api/test/validation-error',
      errorType: 'validation_error',
      validationFailures: [validationError]
    });

    res.status(400).json({
      error: 'Bad Request',
      message: 'Validation failed - simulated for Aegis testing',
      code: 'VALIDATION_FAILED',
      details: validationError,
      timestamp: new Date().toISOString()
    });
  });

  // Test 4: Simulated AI Service Timeout
  app.post("/api/test/ai-timeout", async (req, res) => {
    const startTime = Date.now();
    
    aegisLogger.logAIRequest('TestEndpoint', 'MockAI', 'Simulated AI timeout test', {
      testType: 'ai_timeout_simulation'
    });

    // Simulate a long-running AI request that times out
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay

    const error = new Error('AI service timeout after 30 seconds');
    error.name = 'AIServiceTimeoutError';
    
    aegisLogger.logAIError('TestEndpoint', 'MockAI', error, {
      requestDuration: Date.now() - startTime,
      timeoutThreshold: 30000,
      errorType: 'timeout'
    });

    res.status(504).json({
      error: 'Gateway Timeout',
      message: 'AI service timeout - simulated for Aegis testing',
      code: 'AI_SERVICE_TIMEOUT',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  });

  // Test 5: Memory Pressure Simulation
  app.get("/api/test/memory-pressure", (req, res) => {
    const memUsage = process.memoryUsage();
    
    aegisLogger.log({
      eventType: EventType.PERFORMANCE,
      level: LogLevel.WARN,
      source: 'TestEndpoint',
      message: 'Simulated memory pressure test',
      metadata: { 
        testType: 'memory_pressure_simulation',
        currentMemoryUsage: memUsage
      },
      performanceData: {
        memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      }
    });

    // Simulate high memory usage warning
    if ((memUsage.heapUsed / memUsage.heapTotal) > 0.8) {
      aegisLogger.warn('TestEndpoint', 'High memory usage detected during simulation', {
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        recommendation: 'Monitor for memory leaks'
      });
    }

    res.json({
      message: 'Memory pressure test completed',
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      timestamp: new Date().toISOString()
    });
  });

  // Test 6: Database Transaction Failure
  app.post("/api/test/db-transaction-error", async (req, res) => {
    aegisLogger.log({
      eventType: EventType.DATABASE_OPERATION,
      level: LogLevel.INFO,
      source: 'TestEndpoint',
      message: 'Simulated database transaction test started',
      metadata: { testType: 'db_transaction_error_simulation' }
    });

    // Simulate a database transaction that fails
    const error = new Error('Foreign key constraint violation');
    error.name = 'DatabaseConstraintError';
    
    aegisLogger.error('TestEndpoint', 'Simulated database transaction failure', error, {
      operation: 'INSERT',
      table: 'test_transactions',
      errorType: 'constraint_violation',
      sqlState: '23503'
    });

    res.status(500).json({
      error: 'Database Transaction Failed',
      message: 'Foreign key constraint violation - simulated for Aegis testing',
      code: 'DB_CONSTRAINT_VIOLATION',
      sqlError: 'FOREIGN KEY constraint failed',
      timestamp: new Date().toISOString()
    });
  });

  // Test report endpoint to get recent test-related logs
  app.get("/api/test/aegis-report", async (req, res) => {
    try {
      // This would normally query the aegis_logs table
      // For now, return a summary of what Aegis should have captured
      const report = {
        message: 'Aegis Error Detection Test Report',
        testPeriod: new Date().toISOString(),
        detectedErrors: [
          {
            type: 'server_error',
            severity: 'critical',
            count: 1,
            status: 'Aegis should have logged this as critical system error'
          },
          {
            type: 'authentication_error',
            severity: 'warning', 
            count: 1,
            status: 'Aegis should have logged this as security concern'
          },
          {
            type: 'validation_error',
            severity: 'error',
            count: 1,
            status: 'Aegis should have logged this as data quality issue'
          },
          {
            type: 'ai_service_timeout',
            severity: 'error',
            count: 1,
            status: 'Aegis should have logged this as AI performance issue'
          }
        ],
        recommendations: [
          'Review database connection stability',
          'Investigate authentication token validation',
          'Enhance input validation on frontend',
          'Monitor AI service response times'
        ]
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate test report' });
    }
  });
}