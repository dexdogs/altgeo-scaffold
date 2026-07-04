"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const style = document.createElement("style");
style.textContent = `
  .pulse-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: #000; position: relative;
  }
  .pulse-dot::before {
    content: ""; position: absolute; inset: 0;
    border-radius: 50%; background: #000;
    animation: pulse 2s ease-out infinite;
  }
  @keyframes pulse {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(3);   opacity: 0;   }
  }
`;
if (typeof document !== "undefined" && !document.getElementById("pulse-dot-style")) {
  style.id = "pulse-dot-style";
  document.head.appendChild(style);
}


type Asset = {
  asset_id: string;
  name: string;
  asset_type?: string;
  latitude: number | null;
  longitude: number | null;
  country?: string;
  admin1?: string;
  place_name?: string;
};

type Obs = {
  asset_id: string;
  metric_id: string;
  value: number | string | null;
};

function hasCoords(a: Asset): a is Asset & { latitude: number; longitude: number } {
  const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

  async function onType(v: string) {
    setQ(v);
    if (v.trim().length < 3) { setSuggestions([]); return; }
    try {
      const url =
        "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        encodeURIComponent(v) + ".json?autocomplete=true&limit=5&access_token=" + TOKEN;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json.features ?? []);
    } catch { setSuggestions([]); }
  }

  function flyToPlace(f: any) {
    const [lng, lat] = f.center;
    mapInstance.current?.flyTo({ center: [lng, lat], zoom: 9, essential: true });
    setQ(f.place_name);
    setSuggestions([]);
  }

  function goToMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstance.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 10, essential: true,
        });
      },
      () => {} // denied/unavailable: fail quietly
    );
  }

  return (
    typeof a.latitude === "number" &&
    typeof a.longitude === "number" &&
    isFinite(a.latitude) &&
    isFinite(a.longitude)
  );
}

export default function Map({
  assets,
  observations,
}: {
  assets: Asset[];
  observations: Obs[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!ref.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5, 39.8], // USA
      zoom: 3.2,
      projection: "globe",
    });

    map.on("style.load", () => {
      // Black space behind the globe. Globe surface colors stay as-is.
      map.setFog({
        color: "rgb(0, 0, 0)",
        "high-color": "rgb(0, 0, 0)",
        "space-color": "rgb(0, 0, 0)",
        "horizon-blend": 0.02,
        "star-intensity": 0,
      });
    });

    const pinned = assets.filter(hasCoords);
    const skipped = assets.length - pinned.length;

    pinned.forEach((a) => {
      const rows = observations
        .filter((o) => o.asset_id === a.asset_id)
        .map(
          (o) =>
            `<tr><td>${o.metric_id}</td><td style="text-align:right">${o.value}</td></tr>`
        )
        .join("");

      const html =
        `<strong>${a.name}</strong><br/>` +
        `<span style="color:#666">${a.asset_type ?? "\u2014"} \u00b7 ${a.place_name ?? "\u2014"}, ${a.country ?? "\u2014"}</span>` +
        (rows
          ? `<table style="margin-top:6px;font-size:12px;border-collapse:collapse">${rows}</table>`
          : "");

      const el = document.createElement("div");
      el.className = "pulse-dot";
      el.style.cursor = "pointer";

      new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([a.longitude, a.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(html))
        .addTo(map);
    });

    // Never crash on un-pinnable rows: surface a count instead.
    if (skipped > 0) {
      const note = document.createElement("div");
      note.style.cssText =
        "position:absolute;bottom:12px;left:12px;background:#fff;padding:6px 10px;border-radius:6px;font:12px sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.2)";
      note.textContent = `${skipped} asset(s) hidden \u2014 no coordinates`;
      ref.current?.appendChild(note);
    }

    mapInstance.current = map;
    return () => map.remove();
  }, [assets, observations]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div className="location-search-box" style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 300, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={q}
            onChange={(e) => onType(e.target.value)}
            placeholder="Go to a place..."
            style={{ flex: 1, padding: "10px 12px", fontSize: 13, border: "1px solid #1f2937", borderRadius: 8, background: "#0a0a0a", color: "#e5e7eb", outline: "none", boxShadow: "0 2px 10px rgba(0,0,0,.4)" }}
          />
          <button onClick={goToMyLocation} title="My location"
            style={{ padding: "0 12px", fontSize: 15, border: "1px solid #374151", borderRadius: 8, background: "#111827", color: "#f9fafb", cursor: "pointer" }}>
            &#128205;
          </button>
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginTop: 6, background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>
            {suggestions.map((f) => (
              <div key={f.id} onClick={() => flyToPlace(f)}
                style={{ padding: "9px 12px", fontSize: 12, color: "#e5e7eb", cursor: "pointer", borderTop: "1px solid #14181f" }}>
                {f.place_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
