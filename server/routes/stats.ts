import type { Express } from "express";
import { storage } from "../storage";

export function registerStatsRoutes(app: Express) {
  // Stats Endpoints
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "خطا در دریافت آمار" });
    }
  });

  app.post("/api/stats/update", async (req, res) => {
    try {
      const { key, value, dataType } = req.body;
      await storage.updateStatistic(key, value, dataType);
      res.json({ message: "آمار بروزرسانی شد" });
    } catch (error) {
      console.error('Error updating statistic:', error);
      res.status(500).json({ message: "خطا در بروزرسانی آمار" });
    }
  });
}
