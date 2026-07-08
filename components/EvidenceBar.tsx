"use client";
import { useState, useEffect } from "react";

const MIDORI = "#00A86B";
const AMBER = "#d99a00";
const RED = "#c0392b";
const DASH = "\u2014";

type Obs = {
  observation_id: string; asset_id: string; metric_id: string;
  source_id?: string; observed_at?: string; ingested_at?: string;
  value: number | string | null; raw_ref?: string;
};
type Asset = { asset_id: string; name: string; asset_type?: string };

function ok(v?: string) { return !!v && v !== "N/A" && v !== DASH; }
function chainClass(o: Obs): "full" | "partial" | "none" {
  const n = [ok(o.source_id), ok(o.ingested_at), ok(o.raw_ref)].filter(Boolean).length;
  return n === 3 ? "full" : n > 0 ? "partial" : "none";
}
function chainColor(o: Obs) {
  const c = chainClass(o);
  return c === "full" ? MIDORI : c === "partial" ? AMBER : RED;
}
function ts(v?: string): number | null {
  if (!ok(v)) return null;
  const d = Date.parse(v as string);
  return isNaN(d) ? null : d;
}
function lagDays(o: Obs): number | null {
  const a = ts(o.observed_at), b = ts(o.ingested_at);
  if (a === null || b === null) return null;
  return Math.round((b - a) / 86400000);
}

