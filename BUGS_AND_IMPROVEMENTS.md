# Zory Studio — Bugs & Improvements Reference

> Working document. Updated as issues are found and fixed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.3 (App Router) |
| Language | TypeScript 5 (strict) |
| React | 19.1.0 |
| Database | PostgreSQL via Prisma Accelerate (edge proxy) |
| ORM | Prisma 6.15.0 |
| Auth | NextAuth v5 (beta.29) — JWT strategy |
| Auth providers | Google OAuth, Email magic link (Brevo), Credentials |
| Canvas | React Konva |
| State | MobX + Zustand |
| UI | Radix UI + Tailwind CSS 4 |
| Image processing | Sharp (server-side) |
| CDN | Cloudinary |
| Print API | Printify |
| E-commerce | Shopify GraphQL |
| Email | Brevo (HTTP API + nodemailer) |

---

## File Map

```
app/
  api/
    auth/
      [...nextauth]/route.ts   — NextAuth handler
      register/route.ts        — Sign-up (Zod + bcryptjs)
      forgot/route.ts          — Password reset: generate token
      reset/route.ts           — Password reset: consume token
      verify/page.tsx          — Magic link landing page
    printify/
      create-product/route.ts
      upload-image/route.ts
      publish/route.ts
      product-created-at-printify/route.ts   ← BUG (see below)
      get-products-by-designer-email/route.ts
    shopify/sales/route.ts
    upload/route.ts
    image-process-upload/route.ts            ← NOTE (min dimensions)
    me/route.ts
    profile/route.ts
    sales/route.ts
  auth/
    signin/  — SignInClient.tsx + page.tsx
    register/page.tsx           ← mostly commented out
    reset/   — resetclient.tsx + page.tsx
  designer/
    dashboard/
      page.tsx
      create-product-tab.tsx
      ProductDesignerClient.tsx
      productDesigner.tsx       — Konva canvas
      profile-tab.tsx
      sales-tab.tsx
      myDesign.tsx
lib/
  auth.ts           — NextAuth config  ← dead commented block
  db.ts             — Prisma singleton ← log level bug
  validation.ts     — Zod schemas
  mailer.ts         — nodemailer + helpers
  token.ts          — SHA-256 token gen
  shopify.ts        — GraphQL helper
  designerStore.ts  — Zustand store
  cloudinary-folder-check.ts
  utils.ts
components/ui/      — Button, Card, Badge, Input, Tabs, Select,
                      Header, HeaderClient, Footer, LogoutButton
prisma/
  schema.prisma
  migrations/ (8 total)
```

---

## Confirmed Bugs

### BUG-1 — Dead DB write + variable shadowing in `product-created-at-printify/route.ts`
**File:** `app/api/printify/product-created-at-printify/route.ts` lines 293–336  
**Severity:** Medium — causes one redundant DB write per view on every webhook call.

**What happens:**  
Inside the `for (const v of views)` loop (line 288), the code first does a manual `findFirst` + `update`/`create` (lines 293–315), storing the result in `const views` — which shadows the outer `views` array variable. That result is then **never used**. The code immediately does a second `tx.view.upsert` (lines 319–336) on the same record and stores the result in `const view`, which is what the rest of the block actually consumes.

**Effect:** Every view in the payload hits the database twice — once uselessly (the `findFirst + update/create` block), once correctly (the `upsert`). The shadowed `views` variable also makes the code very hard to read.

**Fix:** Remove the manual `findFirst`/`update`/`create` block entirely (lines 293–315). Keep only the `upsert` into `const view`.

**Status:** `FIXED`

---

### BUG-2 — Unused import from `zod/locales`
**File:** `app/api/printify/product-created-at-printify/route.ts` line 6  
**Severity:** Low — dead import, causes TS/lint warnings; `id` is never used.

```ts
// BEFORE (line 6)
import { id } from "zod/locales";

// AFTER
// (delete the line)
```

**Status:** `FIXED`

---

### BUG-3 — Prisma query log always enabled (including production)
**File:** `lib/db.ts` line 11  
**Severity:** Low-Medium — `log: ["query"]` dumps every SQL statement to stdout in production, polluting logs and adding overhead.

