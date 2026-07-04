# AltGeo Scaffold

A reusable, fork-friendly template for a **geospatial alternative-data app**.
Mapbox front end on Vercel, a database-agnostic backend behind a single adapter
interface, and one frozen schema contract — `schema_core` — that every fork
shares. Drop any environmental domain (carbon, water, energy, climate risk,
data centers) into the same skeleton with minimal changes.

Working project context: **dexdogs.earth**.

> The **schema is the deliverable**. Map polish and data volume are secondary.
> All bundled data is **synthetic placeholder** data.

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

## License

MIT — fork freely.
