import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, bookingsTable, packagesTable, invoicesTable, deliveryFilesTable } from "@workspace/db";
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
import { seedRawPhotosFromDrive } from "../lib/drive";

router.get("/bookings/:id/debug-db", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [b] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  const files = await db.select().from(deliveryFilesTable).where(eq(deliveryFilesTable.bookingId, id));
  res.json({ booking: b, files: files });
});

// Public client portal endpoints (NO requireVendor)
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

router.patch("/bookings/:id/submit-selection", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Count selected raw files to ensure they selected at least 1
  const selectedRawFiles = await db
    .select()
    .from(deliveryFilesTable)
    .where(
      and(
        eq(deliveryFilesTable.bookingId, id),
        eq(deliveryFilesTable.folderType, "raw"),
        eq(deliveryFilesTable.selected, true)
      )
    );

  if (selectedRawFiles.length === 0) {
    res.status(400).json({ error: "Anda harus memilih minimal 1 foto sebelum mengirim." });
    return;
  }

  // Read optional client special request/notes for editing
  const { specialRequest } = req.body || {};

  // Set booking status to "editing" and save notes
  const [updated] = await db
    .update(bookingsTable)
    .set({ 
      status: "editing",
      specialRequest: specialRequest !== undefined ? specialRequest : booking.specialRequest
    })
    .where(eq(bookingsTable.id, id))
    .returning();

  res.json(GetBookingResponse.parse(await shapeBookingDetail(updated)));
});

router.post("/bookings/:id/sync", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  if (!booking.googleDriveLink) {
    res.status(400).json({ error: "Booking does not have a Google Drive link." });
    return;
  }

  await seedRawPhotosFromDrive(booking.id, booking.googleDriveLink);
  res.json({ success: true });
});

// Require vendor authentication for all routes below

router.get("/bookings", requireVendor, async (req, res): Promise<void> => {
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

router.post("/bookings", requireVendor, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let pkg = null;
  if (parsed.data.packageId) {
    const [foundPkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, parsed.data.packageId));
    if (!foundPkg) {
      res.status(400).json({ error: "Package not found" });
      return;
    }
    pkg = foundPkg;
  }

  const addOnIds = parsed.data.addOnIds ?? [];
  let addOnsTotal = 0;
  if (addOnIds.length > 0) {
    const { addOnsTable } = await import("@workspace/db");
    const addOns = await db.select().from(addOnsTable);
    const addOnMap = new Map(addOns.map((a) => [a.id, Number(a.price)]));
    addOnsTotal = addOnIds.reduce((sum, id) => sum + (addOnMap.get(id) ?? 0), 0);
  }
  
  const pkgPrice = pkg ? Number(pkg.price) : 0;
  const totalAmount = pkgPrice + addOnsTotal;

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
      // New columns mapping
      googleDriveLink: parsed.data.googleDriveLink,
      detectSubfolder: parsed.data.detectSubfolder ?? false,
      whatsappClient: parsed.data.whatsappClient,
      whatsappAdmin: parsed.data.whatsappAdmin,
      maxPhotos: parsed.data.maxPhotos ?? 5,
      pilihFotoEnabled: parsed.data.pilihFotoEnabled ?? true,
      downloadFotoEnabled: parsed.data.downloadFotoEnabled ?? true,
      pilihFotoDuration: parsed.data.pilihFotoDuration ?? "Selamanya",
      downloadFotoDuration: parsed.data.downloadFotoDuration ?? "Selamanya",
      pilihFotoPassword: parsed.data.pilihFotoPassword,
      downloadFotoPassword: parsed.data.downloadFotoPassword,
      pilihFotoTambahanEnabled: parsed.data.pilihFotoTambahanEnabled ?? false,
      pilihFotoCetakEnabled: parsed.data.pilihFotoCetakEnabled ?? false,
    })
    .returning();

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(booking.id).padStart(4, "0")}`;
  const dueDate = new Date(booking.eventDate);
  dueDate.setDate(dueDate.getDate() + 3);
  const lineItems = [
    ...(pkg ? [{ label: pkg.name, amount: pkgPrice }] : []),
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

  await seedRawPhotosFromDrive(booking.id, parsed.data.googleDriveLink);

  res.status(201).json(CreateBookingResponse.parse(await shapeBookingListItem(booking)));
});

router.patch("/bookings/:id", requireVendor, async (req, res): Promise<void> => {
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
  await seedRawPhotosFromDrive(booking.id, parsed.data.googleDriveLink);

  res.json(UpdateBookingResponse.parse(await shapeBookingListItem(booking)));
});

router.delete("/bookings/:id", requireVendor, async (req, res): Promise<void> => {
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

router.patch("/bookings/:id/status", requireVendor, async (req, res): Promise<void> => {
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
