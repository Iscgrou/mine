/**
 * Enhanced Invoice Template System with Distinct Styling Algorithms
 * Three completely different approaches for invoice generation
 */

interface TemplateConfig {
  name: string;
  algorithm: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    primary: string;
    secondary: string;
    size: string;
  };
  layout: {
    structure: string;
    spacing: string;
    borders: string;
  };
}

class EnhancedInvoiceTemplates {
  private readonly TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
    'modern_clean': {
      name: 'مدرن و پاک',
      algorithm: 'minimalist_geometry',
      colors: {
        primary: '#4f46e5',
        secondary: '#e5e7eb', 
        accent: '#10b981',
        background: '#ffffff',
        text: '#111827'
      },
      typography: {
        primary: 'IRANSans',
        secondary: 'Vazirmatn',
        size: 'responsive'
      },
      layout: {
        structure: 'grid_based',
        spacing: 'generous',
        borders: 'subtle_shadows'
      }
    },
    'classic_formal': {
      name: 'کلاسیک و رسمی',
      algorithm: 'traditional_borders',
      colors: {
        primary: '#1f2937',
        secondary: '#f3f4f6',
        accent: '#d97706',
        background: '#fefefe',
        text: '#374151'
      },
      typography: {
        primary: 'Vazir',
        secondary: 'Tahoma',
        size: 'fixed'
      },
      layout: {
        structure: 'table_based',
        spacing: 'compact',
        borders: 'formal_lines'
      }
    },
    'persian_optimized': {
      name: 'بهینه شده فارسی',
      algorithm: 'calligraphy_enhanced',
      colors: {
        primary: '#059669',
        secondary: '#f0fdf4',
        accent: '#dc2626',
        background: '#fcfdf7',
        text: '#064e3b'
      },
      typography: {
        primary: 'Sahel',
        secondary: 'Samim',
        size: 'large'
      },
      layout: {
        structure: 'artistic_flow',
        spacing: 'balanced',
        borders: 'decorative'
      }
    }
  };

  /**
   * Algorithm 1: Minimalist Geometry (Modern Clean)
   * Uses geometric shapes, clean lines, and modern spacing
   */
  private generateModernCleanTemplate(invoiceData: any): string {
    const config = this.TEMPLATE_CONFIGS['modern_clean'];
    
    return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاکتور ${invoiceData.invoiceNumber}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
                padding: 2rem;
                color: ${config.colors.text};
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: ${config.colors.background};
                border-radius: 20px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                position: relative;
            }
            
            .header-section {
                background: linear-gradient(135deg, ${config.colors.primary} 0%, #6366f1 100%);
                padding: 3rem 2rem;
                position: relative;
                overflow: hidden;
            }
            
            .header-section::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20%;
                width: 200px;
                height: 200px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
                transform: rotate(45deg);
            }
            
            .header-section::after {
                content: '';
                position: absolute;
                bottom: -30%;
                left: -10%;
                width: 150px;
                height: 150px;
                background: rgba(255,255,255,0.05);
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            }
            
            .company-info {
                color: white;
                position: relative;
                z-index: 2;
            }
            
            .company-name {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .company-slogan {
                font-size: 1.1rem;
                opacity: 0.9;
                font-weight: 300;
            }
            
            .invoice-meta {
                position: absolute;
                top: 3rem;
                left: 2rem;
                color: white;
                text-align: left;
                z-index: 2;
            }
            
            .invoice-number {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            .invoice-date {
                font-size: 1rem;
                opacity: 0.8;
            }
            
            .content-section {
                padding: 2.5rem;
            }
            
            .customer-info {
                background: ${config.colors.secondary};
                border-radius: 15px;
                padding: 2rem;
                margin-bottom: 2rem;
                border-right: 4px solid ${config.colors.accent};
            }
            
            .customer-title {
                font-size: 1.3rem;
                font-weight: 600;
                color: ${config.colors.primary};
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
            }
            
            .customer-title::before {
                content: '👤';
                margin-left: 0.5rem;
                font-size: 1.2rem;
            }
            
            .items-table {
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                margin-bottom: 2rem;
            }
            
            .table-header {
                background: linear-gradient(135deg, ${config.colors.primary} 0%, #6366f1 100%);
                color: white;
                padding: 1.5rem;
                display: grid;
                grid-template-columns: 3fr 1fr 1fr 1fr;
                gap: 1rem;
                font-weight: 600;
            }
            
            .table-row {
                background: white;
                padding: 1.5rem;
                display: grid;
                grid-template-columns: 3fr 1fr 1fr 1fr;
                gap: 1rem;
                border-bottom: 1px solid ${config.colors.secondary};
                transition: background-color 0.2s;
            }
            
            .table-row:hover {
                background: ${config.colors.secondary};
            }
            
            .table-row:last-child {
                border-bottom: none;
            }
            
            .total-section {
                background: linear-gradient(135deg, ${config.colors.accent} 0%, #059669 100%);
                color: white;
                padding: 2rem;
                border-radius: 15px;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .total-amount {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .total-label {
                font-size: 1.1rem;
                opacity: 0.9;
            }
            
            .footer-section {
                background: ${config.colors.secondary};
                padding: 2rem;
                text-align: center;
                border-top: 1px solid ${config.colors.secondary};
            }
            
            .qr-code {
                width: 100px;
                height: 100px;
                background: ${config.colors.primary};
                border-radius: 10px;
                margin: 0 auto 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
            }
            
            @media print {
                body { padding: 0; background: white; }
                .invoice-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header-section">
                <div class="company-info">
                    <div class="company-name">MarFanet</div>
                    <div class="company-slogan">آینده ارتباطات در دستان شما</div>
                </div>
                <div class="invoice-meta">
                    <div class="invoice-number">فاکتور ${invoiceData.invoiceNumber}</div>
                    <div class="invoice-date">${this.getCurrentShamsiDate()}</div>
                </div>
            </div>
            
            <div class="content-section">
                <div class="customer-info">
                    <div class="customer-title">اطلاعات مشتری</div>
                    <div><strong>نام:</strong> ${invoiceData.representative?.fullName || 'نماینده'}</div>
                    <div><strong>شماره تماس:</strong> ${invoiceData.representative?.phoneNumber || 'تعریف نشده'}</div>
                    <div><strong>فروشگاه:</strong> ${invoiceData.representative?.storeName || 'تعریف نشده'}</div>
                </div>
                
                <div class="items-table">
                    <div class="table-header">
                        <div>شرح خدمات</div>
                        <div>تعداد</div>
                        <div>قیمت واحد</div>
                        <div>جمع</div>
                    </div>
                    ${invoiceData.items.map((item: any) => `
                        <div class="table-row">
                            <div>${item.description}</div>
                            <div>${item.quantity}</div>
                            <div>${this.formatPersianNumber(item.unitPrice)} تومان</div>
                            <div>${this.formatPersianNumber(item.totalPrice)} تومان</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total-section">
                    <div class="total-amount">${this.formatPersianNumber(invoiceData.totalAmount)} تومان</div>
                    <div class="total-label">مبلغ کل قابل پرداخت</div>
                </div>
            </div>
            
            <div class="footer-section">
                <div class="qr-code">QR</div>
                <p>کد QR برای پرداخت سریع</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">
                    تشکر از اعتماد شما به MarFanet
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Algorithm 2: Traditional Borders (Classic Formal)
   * Uses formal table structure with classic borders and traditional spacing
   */
  private generateClassicFormalTemplate(invoiceData: any): string {
    const config = this.TEMPLATE_CONFIGS['classic_formal'];
    
    return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاکتور رسمی ${invoiceData.invoiceNumber}</title>
        <style>
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Vazir', Tahoma, Arial, sans-serif;
                background: ${config.colors.background};
                padding: 1.5rem;
                color: ${config.colors.text};
                line-height: 1.6;
            }
            
            .invoice-document {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border: 3px solid ${config.colors.primary};
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            
            .document-header {
                border-bottom: 3px double ${config.colors.primary};
                padding: 2rem;
                background: ${config.colors.secondary};
                text-align: center;
                position: relative;
            }
            
            .document-title {
                font-size: 2.2rem;
                font-weight: bold;
                color: ${config.colors.primary};
                margin-bottom: 0.5rem;
                text-decoration: underline;
                text-decoration-color: ${config.colors.accent};
            }
            
            .company-details {
                font-size: 1.1rem;
                margin-bottom: 1rem;
                color: ${config.colors.text};
            }
            
            .invoice-info-box {
                position: absolute;
                top: 2rem;
                left: 2rem;
                border: 2px solid ${config.colors.accent};
                padding: 1rem;
                background: white;
                min-width: 200px;
            }
            
            .invoice-info-title {
                font-weight: bold;
                color: ${config.colors.primary};
                border-bottom: 1px solid ${config.colors.accent};
                padding-bottom: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .formal-section {
                border: 2px solid ${config.colors.primary};
                margin: 1rem;
                background: white;
            }
            
            .section-header {
                background: ${config.colors.primary};
                color: white;
                padding: 1rem;
                font-weight: bold;
                font-size: 1.2rem;
                border-bottom: 2px solid ${config.colors.accent};
            }
            
            .section-content {
                padding: 1.5rem;
            }
            
            .formal-table {
                width: 100%;
                border-collapse: collapse;
                margin: 1rem 0;
                border: 2px solid ${config.colors.primary};
            }
            
            .formal-table th {
                background: ${config.colors.primary};
                color: white;
                padding: 1rem;
                border: 1px solid ${config.colors.text};
                font-weight: bold;
                text-align: center;
            }
            
            .formal-table td {
                padding: 1rem;
                border: 1px solid ${config.colors.primary};
                text-align: center;
                background: white;
            }
            
            .formal-table tr:nth-child(even) td {
                background: ${config.colors.secondary};
            }
            
            .amount-box {
                border: 3px double ${config.colors.primary};
                background: ${config.colors.secondary};
                padding: 2rem;
                margin: 1rem;
                text-align: center;
            }
            
            .amount-title {
                font-size: 1.3rem;
                font-weight: bold;
                color: ${config.colors.primary};
                margin-bottom: 1rem;
                text-decoration: underline;
            }
            
            .amount-value {
                font-size: 2rem;
                font-weight: bold;
                color: ${config.colors.accent};
                border: 2px solid ${config.colors.accent};
                padding: 1rem;
                background: white;
                display: inline-block;
                min-width: 300px;
            }
            
            .formal-footer {
                border-top: 3px double ${config.colors.primary};
                padding: 2rem;
                background: ${config.colors.secondary};
                text-align: center;
            }
            
            .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin-top: 2rem;
            }
            
            .signature-box {
                border: 2px solid ${config.colors.primary};
                padding: 1.5rem;
                height: 120px;
                background: white;
                text-align: center;
            }
            
            .signature-title {
                font-weight: bold;
                color: ${config.colors.primary};
                border-bottom: 1px solid ${config.colors.accent};
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
            
            @media print {
                body { padding: 0; }
                .invoice-document { border: 2px solid black; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-document">
            <div class="document-header">
                <div class="invoice-info-box">
                    <div class="invoice-info-title">مشخصات فاکتور</div>
                    <div><strong>شماره:</strong> ${invoiceData.invoiceNumber}</div>
                    <div><strong>تاریخ:</strong> ${this.getCurrentShamsiDate()}</div>
                    <div><strong>وضعیت:</strong> ${invoiceData.status || 'صادر شده'}</div>
                </div>
                
                <div class="document-title">فاکتور رسمی فروش</div>
                <div class="company-details">
                    <strong>شرکت مارفانت</strong><br>
                    ارائه‌دهنده خدمات ارتباطی پیشرفته<br>
                    تلفن: ۰۲۱-۸۸۷۷۶۶۵۵ | وب‌سایت: marfanet.ir
                </div>
            </div>
            
            <div class="formal-section">
                <div class="section-header">اطلاعات خریدار</div>
                <div class="section-content">
                    <table style="width: 100%; border: none;">
                        <tr>
                            <td style="border: none; text-align: right; padding: 0.5rem;"><strong>نام و نام خانوادگی:</strong></td>
                            <td style="border: none; text-align: right; padding: 0.5rem;">${invoiceData.representative?.fullName || 'نماینده محترم'}</td>
                            <td style="border: none; text-align: right; padding: 0.5rem;"><strong>شماره تماس:</strong></td>
                            <td style="border: none; text-align: right; padding: 0.5rem;">${invoiceData.representative?.phoneNumber || 'تعریف نشده'}</td>
                        </tr>
                        <tr>
                            <td style="border: none; text-align: right; padding: 0.5rem;"><strong>نام فروشگاه:</strong></td>
                            <td style="border: none; text-align: right; padding: 0.5rem;">${invoiceData.representative?.storeName || 'تعریف نشده'}</td>
                            <td style="border: none; text-align: right; padding: 0.5rem;"><strong>کد نماینده:</strong></td>
                            <td style="border: none; text-align: right; padding: 0.5rem;">${invoiceData.representative?.id || 'نامشخص'}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div class="formal-section">
                <div class="section-header">مشخصات کالا و خدمات</div>
                <div class="section-content">
                    <table class="formal-table">
                        <thead>
                            <tr>
                                <th>ردیف</th>
                                <th>شرح کالا/خدمات</th>
                                <th>تعداد</th>
                                <th>قیمت واحد (تومان)</th>
                                <th>مبلغ کل (تومان)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map((item: any, index: number) => `
                                <tr>
                                    <td>${this.formatPersianNumber(index + 1)}</td>
                                    <td>${item.description}</td>
                                    <td>${this.formatPersianNumber(item.quantity)}</td>
                                    <td>${this.formatPersianNumber(item.unitPrice)}</td>
                                    <td>${this.formatPersianNumber(item.totalPrice)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="amount-box">
                <div class="amount-title">مبلغ کل قابل پرداخت</div>
                <div class="amount-value">${this.formatPersianNumber(invoiceData.totalAmount)} تومان</div>
            </div>
            
            <div class="formal-footer">
                <p><strong>شرایط و ضوابط:</strong></p>
                <p>• کلیه خدمات طبق قوانین جمهوری اسلامی ایران ارائه می‌گردد</p>
                <p>• مدت اعتبار فاکتور ۳۰ روز از تاریخ صدور می‌باشد</p>
                <p>• در صورت بروز هرگونه مشکل با شماره پشتیبانی تماس حاصل فرمایید</p>
                
                <div class="signature-section">
                    <div class="signature-box">
                        <div class="signature-title">مهر و امضای فروشنده</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-title">امضای خریدار</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Algorithm 3: Calligraphy Enhanced (Persian Optimized)
   * Uses Persian artistic elements, decorative borders, and cultural design
   */
  private generatePersianOptimizedTemplate(invoiceData: any): string {
    const config = this.TEMPLATE_CONFIGS['persian_optimized'];
    
    return `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاکتور فارسی ${invoiceData.invoiceNumber}</title>
        <style>
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v3.4.0/dist/font-face.css');
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@v4.0.5/dist/font-face.css');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Sahel', 'Samim', Tahoma, sans-serif;
                background: radial-gradient(circle at center, ${config.colors.background} 0%, #f0f9f0 100%);
                padding: 2rem;
                color: ${config.colors.text};
                line-height: 1.8;
            }
            
            .persian-invoice {
                max-width: 850px;
                margin: 0 auto;
                background: white;
                border-radius: 25px;
                overflow: hidden;
                box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                border: 3px solid ${config.colors.primary};
                position: relative;
            }
            
            .persian-invoice::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 150px;
                height: 150px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 L90 50 L50 90 L10 50 Z" fill="%23059669" opacity="0.1"/></svg>');
                background-size: contain;
                z-index: 1;
            }
            
            .artistic-header {
                background: linear-gradient(135deg, ${config.colors.primary} 0%, #34d399 50%, ${config.colors.accent} 100%);
                padding: 3rem 2rem;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .artistic-header::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                right: 0;
                height: 20px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0 20 Q25 0 50 10 T100 20 Z" fill="white"/></svg>');
                background-size: 100px 20px;
                background-repeat: repeat-x;
            }
            
            .company-persian-name {
                font-size: 3rem;
                font-weight: bold;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                margin-bottom: 1rem;
                font-family: 'Sahel', serif;
                letter-spacing: 2px;
            }
            
            .persian-slogan {
                font-size: 1.4rem;
                color: rgba(255,255,255,0.9);
                font-style: italic;
                margin-bottom: 1rem;
            }
            
            .decorative-divider {
                width: 200px;
                height: 3px;
                background: linear-gradient(90deg, transparent 0%, white 50%, transparent 100%);
                margin: 1rem auto;
            }
            
            .invoice-badge {
                background: white;
                color: ${config.colors.primary};
                padding: 1rem 2rem;
                border-radius: 50px;
                font-weight: bold;
                font-size: 1.2rem;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            
            .artistic-content {
                padding: 3rem 2rem;
                position: relative;
                z-index: 2;
            }
            
            .persian-section {
                background: ${config.colors.secondary};
                border: 2px solid ${config.colors.primary};
                border-radius: 20px;
                margin: 2rem 0;
                overflow: hidden;
                position: relative;
            }
            
            .persian-section::before {
                content: '';
                position: absolute;
                top: -10px;
                right: -10px;
                width: 40px;
                height: 40px;
                background: ${config.colors.accent};
                border-radius: 50%;
                opacity: 0.2;
            }
            
            .section-title-persian {
                background: linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.accent} 100%);
                color: white;
                padding: 1.5rem 2rem;
                font-size: 1.4rem;
                font-weight: bold;
                text-align: center;
                position: relative;
            }
            
            .section-title-persian::after {
                content: '🎭';
                position: absolute;
                right: 2rem;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.2rem;
            }
            
            .persian-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 1.5rem 0;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            }
            
            .persian-table th {
                background: linear-gradient(135deg, ${config.colors.primary} 0%, #34d399 100%);
                color: white;
                padding: 1.5rem;
                font-weight: bold;
                text-align: center;
                position: relative;
            }
            
            .persian-table th::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: ${config.colors.accent};
            }
            
            .persian-table td {
                padding: 1.5rem;
                text-align: center;
                background: white;
                border-bottom: 1px solid rgba(5,150,105,0.1);
                transition: all 0.3s ease;
            }
            
            .persian-table tr:hover td {
                background: ${config.colors.secondary};
                transform: scale(1.02);
            }
            
            .persian-table tr:last-child td {
                border-bottom: none;
            }
            
            .total-container-persian {
                background: linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.accent} 100%);
                border-radius: 25px;
                padding: 3rem;
                margin: 2rem 0;
                text-align: center;
                color: white;
                position: relative;
                overflow: hidden;
            }
            
            .total-container-persian::before {
                content: '💎';
                position: absolute;
                top: 1rem;
                right: 2rem;
                font-size: 2rem;
                opacity: 0.3;
            }
            
            .total-persian-title {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                opacity: 0.9;
            }
            
            .total-persian-amount {
                font-size: 3rem;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                margin-bottom: 1rem;
            }
            
            .total-persian-subtitle {
                font-size: 1.1rem;
                opacity: 0.8;
            }
            
            .artistic-footer {
                background: ${config.colors.secondary};
                padding: 2rem;
                text-align: center;
                border-top: 3px solid ${config.colors.primary};
                position: relative;
            }
            
            .persian-poem {
                font-style: italic;
                font-size: 1.1rem;
                color: ${config.colors.primary};
                margin-bottom: 1rem;
                line-height: 2;
            }
            
            .cultural-elements {
                display: flex;
                justify-content: center;
                gap: 2rem;
                margin-top: 2rem;
            }
            
            .cultural-item {
                text-align: center;
                padding: 1rem;
                border-radius: 15px;
                background: white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                min-width: 120px;
            }
            
            .cultural-icon {
                font-size: 2rem;
                margin-bottom: 0.5rem;
            }
            
            @media print {
                body { padding: 0; background: white; }
                .persian-invoice { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="persian-invoice">
            <div class="artistic-header">
                <div class="company-persian-name">مارفانت</div>
                <div class="persian-slogan">فناوری در خدمت ایرانیان عزیز</div>
                <div class="decorative-divider"></div>
                <div class="invoice-badge">فاکتور شماره ${invoiceData.invoiceNumber}</div>
            </div>
            
            <div class="artistic-content">
                <div class="persian-section">
                    <div class="section-title-persian">اطلاعات مشتری گرامی</div>
                    <div style="padding: 2rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div>
                                <strong>نام کامل:</strong><br>
                                <span style="font-size: 1.2rem; color: ${config.colors.primary};">
                                    ${invoiceData.representative?.fullName || 'مشتری گرامی'}
                                </span>
                            </div>
                            <div>
                                <strong>تاریخ صدور:</strong><br>
                                <span style="font-size: 1.2rem; color: ${config.colors.accent};">
                                    ${this.getCurrentShamsiDate()}
                                </span>
                            </div>
                            <div>
                                <strong>شماره تماس:</strong><br>
                                <span style="direction: ltr;">${invoiceData.representative?.phoneNumber || 'تعریف نشده'}</span>
                            </div>
                            <div>
                                <strong>نام فروشگاه:</strong><br>
                                ${invoiceData.representative?.storeName || 'تعریف نشده'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="persian-section">
                    <div class="section-title-persian">مشخصات خدمات ارائه شده</div>
                    <div style="padding: 1rem;">
                        <table class="persian-table">
                            <thead>
                                <tr>
                                    <th>شرح خدمات</th>
                                    <th>مقدار</th>
                                    <th>قیمت واحد</th>
                                    <th>مبلغ کل</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoiceData.items.map((item: any) => `
                                    <tr>
                                        <td style="text-align: right; font-weight: 500;">${item.description}</td>
                                        <td>${this.formatPersianNumber(item.quantity)}</td>
                                        <td>${this.formatPersianNumber(item.unitPrice)} تومان</td>
                                        <td style="font-weight: bold; color: ${config.colors.primary};">
                                            ${this.formatPersianNumber(item.totalPrice)} تومان
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="total-container-persian">
                    <div class="total-persian-title">مبلغ کل قابل پرداخت</div>
                    <div class="total-persian-amount">${this.formatPersianNumber(invoiceData.totalAmount)} تومان</div>
                    <div class="total-persian-subtitle">با تشکر از اعتماد شما</div>
                </div>
            </div>
            
            <div class="artistic-footer">
                <div class="persian-poem">
                    "در راه خدمت به هموطنان عزیز<br>
                    مارفانت همواره در کنار شماست"
                </div>
                
                <div class="cultural-elements">
                    <div class="cultural-item">
                        <div class="cultural-icon">🌟</div>
                        <div>کیفیت برتر</div>
                    </div>
                    <div class="cultural-item">
                        <div class="cultural-icon">🤝</div>
                        <div>اعتماد متقابل</div>
                    </div>
                    <div class="cultural-item">
                        <div class="cultural-icon">🚀</div>
                        <div>فناوری روز</div>
                    </div>
                </div>
                
                <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
                    این فاکتور طبق قوانین تجارت الکترونیک ایران صادر شده است
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate invoice based on selected template
   */
  public generateInvoice(invoiceData: any, templateType: string): string {
    switch (templateType) {
      case 'modern_clean':
        return this.generateModernCleanTemplate(invoiceData);
      case 'classic_formal':
        return this.generateClassicFormalTemplate(invoiceData);
      case 'persian_optimized':
        return this.generatePersianOptimizedTemplate(invoiceData);
      default:
        return this.generateModernCleanTemplate(invoiceData);
    }
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates(): Record<string, TemplateConfig> {
    return this.TEMPLATE_CONFIGS;
  }

  /**
   * Format Persian numbers
   */
  private formatPersianNumber(num: string | number): string {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    
    return num.toString().replace(/[0-9]/g, (match) => {
      return persianDigits[englishDigits.indexOf(match)];
    });
  }

  /**
   * Get current Shamsi date
   */
  private getCurrentShamsiDate(): string {
    const now = new Date();
    const shamsiYear = now.getFullYear() - 621;
    const shamsiMonth = String(now.getMonth() + 1).padStart(2, '0');
    const shamsiDay = String(now.getDate()).padStart(2, '0');
    
    return this.formatPersianNumber(`${shamsiYear}/${shamsiMonth}/${shamsiDay}`);
  }
}

export const enhancedInvoiceTemplates = new EnhancedInvoiceTemplates();