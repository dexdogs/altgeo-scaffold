-- Migration 004: observation_journey bridge (ADDITIVE ONLY)
-- Joins observations (schema_core) to stakeholder_edges (migration 003).
-- One row per (observation, edge) traversed. 'reached' = 1 bold / 0 faded.
-- Full Birth->Exit path stored per data point so the journey stays readable.
CREATE TABLE IF NOT EXISTS observation_journey (
  journey_id      TEXT PRIMARY KEY,
  observation_id  TEXT NOT NULL REFERENCES observations(observation_id),
  edge_id         TEXT NOT NULL REFERENCES stakeholder_edges(edge_id),
  seq             INTEGER NOT NULL,
  reached         INTEGER NOT NULL,
  reached_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_journey_obs  ON observation_journey(observation_id);
CREATE INDEX IF NOT EXISTS idx_journey_edge ON observation_journey(edge_id);
CREATE INDEX IF NOT EXISTS idx_journey_seq  ON observation_journey(observation_id, seq);
