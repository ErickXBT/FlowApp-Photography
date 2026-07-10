import { Router } from "express";
import { db, rescheduleRequests, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireVendor } from "../lib/auth";

const router = Router();

router.get("/reschedule-requests", requireVendor, async (req, res) => {
  const requests = await db.select().from(rescheduleRequests);
  res.json(requests);
});

router.post("/reschedule-requests", async (req, res) => {
  const { bookingId, oldDate, newDate, reason } = req.body as {
    bookingId: number; oldDate: string; newDate: string; reason: string;
  };
  const [item] = await db.insert(rescheduleRequests).values({
    bookingId,
    oldDate,
    newDate,
    reason,
    status: "pending",
  }).returning();
  res.status(201).json(item);
});

router.patch("/reschedule-requests/:id/approve", requireVendor, async (req, res) => {
  const id = Number(req.params.id);
  const [request] = await db.select().from(rescheduleRequests).where(eq(rescheduleRequests.id, id)).limit(1);
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(bookingsTable)
    .set({ eventDate: new Date(request.newDate) })
    .where(eq(bookingsTable.id, request.bookingId));
  const [updated] = await db.update(rescheduleRequests)
    .set({ status: "approved" })
    .where(eq(rescheduleRequests.id, id))
    .returning();
  res.json(updated);
});

router.patch("/reschedule-requests/:id/reject", requireVendor, async (req, res) => {
  const id = Number(req.params.id);
  const [updated] = await db.update(rescheduleRequests)
    .set({ status: "rejected" })
    .where(eq(rescheduleRequests.id, id))
    .returning();
  res.json(updated);
});

export default router;
