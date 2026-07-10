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
  const {
    bio,
    profilePhotoUrl,
    bannerUrl,
    whatsapp,
    instagram,
    website,
    tiktok,
    youtube,
    ctaText,
    studioName,
    defaultWhatsappAdmin,
    defaultMaxPhotos,
    defaultPilihFotoPassword,
    defaultDownloadFotoPassword,
    defaultSamePasswordDownload,
    defaultSamePasswordTambahan,
    defaultSamePasswordCetak,
    defaultDetectSubfolder,
    defaultPilihFotoEnabled,
    defaultDownloadFotoEnabled,
    defaultTambahanFotoEnabled,
    defaultCetakFotoEnabled,
    defaultPilihFotoDuration,
    defaultDownloadDuration,
    customClientWelcomeMsg,
    dashboardDurationDisplay,
    seoMetaTitle,
    seoMetaDesc,
    seoKeywords,
    descPilihFoto,
    descDownloadFoto,
    descFotoTambahan,
    descFotoCetak,
    tplLinkClient,
    tplLinkTambahan,
    tplHasilAwal,
    tplHasilTambahan,
    defaultPrintSizes,
    defaultPrintPricing,
    supportWhatsApp,
    supportEmail,
    telegramBotToken,
    telegramChatId,
    tplRequestRaw,
    tplPengingatOriginal,
    tplPengingatTambahan,
    clientDeskActive,
    clientDeskApiKey,
    pricelistUrl
  } = req.body as {
    bio?: string; profilePhotoUrl?: string; bannerUrl?: string;
    whatsapp?: string; instagram?: string; website?: string; tiktok?: string; youtube?: string; ctaText?: string; studioName?: string;
    defaultWhatsappAdmin?: string;
    defaultMaxPhotos?: number;
    defaultPilihFotoPassword?: string;
    defaultDownloadFotoPassword?: string;
    defaultSamePasswordDownload?: boolean;
    defaultSamePasswordTambahan?: boolean;
    defaultSamePasswordCetak?: boolean;
    defaultDetectSubfolder?: boolean;
    defaultPilihFotoEnabled?: boolean;
    defaultDownloadFotoEnabled?: boolean;
    defaultTambahanFotoEnabled?: boolean;
    defaultCetakFotoEnabled?: boolean;
    defaultPilihFotoDuration?: string;
    defaultDownloadDuration?: string;
    customClientWelcomeMsg?: string;
    dashboardDurationDisplay?: string;
    seoMetaTitle?: string;
    seoMetaDesc?: string;
    seoKeywords?: string;
    descPilihFoto?: string;
    descDownloadFoto?: string;
    descFotoTambahan?: string;
    descFotoCetak?: string;
    tplLinkClient?: string;
    tplLinkTambahan?: string;
    tplHasilAwal?: string;
    tplHasilTambahan?: string;
    defaultPrintSizes?: string;
    defaultPrintPricing?: string;
    supportWhatsApp?: string;
    supportEmail?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    tplRequestRaw?: string;
    tplPengingatOriginal?: string;
    tplPengingatTambahan?: string;
    clientDeskActive?: boolean;
    clientDeskApiKey?: string;
    pricelistUrl?: string;
  };
  const [updated] = await db.update(tenants).set({
    ...(bio !== undefined && { bio }),
    ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
    ...(bannerUrl !== undefined && { bannerUrl }),
    ...(whatsapp !== undefined && { whatsapp }),
    ...(instagram !== undefined && { instagram }),
    ...(website !== undefined && { website }),
    ...(tiktok !== undefined && { tiktok }),
    ...(youtube !== undefined && { youtube }),
    ...(ctaText !== undefined && { ctaText }),
    ...(studioName !== undefined && { studioName }),
    ...(defaultWhatsappAdmin !== undefined && { defaultWhatsappAdmin }),
    ...(defaultMaxPhotos !== undefined && { defaultMaxPhotos }),
    ...(defaultPilihFotoPassword !== undefined && { defaultPilihFotoPassword }),
    ...(defaultDownloadFotoPassword !== undefined && { defaultDownloadFotoPassword }),
    ...(defaultSamePasswordDownload !== undefined && { defaultSamePasswordDownload }),
    ...(defaultSamePasswordTambahan !== undefined && { defaultSamePasswordTambahan }),
    ...(defaultSamePasswordCetak !== undefined && { defaultSamePasswordCetak }),
    ...(defaultDetectSubfolder !== undefined && { defaultDetectSubfolder }),
    ...(defaultPilihFotoEnabled !== undefined && { defaultPilihFotoEnabled }),
    ...(defaultDownloadFotoEnabled !== undefined && { defaultDownloadFotoEnabled }),
    ...(defaultTambahanFotoEnabled !== undefined && { defaultTambahanFotoEnabled }),
    ...(defaultCetakFotoEnabled !== undefined && { defaultCetakFotoEnabled }),
    ...(defaultPilihFotoDuration !== undefined && { defaultPilihFotoDuration }),
    ...(defaultDownloadDuration !== undefined && { defaultDownloadDuration }),
    ...(customClientWelcomeMsg !== undefined && { customClientWelcomeMsg }),
    ...(dashboardDurationDisplay !== undefined && { dashboardDurationDisplay }),
    ...(seoMetaTitle !== undefined && { seoMetaTitle }),
    ...(seoMetaDesc !== undefined && { seoMetaDesc }),
    ...(seoKeywords !== undefined && { seoKeywords }),
    ...(descPilihFoto !== undefined && { descPilihFoto }),
    ...(descDownloadFoto !== undefined && { descDownloadFoto }),
    ...(descFotoTambahan !== undefined && { descFotoTambahan }),
    ...(descFotoCetak !== undefined && { descFotoCetak }),
    ...(tplLinkClient !== undefined && { tplLinkClient }),
    ...(tplLinkTambahan !== undefined && { tplLinkTambahan }),
    ...(tplHasilAwal !== undefined && { tplHasilAwal }),
    ...(tplHasilTambahan !== undefined && { tplHasilTambahan }),
    ...(defaultPrintSizes !== undefined && { defaultPrintSizes }),
    ...(defaultPrintPricing !== undefined && { defaultPrintPricing }),
    ...(supportWhatsApp !== undefined && { supportWhatsApp }),
    ...(supportEmail !== undefined && { supportEmail }),
    ...(telegramBotToken !== undefined && { telegramBotToken }),
    ...(telegramChatId !== undefined && { telegramChatId }),
    ...(tplRequestRaw !== undefined && { tplRequestRaw }),
    ...(tplPengingatOriginal !== undefined && { tplPengingatOriginal }),
    ...(tplPengingatTambahan !== undefined && { tplPengingatTambahan }),
    ...(clientDeskActive !== undefined && { clientDeskActive }),
    ...(clientDeskApiKey !== undefined && { clientDeskApiKey }),
    ...(pricelistUrl !== undefined && { pricelistUrl }),
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

router.get("/landing/:slug/availabilities", async (req, res) => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, req.params.slug)).limit(1);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  const { dateAvailabilitiesTable } = await import("@workspace/db");
  const availabilities = await db
    .select()
    .from(dateAvailabilitiesTable)
    .where(eq(dateAvailabilitiesTable.tenantId, tenant.id));
  res.json(availabilities);
});

export default router;

