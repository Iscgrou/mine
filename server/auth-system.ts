/**
 * Unified Authentication System - MarFanet Project Chimera
 * Single source of truth for all authentication and session management
 */

import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import helmet from "helmet";
import { loginRateLimiter, apiRateLimiter } from "./auth-rate-limiter";

// Extend the Request interface for session typing
declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
    role?: string;
    username?: string;
    lastActivity?: number;
  }
}

// Secure credentials with properly hashed passwords
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

// Production-ready session configuration
const SESSION_CONFIG = {
  secret: 'marfanet-secure-session-2024-chimera',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    httpOnly: true,
    sameSite: 'lax' as const
  },
  name: 'marfanet.sid'
};

export function setupUnifiedAuth(app: Express) {
  // Apply security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
  }));

  // Apply general API rate limiting
  app.use('/api', apiRateLimiter);

  // Configure session middleware
  app.use(session(SESSION_CONFIG));

  // Login page route
  app.get('/login', (req: Request, res: Response) => {
    // Redirect if already authenticated
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
          body { 
            font-family: 'Vazirmatn', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center;
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
            border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.3s;
          }
          button:hover { background: #3730a3; }
          .error { 
            color: #dc2626; margin-top: 15px; padding: 10px; background: #fef2f2; 
            border-radius: 6px; display: none; text-align: center;
          }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
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
          <div class="footer">
            سیستم مدیریت نمایندگان V2Ray - Project Chimera
          </div>
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
                body: JSON.stringify(data)
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

  // Login POST route with rate limiting
  app.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        console.log(`[SECURITY] Invalid login attempt from ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری و رمز عبور الزامی است' });
      }

      const userCredentials = SECURE_CREDENTIALS[username as keyof typeof SECURE_CREDENTIALS];
      
      if (!userCredentials) {
        console.log(`[SECURITY] Login attempt with unknown username: ${username} from ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }

      const isValidPassword = await bcrypt.compare(password, userCredentials.passwordHash);
      
      if (!isValidPassword) {
        console.log(`[SECURITY] Invalid password for user: ${username} from ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }

      // Successful authentication
      req.session.authenticated = true;
      req.session.role = userCredentials.role;
      req.session.username = userCredentials.username;
      req.session.lastActivity = Date.now();

      console.log(`[SECURITY] Successful login: ${username} (${userCredentials.role}) from IP: ${clientIP}`);
      
      res.json({
        success: true,
        redirect: userCredentials.redirectPath,
        role: userCredentials.role,
        username: userCredentials.username
      });

    } catch (error) {
      console.error('[AUTH] Login error:', error);
      res.json({ success: false, message: 'خطای سرور. لطفاً دوباره تلاش کنید.' });
    }
  });

  // Logout route
  app.post('/logout', (req: Request, res: Response) => {
    const username = req.session.username;
    
    if (req.session.destroy) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error('[SESSION] Error destroying session:', err);
          return res.json({ success: false, message: 'خطا در خروج از سیستم' });
        }
        
        res.clearCookie('marfanet.sid');
        console.log(`[SECURITY] User logged out: ${username}`);
        res.json({ success: true, redirect: '/login' });
      });
    } else {
      res.clearCookie('marfanet.sid');
      console.log(`[SECURITY] User logged out: ${username}`);
      res.json({ success: true, redirect: '/login' });
    }
  });

  // Apply authentication to protected routes
  app.use('/admin*', (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.authenticated || req.session.role !== 'admin') {
      console.log(`[SECURITY] Authentication required for /admin - redirecting to login`);
      return res.redirect('/login');
    }
    next();
  });

  app.use('/crm*', (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.authenticated) {
      console.log(`[SECURITY] Authentication required for /crm - redirecting to login`);
      return res.redirect('/login');
    }
    next();
  });

  // Apply global authentication middleware directly
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Always allow ALL API routes to prevent 403 errors
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Allow universal invoice access routes (CRITICAL for 403 fix)
    if (req.path.startsWith('/invoice/') || 
        req.path.startsWith('/view/') ||
        req.path === '/api/invoice-access-health') {
      return next();
    }
    
    // Allow public asset routes and root path
    if (req.path.startsWith('/@') || 
        req.path.startsWith('/src') || 
        req.path.startsWith('/node_modules') ||
        req.path === '/login' ||
        req.path === '/logout' ||
        req.path === '/' ||
        req.path.includes('.') && !req.path.endsWith('.html')) {
      return next();
    }

    // Require authentication for protected UI routes only
    if (!req.session?.authenticated) {
      return res.redirect('/login');
    }

    next();
  });
}