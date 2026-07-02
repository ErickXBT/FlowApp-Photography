import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";

export const rescheduleStatusEnum = pgEnum("reschedule_status", ["pending", "approved", "rejected"]);

export const rescheduleRequests = pgTable("reschedule_requests", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  oldDate: text("old_date").notNull(),
  newDate: text("new_date").notNull(),
  reason: text("reason").notNull(),
  status: rescheduleStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
