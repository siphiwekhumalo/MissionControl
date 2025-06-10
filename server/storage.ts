import {
  users,
  missions,
  agentProfiles,
  intelReports,
  secureMessages,
  equipment,
  equipmentRequests,
  pings,
  type User,
  type CreateUser,
  type UpsertUser,
  type Ping,
  type InsertPing,
  type Mission,
  type CreateMission,
  type UpdateMission,
  type AgentProfile,
  type CreateAgentProfile,
  type IntelReport,
  type CreateIntelReport,
  type SecureMessage,
  type CreateSecureMessage,
  type Equipment,
  type EquipmentRequest,
  type CreateEquipmentRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, or } from "drizzle-orm";

export interface IStorage {
  // User operations for JWT auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Ping operations
  createPing(ping: InsertPing & { userId: number }): Promise<Ping>;
  getUserPings(userId: number): Promise<Ping[]>;
  getLatestUserPings(userId: number, limit: number): Promise<Ping[]>;
  getPingById(id: number): Promise<Ping | undefined>;
  respondToPing(parentId: number, ping: InsertPing & { userId: number }): Promise<Ping>;

  // Mission operations
  createMission(mission: CreateMission & { userId: number }): Promise<Mission>;
  getUserMissions(userId: number): Promise<Mission[]>;
  getAllMissions(userClearance: number): Promise<Mission[]>;
  getMissionById(id: number): Promise<Mission | undefined>;
  updateMission(id: number, updates: UpdateMission): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<boolean>;

  // Agent Profile operations
  createAgentProfile(profile: CreateAgentProfile & { userId: number }): Promise<AgentProfile>;
  getAgentProfileByUserId(userId: number): Promise<AgentProfile | undefined>;
  updateAgentProfile(userId: number, updates: Partial<CreateAgentProfile>): Promise<AgentProfile | undefined>;
  getAllAgentProfiles(minClearance: number): Promise<AgentProfile[]>;

  // Intelligence Report operations
  createIntelReport(report: CreateIntelReport & { userId: number }): Promise<IntelReport>;
  getUserIntelReports(userId: number): Promise<IntelReport[]>;
  getIntelReportsByMission(missionId: number): Promise<IntelReport[]>;
  getIntelReportById(id: number): Promise<IntelReport | undefined>;
  verifyIntelReport(id: number): Promise<boolean>;

  // Secure Message operations
  createSecureMessage(message: CreateSecureMessage & { senderId: number }): Promise<SecureMessage>;
  getUserMessages(userId: number): Promise<SecureMessage[]>;
  getUnreadMessages(userId: number): Promise<SecureMessage[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<boolean>;
  deleteExpiredMessages(): Promise<number>;

  // Equipment operations
  getAllEquipment(): Promise<Equipment[]>;
  getAvailableEquipment(category?: string): Promise<Equipment[]>;
  createEquipmentRequest(request: CreateEquipmentRequest & { userId: number }): Promise<EquipmentRequest>;
  getUserEquipmentRequests(userId: number): Promise<EquipmentRequest[]>;
  approveEquipmentRequest(requestId: number, approverId: number): Promise<boolean>;
  denyEquipmentRequest(requestId: number, approverId: number): Promise<boolean>;
}

// Database storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: CreateUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.username,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Ping operations
  async createPing(pingData: InsertPing & { userId: number }): Promise<Ping> {
    const [ping] = await db
      .insert(pings)
      .values(pingData)
      .returning();
    return ping;
  }

  async getUserPings(userId: number): Promise<Ping[]> {
    return await db
      .select()
      .from(pings)
      .where(eq(pings.userId, userId))
      .orderBy(desc(pings.createdAt));
  }

  async getLatestUserPings(userId: number, limit: number): Promise<Ping[]> {
    return await db
      .select()
      .from(pings)
      .where(eq(pings.userId, userId))
      .orderBy(desc(pings.createdAt))
      .limit(limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    const [ping] = await db.select().from(pings).where(eq(pings.id, id));
    return ping || undefined;
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: number }): Promise<Ping> {
    const [ping] = await db
      .insert(pings)
      .values({ ...pingData, parentPingId: parentId })
      .returning();
    return ping;
  }

  // Mission operations
  async createMission(missionData: CreateMission & { userId: number }): Promise<Mission> {
    const [mission] = await db
      .insert(missions)
      .values(missionData)
      .returning();
    return mission;
  }

