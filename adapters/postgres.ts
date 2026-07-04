// Generic Postgres adapter — any Postgres that has schema_core loaded.
// Requires DATABASE_URL.  npm i pg

import { DataAdapter, Asset, Observation, coerce } from "./index";
import { Pool } from "pg";

export class PostgresAdapter implements DataAdapter {
  private pool: Pool;
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async listAssets(): Promise<Asset[]> {
    const { rows } = await this.pool.query("SELECT * FROM assets");
    return rows.map((r) => coerce(r) as unknown as Asset);
  }

  async listObservations(assetId?: string): Promise<Observation[]> {
    const { rows } = assetId
      ? await this.pool.query(
          "SELECT * FROM observations WHERE asset_id = $1",
          [assetId]
        )
      : await this.pool.query("SELECT * FROM observations");
    return rows.map((r) => coerce(r) as unknown as Observation);
  }
}
