CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('starter', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."dress_catalog_status" AS ENUM('available', 'booked', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."dress_type" AS ENUM('gaun', 'kebaya', 'jas', 'suit', 'aksesoris', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."reschedule_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."catalog_item_type" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"included_edited_photos" integer DEFAULT 0 NOT NULL,
	"estimated_days" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "add_ons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"photo_url" text,
	"bio" text,
	"portfolio_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"city" text,
	"province" text,
	"country" text,
	"client_origin" text DEFAULT 'local' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"category_id" integer,
	"package_id" integer,
	"event_date" timestamp with time zone NOT NULL,
	"location_name" text,
	"location_address" text,
	"maps_link" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"client_origin" text DEFAULT 'local' NOT NULL,
	"special_request" text,
	"moodboard_links" text[] DEFAULT '{}' NOT NULL,
	"team_member_ids" integer[] DEFAULT '{}' NOT NULL,
	"add_on_ids" integer[] DEFAULT '{}' NOT NULL,
	"google_drive_link" text,
	"detect_subfolder" boolean DEFAULT false NOT NULL,
	"whatsapp_client" text,
	"whatsapp_admin" text,
	"max_photos" integer DEFAULT 5 NOT NULL,
	"pilih_foto_enabled" boolean DEFAULT true NOT NULL,
	"download_foto_enabled" boolean DEFAULT true NOT NULL,
	"pilih_foto_duration" text DEFAULT 'Selamanya' NOT NULL,
	"download_foto_duration" text DEFAULT 'Selamanya' NOT NULL,
	"pilih_foto_password" text,
	"download_foto_password" text,
	"pilih_foto_tambahan_enabled" boolean DEFAULT false NOT NULL,
	"pilih_foto_cetak_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"folder_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"selected" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'vendor' NOT NULL,
	"tenant_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"studio_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"category" text DEFAULT 'Photography & Videography' NOT NULL,
	"location" text DEFAULT 'Indonesia' NOT NULL,
	"plan" "tenant_plan" DEFAULT 'starter' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"rating" real DEFAULT 5,
	"bio" text,
	"profile_photo_url" text,
	"banner_url" text,
	"whatsapp" text,
	"email" text,
	"instagram" text,
	"website" text,
	"tiktok" text,
	"youtube" text,
	"cta_text" text DEFAULT 'Booking Sekarang',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"plan_expires_at" timestamp,
	"default_whatsapp_admin" text,
	"default_max_photos" integer DEFAULT 10 NOT NULL,
	"default_pilih_foto_password" text,
	"default_download_foto_password" text,
	"default_same_password_download" boolean DEFAULT true NOT NULL,
	"default_same_password_tambahan" boolean DEFAULT true NOT NULL,
	"default_same_password_cetak" boolean DEFAULT true NOT NULL,
	"default_detect_subfolder" boolean DEFAULT false NOT NULL,
	"default_pilih_foto_enabled" boolean DEFAULT true NOT NULL,
	"default_download_foto_enabled" boolean DEFAULT true NOT NULL,
	"default_tambahan_foto_enabled" boolean DEFAULT false NOT NULL,
	"default_cetak_foto_enabled" boolean DEFAULT false NOT NULL,
	"default_pilih_foto_duration" text DEFAULT 'Selamanya' NOT NULL,
	"default_download_duration" text DEFAULT 'Selamanya' NOT NULL,
	"custom_client_welcome_msg" text,
	"dashboard_duration_display" text DEFAULT 'pilih_foto' NOT NULL,
	"seo_meta_title" text,
	"seo_meta_desc" text,
	"seo_keywords" text,
	"desc_pilih_foto" text,
	"desc_download_foto" text,
	"desc_foto_tambahan" text,
	"desc_foto_cetak" text,
	"tpl_link_client" text,
	"tpl_link_tambahan" text,
	"tpl_hasil_awal" text,
	"tpl_hasil_tambahan" text,
	"tpl_request_raw" text,
	"tpl_pengingat_original" text,
	"tpl_pengingat_tambahan" text,
	"default_print_sizes" text,
	"default_print_pricing" text,
	"support_whatsapp" text,
	"support_email" text,
	"client_desk_active" boolean DEFAULT false NOT NULL,
	"client_desk_api_key" text,
	"telegram_bot_token" text,
	"telegram_chat_id" text,
	"pricelist_url" text,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dress_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" serial NOT NULL,
	"name" text NOT NULL,
	"type" "dress_type" DEFAULT 'gaun' NOT NULL,
	"size" text,
	"color" text,
	"status" "dress_catalog_status" DEFAULT 'available' NOT NULL,
	"image_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reschedule_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"old_date" text NOT NULL,
	"new_date" text NOT NULL,
	"reason" text NOT NULL,
	"status" "reschedule_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"title" text,
	"type" "catalog_item_type" DEFAULT 'photo' NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_availabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"selected_date" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_files" ADD CONSTRAINT "delivery_files_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_availabilities" ADD CONSTRAINT "date_availabilities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;