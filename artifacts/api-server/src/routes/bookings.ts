import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, bookingsTable, packagesTable, invoicesTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
  DeleteBookingParams,
  UpdateBookingStatusParams,
  UpdateBookingStatusBody,
  UpdateBookingStatusResponse,
} from "@workspace/api-zod";
import { shapeBookingListItem, shapeBookingListItems, shapeBookingDetail } from "../lib/shape";
import { requireVendor } from "../lib/auth";

const router: IRouter = Router();
router.use(requireVendor);

router.get("/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(query.data.status ? eq(bookingsTable.status, query.data.status) : undefined)
    .orderBy(desc(bookingsTable.eventDate));
  res.json(ListBookingsResponse.parse(await shapeBookingListItems(bookings)));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, parsed.data.packageId));
  if (!pkg) {
    res.status(400).json({ error: "Package not found" });
    return;
  }

  const addOnIds = parsed.data.addOnIds ?? [];
  let addOnsTotal = 0;
  if (addOnIds.length > 0) {
    const { addOnsTable } = await import("@workspace/db");
    const addOns = await db.select().from(addOnsTable);
    const addOnMap = new Map(addOns.map((a) => [a.id, Number(a.price)]));
    addOnsTotal = addOnIds.reduce((sum, id) => sum + (addOnMap.get(id) ?? 0), 0);
  }
  const totalAmount = Number(pkg.price) + addOnsTotal;

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      clientId: parsed.data.clientId,
      categoryId: parsed.data.categoryId,
      packageId: parsed.data.packageId,
      eventDate: parsed.data.eventDate,
      locationName: parsed.data.locationName,
      locationAddress: parsed.data.locationAddress,
      mapsLink: parsed.data.mapsLink,
      clientOrigin: parsed.data.clientOrigin ?? "local",
      specialRequest: parsed.data.specialRequest,
      moodboardLinks: parsed.data.moodboardLinks ?? [],
      teamMemberIds: parsed.data.teamMemberIds ?? [],
      addOnIds,
      totalAmount: String(totalAmount),
    })
    .returning();

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(booking.id).padStart(4, "0")}`;
  const dueDate = new Date(booking.eventDate);
  dueDate.setDate(dueDate.getDate() + 3);
  const lineItems = [
    { label: pkg.name, amount: Number(pkg.price) },
    ...(addOnIds.length > 0 && addOnsTotal > 0 ? [{ label: "Add-ons", amount: addOnsTotal }] : []),
  ];
  await db.insert(invoicesTable).values({
    bookingId: booking.id,
    invoiceNumber,
    dueDate,
    lineItems,
    subtotal: String(totalAmount),
    total: String(totalAmount),
    paidAmount: "0",
    status: "unpaid",
  });

  res.status(201).json(CreateBookingResponse.parse(await shapeBookingListItem(booking)));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(GetBookingResponse.parse(await shapeBookingDetail(booking)));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(UpdateBookingResponse.parse(await shapeBookingListItem(booking)));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const params = DeleteBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [booking] = await db.delete(bookingsTable).where(eq(bookingsTable.id, params.data.id)).returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/bookings/:id/status", async (req, res): Promise<void> => {
  const params = UpdateBookingStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [booking] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(UpdateBookingStatusResponse.parse(await shapeBookingListItem(booking)));
});

export default router;
