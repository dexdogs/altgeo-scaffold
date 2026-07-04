# AltGeo Scaffold

A reusable, fork-friendly template for a **geospatial alternative-data app**.
Mapbox front end on Vercel, a database-agnostic backend behind a single adapter
interface, and one frozen schema contract — `schema_core` — that every fork
shares. Drop any environmental domain (carbon, water, energy, climate risk,
data centers) into the same skeleton with minimal changes.

Working project context: **dexdogs.earth**.

> The **schema is the deliverable**. Map polish and data volume are secondary.
> All bundled data is **synthetic placeholder** data.

## Quickstart (boots with zero database)

```bash
git clone <your-fork-url> && cd altgeo-scaffold
npm install
cp .env.example .env.local     # add your NEXT_PUBLIC_MAPBOX_TOKEN
npm run dev                    # http://localhost:3000
```

A fresh fork runs against the seed CSVs in `schema/seed/` — the flat-sheet
fallback is the default boot state, so you see a working map before touching a
database.

## Go live on a real database

1. Run `schema/core/001_schema_core.sql` on your Supabase/Postgres project.
2. (Optional) apply `schema/extensions/010_postgis.sql` and `020_domains.sql`.
3. Set `DB_BACKEND=supabase` (or `postgres`) plus the matching credentials.
4. Deploy to Vercel — Next.js App Router needs no extra config.

**Swapping databases is one env var.** The app only talks to a `DataAdapter`,
never to a database directly.

```
DB_BACKEND=csv       ->  reads schema/seed/*.csv   (default, offline)
DB_BACKEND=supabase  ->  Supabase/Postgres
DB_BACKEND=postgres  ->  any Postgres via DATABASE_URL
```

## Architecture

```
Mapbox map (components/Map.tsx)
      │  fetches
      ▼
/app/api/assets  ──►  makeAdapter()  ──►  ┌ CsvAdapter      (schema/seed/*.csv)
                                          ├ SupabaseAdapter
                                          └ PostgresAdapter
                                                 │ all satisfy
                                                 ▼
                                          schema_core (the contract)
```

## `schema_core` in one breath

Five tables, long/tidy, plain scalar types, portable text IDs:

```
sources ──< observations >── metrics
                 │
                 ▼
              assets ──> regions (optional)
```

- **Only coordinates + primary keys are mandatory.** Everything else defaults
  to `N/A`, and the app renders missing values as `—`, so incomplete data never
  breaks the map. Un-pinnable assets (no coordinates) are skipped and counted,
  not crashed on.
- **Location is derived from coordinates.** `scripts/geocode.ts` reverse-geocodes
  lat/lng into `country`/`admin1`/`place_name` at ingestion (via Mapbox) and
  stores plain text — identical across every backend.
- **The schema expands via `schema/extensions/`** — additive only, never
  altering core. See `schema/core/README.md` for the extension rules.

## Repo map

```
schema/core/         # schema_core: DDL, JSON manifest, contract README
schema/extensions/   # additive schema_ext_* (PostGIS, domain metrics)
schema/seed/         # synthetic CSVs — one sheet per table
adapters/            # DataAdapter interface + csv/supabase/postgres
scripts/geocode.ts   # coordinates -> location text, at ingestion
app/                 # Next.js App Router (page + /api/assets)
components/Map.tsx    # Mapbox GL map
```

## License

MIT — fork freely.
