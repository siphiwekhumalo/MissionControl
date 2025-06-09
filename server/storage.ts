import {
  type User,
  type CreateUser,
  type Ping,
  type InsertPing,
} from "@shared/schema";

export interface IStorage {
  // User operations for JWT auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  
  // Ping operations
  createPing(ping: InsertPing & { userId: string }): Promise<Ping>;
  getUserPings(userId: string): Promise<Ping[]>;
  getLatestUserPings(userId: string, limit: number): Promise<Ping[]>;
  getPingById(id: number): Promise<Ping | undefined>;
  respondToPing(parentId: number, ping: InsertPing & { userId: string }): Promise<Ping>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, User> = new Map();
  private pings: Map<number, Ping> = new Map();
  private nextUserId = 1;
  private nextPingId = 1;

  // User operations for JWT auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(userData: CreateUser): Promise<User> {
    const userId = (this.nextUserId++).toString();
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
    return user;
  }

  // Ping operations
  async createPing(pingData: InsertPing & { userId: string }): Promise<Ping> {
    const ping: Ping = {
      id: this.nextPingId++,
      userId: pingData.userId,
      latitude: pingData.latitude,
      longitude: pingData.longitude,
      message: pingData.message ?? null,
      parentPingId: null,
      createdAt: new Date(),
    };
    this.pings.set(ping.id, ping);
    return ping;
  }

  async getUserPings(userId: string): Promise<Ping[]> {
    const userPings = Array.from(this.pings.values())
      .filter(ping => ping.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return userPings;
  }

  async getLatestUserPings(userId: string, limit: number): Promise<Ping[]> {
    const userPings = await this.getUserPings(userId);
    return userPings.slice(0, limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    return this.pings.get(id);
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: string }): Promise<Ping> {
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
    return ping;
  }
}

export const storage = new MemStorage();