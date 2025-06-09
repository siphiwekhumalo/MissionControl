import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Ping routes
  app.post("/api/pings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pingData = insertPingSchema.parse(req.body);
      
      const ping = await storage.createPing({
        ...pingData,
        userId,
      });
      
      res.json(ping);
    } catch (error) {
      console.error("Error creating ping:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ping data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ping" });
      }
    }
  });

  app.get("/api/pings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pings = await storage.getUserPings(userId);
      res.json(pings);
    } catch (error) {
      console.error("Error fetching pings:", error);
      res.status(500).json({ message: "Failed to fetch pings" });
    }
  });

  app.get("/api/pings/latest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pings = await storage.getLatestUserPings(userId, 3);
      res.json(pings);
    } catch (error) {
      console.error("Error fetching latest pings:", error);
      res.status(500).json({ message: "Failed to fetch latest pings" });
    }
  });

  app.post("/api/pings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parentId = parseInt(req.params.id);
      const pingData = insertPingSchema.parse(req.body);
      
      // Verify the parent ping exists and belongs to the user
      const parentPing = await storage.getPingById(parentId);
      if (!parentPing || parentPing.userId !== userId) {
        return res.status(404).json({ message: "Parent ping not found" });
      }
      
      const ping = await storage.respondToPing(parentId, {
        ...pingData,
        userId,
      });
      
      res.json(ping);
    } catch (error) {
      console.error("Error responding to ping:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ping data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to respond to ping" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
