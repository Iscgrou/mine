import { db } from "./db";
import { invoiceItems, settings } from "@shared/schema";
import { eq } from "drizzle-orm";

interface InvoiceConfig {
  template: string;
  headerStyle: string;
  colorScheme: string;
  fontFamily: string;
  itemGrouping: string;
  calculationDisplay: string;
  showLogo: boolean;
  qrCode: boolean;
  watermark: boolean;
  representativeInfoLevel: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  baseAmount: string;
  status: string;
  createdAt: Date;
  priceSource: string | null;
  representative: {
    fullName: string;
    adminUsername: string;
    telegramId: string;
  } | null;
}

export class InvoiceGenerator {
  private getColorScheme(scheme: string) {
    const colorSchemes = {
      'blue-professional': {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f8f9ff'
      },
      'green-modern': {
        primary: '#48bb78',
        secondary: '#38a169',
        accent: '#f0fff4'
      },
      'purple-luxury': {
        primary: '#805ad5',
        secondary: '#6b46c1',
        accent: '#faf5ff'
      }
    };
    return colorSchemes[scheme as keyof typeof colorSchemes] || colorSchemes['blue-professional'];
  }

  async getInvoiceConfig(): Promise<InvoiceConfig> {
    const defaultConfig: InvoiceConfig = {
      template: 'professional',
      headerStyle: 'centered',
      colorScheme: 'blue-professional',
      fontFamily: 'iranian-sans',
      itemGrouping: 'by-duration',
      calculationDisplay: 'detailed',
      showLogo: true,
      qrCode: true,
      watermark: false,
      representativeInfoLevel: 'detailed'
    };

    try {
      const configResult = await db.select()
        .from(settings)
        .where(eq(settings.key, 'invoice_config_alpha35'))
        .limit(1);

      if (configResult.length > 0 && configResult[0].value) {
        const savedConfig = JSON.parse(configResult[0].value);
        return { ...defaultConfig, ...savedConfig };
      }
    } catch (error) {
      console.warn('Failed to load invoice config, using defaults');
    }

    return defaultConfig;
  }

