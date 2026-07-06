import { db, pool, users, tenants, landingCatalog } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedAuth() {
  console.log("Seeding auth data (users + tenants)...");

  // 1. Super Admin
  const adminHash = await bcrypt.hash("admin123", 10);
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, "admin@flowapp.id")).limit(1);
  if (!existingAdmin) {
    await db.insert(users).values({
      email: "admin@flowapp.id",
      passwordHash: adminHash,
      name: "FlowAdmin",
      role: "super_admin",
      tenantId: null,
    });
    console.log("  ✓ Super admin created (admin@flowapp.id / admin123)");
  } else {
    console.log("  ✓ Super admin already exists");
  }

  // 2. Tenant 1
  let tenant1;
  const [existingTenant1] = await db.select().from(tenants).where(eq(tenants.slug, "studio-senja")).limit(1);
  if (existingTenant1) {
    tenant1 = existingTenant1;
    console.log("  ✓ Tenant Studio Senja already exists");
  } else {
    [tenant1] = await db.insert(tenants).values({
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
  }

  // 3. Vendor User
  const vendorHash = await bcrypt.hash("vendor123", 10);
  const [existingVendor] = await db.select().from(users).where(eq(users.email, "vendor@senja.id")).limit(1);
  if (existingVendor) {
    await db.update(users).set({ tenantId: tenant1.id }).where(eq(users.id, existingVendor.id));
    console.log("  ✓ Vendor user updated with tenantId");
  } else {
    await db.insert(users).values({
      email: "vendor@senja.id",
      passwordHash: vendorHash,
      name: "Rian Wijaya",
      role: "vendor",
      tenantId: tenant1.id,
    });
    console.log("  ✓ Vendor user created (vendor@senja.id / vendor123)");
  }

  // 4. Tenant 2
  let tenant2;
  const [existingTenant2] = await db.select().from(tenants).where(eq(tenants.slug, "bella-makeup")).limit(1);
  if (existingTenant2) {
    tenant2 = existingTenant2;
    console.log("  ✓ Tenant Bella Makeup already exists");
  } else {
    [tenant2] = await db.insert(tenants).values({
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
  }

  // 5. Landing Page Catalog
  const [existingCatalog] = await db.select().from(landingCatalog).limit(1);
  if (!existingCatalog) {
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
  } else {
    console.log("  ✓ Landing page catalog already seeded");
  }

  console.log("\n✅ Auth seed complete!");
  await pool.end();
}

seedAuth().catch((e) => { console.error(e); process.exit(1); });
