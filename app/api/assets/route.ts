// Adapter-backed API. The front end fetches from here; it never knows or cares
// which database is behind it. Returns assets + their observations, already
// coerced so no field is ever blank.

import { NextResponse } from "next/server";
import { makeAdapter } from "../../../adapters";

export async function GET() {
  const db = await makeAdapter();
  const assets = await db.listAssets();
  const observations = await db.listObservations();
  return NextResponse.json({ assets, observations });
}
