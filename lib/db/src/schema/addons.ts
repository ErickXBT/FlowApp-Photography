import { numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const addOnsTable = pgTable("add_ons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAddOnSchema = createInsertSchema(addOnsTable).omit({ id: true, createdAt: true });
export type InsertAddOn = z.infer<typeof insertAddOnSchema>;
export type AddOn = typeof addOnsTable.$inferSelect;
