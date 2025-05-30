/**
 * Advanced Invoice Templating & Customization System
 * Professional invoice generation with Persian branding and V2Ray context
 */

import { storage } from './storage';

interface InvoiceTemplate {
  id: string;
  name: string;
  type: 'standard' | 'premium' | 'custom';
  design: {
    headerColor: string;
    accentColor: string;
    fontFamily: 'vazir' | 'iran_sans' | 'sahel';
    logoPosition: 'left' | 'center' | 'right';
    layoutStyle: 'modern' | 'classic' | 'minimal';
  };
  branding: {
    companyName: string;
    companySlogan?: string;
    logoUrl?: string;
    watermarkText?: string;
    brandColors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  sections: {
    header: InvoiceSection;
    itemsTable: InvoiceSection;
    totals: InvoiceSection;
    footer: InvoiceSection;
    terms: InvoiceSection;
  };
  v2raySpecific: {
    showServiceTechnicalDetails: boolean;
    includeServerLocations: boolean;
    displayProtocolInfo: boolean;
    addUsageInstructions: boolean;
  };
  customFields: CustomField[];
  createdAt: Date;
  lastUsed: Date;
}

interface InvoiceSection {
  visible: boolean;
  customText?: string;
  styling: {
    backgroundColor?: string;
    textColor: string;
    fontSize: 'small' | 'medium' | 'large';
    alignment: 'right' | 'center' | 'left';
    borderStyle?: 'none' | 'solid' | 'dashed';
  };
}

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface GeneratedInvoice {
  invoiceData: any;
  template: InvoiceTemplate;
  html: string;
  pdf?: Buffer;
  metadata: {
    generatedAt: Date;
    generatedBy: number; // admin ID
    shamsiDate: string;
    invoiceNumber: string;
    customization: {
      appliedTemplate: string;
      personalizations: Record<string, any>;
    };
  };
}

class AdvancedInvoiceTemplating {
  private readonly ADVANCED_TEMPLATES: Record<string, Partial<InvoiceTemplate>> = {
    'modern_clean': {
      name: 'مدرن و پاک',
      type: 'premium',
      design: {
        headerColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        accentColor: '#4f46e5',
        fontFamily: 'iran_sans',
        logoPosition: 'left',
        layoutStyle: 'modern'
      },
      algorithm: 'minimalist_geometry',
      branding: {
        companyName: 'MarFanet',
        companySlogan: 'آینده ارتباطات',
        brandColors: {
          primary: '#4f46e5',
          secondary: '#e5e7eb',
          accent: '#10b981'
        }
      }
    },
    'classic_formal': {
      name: 'کلاسیک و رسمی',
      type: 'standard',
      design: {
        headerColor: '#1f2937',
        accentColor: '#374151',
        fontFamily: 'vazir',
        logoPosition: 'center',
        layoutStyle: 'classic'
      },
      algorithm: 'traditional_borders',
      branding: {
        companyName: 'MarFanet',
        companySlogan: 'خدمات ارتباطی پیشرفته',
        brandColors: {
          primary: '#1f2937',
          secondary: '#f3f4f6',
          accent: '#d97706'
        }
      }
    },
    'persian_optimized': {
      name: 'بهینه شده فارسی',
      type: 'premium',
      design: {
        headerColor: '#059669',
        accentColor: '#10b981',
        fontFamily: 'sahel',
        logoPosition: 'right',
        layoutStyle: 'minimal'
      },
      algorithm: 'calligraphy_enhanced',
      branding: {
        companyName: 'مارفانت',
        companySlogan: 'فناوری در خدمت ایرانیان',
        brandColors: {
          primary: '#059669',
          secondary: '#f0fdf4',
          accent: '#dc2626'
        }
      }
    }
        brandColors: {
          primary: '#1e40af',
          secondary: '#64748b',
          accent: '#f97316'
        }
      }
    },
    'v2ray_technical': {
      name: 'قالب فنی V2Ray',
      type: 'premium',
      design: {
        headerColor: '#059669',
        accentColor: '#10b981',
        fontFamily: 'iran_sans',
        logoPosition: 'left',
        layoutStyle: 'modern'
      },
      v2raySpecific: {
        showServiceTechnicalDetails: true,
        includeServerLocations: true,
        displayProtocolInfo: true,
        addUsageInstructions: true
      }
    },
    'minimal_clean': {
      name: 'قالب مینیمال',
      type: 'standard',
      design: {
        headerColor: '#374151',
        accentColor: '#6b7280',
        fontFamily: 'sahel',
        logoPosition: 'center',
        layoutStyle: 'minimal'
      }
    }
  };

  /**
   * Generate customized invoice with advanced templating
   */
  async generateAdvancedInvoice(
    invoiceId: number,
    templateId: string,
    customizations?: Record<string, any>
  ): Promise<GeneratedInvoice> {
    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const template = await this.getTemplate(templateId);
    const personalizedTemplate = this.applyCustomizations(template, customizations);
    
    const html = await this.generateInvoiceHTML(invoice, personalizedTemplate);
    
    return {
      invoiceData: invoice,
      template: personalizedTemplate,
      html,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 1, // TODO: Get from session
        shamsiDate: this.getCurrentShamsiDate(),
        invoiceNumber: invoice.invoiceNumber,
        customization: {
          appliedTemplate: templateId,
          personalizations: customizations || {}
        }
      }
    };
  }

  /**
   * Create custom template
   */
  async createCustomTemplate(
    templateData: Partial<InvoiceTemplate>,
    createdBy: number
  ): Promise<InvoiceTemplate> {
    const template: InvoiceTemplate = {
      id: `custom_${Date.now()}`,
      name: templateData.name || 'قالب سفارشی',
      type: 'custom',
      design: {
        headerColor: '#1e40af',
        accentColor: '#3b82f6',
        fontFamily: 'vazir',
        logoPosition: 'right',
        layoutStyle: 'modern',
        ...templateData.design
      },
      branding: {
        companyName: 'مارفانت',
        brandColors: {
          primary: '#1e40af',
          secondary: '#64748b',
          accent: '#f97316'
        },
        ...templateData.branding
      },
      sections: {
        header: { visible: true, styling: { textColor: '#000000', fontSize: 'large', alignment: 'right' } },
        itemsTable: { visible: true, styling: { textColor: '#000000', fontSize: 'medium', alignment: 'right' } },
        totals: { visible: true, styling: { textColor: '#000000', fontSize: 'medium', alignment: 'right' } },
        footer: { visible: true, styling: { textColor: '#666666', fontSize: 'small', alignment: 'center' } },
        terms: { visible: true, styling: { textColor: '#666666', fontSize: 'small', alignment: 'right' } },
        ...templateData.sections
      },
      v2raySpecific: {
        showServiceTechnicalDetails: false,
        includeServerLocations: false,
        displayProtocolInfo: false,
        addUsageInstructions: false,
        ...templateData.v2raySpecific
      },
      customFields: templateData.customFields || [],
      createdAt: new Date(),
      lastUsed: new Date()
    };

    // Save to storage (extend IStorage if needed)
    // await storage.saveInvoiceTemplate(template);

    return template;
  }

  /**
   * Generate professional HTML invoice
   */
  private async generateInvoiceHTML(invoice: any, template: InvoiceTemplate): Promise<string> {
    const styles = this.generateCSSStyles(template);
    const header = this.generateHeaderSection(invoice, template);
    const itemsTable = this.generateItemsTable(invoice, template);
    const totals = this.generateTotalsSection(invoice, template);
    const footer = this.generateFooterSection(template);
    const v2rayDetails = template.v2raySpecific.showServiceTechnicalDetails 
      ? this.generateV2RayTechnicalDetails(invoice) 
      : '';

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاکتور ${invoice.invoiceNumber}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="invoice-container">
        ${header}
        ${itemsTable}
        ${v2rayDetails}
        ${totals}
        ${footer}
    </div>
</body>
</html>
    `;
  }

  private generateCSSStyles(template: InvoiceTemplate): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
      
      * { box-sizing: border-box; }
      
      body {
        font-family: 'Vazirmatn', 'Tahoma', sans-serif;
        line-height: 1.6;
        color: #333;
        background: #fff;
        margin: 0;
        padding: 20px;
      }
      
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
      }
      
      .header {
        background: ${template.design.headerColor};
        color: white;
        padding: 30px;
        text-align: ${template.design.logoPosition};
      }
      
      .company-name {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      
      .company-slogan {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .invoice-details {
        padding: 20px 30px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .items-table th,
      .items-table td {
        padding: 12px;
        text-align: right;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .items-table th {
        background: ${template.design.accentColor};
        color: white;
        font-weight: 600;
      }
      
      .totals-section {
        padding: 20px 30px;
        background: #f8fafc;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 16px;
      }
      
      .total-row.final {
        font-weight: 700;
        font-size: 18px;
        color: ${template.design.headerColor};
        border-top: 2px solid ${template.design.accentColor};
        padding-top: 10px;
      }
      
      .v2ray-technical {
        padding: 20px 30px;
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        margin: 20px 0;
        border-radius: 6px;
      }
      
      .footer {
        padding: 20px 30px;
        text-align: center;
        background: #1f2937;
        color: #9ca3af;
        font-size: 12px;
      }
      
      @media print {
        body { padding: 0; }
        .invoice-container { box-shadow: none; }
      }
    `;
  }

  private generateHeaderSection(invoice: any, template: InvoiceTemplate): string {
    return `
      <div class="header">
        <div class="company-name">${template.branding.companyName}</div>
        ${template.branding.companySlogan ? `<div class="company-slogan">${template.branding.companySlogan}</div>` : ''}
      </div>
      <div class="invoice-details">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; color: ${template.design.headerColor};">فاکتور ${invoice.invoiceNumber}</h2>
            <p style="margin: 5px 0; color: #64748b;">تاریخ: ${new Date(invoice.createdAt).toLocaleDateString('fa-IR')}</p>
          </div>
          <div style="text-align: left;">
            <strong>${invoice.representative?.fullName || 'نامشخص'}</strong><br>
            <span style="color: #64748b;">${invoice.representative?.adminUsername || ''}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateItemsTable(invoice: any, template: InvoiceTemplate): string {
    if (!invoice.items || invoice.items.length === 0) {
      return `
        <div style="padding: 20px 30px;">
          <p style="text-align: center; color: #64748b;">هیچ آیتمی در این فاکتور یافت نشد</p>
        </div>
      `;
    }

    const itemsRows = invoice.items.map((item: any) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.quantity || '1'}</td>
        <td style="text-align: center;">${this.formatPersianNumber(item.unitPrice || '0')} تومان</td>
        <td style="text-align: center; font-weight: 600;">${this.formatPersianNumber(item.totalPrice || '0')} تومان</td>
      </tr>
    `).join('');

    return `
      <div style="padding: 0 30px;">
        <table class="items-table">
          <thead>
            <tr>
              <th>شرح خدمات</th>
              <th style="text-align: center;">تعداد</th>
              <th style="text-align: center;">قیمت واحد</th>
              <th style="text-align: center;">قیمت کل</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateV2RayTechnicalDetails(invoice: any): string {
    return `
      <div class="v2ray-technical">
        <h4 style="margin: 0 0 15px 0; color: #0ea5e9;">🔧 اطلاعات فنی سرویس V2Ray</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
          <div><strong>پروتکل:</strong> VMess/VLess</div>
          <div><strong>رمزگذاری:</strong> AES-128-GCM</div>
          <div><strong>موقعیت سرور:</strong> آلمان، هلند</div>
          <div><strong>پورت:</strong> 443, 80</div>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #e0f7fa; border-radius: 4px; font-size: 12px;">
          📱 <strong>راهنمای نصب:</strong> فایل کانفیگ را در اپلیکیشن V2Ray وارد کرده و روی اتصال کلیک کنید.
        </div>
      </div>
    `;
  }

  private generateTotalsSection(invoice: any, template: InvoiceTemplate): string {
    return `
      <div class="totals-section">
        <div class="total-row final">
          <span>مبلغ کل:</span>
          <span>${this.formatPersianNumber(invoice.totalAmount)} تومان</span>
        </div>
      </div>
    `;
  }

  private generateFooterSection(template: InvoiceTemplate): string {
    return `
      <div class="footer">
        <p>این فاکتور توسط سیستم مارفانت تولید شده است</p>
        <p>برای پشتیبانی با ما تماس بگیرید</p>
      </div>
    `;
  }

  private applyCustomizations(template: InvoiceTemplate, customizations?: Record<string, any>): InvoiceTemplate {
    if (!customizations) return template;

    return {
      ...template,
      ...customizations,
      design: { ...template.design, ...customizations.design },
      branding: { ...template.branding, ...customizations.branding }
    };
  }

  private async getTemplate(templateId: string): Promise<InvoiceTemplate> {
    // Try to get from storage first
    // const stored = await storage.getInvoiceTemplate(templateId);
    // if (stored) return stored;

    // Fall back to default templates
    const defaultTemplate = this.DEFAULT_TEMPLATES[templateId];
    if (!defaultTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      id: templateId,
      ...defaultTemplate,
      sections: {
        header: { visible: true, styling: { textColor: '#000000', fontSize: 'large', alignment: 'right' } },
        itemsTable: { visible: true, styling: { textColor: '#000000', fontSize: 'medium', alignment: 'right' } },
        totals: { visible: true, styling: { textColor: '#000000', fontSize: 'medium', alignment: 'right' } },
        footer: { visible: true, styling: { textColor: '#666666', fontSize: 'small', alignment: 'center' } },
        terms: { visible: true, styling: { textColor: '#666666', fontSize: 'small', alignment: 'right' } }
      },
      v2raySpecific: {
        showServiceTechnicalDetails: false,
        includeServerLocations: false,
        displayProtocolInfo: false,
        addUsageInstructions: false,
        ...defaultTemplate.v2raySpecific
      },
      customFields: [],
      createdAt: new Date(),
      lastUsed: new Date()
    } as InvoiceTemplate;
  }

  private formatPersianNumber(num: string | number): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
  }

  private getCurrentShamsiDate(): string {
    const now = new Date();
    // Simple approximation - in real implementation use proper Shamsi conversion
    return new Intl.DateTimeFormat('fa-IR').format(now);
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<Partial<InvoiceTemplate>[]> {
    return Object.entries(this.DEFAULT_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      type: template.type,
      design: template.design
    }));
  }
}

export const advancedInvoiceTemplating = new AdvancedInvoiceTemplating();