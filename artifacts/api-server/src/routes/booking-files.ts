import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, deliveryFilesTable, bookingsTable } from "@workspace/db";
import {
  ListBookingFilesParams,
  ListBookingFilesResponse,
  CreateBookingFileParams,
  CreateBookingFileBody,
  CreateBookingFileResponse,
  DeleteBookingFileParams,
  ToggleFileSelectionParams,
  ToggleFileSelectionBody,
  ToggleFileSelectionResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/bookings/:bookingId/files", async (req, res): Promise<void> => {
  const params = ListBookingFilesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const files = await db
    .select()
    .from(deliveryFilesTable)
    .where(eq(deliveryFilesTable.bookingId, params.data.bookingId));
  res.json(ListBookingFilesResponse.parse(files));
});

router.post("/bookings/:bookingId/files", async (req, res): Promise<void> => {
  const params = CreateBookingFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateBookingFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [file] = await db
    .insert(deliveryFilesTable)
    .values({ ...parsed.data, bookingId: params.data.bookingId })
    .returning();
  res.status(201).json(CreateBookingFileResponse.parse(file));
});

router.delete("/files/:id", async (req, res): Promise<void> => {
  const params = DeleteBookingFileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [file] = await db.delete(deliveryFilesTable).where(eq(deliveryFilesTable.id, params.data.id)).returning();
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendStatus(204);
});

router.patch("/files/:id/select", async (req, res): Promise<void> => {
  const params = ToggleFileSelectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ToggleFileSelectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // 1. Get target file
  const [targetFile] = await db
    .select()
    .from(deliveryFilesTable)
    .where(eq(deliveryFilesTable.id, params.data.id))
    .limit(1);

  if (!targetFile) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const bookingId = targetFile.bookingId;

  // 2. Get booking details to find maxPhotos
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const maxPhotos = booking.maxPhotos ?? 5;

  // 3. Count currently selected raw files
  const selectedRawFiles = await db
    .select()
    .from(deliveryFilesTable)
    .where(
      and(
        eq(deliveryFilesTable.bookingId, bookingId),
        eq(deliveryFilesTable.folderType, "raw"),
        eq(deliveryFilesTable.selected, true)
      )
    );

  const currentlySelectedCount = selectedRawFiles.length;

  // If selecting a new file, check if we're already at the quota
  if (parsed.data.selected && !targetFile.selected && currentlySelectedCount >= maxPhotos) {
    res.status(400).json({ error: `Kuota seleksi foto sudah penuh (maksimal ${maxPhotos} foto).` });
    return;
  }

  // 4. Update the selection
  const [file] = await db
    .update(deliveryFilesTable)
    .set({ selected: parsed.data.selected })
    .where(eq(deliveryFilesTable.id, params.data.id))
    .returning();

  // 5. Recalculate selection count to see if we reached the quota
  const updatedSelectedRawFiles = await db
    .select()
    .from(deliveryFilesTable)
    .where(
      and(
        eq(deliveryFilesTable.bookingId, bookingId),
        eq(deliveryFilesTable.folderType, "raw"),
        eq(deliveryFilesTable.selected, true)
      )
    );

  const newSelectedCount = updatedSelectedRawFiles.length;

  // If the quota is filled, automatically transition booking status to "editing"
  if (newSelectedCount === maxPhotos && booking.status !== "editing" && booking.status !== "delivered" && booking.status !== "closed") {
    await db
      .update(bookingsTable)
      .set({ status: "editing" })
      .where(eq(bookingsTable.id, bookingId));
  }

  res.json(ToggleFileSelectionResponse.parse(file));
});

export default router;
