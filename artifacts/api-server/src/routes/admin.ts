import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, users, tenants, bookingsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireSuperAdmin } from "../lib/auth";

const router = Router();

router.get("/admin/stats", requireSuperAdmin, async (req, res) => {
  const tenantList = await db.select().from(tenants);
  const [bookingCount] = await db.select({ count: count() }).from(bookingsTable);
  const totalFee = 1350000;
  res.json({
    totalTenants: tenantList.length,
    totalBookings: Number(bookingCount.count),
    platformFees: totalFee,
    platformStatus: "ACTIVE / STABLE",
  });
});

router.get("/admin/tenants", requireSuperAdmin, async (req, res) => {
  const tenantList = await db.select().from(tenants);
  res.json(tenantList);
});

router.post("/admin/tenants", requireSuperAdmin, async (req, res) => {
  const { studioName, ownerName, email, password, category, location, plan, whatsapp } = req.body as {
    studioName: string; ownerName: string; email: string; password: string;
    category?: string; location?: string; plan?: string; whatsapp?: string;
  };
  const slug = studioName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [existing] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const [tenant] = await db.insert(tenants).values({
    slug: finalSlug,
    studioName,
    ownerName,
    category: category ?? "Photography & Videography",
    location: location ?? "Indonesia",
    plan: (plan as any) ?? "starter",
    whatsapp: whatsapp ?? null,
    planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }).returning();

  const hash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({
    email,
    passwordHash: hash,
    name: ownerName,
    role: "vendor",
    tenantId: tenant.id,
  }).returning();

  req.log.info({ tenantId: tenant.id }, "Tenant created");
  res.json({ tenant, user: { id: user.id, email: user.email } });
});

router.patch("/admin/tenants/:id", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { active, plan } = req.body as { active?: boolean; plan?: string };
  const [updated] = await db.update(tenants)
    .set({ ...(active !== undefined && { active }), ...(plan && { plan: plan as any }) })
    .where(eq(tenants.id, id))
    .returning();
  res.json(updated);
});

router.post("/admin/tenants/:id/suspend", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const [t] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(tenants).set({ active: !t.active }).where(eq(tenants.id, id)).returning();
  res.json(updated);
});

router.get("/admin/activity", requireSuperAdmin, async (req, res) => {
  const activities = [
    { message: "Super admin logged in", time: "Baru saja" },
    { message: "Tenant baru Studio Senja terdaftar", time: "1 jam yang lalu" },
    { message: "Klien Nadia Putri membuat booking baru", time: "2 jam yang lalu" },
    { message: "Invoice INV-2026-0001 lunas dibayar", time: "1 hari yang lalu" },
    { message: "Vendor Bella Makeup & Bridal memperbarui katalog gaun", time: "1 hari yang lalu" },
    { message: "Sistem otomatis memperbarui status booking ke EDITING", time: "2 hari yang lalu" },
  ];
  res.json(activities);
});

const saasPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 199000,
    features: ["10 Bookings / bulan", "1 Team member", "S3 Storage 10GB", "Basic Booking Widget"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 399000,
    features: ["Unlimited Bookings", "5 Team members", "Cloudflare R2 100GB", "Custom QR Profile & Catalog", "Automatic Invoices"],
  },
  {
    id: "business",
    name: "Business",
    price: 799000,
    features: ["Unlimited Bookings & Staff", "R2 Storage 1TB", "Google Maps & WA Integrations", "Midtrans Payment Gateway Integration", "White Label Domain"],
  },
];

router.get("/admin/plans", requireSuperAdmin, (req, res) => {
  res.json(saasPlans);
});

export default router;
