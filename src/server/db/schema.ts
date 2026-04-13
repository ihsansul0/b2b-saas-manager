import { pgTable, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. ENUMS (Strict predefined values)
export const taskStatusEnum = pgEnum("task_status", ["TODO", "IN_PROGRESS", "DONE"]);

// 2. CORE ENTITIES (From Clerk)
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Storing the exact Clerk User ID
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: varchar("id", { length: 255 }).primaryKey(), // Storing the exact Clerk Organization ID
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. DOMAIN ENTITIES (Our App Data)
export const projects = pgTable("projects", {
  id: varchar("id", { length: 255 }).primaryKey(), // We will generate UUIDs/Cuids for these later
  name: varchar("name", { length: 255 }).notNull(),

  // The Tenant ID Pattern
  workspaceId: varchar("workspace_id", { length: 255 })
    .notNull()
    .references(() => workspaces.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  status: taskStatusEnum("status").default("TODO").notNull(),

  // Relational Links
  projectId: varchar("project_id", { length: 255 })
    .notNull()
    .references(() => projects.id),

  // The Tenant ID Pattern (Crucial for B2B Security)
  workspaceId: varchar("workspace_id", { length: 255 })
    .notNull()
    .references(() => workspaces.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});