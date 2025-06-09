import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, hashPassword, verifyPassword, generateToken, type AuthRequest } from "./auth";
import { registerSchema, loginSchema, insertPingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }

      const { username, email, password, firstName, lastName } = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email: email || null,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Generate token
      const token = generateToken(user.id);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ 
        token,
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }

      const { username, password } = validation.data;

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("User not found:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      console.log("Verifying password for user:", username);
      console.log("Input password:", password);
      console.log("Stored hash:", user.password);
      console.log("Stored hash length:", user.password.length);
      const isValid = await verifyPassword(password, user.password);
      console.log("Password valid:", isValid);
      if (!isValid) {
        console.log("Password verification failed");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user.id);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        token,
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/user', authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ping routes (protected)
  app.post('/api/pings', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = insertPingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }

      const ping = await storage.createPing({
        ...validation.data,
        userId: req.userId!,
      });

      res.status(201).json(ping);
    } catch (error) {
      console.error("Create ping error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/pings', authenticate, async (req: AuthRequest, res) => {
    try {
      const pings = await storage.getUserPings(req.userId!);
      res.json(pings);
    } catch (error) {
      console.error("Get pings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/pings/latest', authenticate, async (req: AuthRequest, res) => {
    try {
      const pings = await storage.getLatestUserPings(req.userId!, 3);
      res.json(pings);
    } catch (error) {
      console.error("Get latest pings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/pings/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const pingId = parseInt(req.params.id);
      if (isNaN(pingId)) {
        return res.status(400).json({ message: "Invalid ping ID" });
      }

      const validation = insertPingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }

      // Verify parent ping exists
      const parentPing = await storage.getPingById(pingId);
      if (!parentPing) {
        return res.status(404).json({ message: "Parent ping not found" });
      }

      const ping = await storage.respondToPing(pingId, {
        ...validation.data,
        userId: req.userId!,
      });

      res.status(201).json(ping);
    } catch (error) {
      console.error("Respond to ping error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}