import {
  type User,
  type CreateUser,
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
  upsertUser(user: any): Promise<User>;
  
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

// Persistent storage using JSON files for development
const DATA_DIR = './data';
const USERS_FILE = `${DATA_DIR}/users.json`;
const PINGS_FILE = `${DATA_DIR}/pings.json`;

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

interface StorageData {
  users: User[];
  usersByUsername: Record<string, User>;
  pings: Ping[];
  missions: Mission[];
  agentProfiles: AgentProfile[];
  intelReports: IntelReport[];
  secureMessages: SecureMessage[];
  equipment: Equipment[];
  equipmentRequests: EquipmentRequest[];
  nextUserId: number;
  nextPingId: number;
  nextMissionId: number;
  nextAgentProfileId: number;
  nextIntelReportId: number;
  nextMessageId: number;
  nextEquipmentId: number;
  nextEquipmentRequestId: number;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private usersByUsername: Map<string, User> = new Map();
  private pings: Map<number, Ping> = new Map();
  private missions: Map<number, Mission> = new Map();
  private agentProfiles: Map<number, AgentProfile> = new Map();
  private intelReports: Map<number, IntelReport> = new Map();
  private secureMessages: Map<number, SecureMessage> = new Map();
  private equipment: Map<number, Equipment> = new Map();
  private equipmentRequests: Map<number, EquipmentRequest> = new Map();
  private nextUserId = 1;
  private nextPingId = 1;
  private nextMissionId = 1;
  private nextAgentProfileId = 1;
  private nextIntelReportId = 1;
  private nextMessageId = 1;
  private nextEquipmentId = 1;
  private nextEquipmentRequestId = 1;
  private userPingsCache: Map<number, Ping[]> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (existsSync(USERS_FILE)) {
        const usersData = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
        usersData.users.forEach((user: any) => {
          const userWithDates = {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          };
          this.users.set(user.id, userWithDates);
          this.usersByUsername.set(user.username, userWithDates);
        });
        this.nextUserId = usersData.nextUserId || 1;
      }

      if (existsSync(PINGS_FILE)) {
        const pingsData = JSON.parse(readFileSync(PINGS_FILE, 'utf8'));
        pingsData.pings.forEach((ping: any) => {
          const pingWithDates = {
            ...ping,
            createdAt: new Date(ping.createdAt)
          };
          this.pings.set(ping.id, pingWithDates);
        });
        this.nextPingId = pingsData.nextPingId || 1;
      }
    } catch (error) {
      console.log('Starting with empty storage');
    }
  }

  private saveDataDebounced = this.debounce(() => {
    try {
      const usersData = {
        users: Array.from(this.users.values()),
        nextUserId: this.nextUserId,
      };
      writeFileSync(USERS_FILE, JSON.stringify(usersData));

      const pingsData = {
        pings: Array.from(this.pings.values()),
        nextPingId: this.nextPingId,
      };
      writeFileSync(PINGS_FILE, JSON.stringify(pingsData));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, 1000);

  private saveData() {
    this.saveDataDebounced();
  }

  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // User operations for JWT auth
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(userData: CreateUser): Promise<User> {
    const userId = this.nextUserId++;
    const user: User = {
      id: userId,
      username: userData.username,
      email: userData.email ?? null,
      password: userData.password,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userId, user);
    this.usersByUsername.set(userData.username, user);
    this.saveData();
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    // Check if user exists by ID or username
    let existingUser = userData.id ? this.users.get(userData.id) : null;
    if (!existingUser && userData.username) {
      existingUser = this.usersByUsername.get(userData.username);
    }

    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        email: userData.email ?? existingUser.email,
        firstName: userData.firstName ?? existingUser.firstName,
        lastName: userData.lastName ?? existingUser.lastName,
        updatedAt: new Date(),
      };
      this.users.set(updatedUser.id, updatedUser);
      this.usersByUsername.set(updatedUser.username, updatedUser);
      this.saveData();
      return updatedUser;
    } else {
      // Create new user
      const userId = this.nextUserId++;
      const newUser: User = {
        id: userId,
        username: userData.username || `user_${userId}`,
        email: userData.email ?? null,
        password: userData.password || 'temp_password',
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userId, newUser);
      this.usersByUsername.set(newUser.username, newUser);
      this.saveData();
      return newUser;
    }
  }

  // Ping operations
  async createPing(pingData: InsertPing & { userId: number }): Promise<Ping> {
    const ping: Ping = {
      id: this.nextPingId++,
      userId: pingData.userId,
      latitude: pingData.latitude,
      longitude: pingData.longitude,
      message: pingData.message ?? null,
      parentPingId: pingData.parentPingId ?? null,
      createdAt: new Date(),
    };
    this.pings.set(ping.id, ping);
    this.userPingsCache.delete(pingData.userId); // Invalidate cache
    this.saveData();
    return ping;
  }

  async getUserPings(userId: number): Promise<Ping[]> {
    if (!this.userPingsCache.has(userId)) {
      const userPings = Array.from(this.pings.values())
        .filter(ping => ping.userId === userId)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      this.userPingsCache.set(userId, userPings);
    }
    return this.userPingsCache.get(userId)!;
  }

  async getLatestUserPings(userId: number, limit: number): Promise<Ping[]> {
    const userPings = await this.getUserPings(userId);
    return userPings.slice(0, limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    return this.pings.get(id);
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: number }): Promise<Ping> {
    const ping: Ping = {
      id: this.nextPingId++,
      userId: pingData.userId,
      latitude: pingData.latitude,
      longitude: pingData.longitude,
      message: pingData.message ?? null,
      parentPingId: parentId,
      createdAt: new Date(),
    };
    this.pings.set(ping.id, ping);
    this.saveData();
    return ping;
  }

  // Mission operations
  async createMission(missionData: CreateMission & { userId: number }): Promise<Mission> {
    const mission: Mission = {
      id: this.nextMissionId++,
      userId: missionData.userId,
      codename: missionData.codename,
      priority: missionData.priority,
      status: 'PENDING',
      classification: missionData.classification,
      description: missionData.description,
      targetLocation: missionData.targetLocation,
      estimatedDuration: missionData.estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.missions.set(mission.id, mission);
    this.saveData();
    return mission;
  }

  async getUserMissions(userId: number): Promise<Mission[]> {
    return Array.from(this.missions.values())
      .filter(mission => mission.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllMissions(userClearance: number): Promise<Mission[]> {
    const clearanceMap = { 'UNCLASSIFIED': 1, 'CONFIDENTIAL': 5, 'SECRET': 7, 'TOP_SECRET': 10 };
    return Array.from(this.missions.values())
      .filter(mission => clearanceMap[mission.classification] <= userClearance)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMissionById(id: number): Promise<Mission | undefined> {
    return this.missions.get(id);
  }

  async updateMission(id: number, updates: UpdateMission): Promise<Mission | undefined> {
    const mission = this.missions.get(id);
    if (!mission) return undefined;
    
    const updatedMission = { ...mission, ...updates, updatedAt: new Date() };
    this.missions.set(id, updatedMission);
    this.saveData();
    return updatedMission;
  }

  async deleteMission(id: number): Promise<boolean> {
    const deleted = this.missions.delete(id);
    if (deleted) this.saveData();
    return deleted;
  }

  // Agent Profile operations
  async createAgentProfile(profileData: CreateAgentProfile & { userId: number }): Promise<AgentProfile> {
    const profile: AgentProfile = {
      id: this.nextAgentProfileId++,
      userId: profileData.userId,
      agentCode: profileData.agentCode,
      clearanceLevel: profileData.clearanceLevel,
      specializations: profileData.specializations,
      activeStatus: profileData.activeStatus || 'ACTIVE',
      lastSeen: new Date(),
      missionCount: 0,
      successRate: 0,
    };
    this.agentProfiles.set(profile.id, profile);
    this.saveData();
    return profile;
  }

  async getAgentProfileByUserId(userId: number): Promise<AgentProfile | undefined> {
    return Array.from(this.agentProfiles.values()).find(profile => profile.userId === userId);
  }

  async updateAgentProfile(userId: number, updates: Partial<CreateAgentProfile>): Promise<AgentProfile | undefined> {
    const profile = await this.getAgentProfileByUserId(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...updates };
    this.agentProfiles.set(profile.id, updatedProfile);
    this.saveData();
    return updatedProfile;
  }

  async getAllAgentProfiles(minClearance: number): Promise<AgentProfile[]> {
    return Array.from(this.agentProfiles.values())
      .filter(profile => profile.clearanceLevel >= minClearance)
      .sort((a, b) => b.clearanceLevel - a.clearanceLevel);
  }

  // Intelligence Report operations
  async createIntelReport(reportData: CreateIntelReport & { userId: number }): Promise<IntelReport> {
    const report: IntelReport = {
      id: this.nextIntelReportId++,
      userId: reportData.userId,
      missionId: reportData.missionId,
      reportType: reportData.reportType,
      threat_level: reportData.threat_level,
      location: reportData.location,
      summary: reportData.summary,
      details: reportData.details,
      attachments: reportData.attachments,
      verified: false,
      createdAt: new Date(),
    };
    this.intelReports.set(report.id, report);
    this.saveData();
    return report;
  }

  async getUserIntelReports(userId: number): Promise<IntelReport[]> {
    return Array.from(this.intelReports.values())
      .filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getIntelReportsByMission(missionId: number): Promise<IntelReport[]> {
    return Array.from(this.intelReports.values())
      .filter(report => report.missionId === missionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getIntelReportById(id: number): Promise<IntelReport | undefined> {
    return this.intelReports.get(id);
  }

  async verifyIntelReport(id: number): Promise<boolean> {
    const report = this.intelReports.get(id);
    if (!report) return false;
    
    report.verified = true;
    this.intelReports.set(id, report);
    this.saveData();
    return true;
  }

  // Secure Message operations
  async createSecureMessage(messageData: CreateSecureMessage & { senderId: number }): Promise<SecureMessage> {
    const message: SecureMessage = {
      id: this.nextMessageId++,
      senderId: messageData.senderId,
      recipientId: messageData.recipientId,
      encryptionLevel: messageData.encryptionLevel || 'BASIC',
      subject: messageData.subject,
      content: messageData.content,
      isRead: false,
      expiresAt: messageData.expiresAt,
      createdAt: new Date(),
    };
    this.secureMessages.set(message.id, message);
    this.saveData();
    return message;
  }

  async getUserMessages(userId: number): Promise<SecureMessage[]> {
    return Array.from(this.secureMessages.values())
      .filter(message => message.recipientId === userId || message.senderId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnreadMessages(userId: number): Promise<SecureMessage[]> {
    return Array.from(this.secureMessages.values())
      .filter(message => message.recipientId === userId && !message.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<boolean> {
    const message = this.secureMessages.get(messageId);
    if (!message || message.recipientId !== userId) return false;
    
    message.isRead = true;
    this.secureMessages.set(messageId, message);
    this.saveData();
    return true;
  }

  async deleteExpiredMessages(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;
    
    for (const [id, message] of this.secureMessages.entries()) {
      if (message.expiresAt && message.expiresAt < now) {
        this.secureMessages.delete(id);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) this.saveData();
    return deletedCount;
  }

  // Equipment operations
  async getAllEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAvailableEquipment(category?: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values())
      .filter(equipment => 
        equipment.availability === 'AVAILABLE' && 
        (!category || equipment.category === category)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createEquipmentRequest(requestData: CreateEquipmentRequest & { userId: number }): Promise<EquipmentRequest> {
    const request: EquipmentRequest = {
      id: this.nextEquipmentRequestId++,
      userId: requestData.userId,
      equipmentId: requestData.equipmentId,
      requestType: requestData.requestType,
      justification: requestData.justification,
      approvalStatus: 'PENDING',
      requestedAt: new Date(),
    };
    this.equipmentRequests.set(request.id, request);
    this.saveData();
    return request;
  }

  async getUserEquipmentRequests(userId: number): Promise<EquipmentRequest[]> {
    return Array.from(this.equipmentRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async approveEquipmentRequest(requestId: number, approverId: number): Promise<boolean> {
    const request = this.equipmentRequests.get(requestId);
    if (!request || request.approvalStatus !== 'PENDING') return false;
    
    request.approvalStatus = 'APPROVED';
    request.approvedAt = new Date();
    request.approvedBy = approverId;
    this.equipmentRequests.set(requestId, request);
    this.saveData();
    return true;
  }

  async denyEquipmentRequest(requestId: number, approverId: number): Promise<boolean> {
    const request = this.equipmentRequests.get(requestId);
    if (!request || request.approvalStatus !== 'PENDING') return false;
    
    request.approvalStatus = 'DENIED';
    request.approvedAt = new Date();
    request.approvedBy = approverId;
    this.equipmentRequests.set(requestId, request);
    this.saveData();
    return true;
  }
}

export const storage = new MemStorage();