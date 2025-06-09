import {
  type User,
  type CreateUser,
  type Ping,
  type InsertPing,
} from "@shared/schema";

export interface IStorage {
  // User operations for JWT auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  
  // Ping operations
  createPing(ping: InsertPing & { userId: number }): Promise<Ping>;
  getUserPings(userId: number): Promise<Ping[]>;
  getLatestUserPings(userId: number, limit: number): Promise<Ping[]>;
  getPingById(id: number): Promise<Ping | undefined>;
  respondToPing(parentId: number, ping: InsertPing & { userId: number }): Promise<Ping>;
}

// File-based persistence for user data
class PersistentStorage {
  private filePath = './users.json';
  
  private loadUsers(): Map<number, User> {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const usersArray = JSON.parse(data);
        const users = new Map<number, User>();
        usersArray.forEach((user: User) => {
          users.set(user.id, user);
        });
        return users;
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
    return new Map();
  }
  
  private saveUsers(users: Map<number, User>): void {
    try {
      const fs = require('fs');
      const usersArray = Array.from(users.values());
      fs.writeFileSync(this.filePath, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }
  
  getUsers(): Map<number, User> {
    return this.loadUsers();
  }
  
  saveUser(user: User): void {
    const users = this.loadUsers();
    users.set(user.id, user);
    this.saveUsers(users);
  }
}

export class MemStorage implements IStorage {
  private persistentStorage = new PersistentStorage();
  private users: Map<number, User>;
  private usersByUsername: Map<string, User> = new Map();
  private pings: Map<number, Ping> = new Map();
  private nextUserId = 1;
  private nextPingId = 1;

  constructor() {
    // Load persisted users
    this.users = this.persistentStorage.getUsers();
    
    // Rebuild username index and find next ID
    this.users.forEach((user) => {
      this.usersByUsername.set(user.username, user);
      if (user.id >= this.nextUserId) {
        this.nextUserId = user.id + 1;
      }
    });
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
    
    // Persist to file
    this.persistentStorage.saveUser(user);
    
    return user;
  }

  // Ping operations
  async createPing(pingData: InsertPing & { userId: number }): Promise<Ping> {
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

  async getUserPings(userId: number): Promise<Ping[]> {
    const userPings = Array.from(this.pings.values())
      .filter(ping => ping.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return userPings;
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
    return ping;
  }
}

export const storage = new MemStorage();