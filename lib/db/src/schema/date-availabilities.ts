import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tenants } from "./tenants";

export const dateAvailabilitiesTable = pgTable("date_availabilities", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  selectedDate: text("selected_date").notNull(), // format YYYY-MM-DD
  status: text("status", { enum: ["available", "last_slot", "full_booking"] }).notNull().default("available"),
});

export const insertDateAvailabilitySchema = createInsertSchema(dateAvailabilitiesTable).omit({ id: true });
export type InsertDateAvailability = z.infer<typeof insertDateAvailabilitySchema>;
export type DateAvailability = typeof dateAvailabilitiesTable.$inferSelect;
