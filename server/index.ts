import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerRepresentativesBalanceEndpoint } from "./representatives-balance-fix";
import { setupVite, serveStatic, log } from "./vite";
import { AUTH_CONFIG, isAuthorizedPath } from "./auth-config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Path-based access control middleware with enhanced debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  // Log all incoming requests for debugging
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.path} from ${req.ip}`);
  
  // Apply security headers to all responses
  Object.entries(AUTH_CONFIG.SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  // Allow API routes to pass through (they're accessed via AJAX from authorized pages)
  if (req.path.startsWith('/api/')) {
    console.log(`[DEBUG] API route allowed: ${req.path}`);
    return next();
  }

  // Allow Vite development assets to pass through
  if (req.path.startsWith('/@vite/') || 
      req.path.startsWith('/@react-refresh') || 
      req.path.startsWith('/@fs/') ||
      req.path.startsWith('/src/') ||
      req.path.startsWith('/node_modules/')) {
    console.log(`[DEBUG] Vite asset allowed: ${req.path}`);
    return next();
  }

  // Allow static assets (CSS, JS, images) to pass through
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|tsx|ts|jsx)$/)) {
    console.log(`[DEBUG] Static asset allowed: ${req.path}`);
    return next();
  }

  // Handle root path - redirect to admin interface for testing during development
  if (req.path === '/' || req.path === '/index.html') {
    if (app.get("env") === "development") {
      // In development, redirect to admin secret path for easier testing
      return res.redirect(`/${AUTH_CONFIG.ADMIN_SECRET_PATH}`);
    } else {
      // In production, show access denied
      console.log(`[SECURITY] Unauthorized access attempt: ${req.path} from ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
      
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Safari-No-Redirect': '1',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      });
      
      return res.status(403).send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>دسترسی غیرمجاز</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f5f5f5; 
              color: #333; 
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            h1 { color: #d32f2f; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚫 دسترسی غیرمجاز</h1>
            <p>شما مجاز به دسترسی به این صفحه نیستید</p>
            <p>Access Denied - Unauthorized</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  // Check if path is authorized (admin or CRM secret paths)
  const isAuthorized = isAuthorizedPath(req.path);
  console.log(`[DEBUG] Path authorization check: ${req.path} -> ${isAuthorized}`);
  
  // Allow admin and CRM secret paths
  if (isAuthorized) {
    console.log(`[DEBUG] Authorized path allowed: ${req.path}`);
    return next();
  }
  
  // Block unauthorized paths (except development mode)
  if (app.get("env") !== "development" && !isAuthorized) {
    console.log(`[SECURITY] Unauthorized access attempt: ${req.path} from ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Safari-No-Redirect': '1',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });
    
    return res.status(403).send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>دسترسی غیرمجاز</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5; 
            color: #333; 
          }
          .container { 
            max-width: 400px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          h1 { color: #d32f2f; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚫 دسترسی غیرمجاز</h1>
          <p>شما مجاز به دسترسی به این صفحه نیستید</p>
          <p>Access Denied - Unauthorized</p>
        </div>
      </body>
      </html>
    `);
  }

  // In development mode, allow all paths for easier debugging
  if (app.get("env") === "development") {
    console.log(`[DEBUG] Development mode - allowing path: ${req.path}`);
    return next();
  }
  
  // If authorized path, continue to serve the application
  next();
});

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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
