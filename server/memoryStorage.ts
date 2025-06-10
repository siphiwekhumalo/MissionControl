import { 
  User, CreateUser, UpsertUser, Ping, InsertPing
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

export class MemoryStorage implements IStorage {
  private users: User[] = [...demoUsers];
  private pings: Ping[] = [];
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
      username: userData.username,
      password: userData.password,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.find(user => 
      userData.id ? user.id === userData.id : user.username === userData.username
    );

    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, {
        ...userData,
        email: userData.email ?? existingUser.email,
        firstName: userData.firstName ?? existingUser.firstName,
        lastName: userData.lastName ?? existingUser.lastName,
        updatedAt: new Date()
      });
      return existingUser;
    } else {
      // Create new user
      const user: User = {
        id: userData.id || this.nextId++,
        username: userData.username,
        password: userData.password,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
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
      userId: pingData.userId,
      latitude: pingData.latitude,
      longitude: pingData.longitude,
      message: pingData.message || null,
      parentPingId: pingData.parentPingId || null,
      createdAt: new Date()
    };
    this.pings.push(ping);
    return ping;
  }

  async getUserPings(userId: number): Promise<Ping[]> {
    return this.pings
      .filter(ping => ping.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getLatestUserPings(userId: number, limit: number): Promise<Ping[]> {
    return this.pings
      .filter(ping => ping.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    return this.pings.find(ping => ping.id === id);
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: number }): Promise<Ping> {
    const ping: Ping = {
      id: this.nextId++,
      userId: pingData.userId,
      latitude: pingData.latitude,
      longitude: pingData.longitude,
      message: pingData.message || null,
      parentPingId: parentId,
      createdAt: new Date()
    };
    this.pings.push(ping);
    return ping;
  }
}

export const storage = new MemoryStorage();