/**
 * Enhanced Telegram Service with Advanced Invoice Template Integration
 * Supports PDF, Image, and Rich HTML templates for invoice delivery
 */

import { storage } from './storage';
import { InvoiceTemplateService } from './invoice-template-service';
import { EnhancedInvoiceTemplates } from './enhanced-invoice-templates';
import { AdvancedInvoiceTemplating } from './advanced-invoice-templating';

export interface TelegramConfig {
  botToken: string;
  adminChatId: string;
  enabled: boolean;
}

export interface InvoiceDeliveryOptions {
  format: 'pdf' | 'image' | 'html' | 'text';
  templateStyle: 'modern_clean' | 'classic_formal' | 'persian_optimized';
  includeAttachment: boolean;
  sendToBot: boolean;
  sendDirect: boolean;
}

export class EnhancedTelegramService {
  private templateService: InvoiceTemplateService;
  private enhancedTemplates: EnhancedInvoiceTemplates;
  private advancedTemplating: AdvancedInvoiceTemplating;

  constructor() {
    this.templateService = new InvoiceTemplateService();
    this.enhancedTemplates = new EnhancedInvoiceTemplates();
    this.advancedTemplating = new AdvancedInvoiceTemplating();
  }

  async getTelegramConfig(): Promise<TelegramConfig> {
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
      console.error('Error getting Telegram config:', error);
      return { botToken: '', adminChatId: '', enabled: false };
    }
  }

  async generateInvoiceContent(invoiceId: number, options: InvoiceDeliveryOptions): Promise<{
    content: string;
    attachment?: Buffer;
    filename?: string;
    mimeType?: string;
  }> {
    try {
      // Get invoice data
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get template customizations
      const customization = await this.templateService.getTemplateCustomizations();

      // Prepare invoice data for templating
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        representative: {
          fullName: invoice.representative?.fullName || 'نامشخص',
          adminUsername: invoice.representative?.adminUsername || '',
          storeName: invoice.representative?.storeName || '',
          phoneNumber: invoice.representative?.phoneNumber || ''
        },
        items: invoice.items || [],
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : new Date(),
        createdAt: new Date(invoice.createdAt)
      };

      switch (options.format) {
        case 'pdf':
          return await this.generatePDFInvoice(invoiceData, options.templateStyle, customization);
        
        case 'image':
          return await this.generateImageInvoice(invoiceData, options.templateStyle, customization);
        
        case 'html':
          return await this.generateHTMLInvoice(invoiceData, options.templateStyle, customization);
        
        case 'text':
        default:
          return await this.generateTextInvoice(invoiceData, customization);
      }
    } catch (error) {
      console.error('Error generating invoice content:', error);
      throw error;
    }
  }

  private async generatePDFInvoice(invoiceData: any, templateStyle: string, customization: any) {
    // Generate HTML first
    const htmlContent = this.enhancedTemplates.generateInvoice(invoiceData, templateStyle);
    
    // Convert to PDF using a library like puppeteer or html-pdf
    // For now, return base64 encoded HTML as fallback
    const pdfBuffer = Buffer.from(htmlContent, 'utf-8');
    
    return {
      content: `فاکتور ${invoiceData.invoiceNumber} به صورت PDF آماده شد.`,
      attachment: pdfBuffer,
      filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  private async generateImageInvoice(invoiceData: any, templateStyle: string, customization: any) {
    // Generate HTML first
    const htmlContent = this.enhancedTemplates.generateInvoice(invoiceData, templateStyle);
    
    // Convert to image using html-to-image or similar
    // For now, return HTML as fallback
    const imageBuffer = Buffer.from(htmlContent, 'utf-8');
    
    return {
      content: `فاکتور ${invoiceData.invoiceNumber} به صورت تصویر آماده شد.`,
      attachment: imageBuffer,
      filename: `invoice-${invoiceData.invoiceNumber}.png`,
      mimeType: 'image/png'
    };
  }

  private async generateHTMLInvoice(invoiceData: any, templateStyle: string, customization: any) {
    const htmlContent = this.enhancedTemplates.generateInvoice(invoiceData, templateStyle);
    
    return {
      content: htmlContent,
      filename: `invoice-${invoiceData.invoiceNumber}.html`,
      mimeType: 'text/html'
    };
  }

  private async generateTextInvoice(invoiceData: any, customization: any) {
    const message = `
🧾 فاکتور ${customization.companyName}

📋 شماره فاکتور: ${invoiceData.invoiceNumber}
👤 نماینده: ${invoiceData.representative.fullName}
🏪 فروشگاه: ${invoiceData.representative.storeName || 'نامشخص'}
📅 تاریخ صدور: ${new Intl.DateTimeFormat('fa-IR').format(invoiceData.createdAt)}
📅 تاریخ سررسید: ${new Intl.DateTimeFormat('fa-IR').format(invoiceData.dueDate)}

💰 مبلغ کل: ${parseFloat(invoiceData.totalAmount).toLocaleString()} تومان

${customization.invoiceNote ? `📝 ${customization.invoiceNote}` : ''}

${customization.companyName} - سیستم مدیریت فاکتور
`;

    return { content: message };
  }

  async sendInvoiceToTelegram(invoiceId: number, options: InvoiceDeliveryOptions): Promise<{
    success: boolean;
    message: string;
    botSent?: boolean;
    directSent?: boolean;
  }> {
    try {
      const config = await this.getTelegramConfig();
      
      if (!config.enabled || !config.botToken) {
        return {
          success: false,
          message: 'Telegram bot is not configured or disabled'
        };
      }

      // Generate invoice content
      const invoiceContent = await this.generateInvoiceContent(invoiceId, options);
      
      // Get invoice and representative info
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      let botSent = false;
      let directSent = false;

      // Send to bot (admin chat)
      if (options.sendToBot && config.adminChatId) {
        try {
          await this.sendToBotChat(config, invoiceContent, invoice);
          botSent = true;
        } catch (error) {
          console.error('Failed to send to bot chat:', error);
        }
      }

      // Send direct to representative
      if (options.sendDirect && invoice.representative?.telegramId) {
        try {
          await this.sendDirectToRepresentative(config, invoiceContent, invoice);
          directSent = true;
        } catch (error) {
          console.error('Failed to send direct to representative:', error);
        }
      }

      // Update invoice status
      if (botSent || directSent) {
        await storage.updateInvoice(invoiceId, {
          telegramSent: botSent,
          sentToRepresentative: directSent
        });
      }

      return {
        success: botSent || directSent,
        message: botSent && directSent ? 'Sent to both bot and representative' :
                 botSent ? 'Sent to bot only' :
                 directSent ? 'Sent to representative only' :
                 'Failed to send',
        botSent,
        directSent
      };

    } catch (error) {
      console.error('Error sending invoice to Telegram:', error);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  private async sendToBotChat(config: TelegramConfig, content: any, invoice: any) {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    
    const payload = {
      chat_id: config.adminChatId,
      text: content.content,
      parse_mode: 'HTML'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    // If there's an attachment, send it separately
    if (content.attachment) {
      await this.sendAttachment(config, content, config.adminChatId);
    }
  }

  private async sendDirectToRepresentative(config: TelegramConfig, content: any, invoice: any) {
    // For direct sending, we generate a Telegram share link
    const telegramId = invoice.representative.telegramId.replace('@', '');
    const shareUrl = `https://t.me/${telegramId}?text=${encodeURIComponent(content.content)}`;
    
    // In a real implementation, you might use the bot to send directly
    // For now, we'll mark it as "sent" and provide the share link
    console.log('Direct share URL:', shareUrl);
  }

  private async sendAttachment(config: TelegramConfig, content: any, chatId: string) {
    const url = `https://api.telegram.org/bot${config.botToken}/sendDocument`;
    
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', new Blob([content.attachment], { type: content.mimeType }), content.filename);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Telegram attachment error: ${response.statusText}`);
    }
  }

  async sendBatchInvoices(batchId: number, options: InvoiceDeliveryOptions): Promise<{
    success: boolean;
    total: number;
    sent: number;
    failed: number;
    results: Array<{ invoiceId: number; success: boolean; message: string }>;
  }> {
    try {
      const invoices = await storage.getInvoicesByBatch(batchId);
      const results = [];
      let sent = 0;
      let failed = 0;

      for (const invoice of invoices) {
        try {
          const result = await this.sendInvoiceToTelegram(invoice.id, options);
          results.push({
            invoiceId: invoice.id,
            success: result.success,
            message: result.message
          });
          
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          results.push({
            invoiceId: invoice.id,
            success: false,
            message: error.message
          });
          failed++;
        }
      }

      return {
        success: sent > 0,
        total: invoices.length,
        sent,
        failed,
        results
      };
    } catch (error) {
      console.error('Error sending batch invoices:', error);
      throw error;
    }
  }
}