```ts
// BEFORE
new PrismaClient({ log: ["query"] })

// AFTER
new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query"] : [],
})
```

**Status:** `FIXED`

---

## Code Quality Issues

### ISSUE-1 — Minimum image dimensions silently lowered
**File:** `app/api/image-process-upload/route.ts` lines 9–10  
**Severity:** Medium — print files below Printify's required resolution will be accepted and produce poor-quality output.

```ts
// CURRENT (looks like debug values left in)
const MIN_W = 590;  // was 5907
const MIN_H = 530;  // was 5309
```

The commented-out values (5907 × 5309 px) match Printify's high-res print specs. The current values (590 × 530 px) accept thumbnail-sized images. Verify the correct spec with Printify docs and restore.

**Status:** `FIXED` — restored to 5907×5309.

---

### ISSUE-2 — Shopify query hard-capped at 50 orders, no pagination
**File:** `app/api/sales/route.ts` line 73  
**Severity:** Medium — designers with > 50 orders in the date window will see incomplete sales data silently.

```ts
const data = await shopifyGraphQL<ShopifyResp>(QUERY, { first: 50, query: q });
```

Also, line 52 uses a magic number `864e5` (milliseconds/day). Should be a named constant.

**Status:** `FIXED` — cursor-paginated up to 20 pages (1000 orders) per request via `pageInfo.hasNextPage`/`endCursor`.

---

### ISSUE-3 — Large dead code block in `lib/auth.ts`
**File:** `lib/auth.ts` lines 1–97  
**Severity:** Low — 97 lines of commented-out NextAuth v4 config. Adds noise; the live v5 config starts at line 99. Safe to delete.

**Status:** `FIXED`

---

### ISSUE-4 — `auth/register/page.tsx` is mostly commented out
**File:** `app/auth/register/page.tsx`  
The register page UI is commented out. The API route (`/api/auth/register`) is fully functional. The page needs to be wired up so users can actually register via the UI.

**Status:** `FIXED`

---

### ISSUE-5 — `(user as any)` casts in auth callbacks
**File:** `lib/auth.ts` lines 219–221  
The `user` object returned from the `Credentials` provider has `id` and `role` but NextAuth's `User` type doesn't include them by default. Currently worked around with `as any` casts. The module augmentation at the top of the file already adds `role` to `User`; `id` should be added too to remove the casts.

```ts
declare module "next-auth" {
  interface User {
    id: string;  // add this
    role: "DESIGNER" | "ADMIN";
  }
}
```

**Status:** `FIXED` — `id` added to `User`/`Session` module augmentation; only remaining cast is `db as unknown as PrismaClient` for `PrismaAdapter` (Accelerate-extended client type mismatch, not an `any`).

---

## Security Notes

### SEC-1 — NEXTAUTH_SECRET appears to be a placeholder
**File:** `.env`  
The value `generate_a_strong_secret` looks like it was never replaced with an actual secret. Run `openssl rand -base64 32` and replace it. A weak/known secret breaks JWT signing.

**Status:** `FIXED` — replaced with a generated 32-byte base64 secret. **This value must still be regenerated for the real production deployment** — reuse the local dev secret in prod only if you're okay treating them as the same trust boundary, otherwise generate a fresh one.

### SEC-2 — `.env` must not be committed
Ensure `.env` is in `.gitignore` (it should be — verify). If any credentials were ever committed, rotate them:
- `DATABASE_URL` (Prisma Accelerate token)
- `SHOPIFY_ADMIN_ACCESS_TOKEN`
- `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `BREVO_API_KEY`
- `PRINTIFY_API_KEY`
- `NEXTAUTH_SECRET`

**Status:** `VERIFIED OK` — `.gitignore` has `.env*`. Added `.env.example` as a safe-to-commit template. This project isn't currently a git repo, so there's no history to check — if/when it's pushed, double check `.env` was never staged.

### SEC-3 — `NEXT_PUBLIC_APP_URL` not set
**File:** `app/api/auth/forgot/route.ts` line 36  
Password reset email links fall back to `VERCEL_URL` or `http://localhost:3000`. On production this will send reset links pointing to localhost unless `NEXT_PUBLIC_APP_URL` is explicitly set in the deployment env.

**Status:** `FIXED` — set in `.env` for local dev. **Must also be set in the production hosting env (Netlify) to the real domain.**

