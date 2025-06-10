import {
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

// Simple in-memory storage for demo/testing - no database required
export class SimpleMemoryStorage implements IStorage {
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
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
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
      const updated: User = { 
        ...existing, 
        ...userData, 
        updatedAt: new Date(),
        email: userData.email ?? existing.email,
        firstName: userData.firstName ?? existing.firstName,
        lastName: userData.lastName ?? existing.lastName
      };
      this.users.set(updated.id, updated);
      return updated;
    }
    return this.createUser(userData as CreateUser);
  }

  // Stub implementations for other methods (return empty arrays/false for demo)
  async createPing(): Promise<Ping> { throw new Error("Not implemented for demo"); }
  async getUserPings(): Promise<Ping[]> { return []; }
  async getLatestUserPings(): Promise<Ping[]> { return []; }
  async getPingById(): Promise<Ping | undefined> { return undefined; }
  async respondToPing(): Promise<Ping> { throw new Error("Not implemented for demo"); }
  async createMission(): Promise<Mission> { throw new Error("Not implemented for demo"); }
  async getUserMissions(): Promise<Mission[]> { return []; }
  async getAllMissions(): Promise<Mission[]> { return []; }
  async getMissionById(): Promise<Mission | undefined> { return undefined; }
  async updateMission(): Promise<Mission | undefined> { return undefined; }
  async deleteMission(): Promise<boolean> { return false; }
  async createAgentProfile(): Promise<AgentProfile> { throw new Error("Not implemented for demo"); }
  async getAgentProfileByUserId(): Promise<AgentProfile | undefined> { return undefined; }
  async updateAgentProfile(): Promise<AgentProfile | undefined> { return undefined; }
  async getAllAgentProfiles(): Promise<AgentProfile[]> { return []; }
  async createIntelReport(): Promise<IntelReport> { throw new Error("Not implemented for demo"); }
  async getUserIntelReports(): Promise<IntelReport[]> { return []; }
  async getIntelReportsByMission(): Promise<IntelReport[]> { return []; }
  async getIntelReportById(): Promise<IntelReport | undefined> { return undefined; }
  async verifyIntelReport(): Promise<boolean> { return false; }
  async createSecureMessage(): Promise<SecureMessage> { throw new Error("Not implemented for demo"); }
  async getUserMessages(): Promise<SecureMessage[]> { return []; }
  async getUnreadMessages(): Promise<SecureMessage[]> { return []; }
  async markMessageAsRead(): Promise<boolean> { return false; }
  async deleteExpiredMessages(): Promise<number> { return 0; }
  async getAllEquipment(): Promise<Equipment[]> { return []; }
  async getAvailableEquipment(): Promise<Equipment[]> { return []; }
  async createEquipmentRequest(): Promise<EquipmentRequest> { throw new Error("Not implemented for demo"); }
  async getUserEquipmentRequests(): Promise<EquipmentRequest[]> { return []; }
  async approveEquipmentRequest(): Promise<boolean> { return false; }
  async denyEquipmentRequest(): Promise<boolean> { return false; }
}

export const storage = new SimpleMemoryStorage();