  async generateInvoiceHTML(invoice: Invoice): Promise<string> {
    const config = await this.getInvoiceConfig();
    const colors = this.getColorScheme(config.colorScheme);

    // Get invoice items
    const items = await db.select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    const itemsTableHTML = items.map(item => `
      <tr>
        <td style="text-align: right; font-weight: 500;">${item.description || 'خدمات V2Ray'}</td>
        <td>${item.quantity || 1}</td>
        <td>${parseFloat(item.unitPrice || '0').toLocaleString('fa-IR')} تومان</td>
        <td style="font-weight: 600;">${parseFloat(item.totalPrice || '0').toLocaleString('fa-IR')} تومان</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاکتور ${invoice.invoiceNumber} - مارفانت</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: ${config.fontFamily === 'iranian-sans' ? "'IRANSans', 'Tahoma'" : "'Tahoma'"}, 'Arial', sans-serif; 
            direction: rtl; 
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            overflow: hidden;
            position: relative;
        }
        ${config.watermark ? `
        .invoice-container::before {
            content: 'مارفانت';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(0,0,0,0.03);
            z-index: 1;
            pointer-events: none;
        }
        ` : ''}
        .content { position: relative; z-index: 2; }
        .header { 
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); 
            color: white; 
            padding: 40px; 
            text-align: ${config.headerStyle === 'centered' ? 'center' : 'right'}; 
        }
        .header h1 { font-size: 36px; margin-bottom: 12px; font-weight: 700; }
        .header p { opacity: 0.95; font-size: 18px; margin-bottom: 8px; }
        .invoice-details { 
            padding: 35px; 
            background: ${colors.accent};
        }
        .invoice-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 35px; 
            margin-bottom: 35px; 
        }
        .info-section h3 { 
            color: ${colors.primary}; 
            margin-bottom: 18px; 
            font-size: 20px; 
            border-bottom: 3px solid ${colors.primary}; 
            padding-bottom: 8px; 
        }
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px; 
            padding: 8px 0; 
        }
        .info-label { color: #555; font-weight: 600; font-size: 15px; }
        .info-value { font-weight: 700; color: #222; font-size: 15px; }
        .items-section {
            padding: 0 35px 35px;
        }
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            border-radius: 10px; 
            overflow: hidden; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
        }
        .items-table th { 
            background: ${colors.primary}; 
            color: white; 
            padding: 18px; 
            text-align: center; 
            font-size: 16px; 
            font-weight: 700;
        }
        .items-table td { 
            padding: 15px; 
            text-align: center; 
            border-bottom: 1px solid #eee; 
            font-size: 15px;
        }
        .items-table tbody tr:hover { background: ${colors.accent}; }
        .items-table tbody tr:nth-child(even) { background: #f9f9f9; }
        .total-section { 
            background: ${colors.accent}; 
            padding: 30px 35px; 
            border-top: 4px solid ${colors.primary};
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0; 
            border-bottom: 1px solid #ddd; 
            font-size: 17px;
            font-weight: 500;
        }
        .total-row.final { 
            font-size: 22px; 
            font-weight: 800; 
            color: ${colors.primary}; 
            border-bottom: none; 
            margin-top: 20px; 
            padding: 20px 25px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .footer { 
            background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee; 
        }
        .footer p { margin-bottom: 10px; font-size: 15px; }
        .qr-section {
            ${config.qrCode ? 'display: block;' : 'display: none;'}
            text-align: center;
            padding: 25px;
            background: white;
            margin: 25px 0;
            border-radius: 10px;
            border: 2px dashed ${colors.primary};
        }
        .config-indicator {
            position: absolute;
            top: 10px;
            left: 10px;
            background: ${colors.primary};
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 11px;
            opacity: 0.8;
        }
        @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; }
            .config-indicator { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="config-indicator">Alpha 35 ${config.template}</div>
        <div class="content">
            <div class="header">
                <h1>مارفانت</h1>
                <p>ارائه‌دهنده خدمات V2Ray و پروکسی</p>
                ${config.showLogo ? '<p style="margin-top: 12px; font-size: 16px;">🌐 شبکه ملی مارفانت</p>' : ''}
            </div>
            
            <div class="invoice-details">
                <div class="invoice-info">
                    <div class="info-section">
                        <h3>اطلاعات فاکتور</h3>
                        <div class="info-row">
                            <span class="info-label">شماره فاکتور:</span>
                            <span class="info-value">${invoice.invoiceNumber}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاریخ صدور:</span>
                            <span class="info-value">${new Date(invoice.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">وضعیت:</span>
                            <span class="info-value">${invoice.status === 'paid' ? 'پرداخت شده' : invoice.status === 'pending' ? 'در انتظار پرداخت' : 'پیش‌نویس'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">قالب:</span>
                            <span class="info-value">Alpha 35 ${config.template}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h3>اطلاعات ${config.representativeInfoLevel === 'detailed' ? 'کامل ' : ''}نماینده</h3>
                        ${invoice.representative ? `
                            <div class="info-row">
                                <span class="info-label">نام کامل:</span>
                                <span class="info-value">${invoice.representative.fullName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">نام کاربری:</span>
                                <span class="info-value">${invoice.representative.adminUsername}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">تلگرام:</span>
                                <span class="info-value">@${invoice.representative.telegramId}</span>
                            </div>
                        ` : `
                            <div class="info-row">
                                <span class="info-label">نماینده:</span>
                                <span class="info-value">نامشخص</span>
                            </div>
                        `}
                    </div>
                </div>
            </div>
            
            <div class="items-section">
                <h3 style="color: ${colors.primary}; margin-bottom: 20px; font-size: 22px;">جزئیات خدمات</h3>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>شرح خدمات</th>
                            <th>تعداد</th>
                            <th>قیمت واحد</th>
                            <th>مبلغ کل</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsTableHTML || `
                            <tr>
                                <td style="text-align: right; font-weight: 500;">خدمات V2Ray - اشتراک ماهانه</td>
                                <td>1</td>
                                <td>${parseFloat(invoice.totalAmount).toLocaleString('fa-IR')} تومان</td>
                                <td style="font-weight: 600;">${parseFloat(invoice.totalAmount).toLocaleString('fa-IR')} تومان</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span>جمع کل خدمات:</span>
                    <span>${parseFloat(invoice.baseAmount).toLocaleString('fa-IR')} تومان</span>
                </div>
                ${config.calculationDisplay === 'detailed' ? `
                <div class="total-row">
                    <span>تخفیف نماینده:</span>
                    <span>-${(parseFloat(invoice.baseAmount) - parseFloat(invoice.totalAmount)).toLocaleString('fa-IR')} تومان</span>
                </div>
                ` : ''}
                <div class="total-row final">
                    <span>مبلغ قابل پرداخت:</span>
                    <span>${parseFloat(invoice.totalAmount).toLocaleString('fa-IR')} تومان</span>
                </div>
            </div>

            ${config.qrCode ? `
            <div class="qr-section">
                <h4 style="margin-bottom: 15px; color: ${colors.primary}; font-size: 18px;">کد QR پرداخت</h4>
                <div style="width: 150px; height: 150px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); margin: 0 auto; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px; border: 2px solid ${colors.primary};">
                    QR پرداخت
                </div>
                <p style="margin-top: 15px; font-size: 13px; color: #666;">برای پرداخت سریع، کد QR را اسکن کنید</p>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p><strong>شرکت مارفانت</strong> | ارائه‌دهنده خدمات V2Ray و پروکسی</p>
            <p>www.marfanet.com | support@marfanet.com</p>
            <p style="margin-top: 15px; font-size: 13px; color: ${colors.primary}; font-weight: 600;">این فاکتور با سیستم Alpha 35 تولید شده است</p>
            ${config.watermark ? '<p style="margin-top: 8px; font-size: 11px; opacity: 0.7;">🔐 امضای دیجیتال تأیید شده</p>' : ''}
        </div>
    </div>
</body>
</html>`;
  }

  generateTelegramMessage(invoice: Invoice, invoiceUrl: string): string {
    return `🧾 *فاکتور جدید از مارفانت*

📋 *شماره فاکتور:* \`${invoice.invoiceNumber}\`
👤 *نماینده:* ${invoice.representative?.fullName || 'نامشخص'}
💰 *مبلغ:* ${parseFloat(invoice.totalAmount).toLocaleString('fa-IR')} تومان
📅 *تاریخ:* ${new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
📊 *وضعیت:* ${invoice.status === 'paid' ? '✅ پرداخت شده' : invoice.status === 'pending' ? '⏳ در انتظار پرداخت' : '📝 پیش‌نویس'}

🔗 *مشاهده فاکتور کامل:*
${invoiceUrl}

📲 برای مشاهده فاکتور کامل با قالب Alpha 35 روی لینک بالا کلیک کنید.

────────────────────
🌐 *شرکت مارفانت*
ارائه‌دهنده خدمات V2Ray و پروکسی`.trim();
  }
}