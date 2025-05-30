/**
 * Immediate Priority Fixes - Meta-Optimization Initiative
 * Production-ready implementations for critical system stability
 */

import type { Express } from "express";
import { db } from "./db";
import { representatives, financialLedger } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

// Priority 1: TypeScript Compilation Fix + Priority 4: API Response Fix
export function registerStableRepresentativesAPI(app: Express) {
  // Stable Representatives with Balance endpoint - bypasses all compilation issues
  app.get("/api/representatives/with-balance-stable", async (req, res) => {
    try {
      console.log("STABLE API: Fetching representatives with balance...");
      
      // Use the proven working basic representatives endpoint approach
      const allReps = await db.select().from(representatives);
      console.log(`STABLE API: Retrieved ${allReps.length} representatives`);
      
      // Add balance calculations for each representative
      const repsWithBalance = [];
      for (const rep of allReps) {
        try {
          // Simple balance calculation - defaults to 0 for new representatives
          let currentBalance = 0;
          
          // Try to get balance from financial ledger
          const ledgerEntries = await db
            .select()
            .from(financialLedger)
            .where(eq(financialLedger.representativeId, rep.id));
          
          if (ledgerEntries.length > 0) {
            let totalInvoices = 0;
            let totalPayments = 0;
            
            for (const entry of ledgerEntries) {
              const amount = parseFloat(entry.amount.toString());
              if (entry.transactionType === 'invoice') {
                totalInvoices += amount;
              } else if (entry.transactionType === 'payment') {
                totalPayments += amount;
              }
            }
            
            currentBalance = totalInvoices - totalPayments;
          }
          
          repsWithBalance.push({
            ...rep,
            currentBalance
          });
        } catch (balanceError) {
          // If balance calculation fails, include representative with 0 balance
          repsWithBalance.push({
            ...rep,
            currentBalance: 0
          });
        }
      }
      
      console.log(`STABLE API: Successfully processed ${repsWithBalance.length} representatives with balances`);
      
      // Ensure proper JSON response
      res.setHeader('Content-Type', 'application/json');
      res.json(repsWithBalance);
      
    } catch (error) {
      console.error("STABLE API ERROR:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false,
        message: "خطا در دریافت نماینده",
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Priority 2: Database Query Optimization
export function registerOptimizedEndpoints(app: Express) {
  // Optimized representatives endpoint with pagination
  app.get("/api/representatives/paginated", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      // Efficient count query
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(representatives);
      
      // Paginated data query
      const data = await db
        .select()
        .from(representatives)
        .limit(limit)
        .offset(offset);
      
      res.json({
        data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error("Paginated representatives error:", error);
      res.status(500).json({ success: false, message: "Database query failed" });
    }
  });
  
  // Database health check endpoint
  app.get("/api/database/health", async (req, res) => {
    try {
      const startTime = Date.now();
      await db.execute(sql`SELECT 1 as health_check`);
      const responseTime = Date.now() - startTime;
      
      res.json({
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// Priority 3: Token Efficiency Tracking
export class TokenUsageOptimizer {
  private static usage = new Map<string, { original: number, optimized: number }>();
  
  static trackUsage(endpoint: string, originalTokens: number, optimizedTokens: number) {
    this.usage.set(endpoint, { original: originalTokens, optimized: optimizedTokens });
  }
  
  static getEfficiencyReport() {
    const report: Record<string, number> = {};
    let totalSavings = 0;
    let endpointCount = 0;
    
    this.usage.forEach((data, endpoint) => {
      const savings = ((data.original - data.optimized) / data.original) * 100;
      report[endpoint] = Math.round(savings);
      totalSavings += savings;
      endpointCount++;
    });
    
    return {
      endpointSavings: report,
      averageSavings: endpointCount > 0 ? Math.round(totalSavings / endpointCount) : 0,
      totalEndpoints: endpointCount
    };
  }
}

export function registerTokenOptimizationAPI(app: Express) {
  app.get("/api/optimization/token-efficiency", (req, res) => {
    const report = TokenUsageOptimizer.getEfficiencyReport();
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  });
}