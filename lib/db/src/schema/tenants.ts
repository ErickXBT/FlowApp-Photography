import { pgTable, serial, text, timestamp, pgEnum, boolean, real, integer } from "drizzle-orm/pg-core";

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
  tiktok: text("tiktok"),
  youtube: text("youtube"),
  ctaText: text("cta_text").default("Booking Sekarang"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  planExpiresAt: timestamp("plan_expires_at"),

  // Default Project Configurations
  defaultWhatsappAdmin: text("default_whatsapp_admin"),
  defaultMaxPhotos: integer("default_max_photos").default(10).notNull(),
  defaultPilihFotoPassword: text("default_pilih_foto_password"),
  defaultDownloadFotoPassword: text("default_download_foto_password"),
  defaultSamePasswordDownload: boolean("default_same_password_download").default(true).notNull(),
  defaultSamePasswordTambahan: boolean("default_same_password_tambahan").default(true).notNull(),
  defaultSamePasswordCetak: boolean("default_same_password_cetak").default(true).notNull(),
  defaultDetectSubfolder: boolean("default_detect_subfolder").default(false).notNull(),
  defaultPilihFotoEnabled: boolean("default_pilih_foto_enabled").default(true).notNull(),
  defaultDownloadFotoEnabled: boolean("default_download_foto_enabled").default(true).notNull(),
  defaultTambahanFotoEnabled: boolean("default_tambahan_foto_enabled").default(false).notNull(),
  defaultCetakFotoEnabled: boolean("default_cetak_foto_enabled").default(false).notNull(),
  defaultPilihFotoDuration: text("default_pilih_foto_duration").default("Selamanya").notNull(),
  defaultDownloadDuration: text("default_download_duration").default("Selamanya").notNull(),
  customClientWelcomeMsg: text("custom_client_welcome_msg"),
  dashboardDurationDisplay: text("dashboard_duration_display").default("pilih_foto").notNull(),

  // SEO Metadata Default
  seoMetaTitle: text("seo_meta_title"),
  seoMetaDesc: text("seo_meta_desc"),
  seoKeywords: text("seo_keywords"),

  // Deskripsi Menu
  descPilihFoto: text("desc_pilih_foto"),
  descDownloadFoto: text("desc_download_foto"),
  descFotoTambahan: text("desc_foto_tambahan"),
  descFotoCetak: text("desc_foto_cetak"),

  // Template Pesan
  tplLinkClient: text("tpl_link_client"),
  tplLinkTambahan: text("tpl_link_tambahan"),
  tplHasilAwal: text("tpl_hasil_awal"),
  tplHasilTambahan: text("tpl_hasil_tambahan"),

  // Cetak Settings
  defaultPrintSizes: text("default_print_sizes"),
  defaultPrintPricing: text("default_print_pricing"),

  // Client Desk
  supportWhatsApp: text("support_whatsapp"),
  supportEmail: text("support_email"),

  // Telegram Bot Settings
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
});
