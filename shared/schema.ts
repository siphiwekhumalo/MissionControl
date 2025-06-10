import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email"),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mission management
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  codename: varchar("codename").notNull(),
  priority: varchar("priority", { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }).notNull(),
  status: varchar("status", { enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'COMPROMISED'] }).notNull().default('PENDING'),
  classification: varchar("classification", { enum: ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'] }).notNull(),
  description: text("description").notNull(),
  targetLocation: varchar("target_location"),
  estimatedDuration: integer("estimated_duration"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent profiles
export const agentProfiles = pgTable("agent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  agentCode: varchar("agent_code").notNull().unique(),
  clearanceLevel: integer("clearance_level").notNull(),
  specializations: text("specializations").array(),
  activeStatus: varchar("active_status", { enum: ['ACTIVE', 'INACTIVE', 'DEEP_COVER', 'COMPROMISED'] }).notNull().default('ACTIVE'),
  lastSeen: timestamp("last_seen").defaultNow(),
  missionCount: integer("mission_count").notNull().default(0),
  successRate: integer("success_rate").notNull().default(0),
});

// Intelligence reports
export const intelReports = pgTable("intel_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").references(() => missions.id),
  reportType: varchar("report_type", { enum: ['SURVEILLANCE', 'RECONNAISSANCE', 'COUNTER_INTEL', 'EXTRACTION'] }).notNull(),
  threatLevel: varchar("threat_level", { enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'] }).notNull(),
  location: varchar("location").notNull(),
  summary: text("summary").notNull(),
  details: text("details").notNull(),
  attachments: text("attachments").array(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Secure messages
export const secureMessages = pgTable("secure_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  encryptionLevel: varchar("encryption_level", { enum: ['BASIC', 'ADVANCED', 'QUANTUM'] }).notNull().default('BASIC'),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category", { enum: ['SURVEILLANCE', 'COMMUNICATION', 'WEAPON', 'VEHICLE', 'TECH'] }).notNull(),
  classification: varchar("classification", { enum: ['STANDARD', 'RESTRICTED', 'CLASSIFIED'] }).notNull(),
  availability: varchar("availability", { enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE'] }).notNull().default('AVAILABLE'),
  description: text("description").notNull(),
});

// Equipment requests
export const equipmentRequests = pgTable("equipment_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  equipmentId: integer("equipment_id").notNull().references(() => equipment.id),
  requestType: varchar("request_type", { enum: ['CHECKOUT', 'RETURN', 'MAINTENANCE'] }).notNull(),
  justification: text("justification").notNull(),
  approvalStatus: varchar("approval_status", { enum: ['PENDING', 'APPROVED', 'DENIED'] }).notNull().default('PENDING'),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id),
});

// Pings/Transmissions
export const pings = pgTable("pings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  latitude: varchar("latitude").notNull(),
  longitude: varchar("longitude").notNull(),
  message: text("message"),
  parentPingId: integer("parent_ping_id").references(() => pings.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type CreateUser = Omit<typeof users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;

export type Mission = typeof missions.$inferSelect;
export type CreateMission = Omit<typeof missions.$inferInsert, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>;
export type UpdateMission = Partial<CreateMission>;

export type AgentProfile = typeof agentProfiles.$inferSelect;
export type CreateAgentProfile = Omit<typeof agentProfiles.$inferInsert, 'id' | 'userId' | 'lastSeen' | 'missionCount' | 'successRate'>;

export type IntelReport = typeof intelReports.$inferSelect;
export type CreateIntelReport = Omit<typeof intelReports.$inferInsert, 'id' | 'userId' | 'verified' | 'createdAt'>;

export type SecureMessage = typeof secureMessages.$inferSelect;
export type CreateSecureMessage = Omit<typeof secureMessages.$inferInsert, 'id' | 'senderId' | 'isRead' | 'createdAt'>;

export type Equipment = typeof equipment.$inferSelect;

export type EquipmentRequest = typeof equipmentRequests.$inferSelect;
export type CreateEquipmentRequest = Omit<typeof equipmentRequests.$inferInsert, 'id' | 'userId' | 'approvalStatus' | 'requestedAt' | 'approvedAt' | 'approvedBy'>;

export type Ping = typeof pings.$inferSelect;
export type InsertPing = Omit<typeof pings.$inferInsert, 'id' | 'userId' | 'createdAt'>;

// Validation schemas
export const insertPingSchema = createInsertSchema(pings).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const createMissionSchema = createInsertSchema(missions).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMissionSchema = createMissionSchema.extend({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'COMPROMISED']).optional(),
}).partial();

export const createAgentProfileSchema = createInsertSchema(agentProfiles).omit({
  id: true,
  userId: true,
  lastSeen: true,
  missionCount: true,
  successRate: true,
});

export const createIntelReportSchema = createInsertSchema(intelReports).omit({
  id: true,
  userId: true,
  verified: true,
  createdAt: true,
});

export const createSecureMessageSchema = createInsertSchema(secureMessages).omit({
  id: true,
  senderId: true,
  isRead: true,
  createdAt: true,
});

export const createEquipmentRequestSchema = createInsertSchema(equipmentRequests).omit({
  id: true,
  userId: true,
  approvalStatus: true,
  requestedAt: true,
  approvedAt: true,
  approvedBy: true,
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;