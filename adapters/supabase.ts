// Supabase adapter — the default production target.
// Requires SUPABASE_URL + SUPABASE_ANON_KEY. Run schema/core/001_schema_core.sql
// on your project first; optionally apply the extensions.
//
// npm i @supabase/supabase-js

import { DataAdapter, Asset, Observation, coerce } from "./index";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAdapter implements DataAdapter {
  private db: SupabaseClient;
  constructor() {
    this.db = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async listAssets(): Promise<Asset[]> {
    const { data, error } = await this.db.from("assets").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => coerce(r) as unknown as Asset);
  }

  async listObservations(assetId?: string): Promise<Observation[]> {
    let q = this.db.from("observations").select("*");
    if (assetId) q = q.eq("asset_id", assetId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r) => coerce(r) as unknown as Observation);
  }
}
