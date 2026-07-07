// getObservationJourney(observationId) — read-only.
// Returns the full Birth->Exit path for one data point, each edge annotated
// with its stakeholders, phase, phase color, and reached flag.
// reached=true -> render bold/full color; reached=false -> render faded.
// The whole path is always returned so the journey stays readable end to end.
import fs from 'fs';
import path from 'path';

const DEMO = path.join(process.cwd(), 'data', 'demos', 'stakeholder-network');
const csv = (file) => {
  const t = fs.readFileSync(path.join(DEMO, file), 'utf8').replace(/\r/g, '').trim();
  const [h, ...r] = t.split('\n');
  const cols = h.split(',');
  return r.map((line) => Object.fromEntries(cols.map((c, i) => [c, line.split(',')[i] ?? ''])));
};

export function getObservationJourney(observationId) {
  const stakeholders = Object.fromEntries(csv('stakeholders.csv').map((s) => [s.stakeholder_id, s]));
  const phases = Object.fromEntries(csv('stakeholder_phases.csv').map((p) => [p.phase_id, p]));
  const edges = Object.fromEntries(csv('stakeholder_edges.csv').map((e) => [e.edge_id, e]));
  const assets = Object.fromEntries(csv('journey_assets.csv').map((a) => [a.asset_id, a]));
  const obsRaw = csv('journey_observations.csv').find((o) => o.observation_id === observationId);
  const asset = obsRaw ? assets[obsRaw.asset_id] : null;
  const obs = obsRaw ? { ...obsRaw, name: asset?.name ?? obsRaw.asset_id,
    latitude: asset ? Number(asset.latitude) : null,
    longitude: asset ? Number(asset.longitude) : null, domain: asset?.domain ?? '' } : null;

  // role label with fallback so the Vault (empty website_role) still shows a name
  const label = (id) => stakeholders[id].website_role || stakeholders[id].archetype || id;

  const steps = csv('observation_journey.csv')
    .filter((j) => j.observation_id === observationId)
    .sort((a, b) => Number(a.seq) - Number(b.seq))
    .map((j) => {
      const e = edges[j.edge_id];
      const ph = phases[e.phase_id];
      const reached = j.reached === '1';
      return {
        seq: Number(j.seq),
        edge_id: e.edge_id,
        relationship_name: e.relationship_name,
        flow_type: e.flow_type,
        phase_id: e.phase_id,
        phase_name: ph.name,
        color_hex: ph.color_hex,
        reached,
        // render hint: full color if reached, faded if downstream
        render: reached ? { opacity: 1.0, weight: 'bold' } : { opacity: 0.35, weight: 'normal' },
        source: { id: e.source_id, role: label(e.source_id), archetype: stakeholders[e.source_id].archetype },
        target: { id: e.target_id, role: label(e.target_id), archetype: stakeholders[e.target_id].archetype },
      };
    });

  // phase-level rollup for the Data Journey panel
  const reachedPhaseIds = new Set(steps.filter((s) => s.reached).map((s) => s.phase_id));
  const panel = Object.values(phases)
    .sort((a, b) => Number(a.phase_order) - Number(b.phase_order))
    .map((p) => ({
      phase_id: p.phase_id, name: p.name, color_hex: p.color_hex,
      reached: reachedPhaseIds.has(p.phase_id),
      edge_count: steps.filter((s) => s.phase_id === p.phase_id).length,
    }));

  // distinct stakeholders touched (reached only) for the popup header
  const touched = [...new Set(steps.filter((s) => s.reached).flatMap((s) => [s.source.id, s.target.id]))]
    .map((id) => ({ id, role: label(id), archetype: stakeholders[id].archetype }));

  return { observation: obs, reached_phase: obs?.reached_phase, steps, panel, stakeholders_touched: touched };
}

// getJourneyByAsset(assetId) — the map clicks assets, not observations.
// Resolves the asset's observation (1:1 in this demo) then returns its journey.
export function getJourneyByAsset(assetId) {
  const obs = csv('journey_observations.csv').find((o) => o.asset_id === assetId);
  if (!obs) return null;
  return getObservationJourney(obs.observation_id);
}
