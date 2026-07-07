// getStakeholderGraph() — read-only network overlay loader.
// Reads the three demo CSVs and returns { nodes, edges, phases } in one payload.
// Never touches the observations path. CSV-only; works with DB_BACKEND=csv.
import fs from 'fs';
import path from 'path';

const DEMO_DIR = path.join(process.cwd(), 'data', 'demos', 'stakeholder-network');

function parseCSV(file) {
  const text = fs.readFileSync(path.join(DEMO_DIR, file), 'utf8').trim();
  const [header, ...rows] = text.split('\n');
  const cols = header.split(',');
  return rows.map((line) => {
    // naive split is safe here: no embedded commas in these seed files
    const vals = line.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, vals[i] ?? '']));
  });
}

export function getStakeholderGraph() {
  const phases = parseCSV('stakeholder_phases.csv')
    .map((p) => ({ ...p, phase_order: Number(p.phase_order) }))
    .sort((a, b) => a.phase_order - b.phase_order);

  const nodes = parseCSV('stakeholders.csv').map((n) => ({
    ...n,
    latitude: n.latitude === '' ? null : Number(n.latitude),
    longitude: n.longitude === '' ? null : Number(n.longitude),
  }));

  const edges = parseCSV('stakeholder_edges.csv');

  return { nodes, edges, phases };
}
