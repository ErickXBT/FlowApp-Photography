import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
    tenantId: number | null;
    name: string;
    email: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId || req.session.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function requireVendor(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId || req.session.role !== "vendor") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
