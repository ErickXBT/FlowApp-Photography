import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const dressCatalogStatusEnum = pgEnum("dress_catalog_status", ["available", "booked", "maintenance"]);
export const dressTypeEnum = pgEnum("dress_type", ["gaun", "kebaya", "jas", "suit", "aksesoris", "lainnya"]);

export const dressCatalog = pgTable("dress_catalog", {
  id: serial("id").primaryKey(),
  tenantId: serial("tenant_id").notNull(),
  name: text("name").notNull(),
  type: dressTypeEnum("type").notNull().default("gaun"),
  size: text("size"),
  color: text("color"),
  status: dressCatalogStatusEnum("status").notNull().default("available"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
