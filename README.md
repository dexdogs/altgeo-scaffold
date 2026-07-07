# dexdogs.earth — AltGeo Scaffold

A reusable, end-to-end template for geospatial alternative-data applications. The **structure is the product**, not any single dataset — any environmental/alt-data domain (carbon, water, energy load, climate hazard, data-center footprint) drops into this skeleton with minimal rework.

> All data in this repository is **synthetic placeholder content**, labeled as such.

---

## The core idea

This project builds a reusable scaffold for geospatial alternative-data applications — a template where the structure is the product, not any single dataset. The bet is simple: environmental alt-data problems (carbon, water, energy load, climate hazard, data-center footprint) all share the same underlying shape. Physical assets sit somewhere on Earth. Observations accumulate against those assets over time. Each observation came from somewhere and must be auditable. Build that skeleton once, cleanly, and any environmental domain drops in with minimal rework. The scaffold is opinionated about structure and unopinionated about content, so forking it for a new domain is fast.

## Why it matters

Alternative data — satellite imagery, sensors, foot-traffic, shipping trackers, public records — lets analysts see an entity's reality before it surfaces in official filings or press releases. For hedge funds and environmental-commodity desks, that lead time is the edge. But alt data is messy: less structured, less accessible, uneven in granularity, coverage, and history. The value isn't in collecting it; it's in organizing it so patterns become legible. That's what this scaffold exists to do. It turns scattered environmental signals into structured, location-anchored intelligence that a desk can actually query, audit, and act on ahead of the market.

## The three layers

The architecture is three layers. The front end is an interactive map: because everything happens somewhere, location is the primary analytical surface, with markers rendering location-anchored records and popups exposing attributes. The back end is a table-format database, backend-agnostic by design — Supabase/Postgres is the default, but the same schema degrades gracefully to a plain Excel/CSV sheet, and nothing may depend on a feature a flat sheet can't emulate. The schema is the contract between map and database, and the thing that matters most. Quality of the schema outranks map polish or data volume every single time.

## Schema principles

Assets carry location as latitude/longitude in decimal degrees, so any flat sheet works; PostGIS geometry is only ever an addition. Observations are long/tidy — one row per (asset, metric, timestamp) — so new metrics never require schema changes and the Excel fallback stays sane. Provenance is first-class: every observation carries its source, ingestion timestamp, and enough lineage to audit it, because in alt data where the number came from matters as much as the number. Entities map to tables: assets, observations, sources, metrics, and optional regions. Primary-key/foreign-key pairs make it relational; every table survives export to CSV as one sheet.

## The stakeholder network

Environmental credits pass through a chain of fifteen stakeholder roles, from Rulemakers who set standards, through Manufacturers, Developers, Generators, Testers, and Loggers who create and record data, to Modelers, Auditors, Labelers, and Minters who calculate and certify it, and finally Raters, Facilitators, Buyers, Reporters, and Regulators who trade and police it. A sixteenth node, Retirement, is where credits are finally retired. These sixteen actors are joined by thirty-four directed relationships — the edges along which data, rules, money, and verification flow. This network is the map of who touches a data point and in what order.

## The four phases

The thirty-four relationships group into four phases of a single data point's life. Pre-Flight is where rules and specifications are encoded before any sensor pulse exists. Birth is the moment a physical event — heat, flow, movement — is digitized and indexed, giving the data its 'digital birth certificate.' Maturation is where raw readings are calculated into CO2e, audited for truth, and packaged into a financial credit. Exit is where the credit is traded, used to prove a claim, and finally retired so it cannot be reused. Every phase carries a distinct color, so the journey is legible at a glance.

## The data journey

Click any asset on the map to trace its data journey. A panel opens showing the full path from Birth to Exit across all sixteen stakeholders and thirty-four edges. Phases the data point has actually reached appear in bold, saturated color; phases still ahead of it fade to a lighter tint but remain readable, so you always see the complete route. Each edge names its two stakeholders and its phase. This is the evidence chain made visible: not a static diagram, but a per-observation trace showing exactly how far a specific reading has travelled from raw signal toward a retired credit.

## Evidence-chain integrity

One rule is non-negotiable: raw observations are never binned, indexed, or modified. The moment a physical event is digitized, that row is the authoritative record and stays untouched forever. All spatial indexing, roll-ups, and cross-vendor fusion happen on a separate derived layer that references the raw observation but never overwrites it. This is why the journey model stores a data point's full path and simply marks how far it has travelled, rather than mutating the reading itself. Auditability depends on this: if you can't trust that the birth certificate is unaltered, nothing downstream — the credit, the trade, the claim — can be trusted.

## The philosophy

A good scaffold is opinionated about structure, unopinionated about content. It should feel obvious to a developer dropping in a new dataset and invisible once they do. Data here is treated as illustrative — synthetic seed rows exist so the map renders something immediately, not because the data is the point. The current demo uses ten synthetic US facilities with varied journeys, all placeholder content. The end state is a clean, auditable, map-first plumbing layer that turns scattered environmental signals into structured, location-anchored intelligence, reusable across every alt-data domain that touches the physical world — carbon today, water or energy tomorrow.

---

## Architecture at a glance

| Layer | Role |
|---|---|
| **Front end** | Next.js App Router + Mapbox GL globe. Renders location-anchored assets as pulsating markers; click any asset to open its Data Journey panel. |
| **Back end** | Backend-agnostic `DataAdapter` interface. Swap `DB_BACKEND` between `csv` (default flat-file), `supabase`, and `postgres` with no app-code change. |
| **Schema** | Five frozen core tables (`assets`, `observations`, `sources`, `metrics`, `regions`), long/tidy observation model, text IDs, decimal-degree lat/lng. Degrades to plain CSV. |

## The stakeholder network layer

An additive overlay (migrations 003–004) models the carbon-credit stakeholder chain as a directed graph, joined to the observation layer so any data point can trace its path:

- **16 stakeholders** (`stakeholders.csv`) — 15 canonical roles + a Retirement sink.
- **34 directed edges** (`stakeholder_edges.csv`) — each carrying source, target, flow type, and phase.
- **4 phases** (`stakeholder_phases.csv`) — Pre-Flight → Birth → Maturation → Exit, each color-coded.
- **observation_journey** bridge — one row per (observation, edge) traversed, with a `reached` flag driving the bold/faded rendering.

### The 15 stakeholder roles

1. **The Rulemakers** — set legal standards and issuance rules
2. **The Manufacturers** — produce sensing hardware and low-carbon products
3. **The Developers** — manage the projects that generate data
4. **The Generators** — the physical source where the event occurs
5. **The Testers** — verify sensor and device accuracy
6. **The Loggers** — record raw operational data
7. **The Modelers** — convert readings into CO2e via lifecycle math
8. **The Auditors** — independent third-party verification
9. **The Labelers** — attach integrity and co-benefit tags
10. **The Minters** — issue serialized credits and hold the registry
11. **The Raters** — grade credit quality and risk
12. **The Facilitators** — marketplaces where assets trade
13. **The Buyers** — purchase credits to meet mandates
14. **The Reporters** — ESG disclosure and outcome reporting
15. **The Regulators** — national and local referees enforcing claims

Plus a 16th terminal node, **The Vault (Retirement)**, where credits are retired and cannot be reused.

Set `NEXT_PUBLIC_MAPBOX_TOKEN` for the map. The default `DB_BACKEND=csv` needs no database — it reads `schema/seed/*.csv`.

---

*Synthetic data throughout. The scaffold is the deliverable; the data is illustrative.*
