/**
 * Invoice Template Service - Dynamic Template Generation System
 * Handles all invoice template rendering with real-time customization
 */

import { storage } from './storage';

export interface InvoiceData {
  invoiceNumber: string;
  representative: {
    fullName: string;
    adminUsername: string;
    storeName?: string;
    phoneNumber?: string;
  };
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
    subscriptionType: string;
    durationMonths?: number;
  }>;
  totalAmount: string;
  dueDate: Date;
  createdAt: Date;
}

export interface TemplateCustomization {
  companyName: string;
  logoUrl: string;
  invoiceNote: string;
  templateStyle: string;
  includeStoreName: boolean;
  includeTelegramId: boolean;
  includeNotes: boolean;
  outputFormat: string;
}

export class InvoiceTemplateService {
  
  async getTemplateCustomizations(): Promise<TemplateCustomization> {
    try {
      const settings = await storage.getSettings();
      const templateSettings = settings.find(s => s.key === 'invoice_template_settings');
      
      if (templateSettings && templateSettings.value) {
        const parsed = JSON.parse(templateSettings.value);
        return {
          companyName: parsed.companyName || 'MarFanet',
          logoUrl: parsed.logoUrl || '',
          invoiceNote: parsed.invoiceNote || '',
          templateStyle: parsed.templateStyle || 'modern_clean',
          includeStoreName: parsed.includeStoreName !== false,
          includeTelegramId: parsed.includeTelegramId !== false,
          includeNotes: parsed.includeNotes !== false,
          outputFormat: parsed.outputFormat || 'html'
        };
      }
    } catch (error) {
      console.error('Error loading template customizations:', error);
    }
    
    return {
      companyName: 'MarFanet',
      logoUrl: '',
      invoiceNote: '',
      templateStyle: 'modern_clean',
      includeStoreName: true,
      includeTelegramId: true,
      includeNotes: true,
      outputFormat: 'html'
    };
  }

  async generateInvoiceHTML(invoiceData: InvoiceData, templateId?: string): Promise<string> {
    const customizations = await this.getTemplateCustomizations();
    const activeTemplate = templateId || customizations.templateStyle;
    
    switch (activeTemplate) {
      case 'modern_clean':
        return this.generateModernTemplate(invoiceData, customizations);
      case 'classic_formal':
        return this.generateClassicTemplate(invoiceData, customizations);
      case 'persian_optimized':
        return this.generatePersianTemplate(invoiceData, customizations);
      default:
        return this.generateModernTemplate(invoiceData, customizations);
    }
  }

