---
name: Uploads public access model
description: Decision on which files are served publicly vs behind auth in FlowApp.
---

**Rule:** `/uploads` directory is served publicly via `express.static`. Only studio branding assets go here: banner, profile photo, dress catalog images, gallery media.

**Why:** These assets appear on public landing pages (/p/:slug) that unauthenticated visitors see.

**How to apply:** Never store client deliverables (raw/edited photos, video teasers) in /uploads. Those must be stored via /api/bookings/:id/files (requireAuth protected). If private storage is ever needed, implement signed URL generation.
