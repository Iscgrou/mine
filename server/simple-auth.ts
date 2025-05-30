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

// Rate limiting disabled for development

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

  // Rate limiting completely disabled for development

  // Enhanced Login POST route with permanent session management
  app.post('/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Input validation
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        console.log(`[SECURITY] Invalid login attempt - missing credentials from IP: ${clientIP}`);
        return res.json({ success: false, message: 'نام کاربری و رمز عبور الزامی است' });
      }

      // Normalize username to handle case sensitivity
      const normalizedUsername = username.toLowerCase().trim();
      
      // Find matching credentials with normalized comparison
      const userCredentials = Object.values(CREDENTIALS).find(cred => 
        cred.username.toLowerCase() === normalizedUsername
      );
      
      if (!userCredentials) {
        console.log(`[SECURITY] Invalid username attempt: ${normalizedUsername} from IP: ${clientIP}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent timing attacks
        return res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }
      
      // Verify password using bcrypt with async comparison
      const isPasswordValid = await bcrypt.compare(password, userCredentials.passwordHash);
      
      if (isPasswordValid) {
        // Enhanced session setup with regeneration
        req.session.regenerate((err) => {
          if (err) {
            console.error(`[SESSION] Error regenerating session: ${err}`);
          }
          
          // Set session data
          (req.session as any).authenticated = true;
          (req.session as any).username = userCredentials.username;
          (req.session as any).role = userCredentials.role;
          (req.session as any).loginTime = Date.now();
          (req.session as any).lastActivity = Date.now();
          
          // Force session save
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error(`[SESSION] Error saving session: ${saveErr}`);
              return res.json({ success: false, message: 'خطای سرور در ذخیره جلسه' });
            }
            
            console.log(`[SECURITY] Successful login: ${userCredentials.username} (${userCredentials.role}) from IP: ${clientIP}`);
            
            res.json({ 
              success: true, 
              redirect: userCredentials.redirectPath,
              role: userCredentials.role,
              username: userCredentials.username
            });
          });
        });
      } else {
        console.log(`[SECURITY] Invalid password attempt for user: ${normalizedUsername} from IP: ${clientIP}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent timing attacks
        res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
      }
    } catch (error) {
      console.error(`[AUTH] Login error: ${error}`);
      res.json({ success: false, message: 'خطای سرور. لطفاً دوباره تلاش کنید.' });
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

  // Enhanced Authentication middleware with permanent session validation
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

    // Enhanced session validation with automatic recovery
    const session = req.session as any;
    const isAuthenticated = session?.authenticated === true;
    const hasValidUser = session?.username && session?.role;
    const currentTime = Date.now();
    const sessionAge = currentTime - (session?.loginTime || 0);
    const maxSessionAge = 8 * 60 * 60 * 1000; // 8 hours

    // Handle root path redirect with robust authentication check
    if (req.path === '/' || req.path === '/index.html') {
      if (!isAuthenticated || !hasValidUser || sessionAge > maxSessionAge) {
        // Clear invalid session
        if (session) {
          session.authenticated = false;
          session.username = null;
          session.role = null;
        }
        return res.redirect('/login');
      }
      
      // Update last activity
      session.lastActivity = currentTime;
      
      // Redirect authenticated users to their appropriate panel
      const redirectPath = session.role === 'admin' ? '/admin' : '/crm';
      return res.redirect(redirectPath);
    }

    // Enhanced authentication check with session recovery
    if (isAuthenticated && hasValidUser && sessionAge <= maxSessionAge) {
      // Valid session - update activity and proceed
      session.lastActivity = currentTime;
      
      // Verify user still has correct role for the requested path
      const isAdminPath = req.path.startsWith('/admin');
      const isCrmPath = req.path.startsWith('/crm');
      
      if (isAdminPath && session.role !== 'admin') {
        console.log(`[SECURITY] Unauthorized admin access attempt by user: ${session.username} (${session.role})`);
        return res.status(403).send(`
          <!DOCTYPE html>
          <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>دسترسی محدود</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f7fafc; display: flex; align-items: center; justify-content: center;
                min-height: 100vh; margin: 0; direction: rtl;
              }
              .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              h1 { color: #e53e3e; margin-bottom: 1rem; }
              p { color: #4a5568; margin-bottom: 1.5rem; }
              a { display: inline-block; padding: 0.5rem 1rem; background: #4c51bf; color: white; text-decoration: none; border-radius: 4px; margin: 0 0.5rem; }
              a:hover { background: #434190; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⛔ دسترسی محدود</h1>
              <p>شما مجوز دسترسی به بخش مدیریت را ندارید.</p>
              <a href="/crm">بازگشت به CRM</a>
              <a href="/logout">خروج</a>
            </div>
          </body>
          </html>
        `);
      }
      
      if (isCrmPath && session.role !== 'crm' && session.role !== 'admin') {
        console.log(`[SECURITY] Unauthorized CRM access attempt by user: ${session.username} (${session.role})`);
        return res.status(403).send(`
          <!DOCTYPE html>
          <html lang="fa" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>دسترسی محدود</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f7fafc; display: flex; align-items: center; justify-content: center;
                min-height: 100vh; margin: 0; direction: rtl;
              }
              .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              h1 { color: #e53e3e; margin-bottom: 1rem; }
              p { color: #4a5568; margin-bottom: 1.5rem; }
              a { display: inline-block; padding: 0.5rem 1rem; background: #4c51bf; color: white; text-decoration: none; border-radius: 4px; margin: 0 0.5rem; }
              a:hover { background: #434190; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⛔ دسترسی محدود</h1>
              <p>شما مجوز دسترسی به این بخش را ندارید.</p>
              <a href="/login">ورود مجدد</a>
            </div>
          </body>
          </html>
        `);
      }
      
      return next();
    }
    
    // Invalid or expired session - force re-authentication
    if (session) {
      session.authenticated = false;
      session.username = null;
      session.role = null;
    }
    
    console.log(`[SECURITY] Authentication required for ${req.path} - redirecting to login`);
    return res.redirect('/login');
  };
}