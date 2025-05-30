/**
 * Emergency Access Fix for Admin Panel
 * This module provides alternative access methods when standard authentication fails
 */

import { type Express, type Request, type Response } from "express";

export function setupEmergencyAccess(app: Express) {
  // Alternative admin access route
  app.get('/admin-access', (req: Request, res: Response) => {
    console.log(`[EMERGENCY] Alternative admin access from ${req.ip}`);
    
    res.send(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MarFanet - دسترسی مدیریت</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
          }
          .logo {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1rem;
          }
          .access-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 30px 0;
          }
          .btn {
            padding: 15px 25px;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
          }
          .btn-admin {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .btn-admin:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }
          .btn-crm {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }
          .btn-crm:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(245, 87, 108, 0.3);
          }
          .status {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 0.9rem;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">MarFanet</div>
          <div class="subtitle">سیستم مدیریت CRM پیشرفته</div>
          
          <div class="status">
            <strong>وضعیت سرور:</strong> ✅ فعال<br>
            <strong>زمان:</strong> ${new Date().toLocaleString('fa-IR')}<br>
            <strong>IP شما:</strong> ${req.ip}
          </div>
          
          <div class="access-buttons">
            <a href="/ciwomplefoadm867945" class="btn btn-admin">
              🛡️ ورود به پنل مدیریت
            </a>
            <a href="/csdfjkjfoascivomrm867945" class="btn btn-crm">
              👥 ورود به پنل CRM
            </a>
          </div>
          
          <p style="font-size: 0.9rem; color: #888; margin-top: 30px;">
            در صورت بروز مشکل، از این صفحه برای دسترسی استفاده کنید
          </p>
        </div>
        
        <script>
          // Auto-redirect to admin panel after 3 seconds if no action taken
          setTimeout(() => {
            if (confirm('آیا می‌خواهید به پنل مدیریت منتقل شوید؟')) {
              window.location.href = '/ciwomplefoadm867945';
            }
          }, 3000);
        </script>
      </body>
      </html>
    `);
  });

  // Direct admin panel route that bypasses authentication
  app.get('/direct-admin', (req: Request, res: Response) => {
    console.log(`[EMERGENCY] Direct admin panel access from ${req.ip}`);
    req.url = '/ciwomplefoadm867945';
    // Continue to next middleware to serve the actual admin panel
  });

  // Emergency status check
  app.get('/status-check', (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      message: 'MarFanet server is running correctly',
      adminPath: '/ciwomplefoadm867945',
      crmPath: '/csdfjkjfoascivomrm867945',
      emergencyAccess: '/admin-access'
    });
  });
}