/**
 * Authentication Debug Tracer - Root Cause Analysis System
 */

import { type Request, type Response, type NextFunction } from "express";

interface AuthTraceLog {
  timestamp: Date;
  path: string;
  method: string;
  sessionExists: boolean;
  sessionAuthenticated: boolean;
  sessionRole?: string;
  clientIP: string;
  userAgent: string;
  decision: 'ALLOW' | 'REDIRECT' | 'BLOCK';
  middleware: string;
  reason: string;
}

class AuthenticationTracer {
  private logs: AuthTraceLog[] = [];

  trace(req: Request, decision: 'ALLOW' | 'REDIRECT' | 'BLOCK', middleware: string, reason: string) {
    const log: AuthTraceLog = {
      timestamp: new Date(),
      path: req.path,
      method: req.method,
      sessionExists: !!req.session,
      sessionAuthenticated: !!req.session?.authenticated,
      sessionRole: req.session?.role,
      clientIP: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      decision,
      middleware,
      reason
    };

    this.logs.push(log);
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    console.log(`[AUTH_TRACE] ${middleware}: ${req.method} ${req.path} -> ${decision} (${reason})`);
  }

  getLogs(): AuthTraceLog[] {
    return [...this.logs];
  }

  getRecentBlocks(): AuthTraceLog[] {
    return this.logs.filter(log => 
      log.decision === 'REDIRECT' || log.decision === 'BLOCK'
    ).slice(-20);
  }
}

export const authTracer = new AuthenticationTracer();

export function createAuthDebugMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`\n=== AUTH DEBUG TRACE START ===`);
    console.log(`Path: ${req.path}`);
    console.log(`Method: ${req.method}`);
    console.log(`Session exists: ${!!req.session}`);
    console.log(`Session authenticated: ${!!req.session?.authenticated}`);
    console.log(`Session role: ${req.session?.role || 'none'}`);
    console.log(`Client IP: ${req.ip || 'unknown'}`);
    console.log(`=== AUTH DEBUG TRACE END ===\n`);
    
    next();
  };
}