### SEC-4 — Printify webhook accepted any unauthenticated POST
**File:** `app/api/printify/product-created-at-printify/route.ts`  
The ingest endpoint wrote to the DB for any POST body with an `id` field — no verification the request actually came from Printify. Anyone with the URL could inject arbitrary product data.

**Status:** `FIXED` — added HMAC-SHA256 signature verification against `X-Pfy-Signature` using `PRINTIFY_WEBHOOK_SECRET` (Printify's real webhook secret — set this when you register the webhook in Printify's dashboard). The internal call from `create-product/route.ts` (which ingests immediately after creating a product, without waiting for the webhook) now authenticates via a separate `PRINTIFY_INGEST_INTERNAL_SECRET` shared secret instead.

### SEC-5 — No rate limiting on auth endpoints
**Files:** `app/api/auth/register/route.ts`, `app/api/auth/forgot/route.ts`, `app/api/auth/reset/route.ts`  
Unlimited requests allowed registration spam, password-reset email flooding, and reset-token brute forcing.

**Status:** `FIXED` — added `lib/rate-limit.ts` (in-memory fixed-window limiter, per-IP). Register/forgot: 5 req/15min; reset: 10 req/15min. Note: in-memory state is per server process — on multi-instance serverless deployments this is best-effort, not a hard guarantee. Move to a shared store (Upstash/Redis) if abuse becomes a real problem in production.

### SEC-6 — No security headers
**File:** `next.config.ts`  
No CSP, HSTS, X-Frame-Options, etc.

