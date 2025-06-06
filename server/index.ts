import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { setupAdaptiveAuth } from "./adaptive-auth";
import { registerRepresentativesBalanceEndpoint } from "./representatives-balance-fix";
import { registerCRTPerformanceRoutes } from "./crt-performance-monitor";
import { createUniversalInvoiceAccess } from "./invoice-access-security";
import { NetworkDiagnostic } from "./network-diagnostic";

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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  // Setup adaptive authentication system (no global blocking middleware)
  setupAdaptiveAuth(app);

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  const host = "0.0.0.0";
  
  server.listen(port, host, () => {
    log(`Server listening on http://${host}:${port}`);
    console.log(`[NETWORK] Server accessible on all network interfaces`);
    console.log(`[NETWORK] Local access: http://localhost:${port}`);
    console.log(`[NETWORK] Network access: http://0.0.0.0:${port}`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    console.error(`[SERVER ERROR] Failed to start server:`, error);
    if (error.code === 'EADDRINUSE') {
      console.error(`[SERVER ERROR] Port ${port} is already in use`);
    } else if (error.code === 'EACCES') {
      console.error(`[SERVER ERROR] Permission denied to bind to port ${port}`);
    }
    process.exit(1);
  });
})();