  private generateModernTemplate(invoice: InvoiceData, config: TemplateCustomization): string {
    return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Vazirmatn', Arial, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 20px; 
      min-height: 100vh; 
      line-height: 1.6;
    }
    .invoice-container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 20px; 
      box-shadow: 0 25px 50px rgba(0,0,0,0.15); 
      overflow: hidden; 
    }
    .header { 
      background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%); 
      color: white; 
      padding: 40px; 
      text-align: center; 
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    }
    .logo { height: 80px; margin-bottom: 20px; position: relative; z-index: 2; }
    .header h1 { 
      font-size: 36px; 
      font-weight: 700; 
      margin-bottom: 12px; 
      position: relative; 
      z-index: 2;
    }
    .header p { 
      font-size: 18px; 
      opacity: 0.95; 
      position: relative; 
      z-index: 2;
    }
    .content { padding: 40px; }
    .invoice-meta { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
      margin-bottom: 40px; 
    }
    .meta-section { 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
      padding: 25px; 
      border-radius: 15px; 
      border-left: 5px solid #4f46e5; 
    }
    .meta-section h3 { 
      color: #4f46e5; 
      font-size: 20px; 
      margin-bottom: 20px; 
      font-weight: 700;
    }
    .meta-item { 
      margin-bottom: 12px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
    }
    .meta-label { 
      color: #64748b; 
      font-weight: 600; 
      font-size: 14px;
    }
    .meta-value { 
      color: #1e293b; 
      font-weight: 700; 
      font-size: 16px;
    }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 30px 0; 
      border-radius: 15px; 
      overflow: hidden; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.08); 
    }
    .items-table th { 
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
      color: white; 
      padding: 20px 15px; 
      text-align: right; 
      font-weight: 700; 
      font-size: 16px;
    }
    .items-table td { 
      padding: 18px 15px; 
      border-bottom: 1px solid #e2e8f0; 
      background: white;
    }
    .items-table tr:nth-child(even) td { background: #f8fafc; }
    .items-table tr:hover td { background: #f1f5f9; transition: background 0.3s ease; }
    .total-section { 
      background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
      color: white; 
      padding: 30px; 
      border-radius: 20px; 
      margin: 30px 0; 
      text-align: center; 
      position: relative;
    }
    .total-section::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
    }
    .total-label { 
      font-size: 20px; 
      margin-bottom: 10px; 
      position: relative; 
      z-index: 2;
    }
    .total-amount { 
      font-size: 32px; 
      font-weight: 800; 
      position: relative; 
      z-index: 2;
    }
    .footer { 
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); 
      padding: 30px; 
      text-align: center; 
      color: #64748b; 
      border-top: 3px solid #e2e8f0; 
    }
    .footer p { margin-bottom: 8px; }
    .invoice-note { 
      background: #fef3c7; 
      border: 1px solid #f59e0b; 
      border-radius: 10px; 
      padding: 15px; 
      margin-top: 15px; 
      color: #92400e; 
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      ${config.logoUrl ? `<img src="${config.logoUrl}" alt="لوگو" class="logo">` : ''}
      <h1>${config.companyName}</h1>
      <p>سیستم مدیریت نمایندگان V2Ray - قالب مدرن</p>
    </div>
    
    <div class="content">
      <div class="invoice-meta">
        <div class="meta-section">
          <h3>اطلاعات فاکتور</h3>
          <div class="meta-item">
            <span class="meta-label">شماره فاکتور:</span>
            <span class="meta-value">${invoice.invoiceNumber}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">تاریخ صدور:</span>
            <span class="meta-value">${invoice.createdAt.toLocaleDateString('fa-IR')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">مهلت پرداخت:</span>
            <span class="meta-value">${invoice.dueDate.toLocaleDateString('fa-IR')}</span>
          </div>
        </div>
        
        <div class="meta-section">
          <h3>اطلاعات نماینده</h3>
          <div class="meta-item">
            <span class="meta-label">نام:</span>
            <span class="meta-value">${invoice.representative.fullName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">نام کاربری:</span>
            <span class="meta-value">${invoice.representative.adminUsername}</span>
          </div>
          ${config.includeStoreName && invoice.representative.storeName ? `
          <div class="meta-item">
            <span class="meta-label">فروشگاه:</span>
            <span class="meta-value">${invoice.representative.storeName}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>شرح خدمات</th>
            <th>تعداد/حجم</th>
            <th>قیمت واحد</th>
            <th>مبلغ کل</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="font-weight: 600;">${item.description}</td>
              <td>${item.quantity} ${item.subscriptionType === 'limited' ? 'گیگابایت' : 'اشتراک'}</td>
              <td>${Number(item.unitPrice).toLocaleString('fa-IR')} تومان</td>
              <td style="font-weight: 700; color: #059669;">${Number(item.totalPrice).toLocaleString('fa-IR')} تومان</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-label">مبلغ کل قابل پرداخت</div>
        <div class="total-amount">${Number(invoice.totalAmount).toLocaleString('fa-IR')} تومان</div>
      </div>
    </div>
    
    <div class="footer">
      <p>این فاکتور به صورت خودکار از سیستم ${config.companyName} تولید شده است</p>
      <p>تاریخ و زمان تولید: ${new Date().toLocaleString('fa-IR')}</p>
      ${config.includeNotes && config.invoiceNote ? `
        <div class="invoice-note">
          ${config.invoiceNote}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  }

  private generateClassicTemplate(invoice: InvoiceData, config: TemplateCustomization): string {
    return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazir:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Vazir', Arial, sans-serif; 
      background: #f5f5f5; 
      padding: 30px; 
      line-height: 1.7;
    }
    .invoice-container { 
      max-width: 850px; 
      margin: 0 auto; 
      background: white; 
      border: 3px solid #1f2937; 
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header { 
      background: #1f2937; 
      color: white; 
      padding: 30px; 
      text-align: center; 
      border-bottom: 4px solid #d97706; 
    }
    .logo { height: 60px; margin-bottom: 15px; }
    .header h1 { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 10px; 
    }
    .header p { 
      font-size: 16px; 
      opacity: 0.9; 
    }
    .content { padding: 30px; }
    .invoice-meta { 
      display: table; 
      width: 100%; 
      margin-bottom: 30px; 
    }
    .meta-column { 
      display: table-cell; 
      width: 50%; 
      vertical-align: top; 
      padding: 0 20px; 
    }
    .meta-section { 
      border: 2px solid #d1d5db; 
      background: #f9fafb; 
      padding: 20px; 
    }
    .meta-section h3 { 
      color: #1f2937; 
      font-size: 18px; 
      margin-bottom: 15px; 
      border-bottom: 2px solid #d97706; 
      padding-bottom: 5px; 
      font-weight: 700; 
    }
    .meta-item { 
      margin-bottom: 10px; 
      display: flex; 
      justify-content: space-between; 
    }
    .meta-label { 
      color: #374151; 
      font-weight: 600; 
    }
    .meta-value { 
      color: #111827; 
      font-weight: 700; 
    }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 25px 0; 
      border: 3px solid #1f2937; 
    }
    .items-table th { 
      background: #374151; 
      color: white; 
      padding: 15px; 
      text-align: right; 
      font-weight: 700; 
      border: 1px solid #1f2937; 
    }
    .items-table td { 
      padding: 15px; 
      border: 1px solid #d1d5db; 
    }
    .items-table tr:nth-child(even) { background: #f9fafb; }
    .items-table tr:hover { background: #f3f4f6; }
    .total-section { 
      border: 3px solid #1f2937; 
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
      padding: 25px; 
      margin: 25px 0; 
      text-align: center; 
    }
    .total-label { 
      font-size: 18px; 
      color: #374151; 
      margin-bottom: 10px; 
      font-weight: 600; 
    }
    .total-amount { 
      font-size: 26px; 
      font-weight: 800; 
      color: #1f2937; 
    }
    .footer { 
      background: #f3f4f6; 
      padding: 20px; 
      text-align: center; 
      color: #6b7280; 
      border-top: 3px solid #1f2937; 
      font-size: 14px; 
    }
    .footer p { margin-bottom: 5px; }
    .invoice-note { 
      background: #fef3c7; 
      border: 2px solid #f59e0b; 
      padding: 15px; 
      margin-top: 15px; 
      color: #92400e; 
      font-weight: 600; 
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      ${config.logoUrl ? `<img src="${config.logoUrl}" alt="لوگو" class="logo">` : ''}
      <h1>${config.companyName}</h1>
      <p>سیستم مدیریت نمایندگان V2Ray - فاکتور رسمی</p>
    </div>
    
    <div class="content">
      <div class="invoice-meta">
        <div class="meta-column">
          <div class="meta-section">
            <h3>مشخصات فاکتور</h3>
            <div class="meta-item">
              <span class="meta-label">شماره:</span>
              <span class="meta-value">${invoice.invoiceNumber}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تاریخ:</span>
              <span class="meta-value">${invoice.createdAt.toLocaleDateString('fa-IR')}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">سررسید:</span>
              <span class="meta-value">${invoice.dueDate.toLocaleDateString('fa-IR')}</span>
            </div>
          </div>
        </div>
        
        <div class="meta-column">
          <div class="meta-section">
            <h3>مشخصات نماینده</h3>
            <div class="meta-item">
              <span class="meta-label">نام:</span>
              <span class="meta-value">${invoice.representative.fullName}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">کد:</span>
              <span class="meta-value">${invoice.representative.adminUsername}</span>
            </div>
            ${config.includeStoreName && invoice.representative.storeName ? `
            <div class="meta-item">
              <span class="meta-label">فروشگاه:</span>
              <span class="meta-value">${invoice.representative.storeName}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>ردیف</th>
            <th>شرح خدمات</th>
            <th>مقدار</th>
            <th>قیمت واحد (تومان)</th>
            <th>مبلغ کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => `
            <tr>
              <td style="font-weight: 700;">${index + 1}</td>
              <td style="font-weight: 600;">${item.description}</td>
              <td>${item.quantity} ${item.subscriptionType === 'limited' ? 'GB' : 'عدد'}</td>
              <td>${Number(item.unitPrice).toLocaleString('fa-IR')}</td>
              <td style="font-weight: 700;">${Number(item.totalPrice).toLocaleString('fa-IR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-label">جمع کل قابل پرداخت</div>
        <div class="total-amount">${Number(invoice.totalAmount).toLocaleString('fa-IR')} تومان</div>
      </div>
    </div>
    
    <div class="footer">
      <p>فاکتور الکترونیکی ${config.companyName} - تاریخ تولید: ${new Date().toLocaleString('fa-IR')}</p>
      ${config.includeNotes && config.invoiceNote ? `
        <div class="invoice-note">
          ${config.invoiceNote}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  }

  private generatePersianTemplate(invoice: InvoiceData, config: TemplateCustomization): string {
    return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sahel:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Sahel', Arial, sans-serif; 
      background: linear-gradient(45deg, #f0fdf4 0%, #fcfdf7 100%); 
      padding: 25px; 
      line-height: 1.9; 
    }
    .invoice-container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 25px; 
      box-shadow: 0 20px 60px rgba(5,150,105,0.15); 
      border: 3px solid #d1fae5; 
      overflow: hidden; 
    }
    .header { 
      background: linear-gradient(135deg, #059669 0%, #10b981 100%); 
      color: white; 
      padding: 40px; 
      text-align: center; 
      position: relative; 
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="persian" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="12.5" cy="12.5" r="3" fill="rgba(255,255,255,0.1)"/><path d="M5,5 Q12.5,1 20,5 Q24,12.5 20,20 Q12.5,24 5,20 Q1,12.5 5,5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect x="0" y="0" width="100" height="100" fill="url(%23persian)"/></svg>');
    }
    .logo { height: 85px; margin-bottom: 20px; position: relative; z-index: 3; }
    .header h1 { 
      font-size: 38px; 
      font-weight: 800; 
      margin-bottom: 15px; 
      position: relative; 
      z-index: 3;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .header p { 
      font-size: 20px; 
      opacity: 0.95; 
      position: relative; 
      z-index: 3;
    }
    .content { padding: 40px; }
    .persian-ornament { 
      text-align: center; 
      margin: 25px 0; 
      color: #059669; 
      font-size: 28px; 
      font-weight: 300; 
    }
    .invoice-meta { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
      margin-bottom: 40px; 
    }
    .meta-section { 
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); 
      padding: 30px; 
      border-radius: 20px; 
      border-right: 6px solid #059669; 
      box-shadow: 0 8px 25px rgba(5,150,105,0.1); 
    }
    .meta-section h3 { 
      color: #064e3b; 
      font-size: 22px; 
      margin-bottom: 20px; 
      font-weight: 800; 
      text-align: center; 
      border-bottom: 2px dotted #a7f3d0; 
      padding-bottom: 10px; 
    }
    .meta-item { 
      margin-bottom: 15px; 
      padding: 10px 0; 
      border-bottom: 1px dotted #d1fae5; 
    }
    .meta-label { 
      color: #047857; 
      font-weight: 700; 
      display: inline-block; 
      width: 130px; 
      font-size: 15px; 
    }
    .meta-value { 
      color: #064e3b; 
      font-weight: 800; 
      font-size: 17px; 
    }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 30px 0; 
      border-radius: 20px; 
      overflow: hidden; 
      box-shadow: 0 15px 35px rgba(5,150,105,0.12); 
    }
    .items-table th { 
      background: linear-gradient(135deg, #059669 0%, #047857 100%); 
      color: white; 
      padding: 22px 18px; 
      text-align: right; 
      font-weight: 800; 
      font-size: 17px; 
    }
    .items-table td { 
      padding: 20px 18px; 
      border-bottom: 1px solid #d1fae5; 
      background: white; 
    }
    .items-table tr:nth-child(even) td { background: #f0fdf4; }
    .items-table tr:hover td { 
      background: #ecfdf5; 
      transform: scale(1.01); 
      transition: all 0.3s ease; 
    }
    .total-section { 
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
      padding: 35px; 
      border-radius: 20px; 
      margin: 30px 0; 
      text-align: center; 
      border: 3px solid #a7f3d0; 
      position: relative; 
    }
    .total-section::before {
      content: '❋';
      position: absolute;
      top: 15px; left: 20px;
      color: #047857;
      font-size: 24px;
      opacity: 0.3;
    }
    .total-section::after {
      content: '❋';
      position: absolute;
      top: 15px; right: 20px;
      color: #047857;
      font-size: 24px;
      opacity: 0.3;
    }
    .total-label { 
      color: #059669; 
      font-size: 22px; 
      font-weight: 700; 
      margin-bottom: 12px; 
    }
    .total-amount { 
      font-size: 34px; 
      font-weight: 900; 
      color: #047857; 
      text-shadow: 0 2px 4px rgba(0,0,0,0.1); 
    }
    .footer { 
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); 
      padding: 30px; 
      text-align: center; 
      color: #047857; 
      border-top: 3px solid #d1fae5; 
      font-size: 15px; 
    }
    .footer p { margin-bottom: 8px; font-weight: 600; }
    .decorative-line { 
      width: 120px; 
      height: 4px; 
      background: linear-gradient(90deg, #059669, #10b981); 
      margin: 20px auto; 
      border-radius: 2px; 
    }
    .invoice-note { 
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
      border: 2px solid #f59e0b; 
      border-radius: 15px; 
      padding: 20px; 
      margin-top: 20px; 
      color: #92400e; 
      font-weight: 700; 
      text-align: right; 
      border-right: 6px solid #f59e0b; 
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      ${config.logoUrl ? `<img src="${config.logoUrl}" alt="لوگو" class="logo">` : ''}
      <h1>${config.companyName}</h1>
      <p>سیستم هوشمند مدیریت نمایندگان شبکه خصوصی مجازی</p>
    </div>
    
    <div class="content">
      <div class="persian-ornament">❋ ❋ ❋</div>
      
      <div class="invoice-meta">
        <div class="meta-section">
          <h3>مشخصات صورتحساب</h3>
          <div class="meta-item">
            <span class="meta-label">شماره فاکتور:</span>
            <span class="meta-value">${invoice.invoiceNumber}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">تاریخ صدور:</span>
            <span class="meta-value">${invoice.createdAt.toLocaleDateString('fa-IR')}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">مهلت پرداخت:</span>
            <span class="meta-value">${invoice.dueDate.toLocaleDateString('fa-IR')}</span>
          </div>
        </div>
        
        <div class="meta-section">
          <h3>مشخصات مشتری</h3>
          <div class="meta-item">
            <span class="meta-label">نام و نام خانوادگی:</span>
            <span class="meta-value">${invoice.representative.fullName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">نام کاربری سیستم:</span>
            <span class="meta-value">${invoice.representative.adminUsername}</span>
          </div>
          ${config.includeStoreName && invoice.representative.storeName ? `
          <div class="meta-item">
            <span class="meta-label">نام فروشگاه:</span>
            <span class="meta-value">${invoice.representative.storeName}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="decorative-line"></div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>شرح خدمات ارائه شده</th>
            <th>مقدار مصرفی</th>
            <th>نرخ واحد (تومان)</th>
            <th>مبلغ کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="font-weight: 700;">${item.description}</td>
              <td style="font-weight: 600;">${item.quantity} ${item.subscriptionType === 'limited' ? 'گیگابایت' : 'اشتراک'}</td>
              <td style="font-weight: 600;">${Number(item.unitPrice).toLocaleString('fa-IR')}</td>
              <td style="font-weight: 800; color: #047857;">${Number(item.totalPrice).toLocaleString('fa-IR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-label">مبلغ کل قابل پرداخت</div>
        <div class="total-amount">${Number(invoice.totalAmount).toLocaleString('fa-IR')} تومان</div>
      </div>
      
      <div class="decorative-line"></div>
    </div>
    
    <div class="footer">
      <p>این صورتحساب به صورت خودکار از سیستم ${config.companyName} تولید گردیده است</p>
      <p>تاریخ و زمان تولید: ${new Date().toLocaleString('fa-IR')}</p>
      ${config.includeNotes && config.invoiceNote ? `
        <div class="invoice-note">
          ${config.invoiceNote}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
  }
}

export const invoiceTemplateService = new InvoiceTemplateService();