/**
 * Simple Authentication System with Login Page
 * Replaces complex secret paths with a standard login approach
 */

import { type Express, type Request, type Response } from "express";
import session from "express-session";
import bcrypt from "bcrypt";

// Secure credentials with role-based access
const CREDENTIALS = {
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

// Rate limiting storage
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

export function setupSimpleAuth(app: Express) {
  // Configure session middleware
  app.use(session({
    secret: 'marfanet-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Login page route
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
            padding: 20px;
          }
          .login-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          .logo {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1rem;
          }
          .form-group {
            margin-bottom: 20px;
            text-align: right;
          }
          .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
          }
          .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
            direction: ltr;
            text-align: left;
          }
          .form-group input:focus {
            outline: none;
            border-color: #667eea;
          }
          .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .login-btn:hover {
            transform: translateY(-2px);
          }
          .error {
            color: #e74c3c;
            margin-top: 15px;
            padding: 10px;
            background: #fdf2f2;
            border-radius: 8px;
            display: none;
          }
          .features {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: right;
          }
          .feature {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 8px;
          }
          .feature::before {
            content: "✓";
            color: #27ae60;
            font-weight: bold;
            margin-left: 8px;
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <div class="logo">MarFanet</div>
          <div class="subtitle">سیستم مدیریت CRM پیشرفته</div>
          
          <form id="loginForm" method="POST" action="/login">
            <div class="form-group">
              <label for="username">نام کاربری:</label>
              <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
              <label for="password">رمز عبور:</label>
              <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="login-btn">ورود به سیستم</button>
            
            <div id="error" class="error">
              نام کاربری یا رمز عبور اشتباه است
            </div>
          </form>
          
          <div class="features">
            <div class="feature">مدیریت نمایندگان و فاکتورها</div>
            <div class="feature">گزارش‌گیری پیشرفته و تحلیل داده</div>
            <div class="feature">پنل CRM هوشمند</div>
            <div class="feature">پردازش صوتی فارسی</div>
          </div>
        </div>
        
        <script>
          document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            fetch('/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                window.location.href = '/admin';
              } else {
                document.getElementById('error').style.display = 'block';
              }
            })
            .catch(error => {
              console.error('Error:', error);
              document.getElementById('error').style.display = 'block';
            });
          });
        </script>
      </body>
      </html>
    `);
  });

  // Rate limiting helper function
  const checkRateLimit = (ip: string): boolean => {
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    
    if (!attempt) {
      loginAttempts.set(ip, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset count if more than 15 minutes have passed
    if (now - attempt.lastAttempt > 15 * 60 * 1000) {
      loginAttempts.set(ip, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Block if more than 5 attempts in 15 minutes
    if (attempt.count >= 5) {
      return false;
    }
    
    attempt.count++;
    attempt.lastAttempt = now;
    return true;
  };

  // Login POST route with enhanced security
  app.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`);
      return res.json({ 
        success: false, 
        message: 'تعداد تلاش‌های ورود بیش از حد مجاز. لطفاً 15 دقیقه صبر کنید.' 
      });
    }
    
    // Find matching credentials
    const userCredentials = Object.values(CREDENTIALS).find(cred => cred.username === username);
    
    if (!userCredentials) {
      console.log(`[SECURITY] Invalid username attempt: ${username} from IP: ${clientIP}`);
      return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = bcrypt.compareSync(password, userCredentials.passwordHash);
    
    if (isPasswordValid) {
      // Successful login
      (req.session as any).authenticated = true;
      (req.session as any).username = username;
      (req.session as any).role = userCredentials.role;
      
      // Reset rate limiting for this IP on successful login
      loginAttempts.delete(clientIP);
      
      console.log(`[SECURITY] Successful login: ${username} (${userCredentials.role}) from IP: ${clientIP}`);
      
      res.json({ 
        success: true, 
        redirect: userCredentials.redirectPath,
        role: userCredentials.role
      });
    } else {
      console.log(`[SECURITY] Invalid password attempt for user: ${username} from IP: ${clientIP}`);
      res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
    }
  });

  // Admin panel route (protected - admin role only)
  app.get('/admin', (req: Request, res: Response, next) => {
    if (!(req.session as any)?.authenticated) {
      return res.redirect('/login');
    }
    
    // Ensure user has admin role
    if ((req.session as any).role !== 'admin') {
      console.log(`[SECURITY] Unauthorized admin access attempt by user: ${(req.session as any).username} (${(req.session as any).role})`);
      return res.redirect('/crm'); // Redirect CRM users to their panel
    }
    
    next();
  });

  // CRM panel route (protected - both admin and crm roles allowed)
  app.get('/crm', (req: Request, res: Response, next) => {
    if (!(req.session as any)?.authenticated) {
      return res.redirect('/login');
    }
    
    // Both admin and crm roles can access CRM panel
    const userRole = (req.session as any).role;
    if (userRole !== 'admin' && userRole !== 'crm') {
      console.log(`[SECURITY] Unauthorized CRM access attempt by user: ${(req.session as any).username} (${userRole})`);
      return res.redirect('/login');
    }
    
    next();
  });

  // Logout route
  app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/login');
    });
  });

  // Authentication middleware with enhanced protection
  return (req: Request, res: Response, next: any) => {
    // Allow static assets, API routes, and login page
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/@') || 
        req.path.startsWith('/src') || 
        req.path.startsWith('/node_modules') ||
        req.path === '/login' ||
        req.path === '/logout' ||
        req.path.includes('.') && !req.path.endsWith('.html')) {
      return next();
    }

    // Block any attempts to access old secret paths with 404
    const blockedPaths = [
      '/ciwomplefoadm867945',
      '/csdfjkjfoascivomrm867945', 
      '/emergency-admin-access',
      '/emergency-crm-access',
      '/diagnostic'
    ];
    
    if (blockedPaths.some(path => req.path.startsWith(path))) {
      console.log(`[SECURITY] Blocked access to deprecated secret path: ${req.path} from IP: ${req.ip}`);
      return res.status(404).send('Not Found');
    }

    // Handle root path redirect
    if (req.path === '/' || req.path === '/index.html') {
      if (!(req.session as any)?.authenticated) {
        return res.redirect('/login');
      }
      
      // Redirect authenticated users to their appropriate panel
      const userRole = (req.session as any).role;
      const redirectPath = userRole === 'admin' ? '/admin' : '/crm';
      return res.redirect(redirectPath);
    }

    // Check if user is authenticated
    if ((req.session as any)?.authenticated) {
      return next();
    }
    
    // Redirect unauthenticated users to login
    return res.redirect('/login');
  };
}