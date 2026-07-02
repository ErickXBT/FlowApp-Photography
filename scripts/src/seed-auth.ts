import { db, pool, users, tenants, landingCatalog } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedAuth() {
  console.log("Seeding auth data (users + tenants)...");

  const [existingAdmin] = await db.select().from(users).where(eq(users.email, "admin@flowapp.id")).limit(1);
  if (existingAdmin) {
    console.log("Auth data already seeded. Skipping.");
    await pool.end();
    return;
  }

  const adminHash = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    email: "admin@flowapp.id",
    passwordHash: adminHash,
    name: "FlowAdmin",
    role: "super_admin",
    tenantId: 0,
  });
  console.log("  ✓ Super admin created (admin@flowapp.id / admin123)");

  const [tenant1] = await db.insert(tenants).values({
    slug: "studio-senja",
    studioName: "Studio Senja Photography",
    ownerName: "Rian Wijaya",
    category: "Photography & Videography",
    location: "Jakarta Selatan, Indonesia",
    plan: "pro",
    rating: 4.9,
    bio: "Studio foto & video profesional spesialis pernikahan dan prewedding. Melayani seluruh Indonesia dengan sentuhan sinematik yang khas. 8 tahun pengalaman, 500+ klien bahagia.",
    whatsapp: "+62812-9988-7766",
    email: "studio@senja.id",
    instagram: "@studiosenja",
    ctaText: "Booking Sekarang",
    planExpiresAt: new Date("2026-12-12"),
  }).returning();
  console.log("  ✓ Tenant Studio Senja created");

  const vendorHash = await bcrypt.hash("vendor123", 10);
  await db.insert(users).values({
    email: "vendor@senja.id",
    passwordHash: vendorHash,
    name: "Rian Wijaya",
    role: "vendor",
    tenantId: tenant1.id,
  });
  console.log("  ✓ Vendor user created (vendor@senja.id / vendor123)");

  const [tenant2] = await db.insert(tenants).values({
    slug: "bella-makeup",
    studioName: "Bella Makeup & Bridal",
    ownerName: "Bella Lestari",
    category: "MUA & Hair Stylist",
    location: "Bandung, Indonesia",
    plan: "pro",
    rating: 4.8,
    bio: "Professional makeup artist & bridal specialist. Glamour, natural, & traditional looks. Tersedia untuk seluruh wilayah Bandung dan sekitarnya.",
    whatsapp: "+62821-5566-7788",
    email: "bella@makeup.id",
    instagram: "@bellamakeupbridal",
    ctaText: "Konsultasi Gratis",
    planExpiresAt: new Date("2026-12-12"),
  }).returning();
  console.log("  ✓ Tenant Bella Makeup created");

  await db.insert(landingCatalog).values([
    { tenantId: tenant1.id, title: "Wedding Sarah & James", type: "photo", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", displayOrder: 1 },
    { tenantId: tenant1.id, title: "Prewedding Sunset", type: "photo", url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800", displayOrder: 2 },
    { tenantId: tenant1.id, title: "Cinematic Wedding Film", type: "photo", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800", displayOrder: 3 },
    { tenantId: tenant1.id, title: "Portrait Session", type: "photo", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800", displayOrder: 4 },
    { tenantId: tenant1.id, title: "Garden Wedding", type: "photo", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800", displayOrder: 5 },
    { tenantId: tenant1.id, title: "Intimate Ceremony", type: "photo", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", displayOrder: 6 },
    { tenantId: tenant2.id, title: "Glamour Bridal", type: "photo", url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800", displayOrder: 1 },
    { tenantId: tenant2.id, title: "Natural Look", type: "photo", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800", displayOrder: 2 },
    { tenantId: tenant2.id, title: "Traditional Kebaya", type: "photo", url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800", displayOrder: 3 },
  ]);
  console.log("  ✓ Landing page catalog seeded");

  console.log("\n✅ Auth seed complete!");
  console.log("  Login: admin@flowapp.id / admin123 (Super Admin)");
  console.log("  Login: vendor@senja.id / vendor123 (Vendor)");
  await pool.end();
}

seedAuth().catch((e) => { console.error(e); process.exit(1); });
