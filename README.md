# IoT Pipeline Demo — Oil Well Tank Monitoring

A full-stack IoT telemetry pipeline that simulates ESP32-based oil well tank monitors across 10 Texas wells, streams their readings through MQTT, indexes them in OpenSearch, and visualizes live status on a Next.js map dashboard.

This is a portfolio/demo project — not a production system or client deliverable.

![Tests](https://github.com/jamessmoore/iot-pipeline-demo/actions/workflows/test.yml/badge.svg)

## Architecture

```
simulator (Python)  --MQTT-->  Mosquitto broker  --MQTT-->  bridge (Node.js)  --index-->  OpenSearch
                                                                                                |
                                                                                          web (Next.js)
                                                                                       dashboard + API
```

- **`simulator/`** — Python script that simulates 10 ESP32 well sensors, publishing tank level, temperature, pressure, and flow rate readings to `sensors/{device_id}/data` every 3 seconds. Supports scripted alert scenarios for demo purposes.
- **`mosquitto/`** — Mosquitto MQTT broker config that receives sensor publishes.
- **`bridge/`** — Node.js MQTT subscriber that consumes readings, computes alert status, and indexes each document into OpenSearch.
- **`opensearch/`** — Index mapping and setup script for the `well-telemetry` index.
- **`web/`** — Next.js dashboard: live map of all 10 wells (status-colored markers), a telemetry detail panel, per-well history charts, and a server-sent-events stream for real-time updates.

## Data Model

Each telemetry reading includes:

| Field | Description |
|---|---|
| `device_id` | Well identifier, e.g. `well-tx-003` |
| `location_name`, `field_name`, `operator` | Well metadata |
| `location` | `{ lat, lon }` geo point |
| `tank_level_pct`, `temperature_f`, `pressure_psi`, `flow_rate_bpd` | Sensor readings |
| `status` | `normal` or `alert` |
| `alert` | `none` or comma-joined alert codes (`LOW_TANK`, `HIGH_TANK`, `LOW_TEMP`, `HIGH_TEMP`, `LOW_PRESSURE`, `HIGH_PRESSURE`) |
| `timestamp` | ISO 8601 UTC |

Alert thresholds (shared between simulator and bridge):

| Metric | Low | High |
|---|---|---|
| Tank level | ≤ 15% | ≥ 90% |
| Temperature | ≤ 40°F | ≥ 140°F |
| Pressure | ≤ 50 psi | ≥ 300 psi |

## Running Locally

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts Mosquitto (`1883`), OpenSearch (`9200`), and OpenSearch Dashboards (`5601`).

### 2. Create the OpenSearch index

```bash
./opensearch/setup-index.sh
```

### 3. Start the bridge (MQTT → OpenSearch)

```bash
cd bridge
npm install
npm start
```

### 4. Start the simulator

```bash
cd simulator
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Continuous normal operation across all 10 wells
python publish.py

# Demo mode: pushes 3 wells into alert states, rest drift normally
python publish.py --demo

# Target a single well with a specific scenario
python publish.py --well well-tx-003 --scenario high_tank

# Publish a single snapshot and exit
python publish.py --well well-tx-003 --scenario high_tank --once
```

Available scenarios: `normal`, `high_tank`, `low_tank`, `high_temp`, `low_temp`, `high_pressure`, `low_pressure`.

### 5. Start the web dashboard

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

`web/.env.local` (not committed):

```
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_INDEX=well-telemetry
NEXT_PUBLIC_STADIA_API_KEY=<your Stadia Maps API key>
```

`bridge/` reads `MQTT_URL`, `OPENSEARCH_URL`, and `OPENSEARCH_INDEX` from the environment (same defaults as above).

## Tech Stack

- **Simulator:** Python, `paho-mqtt`
- **Broker:** Eclipse Mosquitto
- **Bridge:** Node.js, `mqtt`, `@opensearch-project/opensearch`
- **Storage:** OpenSearch + OpenSearch Dashboards
- **Web:** Next.js 14, React 18, Tailwind CSS, MapLibre GL (`react-map-gl`), Recharts
