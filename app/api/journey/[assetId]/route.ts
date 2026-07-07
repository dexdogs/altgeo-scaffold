// GET /api/journey/:assetId
// The map clicks assets; this resolves asset -> observation -> journey.
// Read-only, reads flat CSVs. Relative import (no @/ alias in this repo).
import { NextResponse } from "next/server";
import { getJourneyByAsset } from "../../../../lib/adapters/observationJourney";

export async function GET(
  _req: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    const journey = getJourneyByAsset(params.assetId);
    if (!journey) {
      return NextResponse.json({ error: "no journey for asset" }, { status: 404 });
    }
    return NextResponse.json(journey, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
