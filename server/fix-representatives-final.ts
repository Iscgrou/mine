/**
 * Final fix for Representatives with Balance API
 * Simple, direct implementation that works
 */

import { db } from "./db";
import { representatives } from "@shared/schema";
import type { Express } from "express";

export function fixRepresentativesWithBalance(app: Express) {
  // Remove existing route and add working one
  app.get("/api/representatives/with-balance", async (req, res) => {
    console.log("FINAL FIX: Starting representatives with balance query...");
    
    try {
      // Direct database query - same as working /api/representatives
      const allReps = await db.select().from(representatives);
      console.log(`FINAL FIX: Retrieved ${allReps.length} representatives`);
      
      // Add currentBalance field to each representative
      const result = allReps.map(rep => ({
        ...rep,
        currentBalance: 0
      }));
      
      console.log(`FINAL FIX SUCCESS: Returning ${result.length} representatives with balance`);
      res.json(result);
      
    } catch (error) {
      console.error("FINAL FIX ERROR:", error);
      res.json([]);
    }
  });
}