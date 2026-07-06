import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  bookingsTable,
  clientsTable,
  packagesTable,
  categoriesTable,
  teamMembersTable,
  addOnsTable,
  invoicesTable,
  deliveryFilesTable,
  type Booking,
} from "@workspace/db";

export async function shapeBookingListItem(booking: Booking) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, booking.clientId));
  const [pkg] = booking.packageId
    ? await db.select().from(packagesTable).where(eq(packagesTable.id, booking.packageId))
    : [null];
  return {
    id: booking.id,
    clientId: booking.clientId,
    clientName: client?.name ?? "",
    categoryId: booking.categoryId,
    packageId: booking.packageId,
    packageName: pkg?.name ?? "",
    eventDate: booking.eventDate,
    locationName: booking.locationName,
    locationAddress: booking.locationAddress,
    mapsLink: booking.mapsLink,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    clientOrigin: booking.clientOrigin,
    specialRequest: booking.specialRequest,
    googleDriveLink: booking.googleDriveLink,
    detectSubfolder: booking.detectSubfolder,
    whatsappClient: booking.whatsappClient,
    whatsappAdmin: booking.whatsappAdmin,
    maxPhotos: booking.maxPhotos,
    pilihFotoEnabled: booking.pilihFotoEnabled,
    downloadFotoEnabled: booking.downloadFotoEnabled,
    pilihFotoDuration: booking.pilihFotoDuration,
    downloadFotoDuration: booking.downloadFotoDuration,
    pilihFotoPassword: booking.pilihFotoPassword,
    downloadFotoPassword: booking.downloadFotoPassword,
    pilihFotoTambahanEnabled: booking.pilihFotoTambahanEnabled,
    pilihFotoCetakEnabled: booking.pilihFotoCetakEnabled,
    createdAt: booking.createdAt,
  };
}

export async function shapeBookingListItems(bookings: Booking[]) {
  if (bookings.length === 0) return [];
  const clientIds = [...new Set(bookings.map((b) => b.clientId))];
  const packageIds = [...new Set(bookings.map((b) => b.packageId).filter((id): id is number => id !== null))];
  const clients = await db.select().from(clientsTable).where(inArray(clientsTable.id, clientIds));
  const packages = packageIds.length
    ? await db.select().from(packagesTable).where(inArray(packagesTable.id, packageIds))
    : [];
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const packageMap = new Map(packages.map((p) => [p.id, p]));
  return bookings.map((booking) => ({
    id: booking.id,
    clientId: booking.clientId,
    clientName: clientMap.get(booking.clientId)?.name ?? "",
    categoryId: booking.categoryId,
    packageId: booking.packageId,
    packageName: booking.packageId ? (packageMap.get(booking.packageId)?.name ?? "") : "",
    eventDate: booking.eventDate,
    locationName: booking.locationName,
    locationAddress: booking.locationAddress,
    mapsLink: booking.mapsLink,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    clientOrigin: booking.clientOrigin,
    specialRequest: booking.specialRequest,
    googleDriveLink: booking.googleDriveLink,
    detectSubfolder: booking.detectSubfolder,
    whatsappClient: booking.whatsappClient,
    whatsappAdmin: booking.whatsappAdmin,
    maxPhotos: booking.maxPhotos,
    pilihFotoEnabled: booking.pilihFotoEnabled,
    downloadFotoEnabled: booking.downloadFotoEnabled,
    pilihFotoDuration: booking.pilihFotoDuration,
    downloadFotoDuration: booking.downloadFotoDuration,
    pilihFotoPassword: booking.pilihFotoPassword,
    downloadFotoPassword: booking.downloadFotoPassword,
    pilihFotoTambahanEnabled: booking.pilihFotoTambahanEnabled,
    pilihFotoCetakEnabled: booking.pilihFotoCetakEnabled,
    createdAt: booking.createdAt,
  }));
}

export async function shapeBookingDetail(booking: Booking) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, booking.clientId));
  const [pkg] = booking.packageId
    ? await db.select().from(packagesTable).where(eq(packagesTable.id, booking.packageId))
    : [null];
  const teamMembers = booking.teamMemberIds.length
    ? await db.select().from(teamMembersTable).where(inArray(teamMembersTable.id, booking.teamMemberIds))
    : [];
  const addOns = booking.addOnIds.length
    ? await db.select().from(addOnsTable).where(inArray(addOnsTable.id, booking.addOnIds))
    : [];
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.bookingId, booking.id));
  const files = await db.select().from(deliveryFilesTable).where(eq(deliveryFilesTable.bookingId, booking.id));

  return {
    ...(await shapeBookingListItem(booking)),
    client: client
      ? {
          id: client.id,
          name: client.name,
          email: client.email,
          whatsapp: client.whatsapp,
          city: client.city,
          province: client.province,
          country: client.country,
          clientOrigin: client.clientOrigin,
          notes: client.notes,
          createdAt: client.createdAt,
        }
      : null,
    package: pkg
      ? {
          id: pkg.id,
          categoryId: pkg.categoryId,
          name: pkg.name,
          description: pkg.description,
          price: Number(pkg.price),
          includedEditedPhotos: pkg.includedEditedPhotos,
          estimatedDays: pkg.estimatedDays,
          createdAt: pkg.createdAt,
        }
      : null,
    teamMembers,
    addOns: addOns.map((a) => ({ ...a, price: Number(a.price) })),
    moodboardLinks: booking.moodboardLinks,
    invoice: invoice
      ? {
          id: invoice.id,
          bookingId: invoice.bookingId,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client?.name ?? "",
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          subtotal: Number(invoice.subtotal),
          total: Number(invoice.total),
          paidAmount: Number(invoice.paidAmount),
          status: invoice.status,
        }
      : null,
    files,
  };
}

export async function shapeInvoiceListItem(invoiceId: number) {
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
  if (!invoice) return null;
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, invoice.bookingId));
  const client = booking ? (await db.select().from(clientsTable).where(eq(clientsTable.id, booking.clientId)))[0] : undefined;
  return {
    id: invoice.id,
    bookingId: invoice.bookingId,
    invoiceNumber: invoice.invoiceNumber,
    clientName: client?.name ?? "",
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: Number(invoice.subtotal),
    total: Number(invoice.total),
    paidAmount: Number(invoice.paidAmount),
    status: invoice.status,
  };
}

export function computeInvoiceStatus(total: number, paidAmount: number): "unpaid" | "partial" | "paid" {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  return "partial";
}
