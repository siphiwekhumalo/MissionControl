import { z } from "zod";

// User types for in-memory storage with file persistence
export interface User {
  id: number;
  username: string;
  email: string | null;
  password: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUser {
  username: string;
  email?: string | null;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
}

// Ping types for in-memory storage
export interface Ping {
  id: number;
  userId: number;
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

// Authentication schemas
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;