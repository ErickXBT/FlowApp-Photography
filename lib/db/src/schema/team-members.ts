import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teamRoleEnum = ["photographer", "videographer", "mua", "hair_stylist", "editor"] as const;
export type TeamRole = (typeof teamRoleEnum)[number];

export const teamMembersTable = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: teamRoleEnum }).notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  portfolioUrl: text("portfolio_url"),
  whatsapp: text("whatsapp"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembersTable).omit({ id: true, createdAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembersTable.$inferSelect;

export const teamPaymentsTable = pgTable("team_payments", {
  id: serial("id").primaryKey(),
  freelancerName: text("freelancer_name").notNull(),
  role: text("role").notNull(),
  eventsCount: integer("events_count").notNull().default(0),
  ratePerEvent: integer("rate_per_event").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeamPaymentSchema = createInsertSchema(teamPaymentsTable).omit({ id: true, createdAt: true });
export type InsertTeamPayment = z.infer<typeof insertTeamPaymentSchema>;
export type TeamPayment = typeof teamPaymentsTable.$inferSelect;
