# `schema_core` — the contract

`schema_core` is the **one thing every fork shares**. It is frozen and
additive-only. Any two apps built on it can share adapters, seed data, and the
map layer even if their domain extensions differ.

## The five tables

```
sources ──< observations >── metrics
                 │
                 v
              assets ──> regions (optional)
```

- **`observations`** is the long/tidy fact table: one row per (asset, metric, timestamp).
- **`assets`** carries location. `latitude`+`longitude` are the source of truth.
- **`sources`**, **`metrics`**, **`regions`** are dimensions.

## Two hard rules

1. **Only coordinates + primary keys are mandatory.**
   `assets.latitude`, `assets.longitude`, and every `*_id` PK are `NOT NULL`.
   You cannot place a map pin without coordinates, and you cannot reference a
   row without an ID. Everything else defaults to `'N/A'`, so an incomplete
   insert still yields a valid, renderable row.

2. **Location is derived, not typed.**
   `country`, `admin1`, `place_name` are filled by reverse-geocoding the
   coordinates at ingestion (see `/scripts/geocode.ts`). The result is written
   as plain text, so a Postgres backend and a flat CSV end up identical.

## How to expand the schema (`schema_ext_*`)

Extensions live in `/schema/extensions/`. They may ONLY:

1. **Add new tables** that FK *into* core (never require core to change), or
2. **Add nullable columns** to core tables, or
3. **Add an optional typed representation** alongside — never replacing — a core column.

They may NEVER alter, rename, retype, or drop anything in core. This is what
keeps every fork plug-compatible.

| You want to… | Do this |
|---|---|
| Add a domain (carbon, water, energy) | Insert rows into `metrics`; optionally add a narrow detail table that FKs into `observations`. |
| Add PostGIS geometry | `010_postgis.sql` — adds a derived `geom` column *beside* lat/lng. |
| Add DB-generated integer keys | Extension only. Core keeps portable text IDs. |
| Enforce strict FKs / real timestamps | Extension only. Core stays flat-sheet-safe. |

## Why text IDs, not auto-increment

Auto-increment is a database feature a flat sheet can't emulate, and two sheets
both minting "asset 5" collide on merge. Stable text IDs (`asset_permian_001`,
`metric_co2e`) are identical in Postgres and CSV, safe to hand-edit, safe to
merge across forks, and self-describing. Portability is the priority, so text
IDs are core; integer keys belong in an extension.
