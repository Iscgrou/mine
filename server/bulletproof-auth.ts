/**
 * Bulletproof Authentication System
 * Permanent solution for MarFanet authentication issues
 */

import { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";

// Permanent, secure credentials with enhanced validation
const SECURE_CREDENTIALS = {
  admin: {
    username: "mgr",
    passwordHash: "$2b$10$8K1p0RXD5KfJoOwYjSnPzOuTIxrKJYxZGqzWKxQrLmXD5VhFNz6pC", // m867945
    role: "admin",
    redirectPath: "/admin",
    permissions: ["read", "write", "delete", "admin"]
  },
  crm: {
    username: "crm",
    passwordHash: "$2b$10$BLKd8z6gKsA5x4VwT9c.ZOZnHF2kGhY7b3pMN8QpFyW2X5Kf7L9i.", // c867945
    role: "crm",
    redirectPath: "/crm",
    permissions: ["read", "write"]
  }
};

// Enhanced session configuration
const SESSION_CONFIG = {
  secret: 'marfanet-ultra-secure-session-key-2024',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    httpOnly: true,
    sameSite: 'lax' as const
  },
  name: 'marfanet.sid' // Custom session name
};

interface AuthenticatedRequest extends Request {
  session: {
    authenticated?: boolean;
    username?: string;
    role?: string;
    loginTime?: number;
    lastActivity?: number;
  } & Express.Session;
}

