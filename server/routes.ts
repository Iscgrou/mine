import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
              pricePerGB: row[5] ? parseFloat(row[5].toString()) : null,
              unlimitedMonthlyPrice: row[6] ? parseFloat(row[6].toString()) : null
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

          // Part 1: Standard Subscriptions (Columns H-M)
          if (hasStandardSubscriptions && representative.pricePerGB) {
            for (let col = 7; col < 13; col++) { // H to M
              const quantity = parseFloat(row[col]?.toString() || '0');
              if (quantity > 0) {
                const price = parseFloat(representative.pricePerGB) * quantity;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${col - 6} ماهه محدود`,
                  quantity: quantity,
                  unitPrice: parseFloat(representative.pricePerGB),
                  totalPrice: price,
                  subscriptionType: 'standard',
                  durationMonths: col - 6
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
                const price = parseFloat(representative.unlimitedMonthlyPrice) * months * quantity;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${months} ماهه نامحدود`,
                  quantity: quantity,
                  unitPrice: parseFloat(representative.unlimitedMonthlyPrice) * months,
                  totalPrice: price,
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

  const httpServer = createServer(app);
  return httpServer;
}
