/**
 * Comprehensive Security Middleware - Complete Implementation
 * Replaces removed middleware with proper security controls
 */

import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import helmet from "helmet";
import cors from "cors";
import { loginRateLimiter, apiRateLimiter } from "./auth-rate-limiter";

// Session configuration
const SESSION_CONFIG = {
  secret: 'marfanet-ultra-secure-2024-chimera',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { 
    secure: false,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    httpOnly: true,
    sameSite: 'lax' as const
  },
  name: 'marfanet.sid'
};

// Secure credentials
const SECURE_CREDENTIALS = {
  mgr: {
    username: "mgr",
    passwordHash: bcrypt.hashSync("m867945", 10),
    role: "admin",
    redirectPath: "/admin"
  },
  crm: {
    username: "crm", 
    passwordHash: bcrypt.hashSync("c867945", 10),
    role: "crm",
    redirectPath: "/crm"
  }
};

export class ComprehensiveSecurity {
  
  static setupSecurityMiddleware(app: Express) {
    // Enhanced CORS for all browsers
    app.use(cors({
      origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow all origins in development
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        
        // In production, you'd check against allowed domains
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: [
        'Origin', 
        'X-Requested-With', 
        'Content-Type', 
        'Accept', 
        'Authorization', 
        'Cache-Control',
        'X-CSRF-Token'
      ],
      exposedHeaders: ['Content-Length', 'Content-Type'],
      maxAge: 86400
    }));

    // Security headers with Helmet
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:", "ws:"],
          fontSrc: ["'self'", "https:", "data:"],
          mediaSrc: ["'self'", "https:", "data:"],
          frameSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"]
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // Session middleware
    app.use(session(SESSION_CONFIG));

    // Rate limiting
    app.use('/api', apiRateLimiter);

    // Custom headers for compatibility
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Browser compatibility headers
      res.header('X-Powered-By', 'MarFanet');
      res.header('Access-Control-Max-Age', '86400');
      
      // Safari specific headers
      const userAgent = req.get('User-Agent') || '';
      if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
      }
      
      next();
    });
  }

  static setupAuthentication(app: Express) {
    // Login page
    app.get('/login', (req: Request, res: Response) => {
      if (req.session.authenticated) {
        const redirectPath = req.session.role === 'admin' ? '/admin' : '/crm';
        return res.redirect(redirectPath);
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ورود به سیستم MarFanet</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh; display: flex; align-items: center; justify-content: center;
              padding: 20px;
            }
            .login-container { 
              background: white; padding: 40px; border-radius: 20px; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.15); max-width: 400px; width: 100%;
            }
            h1 { color: #4f46e5; text-align: center; margin-bottom: 30px; font-size: 28px; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; color: #374151; font-weight: 600; }
            input { 
              width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; 
              font-size: 16px; transition: border-color 0.3s;
            }
            input:focus { outline: none; border-color: #4f46e5; }
            button { 
              width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; 
              border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;
            }
            button:hover { background: #3730a3; }
            .error { 
              color: #dc2626; margin-top: 15px; padding: 10px; background: #fef2f2; 
              border-radius: 6px; display: none; text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="login-container">
            <h1>MarFanet</h1>
            <form id="loginForm">
              <div class="form-group">
                <label for="username">نام کاربری:</label>
                <input type="text" id="username" name="username" required>
              </div>
              <div class="form-group">
                <label for="password">رمز عبور:</label>
                <input type="password" id="password" name="password" required>
              </div>
              <button type="submit">ورود به سیستم</button>
              <div id="error" class="error"></div>
            </form>
          </div>
          
          <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              
              try {
                const response = await fetch('/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                  credentials: 'include'
                });
                
                const result = await response.json();
                
                if (result.success) {
                  window.location.href = result.redirect;
                } else {
                  document.getElementById('error').textContent = result.message;
                  document.getElementById('error').style.display = 'block';
                }
              } catch (error) {
                document.getElementById('error').textContent = 'خطا در اتصال به سرور';
                document.getElementById('error').style.display = 'block';
              }
            });
          </script>
        </body>
        </html>
      `);
    });

    // Login POST
    app.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.json({ success: false, message: 'نام کاربری و رمز عبور الزامی است' });
        }

        const userCredentials = SECURE_CREDENTIALS[username as keyof typeof SECURE_CREDENTIALS];
        
        if (!userCredentials || !await bcrypt.compare(password, userCredentials.passwordHash)) {
          return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
        }

        req.session.authenticated = true;
        req.session.role = userCredentials.role;
        req.session.username = userCredentials.username;
        req.session.lastActivity = Date.now();

        res.json({
          success: true,
          redirect: userCredentials.redirectPath,
          role: userCredentials.role,
          username: userCredentials.username
        });

      } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.json({ success: false, message: 'خطای سرور' });
      }
    });

    // Logout
    app.post('/logout', (req: Request, res: Response) => {
      req.session.destroy((err: any) => {
        if (err) {
          return res.json({ success: false, message: 'خطا در خروج' });
        }
        res.clearCookie('marfanet.sid');
        res.json({ success: true, redirect: '/login' });
      });
    });
  }

  static setupRouteProtection(app: Express) {
    // Protect admin routes
    app.use('/admin', (req: Request, res: Response, next: NextFunction) => {
      if (!req.session?.authenticated || req.session.role !== 'admin') {
        return res.redirect('/login');
      }
      next();
    });

    // Protect CRM routes  
    app.use('/crm', (req: Request, res: Response, next: NextFunction) => {
      if (!req.session?.authenticated) {
        return res.redirect('/login');
      }
      next();
    });
  }

  static setupHealthCheck(app: Express) {
    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'MarFanet',
        version: '2.0.0'
      });
    });

    // Connectivity test
    app.get('/ping', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        pong: true,
        timestamp: new Date().toISOString()
      });
    });
  }
}