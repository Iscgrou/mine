import { db } from "./db";
import { sql } from "drizzle-orm";
import { aegisLogger, EventType, LogLevel } from "./aegis-logger";

interface HealthMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  databaseConnections: number;
}

interface AnalysisResult {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: Issue[];
  recommendations: string[];
  trends: TrendAnalysis[];
}

interface Issue {
  type: 'performance' | 'error' | 'availability' | 'ai_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedComponents: string[];
  firstDetected: Date;
  count: number;
  suggestedAction: string;
}

interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  timeframe: string;
}

class AegisMonitor {
  private monitoringInterval: NodeJS.Timeout;
  private healthHistory: HealthMetrics[] = [];
  private readonly MAX_HISTORY = 1000; // Keep last 1000 health checks

  constructor() {
    // Monitor system health every 30 seconds
    this.monitoringInterval = setInterval(() => this.collectHealthMetrics(), 30000);
    
    // Initial health check
    this.collectHealthMetrics();
    
    aegisLogger.info('AegisMonitor', 'Health monitoring system initialized');
  }

  async collectHealthMetrics(): Promise<void> {
    try {
      const metrics: HealthMetrics = {
        timestamp: new Date(),
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        responseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        activeConnections: await this.getActiveConnections(),
        databaseConnections: await this.getDatabaseConnections()
      };

      this.healthHistory.push(metrics);
      
      // Limit history size
      if (this.healthHistory.length > this.MAX_HISTORY) {
        this.healthHistory = this.healthHistory.slice(-this.MAX_HISTORY);
      }

      // Store in database
      await this.storeHealthMetrics(metrics);
      
      // Analyze current health
      const analysis = await this.analyzeSystemHealth();
      
      // Log critical issues immediately
      if (analysis.status === 'critical') {
        aegisLogger.critical('AegisMonitor', 'Critical system health issues detected', null, {
          score: analysis.score,
          issues: analysis.issues.length,
          criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length
        });
      }

    } catch (error) {
      aegisLogger.error('AegisMonitor', 'Failed to collect health metrics', error);
    }
  }

  private async getCPUUsage(): Promise<number> {
    // Simple CPU usage approximation
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    
    const totalUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
    return Math.min(100, totalUsage * 10); // Rough approximation
  }

  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return (memUsage.heapUsed / memUsage.heapTotal) * 100;
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      // Query recent API response times from logs
      const result = await db.execute(sql`
        SELECT AVG(CAST(performance_data->>'duration' AS FLOAT)) as avg_duration
        FROM aegis_logs 
        WHERE event_type = 'api_response' 
        AND timestamp > NOW() - INTERVAL '5 minutes'
        AND performance_data->>'duration' IS NOT NULL
      `);
      
      return result.rows[0]?.avg_duration || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const result = await db.execute(sql`
        WITH total_requests AS (
          SELECT COUNT(*) as total
          FROM aegis_logs 
          WHERE event_type IN ('api_request', 'api_response')
          AND timestamp > NOW() - INTERVAL '5 minutes'
        ),
        error_requests AS (
          SELECT COUNT(*) as errors
          FROM aegis_logs 
          WHERE level IN ('error', 'critical')
          AND timestamp > NOW() - INTERVAL '5 minutes'
        )
        SELECT 
          CASE WHEN total.total > 0 
            THEN (error_requests.errors::FLOAT / total.total::FLOAT) * 100 
            ELSE 0 
          END as error_rate
        FROM total_requests total, error_requests
      `);
      
