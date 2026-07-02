import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["super_admin", "vendor"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("vendor"),
  tenantId: serial("tenant_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
