import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveryFilesTable } from "@workspace/db";
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

const router: IRouter = Router();

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

router.patch("/files/:id/selection", async (req, res): Promise<void> => {
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
  const [file] = await db
    .update(deliveryFilesTable)
    .set({ selected: parsed.data.selected })
    .where(eq(deliveryFilesTable.id, params.data.id))
    .returning();
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json(ToggleFileSelectionResponse.parse(file));
});

export default router;
