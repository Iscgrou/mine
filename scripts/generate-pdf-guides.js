/**
 * PDF Guide Generator for MarFanet User Manuals
 * Converts Markdown user guides to professional PDF documents
 */

import fs from 'fs';
import path from 'path';

// Since we don't have puppeteer installed, we'll create an HTML version that can be converted to PDF
// This approach allows for better RTL support and Persian font rendering

function createHTMLTemplate(title, content, isRTL = true) {
  return `
<!DOCTYPE html>
<html lang="${isRTL ? 'fa' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Vazirmatn', 'Tahoma', 'Arial', sans-serif;
            line-height: 1.8;
            color: #333;
            background: #fff;
            direction: ${isRTL ? 'rtl' : 'ltr'};
            text-align: ${isRTL ? 'right' : 'left'};
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header h2 {
            font-size: 18px;
            font-weight: 400;
            opacity: 0.9;
        }
        
        .toc {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            border-right: 4px solid #667eea;
        }
        
        .toc h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 20px;
        }
        
        .toc ul {
            list-style: none;
        }
        
        .toc li {
            margin: 8px 0;
            padding-right: 15px;
        }
        
        .toc a {
            color: #555;
            text-decoration: none;
            font-weight: 500;
        }
        
        .toc a:hover {
            color: #667eea;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin: 30px 0 15px 0;
            font-weight: 600;
        }
        
        h1 {
            font-size: 26px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        h2 {
            font-size: 22px;
            color: #667eea;
        }
        
        h3 {
            font-size: 18px;
            color: #764ba2;
        }
        
        h4 {
            font-size: 16px;
            color: #555;
        }
        
        p {
            margin: 15px 0;
            text-align: justify;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-right: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        .section {
            margin: 40px 0;
            padding: 25px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .highlight {
            background: #e3f2fd;
            padding: 20px;
            border-right: 4px solid #2196f3;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .warning {
            background: #fff3e0;
            padding: 20px;
            border-right: 4px solid #ff9800;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .success {
            background: #e8f5e8;
            padding: 20px;
            border-right: 4px solid #4caf50;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .code {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            direction: ltr;
            text-align: left;
            margin: 15px 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
            display: block;
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .footer {
            margin-top: 60px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                font-size: 12px;
            }
            
            .header {
                background: #667eea !important;
                color: white !important;
            }
            
            .section {
                box-shadow: none;
                border: 1px solid #eee;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
}

function markdownToHTML(markdown) {
  // Basic markdown to HTML conversion
  let html = markdown;
  
  // Headers
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.*$)/gm, '<li>$1. $2</li>');
  
  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Clean up
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  
  // Add special styling for stats
  html = html.replace(/218 نماینده فعال/g, '<span class="stat-number">218</span><span class="stat-label">نماینده فعال</span>');
  html = html.replace(/68 فاکتور/g, '<span class="stat-number">68</span><span class="stat-label">فاکتور صادر شده</span>');
  html = html.replace(/245 مشتری/g, '<span class="stat-number">245</span><span class="stat-label">مشتری ثبت شده</span>');
  html = html.replace(/18 تیکت/g, '<span class="stat-number">18</span><span class="stat-label">تیکت فعال</span>');
  
  return html;
}

function generateAdminGuide() {
  const adminMarkdown = fs.readFileSync('docs/admin-panel-user-guide.md', 'utf8');
  const adminHTML = markdownToHTML(adminMarkdown);
  
  const fullHTML = createHTMLTemplate(
    'راهنمای جامع پنل مدیریت MarFanet',
    `
    <div class="header">
        <h1>راهنمای جامع پنل مدیریت MarFanet</h1>
        <h2>سیستم مدیریت هوشمند V2Ray برای فروشگاه‌های موبایل ایران</h2>
    </div>
    
    <div class="toc">
        <h3>فهرست مطالب</h3>
        <ul>
            <li><a href="#introduction">مقدمه و ورود به سیستم</a></li>
            <li><a href="#dashboard">داشبورد اصلی</a></li>
            <li><a href="#representatives">مدیریت نمایندگان</a></li>
            <li><a href="#invoices">مدیریت فاکتورها</a></li>
            <li><a href="#analytics">تحلیل‌گری پیشرفته</a></li>
            <li><a href="#settings">تنظیمات سیستم</a></li>
            <li><a href="#advanced-features">ویژگی‌های پیشرفته</a></li>
        </ul>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-number">218</span>
            <div class="stat-label">نماینده فعال</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">68</span>
            <div class="stat-label">فاکتور صادر شده</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">95%</span>
            <div class="stat-label">دقت پردازش صوت فارسی</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">24/7</span>
            <div class="stat-label">پشتیبانی سیستم Aegis</div>
        </div>
    </div>
    
    ${adminHTML}
    
    <div class="footer">
        <p><strong>MarFanet Admin Panel User Guide v2.0</strong></p>
        <p>تاریخ تهیه: 30 مه 2025 | نسخه: 2.0 | زبان: فارسی</p>
        <p>این راهنما برای استفاده مدیران سیستم MarFanet تهیه شده است</p>
    </div>
    `,
    true
  );
  
  fs.writeFileSync('docs/admin-panel-user-guide.html', fullHTML);
  console.log('✅ Admin Panel User Guide HTML created successfully');
}

function generateCRMGuide() {
  const crmMarkdown = fs.readFileSync('docs/crm-panel-user-guide.md', 'utf8');
  const crmHTML = markdownToHTML(crmMarkdown);
  
  const fullHTML = createHTMLTemplate(
    'راهنمای جامع پنل CRM MarFanet',
    `
    <div class="header">
        <h1>راهنمای جامع پنل CRM MarFanet</h1>
        <h2>سیستم مدیریت ارتباط با مشتریان هوشمند V2Ray</h2>
    </div>
    
    <div class="toc">
        <h3>فهرست مطالب</h3>
        <ul>
            <li><a href="#introduction">مقدمه و دسترسی</a></li>
            <li><a href="#dashboard">داشبورد CRM</a></li>
            <li><a href="#customers">مدیریت مشتریان</a></li>
            <li><a href="#tickets">سیستم تیکت‌ها</a></li>
            <li><a href="#call-preparation">آماده‌سازی هوشمند تماس</a></li>
            <li><a href="#voice-notes">یادداشت‌های صوتی</a></li>
            <li><a href="#followups">مدیریت پیگیری‌ها</a></li>
            <li><a href="#reports">گزارشات CRM</a></li>
        </ul>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-number">245</span>
            <div class="stat-label">مشتری ثبت شده</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">18</span>
            <div class="stat-label">تیکت فعال</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">95%</span>
            <div class="stat-label">دقت تشخیص صوت فارسی</div>
        </div>
        <div class="stat-card">
            <span class="stat-number">24/7</span>
            <div class="stat-label">هوش مصنوعی Nova</div>
        </div>
    </div>
    
    <div class="highlight">
        <h3>ویژگی‌های منحصر به فرد CRM MarFanet</h3>
        <ul>
            <li><strong>تشخیص اصطلاحات V2Ray فارسی:</strong> شادوساکس، تروجان، وی‌راهی</li>
            <li><strong>آماده‌سازی هوشمند تماس:</strong> تحلیل پروفایل مشتری با Vertex AI</li>
            <li><strong>پردازش صوت فارسی:</strong> دقت 95% در تبدیل گفتار به متن</li>
            <li><strong>تقویم شمسی:</strong> پیگیری و یادآوری بر اساس تاریخ فارسی</li>
        </ul>
    </div>
    
    ${crmHTML}
    
    <div class="footer">
        <p><strong>MarFanet CRM Panel User Guide v2.0</strong></p>
        <p>تاریخ تهیه: 30 مه 2025 | نسخه: 2.0 | زبان: فارسی</p>
        <p>این راهنما برای استفاده نمایندگان فروش MarFanet تهیه شده است</p>
    </div>
    `,
    true
  );
  
  fs.writeFileSync('docs/crm-panel-user-guide.html', fullHTML);
  console.log('✅ CRM Panel User Guide HTML created successfully');
}

function generateIndexPage() {
  const indexHTML = createHTMLTemplate(
    'راهنماهای کاربری MarFanet',
    `
    <div class="header">
        <h1>راهنماهای کاربری MarFanet</h1>
        <h2>مجموعه کامل راهنماهای استفاده از سیستم</h2>
    </div>
    
    <div class="section">
        <h2>🔧 راهنمای پنل مدیریت</h2>
        <p>راهنمای جامع برای مدیران سیستم MarFanet شامل مدیریت نمایندگان، فاکتورها، تحلیل‌گری و تنظیمات پیشرفته</p>
        <ul>
            <li>مدیریت 218 نماینده فعال</li>
            <li>صدور و پیگیری 68 فاکتور</li>
            <li>تحلیل‌گری پیشرفته با Vertex AI</li>
            <li>سیستم نظارت Aegis</li>
        </ul>
        <div class="highlight">
            <strong>فایل:</strong> <a href="admin-panel-user-guide.html">admin-panel-user-guide.html</a>
        </div>
    </div>
    
    <div class="section">
        <h2>💼 راهنمای پنل CRM</h2>
        <p>راهنمای کاربری برای نمایندگان فروش شامل مدیریت مشتریان، تیکت‌ها، پردازش صوت فارسی و هوش مصنوعی Nova</p>
        <ul>
            <li>مدیریت 245 مشتری</li>
            <li>سیستم تیکت‌گذاری پیشرفته</li>
            <li>پردازش صوت فارسی با دقت 95%</li>
            <li>آماده‌سازی هوشمند تماس</li>
        </ul>
        <div class="highlight">
            <strong>فایل:</strong> <a href="crm-panel-user-guide.html">crm-panel-user-guide.html</a>
        </div>
    </div>
    
    <div class="section">
        <h2>🎯 ویژگی‌های کلیدی سیستم</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-number">Vertex AI</span>
                <div class="stat-label">هوش مصنوعی Google</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">95%</span>
                <div class="stat-label">دقت پردازش فارسی</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">24/7</span>
                <div class="stat-label">نظارت سیستم</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">V2Ray</span>
                <div class="stat-label">متخصص در سرویس</div>
            </div>
        </div>
    </div>
    
    <div class="warning">
        <h3>⚠️ نکات مهم</h3>
        <ul>
            <li>این راهنماها برای نسخه 2.0 سیستم MarFanet تهیه شده‌اند</li>
            <li>برای تبدیل به PDF از قابلیت Print مرورگر استفاده کنید</li>
            <li>بهترین نمایش در مرورگرهای Chrome و Firefox</li>
            <li>فونت Vazirmatn برای نمایش بهتر متن فارسی استفاده شده</li>
        </ul>
    </div>
    
    <div class="footer">
        <p><strong>مجموعه راهنماهای کاربری MarFanet v2.0</strong></p>
        <p>تاریخ تهیه: 30 مه 2025 | تیم توسعه MarFanet</p>
        <p>برای پشتیبانی با تیم فنی تماس بگیرید</p>
    </div>
    `,
    true
  );
  
  fs.writeFileSync('docs/index.html', indexHTML);
  console.log('✅ Index page created successfully');
}

// Generate all guides
try {
  console.log('🚀 Generating MarFanet User Guides...');
  
  generateAdminGuide();
  generateCRMGuide();
  generateIndexPage();
  
  console.log('\n✅ All user guides generated successfully!');
  console.log('\n📁 Generated files:');
  console.log('   - docs/admin-panel-user-guide.html');
  console.log('   - docs/crm-panel-user-guide.html');
  console.log('   - docs/index.html');
  console.log('\n📖 To convert to PDF:');
  console.log('   1. Open HTML files in your browser');
  console.log('   2. Use Ctrl+P (Cmd+P on Mac)');
  console.log('   3. Select "Save as PDF"');
  console.log('   4. Choose appropriate page settings');
  
} catch (error) {
  console.error('❌ Error generating guides:', error.message);
  process.exit(1);
}

export {
  generateAdminGuide,
  generateCRMGuide,
  generateIndexPage
};