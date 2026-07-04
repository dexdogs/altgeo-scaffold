-- =============================================================
-- schema_ext: domain metrics  —  example of a content extension.
-- =============================================================
-- Adds metric DEFINITIONS across several environmental domains to prove the
-- long/tidy schema handles multi-domain data through ONE metrics table with
-- zero structural change. Pure INSERTs into core — nothing is altered.
-- Swap these rows for your own domain; the rest of the scaffold is unchanged.
-- =============================================================

INSERT INTO metrics (metric_id, name, unit, description, direction) VALUES
  -- carbon
  ('co2e_stack',   'Stack CO2e flux',      'tCO2e/h', 'Satellite-derived stack emissions rate', 'higher_bad'),
  ('methane_col',  'Methane column',       'ppb',     'Column-averaged methane concentration',  'higher_bad'),
  -- water
  ('water_stress', 'Baseline water stress','ratio',   'Withdrawals / available supply',         'higher_bad'),
  ('reservoir_pct','Reservoir fill',       'pct',     'Reservoir capacity filled',              'higher_good'),
  -- energy
  ('grid_load',    'Grid load',            'MW',      'Instantaneous facility power draw',       'neutral'),
  ('solar_util',   'Solar utilization',    'pct',     'Panel output vs nameplate capacity',      'higher_good'),
  -- climate risk / data centers
  ('heat_days',    'Extreme-heat days',    'days/yr', 'Days above local heat threshold',         'higher_bad'),
  ('pue',          'Power usage effectiveness','ratio','Data-center total power / IT power',      'higher_bad')
ON CONFLICT (metric_id) DO NOTHING;

-- Optional narrow detail table: extra columns for carbon plumes that don't
-- belong on every observation. FKs INTO core; never alters observations.
CREATE TABLE IF NOT EXISTS carbon_detail (
  observation_id TEXT PRIMARY KEY REFERENCES observations(observation_id),
  plume_area_km2 NUMERIC,
  wind_ms        NUMERIC
);
