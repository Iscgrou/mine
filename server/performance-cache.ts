/**
 * Performance Cache System for MarFanet
 * Implements intelligent caching for high-traffic API endpoints
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry>();
  
  // Cache TTL configurations (in milliseconds)
  private readonly TTL_CONFIG = {
    'dashboard-stats': 5 * 60 * 1000,        // 5 minutes
    'representatives-list': 10 * 60 * 1000,   // 10 minutes
    'invoice-analytics': 15 * 60 * 1000,      // 15 minutes
    'voice-notes-summary': 2 * 60 * 1000,     // 2 minutes
    'commission-reports': 30 * 60 * 1000,     // 30 minutes
  };

  set(key: string, data: any, customTTL?: number): void {
    const ttl = customTTL || this.TTL_CONFIG[key as keyof typeof this.TTL_CONFIG] || 5 * 60 * 1000;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    // Invalidate cache entries matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const performanceCache = new PerformanceCache();

// Cache middleware for Express routes
export function cacheMiddleware(cacheKey: string, ttl?: number) {
  return (req: any, res: any, next: any) => {
    const fullCacheKey = `${cacheKey}-${JSON.stringify(req.query)}-${JSON.stringify(req.params)}`;
    
    const cachedData = performanceCache.get(fullCacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = (data: any) => {
      performanceCache.set(fullCacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
}