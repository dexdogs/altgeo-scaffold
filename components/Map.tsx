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
  return (
    typeof a.latitude === "number" &&
    typeof a.longitude === "number" &&
    isFinite(a.latitude) &&
    isFinite(a.longitude)
  );
}

const VISION_TITLE = "dexdogs.earth — Vision";
const VISION_SECTIONS: { h: string; p: string }[] = [
  { h: "The core idea", p: "This project builds a reusable scaffold for geospatial alternative-data applications — a template where the structure is the product, not any single dataset. The bet is simple: environmental alt-data problems (carbon, water, energy load, climate hazard, data-center footprint) all share the same underlying shape. Physical assets sit somewhere on Earth. Observations accumulate against those assets over time. Each observation came from somewhere and must be auditable. Build that skeleton once, cleanly, and any environmental domain drops in with minimal rework. The scaffold is opinionated about structure and unopinionated about content, so forking it for a new domain is fast." },
  { h: "Why it matters", p: "Alternative data — satellite imagery, sensors, foot-traffic, shipping trackers, public records — lets analysts see an entity's reality before it surfaces in official filings or press releases. For hedge funds and environmental-commodity desks, that lead time is the edge. But alt data is messy: less structured, less accessible, uneven in granularity, coverage, and history. The value isn't in collecting it; it's in organizing it so patterns become legible. That's what this scaffold exists to do. It turns scattered environmental signals into structured, location-anchored intelligence that a desk can actually query, audit, and act on ahead of the market." },
  { h: "The three layers", p: "The architecture is three layers. The front end is an interactive map: because everything happens somewhere, location is the primary analytical surface, with markers rendering location-anchored records and popups exposing attributes. The back end is a table-format database, backend-agnostic by design — Supabase/Postgres is the default, but the same schema degrades gracefully to a plain Excel/CSV sheet, and nothing may depend on a feature a flat sheet can't emulate. The schema is the contract between map and database, and the thing that matters most. Quality of the schema outranks map polish or data volume every single time." },
  { h: "Schema principles", p: "Assets carry location as latitude/longitude in decimal degrees, so any flat sheet works; PostGIS geometry is only ever an addition. Observations are long/tidy — one row per (asset, metric, timestamp) — so new metrics never require schema changes and the Excel fallback stays sane. Provenance is first-class: every observation carries its source, ingestion timestamp, and enough lineage to audit it, because in alt data where the number came from matters as much as the number. Entities map to tables: assets, observations, sources, metrics, and optional regions. Primary-key/foreign-key pairs make it relational; every table survives export to CSV as one sheet." },
  { h: "The stakeholder network", p: "Environmental credits pass through a chain of fifteen stakeholder roles, from Rulemakers who set standards, through Manufacturers, Developers, Generators, Testers, and Loggers who create and record data, to Modelers, Auditors, Labelers, and Minters who calculate and certify it, and finally Raters, Facilitators, Buyers, Reporters, and Regulators who trade and police it. A sixteenth node, Retirement, is where credits are finally retired. These sixteen actors are joined by thirty-four directed relationships — the edges along which data, rules, money, and verification flow. This network is the map of who touches a data point and in what order." },
  { h: "The four phases", p: "The thirty-four relationships group into four phases of a single data point's life. Pre-Flight is where rules and specifications are encoded before any sensor pulse exists. Birth is the moment a physical event — heat, flow, movement — is digitized and indexed, giving the data its 'digital birth certificate.' Maturation is where raw readings are calculated into CO2e, audited for truth, and packaged into a financial credit. Exit is where the credit is traded, used to prove a claim, and finally retired so it cannot be reused. Every phase carries a distinct color, so the journey is legible at a glance." },
  { h: "The data journey", p: "Click any asset on the map to trace its data journey. A panel opens showing the full path from Birth to Exit across all sixteen stakeholders and thirty-four edges. Phases the data point has actually reached appear in bold, saturated color; phases still ahead of it fade to a lighter tint but remain readable, so you always see the complete route. Each edge names its two stakeholders and its phase. This is the evidence chain made visible: not a static diagram, but a per-observation trace showing exactly how far a specific reading has travelled from raw signal toward a retired credit." },
  { h: "Evidence-chain integrity", p: "One rule is non-negotiable: raw observations are never binned, indexed, or modified. The moment a physical event is digitized, that row is the authoritative record and stays untouched forever. All spatial indexing, roll-ups, and cross-vendor fusion happen on a separate derived layer that references the raw observation but never overwrites it. This is why the journey model stores a data point's full path and simply marks how far it has travelled, rather than mutating the reading itself. Auditability depends on this: if you can't trust that the birth certificate is unaltered, nothing downstream — the credit, the trade, the claim — can be trusted." },
  { h: "The philosophy", p: "A good scaffold is opinionated about structure, unopinionated about content. It should feel obvious to a developer dropping in a new dataset and invisible once they do. Data here is treated as illustrative — synthetic seed rows exist so the map renders something immediately, not because the data is the point. The current demo uses ten synthetic US facilities with varied journeys, all placeholder content. The end state is a clean, auditable, map-first plumbing layer that turns scattered environmental signals into structured, location-anchored intelligence, reusable across every alt-data domain that touches the physical world — carbon today, water or energy tomorrow." },
];

