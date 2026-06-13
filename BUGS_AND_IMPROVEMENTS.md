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

**Status:** `TODO`

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

**Status:** `TODO`

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

**Status:** `TODO`

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

**Status:** `TODO`

---

### ISSUE-2 — Shopify query hard-capped at 50 orders, no pagination
**File:** `app/api/sales/route.ts` line 73  
**Severity:** Medium — designers with > 50 orders in the date window will see incomplete sales data silently.

```ts
const data = await shopifyGraphQL<ShopifyResp>(QUERY, { first: 50, query: q });
```

Also, line 52 uses a magic number `864e5` (milliseconds/day). Should be a named constant.

**Status:** `TODO`

---

### ISSUE-3 — Large dead code block in `lib/auth.ts`
**File:** `lib/auth.ts` lines 1–97  
**Severity:** Low — 97 lines of commented-out NextAuth v4 config. Adds noise; the live v5 config starts at line 99. Safe to delete.

**Status:** `TODO`

---

### ISSUE-4 — `auth/register/page.tsx` is mostly commented out
**File:** `app/auth/register/page.tsx`  
The register page UI is commented out. The API route (`/api/auth/register`) is fully functional. The page needs to be wired up so users can actually register via the UI.

**Status:** `TODO`

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

**Status:** `TODO`

---

## Security Notes

### SEC-1 — NEXTAUTH_SECRET appears to be a placeholder
**File:** `.env`  
The value `generate_a_strong_secret` looks like it was never replaced with an actual secret. Run `openssl rand -base64 32` and replace it. A weak/known secret breaks JWT signing.

### SEC-2 — `.env` must not be committed
Ensure `.env` is in `.gitignore` (it should be — verify). If any credentials were ever committed, rotate them:
- `DATABASE_URL` (Prisma Accelerate token)
- `SHOPIFY_ADMIN_ACCESS_TOKEN`
- `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `BREVO_API_KEY`
- `PRINTIFY_API_KEY`
- `NEXTAUTH_SECRET`

### SEC-3 — `NEXT_PUBLIC_APP_URL` not set
**File:** `app/api/auth/forgot/route.ts` line 36  
Password reset email links fall back to `VERCEL_URL` or `http://localhost:3000`. On production this will send reset links pointing to localhost unless `NEXT_PUBLIC_APP_URL` is explicitly set in the deployment env.

---

## Improvements Backlog

| # | Area | Description |
|---|---|---|
| I-1 | Sales | Add cursor-based pagination to Shopify query |
| I-2 | Sales | Add `?from=` / `?to=` date range params |
| I-3 | Dashboard | Wire up KPI cards (currently show "—") |
| I-4 | Designer | Add loading skeleton instead of plain "Loading..." during Konva bundle load |
| I-5 | Auth | Rate-limit `/api/auth/register` and `/api/auth/forgot` endpoints |
| I-6 | Errors | Add structured error logging (e.g., Sentry) — currently only `console.error` |
| I-7 | Config | Re-enable ESLint during builds (`eslint: { ignoreDuringBuilds: false }`) |
| I-8 | Printify | Confirm correct MIN_W/MIN_H for print quality (BUG-1 is blocking I-8) |

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
