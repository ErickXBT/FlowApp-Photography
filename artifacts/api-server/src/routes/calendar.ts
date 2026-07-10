import { Router, type IRouter } from "express";
import { db, bookingsTable, clientsTable, packagesTable, dateAvailabilitiesTable, teamMembersTable } from "@workspace/db";
import { GetCalendarBookingsResponse } from "@workspace/api-zod";
import { requireVendor } from "../lib/auth";
import { and, eq } from "drizzle-orm";


const router: IRouter = Router();

router.get("/calendar/availabilities", requireVendor, async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "No tenant context found" });
    return;
  }
  const availabilities = await db
    .select()
    .from(dateAvailabilitiesTable)
    .where(eq(dateAvailabilitiesTable.tenantId, tenantId));
  res.json(availabilities);
});

router.post("/calendar/availabilities", requireVendor, async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: "No tenant context found" });
    return;
  }
  const { selectedDate, status } = req.body as { selectedDate: string; status: "available" | "last_slot" | "full_booking" };
  if (!selectedDate || !status) {
    res.status(400).json({ error: "Missing selectedDate or status" });
    return;
  }

  const [existing] = await db
    .select()
    .from(dateAvailabilitiesTable)
    .where(
      and(
        eq(dateAvailabilitiesTable.tenantId, tenantId),
        eq(dateAvailabilitiesTable.selectedDate, selectedDate)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(dateAvailabilitiesTable)
      .set({ status })
      .where(eq(dateAvailabilitiesTable.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [inserted] = await db
      .insert(dateAvailabilitiesTable)
      .values({ tenantId, selectedDate, status })
      .returning();
    res.json(inserted);
  }
});

router.get("/calendar", requireVendor, async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  const clients = await db.select().from(clientsTable);
  const packages = await db.select().from(packagesTable);
  const teamMembers = await db.select().from(teamMembersTable);

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const packageMap = new Map(packages.map((p) => [p.id, p]));
  const teamMemberMap = new Map(teamMembers.map((tm) => [tm.id, tm]));

  const shaped = bookings.map((b) => ({
    id: b.id,
    clientName: clientMap.get(b.clientId)?.name ?? "",
    packageName: b.packageId ? (packageMap.get(b.packageId)?.name ?? "") : "",
    eventDate: b.eventDate,
    status: b.status,
    teamMembers: b.teamMemberIds.map((id) => teamMemberMap.get(id)).filter((tm): tm is NonNullable<typeof tm> => tm !== undefined),
  }));
  res.json(GetCalendarBookingsResponse.parse(shaped));
});

export default router;
