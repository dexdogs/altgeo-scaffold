// CSV adapter — the flat-sheet fallback and default boot state.
// Reads /schema/seed/*.csv. Proves the Excel-degradation rule literally:
// the same schema_core columns work with no database at all.

import fs from "fs";
import path from "path";
import {
  DataAdapter,
  Asset,
  Observation,
  coerce,
} from "./index";

const SEED_DIR = path.join(process.cwd(), "schema", "seed");

// Tiny dependency-free CSV parser (assumes no quoted commas in seed data).
function parseCsv(file: string): Record<string, string>[] {
  const text = fs.readFileSync(path.join(SEED_DIR, file), "utf8").trim();
  const [header, ...lines] = text.split(/\r?\n/);
  const cols = header.split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    cols.forEach((c, i) => (row[c] = cells[i] ?? ""));
    return row;
  });
}

function toNum(v: string): number | null {
  if (v === "" || v === "N/A") return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

export class CsvAdapter implements DataAdapter {
  async listAssets(): Promise<Asset[]> {
    return parseCsv("assets.csv").map((r) =>
      coerce({
        ...r,
        latitude: toNum(r.latitude),
        longitude: toNum(r.longitude),
      }) as unknown as Asset
    );
  }

  async listObservations(assetId?: string): Promise<Observation[]> {
    let rows = parseCsv("observations.csv");
    if (assetId) rows = rows.filter((r) => r.asset_id === assetId);
    return rows.map((r) =>
      coerce({
        ...r,
        value: toNum(r.value),
        confidence: toNum(r.confidence),
      }) as unknown as Observation
    );
  }
}
