-- Migration 003: Stakeholder network overlay (ADDITIVE ONLY)
-- 15 carbon-credit stakeholder roles + Vault sink (16 nodes), 34 relationships,
-- 4-phase data journey. Touches nothing in schema_core. Degrades to 3 CSV sheets.

CREATE TABLE IF NOT EXISTS stakeholder_phases (
  phase_id     TEXT PRIMARY KEY,
  phase_order  INTEGER NOT NULL,
  name         TEXT NOT NULL,
  focus        TEXT,
  data_state   TEXT,
  color_hex    TEXT
);

CREATE TABLE IF NOT EXISTS stakeholders (
  stakeholder_id    TEXT PRIMARY KEY,
  website_role      TEXT,
  archetype         TEXT,
  primary_phase_id  TEXT REFERENCES stakeholder_phases(phase_id),
  latitude          NUMERIC,
  longitude         NUMERIC,
  description        TEXT
);

CREATE TABLE IF NOT EXISTS stakeholder_edges (
  edge_id            TEXT PRIMARY KEY,
  relationship_name  TEXT NOT NULL,
  source_id          TEXT NOT NULL REFERENCES stakeholders(stakeholder_id),
  target_id          TEXT NOT NULL REFERENCES stakeholders(stakeholder_id),
  flow_type          TEXT NOT NULL,
  phase_id           TEXT NOT NULL REFERENCES stakeholder_phases(phase_id)
);

CREATE INDEX IF NOT EXISTS idx_edges_source ON stakeholder_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON stakeholder_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_phase  ON stakeholder_edges(phase_id);
CREATE INDEX IF NOT EXISTS idx_stk_phase    ON stakeholders(primary_phase_id);
