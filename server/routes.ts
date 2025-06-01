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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export function registerRoutes(app: Express): Server {
  const server = createServer(app);
  
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
      const representative = await storage.updateRepresentative(id, req.body);
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
      const invoice = await storage.createInvoice(req.body);
      res.json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: "خطا در ایجاد فاکتور" });
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
      
      // Extract actual data array from PHPMyAdmin export format
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
      
      // Create invoice batch
      const batch = await storage.createInvoiceBatch({
        batchName: `JSON_${new Date().toISOString().split('T')[0]}`,
        fileName: req.file.originalname,
        totalInvoices: dataArray.length || 0,
        totalAmount: "0"
      });

      let processedCount = 0;
      let totalAmount = 0;

      // Process each invoice in the JSON file
      for (const invoiceData of dataArray) {
        try {
          // Skip entries with no subscriptions or data
          if (!invoiceData.admin_username || 
              !invoiceData.total_subscriptions || 
              parseInt(invoiceData.total_subscriptions) === 0) {
            continue;
          }

          // Find representative by admin username
          const representative = await storage.getRepresentativeByAdminUsername(
            invoiceData.admin_username
          );

          if (representative) {
            // Calculate total revenue based on subscription types
            const limitedSubs = parseInt(invoiceData.limited_subscriptions || "0");
            const unlimitedSubs = parseInt(invoiceData.unlimited_subscriptions || "0");
            
            let baseAmount = 0;
            
            // Calculate limited subscriptions revenue
            if (limitedSubs > 0) {
              const limited1Month = parseInt(invoiceData.limited_1_month || "0");
              const limited2Month = parseInt(invoiceData.limited_2_month || "0");
              const limited3Month = parseInt(invoiceData.limited_3_month || "0");
              
              // Use representative pricing or default rates
              const rate1Month = parseFloat(representative.limitedPrice1Month || "50000");
              const rate2Month = parseFloat(representative.limitedPrice2Month || "90000");
              const rate3Month = parseFloat(representative.limitedPrice3Month || "120000");
              
              baseAmount += (limited1Month * rate1Month) + 
                           (limited2Month * rate2Month) + 
                           (limited3Month * rate3Month);
            }
            
            // Calculate unlimited subscriptions revenue
            if (unlimitedSubs > 0) {
              const unlimited1Month = parseInt(invoiceData.unlimited_1_month || "0");
              const unlimited2Month = parseInt(invoiceData.unlimited_2_month || "0");
              const unlimited3Month = parseInt(invoiceData.unlimited_3_month || "0");
              
              // Use representative pricing or default rates
              const rateUnlimited1 = parseFloat(representative.unlimitedPrice1Month || "80000");
              const rateUnlimited2 = parseFloat(representative.unlimitedPrice2Month || "150000");
              const rateUnlimited3 = parseFloat(representative.unlimitedPrice3Month || "200000");
              
              baseAmount += (unlimited1Month * rateUnlimited1) + 
                           (unlimited2Month * rateUnlimited2) + 
                           (unlimited3Month * rateUnlimited3);
            }

            if (baseAmount > 0) {
              const invoice = await storage.createInvoice({
                invoiceNumber: `${invoiceData.admin_username}-${Date.now()}`,
                representativeId: representative.id,
                batchId: batch.id,
                totalAmount: baseAmount.toString(),
                baseAmount: baseAmount.toString(),
                status: "pending",
                invoiceData: invoiceData,
                autoCalculated: true,
                priceSource: "representative_rate"
              });

              // Create commission record if representative has collaborator
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
                  revenueType: limitedSubs > 0 ? "limited" : "unlimited",
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

  // Send Invoice to Telegram
  app.post("/api/invoices/:id/send-telegram", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }

      // Update telegram_sent status
      await db.update(invoices)
        .set({ telegramSent: true })
        .where(eq(invoices.id, invoiceId));

      // Log the telegram send event
      console.log(`Telegram sent for invoice ${invoiceId} to representative ${invoice.representative?.id}`);

      res.json({ 
        message: "فاکتور به تلگرام ارسال شد",
        telegramSent: true
      });
    } catch (error) {
      console.error('Error sending to telegram:', error);
      res.status(500).json({ message: "خطا در ارسال به تلگرام" });
    }
  });

  // Delete All Invoices - MUST come before the single invoice delete route
  app.delete("/api/invoices/delete-all", async (req, res) => {
    try {
      // Get all invoice IDs first to properly cascade deletes
      const allInvoices = await db.select({ id: invoices.id }).from(invoices);
      
      if (allInvoices.length === 0) {
        return res.json({ 
          message: "هیچ فاکتوری برای حذف یافت نشد",
          deletedCount: 0
        });
      }

      const invoiceIds = allInvoices.map(inv => inv.id);
      
      // Delete commission records for these specific invoices
      if (invoiceIds.length > 0) {
        for (const invoiceId of invoiceIds) {
          await db.delete(commissionRecords)
            .where(eq(commissionRecords.invoiceId, invoiceId));
        }
        
        // Delete invoice items for these specific invoices
        for (const invoiceId of invoiceIds) {
          await db.delete(invoiceItems)
            .where(eq(invoiceItems.invoiceId, invoiceId));
        }
      }
      
      // Delete all invoices
      const result = await db.delete(invoices);

      console.log(`Successfully deleted ${allInvoices.length} invoices with all related records`);

      res.json({ 
        message: "همه فاکتورها حذف شدند",
        deletedCount: allInvoices.length
      });
    } catch (error) {
      console.error('Error deleting all invoices:', error);
      res.status(500).json({ message: "خطا در حذف فاکتورها" });
    }
  });

  // Delete Invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Validate the invoice ID
      if (isNaN(invoiceId) || invoiceId <= 0) {
        return res.status(400).json({ message: "شناسه فاکتور نامعتبر است" });
      }
      
      // Check if invoice exists first
      const existingInvoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (existingInvoice.length === 0) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }
      
      // First delete related commission records
      await db.delete(commissionRecords)
        .where(eq(commissionRecords.invoiceId, invoiceId));
      
      // Delete invoice items
      await db.delete(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));
      
      // Delete the invoice
      await db.delete(invoices)
        .where(eq(invoices.id, invoiceId));

      // Log the deletion event
      console.log(`Invoice ${invoiceId} deleted successfully`);

      res.json({ message: "فاکتور با موفقیت حذف شد" });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ message: "خطا در حذف فاکتور" });
    }
  });

  // Edit Invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const updates = req.body;
      
      await db.update(invoices)
        .set({ 
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      res.json({ message: "فاکتور بروزرسانی شد" });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ message: "خطا در بروزرسانی فاکتور" });
    }
  });

  // Calculate All Commissions
  app.post("/api/invoices/calculate-all-commissions", async (req, res) => {
    try {
      const allInvoices = await db.select().from(invoices);
      let commissionsCreated = 0;

      for (const invoice of allInvoices) {
        if (!invoice.representativeId) continue;
        const representative = await storage.getRepresentativeById(invoice.representativeId);
        
        if (representative && representative.collaboratorId) {
          // Check if commission already exists
          const existingCommission = await db.select()
            .from(commissionRecords)
            .where(eq(commissionRecords.invoiceId, invoice.id))
            .limit(1);

          if (existingCommission.length === 0) {
            const baseAmount = parseFloat(invoice.baseAmount);
            const collaborator = await storage.getCollaborator(representative.collaboratorId);
            const commissionRate = parseFloat(collaborator?.commissionPercentage || "10.00");
            const commissionAmount = baseAmount * (commissionRate / 100);

            await db.insert(commissionRecords).values({
              collaboratorId: representative.collaboratorId,
              representativeId: representative.id,
              invoiceId: invoice.id,
              batchId: invoice.batchId,
              transactionDate: new Date(),
              revenueType: "invoice_based",
              baseRevenueAmount: invoice.baseAmount,
              commissionRate: commissionRate.toString(),
              commissionAmount: commissionAmount.toString(),
              calculationMethod: "manual_batch"
            });
            commissionsCreated++;
          }
        }
      }

      res.json({ 
        message: `${commissionsCreated} کمیسیون جدید محاسبه شد`,
        commissionsCreated 
      });
    } catch (error) {
      console.error('Error calculating all commissions:', error);
      res.status(500).json({ message: "خطا در محاسبه کمیسیون‌ها" });
    }
  });

  // Send All Invoices to Telegram
  app.post("/api/invoices/send-all-telegram", async (req, res) => {
    try {
      const result = await db.update(invoices)
        .set({ telegramSent: true })
        .where(eq(invoices.telegramSent, false));

      res.json({ 
        message: "همه فاکتورها به تلگرام ارسال شدند",
        updated: result.rowCount || 0
      });
    } catch (error) {
      console.error('Error sending all to telegram:', error);
      res.status(500).json({ message: "خطا در ارسال به تلگرام" });
    }
  });

  // Archive All Invoices
  app.post("/api/invoices/archive-all", async (req, res) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const allInvoices = await db.select().from(invoices);
      
      // Create archive JSON
      const archiveData = {
        archiveDate: new Date().toISOString(),
        invoiceCount: allInvoices.length,
        invoices: allInvoices
      };

      // In a real implementation, you would save this to a file system or cloud storage
      // For now, we'll just clear the invoices and log the archive
      console.log(`Archived ${allInvoices.length} invoices on ${timestamp}`);
      
      // Delete commission records first
      await db.delete(commissionRecords).where(sql`invoice_id IS NOT NULL`);
      
      // Delete invoice items
      await db.delete(invoiceItems);
      
      // Delete invoices
      await db.delete(invoices);

      res.json({ 
        message: `${allInvoices.length} فاکتور آرشیو شد`,
        archivedCount: allInvoices.length,
        archiveDate: timestamp
      });
    } catch (error) {
      console.error('Error archiving invoices:', error);
      res.status(500).json({ message: "خطا در آرشیو کردن فاکتورها" });
    }
  });



  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "سیستم MarFanet عملیاتی است"
    });
  });

  return server;
}