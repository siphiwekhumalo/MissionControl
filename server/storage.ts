import {
  users,
  pings,
  type User,
  type CreateUser,
  type Ping,
  type InsertPing,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations for JWT auth
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

  // Ping operations
  async createPing(pingData: InsertPing & { userId: number }): Promise<Ping> {
    const [ping] = await db
      .insert(pings)
      .values({
        userId: pingData.userId,
        latitude: pingData.latitude,
        longitude: pingData.longitude,
        message: pingData.message,
        parentPingId: null,
      })
      .returning();
    return ping;
  }

  async getUserPings(userId: number): Promise<Ping[]> {
    return await db
      .select()
      .from(pings)
      .where(eq(pings.userId, userId))
      .orderBy(pings.createdAt);
  }

  async getLatestUserPings(userId: number, limit: number): Promise<Ping[]> {
    return await db
      .select()
      .from(pings)
      .where(eq(pings.userId, userId))
      .orderBy(pings.createdAt)
      .limit(limit);
  }

  async getPingById(id: number): Promise<Ping | undefined> {
    const [ping] = await db.select().from(pings).where(eq(pings.id, id));
    return ping || undefined;
  }

  async respondToPing(parentId: number, pingData: InsertPing & { userId: number }): Promise<Ping> {
    const [ping] = await db
      .insert(pings)
      .values({
        userId: pingData.userId,
        latitude: pingData.latitude,
        longitude: pingData.longitude,
        message: pingData.message,
        parentPingId: parentId,
      })
      .returning();
    return ping;
  }
}

export const storage = new DatabaseStorage();