---
name: Reschedule backend contract
description: The reschedule API expects specific field names that differ from intuitive naming.
---

The POST /api/reschedule-requests endpoint (reschedule.ts) destructures:
```
const { bookingId, oldDate, newDate, reason } = req.body
```

**Why:** `oldDate` is stored for audit; `newDate` is later used by PATCH logic to update `bookings.eventDate` when admin approves.

**How to apply:** Any frontend form submitting a reschedule request must send both `oldDate` (current booking.eventDate) and `newDate` (user's requested date). Using `requestedDate` or any other key name silently fails.
