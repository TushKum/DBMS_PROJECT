# STOCK.FLIX

A Netflix-styled, multi-platform stock aggregator for streetwear and Y2K
clothing. The dashboard answers a single question fast: **for any given
drop, what is in stock and at what price across every platform that sells
it?** It currently ingests from Myntra, Flipkart, Ajio, The Souled Store,
Bewakoof, and Everdeon.

This is also a relational database project: the schema, triggers, and
stored procedures are first-class artifacts and can be inspected under
[`db/`](./db).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [How to Launch](#how-to-launch)
5. [Daily Development Workflow](#daily-development-workflow)
6. [Database](#database)
7. [API Reference](#api-reference)
8. [Frontend Overview](#frontend-overview)
9. [Configuration](#configuration)
10. [Deployment to Vercel](#deployment-to-vercel)
11. [Troubleshooting](#troubleshooting)
12. [Scripts Reference](#scripts-reference)

---

## Tech Stack

| Layer            | Choice                              | Notes                                                                  |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Frontend         | Next.js 16 (App Router) + Turbopack | Server Components for data fetching, Client Components for overlays    |
| Styling          | Tailwind CSS v4                     | Zinc-950 dark theme, no design-system dependency                       |
| Animation        | Framer Motion                       | Card hover scale, drawer slide, modal fade                             |
| Database         | MySQL 8.4                           | Run locally in Docker; production target is TiDB Cloud Serverless      |
| Driver           | `mysql2/promise`                    | Raw SQL only, no ORM, parameterised queries                            |
| Container runtime| Docker + Docker Compose             | The DB lifecycle is owned by `compose.yaml`                            |
| Config           | `vercel.ts`                         | Typed Vercel project config (cron schedule, headers)                   |
| Auth             | None (v1)                           | Movement audit trail uses an `x-staff-id` header for traceability      |

There is **no ORM** and **no separate backend process**. The Next.js server
runtime owns both rendering and the API routes that talk to MySQL.

---

## Project Structure

```
DBMS_PROJECT/
  app/                              Next.js App Router (must live at repo root)
    layout.tsx                      Root layout, mounts <AppShell/>
    page.tsx                        Server-rendered dashboard, calls server/queries
    globals.css                     Tailwind v4 entry
    api/
      products/route.ts             GET list, POST create
      products/[id]/route.ts        GET, PATCH, DELETE
      products/[id]/full/route.ts   Combined product + per-platform availability
      products/[id]/availability/route.ts
      inventory/route.ts            GET nodes, POST new variant
      movements/route.ts            GET list, POST SALE | RESTOCK | TRANSFER
      trending/route.ts             Returns the 4 dashboard rows in one call
      search/route.ts               FULLTEXT + LIKE search
      suppliers/route.ts            GET supplier list with reliability + lead time
      platforms/route.ts            GET platforms with stock summary
      cron/reorder-suggestions/route.ts   Daily job target (calls stored proc)

  client/                           Everything that renders in the browser
    components/
      AppShell.tsx                  Wraps every page; mounts header, drawers, modal
      Header.tsx                    Logo, nav buttons, search trigger
      HeroSection.tsx               Top-of-fold "Hyped Drop" panel
      ContentRow.tsx                Horizontal scroller for cards
      ProductCard.tsx               Individual card with hover availability summary
      ProductModal.tsx              Centered floating product detail overlay
      Drawer.tsx                    Generic right-side slide-in primitive
      InventoryDrawer.tsx           Variant table grouped by platform
      MovementsDrawer.tsx           Time-ordered stock-event feed
      SuppliersDrawer.tsx           Supplier cards with reliability scoring
      SearchPopover.tsx             Header-anchored search dropdown
    lib/
      UIContext.tsx                 React Context: drawer / modal / search state
      fetchers.ts                   Typed fetch helpers for the API surface

  server/                           Server-only code (mysql2 lives here)
    db.ts                           Lazy connection pool, query/execute/withTransaction
    queries.ts                      Higher-level queries used by routes and the page
    types.ts                        Shared types (used by both client and server)

  db/                               SQL artifacts; mounted as init scripts on first boot
    00_create_localhost_user.sql    Fixes MySQL localhost user for TCP connections
    01_schema.sql                   Tables, indexes, FK constraints, FULLTEXT
    02_triggers.sql                 Scarcity flag + oversell guard
    03_procedures.sql               Velocity/reorder calc + atomic sale/restock
    04_seed.sql                     Demo data (Y2K + streetwear catalog)

  scripts/
    db-setup.mjs                    Re-seed helper for an existing volume

  compose.yaml                      Docker Compose: spins up MySQL + Next.js app
  Dockerfile                       Multi-stage build for production Docker image
  .dockerignore                    Excludes node_modules, .git, etc from build
  vercel.ts                         Production deploy config + cron schedule
  next.config.ts                    Next.js config (image domains, externals)
  postcss.config.mjs                Tailwind v4 postcss entry
  tsconfig.json                     Path aliases include @/client, @/server, @/app
  package.json                      Scripts; `npm run dev` is the canonical entry
```

The split between `client/` and `server/` is **organisational, not runtime**.
TypeScript path aliases (`@/client/*`, `@/server/*`) make the boundary
explicit, but everything still runs inside one Next.js process.

---

## Prerequisites

### For Full Docker (Option 1)
| Tool      | Minimum version | Check                       |
| --------- | --------------- | --------------------------- |
| Docker    | 24.x            | `docker --version`          |
| Docker Compose | v2         | `docker compose version`    |

No Node.js or MySQL needed on your machine.

### For Local Dev (Option 2)
| Tool      | Minimum version | Check                       |
| --------- | --------------- | --------------------------- |
| Node.js   | 20.x (24.x LTS recommended) | `node --version` |
| npm       | 10.x            | `npm --version`             |
| Docker    | 24.x            | `docker --version`          |
| Docker Compose | v2 (built into Docker Desktop / Docker Engine) | `docker compose version` |

You do not need a local MySQL install or any cloud account to run this
project for development.

---

## How to Launch

### Option 1: Full Docker (Recommended for production-like testing)

Everything runs in Docker — no Node.js or local MySQL required on your machine.

```bash
git clone <this-repo>
cd DBMS_PROJECT
docker compose up -d --build
```

Access at **http://127.0.0.1:3000**

This starts:
- `stockflix-app` — Next.js production build
- `stockflix-mysql` — MySQL 8.4 with schema + seed

**Stop:**
```bash
docker compose down              # keeps data
docker compose down -v          # wipe data
```

---

### Option 2: Local dev with npm (Hot reload)

For active development with hot reload.

```bash
git clone <this-repo>
cd DBMS_PROJECT
npm install
npm run dev
```

What `npm run dev` actually does:

1. Runs the `predev` hook, which executes `npm run db:up`.
2. `db:up` calls `docker compose up -d --wait`, which:
   - Pulls the `mysql:8.4` image (first time only)
   - Starts the `stockflix-mysql` container
   - Mounts every file in `db/` to MySQL's `/docker-entrypoint-initdb.d/`
   - On a fresh volume, MySQL automatically applies schema, triggers,
     procedures, and the demo seed before accepting connections
   - Blocks until the healthcheck (`mysqladmin ping`) reports healthy
3. Starts Next.js with Turbopack on `http://localhost:3000`.

When the page loads, four data-driven rows render and the header nav,
search, and product modals are immediately functional.

### Subsequent launches

After the first run, the named Docker volume `stockflix_mysql_data`
holds your data. Each subsequent `npm run dev` simply re-attaches the
running container and starts Next.js. No re-seed.

### Stopping

| Goal                                          | Command                          |
| --------------------------------------------- | -------------------------------- |
| Stop the dev server                           | `Ctrl-C` in the terminal         |
| Stop the database, keep its data              | `npm run db:down`                |
| Stop the database and wipe its data           | `npm run db:reset` (then up)     |
| Tail database logs                            | `npm run db:logs`                |
| Open an interactive `mysql` shell on the DB   | `npm run db:shell`               |

---

## Daily Development Workflow

```bash
npm run dev               # Start everything (DB autostarts via predev)
npm run db:shell          # Run ad-hoc SQL against the dev database
npm run db:reset          # Wipe volume and re-seed from db/*.sql
npm run db:logs           # Follow mysqld logs
npx tsc --noEmit          # Type-check without emitting
npm run build             # Production Next.js build
```

Code changes hot-reload via Turbopack. Schema changes require either
`npm run db:reset` (destructive) or a hand-written migration applied
via `npm run db:setup` (which re-runs all `db/*.sql` against the
existing volume).

### Editing the schema

1. Modify `db/01_schema.sql` (and/or `02_triggers.sql`, `03_procedures.sql`).
2. Run `npm run db:reset` to apply on a clean volume, OR run
   `npm run db:setup` to apply against the existing one (be aware of
   destructive consequences for `DROP TABLE` etc.).
3. Update [`server/types.ts`](./server/types.ts) to match.
4. Update affected queries in [`server/queries.ts`](./server/queries.ts)
   and route handlers under [`app/api/`](./app/api).

---

## Database

### Entity relationships

```
categories ───┐
              │
              v
        ┌── products ──┐
        │              │
        │              v
        │        product_sourcing ───> suppliers
        │
        v
    inventory_nodes ──> platforms
        │
        v
    movements ──> users
```

### Tables

| Table              | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `categories`       | Top-level grouping (Tops, Bottoms, Outerwear, Footwear, Accessories)     |
| `users`            | Audit trail for `movements` (no auth in v1)                              |
| `platforms`        | Storefronts: `MARKETPLACE` (Myntra, Flipkart, Ajio) or `BRAND_DTC` (TSS, Bewakoof, Everdeon) |
| `suppliers`        | Brand partners, with lead time and reliability score                     |
| `products`         | Master catalog; FULLTEXT index on (name, description, brand)             |
| `inventory_nodes`  | Stock of (product, size, color) on a specific platform; carries platform-specific price + product URL |
| `movements`        | Stock-change events: SALE, RESTOCK, RETURN, TRANSFER, ADJUSTMENT         |
| `product_sourcing` | M:N junction between `products` and `suppliers`                          |

### Triggers

| Trigger                          | Fires on                          | Purpose                                                                                       |
| -------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `trg_inventory_before_insert`    | `BEFORE INSERT inventory_nodes`   | Rejects negative quantities; auto-sets `is_low_stock` flag                                    |
| `trg_inventory_before_update`    | `BEFORE UPDATE inventory_nodes`   | Same guard plus the "Scarcity Trigger" — flips `is_low_stock` whenever quantity crosses the reorder threshold |

### Stored procedures

| Procedure                              | Signature                                                                              | What it does                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `sp_record_sale`                       | `(IN node_id INT, IN qty INT, IN user_id INT, OUT movement_id BIGINT)`                  | Row-locks the inventory node (`SELECT ... FOR UPDATE`), validates stock, decrements, inserts movement, all inside one transaction. Throws SQLSTATE 45000 with `INSUFFICIENT_STOCK` on oversell. |
| `sp_record_restock`                    | `(IN node_id INT, IN qty INT, IN user_id INT, OUT movement_id BIGINT)`                  | Same atomicity, increments quantity instead.                                                                  |
| `sp_calculate_reorder_suggestions`     | `(IN window_days INT)`                                                                  | Computes daily sales velocity per product over the window, joins with primary supplier lead time, returns suggested reorder quantity to cover lead time × 1.5. |

The Next.js routes invoke `sp_record_sale` and `sp_record_restock` for
SALE/RESTOCK actions; TRANSFER is handled application-side using
`withTransaction` plus explicit `FOR UPDATE` row locks.

---

## API Reference

All routes are dynamic (no caching). Bodies and responses are JSON.
Everything lives under `/api`.

| Method | Path                                       | Description                                            |
| ------ | ------------------------------------------ | ------------------------------------------------------ |
| GET    | `/api/products`                            | List products with aggregated stock; query: `limit`, `offset`, `category_id` |
| POST   | `/api/products`                            | Create a product                                       |
| GET    | `/api/products/[id]`                       | Single product                                         |
| PATCH  | `/api/products/[id]`                       | Partial update                                         |
| DELETE | `/api/products/[id]`                       | Delete                                                 |
| GET    | `/api/products/[id]/full`                  | Product + per-platform availability (used by modal)    |
| GET    | `/api/products/[id]/availability`          | Just the availability list                             |
| GET    | `/api/inventory`                           | Variants; query: `product_id`, `platform_id`, `low_stock=true` |
| POST   | `/api/inventory`                           | Add a variant                                          |
| GET    | `/api/movements`                           | Recent stock events; query: `limit`, `product_id`      |
| POST   | `/api/movements`                           | Record SALE / RESTOCK / TRANSFER                       |
| GET    | `/api/trending`                            | Returns `highVelocity`, `lowStock`, `recentlyRestocked`, `byCategory` rows in one call |
| GET    | `/api/search`                              | Full-text + prefix search; query: `q`                  |
| GET    | `/api/suppliers`                           | Suppliers with `products_supplied` count               |
| GET    | `/api/platforms`                           | Platforms with `products_listed` and `in_stock_variants` counts |
| GET    | `/api/cron/reorder-suggestions`            | Calls `sp_calculate_reorder_suggestions(14)`; protected by `CRON_SECRET` if set |

### Recording a movement

```bash
# Record a sale (decrements inventory, validates stock, returns 409 INSUFFICIENT_STOCK if not enough)
curl -X POST http://localhost:3000/api/movements \
  -H 'content-type: application/json' \
  -H 'x-staff-id: 2' \
  -d '{"action_type":"SALE","inventory_node_id":1,"quantity":2}'

# Restock
curl -X POST http://localhost:3000/api/movements \
  -H 'content-type: application/json' \
  -d '{"action_type":"RESTOCK","inventory_node_id":7,"quantity":50}'

# Transfer between two nodes
curl -X POST http://localhost:3000/api/movements \
  -H 'content-type: application/json' \
  -d '{"action_type":"TRANSFER","source_node_id":4,"dest_node_id":3,"quantity":5}'
```

---

## Frontend Overview

### Layout

The root layout in [`app/layout.tsx`](./app/layout.tsx) is intentionally
thin. It mounts `<AppShell>`, which lives in
[`client/components/AppShell.tsx`](./client/components/AppShell.tsx) and
provides every overlay used across the app.

### Overlay matrix

| Trigger                         | Overlay                | Component                                                          |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------ |
| Click `STOCK.FLIX` logo         | Closes everything       | `Header`                                                           |
| Click `Dashboard` nav           | Closes everything       | `Header`                                                           |
| Click `Inventory` nav           | Right-side drawer       | `InventoryDrawer`                                                  |
| Click `Activity` nav            | Right-side drawer       | `MovementsDrawer`                                                  |
| Click `Suppliers` nav           | Right-side drawer       | `SuppliersDrawer`                                                  |
| Click search button or press `/`| Anchored popover        | `SearchPopover`                                                    |
| Click any product card          | Centered modal          | `ProductModal`                                                     |
| Click `View Stock` in hero      | Centered modal          | `ProductModal` (for the hyped product)                             |
| Click `Activity Log` in hero    | Right-side drawer       | `MovementsDrawer`                                                  |
| Press `Escape`                  | Closes any open overlay | Global keybinding in `AppShell`                                    |

### State

A single React Context in
[`client/lib/UIContext.tsx`](./client/lib/UIContext.tsx) holds:

- `drawer`: which side drawer is open (or `null`)
- `productId`: which product modal is open (or `null`)
- `searchOpen`: search popover boolean

Setters enforce mutual exclusion (opening a drawer closes any open
modal, etc.).

---

## Configuration

### Environment variables

For local development you do not need to set anything. `server/db.ts` and
`scripts/db-setup.mjs` both fall back to a hardcoded localhost URL that
matches the credentials in `compose.yaml`, so a fresh clone runs without
`.env.local`.

| Variable                         | Local default (no env file needed)               | Production                      |
| -------------------------------- | ------------------------------------------------ | ------------------------------- |
| `DATABASE_URL`                   | `mysql://stockflix:stockflix_pw@127.0.0.1:3306/stockflix` | Cloud DB connection string |
| `DATABASE_SSL`                   | `false`                                          | `true`                          |
| `NEXT_PUBLIC_DEFAULT_STAFF_ID`   | `1`                                              | n/a                             |
| `CRON_SECRET`                    | unset (cron route open)                          | set, used as Bearer token       |

`.env.example` documents the variables for reference. To override the
defaults for local development (e.g. point at a remote dev DB), create
`.env.local` and Next.js will pick it up automatically.

### Vercel project configuration

`vercel.ts` declares:

- The `nextjs` framework
- A daily cron at `04:00 UTC` hitting `/api/cron/reorder-suggestions`
- Cache-Control headers for `/posters/(.*)` (1 day public)

This file replaces the legacy `vercel.json` and is type-checked.

---

## Deployment to Vercel

The local Docker MySQL is for development only. Production must run
against a cloud MySQL with a public TLS endpoint. Recommended path:

### 1. Provision MySQL via Vercel Marketplace

```bash
vercel link                          # connect this repo to a Vercel project
vercel marketplace install           # pick "TiDB Cloud Serverless" — supports stored procs and triggers
vercel env pull .env.local           # writes DATABASE_URL into your local env
```

### 2. Apply schema to the cloud database

```bash
node scripts/db-setup.mjs            # uses DATABASE_URL from .env.local
```

This applies `01_schema.sql` through `04_seed.sql` against the cloud
instance. The seed step is optional; you can skip it with
`node scripts/db-setup.mjs --seed-only` to populate an empty schema, or
simply not run it on production.

### 3. Set production env vars

```bash
vercel env add DATABASE_SSL production       # value: true
vercel env add CRON_SECRET production        # value: any random string
```

### 4. Deploy

```bash
vercel deploy                        # preview
vercel deploy --prod                 # production
```

The `vercel.ts` cron schedule activates only on production deploys.

### Why this works without code changes

`server/db.ts` reads `DATABASE_URL` and `DATABASE_SSL` at runtime. The
local-vs-cloud difference is purely environmental. Same SQL, same
queries, same routes.

---

## Troubleshooting

### `Cannot connect to MySQL` / `ECONNREFUSED 127.0.0.1:3306`

Container is not running or is unhealthy. Check:

```bash
docker compose ps
npm run db:logs
```

If the container is stuck restarting, it usually means an init script
failed. Wipe and retry:

```bash
npm run db:reset
```

### `ports are not available: bind: address already in use`

Another process is using the port. Check:

```bash
lsof -i :3306    # for MySQL
lsof -i :3000   # for the app
```

Kill the conflicting process or change the port in `compose.yaml`.

### `connect ETIMEDOUT` on Linux (Fedora/RHEL)

The default Docker bridge network is dropped by `firewalld` on these
distros. `scripts/docker.mjs` automatically merges `compose.linux.yaml`
on Linux, which switches to host networking. You don't have to do
anything as long as you go through the `npm run db:*` scripts. If you
invoke `docker compose` directly, pass `-f compose.yaml -f compose.linux.yaml`.

### `Permission denied` on init scripts (Fedora/RHEL with SELinux)

The bind mounts in `compose.yaml` use the `:ro,Z` suffix to relabel
files for SELinux. If you've removed that suffix or run with custom
volumes, the container's mysql process won't be able to read the files
in `/docker-entrypoint-initdb.d/`. Restore the `:ro,Z` suffix or run
`chcon -Rt svirt_sandbox_file_t db/` manually.

### Triggers fail to install during seed

You will see `You do not have the SUPER privilege` if the
`log-bin-trust-function-creators` flag is not set. The compose file
sets it via the container `command:` directive. If you bypass compose
and run MySQL elsewhere, set it manually:

```sql
SET GLOBAL log_bin_trust_function_creators = 1;
```

### Search returns nothing for short words

MySQL FULLTEXT has a default minimum token length of 3 characters and a
50%-of-rows stopword threshold. The route falls back to `LIKE %q%`
matching for partial-word queries; this should cover most cases. If
you change `innodb_ft_min_token_size`, you must `ALTER TABLE products
DROP INDEX ft_products_search; ALTER TABLE products ADD FULLTEXT
KEY...` to rebuild.

### Hot reload is not picking up SQL changes

`db/*.sql` files are only consumed by MySQL on first boot of an empty
volume. To apply schema changes during development, run
`npm run db:reset` (wipes data) or `npm run db:setup` (re-runs all
SQL against the existing volume; non-idempotent for `INSERT` blocks).

---

## Scripts Reference

### Full Docker (Option 1)
| Command                         | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `docker compose up -d --build`   | Start everything (app + MySQL)       |
| `docker compose down`           | Stop, keep data                      |
| `docker compose down -v`        | Stop and wipe data                   |
| `docker compose logs -f app`    | Follow app logs                      |
| `docker compose logs -f mysql`  | Follow MySQL logs                    |

### Local Dev (Option 2)
| Script              | Command                                                              | Purpose                                                |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| `npm run dev`       | `next dev --turbopack` (with `predev` triggering `db:up`)            | Start everything                                       |
| `npm run build`     | `next build`                                                         | Production build                                       |
| `npm run start`     | `next start`                                                         | Run a built app                                        |
| `npm run db:up`     | `docker compose up -d --wait`                                        | Start DB and block until healthy                       |
| `npm run db:down`   | `docker compose down`                                                | Stop DB, keep volume                                   |
| `npm run db:reset`  | `docker compose down -v && docker compose up -d --wait`              | Wipe volume, re-seed from `db/*.sql`                   |
| `npm run db:logs`   | `docker compose logs -f mysql`                                       | Follow MySQL logs                                      |
| `npm run db:shell`  | `docker exec -it stockflix-mysql mysql -u… -p… stockflix`            | Interactive SQL prompt                                 |
| `npm run db:setup`  | `node scripts/db-setup.mjs`                                          | Apply all `db/*.sql` against current `DATABASE_URL`    |
| `npm run db:seed`   | `node scripts/db-setup.mjs --seed-only`                              | Apply only `04_seed.sql`                               |

---

## License

Internal project. No license declared.
