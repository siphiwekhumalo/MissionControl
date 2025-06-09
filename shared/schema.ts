import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pings = pgTable("pings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
  message: text("message"),
  parentPingId: integer("parent_ping_id").references(() => pings.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  pings: many(pings),
}));

export const pingsRelations = relations(pings, ({ one, many }) => ({
  user: one(users, {
    fields: [pings.userId],
    references: [users.id],
  }),
  parentPing: one(pings, {
    fields: [pings.parentPingId],
    references: [pings.id],
  }),
  responses: many(pings),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertPingSchema = createInsertSchema(pings).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertPing = z.infer<typeof insertPingSchema>;
export type Ping = typeof pings.$inferSelect;
