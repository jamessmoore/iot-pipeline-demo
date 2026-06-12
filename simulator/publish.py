#!/usr/bin/env python3
"""IOT-pipeline-demo — telemetry simulator.

Publishes simulated ESP32 sensor readings to an MQTT broker on
``sensors/{device_id}/data`` for 10 Texas well locations.
"""

import argparse
import json
import os
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

MQTT_HOST = os.environ.get("MQTT_HOST", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
TICK_SECONDS = 3

WELLS = [
    {"device_id": "well-tx-001", "location_name": "Midland County #1", "field_name": "Midland Basin", "operator": "Lone Star Petroleum", "lat": 31.9973, "lon": -102.0779},
    {"device_id": "well-tx-002", "location_name": "Ector County #1", "field_name": "Central Basin Platform", "operator": "Lone Star Petroleum", "lat": 31.8457, "lon": -102.3676},
    {"device_id": "well-tx-003", "location_name": "Andrews County #1", "field_name": "Midland Basin", "operator": "Lone Star Petroleum", "lat": 32.3187, "lon": -102.5460},
    {"device_id": "well-tx-004", "location_name": "Howard County #1", "field_name": "Midland Basin", "operator": "Lone Star Petroleum", "lat": 32.2504, "lon": -101.4787},
    {"device_id": "well-tx-005", "location_name": "Reeves County #1", "field_name": "Delaware Basin", "operator": "Lone Star Petroleum", "lat": 31.4229, "lon": -103.4932},
    {"device_id": "well-tx-006", "location_name": "Ward County #1", "field_name": "Delaware Basin", "operator": "Lone Star Petroleum", "lat": 31.5952, "lon": -102.8946},
    {"device_id": "well-tx-007", "location_name": "Winkler County #1", "field_name": "Delaware Basin", "operator": "Lone Star Petroleum", "lat": 31.8568, "lon": -103.0930},
    {"device_id": "well-tx-008", "location_name": "Crane County #1", "field_name": "Central Basin Platform", "operator": "Lone Star Petroleum", "lat": 31.3974, "lon": -102.3502},
    {"device_id": "well-tx-009", "location_name": "Glasscock County #1", "field_name": "Midland Basin", "operator": "Lone Star Petroleum", "lat": 31.8682, "lon": -101.4865},
    {"device_id": "well-tx-010", "location_name": "Loving County #1", "field_name": "Delaware Basin", "operator": "Lone Star Petroleum", "lat": 31.7507, "lon": -103.1574},
]

THRESHOLDS = {
    "tank_level_pct": {"low": 15, "high": 90},
    "temperature_f": {"low": 40, "high": 140},
    "pressure_psi": {"low": 50, "high": 300},
}

# Scenario starting points: tank_level_pct, temperature_f, pressure_psi
SCENARIOS = {
    "normal": {"tank_level_pct": 55, "temperature_f": 95, "pressure_psi": 160},
    "high_tank": {"tank_level_pct": 94, "temperature_f": 95, "pressure_psi": 160},
    "low_tank": {"tank_level_pct": 8, "temperature_f": 95, "pressure_psi": 160},
    "high_temp": {"tank_level_pct": 55, "temperature_f": 155, "pressure_psi": 160},
    "low_temp": {"tank_level_pct": 55, "temperature_f": 28, "pressure_psi": 160},
    "high_pressure": {"tank_level_pct": 55, "temperature_f": 95, "pressure_psi": 320},
    "low_pressure": {"tank_level_pct": 55, "temperature_f": 95, "pressure_psi": 35},
}

# --demo: three wells pushed into alert state, everything else drifts normally
DEMO_OVERRIDES = {
    "well-tx-003": "high_tank",
    "well-tx-007": "high_temp",
    "well-tx-001": "low_tank",
}

# Random-walk step size per tick
STEP = {
    "tank_level_pct": 2,
    "temperature_f": 1,
    "pressure_psi": 5,
    "flow_rate_bpd": 10,
}

# Bounds for wells currently operating normally
NORMAL_BOUNDS = {
    "tank_level_pct": (10, 95),
    "temperature_f": (60, 130),
    "pressure_psi": (80, 280),
    "flow_rate_bpd": (100, 500),
}

# Wider bounds applied to a metric while it is in an alert state, so a
# scenario spike doesn't get immediately clamped back to a normal value.
ALERT_BOUNDS = {
    "tank_level_pct": (0, 100),
    "temperature_f": (0, 200),
    "pressure_psi": (0, 400),
}


def compute_status(reading):
    alerts = []

    if reading["tank_level_pct"] <= THRESHOLDS["tank_level_pct"]["low"]:
        alerts.append("LOW_TANK")
    if reading["tank_level_pct"] >= THRESHOLDS["tank_level_pct"]["high"]:
        alerts.append("HIGH_TANK")

    if reading["temperature_f"] <= THRESHOLDS["temperature_f"]["low"]:
        alerts.append("LOW_TEMP")
    if reading["temperature_f"] >= THRESHOLDS["temperature_f"]["high"]:
        alerts.append("HIGH_TEMP")

    if reading["pressure_psi"] <= THRESHOLDS["pressure_psi"]["low"]:
        alerts.append("LOW_PRESSURE")
    if reading["pressure_psi"] >= THRESHOLDS["pressure_psi"]["high"]:
        alerts.append("HIGH_PRESSURE")

    if not alerts:
        return "normal", "none"
    return "alert", ",".join(alerts)


def drift(value, step, bounds):
    new_value = value + random.uniform(-step, step)
    lo, hi = bounds
    return max(lo, min(hi, new_value))


def bounds_for(field, status):
    if status == "alert" and field in ALERT_BOUNDS:
        return ALERT_BOUNDS[field]
    return NORMAL_BOUNDS[field]


def init_state(well_overrides=None, demo=False):
    """Build the initial per-well metric state."""
    state = {}
    for well in WELLS:
        device_id = well["device_id"]
        scenario_name = "normal"

        if demo and device_id in DEMO_OVERRIDES:
            scenario_name = DEMO_OVERRIDES[device_id]
        elif well_overrides and well_overrides.get("device_id") == device_id:
            scenario_name = well_overrides["scenario"]

        scenario = SCENARIOS[scenario_name]
        state[device_id] = {
            "tank_level_pct": float(scenario["tank_level_pct"]),
            "temperature_f": float(scenario["temperature_f"]),
            "pressure_psi": float(scenario["pressure_psi"]),
            "flow_rate_bpd": float(random.uniform(*NORMAL_BOUNDS["flow_rate_bpd"])),
        }
    return state


def build_payload(well, metrics):
    status, alert = compute_status(metrics)
    return {
        "device_id": well["device_id"],
        "location_name": well["location_name"],
        "field_name": well["field_name"],
        "operator": well["operator"],
        "location": {"lat": well["lat"], "lon": well["lon"]},
        "tank_level_pct": round(metrics["tank_level_pct"], 1),
        "temperature_f": round(metrics["temperature_f"], 1),
        "pressure_psi": round(metrics["pressure_psi"], 1),
        "flow_rate_bpd": round(metrics["flow_rate_bpd"], 1),
        "status": status,
        "alert": alert,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def publish_reading(client, well, metrics):
    payload = build_payload(well, metrics)
    topic = f"sensors/{well['device_id']}/data"
    client.publish(topic, json.dumps(payload), qos=1)
    print(f"-> {topic} | tank={payload['tank_level_pct']}% temp={payload['temperature_f']}F "
          f"pressure={payload['pressure_psi']}psi flow={payload['flow_rate_bpd']}bpd "
          f"status={payload['status']} alert={payload['alert']}")


def run_continuous(client, well_overrides=None, demo=False):
    state = init_state(well_overrides=well_overrides, demo=demo)
    wells_by_id = {w["device_id"]: w for w in WELLS}

    print(f"Publishing every {TICK_SECONDS}s for {len(WELLS)} wells. Press Ctrl+C to stop.")
    try:
        while True:
            for well in WELLS:
                metrics = state[well["device_id"]]
                status, _ = compute_status(metrics)

                metrics["tank_level_pct"] = drift(
                    metrics["tank_level_pct"], STEP["tank_level_pct"], bounds_for("tank_level_pct", status))
                metrics["temperature_f"] = drift(
                    metrics["temperature_f"], STEP["temperature_f"], bounds_for("temperature_f", status))
                metrics["pressure_psi"] = drift(
                    metrics["pressure_psi"], STEP["pressure_psi"], bounds_for("pressure_psi", status))
                metrics["flow_rate_bpd"] = drift(
                    metrics["flow_rate_bpd"], STEP["flow_rate_bpd"], NORMAL_BOUNDS["flow_rate_bpd"])

                publish_reading(client, wells_by_id[well["device_id"]], metrics)

            time.sleep(TICK_SECONDS)
    except KeyboardInterrupt:
        print("\nStopping simulator.")


def run_once(client, well_id, scenario_name):
    well = next((w for w in WELLS if w["device_id"] == well_id), None)
    if well is None:
        raise SystemExit(f"Unknown well device_id: {well_id}")

    scenario = SCENARIOS[scenario_name]
    metrics = {
        "tank_level_pct": float(scenario["tank_level_pct"]),
        "temperature_f": float(scenario["temperature_f"]),
        "pressure_psi": float(scenario["pressure_psi"]),
        "flow_rate_bpd": float(random.uniform(*NORMAL_BOUNDS["flow_rate_bpd"])),
    }
    publish_reading(client, well, metrics)


def main():
    parser = argparse.ArgumentParser(description="IOT-pipeline-demo telemetry simulator")
    parser.add_argument("--well", help="device_id of the well to target, e.g. well-tx-003")
    parser.add_argument("--scenario", choices=sorted(SCENARIOS.keys()), help="scenario to apply to --well")
    parser.add_argument("--once", action="store_true", help="publish a single snapshot then exit")
    parser.add_argument("--demo", action="store_true", help="run the multi-well alert demo")
    args = parser.parse_args()

    if args.well and not args.scenario:
        parser.error("--well requires --scenario")
    if args.scenario and not args.well:
        parser.error("--scenario requires --well")
    if args.once and not (args.well and args.scenario):
        parser.error("--once requires --well and --scenario")
    if args.demo and (args.well or args.scenario or args.once):
        parser.error("--demo cannot be combined with --well/--scenario/--once")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(MQTT_HOST, MQTT_PORT)
    client.loop_start()

    try:
        if args.once:
            run_once(client, args.well, args.scenario)
        elif args.well and args.scenario:
            run_continuous(client, well_overrides={"device_id": args.well, "scenario": args.scenario})
        elif args.demo:
            run_continuous(client, demo=True)
        else:
            run_continuous(client)
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
