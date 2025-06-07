import type { Express } from "express";
import { storage } from "../storage";

export function registerCrmRoutes(app: Express) {
  // CRM Endpoints
  app.get("/api/crm", async (req, res) => {
    try {
      const crmData = await storage.getCRMEvents();
      res.json(crmData);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
      res.status(500).json({ message: "خطا در دریافت اطلاعات CRM" });
    }
  });

  app.post("/api/crm", async (req, res) => {
    try {
      const event = await storage.createCRMEvent(req.body);
      res.json(event);
    } catch (error) {
      console.error('Error creating CRM event:', error);
      res.status(500).json({ message: "خطا در ایجاد رویداد CRM" });
    }
  });
}
