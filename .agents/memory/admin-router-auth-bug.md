---
name: Admin router auth bug
description: router.use(middleware) without a path prefix in a sub-router intercepts ALL requests through the main router, not just routes defined in that sub-router.
---

## The Rule
Never use `router.use(authMiddleware)` at the top of a sub-router that is mounted without a path prefix in the main router. Use per-route middleware instead: `router.get("/path", middleware, handler)`.

**Why:** When the main router does `mainRouter.use(subRouter)` (no path), Express passes EVERY request to `subRouter`. If `subRouter` has `router.use(requireSuperAdmin)` at the top, `requireSuperAdmin` runs for ALL requests — including routes meant for other routers. Since `requireSuperAdmin` calls `res.status(403).json(...)` without calling `next()`, it terminates ALL requests for non-admin users before they ever reach the correct router.

**How to apply:** For any sub-router that needs role-based auth, apply middleware per-route:
```ts
router.get("/admin/stats", requireSuperAdmin, handler);
router.post("/admin/tenants", requireSuperAdmin, handler);
```
OR mount the sub-router with a path prefix and strip the prefix from route definitions:
```ts
// index.ts
mainRouter.use("/admin", adminRouter);
// admin.ts (routes become /stats, /tenants etc.)
router.get("/stats", requireSuperAdmin, handler);
```
