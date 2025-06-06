/**
 * Network Diagnostic System - Error -8 Resolution
 */

import { type Express } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class NetworkDiagnostic {
  
  static async checkPortAvailability(port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`netstat -an | grep :${port}`);
      return !stdout.includes('LISTEN');
    } catch {
      return true; // If netstat fails, assume port is available
    }
  }

  static async getNetworkInterfaces(): Promise<any> {
    try {
      const { stdout } = await execAsync('ip addr show || ifconfig');
      return stdout;
    } catch (error) {
      console.warn('[NETWORK] Unable to get network interfaces:', error);
      return 'Network interface information unavailable';
    }
  }

  static async testConnectivity(host: string, port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`timeout 5 bash -c "</dev/tcp/${host}/${port}" 2>/dev/null && echo "connected" || echo "failed"`);
      return stdout.trim() === 'connected';
    } catch {
      return false;
    }
  }

  static registerDiagnosticEndpoints(app: Express) {
    // Network health check endpoint
    app.get('/api/network-health', async (req, res) => {
      try {
        const diagnostics = {
          timestamp: new Date().toISOString(),
          server: {
            port: 5000,
            host: '0.0.0.0',
            status: 'running'
          },
          connectivity: {
            localhost: await NetworkDiagnostic.testConnectivity('localhost', 5000),
            loopback: await NetworkDiagnostic.testConnectivity('127.0.0.1', 5000),
            allInterfaces: await NetworkDiagnostic.testConnectivity('0.0.0.0', 5000)
          },
          portStatus: {
            available: await NetworkDiagnostic.checkPortAvailability(5000),
            inUse: !await NetworkDiagnostic.checkPortAvailability(5000)
          },
          networkInterfaces: await NetworkDiagnostic.getNetworkInterfaces(),
          clientInfo: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            headers: req.headers
          }
        };

        res.json({
          success: true,
          diagnostics,
          recommendations: NetworkDiagnostic.generateRecommendations(diagnostics)
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Network diagnostic failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Simple connectivity test
    app.get('/ping', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        server: 'MarFanet',
        clientIP: req.ip || 'unknown'
      });
    });
  }

  private static generateRecommendations(diagnostics: any): string[] {
    const recommendations: string[] = [];

    if (!diagnostics.connectivity.localhost) {
      recommendations.push('Local connectivity failed - check server binding');
    }

    if (!diagnostics.connectivity.loopback) {
      recommendations.push('Loopback connectivity failed - check network stack');
    }

    if (!diagnostics.portStatus.inUse) {
      recommendations.push('Port 5000 appears to not be in use - server may not be running');
    }

    if (recommendations.length === 0) {
      recommendations.push('All network diagnostics passed - server is accessible');
    }

    return recommendations;
  }
}