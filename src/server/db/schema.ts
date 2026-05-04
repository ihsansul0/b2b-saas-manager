import { pgTable, timestamp, varchar, pgEnum, text } from "drizzle-orm/pg-core";

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

  description: text("description"),
  dueDate: timestamp("due_date", { mode: 'date' }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// THE COLLABORATION HUB (Comments)
export const comments = pgTable("comments", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  content: text("content").notNull(), // text() for long messages

  // Relational Links
  taskId: varchar("task_id", { length: 255 })
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }), // If task dies, comments die!

  // Who wrote it? (Tying it to Clerk Auth)
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),

  // The B2B Security Anchor
  workspaceId: varchar("workspace_id", { length: 255 })
    .notNull()
    .references(() => workspaces.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});