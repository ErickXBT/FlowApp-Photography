import { boolean, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
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
  
  // New project configuration fields
  googleDriveLink: text("google_drive_link"),
  detectSubfolder: boolean("detect_subfolder").notNull().default(false),
  whatsappClient: text("whatsapp_client"),
  whatsappAdmin: text("whatsapp_admin"),
  maxPhotos: integer("max_photos").notNull().default(5),
  pilihFotoEnabled: boolean("pilih_foto_enabled").notNull().default(true),
  downloadFotoEnabled: boolean("download_foto_enabled").notNull().default(true),
  pilihFotoDuration: text("pilih_foto_duration").notNull().default("Selamanya"),
  downloadFotoDuration: text("download_foto_duration").notNull().default("Selamanya"),
  pilihFotoPassword: text("pilih_foto_password"),
  downloadFotoPassword: text("download_foto_password"),
  pilihFotoTambahanEnabled: boolean("pilih_foto_tambahan_enabled").notNull().default(false),
  pilihFotoCetakEnabled: boolean("pilih_foto_cetak_enabled").notNull().default(false),
  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
