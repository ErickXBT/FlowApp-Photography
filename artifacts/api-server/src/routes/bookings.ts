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
router.use(requireVendor);

async function seedRawPhotosFromDrive(bookingId: number, googleDriveLink: string | null | undefined) {
  if (!googleDriveLink || googleDriveLink.trim() === "") return;

  const existingRaw = await db
    .select()
    .from(deliveryFilesTable)
    .where(
      and(
        eq(deliveryFilesTable.bookingId, bookingId),
        eq(deliveryFilesTable.folderType, "raw")
      )
    );

  if (existingRaw.length > 0) return;

  const mockUrls = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1507504038482-762102124e1d?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1519225495810-7512c696505a?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1519741621253-27a9223cb20a?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1510076894075-85c547200e28?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1529636798458-92182e65f13d?w=800&auto=format&fit=crop&q=60"
  ];

  const values = mockUrls.map((url, idx) => ({
    bookingId,
    folderType: "raw" as const,
    fileName: `RAW_DSC_${String(idx + 1).padStart(4, "0")}.jpg`,
    fileUrl: url,
    selected: false
  }));

  await db.insert(deliveryFilesTable).values(values);
}

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
  await seedRawPhotosFromDrive(booking.id, parsed.data.googleDriveLink);

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
