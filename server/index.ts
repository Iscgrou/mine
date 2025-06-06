import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { registerRepresentativesBalanceEndpoint } from "./representatives-balance-fix";
import { registerCRTPerformanceRoutes } from "./crt-performance-monitor";
import { createUniversalInvoiceAccess } from "./invoice-access-security";
import { NetworkDiagnostic } from "./network-diagnostic";
import { ComprehensiveSecurity } from "./comprehensive-security";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();

// COMPREHENSIVE SECURITY: Setup all security middleware first
ComprehensiveSecurity.setupSecurityMiddleware(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Register emergency fix for representatives balance API
  registerRepresentativesBalanceEndpoint(app);
  
  // Register AI-powered CRT Performance Monitoring routes
  registerCRTPerformanceRoutes(app);

  // CRITICAL: Register Universal Invoice Access System BEFORE authentication
  createUniversalInvoiceAccess(app);

  // Setup comprehensive authentication and security
  ComprehensiveSecurity.setupAuthentication(app);
  ComprehensiveSecurity.setupRouteProtection(app);
  ComprehensiveSecurity.setupHealthCheck(app);

  // Register network diagnostic endpoints
  NetworkDiagnostic.registerDiagnosticEndpoints(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Configure server for maximum compatibility and accessibility
  const port = 5000;
  const host = "0.0.0.0";
  
  // Enhanced server configuration to prevent timeouts
  server.keepAliveTimeout = 30000; // 30 seconds
  server.headersTimeout = 35000; // 35 seconds
  server.requestTimeout = 60000; // 1 minute
  server.timeout = 120000; // 2 minutes
  
  // Set socket timeouts
  server.on('connection', (socket) => {
    socket.setTimeout(60000); // 1 minute per connection
    socket.setKeepAlive(true, 30000);
    socket.setNoDelay(true);
  });
  
  server.listen(port, host, () => {
    log(`Server listening on http://${host}:${port}`);
    console.log(`[NETWORK] Server accessible on all network interfaces`);
    console.log(`[NETWORK] Local access: http://localhost:${port}`);
    console.log(`[NETWORK] External access: Use your Replit URL or domain`);
    console.log(`[NETWORK] Server configured for maximum compatibility`);
    console.log(`[SECURITY] Comprehensive security middleware active`);
    
    // Test internal connectivity with shorter timeout
    setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`http://localhost:${port}/health`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Internal-Health-Check' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[NETWORK] Internal connectivity test: PASSED - ${data.status}`);
        } else {
          console.log(`[NETWORK] Internal connectivity test: FAILED - Status ${response.status}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log(`[NETWORK] Internal connectivity test: TIMEOUT after 5 seconds`);
        } else {
          console.log(`[NETWORK] Internal connectivity test: ERROR -`, error.message);
        }
      }
    }, 1000);
  });

  // Enhanced error handling for network issues
  server.on('error', (error: any) => {
    console.error(`[SERVER ERROR] Server failed:`, error);
    if (error.code === 'EADDRINUSE') {
      console.error(`[SERVER ERROR] Port ${port} is already in use - kill existing process`);
    } else if (error.code === 'EACCES') {
      console.error(`[SERVER ERROR] Permission denied - check port access rights`);
    } else if (error.code === 'ENOTFOUND') {
      console.error(`[SERVER ERROR] Host resolution failed - check network configuration`);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SERVER] Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('[SERVER] Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('[SERVER] Received SIGINT, shutting down gracefully');
    server.close(() => {
      console.log('[SERVER] Server closed');
      process.exit(0);
    });
  });
})();