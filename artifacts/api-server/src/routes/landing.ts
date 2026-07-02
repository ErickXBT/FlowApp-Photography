import { Router } from "express";
import { db, tenants, landingCatalog } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/landing/:slug", async (req, res) => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, req.params.slug)).limit(1);
  if (!tenant || !tenant.active) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const catalog = await db.select().from(landingCatalog)
    .where(eq(landingCatalog.tenantId, tenant.id));
  res.json({ ...tenant, catalog });
});

router.get("/landing/me/profile", requireAuth, async (req, res) => {
  const tenantId = req.session.tenantId;
  if (!tenantId) { res.status(400).json({ error: "No tenant" }); return; }
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  res.json(tenant);
});

router.patch("/landing/me/profile", requireAuth, async (req, res) => {
  const tenantId = req.session.tenantId;
  if (!tenantId) { res.status(400).json({ error: "No tenant" }); return; }
  const { bio, profilePhotoUrl, bannerUrl, whatsapp, instagram, website, ctaText, studioName } = req.body as {
    bio?: string; profilePhotoUrl?: string; bannerUrl?: string;
    whatsapp?: string; instagram?: string; website?: string; ctaText?: string; studioName?: string;
  };
  const [updated] = await db.update(tenants).set({
    ...(bio !== undefined && { bio }),
    ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
    ...(bannerUrl !== undefined && { bannerUrl }),
    ...(whatsapp !== undefined && { whatsapp }),
    ...(instagram !== undefined && { instagram }),
    ...(website !== undefined && { website }),
    ...(ctaText !== undefined && { ctaText }),
    ...(studioName !== undefined && { studioName }),
  }).where(eq(tenants.id, tenantId)).returning();
  res.json(updated);
});

router.get("/landing/me/catalog", requireAuth, async (req, res) => {
  const tenantId = req.session.tenantId;
  if (!tenantId) { res.status(400).json({ error: "No tenant" }); return; }
  const items = await db.select().from(landingCatalog)
    .where(eq(landingCatalog.tenantId, tenantId));
  res.json(items);
});

router.post("/landing/me/catalog", requireAuth, async (req, res) => {
  const tenantId = req.session.tenantId;
  if (!tenantId) { res.status(400).json({ error: "No tenant" }); return; }
  const { title, type, url, thumbnailUrl, displayOrder } = req.body as {
    title?: string; type?: string; url: string; thumbnailUrl?: string; displayOrder?: number;
  };
  const [item] = await db.insert(landingCatalog).values({
    tenantId,
    title: title ?? null,
    type: (type as any) ?? "photo",
    url,
    thumbnailUrl: thumbnailUrl ?? null,
    displayOrder: displayOrder ?? 0,
  }).returning();
  res.status(201).json(item);
});

router.delete("/landing/me/catalog/:id", requireAuth, async (req, res) => {
  await db.delete(landingCatalog).where(eq(landingCatalog.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