      return result.rows[0]?.error_rate || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveConnections(): Promise<number> {
    // This would be implemented based on your connection tracking
    return 1; // Placeholder
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      
      return result.rows[0]?.active_connections || 0;
    } catch (error) {
      return 0;
    }
  }

  private async storeHealthMetrics(metrics: HealthMetrics): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS aegis_health_metrics (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          cpu_usage FLOAT NOT NULL,
          memory_usage FLOAT NOT NULL,
          response_time FLOAT NOT NULL,
          error_rate FLOAT NOT NULL,
          active_connections INTEGER NOT NULL,
          database_connections INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        INSERT INTO aegis_health_metrics (
          timestamp, cpu_usage, memory_usage, response_time, 
          error_rate, active_connections, database_connections
        ) VALUES (
          ${metrics.timestamp}, ${metrics.cpuUsage}, ${metrics.memoryUsage},
          ${metrics.responseTime}, ${metrics.errorRate}, ${metrics.activeConnections},
          ${metrics.databaseConnections}
        )
      `);
    } catch (error) {
      aegisLogger.error('AegisMonitor', 'Failed to store health metrics', error);
    }
  }

  async analyzeSystemHealth(): Promise<AnalysisResult> {
    const issues: Issue[] = [];
    const recommendations: string[] = [];
    const trends: TrendAnalysis[] = [];

    if (this.healthHistory.length === 0) {
      return {
        status: 'warning',
        score: 50,
        issues: [],
        recommendations: ['System just started, gathering baseline metrics'],
        trends: []
      };
    }

    const latest = this.healthHistory[this.healthHistory.length - 1];
    let score = 100;

    // CPU Usage Analysis
    if (latest.cpuUsage > 80) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `High CPU usage: ${latest.cpuUsage.toFixed(1)}%`,
        affectedComponents: ['server'],
        firstDetected: latest.timestamp,
        count: 1,
        suggestedAction: 'Monitor resource-intensive operations and consider scaling'
      });
      score -= 20;
    }

    // Memory Usage Analysis
    if (latest.memoryUsage > 85) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `High memory usage: ${latest.memoryUsage.toFixed(1)}%`,
        affectedComponents: ['server'],
        firstDetected: latest.timestamp,
        count: 1,
        suggestedAction: 'Check for memory leaks and optimize data handling'
      });
      score -= 20;
    }

    // Response Time Analysis
    if (latest.responseTime > 2000) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: `Slow response times: ${latest.responseTime.toFixed(0)}ms`,
        affectedComponents: ['api'],
        firstDetected: latest.timestamp,
        count: 1,
        suggestedAction: 'Optimize database queries and API endpoints'
      });
      score -= 15;
    }

    // Error Rate Analysis
    if (latest.errorRate > 5) {
      const severity = latest.errorRate > 15 ? 'critical' : 'high';
      issues.push({
        type: 'error',
        severity,
        description: `High error rate: ${latest.errorRate.toFixed(1)}%`,
        affectedComponents: ['api', 'frontend'],
        firstDetected: latest.timestamp,
        count: 1,
        suggestedAction: 'Investigate error patterns and fix underlying issues'
      });
      score -= severity === 'critical' ? 30 : 20;
    }

    // Calculate trends if we have enough history
    if (this.healthHistory.length >= 10) {
      trends.push(...this.calculateTrends());
    }

    // Add recommendations based on analysis
    if (score > 90) {
      recommendations.push('System is performing excellently');
    } else if (score > 70) {
      recommendations.push('System is stable with minor optimizations needed');
    } else if (score > 50) {
      recommendations.push('System requires attention to maintain optimal performance');
    } else {
      recommendations.push('System needs immediate intervention');
    }

    const status: 'healthy' | 'warning' | 'critical' = 
      score > 80 ? 'healthy' : score > 50 ? 'warning' : 'critical';

    return {
      status,
      score,
      issues,
      recommendations,
      trends
    };
  }

  private calculateTrends(): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const recent = this.healthHistory.slice(-10);
    const earlier = this.healthHistory.slice(-20, -10);

    if (earlier.length === 0) return trends;

    const metrics = ['cpuUsage', 'memoryUsage', 'responseTime', 'errorRate'];
    
    for (const metric of metrics) {
      const recentAvg = recent.reduce((sum, h) => sum + (h as any)[metric], 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, h) => sum + (h as any)[metric], 0) / earlier.length;
      
      const changePercent = earlierAvg === 0 ? 0 : ((recentAvg - earlierAvg) / earlierAvg) * 100;
      
      let direction: 'improving' | 'stable' | 'degrading';
      if (Math.abs(changePercent) < 5) {
        direction = 'stable';
      } else if ((metric === 'responseTime' || metric === 'errorRate') ? changePercent < 0 : changePercent > 0) {
        direction = metric === 'responseTime' || metric === 'errorRate' ? 'improving' : 'degrading';
      } else {
        direction = metric === 'responseTime' || metric === 'errorRate' ? 'degrading' : 'improving';
      }

      trends.push({
        metric: metric.replace(/([A-Z])/g, ' $1').toLowerCase(),
        direction,
        changePercent: Math.abs(changePercent),
        timeframe: '5 minutes'
      });
    }

    return trends;
  }

  async getSystemStatus(): Promise<AnalysisResult> {
    return await this.analyzeSystemHealth();
  }

  async getHealthHistory(limit: number = 100): Promise<HealthMetrics[]> {
    return this.healthHistory.slice(-limit);
  }

  // AI Quality Monitoring for Nova
  async analyzeAIPerformance(): Promise<{
    averageResponseTime: number;
    successRate: number;
    qualityScore: number;
    commonIssues: string[];
  }> {
    try {
      // Analyze AI request/response patterns from logs
      const aiLogs = await db.execute(sql`
        SELECT 
          event_type,
          level,
          metadata,
          performance_data,
          error_data,
          timestamp
        FROM aegis_logs 
        WHERE event_type IN ('ai_request', 'ai_response')
        AND timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC
        LIMIT 100
      `);

      const requests = aiLogs.rows.filter(log => log.event_type === 'ai_request');
      const responses = aiLogs.rows.filter(log => log.event_type === 'ai_response');
      const errors = responses.filter(log => log.level === 'error');

      const averageResponseTime = responses
        .map(log => {
          try {
            return JSON.parse(log.performance_data as string)?.duration || 0;
          } catch {
            return 0;
          }
        })
        .reduce((sum, duration) => sum + duration, 0) / (responses.length || 1);

      const successRate = responses.length > 0 ? 
        ((responses.length - errors.length) / responses.length) * 100 : 100;

      const qualityScore = Math.max(0, 100 - (averageResponseTime / 50) - ((100 - successRate) * 2));

      const commonIssues: string[] = [];
      if (averageResponseTime > 5000) {
        commonIssues.push('High AI response latency detected');
      }
      if (successRate < 95) {
        commonIssues.push('AI service reliability issues');
      }

      return {
        averageResponseTime,
        successRate,
        qualityScore,
        commonIssues
      };
    } catch (error) {
      aegisLogger.error('AegisMonitor', 'Failed to analyze AI performance', error);
      return {
        averageResponseTime: 0,
        successRate: 0,
        qualityScore: 0,
        commonIssues: ['Unable to analyze AI performance data']
      };
    }
  }

  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    aegisLogger.info('AegisMonitor', 'Health monitoring system stopped');
  }
}

export const aegisMonitor = new AegisMonitor();

// Graceful shutdown
process.on('SIGTERM', () => {
  aegisMonitor.cleanup();
});

process.on('SIGINT', () => {
  aegisMonitor.cleanup();
});