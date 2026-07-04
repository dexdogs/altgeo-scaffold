"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const DASH = "\u2014";

type Asset = {
  asset_id: string; name: string; asset_type?: string;
  latitude: number | string | null; longitude: number | string | null;
  country?: string; admin1?: string; place_name?: string;
};
type Obs = {
  observation_id: string; asset_id: string; metric_id: string;
  value: number | string | null;
};

function isNum(v: unknown): v is number {
  return typeof v === "number" && isFinite(v);
}

export default function Dashboard({
  assets, observations,
}: { assets: Asset[]; observations: Obs[] }) {
  const totalAssets = assets.length;
  const pinned = assets.filter((a) => isNum(a.latitude) && isNum(a.longitude)).length;
  const hidden = totalAssets - pinned;
  const totalObs = observations.length;

  const byMetric: Record<string, number> = {};
  for (const o of observations) {
    const k = o.metric_id || DASH;
    byMetric[k] = (byMetric[k] ?? 0) + 1;
  }
  const metricData = Object.entries(byMetric)
    .map(([metric, count]) => ({ metric, count }))
    .sort((a, b) => b.count - a.count);
  const distinctMetrics = metricData.length;

  const palette = ["#111827","#374151","#6b7280","#9ca3af","#4b5563","#1f2937","#d1d5db","#000000"];
  const tiles = [
    { label: "Assets", value: totalAssets },
    { label: "Observations", value: totalObs },
    { label: "Metrics", value: distinctMetrics },
    { label: "Hidden (no coords)", value: hidden },
  ];

  return (
    <aside style={{
      width: 340, height: "100vh", overflowY: "auto", background: "#0a0a0a",
      color: "#e5e7eb", padding: "20px 18px", boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif", borderRight: "1px solid #1f2937",
    }}>
      <h1 style={{ fontSize: 16, margin: "0 0 4px", letterSpacing: 0.3 }}>AltGeo Dashboard</h1>
      <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 18px" }}>
        Synthetic placeholder data · dexdogs.earth
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
        {tiles.map((t) => (
          <div key={t.label} style={{
            background: "#111827", border: "1px solid #1f2937",
            borderRadius: 8, padding: "12px 10px",
          }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{t.value}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>Observations by metric</h2>
      <div style={{ width: "100%", height: 200, marginBottom: 22 }}>
        <ResponsiveContainer>
          <BarChart data={metricData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="metric" width={92} tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11, color: "#e5e7eb" }}
              cursor={{ fill: "#1f2937" }} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {metricData.map((_, i) => (<Cell key={i} fill={palette[i % palette.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>Assets</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ color: "#6b7280", textAlign: "left" }}>
            <th style={{ padding: "4px 4px" }}>Name</th>
            <th style={{ padding: "4px 4px" }}>Type</th>
            <th style={{ padding: "4px 4px" }}>Location</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.asset_id} style={{ borderTop: "1px solid #1f2937" }}>
              <td style={{ padding: "6px 4px" }}>{a.name || DASH}</td>
              <td style={{ padding: "6px 4px", color: "#9ca3af" }}>{a.asset_type || DASH}</td>
              <td style={{ padding: "6px 4px", color: "#9ca3af" }}>
                {a.place_name && a.place_name !== DASH
                  ? `${a.place_name}, ${a.country}`
                  : isNum(a.latitude) && isNum(a.longitude)
                  ? `${a.latitude}, ${a.longitude}`
                  : DASH}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
