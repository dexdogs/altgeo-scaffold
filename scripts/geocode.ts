// =============================================================
// Ingestion step: coordinates -> location text (country/admin1/place_name).
// Runs at LOAD time, not in the DB. Writes plain text so every backend ends
// up identical. Uses Mapbox reverse geocoding (reuses NEXT_PUBLIC_MAPBOX_TOKEN
// or MAPBOX_TOKEN). If no token or no valid coordinates, columns stay 'N/A' —
// this never throws and never blocks ingestion.
//
// Usage: read assets, map each through enrichLocation, write back.
// =============================================================

const NA = "N/A";
const TOKEN =
  process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface LatLng {
  latitude: number | null;
  longitude: number | null;
}

async function reverseGeocode(lng: number, lat: number) {
  if (!TOKEN) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?types=country,region,place&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const feats: any[] = json.features ?? [];
    const pick = (type: string) =>
      feats.find((f) => f.place_type?.includes(type))?.text ?? NA;
    return {
      country: pick("country"),
      admin1: pick("region"),
      place_name: pick("place"),
    };
  } catch {
    return null; // network/provider failure -> leave as N/A, don't block
  }
}

export async function enrichLocation<T extends LatLng>(
  asset: T
): Promise<T & { country: string; admin1: string; place_name: string; geocoded_at: string }> {
  const base = { country: NA, admin1: NA, place_name: NA, geocoded_at: NA };
  if (
    typeof asset.latitude !== "number" ||
    typeof asset.longitude !== "number" ||
    !isFinite(asset.latitude) ||
    !isFinite(asset.longitude)
  ) {
    return { ...asset, ...base }; // un-pinnable row stays N/A
  }
  const r = await reverseGeocode(asset.longitude, asset.latitude);
  if (!r) return { ...asset, ...base };
  return {
    ...asset,
    country: r.country,
    admin1: r.admin1,
    place_name: r.place_name,
    geocoded_at: new Date().toISOString(),
  };
}
