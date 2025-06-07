import type { Express } from "express";
import { storage } from "../storage";

export function registerCrmRoutes(app: Express) {
  // CRM Endpoints
  app.get("/api/crm", async (req, res) => {
    res.send("OK");
  });

  app.post("/api/crm", async (req, res) => {
    try {
      const event = await storage.createCrmInteraction(req.body);
      res.json(event);
    } catch (error) {
      console.error('Error creating CRM event:', error);
      res.status(500).json({ message: "خطا در ایجاد رویداد CRM" });
    }
  });
}
