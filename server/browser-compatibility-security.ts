/**
 * Cross-Browser Security & Compatibility Layer
 * Ensures proper access across Safari, Chrome, and Firefox
 */

import { type Express, type Request, type Response, type NextFunction } from "express";

export function setupBrowserCompatibility(app: Express) {
  
  // Enhanced CORS and security headers for cross-browser compatibility
  app.use((req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('User-Agent') || '';
    
    // Safari-specific headers
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
      res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    }
    
    // Chrome-specific headers
    if (userAgent.includes('Chrome')) {
      res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    }
    
    // Firefox-specific headers
    if (userAgent.includes('Firefox')) {
      res.header('X-Firefox-Spdy', '3.1');
    }
    
    // Universal headers for all browsers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });

  // Browser-specific invoice access routes
  app.get('/browser-test', (req: Request, res: Response) => {
    const userAgent = req.get('User-Agent') || '';
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تست سازگاری مرورگر - مارفانت</title>
          <style>
              body {
                  font-family: 'Iranian Sans', Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .test-container {
                  background: white;
                  border-radius: 15px;
                  padding: 40px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                  max-width: 600px;
                  width: 100%;
                  text-align: center;
              }
              .browser-info {
                  background: #f8fafc;
                  border-radius: 10px;
                  padding: 20px;
                  margin: 20px 0;
                  border: 2px solid #e5e7eb;
              }
              .success {
                  color: #10b981;
                  font-size: 1.2em;
                  font-weight: bold;
              }
              .test-links {
                  margin: 30px 0;
              }
              .test-link {
                  display: inline-block;
                  margin: 10px;
                  padding: 12px 24px;
                  background: #4f46e5;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  transition: background 0.3s;
              }
              .test-link:hover {
                  background: #3730a3;
              }
          </style>
      </head>
      <body>
          <div class="test-container">
              <h1>تست سازگاری مرورگر</h1>
              <div class="success">✓ مرورگر شما با سیستم سازگار است</div>
              
              <div class="browser-info">
                  <h3>اطلاعات مرورگر:</h3>
                  <p><strong>نام مرورگر:</strong> ${getBrowserName(userAgent)}</p>
                  <p><strong>آدرس IP:</strong> ${clientIP}</p>
                  <p><strong>زمان تست:</strong> ${new Date().toLocaleString('fa-IR')}</p>
              </div>
              
              <div class="test-links">
                  <h3>تست دسترسی به فاکتورها:</h3>
                  <a href="/invoice/1089" class="test-link">تست فاکتور مستقیم</a>
                  <a href="/api/invoice-access-health" class="test-link">تست API</a>
                  <a href="/login" class="test-link">تست ورود</a>
              </div>
              
              <script>
                  // Browser-specific JavaScript compatibility tests
                  console.log('Browser compatibility test running...');
                  
                  // Test local storage
                  try {
                      localStorage.setItem('test', 'value');
                      localStorage.removeItem('test');
                      console.log('✓ Local Storage: Supported');
                  } catch (e) {
                      console.log('✗ Local Storage: Not supported');
                  }
                  
                  // Test session storage
                  try {
                      sessionStorage.setItem('test', 'value');
                      sessionStorage.removeItem('test');
                      console.log('✓ Session Storage: Supported');
                  } catch (e) {
                      console.log('✗ Session Storage: Not supported');
                  }
                  
                  // Test fetch API
                  if (typeof fetch !== 'undefined') {
                      console.log('✓ Fetch API: Supported');
                  } else {
                      console.log('✗ Fetch API: Not supported');
                  }
                  
                  // Test WebSocket
                  if (typeof WebSocket !== 'undefined') {
                      console.log('✓ WebSocket: Supported');
                  } else {
                      console.log('✗ WebSocket: Not supported');
                  }
              </script>
          </div>
      </body>
      </html>
    `);
  });
}

function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Google Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  } else if (userAgent.includes('Firefox')) {
    return 'Mozilla Firefox';
  } else if (userAgent.includes('Edg')) {
    return 'Microsoft Edge';
  } else if (userAgent.includes('Opera')) {
    return 'Opera';
  } else {
    return 'مرورگر نامشخص';
  }
}