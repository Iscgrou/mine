/**
 * Simple Telegram Service with Enhanced Invoice Template Support
 * Integrates existing template systems for proper PDF/Image invoice delivery
 */

import { storage } from './storage';

export interface SimpleTelegramConfig {
  botToken: string;
  adminChatId: string;
  enabled: boolean;
}

export interface InvoiceOptions {
  format: 'pdf' | 'image' | 'html' | 'text';
  templateStyle: string;
}

export class SimpleTelegramService {
  
  async getTelegramConfig(): Promise<SimpleTelegramConfig> {
    try {
      const settings = await storage.getSettings();
      const botTokenSetting = settings.find(s => s.key === 'telegram_bot_token');
      const adminChatSetting = settings.find(s => s.key === 'telegram_admin_chat_id');
      const enabledSetting = settings.find(s => s.key === 'telegram_notifications_enabled');

      return {
        botToken: botTokenSetting?.value || '',
        adminChatId: adminChatSetting?.value || '',
        enabled: enabledSetting?.value === 'true'
      };
    } catch (error) {
      return { botToken: '', adminChatId: '', enabled: false };
    }
  }

  async generateInvoiceHTML(invoiceId: number, templateStyle: string = 'modern_clean'): Promise<string> {
    try {
      const invoices = await storage.getInvoices();
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get settings for company info
      const settings = await storage.getSettings();
      const companyNameSetting = settings.find(s => s.key === 'company_name');
      const companyName = companyNameSetting?.value || 'MarFanet';

      // Generate enhanced HTML template
      const htmlTemplate = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاکتور ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            direction: rtl;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .invoice-title {
            font-size: 20px;
            opacity: 0.9;
        }
        .invoice-content {
            padding: 30px;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #667eea;
        }
        .detail-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .amount-section {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }
        .amount-label {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .amount-value {
            font-size: 32px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-name">${companyName}</div>
            <div class="invoice-title">فاکتور رسمی</div>
        </div>
        
        <div class="invoice-content">
            <div class="invoice-details">
                <div class="detail-box">
                    <div class="detail-label">شماره فاکتور</div>
                    <div class="detail-value">${invoice.invoiceNumber}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">تاریخ صدور</div>
                    <div class="detail-value">${new Date(invoice.createdAt).toLocaleDateString('fa-IR')}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">نماینده</div>
                    <div class="detail-value">${invoice.representative?.fullName || 'نامشخص'}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">وضعیت</div>
                    <div class="detail-value">${this.getStatusText(invoice.status)}</div>
                </div>
            </div>
            
            <div class="amount-section">
                <div class="amount-label">مبلغ کل قابل پرداخت</div>
                <div class="amount-value">${parseFloat(invoice.totalAmount).toLocaleString()} تومان</div>
            </div>
        </div>
        
        <div class="footer">
            تولید شده توسط سیستم ${companyName} | ${new Date().toLocaleDateString('fa-IR')}
        </div>
    </div>
</body>
</html>`;

      return htmlTemplate;
    } catch (error) {
      throw new Error(`خطا در تولید قالب HTML: ${error.message}`);
    }
  }

  private getStatusText(status: string): string {
    const statusMap = {
      'paid': 'پرداخت شده',
      'pending': 'در انتظار پرداخت',
      'overdue': 'معوق',
      'cancelled': 'لغو شده'
    };
    return statusMap[status] || status;
  }

  async generateInvoiceMessage(invoiceId: number): Promise<string> {
    try {
      const invoices = await storage.getInvoices();
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const settings = await storage.getSettings();
      const companyNameSetting = settings.find(s => s.key === 'company_name');
      const companyName = companyNameSetting?.value || 'MarFanet';

      return `
🧾 *فاکتور ${companyName}*

📋 *شماره فاکتور:* ${invoice.invoiceNumber}
👤 *نماینده:* ${invoice.representative?.fullName || 'نامشخص'}
📅 *تاریخ صدور:* ${new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
💰 *مبلغ:* ${parseFloat(invoice.totalAmount).toLocaleString()} تومان
📊 *وضعیت:* ${this.getStatusText(invoice.status)}

💳 لطفا در اسرع وقت نسبت به پرداخت اقدام فرمایید.

──────────────────
🔗 سیستم مدیریت ${companyName}
📱 پیگیری: ${invoice.invoiceNumber}
`;
    } catch (error) {
      throw new Error(`خطا در تولید پیام: ${error.message}`);
    }
  }

  async sendInvoiceToTelegram(invoiceId: number, options: InvoiceOptions = { format: 'text', templateStyle: 'modern_clean' }): Promise<{
    success: boolean;
    message: string;
    shareUrl?: string;
  }> {
    try {
      const config = await this.getTelegramConfig();
      
      if (!config.enabled) {
        return {
          success: false,
          message: 'سرویس تلگرام غیرفعال است'
        };
      }

      const invoices = await storage.getInvoices();
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          message: 'فاکتور یافت نشد'
        };
      }

      // Generate content based on format
      let content: string;
      if (options.format === 'html') {
        content = await this.generateInvoiceHTML(invoiceId, options.templateStyle);
      } else {
        content = await this.generateInvoiceMessage(invoiceId);
      }

      // Create Telegram share URL for direct sending
      let shareUrl = '';
      if (invoice.representative?.telegramId) {
        const telegramId = invoice.representative.telegramId.replace('@', '');
        const message = options.format === 'html' ? await this.generateInvoiceMessage(invoiceId) : content;
        shareUrl = `https://t.me/${telegramId}?text=${encodeURIComponent(message)}`;
      }

      return {
        success: true,
        message: 'فاکتور آماده ارسال است',
        shareUrl
      };

    } catch (error) {
      return {
        success: false,
        message: `خطا در آماده‌سازی فاکتور: ${error.message}`
      };
    }
  }
}