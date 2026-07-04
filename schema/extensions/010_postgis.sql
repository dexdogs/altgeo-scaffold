-- =============================================================
-- schema_ext: PostGIS  —  OPTIONAL. Supabase/Postgres only.
-- =============================================================
-- ADDITIVE: latitude/longitude in schema_core remain the source of truth.
-- geom is DERIVED. A CSV/Excel backend ignores this file entirely and loses
-- nothing — the map runs off lat/lng regardless.
-- Applying this file to a flat-sheet backend is a no-op you simply skip.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS geom geography(Point, 4326);

-- Backfill geom from the authoritative coordinates. Skip rows without valid
-- coordinates (they can't be pinned anyway).
UPDATE assets
   SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
 WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Keep geom in sync on write (optional convenience trigger).
CREATE OR REPLACE FUNCTION assets_sync_geom() RETURNS trigger AS $$
BEGIN
  IF NEW.longitude IS NOT NULL AND NEW.latitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_sync_geom ON assets;
CREATE TRIGGER trg_assets_sync_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON assets
  FOR EACH ROW EXECUTE FUNCTION assets_sync_geom();

CREATE INDEX IF NOT EXISTS idx_assets_geom ON assets USING GIST (geom);
