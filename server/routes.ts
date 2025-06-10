import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./memoryStorage";
import { authenticate, hashPassword, verifyPassword, generateToken, type AuthRequest } from "./auth";
import { 
  registerSchema, 
  loginSchema, 
  insertPingSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for API connectivity testing
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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

      // Generate JWT token
      const token = generateToken(user.id);

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
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

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User info endpoint
  app.get('/api/user', authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Ping/Transmission routes
  app.post('/api/pings', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = insertPingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid ping data", 
          errors: validation.error.errors 
        });
      }

      const ping = await storage.createPing({
        ...validation.data,
        userId: req.userId!
      });

      res.status(201).json(ping);
    } catch (error) {
      console.error("Create ping error:", error);
      res.status(500).json({ message: "Failed to create ping" });
    }
  });

  app.get('/api/pings', authenticate, async (req: AuthRequest, res) => {
    try {
      const pings = await storage.getUserPings(req.userId!);
      res.json(pings);
    } catch (error) {
      console.error("Get pings error:", error);
      res.status(500).json({ message: "Failed to get pings" });
    }
  });

  app.get('/api/pings/latest', authenticate, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const pings = await storage.getLatestUserPings(req.userId!, limit);
      res.json(pings);
    } catch (error) {
      console.error("Get latest pings error:", error);
      res.status(500).json({ message: "Failed to get latest pings" });
    }
  });

  app.post('/api/pings/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const parentId = parseInt(req.params.id);
      const validation = insertPingSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid ping data", 
          errors: validation.error.errors 
        });
      }

      const ping = await storage.respondToPing(parentId, {
        ...validation.data,
        userId: req.userId!
      });

      res.status(201).json(ping);
    } catch (error) {
      console.error("Respond to ping error:", error);
      res.status(500).json({ message: "Failed to respond to ping" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}