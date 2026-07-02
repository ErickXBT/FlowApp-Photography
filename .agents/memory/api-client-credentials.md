---
name: API client credentials for session auth
description: Generated API hooks (Orval/custom-fetch) need credentials:"include" as default to send session cookies; otherwise all requests appear unauthenticated.
---

## The Rule
In `lib/api-client-react/src/custom-fetch.ts`, the `fetch` call must default to `credentials: "include"`:

```ts
const response = await fetch(input, { credentials: "include", ...init, method, headers });
```

**Why:** The app uses Express session cookies (`connect-pg-simple`). Browser `fetch` defaults to `credentials: "omit"` for cross-origin or when not specified, meaning session cookies are never sent. All generated hooks that call `customFetch` would receive 401/403 from the API even when the user is logged in.

**How to apply:** Place `credentials: "include"` BEFORE `...init` so callers can still override it by passing `credentials: "omit"` in options if needed.
