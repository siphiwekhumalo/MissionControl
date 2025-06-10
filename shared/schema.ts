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

// Mission types for intelligence operations
export interface Mission {
  id: number;
  userId: number;
  codename: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'COMPROMISED';
  classification: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  description: string;
  targetLocation?: string;
  estimatedDuration?: number; // in hours
  createdAt: Date;
  updatedAt: Date;
}

// Agent Profile with clearance levels
export interface AgentProfile {
  id: number;
  userId: number;
  agentCode: string;
  clearanceLevel: number; // 1-10, higher = more access
  specializations: string[];
  activeStatus: 'ACTIVE' | 'INACTIVE' | 'DEEP_COVER' | 'COMPROMISED';
  lastSeen: Date;
  missionCount: number;
  successRate: number;
}

// Intelligence Report
export interface IntelReport {
  id: number;
  userId: number;
  missionId?: number;
  reportType: 'SURVEILLANCE' | 'RECONNAISSANCE' | 'COUNTER_INTEL' | 'EXTRACTION';
  threat_level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  location: string;
  summary: string;
  details: string;
  attachments?: string[];
  verified: boolean;
  createdAt: Date;
}

// Secure Communication
export interface SecureMessage {
  id: number;
  senderId: number;
  recipientId: number;
  encryptionLevel: 'BASIC' | 'ADVANCED' | 'QUANTUM';
  subject: string;
  content: string;
  isRead: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

// Equipment Request
export interface Equipment {
  id: number;
  name: string;
  category: 'SURVEILLANCE' | 'COMMUNICATION' | 'WEAPON' | 'VEHICLE' | 'TECH';
  classification: 'STANDARD' | 'RESTRICTED' | 'CLASSIFIED';
  availability: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  description: string;
}

export interface EquipmentRequest {
  id: number;
  userId: number;
  equipmentId: number;
  requestType: 'CHECKOUT' | 'RETURN' | 'MAINTENANCE';
  justification: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED';
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: number;
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
  message: z.string().nullable().optional().transform(val => val || null),
  parentPingId: z.number().nullable().optional(),
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

// Mission validation schemas
export const createMissionSchema = z.object({
  codename: z.string().min(3, "Mission codename must be at least 3 characters"),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  classification: z.enum(['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']),
  description: z.string().min(10, "Mission description must be at least 10 characters"),
  targetLocation: z.string().optional(),
  estimatedDuration: z.number().min(1).max(8760).optional(), // 1 hour to 1 year
});

export const updateMissionSchema = createMissionSchema.extend({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'COMPROMISED']),
}).partial();

// Agent Profile schemas
export const createAgentProfileSchema = z.object({
  agentCode: z.string().min(4, "Agent code must be at least 4 characters"),
  clearanceLevel: z.number().min(1).max(10),
  specializations: z.array(z.string()).min(1, "At least one specialization required"),
  activeStatus: z.enum(['ACTIVE', 'INACTIVE', 'DEEP_COVER', 'COMPROMISED']).default('ACTIVE'),
});

// Intelligence Report schemas
export const createIntelReportSchema = z.object({
  missionId: z.number().optional(),
  reportType: z.enum(['SURVEILLANCE', 'RECONNAISSANCE', 'COUNTER_INTEL', 'EXTRACTION']),
  threat_level: z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED']),
  location: z.string().min(1, "Location is required"),
  summary: z.string().min(5, "Summary must be at least 5 characters"),
  details: z.string().min(10, "Details must be at least 10 characters"),
  attachments: z.array(z.string()).optional(),
});

// Secure Message schemas
export const createSecureMessageSchema = z.object({
  recipientId: z.number(),
  encryptionLevel: z.enum(['BASIC', 'ADVANCED', 'QUANTUM']).default('BASIC'),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
  expiresAt: z.date().optional(),
});

// Equipment Request schemas
export const createEquipmentRequestSchema = z.object({
  equipmentId: z.number(),
  requestType: z.enum(['CHECKOUT', 'RETURN', 'MAINTENANCE']),
  justification: z.string().min(10, "Justification must be at least 10 characters"),
});

export type CreateMission = z.infer<typeof createMissionSchema>;
export type UpdateMission = z.infer<typeof updateMissionSchema>;
export type CreateAgentProfile = z.infer<typeof createAgentProfileSchema>;
export type CreateIntelReport = z.infer<typeof createIntelReportSchema>;
export type CreateSecureMessage = z.infer<typeof createSecureMessageSchema>;
export type CreateEquipmentRequest = z.infer<typeof createEquipmentRequestSchema>;