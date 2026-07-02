import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, users, tenants } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser) {
    res.status(409).json({ error: "Email sudah terdaftar" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: "vendor", tenantId: null })
    .returning();

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.tenantId = user.tenantId ?? null;
  req.session.name = user.name;
  req.session.email = user.email;

  req.log.info({ userId: user.id, role: user.role }, "User registered");
  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId ?? null,
    tenant: null,
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  let tenantData = null;
  if (user.tenantId) {
    const [t] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    tenantData = t ?? null;
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.tenantId = user.tenantId ?? null;
  req.session.name = user.name;
  req.session.email = user.email;

  req.log.info({ userId: user.id, role: user.role }, "User logged in");
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId ?? null,
    tenant: tenantData,
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Session invalid" });
    return;
  }

  let tenantData = null;
  if (user.tenantId) {
    const [t] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    tenantData = t ?? null;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId ?? null,
    tenant: tenantData,
  });
});

export default router;
