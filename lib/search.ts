const DASH = "\u2014";

export type Asset = {
  asset_id: string; name: string; asset_type?: string;
  latitude: number | string | null; longitude: number | string | null;
  country?: string; place_name?: string; operator?: string;
};
export type Obs = {
  observation_id: string; asset_id: string; metric_id: string;
  source_id?: string; value: number | string | null;
};
export type SearchResult = { asset: Asset; matchedObs: Obs[]; hitCount: number };
type Op = { field: string; cmp: ">" | "<" | ">=" | "<=" | ":"; val: string };

function norm(v: unknown): string {
  return (v === null || v === undefined ? "" : String(v)).toLowerCase();
}
function parseQuery(q: string): { ops: Op[]; free: string[] } {
  const ops: Op[] = []; const free: string[] = [];
  for (const tok of q.trim().split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^(\w+)(>=|<=|>|<|:)(.+)$/);
    if (m) ops.push({ field: m[1].toLowerCase(), cmp: m[2] as Op["cmp"], val: m[3].toLowerCase() });
    else free.push(tok.toLowerCase());
  }
  return { ops, free };
}
function buildCells(a: Asset, obs: Obs[]): string {
  return [a.asset_id, a.name, a.asset_type, a.country, a.place_name, a.operator,
    ...obs.flatMap((o) => [o.metric_id, o.source_id, o.value])].map(norm).join(" ");
}
function matchOp(a: Asset, obs: Obs[], cells: string, op: Op): boolean {
  const { field, cmp, val } = op;
  if (field === "value") {
    const target = parseFloat(val);
    if (isNaN(target)) return false;
    return obs.some((o) => {
      const n = parseFloat(String(o.value));
      if (isNaN(n)) return false;
      return cmp === ">" ? n > target : cmp === "<" ? n < target
        : cmp === ">=" ? n >= target : cmp === "<=" ? n <= target : n === target;
    });
  }
  if (field === "metric") return obs.some((o) => norm(o.metric_id).includes(val));
  if (field === "source") return obs.some((o) => norm(o.source_id).includes(val));
  if (field === "type") return norm(a.asset_type).includes(val);
  if (field === "country") return norm(a.country).includes(val);
  if (field === "name") return norm(a.name).includes(val);
  return cells.includes(val);
}
export function runSearch(query: string, data: { assets: Asset[]; observations: Obs[] }): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const { ops, free } = parseQuery(q);
  return data.assets.map((a) => {
    const obs = data.observations.filter((o) => o.asset_id === a.asset_id);
    const cells = buildCells(a, obs);
    const freeOk = free.every((f) => cells.includes(f));
    const opOk = ops.every((op) => matchOp(a, obs, cells, op));
    if (!freeOk || !opOk) return null;
    const matchedObs = obs.filter((o) => {
      const oc = [o.metric_id, o.source_id, o.value].map(norm).join(" ");
      return free.length === 0 || free.some((f) => oc.includes(f));
    });
    return { asset: a, matchedObs: matchedObs.length ? matchedObs : obs, hitCount: obs.length };
  }).filter((r): r is SearchResult => r !== null);
}
export const OPERATORS = ["type:", "metric:", "source:", "country:", "name:", "value>", "value<"];
