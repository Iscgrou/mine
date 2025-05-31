import type { Express } from "express";
import { storage } from "./storage";
import { aegisLogger } from "./aegis-logger";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export function registerRoutes(app: Express): void {
  // Basic routes for system functionality
  
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت آمار" });
    }
  });

  // Representatives endpoints
  app.get("/api/representatives", async (req, res) => {
    try {
      const representatives = await storage.getRepresentatives();
      res.json(representatives);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت نمایندگان" });
    }
  });

  // Invoices endpoint
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت فاکتورها" });
    }
  });

  // JSON import endpoint with new pricing structure
  app.post("/api/import-json", upload.single('jsonFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "فایل JSON آپلود نشده است" });
      }

      const fileImport = await storage.createFileImport({
        fileName: req.file.originalname,
        status: 'processing'
      });

      try {
        const fileContent = req.file.buffer.toString('utf8');
        const jsonData = JSON.parse(fileContent);

        let representativeData;
        if (Array.isArray(jsonData)) {
          const tableObject = jsonData.find(item => 
            item && typeof item === 'object' && item.type === 'table' && Array.isArray(item.data)
          );
          representativeData = tableObject ? tableObject.data : jsonData;
        } else {
          representativeData = jsonData;
        }

        if (!representativeData || representativeData.length === 0) {
          throw new Error('داده‌های نماینده در فایل JSON یافت نشد');
        }

        let recordsProcessed = 0;
        let recordsSkipped = 0;
        const invoicesCreated = [];

        // Create batch for this import
        const batch = await storage.createInvoiceBatch({
          batchName: `JSON Import - ${new Date().toLocaleDateString('fa-IR')}`,
          fileName: req.file.originalname
        });

        for (const adminData of representativeData) {
          if (!adminData.admin_username) {
            recordsSkipped++;
            continue;
          }

          const adminUsername = adminData.admin_username.toString().trim();

          // Check if representative has activity
          const limitedVolumes = [
            parseFloat(adminData.limited_1_month_volume) || 0,
            parseFloat(adminData.limited_2_month_volume) || 0,
            parseFloat(adminData.limited_3_month_volume) || 0,
            parseFloat(adminData.limited_4_month_volume) || 0,
            parseFloat(adminData.limited_5_month_volume) || 0,
            parseFloat(adminData.limited_6_month_volume) || 0
          ];

          const unlimitedCounts = [
            parseInt(adminData.unlimited_1_month) || 0,
            parseInt(adminData.unlimited_2_month) || 0,
            parseInt(adminData.unlimited_3_month) || 0,
            parseInt(adminData.unlimited_4_month) || 0,
            parseInt(adminData.unlimited_5_month) || 0,
            parseInt(adminData.unlimited_6_month) || 0
          ];

          const hasLimited = limitedVolumes.some(vol => vol > 0);
          const hasUnlimited = unlimitedCounts.some(count => count > 0);

          if (!hasLimited && !hasUnlimited) {
            recordsSkipped++;
            continue;
          }

          // Get or create representative with new pricing structure
          let representative = await storage.getRepresentativeByAdminUsername(adminUsername);
          if (!representative) {
            representative = await storage.createRepresentative({
              fullName: adminUsername,
              adminUsername: adminUsername,
              // New default pricing structure as requested
              limitedPrice1Month: "900",
              limitedPrice2Month: "900", 
              limitedPrice3Month: "900",
              limitedPrice4Month: "1400",
              limitedPrice5Month: "1500",
              limitedPrice6Month: "1600",
              unlimitedPrice1Month: "40000",
              unlimitedPrice2Month: "80000",
              unlimitedPrice3Month: "120000",
              unlimitedPrice4Month: "160000",
              unlimitedPrice5Month: "200000",
              unlimitedPrice6Month: "240000"
            });
          }

          // Calculate invoice amount
          let totalAmount = 0;
          const invoiceItems = [];

          // Limited subscriptions (per GB pricing)
          if (hasLimited) {
            const limitedPrices = [
              representative.limitedPrice1Month,
              representative.limitedPrice2Month,
              representative.limitedPrice3Month,
              representative.limitedPrice4Month,
              representative.limitedPrice5Month,
              representative.limitedPrice6Month
            ];

            for (let i = 0; i < 6; i++) {
              const volume = limitedVolumes[i];
              const unitPrice = limitedPrices[i];
              
              if (volume > 0 && unitPrice) {
                const price = parseFloat(unitPrice) * volume;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${i + 1} ماهه حجمی`,
                  quantity: volume.toString(),
                  unitPrice: unitPrice,
                  totalPrice: price.toString(),
                  subscriptionType: 'limited',
                  durationMonths: i + 1
                });
              }
            }
          }

          // Unlimited subscriptions (fixed pricing per subscription)
          if (hasUnlimited) {
            const unlimitedPrices = [
              representative.unlimitedPrice1Month,
              representative.unlimitedPrice2Month,
              representative.unlimitedPrice3Month,
              representative.unlimitedPrice4Month,
              representative.unlimitedPrice5Month,
              representative.unlimitedPrice6Month
            ];

            for (let i = 0; i < 6; i++) {
              const count = unlimitedCounts[i];
              const unitPrice = unlimitedPrices[i];
              
              if (count > 0 && unitPrice) {
                const price = parseFloat(unitPrice) * count;
                totalAmount += price;
                invoiceItems.push({
                  description: `اشتراک ${i + 1} ماهه نامحدود`,
                  quantity: count.toString(),
                  unitPrice: unitPrice,
                  totalPrice: price.toString(),
                  subscriptionType: 'unlimited',
                  durationMonths: i + 1
                });
              }
            }
          }

          if (totalAmount > 0) {
            // Create invoice
            const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
            
            const invoice = await storage.createInvoice({
              invoiceNumber,
              representativeId: representative.id,
              batchId: batch.id,
              totalAmount: totalAmount.toString(),
              invoiceData: {
                items: invoiceItems,
                totalAmount,
                representative: representative.adminUsername
              }
            });

            // Create invoice items
            for (const item of invoiceItems) {
              await storage.createInvoiceItem({
                invoiceId: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                subscriptionType: item.subscriptionType,
                durationMonths: item.durationMonths
              });
            }

            invoicesCreated.push(invoice);
            recordsProcessed++;
          } else {
            recordsSkipped++;
          }
        }

        await storage.updateFileImport(fileImport.id, {
          status: 'completed',
          recordsProcessed,
          recordsSkipped
        });

        res.json({
          message: "فایل JSON با موفقیت پردازش شد",
          recordsProcessed,
          recordsSkipped,
          invoicesCreated: invoicesCreated.length
        });

      } catch (processingError) {
        await storage.updateFileImport(fileImport.id, {
          status: 'failed',
          errorDetails: processingError instanceof Error ? processingError.message : 'خطای نامشخص'
        });

        res.status(400).json({ 
          message: processingError instanceof Error ? processingError.message : 'خطا در پردازش فایل JSON' 
        });
      }

    } catch (error) {
      res.status(500).json({ message: "خطا در آپلود فایل JSON" });
    }
  });

  // System reset endpoint
  app.post("/api/system/reset", async (req, res) => {
    try {
      aegisLogger.critical('API', 'System reset initiated - clearing all data');
      await storage.clearAllData();
      aegisLogger.info('API', 'System reset completed successfully');
      
      res.json({ 
        success: true, 
        message: "سیستم با موفقیت بازنشانی شد",
        warning: "تمام داده‌ها پاک شدند"
      });
    } catch (error) {
      res.status(500).json({ message: "خطا در بازنشانی سیستم" });
    }
  });

  // Events and notifications
  app.get("/api/events", async (req, res) => {
    res.json([]);
  });

  app.get("/api/notifications", async (req, res) => {
    res.json([]);
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    res.json([]);
  });

  app.get("/api/api-keys/status", async (req, res) => {
    res.json({
      telegram: false,
      vertexAI: false,
      textToSpeech: false,
      sentiment: false
    });
  });
}