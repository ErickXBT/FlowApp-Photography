import { pgTable, serial, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";

export const catalogItemTypeEnum = pgEnum("catalog_item_type", ["photo", "video"]);

export const landingCatalog = pgTable("landing_catalog", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  title: text("title"),
  type: catalogItemTypeEnum("type").notNull().default("photo"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
