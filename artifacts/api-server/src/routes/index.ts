import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import categoriesRouter from "./categories";
import packagesRouter from "./packages";
import addonsRouter from "./addons";
import teamMembersRouter from "./team-members";
import clientsRouter from "./clients";
import bookingsRouter from "./bookings";
import calendarRouter from "./calendar";
import invoicesRouter from "./invoices";
import bookingFilesRouter from "./booking-files";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(categoriesRouter);
router.use(packagesRouter);
router.use(addonsRouter);
router.use(teamMembersRouter);
router.use(clientsRouter);
router.use(bookingsRouter);
router.use(calendarRouter);
router.use(invoicesRouter);
router.use(bookingFilesRouter);

export default router;
