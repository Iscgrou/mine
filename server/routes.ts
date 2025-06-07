import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aegisLogger } from "./aegis-logger";
import { db } from "./db";
import { invoices, invoiceBatches, invoiceItems, commissionRecords, collaborators } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import { BatchProcessor } from "./batch-processor";
import { registerCrmRoutes } from "./routes/crm";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export function registerRoutes(app: Express): Server {
  const server = createServer(app);
  
  // Register CRM routes
  registerCrmRoutes(app);
  
  // Get collaborators endpoint
  app.get("/api/collaborators", async (req, res) => {
    try {
      const collaborators = await storage.getCollaborators();
      res.json(collaborators || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      res.status(500).json({ message: "خطا در دریافت همکاران" });
    }
  });

  // Initialize system collaborators
  app.post("/api/collaborators/initialize", async (req, res) => {
    try {
      const systemCollaborators = [
        {
          collaboratorName: "بهنام",
          uniqueCollaboratorId: "behnam_001",
          phoneNumber: "+98 991 000 0000",
          telegramId: "https://t.me/behnam_marfanet",
          email: "behnam@marfanet.com",
          bankAccountDetails: "بانک ملی ایران - شعبه تهران",
          commissionRate: "15.00",
          tier: "premium" as const,
          region: "تهران",
          status: "active" as const
        }
      ];

      for (const collaborator of systemCollaborators) {
        const existing = await storage.getCollaborators();
        const exists = existing.some(c => c.uniqueCollaboratorId === collaborator.uniqueCollaboratorId);
        
        if (!exists) {
          await storage.createCollaborator(collaborator);
        }
      }

      res.json({ message: "همکاران سیستم با موفقیت راه‌اندازی شدند" });
    } catch (error) {
      console.error('Error initializing collaborators:', error);
      res.status(500).json({ message: "خطا در راه‌اندازی همکاران" });
    }
  });

  // Create collaborator
  app.post("/api/collaborators", async (req, res) => {
    try {
      const collaborator = await storage.createCollaborator(req.body);
      res.json(collaborator);
    } catch (error) {
      console.error('Error creating collaborator:', error);
      res.status(500).json({ message: "خطا در ایجاد همکار" });
    }
  });

  // Update collaborator
  app.put("/api/collaborators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collaborator = await storage.updateCollaborator(id, req.body);
      res.json(collaborator);
    } catch (error) {
      console.error('Error updating collaborator:', error);
      res.status(500).json({ message: "خطا در بروزرسانی همکار" });
    }
  });

  // Update collaborator commission percentage
  app.patch("/api/collaborators/:id/commission", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { commissionPercentage } = req.body;
      
      await db.update(collaborators)
        .set({ commissionPercentage: commissionPercentage.toString() })
        .where(eq(collaborators.id, id));

      res.json({ 
        message: "درصد کمیسیون بروزرسانی شد",
        commissionPercentage: commissionPercentage
      });
    } catch (error) {
      console.error('Error updating commission percentage:', error);
      res.status(500).json({ message: "خطا در بروزرسانی درصد کمیسیون" });
    }
  });

  // Delete collaborator
  app.delete("/api/collaborators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCollaborator(id);
      res.json({ message: "همکار با موفقیت حذف شد" });
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      res.status(500).json({ message: "خطا در حذف همکار" });
    }
  });

  // Get representatives endpoint  
  app.get("/api/representatives", async (req, res) => {
    try {
      const representatives = await storage.getRepresentatives();
      res.json(representatives || []);
    } catch (error) {
      console.error('Error fetching representatives:', error);
      res.status(500).json({ message: "خطا در دریافت نمایندگان" });
    }
  });

  // Get representative by ID
  app.get("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const representative = await storage.getRepresentativeById(id);
      if (!representative) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      res.json(representative);
    } catch (error) {
      console.error('Error fetching representative:', error);
      res.status(500).json({ message: "خطا در دریافت نماینده" });
    }
  });

  // Create representative
  app.post("/api/representatives", async (req, res) => {
    try {
      const representative = await storage.createRepresentative(req.body);
      res.json(representative);
    } catch (error) {
      console.error('Error creating representative:', error);
      res.status(500).json({ message: "خطا در ایجاد نماینده" });
    }
  });

  // Update representative
  app.put("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate that representative exists
      const existingRep = await storage.getRepresentativeById(id);
      if (!existingRep) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }

      // Log the update for debugging
      console.log(`Updating representative ${id} with data:`, JSON.stringify(req.body, null, 2));
      
      // Update representative with new data
      const representative = await storage.updateRepresentative(id, req.body);
      
      console.log(`Representative ${id} updated successfully:`, JSON.stringify(representative, null, 2));
      
      res.json(representative);
    } catch (error) {
      console.error('Error updating representative:', error);
      res.status(500).json({ message: "خطا در بروزرسانی نماینده" });
    }
  });

  // Delete representative
  app.delete("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRepresentative(id);
      res.json({ message: "نماینده با موفقیت حذف شد" });
    } catch (error) {
      console.error('Error deleting representative:', error);
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
      console.error('Error searching representatives:', error);
      res.status(500).json({ message: "خطا در جستجوی نمایندگان" });
    }
  });

  // Batch processing endpoint for representative data uploads
  app.post("/api/upload-representatives", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "فایل انتخاب نشده است" });
      }

      const processor = new BatchProcessor();
      const result = await processor.processRepresentativeFile(req.file.buffer, req.file.originalname);
      
      res.json({
        message: "فایل با موفقیت پردازش شد",
        processed: result.processed,
        skipped: result.skipped,
        details: result.details
      });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ message: "خطا در پردازش فایل" });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: "خطا در دریافت تنظیمات" });
    }
  });

  // Update setting
  app.post("/api/settings", async (req, res) => {
    try {
      const setting = await storage.setSetting(req.body);
      res.json(setting);
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ message: "خطا در بروزرسانی تنظیمات" });
    }
  });

  // Get backups
  app.get("/api/backups", async (req, res) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (error) {
      console.error('Error fetching backups:', error);
      res.status(500).json({ message: "خطا در دریافت پشتیبان‌ها" });
    }
  });

  // Create backup
  app.post("/api/backups", async (req, res) => {
    try {
      const backup = await storage.createBackup(req.body);
      res.json(backup);
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ message: "خطا در ایجاد پشتیبان" });
    }
  });

  // Statistics API - Real-time dashboard metrics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "خطا در دریافت آمار" });
    }
  });

  // Invoice System v2.0 API Endpoints
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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
      // @ts-ignore
      if (invoice.userId && invoice.userId !== req.session.username) {
        return res.status(403).json({ message: "شما مجاز به دسترسی به این فاکتور نیستید" });
      }
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: "خطا در دریافت فاکتور" });
    }
  });

  app.post("/api/invoices/batch", async (req, res) => {
    try {
      const batch = await storage.createInvoiceBatch(req.body);
      res.json(batch);
    } catch (error) {
      console.error('Error creating invoice batch:', error);
      res.status(500).json({ message: "خطا در ایجاد دسته فاکتور" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      // @ts-ignore
      const invoice = await storage.createInvoice(req.body, req.session.username);
      res.json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: "خطا در ایجاد فاکتور" });
    }
  });

  // Alpha 35 Invoice Preview Endpoint
  app.get("/api/invoice/preview", async (req, res) => {
    try {
      const config = req.query.config;
      let invoiceConfig: any = {
        template: 'professional',
        headerStyle: 'centered',
        colorScheme: 'blue-professional',
        fontFamily: 'iranian-sans',
        itemGrouping: 'by-duration',
        calculationDisplay: 'detailed'
      };
      
      if (config) {
        try {
          invoiceConfig = { ...invoiceConfig, ...JSON.parse(Buffer.from(config as string, 'base64').toString()) };
        } catch (e) {
          console.warn('Failed to parse invoice config');
        }
      }

      // Generate sample invoice HTML with Alpha 35 configuration
      const sampleInvoiceHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>پیش‌نمایش فاکتور Alpha 35</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Tahoma', 'Arial', sans-serif; 
            direction: rtl; 
            background: #f5f5f5;
            padding: 20px;
        }
        .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .invoice-info { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
        }
        .info-section h3 { 
            color: #333; 
            margin-bottom: 15px; 
            font-size: 18px; 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 5px; 
        }
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 5px 0; 
        }
        .info-label { color: #666; }
        .info-value { font-weight: bold; color: #333; }
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .items-table th { 
            background: #667eea; 
            color: white; 
            padding: 15px; 
            text-align: center; 
            font-size: 14px; 
        }
        .items-table td { 
            padding: 12px 15px; 
            text-align: center; 
            border-bottom: 1px solid #eee; 
        }
        .items-table tbody tr:hover { background: #f8f9ff; }
        .total-section { 
            background: #f8f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 20px; 
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #ddd; 
        }
        .total-row.final { 
            font-size: 18px; 
            font-weight: bold; 
            color: #667eea; 
            border-bottom: none; 
            margin-top: 10px; 
        }
        .footer { 
            background: #f8f9ff; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee; 
        }
        .config-preview {
            background: #e8f4fd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .config-preview h4 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            font-size: 12px;
        }
        .config-item {
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="config-preview">
            <h4>پیکربندی Alpha 35 فعال</h4>
            <div class="config-grid">
                <div class="config-item">
                    <span>قالب:</span>
                    <span>${invoiceConfig.template || 'professional'}</span>
                </div>
                <div class="config-item">
                    <span>سبک هدر:</span>
                    <span>${invoiceConfig.headerStyle || 'centered'}</span>
                </div>
                <div class="config-item">
                    <span>طرح رنگی:</span>
                    <span>${invoiceConfig.colorScheme || 'blue-professional'}</span>
                </div>
                <div class="config-item">
                    <span>فونت:</span>
                    <span>${invoiceConfig.fontFamily || 'iranian-sans'}</span>
                </div>
                <div class="config-item">
                    <span>گروه‌بندی:</span>
                    <span>${invoiceConfig.itemGrouping || 'by-duration'}</span>
                </div>
                <div class="config-item">
                    <span>نمایش محاسبات:</span>
                    <span>${invoiceConfig.calculationDisplay || 'detailed'}</span>
                </div>
            </div>
        </div>

        <div class="header">
            <h1>مارفانت</h1>
            <p>ارائه‌دهنده خدمات V2Ray و پروکسی</p>
        </div>
        
        <div class="content">
            <div class="invoice-info">
                <div class="info-section">
                    <h3>اطلاعات فاکتور</h3>
                    <div class="info-row">
                        <span class="info-label">شماره فاکتور:</span>
                        <span class="info-value">INV-2025-PREVIEW</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">تاریخ صدور:</span>
                        <span class="info-value">${new Date().toLocaleDateString('fa-IR')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">وضعیت:</span>
                        <span class="info-value">پیش‌نمایش</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>اطلاعات نماینده</h3>
                    <div class="info-row">
                        <span class="info-label">نام کامل:</span>
                        <span class="info-value">احمد محمدی</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">نام کاربری:</span>
                        <span class="info-value">ahmad_admin</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">تلگرام:</span>
                        <span class="info-value">@ahmad_tech</span>
                    </div>
                </div>
            </div>
            
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
                    <tr>
                        <td>اشتراک حجمی V2Ray - ماه ۱</td>
                        <td>۵</td>
                        <td>۳۵۰,۰۰۰ تومان</td>
                        <td>۱,۷۵۰,۰۰۰ تومان</td>
                    </tr>
                    <tr>
                        <td>اشتراک فوری V2Ray - ماه ۳</td>
                        <td>۳</td>
                        <td>۷۵۰,۰۰۰ تومان</td>
                        <td>۲,۲۵۰,۰۰۰ تومان</td>
                    </tr>
                    <tr>
                        <td>اشتراک نامحدود - ماه ۶</td>
                        <td>۲</td>
                        <td>۱,۵۰۰,۰۰۰ تومان</td>
                        <td>۳,۰۰۰,۰۰۰ تومان</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span>جمع کل خدمات:</span>
                    <span>۷,۰۰۰,۰۰۰ تومان</span>
                </div>
                <div class="total-row">
                    <span>تخفیف نماینده:</span>
                    <span>-۷۰۰,۰۰۰ تومان</span>
                </div>
                <div class="total-row final">
                    <span>مبلغ قابل پرداخت:</span>
                    <span>۶,۳۰۰,۰۰۰ تومان</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>با تشکر از اعتماد شما | www.marfanet.com | support@marfanet.com</p>
            <p style="margin-top: 10px; font-size: 12px;">این فاکتور با سیستم Alpha 35 تولید شده است</p>
        </div>
    </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(sampleInvoiceHTML);
      
    } catch (error) {
      console.error('Error generating invoice preview:', error);
      res.status(500).json({ message: "خطا در تولید پیش‌نمایش فاکتور" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateInvoiceStatus(id, status);
      res.json({ message: "وضعیت فاکتور بروزرسانی شد" });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({ message: "خطا در بروزرسانی وضعیت فاکتور" });
    }
  });

  // JSON Invoice Upload Endpoint
  app.post("/api/invoices/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "فایل انتخاب نشده است" });
      }

      const jsonData = JSON.parse(req.file.buffer.toString());
      const processor = new BatchProcessor();
      
      let dataArray = [];
      if (Array.isArray(jsonData)) {
        for (let i = 0; i < jsonData.length; i++) {
          if (jsonData[i].type === "table" && jsonData[i].data && Array.isArray(jsonData[i].data)) {
            dataArray = jsonData[i].data;
            break;
          }
        }
      } else {
        dataArray = jsonData;
      }
      
      const batch = await storage.createInvoiceBatch({
        batchName: `JSON_${new Date().toISOString().split('T')[0]}`,
        fileName: req.file.originalname,
        totalInvoices: dataArray.length || 0,
        totalAmount: "0"
      });

      let processedCount = 0;
      let totalAmount = 0;

      for (const invoiceData of dataArray) {
        try {
          if (!invoiceData.admin_username || 
              !invoiceData.total_subscriptions || 
              parseInt(invoiceData.total_subscriptions) === 0) {
            continue;
          }

          const representative = await storage.getRepresentativeByAdminUsername(
            invoiceData.admin_username
          );

          if (representative) {
            const limited1MonthVolume = parseFloat(invoiceData.limited_1_month_volume || "0");
            const limited2MonthVolume = parseFloat(invoiceData.limited_2_month_volume || "0");
            const limited3MonthVolume = parseFloat(invoiceData.limited_3_month_volume || "0");
            const limited4MonthVolume = parseFloat(invoiceData.limited_4_month_volume || "0");
            const limited5MonthVolume = parseFloat(invoiceData.limited_5_month_volume || "0");
            const limited6MonthVolume = parseFloat(invoiceData.limited_6_month_volume || "0");
            
            const unlimited1MonthCount = parseInt(invoiceData.unlimited_1_month || "0");
            const unlimited2MonthCount = parseInt(invoiceData.unlimited_2_month || "0");
            const unlimited3MonthCount = parseInt(invoiceData.unlimited_3_month || "0");
            const unlimited4MonthCount = parseInt(invoiceData.unlimited_4_month || "0");
            const unlimited5MonthCount = parseInt(invoiceData.unlimited_5_month || "0");
            const unlimited6MonthCount = parseInt(invoiceData.unlimited_6_month || "0");
            
            const pricePerGiB1Month = parseFloat(representative.limitedPrice1Month || "3000");
            const pricePerGiB2Month = parseFloat(representative.limitedPrice2Month || "1800");
            const pricePerGiB3Month = parseFloat(representative.limitedPrice3Month || "1200");
            const pricePerGiB4Month = parseFloat(representative.limitedPrice4Month || "900");
            const pricePerGiB5Month = parseFloat(representative.limitedPrice5Month || "720");
            const pricePerGiB6Month = parseFloat(representative.limitedPrice6Month || "600");
            
            const unlimitedPrice1Month = parseFloat(representative.unlimitedPrice1Month || "40000");
            const unlimitedPrice2Month = parseFloat(representative.unlimitedPrice2Month || "80000");
            const unlimitedPrice3Month = parseFloat(representative.unlimitedPrice3Month || "120000");
            const unlimitedPrice4Month = parseFloat(representative.unlimitedPrice4Month || "160000");
            const unlimitedPrice5Month = parseFloat(representative.unlimitedPrice5Month || "200000");
            const unlimitedPrice6Month = parseFloat(representative.unlimitedPrice6Month || "240000");
            
            const limitedBilling = (limited1MonthVolume * pricePerGiB1Month) +
                                  (limited2MonthVolume * pricePerGiB2Month) +
                                  (limited3MonthVolume * pricePerGiB3Month) +
                                  (limited4MonthVolume * pricePerGiB4Month) +
                                  (limited5MonthVolume * pricePerGiB5Month) +
                                  (limited6MonthVolume * pricePerGiB6Month);
            
            const unlimitedBilling = (unlimited1MonthCount * unlimitedPrice1Month) +
                                    (unlimited2MonthCount * unlimitedPrice2Month) +
                                    (unlimited3MonthCount * unlimitedPrice3Month) +
                                    (unlimited4MonthCount * unlimitedPrice4Month) +
                                    (unlimited5MonthCount * unlimitedPrice5Month) +
                                    (unlimited6MonthCount * unlimitedPrice6Month);
            
            let baseAmount = limitedBilling + unlimitedBilling;

            if (baseAmount > 0) {
              const contentHash = Buffer.from(JSON.stringify(invoiceData)).toString('base64').slice(0, 8);
              const invoiceNumber = `${invoiceData.admin_username}-${contentHash}`;
              
              const existingInvoice = await storage.getInvoiceByNumber(invoiceNumber);
              if (existingInvoice) {
                console.log(`Skipping duplicate invoice: ${invoiceNumber}`);
                continue;
              }
              
              const invoice = await storage.createInvoice({
                invoiceNumber,
                representativeId: representative.id,
                batchId: batch.id,
                totalAmount: baseAmount.toString(),
                baseAmount: baseAmount.toString(),
                status: "pending",
                invoiceData: invoiceData,
                autoCalculated: true,
                priceSource: "representative_rate"
              }, {} as any);

              if (representative.collaboratorId) {
                const collaborator = await storage.getCollaborator(representative.collaboratorId);
                const commissionRate = parseFloat(collaborator?.commissionPercentage || "10.00");
                const commissionAmount = baseAmount * (commissionRate / 100);
                
                await storage.createCommissionRecord({
                  collaboratorId: representative.collaboratorId,
                  representativeId: representative.id,
                  invoiceId: invoice.id,
                  batchId: batch.id,
                  transactionDate: new Date(),
                  revenueType: limitedBilling > 0 ? "limited" : "unlimited",
                  baseRevenueAmount: baseAmount.toString(),
                  commissionRate: commissionRate.toString(),
                  commissionAmount: commissionAmount.toString(),
                  calculationMethod: "automatic"
                });
              }

              processedCount++;
              totalAmount += baseAmount;
            }
          }
        } catch (itemError) {
          console.error('Error processing invoice item:', itemError);
        }
      }

      // Update batch totals
      await db.update(invoiceBatches)
        .set({
          totalInvoices: processedCount,
          totalAmount: totalAmount.toString(),
          processingStatus: "completed"
        })
        .where(eq(invoiceBatches.id, batch.id));

      res.json({
        message: "فایل JSON با موفقیت پردازش شد - کمیسیون‌ها به صورت خودکار محاسبه شدند",
        processed: processedCount,
        totalAmount: totalAmount,
        batchId: batch.id,
        commissionsGenerated: true
      });

    } catch (error) {
      console.error('Error processing JSON file:', error);
      res.status(500).json({ message: "خطا در پردازش فایل JSON" });
    }
  });

  // Generate Invoice with Alpha 35 Configuration Applied
  app.get("/api/invoices/:id/view", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Validate invoice ID
      if (isNaN(invoiceId) || invoiceId <= 0) {
        return res.status(400).json({ message: "شناسه فاکتور نامعتبر است" });
      }
      
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }

      // @ts-ignore
      if (invoice.userId && invoice.userId !== req.session.username) {
        return res.status(403).json({ message: "شما مجاز به دسترسی به این فاکتور نیستید" });
      }

      // For now, we just return the invoice data.
      // In the future, we can generate a styled HTML invoice here.
      res.json(invoice);

    } catch (error) {
      console.error('Error viewing invoice:', error);
      res.status(500).json({ message: "خطا در نمایش فاکتور" });
    }
  });

  return server;
}
