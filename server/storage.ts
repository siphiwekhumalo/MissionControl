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
  upsertUser(user: any): Promise<User>;
  
  // Ping operations
  createPing(ping: InsertPing & { userId: number }): Promise<Ping>;
  getUserPings(userId: number): Promise<Ping[]>;
  getLatestUserPings(userId: number, limit: number): Promise<Ping[]>;
  getPingById(id: number): Promise<Ping | undefined>;
  respondToPing(parentId: number, ping: InsertPing & { userId: number }): Promise<Ping>;
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
  nextUserId: number;
  nextPingId: number;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private usersByUsername: Map<string, User> = new Map();
  private pings: Map<number, Ping> = new Map();
  private nextUserId = 1;
  private nextPingId = 1;
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
}

export const storage = new MemStorage();