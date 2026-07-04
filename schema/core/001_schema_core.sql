-- =============================================================
-- schema_core v1  —  THE CONTRACT.  Frozen. Additive-only.
-- =============================================================
-- Portability rules honored here:
--   * Plain scalar types only (TEXT / NUMERIC). No backend-specific types.
--   * Every table = one CSV sheet. Every FK = a shared ID column.
--   * ONLY coordinates + primary keys are mandatory. Everything else
--     defaults to 'N/A' so an incomplete row never breaks an insert.
--   * Timestamps are stored as ISO-8601 TEXT so the string 'N/A' is legal
--     in a flat sheet. (True TIMESTAMP typing belongs in an extension.)
--   * latitude/longitude are the SINGLE source of truth for location.
--     country/admin1/place_name are DERIVED from them at ingestion
--     (reverse-geocode) and stored as plain text — identical in every backend.
-- =============================================================

-- ---------- sources : provenance of each dataset ----------
CREATE TABLE sources (
  source_id      TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT 'N/A',
  vendor         TEXT DEFAULT 'N/A',
  url            TEXT DEFAULT 'N/A',
  granularity    TEXT DEFAULT 'N/A',        -- e.g. 'facility','1km-grid'
  coverage       TEXT DEFAULT 'N/A',        -- geographic / temporal scope
  history_start  TEXT DEFAULT 'N/A',        -- ISO date as TEXT (may be 'N/A')
  license        TEXT DEFAULT 'N/A',
  notes          TEXT DEFAULT 'N/A'
);

-- ---------- metrics : what is being measured ----------
CREATE TABLE metrics (
  metric_id      TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT 'N/A',
  unit           TEXT NOT NULL DEFAULT 'N/A',   -- 'tCO2e','m3','MWh'
  description    TEXT DEFAULT 'N/A',
  direction      TEXT DEFAULT 'N/A'         -- higher_bad | higher_good | neutral | N/A
);

-- ---------- regions : optional geographic rollups ----------
CREATE TABLE regions (
  region_id      TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT 'N/A',
  level          TEXT DEFAULT 'N/A',        -- country | state | basin | ...
  parent_region  TEXT DEFAULT 'N/A'         -- self-reference (soft)
);

-- ---------- assets : physical sites. Location lives here. ----------
CREATE TABLE assets (
  asset_id       TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT 'N/A',
  asset_type     TEXT DEFAULT 'N/A',        -- plant | data_center | reservoir | ...
  latitude       NUMERIC NOT NULL,          -- MANDATORY — no pin without it
  longitude      NUMERIC NOT NULL,          -- MANDATORY
  -- derived FROM coordinates by ingestion reverse-geocode, stored as text:
  country        TEXT DEFAULT 'N/A',
  admin1         TEXT DEFAULT 'N/A',        -- state / province / region
  place_name     TEXT DEFAULT 'N/A',        -- nearest place label
  geocoded_at    TEXT DEFAULT 'N/A',        -- ISO ts when location was resolved
  region_id      TEXT DEFAULT 'N/A',        -- soft FK -> regions ('N/A' = none)
  operator       TEXT DEFAULT 'N/A'
);

-- ---------- observations : the long/tidy fact table ----------
-- One row per (asset, metric, timestamp).
CREATE TABLE observations (
  observation_id TEXT PRIMARY KEY,
  asset_id       TEXT NOT NULL,             -- FK -> assets (must be a real pin)
  metric_id      TEXT NOT NULL DEFAULT 'N/A',
  source_id      TEXT NOT NULL DEFAULT 'N/A',
  observed_at    TEXT DEFAULT 'N/A',        -- ISO ts as TEXT
  ingested_at    TEXT DEFAULT 'N/A',        -- ISO ts as TEXT (lineage)
  value          NUMERIC,                   -- nullable; app renders null as '—'
  confidence     NUMERIC,                   -- 0..1, nullable
  raw_ref        TEXT DEFAULT 'N/A'         -- pointer to source record (audit)
);

-- ---------- relationships ----------
-- Declared separately so a CSV/Excel backend can simply ignore them.
-- The hard one: observations must attach to a real asset (a real map pin).
ALTER TABLE observations
  ADD CONSTRAINT fk_obs_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id);

-- Soft references (metric_id, source_id, region_id) are intentionally NOT
-- enforced as FKs in core: they may legitimately be 'N/A'. Enforce them in a
-- strict-mode extension if your backend guarantees no 'N/A' placeholders.
