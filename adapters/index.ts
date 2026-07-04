// =============================================================
// DataAdapter — the "plug in any DB" contract.
// The app NEVER talks to a database directly; it talks to a DataAdapter.
// Any backend that satisfies schema_core implements this one interface.
// Swap backends by changing the DB_BACKEND env var. Nothing else changes.
// =============================================================

export const NA = "N/A";
export const DASH = "\u2014"; // em dash shown in the UI for missing values

export interface Asset {
  asset_id: string;
  name: string;
  asset_type?: string;
  latitude: number | null;
  longitude: number | null;
  country?: string;
  admin1?: string;
  place_name?: string;
  region_id?: string;
  operator?: string;
}

export interface Observation {
  observation_id: string;
  asset_id: string;
  metric_id: string;
  source_id: string;
  observed_at: string;
  ingested_at: string;
  value: number | null;
  confidence: number | null;
  raw_ref: string;
}

export interface DataAdapter {
  listAssets(): Promise<Asset[]>;
  listObservations(assetId?: string): Promise<Observation[]>;
}

// -------------------------------------------------------------
// coerce: the guarantee that a missing value never renders blank.
// null / undefined / "" / "N/A"  ->  em dash. Numbers pass through
// untouched so numeric columns stay sortable.
// -------------------------------------------------------------
export function coerce<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] =
      v === null || v === undefined || v === "" || v === NA ? DASH : v;
  }
  return out as T;
}

// hasValidCoords: the map uses this to SKIP (and count) un-pinnable assets
// instead of crashing on a bad marker.
export function hasValidCoords(a: Asset): boolean {
  return (
    typeof a.latitude === "number" &&
    typeof a.longitude === "number" &&
    isFinite(a.latitude) &&
    isFinite(a.longitude)
  );
}

// -------------------------------------------------------------
// Factory: picks the backend from env. Defaults to CSV so a fresh
// fork boots with zero database configured.
// -------------------------------------------------------------
import { CsvAdapter } from "./csv";

export async function makeAdapter(): Promise<DataAdapter> {
  switch (process.env.DB_BACKEND) {
    case "supabase": {
      const { SupabaseAdapter } = await import("./supabase");
      return new SupabaseAdapter();
    }
    case "postgres": {
      const { PostgresAdapter } = await import("./postgres");
      return new PostgresAdapter();
    }
    default:
      return new CsvAdapter(); // reads /schema/seed/*.csv — the flat-sheet fallback
  }
}
