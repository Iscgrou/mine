import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { toJSON } from "flatted";
import { representatives, collaborators, invoices, invoiceBatches, invoiceItems, commissionRecords, settings, statisticsCache, crm } from "@shared/schema";

export function registerBackupRoutes(app: Express) {
  // Backup and Restore Endpoints
  app.get("/api/backup", async (req, res) => {
    try {
      const backupData = {
        representatives: await db.select().from(representatives),
        collaborators: await db.select().from(collaborators),
        invoices: await db.select().from(invoices),
        invoiceBatches: await db.select().from(invoiceBatches),
        invoiceItems: await db.select().from(invoiceItems),
        commissionRecords: await db.select().from(commissionRecords),
        settings: await db.select().from(settings),
        statisticsCache: await db.select().from(statisticsCache),
        crm: await db.select().from(crm),
      };
      
      res.setHeader('Content-Disposition', `attachment; filename=marfanet-backup-${new Date().toISOString()}.json`);
      res.setHeader('Content-Type', 'application/json');
      res.send(toJSON(backupData));
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ message: "خطا در ایجاد پشتیبان" });
    }
  });

  app.post("/api/restore", async (req, res) => {
    try {
      const data = req.body;
      
      // Clear existing data
      await db.delete(crm);
      await db.delete(statisticsCache);
      await db.delete(settings);
      await db.delete(commissionRecords);
      await db.delete(invoiceItems);
      await db.delete(invoiceBatches);
      await db.delete(invoices);
      await db.delete(collaborators);
      await db.delete(representatives);

      // Restore data
      if (data.representatives) await db.insert(representatives).values(data.representatives);
      if (data.collaborators) await db.insert(collaborators).values(data.collaborators);
      if (data.invoices) await db.insert(invoices).values(data.invoices);
      if (data.invoiceBatches) await db.insert(invoiceBatches).values(data.invoiceBatches);
      if (data.invoiceItems) await db.insert(invoiceItems).values(data.invoiceItems);
      if (data.commissionRecords) await db.insert(commissionRecords).values(data.commissionRecords);
      if (data.settings) await db.insert(settings).values(data.settings);
      if (data.statisticsCache) await db.insert(statisticsCache).values(data.statisticsCache);
      if (data.crm) await db.insert(crm).values(data.crm);

      res.json({ message: "اطلاعات با موفقیت بازیابی شد" });
    } catch (error) {
      console.error('Error restoring data:', error);
      res.status(500).json({ message: "خطا در بازیابی اطلاعات" });
    }
  });
}