  async getUserMissions(userId: number): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(eq(missions.userId, userId))
      .orderBy(desc(missions.createdAt));
  }

  async getAllMissions(userClearance: number): Promise<Mission[]> {
    // For now, return all missions - clearance filtering can be implemented with better schema
    return await db
      .select()
      .from(missions)
      .orderBy(desc(missions.createdAt));
  }

  async getMissionById(id: number): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission || undefined;
  }

  async updateMission(id: number, updates: UpdateMission): Promise<Mission | undefined> {
    const [mission] = await db
      .update(missions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    return mission || undefined;
  }

  async deleteMission(id: number): Promise<boolean> {
    const result = await db.delete(missions).where(eq(missions.id, id));
    return result.rowCount > 0;
  }

  // Agent Profile operations
  async createAgentProfile(profileData: CreateAgentProfile & { userId: number }): Promise<AgentProfile> {
    const [profile] = await db
      .insert(agentProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async getAgentProfileByUserId(userId: number): Promise<AgentProfile | undefined> {
    const [profile] = await db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, userId));
    return profile || undefined;
  }

  async updateAgentProfile(userId: number, updates: Partial<CreateAgentProfile>): Promise<AgentProfile | undefined> {
    const [profile] = await db
      .update(agentProfiles)
      .set(updates)
      .where(eq(agentProfiles.userId, userId))
      .returning();
    return profile || undefined;
  }

  async getAllAgentProfiles(minClearance: number): Promise<AgentProfile[]> {
    return await db
      .select()
      .from(agentProfiles)
      .where(gte(agentProfiles.clearanceLevel, minClearance))
      .orderBy(desc(agentProfiles.clearanceLevel));
  }

  // Intelligence Report operations
  async createIntelReport(reportData: CreateIntelReport & { userId: number }): Promise<IntelReport> {
    const [report] = await db
      .insert(intelReports)
      .values(reportData)
      .returning();
    return report;
  }

  async getUserIntelReports(userId: number): Promise<IntelReport[]> {
    return await db
      .select()
      .from(intelReports)
      .where(eq(intelReports.userId, userId))
      .orderBy(desc(intelReports.createdAt));
  }

  async getIntelReportsByMission(missionId: number): Promise<IntelReport[]> {
    return await db
      .select()
      .from(intelReports)
      .where(eq(intelReports.missionId, missionId))
      .orderBy(desc(intelReports.createdAt));
  }

  async getIntelReportById(id: number): Promise<IntelReport | undefined> {
    const [report] = await db.select().from(intelReports).where(eq(intelReports.id, id));
    return report || undefined;
  }

  async verifyIntelReport(id: number): Promise<boolean> {
    const result = await db
      .update(intelReports)
      .set({ verified: true })
      .where(eq(intelReports.id, id));
    return result.rowCount > 0;
  }

  // Secure Message operations
  async createSecureMessage(messageData: CreateSecureMessage & { senderId: number }): Promise<SecureMessage> {
    const [message] = await db
      .insert(secureMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getUserMessages(userId: number): Promise<SecureMessage[]> {
    return await db
      .select()
      .from(secureMessages)
      .where(
        or(
          eq(secureMessages.recipientId, userId),
          eq(secureMessages.senderId, userId)
        )
      )
      .orderBy(desc(secureMessages.createdAt));
  }

  async getUnreadMessages(userId: number): Promise<SecureMessage[]> {
    return await db
      .select()
      .from(secureMessages)
      .where(
        and(
          eq(secureMessages.recipientId, userId),
          eq(secureMessages.isRead, false)
        )
      )
      .orderBy(desc(secureMessages.createdAt));
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<boolean> {
    const result = await db
      .update(secureMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(secureMessages.id, messageId),
          eq(secureMessages.recipientId, userId)
        )
      );
    return result.rowCount > 0;
  }

  async deleteExpiredMessages(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(secureMessages)
      .where(and(
        eq(secureMessages.expiresAt, secureMessages.expiresAt), // Non-null check
        gte(now, secureMessages.expiresAt)
      ));
    return result.rowCount;
  }

  // Equipment operations
  async getAllEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  async getAvailableEquipment(category?: string): Promise<Equipment[]> {
    let query = db.select().from(equipment).where(eq(equipment.availability, 'AVAILABLE'));
    if (category) {
      query = query.where(eq(equipment.category, category as any));
    }
    return await query;
  }

  async createEquipmentRequest(requestData: CreateEquipmentRequest & { userId: number }): Promise<EquipmentRequest> {
    const [request] = await db
      .insert(equipmentRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getUserEquipmentRequests(userId: number): Promise<EquipmentRequest[]> {
    return await db
      .select()
      .from(equipmentRequests)
      .where(eq(equipmentRequests.userId, userId))
      .orderBy(desc(equipmentRequests.requestedAt));
  }

  async approveEquipmentRequest(requestId: number, approverId: number): Promise<boolean> {
    const result = await db
      .update(equipmentRequests)
      .set({
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approverId,
      })
      .where(
        and(
          eq(equipmentRequests.id, requestId),
          eq(equipmentRequests.approvalStatus, 'PENDING')
        )
      );
    return result.rowCount > 0;
  }

  async denyEquipmentRequest(requestId: number, approverId: number): Promise<boolean> {
    const result = await db
      .update(equipmentRequests)
      .set({
        approvalStatus: 'DENIED',
        approvedAt: new Date(),
        approvedBy: approverId,
      })
      .where(
        and(
          eq(equipmentRequests.id, requestId),
          eq(equipmentRequests.approvalStatus, 'PENDING')
        )
      );
    return result.rowCount > 0;
  }
}

// Simple in-memory storage for demo/testing - no database required
class SimpleMemoryStorage implements IStorage {
  private users = new Map<number, User>();
  private usersByUsername = new Map<string, User>();
  private nextUserId = 1;

  constructor() {
    // Add demo users with properly hashed passwords
    this.addDemoUser({
      username: "siphiwe",
      password: "$2b$10$Otqv2rhV.EAqWZE/rOgueufgs825ZQj/ysgzLz.xt.Tz94gb41R8K", // 1924@Khumalo
      email: "siphiwe@missioncontrol.dev",
      firstName: "Siphiwe",
      lastName: "Khumalo"
    });
    
    this.addDemoUser({
      username: "agent007",
      password: "$2b$10$V34.nZcPck23rDXKWFZPyOCrildCs4a6D.CDKGq160Bj8w856x1/W", // secret123
      email: "agent007@missioncontrol.dev", 
      firstName: "James",
      lastName: "Bond"
    });

    this.addDemoUser({
      username: "fieldagent",
      password: "$2b$10$dGVFT/89J.H7qZ3Fg9V5lu49v7YL/mG03rCAiL4cvHTHuzKzMDy.S", // field123
      email: "field@missioncontrol.dev",
      firstName: "Sarah", 
      lastName: "Connor"
    });
  }

  private addDemoUser(userData: { username: string; password: string; email: string; firstName: string; lastName: string }) {
    const user: User = {
      id: this.nextUserId++,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(userData: CreateUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.id && this.users.has(userData.id)) {
      const existing = this.users.get(userData.id)!;
      const updated = { ...existing, ...userData, updatedAt: new Date() };
      this.users.set(updated.id, updated);
      return updated;
    }
    return this.createUser(userData as CreateUser);
  }

  // Stub implementations for other methods (return empty arrays/false for demo)
  async createPing(): Promise<Ping> { throw new Error("Not implemented"); }
  async getUserPings(): Promise<Ping[]> { return []; }
  async getLatestUserPings(): Promise<Ping[]> { return []; }
  async getPingById(): Promise<Ping | undefined> { return undefined; }
  async respondToPing(): Promise<Ping> { throw new Error("Not implemented"); }
  async createMission(): Promise<Mission> { throw new Error("Not implemented"); }
  async getUserMissions(): Promise<Mission[]> { return []; }
  async getAllMissions(): Promise<Mission[]> { return []; }
  async getMissionById(): Promise<Mission | undefined> { return undefined; }
  async updateMission(): Promise<Mission | undefined> { return undefined; }
  async deleteMission(): Promise<boolean> { return false; }
  async createAgentProfile(): Promise<AgentProfile> { throw new Error("Not implemented"); }
  async getAgentProfileByUserId(): Promise<AgentProfile | undefined> { return undefined; }
  async updateAgentProfile(): Promise<AgentProfile | undefined> { return undefined; }
  async getAllAgentProfiles(): Promise<AgentProfile[]> { return []; }
  async createIntelReport(): Promise<IntelReport> { throw new Error("Not implemented"); }
  async getUserIntelReports(): Promise<IntelReport[]> { return []; }
  async getIntelReportsByMission(): Promise<IntelReport[]> { return []; }
  async getIntelReportById(): Promise<IntelReport | undefined> { return undefined; }
  async verifyIntelReport(): Promise<boolean> { return false; }
  async createSecureMessage(): Promise<SecureMessage> { throw new Error("Not implemented"); }
  async getUserMessages(): Promise<SecureMessage[]> { return []; }
  async getUnreadMessages(): Promise<SecureMessage[]> { return []; }
  async markMessageAsRead(): Promise<boolean> { return false; }
  async deleteExpiredMessages(): Promise<number> { return 0; }
  async getAllEquipment(): Promise<Equipment[]> { return []; }
  async getAvailableEquipment(): Promise<Equipment[]> { return []; }
  async createEquipmentRequest(): Promise<EquipmentRequest> { throw new Error("Not implemented"); }
  async getUserEquipmentRequests(): Promise<EquipmentRequest[]> { return []; }
  async approveEquipmentRequest(): Promise<boolean> { return false; }
  async denyEquipmentRequest(): Promise<boolean> { return false; }
}

export const storage = new SimpleMemoryStorage();