/**
 * Performance Optimization Implementation
 * Database indexing, query optimization, and backend performance enhancements
 */

import type { Express } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

export class PerformanceOptimizer {
  
  // Database indexing for improved query performance
  static async createOptimalIndexes(): Promise<void> {
    try {
      console.log("Creating performance indexes...");
      
      // Representatives table indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_representatives_admin_username ON representatives(admin_username)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_representatives_full_name ON representatives(full_name)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_representatives_created_at ON representatives(created_at)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_representatives_collaborator_id ON representatives(collaborator_id)`);
      
      // Invoices table indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_invoices_representative_id ON invoices(representative_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_invoices_batch_id ON invoices(batch_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`);
      
      // Payments table indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_representative_id ON payments(representative_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`);
      
      // Financial ledger indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financial_ledger_representative_id ON financial_ledger(representative_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financial_ledger_transaction_type ON financial_ledger(transaction_type)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financial_ledger_created_at ON financial_ledger(created_at)`);
      
      // CRM tables indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_crm_interactions_representative_id ON crm_interactions(representative_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_crm_interactions_created_at ON crm_interactions(created_at)`);
      
      // Collaborators and commission indexes
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_collaborators_name ON collaborators(collaborator_name)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_commission_records_collaborator_id ON commission_records(collaborator_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_commission_records_created_at ON commission_records(created_at)`);
      
      console.log("✅ Performance indexes created successfully");
    } catch (error) {
      console.error("❌ Error creating performance indexes:", error);
    }
  }

  // Connection pool optimization
  static async optimizeConnectionPool(): Promise<void> {
    try {
      // Set optimal PostgreSQL connection parameters
      await db.execute(sql`SET shared_buffers = '256MB'`);
      await db.execute(sql`SET effective_cache_size = '1GB'`);
      await db.execute(sql`SET maintenance_work_mem = '64MB'`);
      await db.execute(sql`SET checkpoint_completion_target = 0.9`);
      await db.execute(sql`SET wal_buffers = '16MB'`);
      await db.execute(sql`SET default_statistics_target = 100`);
      
      console.log("✅ Connection pool optimized");
    } catch (error) {
      console.warn("⚠️ Connection pool optimization warning:", error);
    }
  }

  // Query performance analysis
  static async analyzeSlowQueries(): Promise<any[]> {
    try {
      const slowQueries = await db.execute(sql`
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `);
      
      return slowQueries.rows || [];
    } catch (error) {
      console.warn("Query analysis not available (pg_stat_statements extension may not be enabled)");
      return [];
    }
  }

  // Database vacuum and analyze
  static async performMaintenanceTasks(): Promise<void> {
    try {
      // Analyze tables for optimal query planning
      await db.execute(sql`ANALYZE representatives`);
      await db.execute(sql`ANALYZE invoices`);
      await db.execute(sql`ANALYZE payments`);
      await db.execute(sql`ANALYZE financial_ledger`);
      await db.execute(sql`ANALYZE crm_interactions`);
      
      console.log("✅ Database maintenance completed");
    } catch (error) {
      console.error("❌ Database maintenance error:", error);
    }
  }
}

// Caching layer for frequently accessed data
export class PerformanceCache {
  private static cache = new Map<string, { data: any; expiry: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any, duration?: number): void {
    const expiry = Date.now() + (duration || this.CACHE_DURATION);
    this.cache.set(key, { data, expiry });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Request optimization middleware
export function performanceMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Log slow requests (>1 second)
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
}

// Optimized database queries with caching
export class OptimizedQueries {
  
  static async getRepresentativesWithCache(): Promise<any[]> {
    const cacheKey = 'representatives_list';
    let representatives = PerformanceCache.get(cacheKey);
    
    if (!representatives) {
      representatives = await db.execute(sql`
        SELECT r.*, COUNT(i.id) as invoice_count, COALESCE(SUM(i.total_amount::numeric), 0) as total_sales
        FROM representatives r
        LEFT JOIN invoices i ON r.id = i.representative_id
        GROUP BY r.id, r.full_name, r.admin_username, r.created_at, r.phone_number, r.store_name
        ORDER BY r.created_at DESC
      `);
      
      PerformanceCache.set(cacheKey, representatives.rows, 2 * 60 * 1000); // Cache for 2 minutes
    }
    
    return representatives;
  }

  static async getInvoiceStatsWithCache(): Promise<any> {
    const cacheKey = 'invoice_stats';
    let stats = PerformanceCache.get(cacheKey);
    
    if (!stats) {
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
          COALESCE(SUM(total_amount::numeric), 0) as total_amount,
          COALESCE(AVG(total_amount::numeric), 0) as average_amount
        FROM invoices
      `);
      
      stats = result.rows[0];
      PerformanceCache.set(cacheKey, stats, 5 * 60 * 1000); // Cache for 5 minutes
    }
    
    return stats;
  }

  static async getRecentActivityWithCache(): Promise<any[]> {
    const cacheKey = 'recent_activity';
    let activity = PerformanceCache.get(cacheKey);
    
    if (!activity) {
      const result = await db.execute(sql`
        (SELECT 'invoice' as type, id, created_at, total_amount as amount, representative_id 
         FROM invoices ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'payment' as type, id, created_at, amount, representative_id 
         FROM payments ORDER BY created_at DESC LIMIT 5)
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      activity = result.rows;
      PerformanceCache.set(cacheKey, activity, 1 * 60 * 1000); // Cache for 1 minute
    }
    
    return activity;
  }
}

export function registerPerformanceEndpoints(app: Express) {
  // Performance monitoring endpoint
  app.get("/api/performance/metrics", async (req, res) => {
    try {
      const slowQueries = await PerformanceOptimizer.analyzeSlowQueries();
      const cacheStats = PerformanceCache.getStats();
      
      res.json({
        slowQueries,
        cacheStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get performance metrics" });
    }
  });

  // Cache management endpoint
  app.post("/api/performance/cache/clear", (req, res) => {
    PerformanceCache.clear();
    res.json({ message: "Cache cleared successfully" });
  });

  // Database maintenance endpoint
  app.post("/api/performance/maintenance", async (req, res) => {
    try {
      await PerformanceOptimizer.performMaintenanceTasks();
      res.json({ message: "Database maintenance completed" });
    } catch (error) {
      res.status(500).json({ error: "Maintenance failed" });
    }
  });

  // Optimized representatives endpoint
  app.get("/api/performance/representatives", async (req, res) => {
    try {
      const representatives = await OptimizedQueries.getRepresentativesWithCache();
      res.json(representatives);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch representatives" });
    }
  });

  // Dashboard stats endpoint with caching
  app.get("/api/performance/dashboard-stats", async (req, res) => {
    try {
      const invoiceStats = await OptimizedQueries.getInvoiceStatsWithCache();
      const recentActivity = await OptimizedQueries.getRecentActivityWithCache();
      
      res.json({
        invoiceStats,
        recentActivity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
}

// Initialize performance optimizations
export async function initializePerformanceOptimizations(): Promise<void> {
  console.log("🚀 Initializing performance optimizations...");
  
  await PerformanceOptimizer.createOptimalIndexes();
  await PerformanceOptimizer.optimizeConnectionPool();
  await PerformanceOptimizer.performMaintenanceTasks();
  
  console.log("✅ Performance optimizations completed");
}