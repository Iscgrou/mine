/**
 * Security Hardening Implementation
 * Enhanced authentication, input validation, and vulnerability protection
 */

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";

// Enhanced input validation schemas
export const ValidationSchemas = {
  // Representative data validation
  representativeInput: z.object({
    fullName: z.string().min(2).max(100).regex(/^[\u0600-\u06FFa-zA-Z\s]+$/, "Only Persian/Arabic and Latin characters allowed"),
    adminUsername: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Only alphanumeric and underscore allowed"),
    phoneNumber: z.string().refine((val) => !val || /^[\+]?[0-9\-\s\(\)]+$/.test(val), "Invalid phone format").optional(),
    storeName: z.string().max(200).optional(),
    telegramId: z.string().max(100).optional()
  }),

  // Financial data validation
  invoiceInput: z.object({
    representativeId: z.number().int().positive(),
    totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
    invoiceNumber: z.string().min(1).max(50).regex(/^[A-Z0-9\-]+$/, "Invalid invoice number format"),
    dueDate: z.string().datetime().optional()
  }),

  // Payment validation
  paymentInput: z.object({
    representativeId: z.number().int().positive(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
    paymentType: z.enum(['cash', 'bank_transfer', 'check', 'digital']),
    referenceNumber: z.string().max(100).optional()
  }),

  // Search and pagination validation
  searchQuery: z.object({
    query: z.string().max(200).regex(/^[\u0600-\u06FFa-zA-Z0-9\s\-_]+$/, "Invalid search characters"),
    page: z.number().int().min(1).max(1000),
    limit: z.number().int().min(1).max(100)
  })
};

// Rate limiting configurations
export const RateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Stricter limits for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: "Too many authentication attempts" }
  }),

  // File upload rate limiting
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: "Upload limit exceeded" }
  }),

  // Search rate limiting
  search: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    message: { error: "Search rate limit exceeded" }
  })
};

// Enhanced path-based authentication
export class EnhancedAuth {
  private static readonly ADMIN_PATH = "/ciwomplefoadm867945";
  private static readonly CRM_PATH = "/csdfjkjfoascivomrm867945";
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static validatePath(req: Request): { isValid: boolean; role?: string } {
    const path = req.path;
    
    if (path.startsWith(this.ADMIN_PATH)) {
      return { isValid: true, role: 'admin' };
    }
    
    if (path.startsWith(this.CRM_PATH)) {
      return { isValid: true, role: 'crm' };
    }

    // Public API endpoints
    if (path.startsWith('/api/public/')) {
      return { isValid: true, role: 'public' };
    }

    return { isValid: false };
  }

  static middleware(req: Request, res: Response, next: NextFunction) {
    // Skip validation for health check and public endpoints
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }

    const validation = EnhancedAuth.validatePath(req);
    
    if (!validation.isValid) {
      return res.status(403).json({ 
        error: "Access denied",
        timestamp: new Date().toISOString()
      });
    }

    // Add role to request for downstream use
    (req as any).userRole = validation.role;
    next();
  }
}

// Input sanitization middleware
export function sanitizeInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input data",
          details: error.errors,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
}

// SQL injection prevention
export function preventSQLInjection(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "");
}

// XSS prevention
export function sanitizeHTML(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  next();
}

// API key validation for external services
export class APIKeyValidator {
  static validateGoogleCredentials(): boolean {
    return !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_AI_STUDIO_API_KEY);
  }

  static validateRequiredSecrets(): string[] {
    const missing = [];
    const required = ['DATABASE_URL', 'GOOGLE_AI_STUDIO_API_KEY'];
    
    for (const key of required) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
    
    return missing;
  }
}

// Audit logging for security events
export class SecurityAuditLogger {
  static logSecurityEvent(event: {
    type: 'auth_attempt' | 'access_denied' | 'rate_limit' | 'validation_error';
    ip: string;
    userAgent?: string;
    path: string;
    details?: any;
  }) {
    console.log(`[SECURITY AUDIT] ${new Date().toISOString()} - ${event.type.toUpperCase()}`, {
      ip: event.ip,
      path: event.path,
      userAgent: event.userAgent,
      details: event.details
    });
  }
}

// Enhanced error handling
export function secureErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  // Log the full error for debugging
  console.error(`[ERROR] ${new Date().toISOString()}:`, error);
  
  // Security audit for errors
  SecurityAuditLogger.logSecurityEvent({
    type: 'validation_error',
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    path: req.path,
    details: error.message
  });

  // Never expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : "Internal server error",
    timestamp: new Date().toISOString(),
    requestId: req.get('X-Request-ID') || 'unknown'
  });
}

export function registerSecurityMiddleware(app: Express) {
  // Apply security headers
  app.use(securityHeaders);
  
  // Apply rate limiting
  app.use('/api/', RateLimiters.general);
  app.use('/api/auth/', RateLimiters.auth);
  app.use('/api/upload/', RateLimiters.upload);
  app.use('/api/search/', RateLimiters.search);
  
  // Apply enhanced authentication
  app.use(EnhancedAuth.middleware);
  
  // Apply secure error handling
  app.use(secureErrorHandler);
}