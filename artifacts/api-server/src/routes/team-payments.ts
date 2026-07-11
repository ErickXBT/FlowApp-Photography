import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teamPaymentsTable } from "@workspace/db";
import { requireVendor } from "../lib/auth";

const router: IRouter = Router();

router.get("/team-payments", requireVendor, async (_req, res): Promise<void> => {
  const payments = await db.select().from(teamPaymentsTable).orderBy(teamPaymentsTable.createdAt);
  res.json(payments);
});

router.post("/team-payments", requireVendor, async (req, res): Promise<void> => {
  const { freelancerName, role, eventsCount, ratePerEvent, paidAmount } = req.body || {};
  if (!freelancerName || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [payment] = await db
    .insert(teamPaymentsTable)
    .values({
      freelancerName,
      role,
      eventsCount: Number(eventsCount) || 0,
      ratePerEvent: Number(ratePerEvent) || 0,
      paidAmount: Number(paidAmount) || 0,
    })
    .returning();
  res.status(201).json(payment);
});

router.patch("/team-payments/:id", requireVendor, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { freelancerName, role, eventsCount, ratePerEvent, paidAmount } = req.body || {};
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid payment ID" });
    return;
  }
  const [payment] = await db
    .update(teamPaymentsTable)
    .set({
      freelancerName: freelancerName || undefined,
      role: role || undefined,
      eventsCount: eventsCount !== undefined ? Number(eventsCount) : undefined,
      ratePerEvent: ratePerEvent !== undefined ? Number(ratePerEvent) : undefined,
      paidAmount: paidAmount !== undefined ? Number(paidAmount) : undefined,
    })
    .where(eq(teamPaymentsTable.id, id))
    .returning();
  if (!payment) {
    res.status(404).json({ error: "Payment record not found" });
    return;
  }
  res.json(payment);
});

router.delete("/team-payments/:id", requireVendor, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid payment ID" });
    return;
  }
  const [payment] = await db.delete(teamPaymentsTable).where(eq(teamPaymentsTable.id, id)).returning();
  if (!payment) {
    res.status(404).json({ error: "Payment record not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