export default function Map({
  assets,
  observations,
  collapsed,
  onSelectAsset,
}: {
  assets: Asset[];
  observations: Obs[];
  collapsed?: boolean;
  onSelectAsset?: (assetId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [panel, setPanel] = useState<null | "info" | "feedback">(null);
  const [journeyAsset, setJourneyAsset] = useState<string | null>(null);
  const [journey, setJourney] = useState<any>(null);
  const [journeyErr, setJourneyErr] = useState<string | null>(null);
  const [fbName, setFbName] = useState("");
  const [fbMsg, setFbMsg] = useState("");

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
      () => {}
    );
  }

  function sendFeedback() {
    const subject = encodeURIComponent(`dexdogs.earth feedback${fbName ? " from " + fbName : ""}`);
    const body = encodeURIComponent(fbMsg + (fbName ? `\n\n— ${fbName}` : ""));
    window.location.href = `mailto:ankur@dexdogs.earth?subject=${subject}&body=${body}`;
  }

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
      // Recolor the globe's water surface to deep midori.
      try { map.setPaintProperty("water", "fill-color", "#00A86B"); } catch (e) {}
      map.setFog({
        color: "rgb(0, 0, 0)",
        "high-color": "rgb(0, 0, 0)",
        "space-color": "#1B5E4A",
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

      // Outer wrapper is what Mapbox positions/transforms. Keep it clean:
      // no animation, no scaling — so the globe projection can't make it drift.
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.style.width = "12px";
      el.style.height = "12px";
      // Inner dot carries the visual + pulse animation, isolated from Mapbox's transform.
      const dot = document.createElement("div");
      dot.className = "pulse-dot";
      el.appendChild(dot);

      const assetId = a.asset_id;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setPanel(null);
        setJourneyAsset(assetId);
        onSelectAsset?.(assetId);
      });

      new mapboxgl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" })
        .setLngLat([a.longitude, a.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(html))
        .addTo(map);
    });

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

  useEffect(() => {
    // Mapbox keeps its old canvas size when the container resizes; force it.
    const t = setTimeout(() => mapInstance.current?.resize(), 300);
    return () => clearTimeout(t);
  }, [collapsed]);

  useEffect(() => {
    if (!journeyAsset) { setJourney(null); setJourneyErr(null); return; }
    setJourney(null); setJourneyErr(null);
    fetch(`/api/journey/${journeyAsset}`)
      .then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(e.error))))
      .then(setJourney)
      .catch((e) => setJourneyErr(String(e)));
  }, [journeyAsset]);

  const panelBox: React.CSSProperties = {
    position: "absolute", bottom: 64, left: 16, zIndex: 11, width: 380,
    maxHeight: "70vh", overflowY: "auto", background: "#0a0a0a",
    border: "1px solid #1f2937", borderRadius: 10, padding: "18px 18px",
    boxShadow: "0 8px 30px rgba(0,0,0,.6)", color: "#e5e7eb",
    fontFamily: "system-ui, sans-serif",
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
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

      {/* bottom-left info + feedback tabs */}
      <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 12, display: "flex", gap: 8 }}>
        <button onClick={() => setPanel(panel === "info" ? null : "info")}
          style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, border: "1px solid #374151", borderRadius: 8, background: "#00A86B", color: "#052e1f", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,.4)" }}>
          &#8505; Info
        </button>
        <button onClick={() => setPanel(panel === "feedback" ? null : "feedback")}
          style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, border: "1px solid #374151", borderRadius: 8, background: "#00A86B", color: "#052e1f", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,.4)" }}>
          Feedback
        </button>
      </div>

      {panel === "info" && (
        <div style={panelBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{VISION_TITLE}</h2>
            <button onClick={() => setPanel(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>&times;</button>
          </div>
          {VISION_SECTIONS.map((s) => (
            <div key={s.h} style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>{s.h}</h3>
              <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "#d1d5db", margin: 0 }}>{s.p}</p>
            </div>
          ))}
        </div>
      )}

      {panel === "feedback" && (
        <div style={panelBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Feedback</h2>
            <button onClick={() => setPanel(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>&times;</button>
          </div>
          <input
            value={fbName}
            onChange={(e) => setFbName(e.target.value)}
            placeholder="Your name (optional)"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 13, marginBottom: 8, border: "1px solid #1f2937", borderRadius: 8, background: "#111827", color: "#e5e7eb", outline: "none" }}
          />
          <textarea
            value={fbMsg}
            onChange={(e) => setFbMsg(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 13, marginBottom: 10, border: "1px solid #1f2937", borderRadius: 8, background: "#111827", color: "#e5e7eb", outline: "none", resize: "vertical" }}
          />
          <button onClick={sendFeedback} disabled={!fbMsg.trim()}
            style={{ width: "100%", padding: "10px", fontSize: 13, fontWeight: 600, border: "1px solid #374151", borderRadius: 8, background: fbMsg.trim() ? "#f9fafb" : "#374151", color: fbMsg.trim() ? "#0a0a0a" : "#9ca3af", cursor: fbMsg.trim() ? "pointer" : "not-allowed" }}>
            Send
          </button>
          <p style={{ fontSize: 10, color: "#6b7280", margin: "8px 0 0" }}>
            Opens your email app addressed to ankur@dexdogs.earth
          </p>
        </div>
      )}

      {journeyAsset && (
        <div style={{ ...panelBox, right: 16, left: "auto", width: 360 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Data Journey</h2>
            <button onClick={() => setJourneyAsset(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>&times;</button>
          </div>

          {journeyErr && <p style={{ fontSize: 12, color: "#DA5B5B" }}>Journey unavailable: {journeyErr}</p>}
          {!journey && !journeyErr && <p style={{ fontSize: 12, color: "#6b7280" }}>Loading journey…</p>}

          {journey && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{journey.observation.name}</span>
                <span style={{ fontSize: 11, color: "#00A86B", textTransform: "uppercase", letterSpacing: 0.5 }}>{journey.observation.domain}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                {journey.panel.map((p: any, i: number) => (
                  <div key={p.phase_id} style={{ display: "flex", alignItems: "center", flex: i < journey.panel.length - 1 ? 1 : "0 0 auto" }}>
                    <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${p.color_hex}`, background: p.reached ? p.color_hex : "transparent", opacity: p.reached ? 1 : 0.4, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, marginLeft: 5, color: p.reached ? p.color_hex : "#6b7280", fontWeight: p.reached ? 700 : 400, whiteSpace: "nowrap" }}>{p.name}</span>
                    {i < journey.panel.length - 1 && (
                      <div style={{ height: 2, flex: 1, margin: "0 6px", background: p.reached ? p.color_hex : "#2a2a2a", opacity: p.reached ? 0.8 : 0.4 }} />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {journey.steps.map((s: any) => (
                  <div key={s.edge_id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: s.render.opacity }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color_hex, flexShrink: 0 }} />
                    <span style={{ minWidth: 116, fontWeight: s.reached ? 600 : 400, color: s.reached ? "#e5e7eb" : "#9ca3af" }}>{s.relationship_name}</span>
                    <span style={{ fontSize: 10, color: "#6b7280", marginLeft: "auto" }}>{s.source.role} &rarr; {s.target.role}</span>
                    {s.flow_type === "bi_directional" && <span style={{ fontSize: 11, color: "#9ca3af" }}>&#8646;</span>}
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 10, color: "#6b7280", borderTop: "1px solid #1f2937", paddingTop: 8, margin: 0 }}>
                {journey.stakeholders_touched.length} stakeholders engaged &middot; {journey.steps.filter((s: any) => s.reached).length}/{journey.steps.length} steps complete
              </p>
            </>
          )}
        </div>
      )}

      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
