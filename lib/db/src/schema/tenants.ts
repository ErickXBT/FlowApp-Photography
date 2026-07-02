import { pgTable, serial, text, timestamp, pgEnum, boolean, real } from "drizzle-orm/pg-core";

export const tenantPlanEnum = pgEnum("tenant_plan", ["starter", "pro", "business"]);

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  studioName: text("studio_name").notNull(),
  ownerName: text("owner_name").notNull(),
  category: text("category").notNull().default("Photography & Videography"),
  location: text("location").notNull().default("Indonesia"),
  plan: tenantPlanEnum("plan").notNull().default("starter"),
  active: boolean("active").notNull().default(true),
  rating: real("rating").default(5.0),
  bio: text("bio"),
  profilePhotoUrl: text("profile_photo_url"),
  bannerUrl: text("banner_url"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  instagram: text("instagram"),
  website: text("website"),
  ctaText: text("cta_text").default("Booking Sekarang"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  planExpiresAt: timestamp("plan_expires_at"),
});
