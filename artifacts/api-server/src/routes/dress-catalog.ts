import { Router } from "express";
import { db, dressCatalog } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();
router.use(requireAuth);

router.get("/dress-catalog", async (req, res) => {
  const tenantId = req.session.tenantId ?? 1;
  const items = await db.select().from(dressCatalog).where(eq(dressCatalog.tenantId, tenantId));
  res.json(items);
});

router.post("/dress-catalog", async (req, res) => {
  const tenantId = req.session.tenantId ?? 1;
  const { name, type, size, color, status, imageUrl, notes } = req.body as {
    name: string; type?: string; size?: string; color?: string;
    status?: string; imageUrl?: string; notes?: string;
  };
  const [item] = await db.insert(dressCatalog).values({
    tenantId,
    name,
    type: (type as any) ?? "gaun",
    size: size ?? null,
    color: color ?? null,
    status: (status as any) ?? "available",
    imageUrl: imageUrl ?? null,
    notes: notes ?? null,
  }).returning();
  res.status(201).json(item);
});

router.patch("/dress-catalog/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, type, size, color, status, imageUrl, notes } = req.body as {
    name?: string; type?: string; size?: string; color?: string;
    status?: string; imageUrl?: string; notes?: string;
  };
  const [updated] = await db.update(dressCatalog).set({
    ...(name && { name }),
    ...(type && { type: type as any }),
    ...(size !== undefined && { size }),
    ...(color !== undefined && { color }),
    ...(status && { status: status as any }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(notes !== undefined && { notes }),
  }).where(eq(dressCatalog.id, id)).returning();
  res.json(updated);
});

router.delete("/dress-catalog/:id", async (req, res) => {
  await db.delete(dressCatalog).where(eq(dressCatalog.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
