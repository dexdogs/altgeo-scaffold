"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const DASH = "\u2014";
const NOW = new Date();

type Asset = {
  asset_id: string; name: string; asset_type?: string;
  latitude: number | string | null; longitude: number | string | null;
  country?: string; place_name?: string;
};
type Obs = {
  observation_id: string; asset_id: string; metric_id: string;
  source_id?: string; observed_at?: string; ingested_at?: string;
  value: number | string | null; raw_ref?: string;
};

function isNum(v: unknown): v is number { return typeof v === "number" && isFinite(v); }
function ok(v?: string) { return !!v && v !== "N/A" && v !== DASH; }
function parseTs(t?: string): number | null {
  if (!ok(t)) return null;
  const d = Date.parse(t as string);
  return isNaN(d) ? null : d;
}
function daysBetween(a: number, b: number) { return Math.round((a - b) / 86400000); }
function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export default function Dashboard({
  assets, observations,
}: { assets: Asset[]; observations: Obs[] }) {
  const obsTimes = observations.map((o) => parseTs(o.observed_at)).filter((t): t is number => t !== null);
  const nowMs = NOW.getTime();
  const freshestMs = obsTimes.length ? Math.max(...obsTimes) : null;
  const freshestAge = freshestMs !== null ? daysBetween(nowMs, freshestMs) : null;
  const medianAge = median(obsTimes.map((t) => daysBetween(nowMs, t)));
  let freshestLag: number | null = null;
  if (freshestMs !== null) {
    const fr = observations.find((o) => parseTs(o.observed_at) === freshestMs);
    const ing = fr ? parseTs(fr.ingested_at) : null;
    const obs = fr ? parseTs(fr.observed_at) : null;
    if (ing !== null && obs !== null) freshestLag = daysBetween(ing, obs);
  }

  const complete = observations.filter(
    (o) => ok(o.source_id) && ok(o.ingested_at) && ok(o.raw_ref)
  ).length;
  const evidencePct = observations.length ? Math.round((100 * complete) / observations.length) : 0;

  const covered = new Set(observations.map((o) => o.asset_id)).size;
  const coveragePct = assets.length ? Math.round((100 * covered) / assets.length) : 0;

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

  const heroLabel = { fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase" as const, color: "#6b7280", margin: "0 0 4px" };
  const heroValue = { fontSize: 34, fontWeight: 700, lineHeight: 1.05, color: "#f9fafb" };
  const heroUnit = { fontSize: 13, fontWeight: 500, color: "#9ca3af" };
  const heroSub = { fontSize: 11, color: "#9ca3af", marginTop: 4 };
  const heroCard = { background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "14px 14px" };

  return (
    <aside style={{
      width: 360, height: "calc(100vh - 48px)", overflowY: "auto", background: "#0a0a0a",
      color: "#e5e7eb", padding: "20px 18px", boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif", borderRight: "1px solid #1f2937",
    }}>
      

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <div style={heroCard}>
          <p style={heroLabel}>Point-in-time · freshest signal</p>
          <div style={heroValue}>{freshestAge ?? DASH}<span style={heroUnit}> days old</span></div>
          <div style={heroSub}>
            {freshestLag !== null ? `ingested +${freshestLag}d after observation` : "ingest lag N/A"}
            {medianAge !== null ? ` · median age ${medianAge}d` : ""}
          </div>
        </div>
        <div style={heroCard}>
          <p style={heroLabel}>Evidence chain · fully traceable</p>
          <div style={heroValue}>{evidencePct}<span style={heroUnit}>%</span></div>
          <div style={heroSub}>{complete}/{totalObs} obs carry source + ingest + raw_ref</div>
        </div>
        <div style={heroCard}>
          <p style={heroLabel}>Coverage · instrumented universe</p>
          <div style={heroValue}>{coveragePct}<span style={heroUnit}>%</span></div>
          <div style={heroSub}>{covered}/{totalAssets} assets have a reading</div>
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", gap: 6,
        fontSize: 10, color: "#6b7280", padding: "0 2px 16px",
        borderBottom: "1px solid #1f2937", marginBottom: 16,
      }}>
        <span>{totalAssets} assets</span>
        <span>{totalObs} obs</span>
        <span>{distinctMetrics} metrics</span>
        <span>{hidden} hidden</span>
      </div>

      <h2 style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Domain mix (obs by metric)</h2>
      <div style={{ width: "100%", height: 180, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={metricData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="metric" width={92} tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11, color: "#e5e7eb" }} cursor={{ fill: "#1f2937" }} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {metricData.map((_, i) => (<Cell key={i} fill={palette[i % palette.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Assets</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ color: "#4b5563", textAlign: "left" }}>
            <th style={{ padding: "4px 4px", fontWeight: 500 }}>Name</th>
            <th style={{ padding: "4px 4px", fontWeight: 500 }}>Type</th>
            <th style={{ padding: "4px 4px", fontWeight: 500 }}>Location</th>
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
