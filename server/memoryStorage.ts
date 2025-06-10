import { 
  User, CreateUser, UpsertUser, Ping, InsertPing, Mission, CreateMission, UpdateMission,
  AgentProfile, CreateAgentProfile, IntelReport, CreateIntelReport, SecureMessage, CreateSecureMessage,
  Equipment, EquipmentRequest, CreateEquipmentRequest
} from "@shared/schema";
import { IStorage } from "./storage";

// Demo users for testing and display
const demoUsers: User[] = [
  {
    id: 1,
    username: "siphiwe",
    password: "$2b$10$8K1p/a9UOH/cRyHqzrYwn.k1gWsG8D7M/W.K9f9w/0pKd3QJKX2gK", // hashed: 1924@Khumalo
    email: "siphiwe@missioncontrol.dev",
    firstName: "Siphiwe",
    lastName: "Khumalo",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: 2,
    username: "agent007",
    password: "$2b$10$8K1p/a9UOH/cRyHqzrYwn.k1gWsG8D7M/W.K9f9w/0pKd3QJKX2gK", // hashed: secret123
    email: "agent007@missioncontrol.dev",
    firstName: "James",
    lastName: "Bond",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: 3,
    username: "fieldagent",
    password: "$2b$10$8K1p/a9UOH/cRyHqzrYwn.k1gWsG8D7M/W.K9f9w/0pKd3QJKX2gK", // hashed: field123
    email: "field@missioncontrol.dev",
    firstName: "Sarah",
    lastName: "Connor",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
];

// Demo equipment for display
const demoEquipment: Equipment[] = [
  { id: 1, name: "Stealth Communicator", category: "Communication", status: "available", description: "Encrypted short-range radio" },
  { id: 2, name: "Night Vision Goggles", category: "Surveillance", status: "available", description: "Military-grade night vision" },
  { id: 3, name: "Lock Pick Set", category: "Infiltration", status: "in_use", description: "Professional lock picking tools" },
  { id: 4, name: "Drone Camera", category: "Surveillance", status: "available", description: "Micro surveillance drone" }
];

export class MemoryStorage implements IStorage {
  private users: User[] = [...demoUsers];
  private pings: Ping[] = [];
  private missions: Mission[] = [];
  private agentProfiles: AgentProfile[] = [];
  private intelReports: IntelReport[] = [];
  private secureMessages: SecureMessage[] = [];
  private equipment: Equipment[] = [...demoEquipment];
  private equipmentRequests: EquipmentRequest[] = [];
  
  private nextId = 100; // Start IDs from 100 to avoid conflicts

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(userData: CreateUser): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...userData,
      clearanceLevel: userData.clearanceLevel || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.find(u => u.id === userData.id);
    if (existingUser) {
      Object.assign(existingUser, userData, { updatedAt: new Date() });
      return existingUser;
    } else {
      const user: User = {
        id: userData.id || this.nextId++,
        username: userData.username || '',
        password: userData.password || '',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        clearanceLevel: userData.clearanceLevel || 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.push(user);
      return user;
    }
  }

  // Ping operations
  async createPing(pingData: InsertPing & { userId: number }): Promise<Ping> {
    const ping: Ping = {
      id: this.nextId++,
      ...pingData,
      createdAt: new Date()
    };
    this.pings.push(ping);
    return ping;
  }

  async getUserPings(userId: number): Promise<Ping[]> {
    return this.pings.filter(ping => ping.userId === userId);
  }

  async getLatestUserPings(userId: number, limit: number): Promise<Ping[]> {
    return this.pings
      .filter(ping => ping.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    return this.pings.find(ping => ping.id === id);
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: number }): Promise<Ping> {
    const ping: Ping = {
      id: this.nextId++,
      ...pingData,
      parentPingId: parentId,
      createdAt: new Date()
    };
    this.pings.push(ping);
    return ping;
  }

  // Mission operations
  async createMission(missionData: CreateMission & { userId: number }): Promise<Mission> {
    const mission: Mission = {
      id: this.nextId++,
      ...missionData,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.missions.push(mission);
    return mission;
  }

  async getUserMissions(userId: number): Promise<Mission[]> {
    return this.missions.filter(mission => mission.userId === userId);
  }

  async getAllMissions(userClearance: number): Promise<Mission[]> {
    return this.missions.filter(mission => mission.clearanceLevel <= userClearance);
  }

  async getMissionById(id: number): Promise<Mission | undefined> {
    return this.missions.find(mission => mission.id === id);
  }

  async updateMission(id: number, updates: UpdateMission): Promise<Mission | undefined> {
    const mission = this.missions.find(m => m.id === id);
    if (mission) {
      Object.assign(mission, updates, { updatedAt: new Date() });
      return mission;
    }
    return undefined;
  }

  async deleteMission(id: number): Promise<boolean> {
    const index = this.missions.findIndex(m => m.id === id);
    if (index >= 0) {
      this.missions.splice(index, 1);
      return true;
    }
    return false;
  }

  // Agent Profile operations
  async createAgentProfile(profileData: CreateAgentProfile & { userId: number }): Promise<AgentProfile> {
    const profile: AgentProfile = {
      id: this.nextId++,
      ...profileData,
      lastSeen: new Date(),
      missionCount: 0,
      successRate: 100
    };
    this.agentProfiles.push(profile);
    return profile;
  }

  async getAgentProfileByUserId(userId: number): Promise<AgentProfile | undefined> {
    return this.agentProfiles.find(profile => profile.userId === userId);
  }

  async updateAgentProfile(userId: number, updates: Partial<CreateAgentProfile>): Promise<AgentProfile | undefined> {
    const profile = this.agentProfiles.find(p => p.userId === userId);
    if (profile) {
      Object.assign(profile, updates, { lastSeen: new Date() });
      return profile;
    }
    return undefined;
  }

  async getAllAgentProfiles(minClearance: number): Promise<AgentProfile[]> {
    return this.agentProfiles.filter(profile => profile.clearanceLevel >= minClearance);
  }

  // Intelligence Report operations
  async createIntelReport(reportData: CreateIntelReport & { userId: number }): Promise<IntelReport> {
    const report: IntelReport = {
      id: this.nextId++,
      ...reportData,
      verified: false,
      createdAt: new Date()
    };
    this.intelReports.push(report);
    return report;
  }

  async getUserIntelReports(userId: number): Promise<IntelReport[]> {
    return this.intelReports.filter(report => report.userId === userId);
  }

  async getIntelReportsByMission(missionId: number): Promise<IntelReport[]> {
    return this.intelReports.filter(report => report.missionId === missionId);
  }

  async getIntelReportById(id: number): Promise<IntelReport | undefined> {
    return this.intelReports.find(report => report.id === id);
  }

  async verifyIntelReport(id: number): Promise<boolean> {
    const report = this.intelReports.find(r => r.id === id);
    if (report) {
      report.verified = true;
      return true;
    }
    return false;
  }

  // Secure Message operations
  async createSecureMessage(messageData: CreateSecureMessage & { senderId: number }): Promise<SecureMessage> {
    const message: SecureMessage = {
      id: this.nextId++,
      ...messageData,
      isRead: false,
      createdAt: new Date()
    };
    this.secureMessages.push(message);
    return message;
  }

  async getUserMessages(userId: number): Promise<SecureMessage[]> {
    return this.secureMessages.filter(message => 
      message.senderId === userId || message.recipientId === userId
    );
  }

  async getUnreadMessages(userId: number): Promise<SecureMessage[]> {
    return this.secureMessages.filter(message => 
      message.recipientId === userId && !message.isRead
    );
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<boolean> {
    const message = this.secureMessages.find(m => m.id === messageId && m.recipientId === userId);
    if (message) {
      message.isRead = true;
      return true;
    }
    return false;
  }

  async deleteExpiredMessages(): Promise<number> {
    const now = new Date();
    const beforeCount = this.secureMessages.length;
    this.secureMessages = this.secureMessages.filter(message => {
      if (!message.expiresAt) return true;
      return message.expiresAt > now;
    });
    return beforeCount - this.secureMessages.length;
  }

  // Equipment operations
  async getAllEquipment(): Promise<Equipment[]> {
    return [...this.equipment];
  }

  async getAvailableEquipment(category?: string): Promise<Equipment[]> {
    return this.equipment.filter(item => {
      const isAvailable = item.status === 'available';
      const matchesCategory = !category || item.category === category;
      return isAvailable && matchesCategory;
    });
  }

  async createEquipmentRequest(requestData: CreateEquipmentRequest & { userId: number }): Promise<EquipmentRequest> {
    const request: EquipmentRequest = {
      id: this.nextId++,
      ...requestData,
      approvalStatus: 'pending',
      requestedAt: new Date(),
      approvedAt: null,
      approvedBy: null
    };
    this.equipmentRequests.push(request);
    return request;
  }

  async getUserEquipmentRequests(userId: number): Promise<EquipmentRequest[]> {
    return this.equipmentRequests.filter(request => request.userId === userId);
  }

  async approveEquipmentRequest(requestId: number, approverId: number): Promise<boolean> {
    const request = this.equipmentRequests.find(r => r.id === requestId);
    if (request) {
      request.approvalStatus = 'approved';
      request.approvedAt = new Date();
      request.approvedBy = approverId;
      return true;
    }
    return false;
  }

  async denyEquipmentRequest(requestId: number, approverId: number): Promise<boolean> {
    const request = this.equipmentRequests.find(r => r.id === requestId);
    if (request) {
      request.approvalStatus = 'denied';
      request.approvedAt = new Date();
      request.approvedBy = approverId;
      return true;
    }
    return false;
  }
}