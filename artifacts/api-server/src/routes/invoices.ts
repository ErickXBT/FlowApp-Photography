import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, invoicesTable, bookingsTable } from "@workspace/db";
import {
  ListInvoicesResponse,
  GetInvoiceParams,
  GetInvoiceResponse,
  UpdateInvoicePaymentParams,
  UpdateInvoicePaymentBody,
  UpdateInvoicePaymentResponse,
} from "@workspace/api-zod";
import { shapeInvoiceListItem, shapeBookingListItem, computeInvoiceStatus } from "../lib/shape";
import { requireVendor } from "../lib/auth";

const router: IRouter = Router();
router.use(requireVendor);

router.get("/invoices", async (_req, res): Promise<void> => {
  const invoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.issueDate));
  const shaped = (await Promise.all(invoices.map((i) => shapeInvoiceListItem(i.id)))).filter((x) => x !== null);
  res.json(ListInvoicesResponse.parse(shaped));
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, invoice.bookingId));
  const listItem = await shapeInvoiceListItem(invoice.id);
  res.json(
    GetInvoiceResponse.parse({
      ...listItem,
      lineItems: invoice.lineItems,
      booking: booking ? await shapeBookingListItem(booking) : null,
    }),
  );
});

router.patch("/invoices/:id/payment", async (req, res): Promise<void> => {
  const params = UpdateInvoicePaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInvoicePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const status = computeInvoiceStatus(Number(existing.total), parsed.data.paidAmount);
  const [invoice] = await db
    .update(invoicesTable)
    .set({ paidAmount: String(parsed.data.paidAmount), status })
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (status === "partial") {
    await db.update(bookingsTable).set({ status: "dp_paid" }).where(eq(bookingsTable.id, invoice.bookingId));
  } else if (status === "paid") {
    await db.update(bookingsTable).set({ status: "fully_paid" }).where(eq(bookingsTable.id, invoice.bookingId));
  }

  const listItem = await shapeInvoiceListItem(invoice.id);
  res.json(UpdateInvoicePaymentResponse.parse(listItem));
});

export default router;
