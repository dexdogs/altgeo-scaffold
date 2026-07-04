// Central place to read backend selection. The factory in /adapters uses
// process.env.DB_BACKEND directly; this re-exports it for clarity/testing.
export const DB_BACKEND = process.env.DB_BACKEND ?? "csv";
export const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN ?? "";
