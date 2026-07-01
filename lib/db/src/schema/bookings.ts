import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable, clientOriginEnum } from "./clients";
import { categoriesTable } from "./categories";
import { packagesTable } from "./packages";

export const bookingStatusEnum = [
  "pending",
  "dp_paid",
  "fully_paid",
  "shooting",
  "editing",
  "delivered",
  "closed",
] as const;
export type BookingStatus = (typeof bookingStatusEnum)[number];

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  packageId: integer("package_id")
    .notNull()
    .references(() => packagesTable.id, { onDelete: "restrict" }),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  mapsLink: text("maps_link"),
  status: text("status", { enum: bookingStatusEnum }).notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  clientOrigin: text("client_origin", { enum: clientOriginEnum }).notNull().default("local"),
  specialRequest: text("special_request"),
  moodboardLinks: text("moodboard_links").array().notNull().default([]),
  teamMemberIds: integer("team_member_ids").array().notNull().default([]),
  addOnIds: integer("add_on_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
