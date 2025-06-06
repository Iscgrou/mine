/**
 * Safari Browser Compatibility Layer
 * Addresses Safari-specific network and security requirements
 */

import { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";

export class SafariCompatibility {
  
  static setupSafariHeaders(app: Express) {
    // Enhanced CORS configuration for Safari compatibility
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
      exposedHeaders: ['Content-Length', 'Content-Type'],
      maxAge: 86400 // 24 hours
    }));

    // Safari-specific middleware for enhanced compatibility
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Safari cache control for proper resource loading
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
      
      // Safari security headers
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'SAMEORIGIN');
      res.header('X-XSS-Protection', '1; mode=block');
      
      // Permissive CSP for Safari development
      res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; img-src 'self' data: blob: *; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *; connect-src 'self' *;");
      
      // Safari-specific connection headers
      res.header('Connection', 'keep-alive');
      res.header('Keep-Alive', 'timeout=120, max=1000');
      
      next();
    });

    // Handle Safari preflight requests
    app.options('*', (req: Request, res: Response) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.sendStatus(200);
    });
  }

  static createSafariTestEndpoint(app: Express) {
    // Safari connectivity test endpoint
    app.get('/safari-test', (req: Request, res: Response) => {
      const userAgent = req.get('User-Agent') || '';
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        browser: isSafari ? 'Safari' : 'Other',
        userAgent: userAgent,
        headers: req.headers,
        clientIP: req.ip || 'unknown',
        safariOptimized: true,
        message: 'Safari compatibility test successful'
      });
    });
  }

  static addSafariRootHandler(app: Express) {
    // Safari-optimized root path handler
    app.get('/', (req: Request, res: Response) => {
      const userAgent = req.get('User-Agent') || '';
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      
      if (isSafari) {
        // Safari-specific response
        res.send(`
          <!DOCTYPE html>
          <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
            <meta http-equiv="Pragma" content="no-cache">
            <meta http-equiv="Expires" content="0">
            <title>MarFanet - Safari Compatible</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                max-width: 500px;
                width: 100%;
              }
              h1 {
                color: #4f46e5;
                margin-bottom: 20px;
              }
              .status {
                background: #10b981;
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .actions {
                margin-top: 30px;
              }
              button {
                background: #4f46e5;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                margin: 5px;
                font-size: 16px;
              }
              button:hover {
                background: #3730a3;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>MarFanet</h1>
              <div class="status">
                ✓ Safari Browser Detected<br>
                ✓ Server Connection Successful<br>
                ✓ Compatibility Mode Active
              </div>
              <p>سیستم مدیریت نمایندگان V2Ray با بهینه‌سازی برای مرورگر Safari</p>
              
              <div class="actions">
                <button onclick="location.href='/login'">ورود به سیستم</button>
                <button onclick="testConnectivity()">تست اتصال</button>
              </div>
              
              <div id="test-results"></div>
            </div>
            
            <script>
              function testConnectivity() {
                fetch('/safari-test')
                  .then(response => response.json())
                  .then(data => {
                    document.getElementById('test-results').innerHTML = 
                      '<div style="background: #10b981; color: white; padding: 10px; margin-top: 15px; border-radius: 5px;">' +
                      'تست اتصال موفقیت‌آمیز: ' + data.message + '</div>';
                  })
                  .catch(error => {
                    document.getElementById('test-results').innerHTML = 
                      '<div style="background: #ef4444; color: white; padding: 10px; margin-top: 15px; border-radius: 5px;">' +
                      'خطا در اتصال: ' + error.message + '</div>';
                  });
              }
              
              // Auto-test connectivity on load
              setTimeout(testConnectivity, 1000);
            </script>
          </body>
          </html>
        `);
      } else {
        // For non-Safari browsers, send minimal redirect
        res.redirect('/app');
      }
    });
  }
}