export default function EvidenceBar({
  assets, observations, selectedAsset, onSelectAsset,
}: { assets: Asset[]; observations: Obs[]; selectedAsset?: string | null; onSelectAsset?: (id: string | null) => void }) {
  const [anchor, setAnchor] = useState<Obs | null>(null);
  const [panelView, setPanelView] = useState<"dag" | "sankey">("dag");
  const [scope, setScope] = useState<"asset" | "type">("asset");

  // Look up the type of the currently selected asset (for the "all of this type" toggle).
  const selType = selectedAsset ? assets.find((a) => a.asset_id === selectedAsset)?.asset_type : undefined;
  // Is this observation part of the current globe selection (asset-scope or type-scope)?
  const inSelection = (o: Obs) => {
    if (!selectedAsset) return false;
    if (scope === "asset") return o.asset_id === selectedAsset;
    const t = assets.find((a) => a.asset_id === o.asset_id)?.asset_type;
    return t !== undefined && t === selType;
  };

  // When an asset is clicked on the globe, auto-anchor to its observation and open the DAG.
  useEffect(() => {
    if (!selectedAsset) return;
    const match = observations.find((o) => o.asset_id === selectedAsset);
    if (match) { setAnchor(match); setPanelView("dag"); }
  }, [selectedAsset, observations]);

  const times = observations.map((o) => ts(o.observed_at)).filter((t): t is number => t !== null);
  const min = times.length ? Math.min(...times) : 0;
  const max = times.length ? Math.max(...times) : 1;
  const span = max - min || 1;
  const xPct = (o: Obs) => {
    const t = ts(o.observed_at);
    return t === null ? 0 : ((t - min) / span) * 100;
  };
  const full = observations.filter((o) => chainClass(o) === "full").length;
  const pct = observations.length ? Math.round((100 * full) / observations.length) : 0;
  const assetName = (id: string) => assets.find((a) => a.asset_id === id)?.name ?? id;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", position: "relative" }}>
      <div style={{ height: 84, background: "#0a0a0a", borderTop: "1px solid #1f2937", padding: "8px 14px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>Evidence chain &middot; freshness timeline</span>
          <span style={{ fontSize: 11, color: "#6b7280", display: "flex", gap: 8, alignItems: "center" }}>
            {selectedAsset ? (
              <>
                <span style={{ color: "#00A86B" }}>showing: {assetName(selectedAsset)}</span>
                {selType && (
                  <span style={{ display: "inline-flex", border: "1px solid #374151", borderRadius: 6, overflow: "hidden" }}>
                    <button onClick={() => setScope("asset")} style={{ fontSize: 10, padding: "2px 7px", border: "none", cursor: "pointer", background: scope === "asset" ? "#00A86B" : "#111827", color: scope === "asset" ? "#052e1f" : "#9ca3af" }}>This asset</button>
                    <button onClick={() => setScope("type")} style={{ fontSize: 10, padding: "2px 7px", border: "none", cursor: "pointer", background: scope === "type" ? "#00A86B" : "#111827", color: scope === "type" ? "#052e1f" : "#9ca3af" }}>All {selType}</button>
                  </span>
                )}
                <button onClick={() => { onSelectAsset?.(null); setAnchor(null); }} style={{ fontSize: 10, padding: "2px 7px", border: "1px solid #374151", borderRadius: 6, cursor: "pointer", background: "#111827", color: "#9ca3af" }}>clear &times;</button>
              </>
            ) : (
              <>{pct}% full chain &middot; {observations.length} obs &middot; click an asset or tick to trace</>
            )}
          </span>
        </div>
        <div style={{ position: "relative", height: 40, marginTop: 4 }}>
          <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: 1, background: "#1f2937" }} />
          {observations.map((o) => {
            const lag = lagDays(o);
            const left = xPct(o);
            const whisker = lag !== null ? Math.min(lag * 4, 40) : 0;
            const isAnchor = anchor?.observation_id === o.observation_id;
            const selected = inSelection(o);
            return (
              <div key={o.observation_id} style={{ position: "absolute", top: 0, left: `${left}%`, transform: "translateX(-50%)" }}>
                {whisker > 0 && (<div style={{ position: "absolute", top: 20, left: "50%", width: whisker, height: 1, background: "#374151" }} />)}
                <button onClick={() => { setAnchor(isAnchor ? null : o); onSelectAsset?.(o.asset_id); }}
                  title={`${o.metric_id} @ ${assetName(o.asset_id)} \u00b7 ${chainClass(o)} chain \u00b7 lag ${lag ?? "?"}d`}
                  style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: isAnchor ? 14 : selected ? 12 : 10, height: isAnchor ? 14 : selected ? 12 : 10, borderRadius: "50%", background: chainColor(o), border: isAnchor ? "2px solid #fff" : selected ? "2px solid #00A86B" : "none", boxShadow: selected ? "0 0 6px #00A86B" : "none", cursor: "pointer", padding: 0 }} />
              </div>
            );
          })}
          <span style={{ position: "absolute", bottom: -2, left: 0, fontSize: 9, color: "#4b5563" }}>{new Date(min).toISOString().slice(0, 10)}</span>
          <span style={{ position: "absolute", bottom: -2, right: 0, fontSize: 9, color: "#4b5563" }}>{new Date(max).toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {anchor && (
        <div style={{ position: "absolute", bottom: 84, left: 0, right: 0, maxHeight: 210, overflowY: "auto", background: "#0a0a0a", borderTop: "1px solid #1f2937", padding: "10px 14px", boxSizing: "border-box", zIndex: 30, boxShadow: "0 -8px 30px rgba(0,0,0,.6)", color: "#e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <strong style={{ fontSize: 13 }}>Evidence trace &middot; {anchor.observation_id}</strong>
              <button onClick={() => setPanelView("dag")} style={tabStyle(panelView === "dag")}>Lineage DAG</button>
              <button onClick={() => setPanelView("sankey")} style={tabStyle(panelView === "sankey")}>Source flow</button>
            </div>
            <button onClick={() => setAnchor(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer" }}>&times;</button>
          </div>
          {panelView === "dag" ? <DagView obs={anchor} assetName={assetName(anchor.asset_id)} /> : <SankeyView observations={observations} anchor={anchor} />}
        </div>
      )}
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return { fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer", border: "1px solid #374151", background: active ? "#00A86B" : "#111827", color: active ? "#052e1f" : "#9ca3af" };
}

function DagView({ obs, assetName }: { obs: Obs; assetName: string }) {
  const nodes = [
    { label: "SOURCE", val: obs.source_id ?? DASH, x: 40 },
    { label: "OBSERVATION", val: `${obs.value ?? DASH}`, x: 300 },
    { label: "ASSET", val: assetName, x: 560 },
    { label: "METRIC", val: obs.metric_id ?? DASH, x: 820 },
  ];
  const edgeColor = chainColor(obs);
  const y = 90;
  return (
    <svg width="100%" height="150" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={edgeColor} />
        </marker>
      </defs>
      {nodes.slice(0, -1).map((n, i) => (
        <line key={i} x1={n.x + 150} y1={y + 25} x2={nodes[i + 1].x} y2={y + 25} stroke={edgeColor} strokeWidth={2} markerEnd="url(#arrow)" />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={y} width={150} height={50} rx={8} fill="#111827" stroke="#374151" />
          <text x={n.x + 12} y={y + 18} fill="#6b7280" fontSize={9} fontFamily="system-ui">{n.label}</text>
          <text x={n.x + 12} y={y + 38} fill="#e5e7eb" fontSize={12} fontFamily="system-ui">{String(n.val).slice(0, 18)}</text>
        </g>
      ))}
      <text x={40} y={175} fill={edgeColor} fontSize={11} fontFamily="system-ui">
        {chainClass(obs) === "full" ? "\u2713 full evidence chain" : "\u26a0 incomplete chain"}{"  \u00b7  lag "}{lagDays(obs) ?? "?"}{"d"}
      </text>
    </svg>
  );
}

function SankeyView({ observations, anchor }: { observations: Obs[]; anchor: Obs }) {
  const bySource: Record<string, number> = {};
  observations.forEach((o) => { const k = o.source_id ?? DASH; bySource[k] = (bySource[k] ?? 0) + 1; });
  const total = observations.length || 1;
  const entries = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  let acc = 0;
  return (
    <svg width="100%" height="150" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMid meet">
      {entries.map(([src, n], i) => {
        const h = (n / total) * 170;
        const yTop = 15 + acc;
        acc += h + 4;
        const isAnchor = src === anchor.source_id;
        return (
          <g key={src}>
            <rect x={40} y={yTop} width={20} height={h} fill={isAnchor ? "#00A86B" : "#374151"} />
            <path d={`M60,${yTop} C300,${yTop} 300,${70 + i * 12} 700,${70 + i * 12}`} stroke={isAnchor ? "#00A86B" : "#1f2937"} strokeWidth={Math.max(h, 2)} fill="none" opacity={isAnchor ? 0.6 : 0.3} />
            <text x={70} y={yTop + h / 2 + 3} fill="#e5e7eb" fontSize={11} fontFamily="system-ui">{src} ({n})</text>
          </g>
        );
      })}
      <rect x={700} y={85} width={20} height={30} fill="#00A86B" />
      <text x={730} y={103} fill="#e5e7eb" fontSize={11} fontFamily="system-ui">all observations</text>
    </svg>
  );
}
