import {
  users,
  pings,
  type User,
  type UpsertUser,
  type Ping,
  type InsertPing,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Ping operations
  createPing(ping: InsertPing & { userId: string }): Promise<Ping>;
  getUserPings(userId: string): Promise<Ping[]>;
  getLatestUserPings(userId: string, limit: number): Promise<Ping[]>;
  getPingById(id: number): Promise<Ping | undefined>;
  respondToPing(parentId: number, ping: InsertPing & { userId: string }): Promise<Ping>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Ping operations
  async createPing(pingData: InsertPing & { userId: string }): Promise<Ping> {
    const [ping] = await db
      .insert(pings)
      .values(pingData)
      .returning();
    return ping;
  }

  async getUserPings(userId: string): Promise<Ping[]> {
    return await db
      .select()
      .from(pings)
      .where(eq(pings.userId, userId))
      .orderBy(desc(pings.createdAt));
  }

  async getLatestUserPings(userId: string, limit: number): Promise<Ping[]> {
    return await db
      .select()
      .from(pings)
      .where(eq(pings.userId, userId))
      .orderBy(desc(pings.createdAt))
      .limit(limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    const [ping] = await db
      .select()
      .from(pings)
      .where(eq(pings.id, id));
    return ping;
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: string }): Promise<Ping> {
    const [ping] = await db
      .insert(pings)
      .values({
        ...pingData,
        parentPingId: parentId,
      })
      .returning();
    return ping;
  }
}

export const storage = new DatabaseStorage();
