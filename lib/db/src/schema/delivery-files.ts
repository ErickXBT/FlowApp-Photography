import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";

export const folderTypeEnum = ["raw", "edited", "video", "final_video", "album"] as const;
export type FolderType = (typeof folderTypeEnum)[number];

export const deliveryFilesTable = pgTable("delivery_files", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  folderType: text("folder_type", { enum: folderTypeEnum }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  selected: boolean("selected").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeliveryFileSchema = createInsertSchema(deliveryFilesTable).omit({ id: true, uploadedAt: true });
export type InsertDeliveryFile = z.infer<typeof insertDeliveryFileSchema>;
export type DeliveryFile = typeof deliveryFilesTable.$inferSelect;
