---
name: API type gaps in BookingDetail and Invoice
description: Fields that appear in the DB schema but are NOT exposed in the generated API types.
---

**BookingDetail (from useGetBooking):**
- No `bookingCode` → display as `BK-${booking.id}`
- No `muaName`, `hairStylistName` → use `booking.teamMembers[]` (array of TeamMember with `.name` and `.role`)
- No `brideGaun`, `groomGaun` → not exposed from API (dress catalog is separate)
- Has: `id`, `clientId`, `clientName`, `eventDate`, `locationName`, `locationAddress`, `status`, `totalAmount`, `specialRequest`, `client`, `package`, `teamMembers`, `addOns`, `invoice`, `files`

**Invoice:**
- No `addOnsTotal` field → compute from `booking.addOns.reduce((s, a) => s + a.price, 0)`
- Has: `id`, `bookingId`, `invoiceNumber`, `clientName`, `issueDate`, `dueDate`, `subtotal`, `total`, `paidAmount`, `status`

**Why:** The API shape is defined by shapeBookingListItem/shapeBookingDetail in artifacts/api-server/src/lib/shape.ts, not by the DB schema directly. If new fields are needed, update both the shape function AND regenerate the client.
