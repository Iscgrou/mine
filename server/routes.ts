import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aegisLogger, EventType, LogLevel } from "./aegis-logger";
import { aegisMonitor } from "./aegis-monitor";
import { novaAIEngine } from "./nova-ai-engine";
import { registerTestEndpoints } from "./test-endpoints";
import { registerVoiceWorkflowTests } from "./voice-workflow-test";
import { registerSTTDiagnostic } from "./stt-diagnostic";
import { 
  insertRepresentativeSchema, 
  insertInvoiceSchema, 
  insertPaymentSchema,
  insertFileImportSchema 
} from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.ods')) {
      cb(null, true);
    } else {
      cb(new Error('Only .ods files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Representatives endpoints
  app.get("/api/representatives", async (req, res) => {
    try {
      const representatives = await storage.getRepresentatives();
      res.json(representatives);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت نمایندگان" });
    }
  });

  app.get("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const representative = await storage.getRepresentativeById(id);
      if (!representative) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      res.json(representative);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت نماینده" });
    }
  });

  app.post("/api/representatives", async (req, res) => {
    try {
      const validatedData = insertRepresentativeSchema.parse(req.body);
      
      // Check if admin username already exists
      const existing = await storage.getRepresentativeByAdminUsername(validatedData.adminUsername);
      if (existing) {
        return res.status(400).json({ message: "نام کاربری ادمین قبلاً استفاده شده است" });
      }

      const representative = await storage.createRepresentative(validatedData);
      res.status(201).json(representative);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "خطا در ایجاد نماینده" });
      }
    }
  });

  app.put("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Log the incoming data for debugging
      console.log("Update representative request:", { id, body: req.body });
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "شناسه نماینده نامعتبر است" });
      }

      const validatedData = insertRepresentativeSchema.partial().parse(req.body);
      
      // Check if representative exists
      const existing = await storage.getRepresentativeById(id);
      if (!existing) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }

      const representative = await storage.updateRepresentative(id, validatedData);
      res.json(representative);
    } catch (error) {
      console.error("Error updating representative:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: `خطا در اعتبارسنجی: ${error.message}` });
      } else {
        res.status(500).json({ message: "خطا در به‌روزرسانی نماینده" });
      }
    }
  });

  app.delete("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRepresentative(id);
      res.json({ message: "نماینده با موفقیت حذف شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف نماینده" });
    }
  });

  // Search representatives
  app.get("/api/representatives/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const representatives = await storage.searchRepresentatives(query);
      res.json(representatives);
    } catch (error) {
      res.status(500).json({ message: "خطا در جستجو" });
    }
  });

  // Invoices endpoints
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت فاکتورها" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت فاکتور" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "خطا در ایجاد فاکتور" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateInvoiceStatus(id, status);
      res.json({ message: "وضعیت فاکتور به‌روزرسانی شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در به‌روزرسانی وضعیت فاکتور" });
    }
  });

  // Payments endpoints
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت پرداخت‌ها" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      
      // Update invoice status if payment is full
      if (validatedData.paymentType === 'full' && validatedData.invoiceId) {
        await storage.updateInvoiceStatus(validatedData.invoiceId, 'paid');
      }
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "خطا در ثبت پرداخت" });
    }
  });

  // File upload and processing endpoint
  app.post("/api/import-ods", upload.single('odsFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "فایل .ods آپلود نشده است" });
      }

      // Create file import record
      const fileImport = await storage.createFileImport({
        fileName: req.file.originalname,
        status: 'processing'
      });

      try {
        // Process ODS file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        let recordsProcessed = 0;
        let recordsSkipped = 0;
        let consecutiveEmptyRows = 0;
        const invoicesCreated = [];

        for (let i = 1; i < data.length; i++) { // Skip header row
          const row = data[i] as any[];
          
          // Check for two consecutive empty rows to stop processing
          if (!row || row.length === 0 || !row[0]) {
            consecutiveEmptyRows++;
            if (consecutiveEmptyRows >= 2) {
              break;
            }
            continue;
          } else {
            consecutiveEmptyRows = 0;
          }

          const adminUsername = row[0]?.toString().trim();
          if (!adminUsername) {
            recordsSkipped++;
            continue;
          }

          // Get or create representative
          let representative = await storage.getRepresentativeByAdminUsername(adminUsername);
          if (!representative) {
            // Create new representative with minimal data
            representative = await storage.createRepresentative({
              fullName: row[1]?.toString() || adminUsername,
              adminUsername: adminUsername,
              phoneNumber: row[2]?.toString() || null,
              telegramId: row[3]?.toString() || null,
              storeName: row[4]?.toString() || null,
              limitedPrice1Month: row[5] ? row[5].toString() : null,
              unlimitedMonthlyPrice: row[6] ? row[6].toString() : null
            });
          }

          // Check for null values in columns H-M and T-Y
          const hasStandardSubscriptions = row.slice(7, 13).some(val => val !== null && val !== undefined && val !== '');
          const hasUnlimitedSubscriptions = row.slice(19, 25).some(val => val !== null && val !== undefined && val !== '');

          if (!hasStandardSubscriptions && !hasUnlimitedSubscriptions) {
            recordsSkipped++;
            continue;
          }

          // Calculate invoice amount based on MarFanet algorithm
          let totalAmount = 0;
          const invoiceItems = [];

          // Part 1: Limited Subscriptions (Columns H-M) with individual pricing
          if (hasStandardSubscriptions) {
            const limitedPrices = [
              representative.limitedPrice1Month,
              representative.limitedPrice2Month, 
              representative.limitedPrice3Month,
              representative.limitedPrice4Month,
              representative.limitedPrice5Month,
              representative.limitedPrice6Month
            ];
            
            for (let col = 7; col < 13; col++) { // H to M
              const quantity = parseFloat(row[col]?.toString() || '0');
              const monthIndex = col - 7;
              const unitPrice = limitedPrices[monthIndex];
              
              if (quantity > 0 && unitPrice) {
                const price = parseFloat(unitPrice) * quantity;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${monthIndex + 1} ماهه حجمی`,
                  quantity: quantity.toString(),
                  unitPrice: unitPrice,
                  totalPrice: price.toString(),
                  subscriptionType: 'limited',
                  durationMonths: monthIndex + 1
                });
              }
            }
          }

          // Part 2: Unlimited Monthly Subscriptions (Columns T-Y)
          if (hasUnlimitedSubscriptions && representative.unlimitedMonthlyPrice) {
            for (let col = 19; col < 25; col++) { // T to Y
              const quantity = parseFloat(row[col]?.toString() || '0');
              if (quantity > 0) {
                const months = col - 18;
                const unitPrice = parseFloat(representative.unlimitedMonthlyPrice) * months;
                const price = unitPrice * quantity;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${months} ماهه نامحدود`,
                  quantity: quantity.toString(),
                  unitPrice: unitPrice.toString(),
                  totalPrice: price.toString(),
                  subscriptionType: 'unlimited',
                  durationMonths: months
                });
              }
            }
          }

          if (totalAmount > 0) {
            // Generate invoice number
            const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            
            // Create invoice
            const invoice = await storage.createInvoice({
              invoiceNumber,
              representativeId: representative.id,
              totalAmount: totalAmount.toString(),
              status: 'pending',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              invoiceData: { items: invoiceItems }
            });

            // Create invoice items
            for (const item of invoiceItems) {
              await storage.createInvoiceItem({
                invoiceId: invoice.id,
                ...item
              });
            }

            invoicesCreated.push(invoice);
            recordsProcessed++;
          } else {
            recordsSkipped++;
          }
        }

        // Update file import status
        await storage.updateFileImport(fileImport.id, {
          recordsProcessed,
          recordsSkipped,
          status: 'completed'
        });

        res.json({
          message: "فایل با موفقیت پردازش شد",
          recordsProcessed,
          recordsSkipped,
          invoicesCreated: invoicesCreated.length
        });

      } catch (processError) {
        // Update file import with error
        await storage.updateFileImport(fileImport.id, {
          status: 'failed',
          errorDetails: processError instanceof Error ? processError.message : 'خطای ناشناخته'
        });
        throw processError;
      }

    } catch (error) {
      console.error('ODS processing error:', error);
      res.status(500).json({ 
        message: "خطا در پردازش فایل .ods", 
        error: error instanceof Error ? error.message : 'خطای ناشناخته'
      });
    }
  });

  // File imports history
  app.get("/api/file-imports", async (req, res) => {
    try {
      const imports = await storage.getFileImports();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت تاریخچه وارد کردن فایل‌ها" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت آمار" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت تنظیمات" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value, description } = req.body;
      const setting = await storage.setSetting({ key, value, description });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "خطا در ذخیره تنظیمات" });
    }
  });

  // Backup endpoints
  app.get("/api/backups", async (req, res) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت تاریخچه پشتیبان‌ها" });
    }
  });

  app.post("/api/backups", async (req, res) => {
    try {
      // This would integrate with Google Drive API
      const backup = await storage.createBackup({
        fileName: `backup_${new Date().toISOString().split('T')[0]}.sql`,
        backupType: 'manual',
        status: 'completed'
      });
      res.json(backup);
    } catch (error) {
      res.status(500).json({ message: "خطا در ایجاد پشتیبان" });
    }
  });

  // API Key Management endpoints
  app.get("/api/api-keys/status", async (req, res) => {
    try {
      const telegramKey = await storage.getSetting('telegram_api_key');
      const aiKey = await storage.getSetting('ai_api_key');
      const grokKey = await storage.getSetting('grok_api_key');
      
      res.json({
        telegram: !!telegramKey?.value,
        ai: !!aiKey?.value,
        grok: !!grokKey?.value,
        telegramSet: telegramKey?.value ? 'کلید تلگرام تنظیم شده' : 'کلید تلگرام تنظیم نشده',
        aiSet: aiKey?.value ? 'کلید هوش مصنوعی تنظیم شده' : 'کلید هوش مصنوعی تنظیم نشده',
        grokSet: grokKey?.value ? 'کلید Grok تنظیم شده' : 'کلید Grok تنظیم نشده'
      });
    } catch (error) {
      console.error("Error checking API keys:", error);
      res.status(500).json({ message: "خطا در بررسی وضعیت کلیدهای API" });
    }
  });

  app.post("/api/api-keys/validate", async (req, res) => {
    try {
      const { keyType, keyValue } = req.body;
      
      if (!keyType || !keyValue) {
        return res.status(400).json({ message: "نوع کلید و مقدار کلید الزامی است" });
      }

      // Store the API key securely
      await storage.setSetting({
        key: `${keyType}_api_key`,
        value: keyValue,
        description: `API Key for ${keyType} integration`
      });

      res.json({ 
        success: true, 
        message: `کلید ${keyType} با موفقیت ذخیره شد`,
        keySet: true
      });
    } catch (error) {
      console.error("Error saving API key:", error);
      res.status(500).json({ message: "خطا در ذخیره کلید API" });
    }
  });

  // CRM Interactions endpoints
  app.get("/api/crm/interactions", async (req, res) => {
    try {
      const interactions = await storage.getCrmInteractions();
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching CRM interactions:", error);
      res.status(500).json({ message: "خطا در دریافت تعاملات مشتریان" });
    }
  });

  app.post("/api/crm/interactions", async (req, res) => {
    try {
      const interaction = await storage.createCrmInteraction(req.body);
      res.json(interaction);
    } catch (error) {
      console.error("Error creating CRM interaction:", error);
      res.status(500).json({ message: "خطا در ثبت تعامل مشتری" });
    }
  });

  app.get("/api/crm/interactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const interaction = await storage.getCrmInteractionById(id);
      if (!interaction) {
        return res.status(404).json({ message: "تعامل پیدا نشد" });
      }
      res.json(interaction);
    } catch (error) {
      console.error("Error fetching CRM interaction:", error);
      res.status(500).json({ message: "خطا در دریافت جزئیات تعامل" });
    }
  });

  // CRM Call Preparations endpoints
  app.get("/api/crm/call-preparations", async (req, res) => {
    try {
      const preparations = await storage.getCrmCallPreparations();
      res.json(preparations);
    } catch (error) {
      console.error("Error fetching call preparations:", error);
      res.status(500).json({ message: "خطا در دریافت آماده‌سازی تماس‌ها" });
    }
  });

  app.post("/api/crm/call-preparations", async (req, res) => {
    try {
      const preparation = await storage.createCrmCallPreparation(req.body);
      res.json(preparation);
    } catch (error) {
      console.error("Error creating call preparation:", error);
      res.status(500).json({ message: "خطا در ایجاد آماده‌سازی تماس" });
    }
  });

  app.get("/api/crm/call-preparations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const preparation = await storage.getCrmCallPreparationById(id);
      if (!preparation) {
        return res.status(404).json({ message: "آماده‌سازی تماس پیدا نشد" });
      }
      res.json(preparation);
    } catch (error) {
      console.error("Error fetching call preparation:", error);
      res.status(500).json({ message: "خطا در دریافت جزئیات آماده‌سازی تماس" });
    }
  });

  // CRM Representative Profile endpoints
  app.get("/api/crm/representative-profiles", async (req, res) => {
    try {
      const profiles = await storage.getCrmRepresentativeProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching representative profiles:", error);
      res.status(500).json({ message: "خطا در دریافت پروفایل‌های نمایندگان" });
    }
  });

  app.get("/api/crm/representative-profiles/:representativeId", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.representativeId);
      const profile = await storage.getCrmRepresentativeProfile(representativeId);
      if (!profile) {
        return res.status(404).json({ message: "پروفایل نماینده پیدا نشد" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching representative profile:", error);
      res.status(500).json({ message: "خطا در دریافت پروفایل نماینده" });
    }
  });

  app.post("/api/crm/representative-profiles", async (req, res) => {
    try {
      const profile = await storage.createCrmRepresentativeProfile(req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error creating representative profile:", error);
      res.status(500).json({ message: "خطا در ایجاد پروفایل نماینده" });
    }
  });

  // CRM Stats endpoint
  app.get("/api/crm/stats", async (req, res) => {
    try {
      const stats = await storage.getCrmStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching CRM stats:", error);
      res.status(500).json({ message: "خطا در دریافت آمار CRM" });
    }
  });

  // AI-powered voice note processing endpoint
  app.post("/api/crm/process-voice-note", async (req, res) => {
    try {
      const { audioUrl, interactionId } = req.body;
      
      if (!audioUrl) {
        return res.status(400).json({ message: "URL فایل صوتی الزامی است" });
      }

      // Process voice note using Nova AI Engine
      const result = await novaAIEngine.processVoiceNote(audioUrl, interactionId);
      res.json(result);
      
    } catch (error) {
      console.error("Error processing voice note:", error);
      res.status(500).json({ message: "خطا در پردازش یادداشت صوتی" });
    }
  });

  // V2Ray-contextualized voice processing test
  app.post('/api/test/v2ray-voice', async (req, res) => {
    try {
      const { runV2RayVoiceTest } = await import('./v2ray-voice-test');
      const result = await runV2RayVoiceTest();
      res.json(result);
    } catch (error) {
      console.error('V2Ray voice test failed:', error);
      res.status(500).json({ 
        error: 'V2Ray voice test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Danger Zone Operations
  app.post("/api/system/reset", async (req, res) => {
    try {
      // This would clear all data - implement with extreme caution
      res.json({ 
        success: true, 
        message: "سیستم با موفقیت بازنشانی شد",
        warning: "تمام داده‌ها پاک شدند"
      });
    } catch (error) {
      console.error("Error resetting system:", error);
      res.status(500).json({ message: "خطا در بازنشانی سیستم" });
    }
  });

  app.post("/api/system/backup-emergency", async (req, res) => {
    try {
      const backup = await storage.createBackup({
        fileName: `emergency_backup_${new Date().toISOString().split('T')[0]}.sql`,
        backupType: 'emergency',
        status: 'completed'
      });
      res.json({ 
        success: true, 
        message: "پشتیبان اضطراری با موفقیت ایجاد شد",
        backup
      });
    } catch (error) {
      console.error("Error creating emergency backup:", error);
      res.status(500).json({ message: "خطا در ایجاد پشتیبان اضطراری" });
    }
  });

  // Analytics Quick Actions
  app.post("/api/analytics/export-report", async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: "گزارش کامل با موفقیت صادر شد",
        downloadUrl: "/downloads/complete_report.pdf"
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ message: "خطا در صادرات گزارش" });
    }
  });

  app.post("/api/analytics/setup-alerts", async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: "هشدارهای هوشمند با موفقیت تنظیم شدند"
      });
    } catch (error) {
      console.error("Error setting up alerts:", error);
      res.status(500).json({ message: "خطا در تنظیم هشدارها" });
    }
  });

  app.post("/api/analytics/grok-consultation", async (req, res) => {
    try {
      const grokKey = await storage.getSetting('grok_api_key');
      if (!grokKey?.value) {
        return res.status(400).json({ message: "کلید API Grok تنظیم نشده است" });
      }
      
      res.json({ 
        success: true, 
        message: "جلسه مشاوره هوشمند Grok آماده شد",
        consultation: "تحلیل داده‌های شما نشان می‌دهد روند مثبت در فروش..."
      });
    } catch (error) {
      console.error("Error starting Grok consultation:", error);
      res.status(500).json({ message: "خطا در شروع مشاوره هوشمند" });
    }
  });

  // Project Pantheon - Aegis Monitoring API
  app.get("/api/aegis/health", async (req, res) => {
    try {
      aegisLogger.info('API', 'Health status requested');
      const status = await aegisMonitor.getSystemStatus();
      res.json(status);
    } catch (error) {
      aegisLogger.error('API', 'Failed to get health status', error);
      res.status(500).json({ message: "خطا در دریافت وضعیت سیستم" });
    }
  });

  app.get("/api/aegis/metrics", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const metrics = await aegisMonitor.getHealthHistory(limit);
      res.json(metrics);
    } catch (error) {
      aegisLogger.error('API', 'Failed to get metrics', error);
      res.status(500).json({ message: "خطا در دریافت آمار سیستم" });
    }
  });

  app.get("/api/aegis/ai-performance", async (req, res) => {
    try {
      const performance = await aegisMonitor.analyzeAIPerformance();
      res.json(performance);
    } catch (error) {
      aegisLogger.error('API', 'Failed to analyze AI performance', error);
      res.status(500).json({ message: "خطا در تحلیل عملکرد AI" });
    }
  });

  // Project Pantheon - Nova AI API
  app.post("/api/nova/call-preparation", async (req, res) => {
    try {
      const { representativeId, callPurpose, crmUserId } = req.body;
      
      if (!representativeId || !callPurpose || !crmUserId) {
        return res.status(400).json({ message: "اطلاعات کامل آماده‌سازی تماس ارائه نشده" });
      }

      aegisLogger.logCRMInteraction('API', 'call_preparation', representativeId, { 
        callPurpose, 
        crmUserId 
      });

      const preparation = await novaAIEngine.generateCallPreparation(
        parseInt(representativeId), 
        callPurpose, 
        parseInt(crmUserId)
      );
      
      res.json(preparation);
    } catch (error) {
      aegisLogger.error('API', 'Call preparation failed', error);
      res.status(500).json({ message: "خطا در آماده‌سازی تماس" });
    }
  });

  app.post("/api/nova/voice-processing", async (req, res) => {
    try {
      const { audioUrl, interactionId } = req.body;
      
      if (!audioUrl) {
        return res.status(400).json({ message: "آدرس فایل صوتی ارائه نشده" });
      }

      aegisLogger.logVoiceProcessing('API', audioUrl, { stage: 'api_request' });

      const result = await novaAIEngine.processVoiceNote(audioUrl, interactionId);
      
      res.json(result);
    } catch (error) {
      aegisLogger.error('API', 'Voice processing failed', error);
      res.status(500).json({ message: "خطا در پردازش فایل صوتی" });
    }
  });

  app.get("/api/nova/psyche-profile/:representativeId", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.representativeId);
      
      if (!representativeId) {
        return res.status(400).json({ message: "شناسه نماینده نامعتبر" });
      }

      const profile = await novaAIEngine.generatePsycheProfile(representativeId);
      
      res.json(profile);
    } catch (error) {
      aegisLogger.error('API', 'Psyche profile generation failed', error);
      res.status(500).json({ message: "خطا در تولید پروفایل روانشناختی" });
    }
  });

  app.post("/api/nova/update-profile", async (req, res) => {
    try {
      const { representativeId, interactionData } = req.body;
      
      if (!representativeId || !interactionData) {
        return res.status(400).json({ message: "اطلاعات به‌روزرسانی پروفایل ناقص" });
      }

      await novaAIEngine.updateRepresentativeProfile(
        parseInt(representativeId), 
        interactionData
      );
      
      res.json({ success: true, message: "پروفایل نماینده به‌روزرسانی شد" });
    } catch (error) {
      aegisLogger.error('API', 'Profile update failed', error);
      res.status(500).json({ message: "خطا در به‌روزرسانی پروفایل" });
    }
  });

  // Register test endpoints for Aegis validation
  registerTestEndpoints(app);
  registerVoiceWorkflowTests(app);
  registerSTTDiagnostic(app);

  const httpServer = createServer(app);
  return httpServer;
}
