import { z } from "zod";

// User types for in-memory storage
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

// Ping types for in-memory storage
export interface Ping {
  id: number;
  userId: string;
  latitude: string;
  longitude: string;
  message: string | null;
  parentPingId: number | null;
  createdAt: Date;
}

// Ping creation schema and types
export const insertPingSchema = z.object({
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  message: z.string().optional().transform(val => val || null),
});

export type InsertPing = z.infer<typeof insertPingSchema>;