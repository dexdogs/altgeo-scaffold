"use client";
import { useState } from "react";
import { runSearch, OPERATORS, Asset, Obs, SearchResult } from "../lib/search";

const DASH = "\u2014";

export default function SearchOverlay({
  assets, observations,
}: { assets: Asset[]; observations: Obs[] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);

  function doSearch() { setResults(runSearch(q, { assets, observations })); }
  function onKey(e: React.KeyboardEvent) { if (e.key === "Enter") doSearch(); }

  return (
    <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10, width: 380, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search  e.g.  type:data_center  value>0.8  water"
          style={{
            flex: 1, padding: "10px 12px", fontSize: 13, border: "1px solid #1f2937",
            borderRadius: 8, background: "#0a0a0a", color: "#e5e7eb", outline: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,.4)",
          }} />
        <button onClick={doSearch} style={{
          padding: "0 16px", fontSize: 13, fontWeight: 600, border: "1px solid #374151",
          borderRadius: 8, background: "#111827", color: "#f9fafb", cursor: "pointer",
        }}>Search</button>
      </div>
      <div style={{ fontSize: 10, color: "#6b7280", margin: "5px 2px 0" }}>
        operators: {OPERATORS.join("  ")}
      </div>
      {results !== null && (
        <div style={{
          marginTop: 8, background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8,
          maxHeight: "60vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,.5)",
        }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
            {results.length} match{results.length === 1 ? "" : "es"}
          </div>
          {results.length === 0 ? (
            <div style={{ padding: "14px 12px", fontSize: 12, color: "#9ca3af" }}>
              No results. Try a metric, type, or a value filter.
            </div>
          ) : results.map((r) => (
            <div key={r.asset.asset_id} style={{ padding: "10px 12px", borderTop: "1px solid #14181f" }}>
              <div style={{ fontSize: 13, color: "#f9fafb", fontWeight: 600 }}>{r.asset.name || DASH}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 4px" }}>
                {r.asset.asset_type || DASH}{" · "}
                {r.asset.place_name && r.asset.place_name !== DASH
                  ? `${r.asset.place_name}, ${r.asset.country}`
                  : `${r.asset.latitude}, ${r.asset.longitude}`}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {r.matchedObs.map((o) => (
                  <span key={o.observation_id} style={{
                    fontSize: 10, color: "#d1d5db", background: "#111827",
                    border: "1px solid #1f2937", borderRadius: 4, padding: "2px 6px",
                  }}>{o.metric_id}: {o.value === null || o.value === "" ? DASH : String(o.value)}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