**Status:** `FIXED` — added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` via `headers()` in `next.config.ts`. Did not add a Content-Security-Policy — CSP needs to be tuned against actual script/style/image sources (Cloudinary, Google fonts, Konva canvas blobs, etc.) or it'll break the app; worth a follow-up pass.

---

## Improvements Backlog

| # | Area | Description | Status |
|---|---|---|---|
| I-1 | Sales | Add cursor-based pagination to Shopify query | `FIXED` |
| I-2 | Sales | Add `?from=` / `?to=` date range params | TODO |
| I-3 | Dashboard | Wire up KPI cards (currently show "—") | TODO |
| I-4 | Designer | Add loading skeleton instead of plain "Loading..." during Konva bundle load | TODO |
| I-5 | Auth | Rate-limit `/api/auth/register` and `/api/auth/forgot` endpoints | `FIXED` (also added to `/reset`) |
| I-6 | Errors | Add structured error logging (e.g., Sentry) — currently only `console.error` | TODO — needs a Sentry/monitoring account + DSN, not something to wire blind |
| I-7 | Config | Re-enable ESLint during builds (`eslint: { ignoreDuringBuilds: false }`) | TODO — left as-is; flipping this could break the build on pre-existing lint errors, needs a dedicated lint cleanup pass first |
| I-8 | Printify | Confirm correct MIN_W/MIN_H for print quality (BUG-1 is blocking I-8) | `FIXED` |
| I-9 | Errors | Add `app/error.tsx` + `app/not-found.tsx` | `FIXED` |
| I-10 | Testing | No test suite / CI exists (no `*.test.ts`, no `.github/workflows`) | TODO — larger effort, needs a framework decision (Vitest/Jest + Playwright) |

---

## Fix Log

| Date | Bug/Issue | File | Description |
|---|---|---|---|
| 2026-05-24 | BUG-2 | `product-created-at-printify/route.ts` | Removed unused `import { id } from "zod/locales"` |
| 2026-05-24 | BUG-1 | `product-created-at-printify/route.ts` | Removed redundant `findFirst`/`update`/`create` block that shadowed `views` and did a dead DB write before the real `upsert` |
| 2026-05-24 | BUG-3 | `lib/db.ts` | Scoped `log: ["query"]` to development only |
| 2026-05-24 | ISSUE-3 | `lib/auth.ts` | Deleted 97-line commented-out NextAuth v4 config |
| 2026-05-24 | ISSUE-1 | `image-process-upload/route.ts` | Added TODO comment flagging MIN_W/MIN_H need verification against Printify spec |
| 2026-05-24 | — | `app/api/auth/[...nextauth]/route.ts` | Removed all dead commented-out code; file is now one line |
| 2026-05-24 | — | `lib/token.ts` | Removed old Node.js crypto commented block and duplicate `bytesToHex`/`toHex` helpers; condensed to single clean implementation |
| 2026-05-24 | — | `lib/auth.ts` | Added `id: string` to `User` interface and `declare module "next-auth/jwt"` to type JWT token; replaced all `as any` casts in callbacks with typed or narrowly-cast equivalents |
| 2026-05-24 | — | `app/api/me/route.ts` | Removed unused `import NextAuth`, removed dead commented imports, replaced `(session.user as any).id` with `session.user.id` |
| 2026-05-24 | — | `app/api/profile/route.ts` | Removed dead commented imports, replaced `(session.user as any).id` casts with `session.user.id` |
| 2026-05-24 | ISSUE-4 | `app/auth/register/page.tsx` | Removed 185-line commented-out old implementation; extracted `Input` component out of `useMemo` (anti-pattern); fixed broken `/signin` redirect path → `/auth/signin`; auto-redirect after successful registration |
| 2026-05-24 | ISSUE-2 | `app/api/sales/route.ts` | Replaced magic number `864e5` with named constant `MS_PER_DAY` |
| 2026-05-24 | UI | `app/designer/dashboard/page.tsx` | Full dark redesign: fixed dot-grid ambient bg, proper dark KPI strip, clean tab bar, removed all dead commented code, fixed text-black-on-dark-bg issue |
| 2026-05-24 | UI | `app/designer/dashboard/profile-tab.tsx` | Dark glass fields, gradient avatar with initials fallback, section labels, consistent white/opacity color system |
| 2026-05-24 | UI+BUG | `app/designer/dashboard/sales-tab.tsx` | Dark theme, replaced all `alert()` with inline error state, removed dead commented code, better table with hover states, stat cards |
| 2026-05-24 | UI | `app/designer/dashboard/create-product-tab.tsx` | Dark inputs, description textarea, design-ready indicator, better variant buttons, inline feedback |
| 2026-05-24 | UI | `app/designer/dashboard/myDesign.tsx` | Dark cards with hover zoom, replaced Radix Tabs (overkill) with native sort select, dark skeleton, dark tag pills, removed dead code |
| 2026-07-08 | SEC-1/SEC-3 | `.env`, `.env.example` | Replaced placeholder `NEXTAUTH_SECRET` with a generated secret; added `NEXT_PUBLIC_APP_URL`; created `.env.example` template |
| 2026-07-08 | ISSUE-1 | `image-process-upload/route.ts` | Restored `MIN_W`/`MIN_H` to Printify's real print spec (5907×5309) |
| 2026-07-08 | ISSUE-2 | `sales/route.ts` | Added cursor-based pagination over Shopify orders (up to 1000 orders/request) |
| 2026-07-08 | SEC-4 | `product-created-at-printify/route.ts`, `create-product/route.ts` | Added HMAC signature verification for Printify webhook calls; added internal shared-secret auth for the server-to-server ingest call from `create-product` |
| 2026-07-08 | SEC-5 | `lib/rate-limit.ts`, `auth/register`, `auth/forgot`, `auth/reset` | Added in-memory per-IP rate limiting to all three auth endpoints |
| 2026-07-08 | SEC-6 | `next.config.ts` | Added security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) |
| 2026-07-08 | I-9 | `app/error.tsx`, `app/not-found.tsx` | Added global error boundary and 404 page |
| 2026-07-08 | ISSUE-5 | `lib/auth.ts` | Replaced `PrismaAdapter(db as any)` with a narrower `db as unknown as PrismaClient` cast (Accelerate-extended client type mismatch, not a blanket `any`) |
| 2026-07-08 | — | `printify/create-product/route.ts` | Removed leftover debug `console.log` statements (request payload, Printify response) |
| 2026-07-08 | — | `printify/get-products-by-designer-email/route.ts` | Fixed a pre-existing type error that broke `next build` entirely: Prisma Accelerate's `$extends` client drops relation fields from `findMany` select-result types even though the runtime data is correct. Extracted the `select` object with `satisfies Prisma.ProductSelect` and annotated the result with `Prisma.ProductGetPayload<...>` |
