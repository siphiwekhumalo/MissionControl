import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./simpleStorage";
import { authenticate, hashPassword, verifyPassword, generateToken, type AuthRequest } from "./auth";
import { 
  registerSchema, 
  loginSchema, 
  insertPingSchema,
  createMissionSchema,
  updateMissionSchema,
  createAgentProfileSchema,
  createIntelReportSchema,
  createSecureMessageSchema,
  createEquipmentRequestSchema
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
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
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
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        message: validation.data.message,
        parentPingId: validation.data.parentPingId,
        userId: req.userId!,
      });

      // Security audit log for new transmissions
      console.log(`[SECURITY] Agent ${req.userId} created transmission #${ping.id} at coordinates [${ping.latitude}, ${ping.longitude}] - ${new Date().toISOString()}`);

      res.status(201).json(ping);
    } catch (error) {
      console.error("Create ping error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/pings', authenticate, async (req: AuthRequest, res) => {
    try {
      res.set('Cache-Control', 'private, max-age=60'); // Private cache for security
      const pings = await storage.getUserPings(req.userId!);
      
      // Security audit log
      console.log(`[SECURITY] Agent ${req.userId} accessed ${pings.length} transmissions at ${new Date().toISOString()}`);
      
      res.json(pings);
    } catch (error) {
      console.error("Get pings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/pings/latest', authenticate, async (req: AuthRequest, res) => {
    try {
      // Security headers for classified transmissions
      res.set({
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });
      
      const pings = await storage.getLatestUserPings(req.userId!, 3);
      
      // Security audit log
      console.log(`[SECURITY] Agent ${req.userId} accessed latest transmissions at ${new Date().toISOString()}`);
      
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

      // Verify parent ping exists and belongs to current user
      const parentPing = await storage.getPingById(pingId);
      if (!parentPing) {
        return res.status(404).json({ message: "Parent ping not found" });
      }
      
      // Security: Ensure user can only respond to their own pings
      if (parentPing.userId !== req.userId!) {
        return res.status(403).json({ message: "Access denied: Cannot respond to another agent's transmission" });
      }

      const ping = await storage.respondToPing(pingId, {
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        message: validation.data.message,
        parentPingId: validation.data.parentPingId,
        userId: req.userId!,
      });

      // Security audit log for trail responses
      console.log(`[SECURITY] Agent ${req.userId} responded to transmission #${pingId} with new transmission #${ping.id} - ${new Date().toISOString()}`);

      res.status(201).json(ping);
    } catch (error) {
      console.error("Respond to ping error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mission Management Routes
  app.post('/api/missions', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = createMissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid mission data", 
          errors: validation.error.errors 
        });
      }

      const mission = await storage.createMission({
        ...validation.data,
        userId: req.userId!,
      });

      console.log(`[SECURITY] Agent ${req.userId} created new mission: ${mission.codename} [${mission.classification}]`);
      res.status(201).json(mission);
    } catch (error) {
      console.error("Create mission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/missions', authenticate, async (req: AuthRequest, res) => {
    try {
      // Get user's clearance level from agent profile
      const agentProfile = await storage.getAgentProfileByUserId(req.userId!);
      const clearanceLevel = agentProfile?.clearanceLevel || 1;
      
      const missions = await storage.getAllMissions(clearanceLevel);
      console.log(`[SECURITY] Agent ${req.userId} accessed ${missions.length} missions with clearance ${clearanceLevel}`);
      res.json(missions);
    } catch (error) {
      console.error("Get missions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/missions/my', authenticate, async (req: AuthRequest, res) => {
    try {
      const missions = await storage.getUserMissions(req.userId!);
      res.json(missions);
    } catch (error) {
      console.error("Get user missions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/missions/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const mission = await storage.getMissionById(missionId);
      
      if (!mission) {
        return res.status(404).json({ message: "Mission not found" });
      }

      // Check clearance level
      const agentProfile = await storage.getAgentProfileByUserId(req.userId!);
      const clearanceLevel = agentProfile?.clearanceLevel || 1;
      const clearanceMap = { 'UNCLASSIFIED': 1, 'CONFIDENTIAL': 5, 'SECRET': 7, 'TOP_SECRET': 10 };
      
      if (clearanceMap[mission.classification] > clearanceLevel) {
        return res.status(403).json({ message: "Insufficient clearance level" });
      }

      res.json(mission);
    } catch (error) {
      console.error("Get mission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/missions/:id', authenticate, async (req: AuthRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const validation = updateMissionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: validation.error.errors 
        });
      }

      const mission = await storage.updateMission(missionId, validation.data);
      if (!mission) {
        return res.status(404).json({ message: "Mission not found" });
      }

      console.log(`[SECURITY] Agent ${req.userId} updated mission #${missionId}: ${mission.codename}`);
      res.json(mission);
    } catch (error) {
      console.error("Update mission error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent Profile Routes
  app.post('/api/agent-profile', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = createAgentProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid agent profile data", 
          errors: validation.error.errors 
        });
      }

      const profile = await storage.createAgentProfile({
        ...validation.data,
        userId: req.userId!,
      });

      console.log(`[SECURITY] Agent profile created: ${profile.agentCode} with clearance ${profile.clearanceLevel}`);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Create agent profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/agent-profile', authenticate, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.getAgentProfileByUserId(req.userId!);
      if (!profile) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Get agent profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/agent-profile', authenticate, async (req: AuthRequest, res) => {
    try {
      const profile = await storage.updateAgentProfile(req.userId!, req.body);
      if (!profile) {
        return res.status(404).json({ message: "Agent profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Update agent profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/agents', authenticate, async (req: AuthRequest, res) => {
    try {
      const agentProfile = await storage.getAgentProfileByUserId(req.userId!);
      const minClearance = agentProfile?.clearanceLevel || 1;
      
      const agents = await storage.getAllAgentProfiles(minClearance);
      res.json(agents);
    } catch (error) {
      console.error("Get agents error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Intelligence Report Routes
  app.post('/api/intel-reports', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = createIntelReportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid intelligence report data", 
          errors: validation.error.errors 
        });
      }

      const report = await storage.createIntelReport({
        ...validation.data,
        userId: req.userId!,
      });

      console.log(`[SECURITY] Agent ${req.userId} submitted ${report.reportType} intel report - Threat Level: ${report.threat_level}`);
      res.status(201).json(report);
    } catch (error) {
      console.error("Create intel report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/intel-reports', authenticate, async (req: AuthRequest, res) => {
    try {
      const reports = await storage.getUserIntelReports(req.userId!);
      res.json(reports);
    } catch (error) {
      console.error("Get intel reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/intel-reports/mission/:missionId', authenticate, async (req: AuthRequest, res) => {
    try {
      const missionId = parseInt(req.params.missionId);
      const reports = await storage.getIntelReportsByMission(missionId);
      res.json(reports);
    } catch (error) {
      console.error("Get mission intel reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/intel-reports/:id/verify', authenticate, async (req: AuthRequest, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const verified = await storage.verifyIntelReport(reportId);
      
      if (!verified) {
        return res.status(404).json({ message: "Intel report not found" });
      }

      console.log(`[SECURITY] Agent ${req.userId} verified intel report #${reportId}`);
      res.json({ message: "Intel report verified successfully" });
    } catch (error) {
      console.error("Verify intel report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Secure Messaging Routes
  app.post('/api/messages', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = createSecureMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: validation.error.errors 
        });
      }

      const message = await storage.createSecureMessage({
        ...validation.data,
        senderId: req.userId!,
      });

      console.log(`[SECURITY] Agent ${req.userId} sent ${message.encryptionLevel} encrypted message to Agent ${message.recipientId}`);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/messages', authenticate, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getUserMessages(req.userId!);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/messages/unread', authenticate, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getUnreadMessages(req.userId!);
      res.json(messages);
    } catch (error) {
      console.error("Get unread messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/messages/:id/read', authenticate, async (req: AuthRequest, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const marked = await storage.markMessageAsRead(messageId, req.userId!);
      
      if (!marked) {
        return res.status(404).json({ message: "Message not found or not authorized" });
      }

      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Equipment Management Routes
  app.get('/api/equipment', authenticate, async (req: AuthRequest, res) => {
    try {
      const { category } = req.query;
      const equipment = category 
        ? await storage.getAvailableEquipment(category as string)
        : await storage.getAllEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Get equipment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/equipment-requests', authenticate, async (req: AuthRequest, res) => {
    try {
      const validation = createEquipmentRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid equipment request data", 
          errors: validation.error.errors 
        });
      }

      const request = await storage.createEquipmentRequest({
        ...validation.data,
        userId: req.userId!,
      });

      console.log(`[SECURITY] Agent ${req.userId} requested equipment #${request.equipmentId} - ${request.requestType}`);
      res.status(201).json(request);
    } catch (error) {
      console.error("Create equipment request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/equipment-requests', authenticate, async (req: AuthRequest, res) => {
    try {
      const requests = await storage.getUserEquipmentRequests(req.userId!);
      res.json(requests);
    } catch (error) {
      console.error("Get equipment requests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/equipment-requests/:id/approve', authenticate, async (req: AuthRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const approved = await storage.approveEquipmentRequest(requestId, req.userId!);
      
      if (!approved) {
        return res.status(404).json({ message: "Equipment request not found or already processed" });
      }

      console.log(`[SECURITY] Agent ${req.userId} approved equipment request #${requestId}`);
      res.json({ message: "Equipment request approved" });
    } catch (error) {
      console.error("Approve equipment request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/equipment-requests/:id/deny', authenticate, async (req: AuthRequest, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const denied = await storage.denyEquipmentRequest(requestId, req.userId!);
      
      if (!denied) {
        return res.status(404).json({ message: "Equipment request not found or already processed" });
      }

      console.log(`[SECURITY] Agent ${req.userId} denied equipment request #${requestId}`);
      res.json({ message: "Equipment request denied" });
    } catch (error) {
      console.error("Deny equipment request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}