import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = connectPgSimple(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// NOTE: /uploads is intentionally public for studio banners, profile photos, dress
// catalog images, and gallery media displayed on public landing pages.
// Sensitive client deliverable files (raw/edited photos) are served via the
// authenticated /api/bookings/:id/files endpoint – do NOT store those here.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: (() => {
      const s = process.env["SESSION_SECRET"];
      if (!s) throw new Error("SESSION_SECRET environment variable is required");
      return s;
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  }),
);

app.use("/api", router);

export default app;
