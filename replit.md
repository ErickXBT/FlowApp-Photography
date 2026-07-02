# FlowApp

A SaaS platform for photographers and MUAs — booking engine, CRM, project management, file delivery, and automatic invoicing in one dashboard.

## Run & Operate

- **Frontend** (FlowApp): `pnpm --filter @workspace/flowapp run dev` — React/Vite app
- **API**: `pnpm --filter @workspace/api-server run dev` — Express 5 server (builds then starts)
- Both servers are configured as Replit workflows and start automatically.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to the dev database (run after schema edits)

## Required Environment Variables

- `DATABASE_URL` — auto-provisioned by Replit (do not set manually)
- `SESSION_SECRET` — required secret for signing Express sessions; the API server **fails fast** if absent

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui (artifacts/flowapp)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec in lib/api-spec)
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/flowapp/src/` — React app; pages in `pages/`, components in `components/`
- `artifacts/api-server/src/routes/` — Express route handlers (auth, bookings, dashboard, etc.)
- `lib/db/src/schema/` — Drizzle schema files (source of truth for DB shape)
- `lib/api-spec/` — OpenAPI spec; run codegen after editing it
- `lib/api-client-react/` — generated TanStack Query hooks
- `lib/api-zod/` — generated Zod schemas

## Architecture decisions

- `users.tenantId` is a nullable integer FK to `tenants.id`; new vendors register without a tenant and get one assigned after onboarding.
- Sessions are stored in PostgreSQL via `connect-pg-simple`; `SESSION_SECRET` is mandatory at startup (fail-fast).
- The API server is built to CJS via esbuild before each `dev` run — TypeScript is not executed directly.
- The Vite dev server proxies `/api/*` to the API server (port 5000 in dev).

## Product

FlowApp is a multi-tenant SaaS for photography studios and MUAs. Vendors manage bookings, team members, dress catalogs, and client file delivery. Clients book via a branded landing page, track their booking status, and select/download delivered photos.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema change before restarting the API server.
- The API server's `dev` script does a full esbuild before starting — type errors will surface here.
- `DATABASE_URL` and other `PG*` vars are runtime-managed by Replit; do not set them manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