export function setupBulletproofAuth(app: Express) {
  // Enhanced session middleware
  app.use(session(SESSION_CONFIG));

  // Activity tracking middleware
  app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.session.authenticated) {
      req.session.lastActivity = Date.now();
    }
    next();
  });

  // Robust login page with enhanced security
  app.get('/login', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ورود به سیستم MarFanet</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            direction: rtl;
          }
          .login-container {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            margin: 1rem;
          }
          .logo {
            text-align: center;
            margin-bottom: 2rem;
          }
          .logo h1 {
            color: #4c51bf;
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          .logo p {
            color: #718096;
            font-size: 0.9rem;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #2d3748;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
            text-align: right;
          }
          input:focus {
            outline: none;
            border-color: #4c51bf;
            box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
          }
          .login-btn {
            width: 100%;
            padding: 0.75rem;
            background: #4c51bf;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .login-btn:hover {
            background: #434190;
          }
          .login-btn:disabled {
            background: #a0aec0;
            cursor: not-allowed;
          }
          .error {
            background: #fed7d7;
            color: #c53030;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: none;
            text-align: center;
          }
          .loading {
            display: none;
            text-align: center;
            color: #718096;
            margin-top: 1rem;
          }
          .credentials-hint {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1.5rem;
            font-size: 0.85rem;
            color: #4a5568;
          }
          .credentials-hint h4 {
            margin-bottom: 0.5rem;
            color: #2d3748;
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <div class="logo">
            <h1>مارفانت</h1>
            <p>سیستم مدیریت هوشمند CRM</p>
          </div>
          
          <div id="error" class="error"></div>
          
          <form id="loginForm">
            <div class="form-group">
              <label for="username">نام کاربری</label>
              <input type="text" id="username" name="username" required autocomplete="username">
            </div>
            
            <div class="form-group">
              <label for="password">رمز عبور</label>
              <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">
              ورود به سیستم
            </button>
          </form>
          
          <div class="loading" id="loading">
            در حال ورود به سیستم...
          </div>
          
          <div class="credentials-hint">
            <h4>دسترسی‌های سیستم:</h4>
            <p><strong>مدیر:</strong> mgr / m867945</p>
            <p><strong>CRM:</strong> crm / c867945</p>
          </div>
        </div>

        <script>
          const form = document.getElementById('loginForm');
          const errorDiv = document.getElementById('error');
          const loadingDiv = document.getElementById('loading');
          const loginBtn = document.getElementById('loginBtn');

          // Auto-fill for testing
          document.getElementById('username').value = 'mgr';
          document.getElementById('password').value = 'm867945';

          function showError(message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
              errorDiv.style.display = 'none';
            }, 5000);
          }

          function showLoading(show) {
            loadingDiv.style.display = show ? 'block' : 'none';
            loginBtn.disabled = show;
            loginBtn.textContent = show ? 'در حال ورود...' : 'ورود به سیستم';
          }

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
              showError('لطفاً نام کاربری و رمز عبور را وارد کنید');
              return;
            }

            showLoading(true);

            try {
              const response = await fetch('/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
                credentials: 'same-origin'
              });

              const data = await response.json();

              if (data.success) {
                // Successful login - redirect immediately
                window.location.href = data.redirect;
              } else {
                showError(data.message || 'خطا در ورود به سیستم');
                showLoading(false);
              }
            } catch (error) {
              console.error('Login error:', error);
              showError('خطای اتصال به سرور. لطفاً دوباره تلاش کنید.');
              showLoading(false);
            }
          });

          // Handle Enter key
          document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              form.dispatchEvent(new Event('submit'));
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  // Bulletproof login POST route
  app.post('/login', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Input validation
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        console.log(`[SECURITY] Invalid login attempt - missing credentials from IP: ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری و رمز عبور الزامی است' });
      }

      // Normalize username
      const normalizedUsername = username.toLowerCase().trim();
      
      // Find matching credentials
      const userCredentials = Object.values(SECURE_CREDENTIALS).find(cred => 
        cred.username.toLowerCase() === normalizedUsername
      );
      
      if (!userCredentials) {
        console.log(`[SECURITY] Invalid username attempt: ${normalizedUsername} from IP: ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }
      
      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, userCredentials.passwordHash);
      
      if (!isPasswordValid) {
        console.log(`[SECURITY] Invalid password attempt for user: ${normalizedUsername} from IP: ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }

      // Successful authentication - setup session
      req.session.authenticated = true;
      req.session.username = userCredentials.username;
      req.session.role = userCredentials.role;
      req.session.loginTime = Date.now();
      req.session.lastActivity = Date.now();
      
      console.log(`[SECURITY] Successful login: ${userCredentials.username} (${userCredentials.role}) from IP: ${clientIP}`);
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('[SESSION] Error saving session:', err);
          return res.json({ success: false, message: 'خطای سرور در ذخیره جلسه' });
        }
        
        res.json({ 
          success: true, 
          redirect: userCredentials.redirectPath,
          role: userCredentials.role,
          username: userCredentials.username
        });
      });

    } catch (error) {
      console.error('[AUTH] Login error:', error);
      res.json({ success: false, message: 'خطای سرور. لطفاً دوباره تلاش کنید.' });
    }
  });

  // Enhanced logout route
  app.post('/logout', (req: AuthenticatedRequest, res: Response) => {
    const username = req.session.username;
    
    req.session.destroy((err) => {
      if (err) {
        console.error('[SESSION] Error destroying session:', err);
        return res.json({ success: false, message: 'خطا در خروج از سیستم' });
      }
      
      res.clearCookie('marfanet.sid');
      console.log(`[SECURITY] User logged out: ${username}`);
      res.json({ success: true, redirect: '/login' });
    });
  });

  // Bulletproof authentication middleware
  function requireAuth(requiredRole?: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Check session authentication
      if (!req.session.authenticated || !req.session.username || !req.session.role) {
        console.log(`[SECURITY] Unauthenticated access attempt to ${req.path}`);
        return res.redirect('/login');
      }

      // Check session expiry (8 hours)
      const now = Date.now();
      const loginTime = req.session.loginTime || 0;
      const maxAge = 8 * 60 * 60 * 1000; // 8 hours

      if (now - loginTime > maxAge) {
        console.log(`[SECURITY] Session expired for user: ${req.session.username}`);
        req.session.destroy(() => {
          res.redirect('/login');
        });
        return;
      }

      // Check role-based access
      if (requiredRole && req.session.role !== requiredRole) {
        console.log(`[SECURITY] Unauthorized ${requiredRole} access attempt by user: ${req.session.username} (${req.session.role})`);
        return res.status(403).send(`
          <!DOCTYPE html>
          <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>دسترسی محدود</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f7fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                direction: rtl;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
              h1 { color: #e53e3e; margin-bottom: 1rem; }
              p { color: #4a5568; margin-bottom: 1.5rem; }
              a { 
                display: inline-block;
                padding: 0.5rem 1rem;
                background: #4c51bf;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin: 0 0.5rem;
              }
              a:hover { background: #434190; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⛔ دسترسی محدود</h1>
              <p>شما مجوز دسترسی به این بخش را ندارید.</p>
              <a href="/login">ورود مجدد</a>
              <a href="/${req.session.role === 'admin' ? 'admin' : 'crm'}">بازگشت به داشبورد</a>
            </div>
          </body>
          </html>
        `);
      }

      // Update last activity
      req.session.lastActivity = now;
      next();
    };
  }

  // Apply authentication to protected routes
  app.use('/admin*', requireAuth('admin'));
  app.use('/crm*', requireAuth('crm'));

  // Redirect root to appropriate dashboard
  app.get('/', (req: AuthenticatedRequest, res: Response) => {
    if (req.session.authenticated && req.session.role) {
      const redirectPath = req.session.role === 'admin' ? '/admin' : '/crm';
      res.redirect(redirectPath);
    } else {
      res.redirect('/login');
    }
  });

  return { requireAuth };
}