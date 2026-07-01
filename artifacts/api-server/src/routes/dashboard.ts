import { Router, type IRouter } from "express";
import { gte } from "drizzle-orm";
import { db, bookingsTable, invoicesTable, bookingStatusEnum } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { shapeBookingListItems } from "../lib/shape";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  const invoices = await db.select().from(invoicesTable);

  const totalBookings = bookings.length;
  const now = new Date();
  const upcomingShoots = bookings.filter((b) => new Date(b.eventDate) >= now).length;
  const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);
  const outstandingAmount = invoices.reduce((sum, i) => sum + (Number(i.total) - Number(i.paidAmount)), 0);

  const bookingsByStatus = bookingStatusEnum.map((status) => ({
    status,
    count: bookings.filter((b) => b.status === status).length,
  }));

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const recentBookings = await shapeBookingListItems(recent);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalBookings,
      upcomingShoots,
      totalRevenue,
      outstandingAmount,
      bookingsByStatus,
      recentBookings,
    }),
  );
});

export default router;
