import { Router, type IRouter } from "express";
import { db, bookingsTable, clientsTable, packagesTable } from "@workspace/db";
import { GetCalendarBookingsResponse } from "@workspace/api-zod";
import { requireVendor } from "../lib/auth";

const router: IRouter = Router();
router.use(requireVendor);

router.get("/calendar", async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  const clients = await db.select().from(clientsTable);
  const packages = await db.select().from(packagesTable);
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const packageMap = new Map(packages.map((p) => [p.id, p]));
  const shaped = bookings.map((b) => ({
    id: b.id,
    clientName: clientMap.get(b.clientId)?.name ?? "",
    packageName: b.packageId ? (packageMap.get(b.packageId)?.name ?? "") : "",
    eventDate: b.eventDate,
    status: b.status,
  }));
  res.json(GetCalendarBookingsResponse.parse(shaped));
});

export default router;
