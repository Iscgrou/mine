import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aegisLogger } from "./aegis-logger";
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