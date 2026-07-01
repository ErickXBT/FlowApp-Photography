import { integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";

export const invoiceStatusEnum = ["unpaid", "partial", "paid"] as const;
export type InvoiceStatus = (typeof invoiceStatusEnum)[number];

export interface InvoiceLineItem {
  label: string;
  amount: number;
}

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  lineItems: jsonb("line_items").$type<InvoiceLineItem[]>().notNull().default([]),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  status: text("status", { enum: invoiceStatusEnum }).notNull().default("unpaid"),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
