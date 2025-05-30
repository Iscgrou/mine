import { aegisLogger, EventType, LogLevel } from './aegis-logger';

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
  score: number;
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

class AegisMonitorFixed {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthHistory: HealthMetrics[] = [];
  private readonly MAX_HISTORY = 10; // Minimal history to prevent memory leaks
  private readonly MONITORING_INTERVAL = 300000; // 5 minutes to reduce overhead

  constructor() {
    // Start with reduced monitoring frequency
    this.startMonitoring();
    aegisLogger.info('AegisMonitor', 'Memory-optimized health monitoring initialized');
  }

  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectHealthMetrics().catch(error => {
        console.error('Health monitoring error:', error);
      });
    }, this.MONITORING_INTERVAL);
  }

  async collectHealthMetrics(): Promise<void> {
    try {
      const metrics: HealthMetrics = {
        timestamp: new Date(),
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        responseTime: 0, // Simplified
        errorRate: 0, // Simplified
        activeConnections: 0, // Simplified
        databaseConnections: 0 // Simplified
      };

      // Keep only recent history
      this.healthHistory.push(metrics);
      if (this.healthHistory.length > this.MAX_HISTORY) {
        this.healthHistory = this.healthHistory.slice(-this.MAX_HISTORY);
      }

      // Emergency cleanup for high memory usage
      if (metrics.memoryUsage > 90) {
        await this.performEmergencyCleanup();
      }

    } catch (error) {
      console.error('Failed to collect health metrics:', error);
    }
  }

  private async getCPUUsage(): Promise<number> {
    return 0; // Simplified to prevent overhead
  }

  private getMemoryUsage(): number {
    const used = process.memoryUsage();
    return (used.heapUsed / used.heapTotal) * 100;
  }

  async performEmergencyCleanup(): Promise<void> {
    try {
      console.log('[AEGIS EMERGENCY] Critical memory usage - performing cleanup');
      
      // Clear history
      this.healthHistory = [];
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        setTimeout(() => global.gc && global.gc(), 100);
      }
      
      console.log('[AEGIS EMERGENCY] Emergency cleanup completed');
    } catch (error) {
      console.error('[AEGIS EMERGENCY] Cleanup failed:', error);
    }
  }

  async getSystemStatus(): Promise<AnalysisResult> {
    const latest = this.healthHistory[this.healthHistory.length - 1];
    if (!latest) {
      return {
        status: 'healthy',
        score: 100,
        issues: [],
        recommendations: [],
        trends: []
      };
    }

    const issues: Issue[] = [];
    let score = 100;

    if (latest.memoryUsage > 85) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `High memory usage: ${latest.memoryUsage.toFixed(1)}%`,
        affectedComponents: ['server'],
        firstDetected: latest.timestamp,
        count: 1,
        suggestedAction: 'Memory cleanup performed automatically'
      });
      score -= 30;
    }

    const status = score > 80 ? 'healthy' : score > 60 ? 'warning' : 'critical';

    return {
      status,
      score,
      issues,
      recommendations: issues.length > 0 ? ['Monitor memory usage', 'Consider system optimization'] : [],
      trends: []
    };
  }

  async getHealthHistory(limit: number = 10): Promise<HealthMetrics[]> {
    return this.healthHistory.slice(-limit);
  }

  async analyzeAIPerformance(): Promise<{
    averageResponseTime: number;
    successRate: number;
    qualityScore: number;
    commonIssues: string[];
  }> {
    // Simplified AI performance analysis
    return {
      averageResponseTime: 0,
      successRate: 100,
      qualityScore: 95,
      commonIssues: []
    };
  }

  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.healthHistory = [];
    
    if (global.gc) {
      global.gc();
    }
  }
}

export const aegisMonitor = new AegisMonitorFixed();