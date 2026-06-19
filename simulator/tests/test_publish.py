import random
from datetime import datetime

import pytest

from publish import (
    ALERT_BOUNDS,
    DEMO_OVERRIDES,
    NORMAL_BOUNDS,
    SCENARIOS,
    WELLS,
    bounds_for,
    build_payload,
    compute_status,
    drift,
    init_state,
)


@pytest.mark.parametrize(
    "reading,expected_status,expected_alert",
    [
        ({"tank_level_pct": 55, "temperature_f": 95, "pressure_psi": 160}, "normal", "none"),
        ({"tank_level_pct": 15, "temperature_f": 95, "pressure_psi": 160}, "alert", "LOW_TANK"),
        ({"tank_level_pct": 90, "temperature_f": 95, "pressure_psi": 160}, "alert", "HIGH_TANK"),
        ({"tank_level_pct": 55, "temperature_f": 40, "pressure_psi": 160}, "alert", "LOW_TEMP"),
        ({"tank_level_pct": 55, "temperature_f": 140, "pressure_psi": 160}, "alert", "HIGH_TEMP"),
        ({"tank_level_pct": 55, "temperature_f": 95, "pressure_psi": 50}, "alert", "LOW_PRESSURE"),
        ({"tank_level_pct": 55, "temperature_f": 95, "pressure_psi": 300}, "alert", "HIGH_PRESSURE"),
        (
            {"tank_level_pct": 94, "temperature_f": 155, "pressure_psi": 320},
            "alert",
            "HIGH_TANK,HIGH_TEMP,HIGH_PRESSURE",
        ),
        ({"tank_level_pct": 8, "temperature_f": 95, "pressure_psi": 35}, "alert", "LOW_TANK,LOW_PRESSURE"),
    ],
)
def test_compute_status(reading, expected_status, expected_alert):
    status, alert = compute_status(reading)
    assert status == expected_status
    assert alert == expected_alert


def test_drift_stays_within_bounds():
    random.seed(42)
    value = 50.0
    bounds = (0, 100)
    for _ in range(1000):
        value = drift(value, 5, bounds)
        assert bounds[0] <= value <= bounds[1]


def test_bounds_for_alert_uses_wider_range_when_defined():
    assert bounds_for("tank_level_pct", "alert") == ALERT_BOUNDS["tank_level_pct"]
    assert bounds_for("tank_level_pct", "normal") == NORMAL_BOUNDS["tank_level_pct"]


def test_bounds_for_falls_back_to_normal_when_no_alert_bounds_defined():
    # flow_rate_bpd has no entry in ALERT_BOUNDS, so it always uses NORMAL_BOUNDS.
    assert bounds_for("flow_rate_bpd", "alert") == NORMAL_BOUNDS["flow_rate_bpd"]


def test_build_payload_shape_and_rounding():
    well = WELLS[0]
    metrics = {
        "tank_level_pct": 55.567,
        "temperature_f": 95.123,
        "pressure_psi": 160.999,
        "flow_rate_bpd": 250.05,
    }

    payload = build_payload(well, metrics)

    assert payload["device_id"] == well["device_id"]
    assert payload["location"] == {"lat": well["lat"], "lon": well["lon"]}
    assert payload["tank_level_pct"] == 55.6
    assert payload["temperature_f"] == 95.1
    assert payload["pressure_psi"] == 161.0
    assert payload["status"] == "normal"
    assert payload["alert"] == "none"
    # raises if the timestamp isn't ISO 8601 UTC with second precision
    datetime.strptime(payload["timestamp"], "%Y-%m-%dT%H:%M:%SZ")


def test_init_state_demo_overrides_only_apply_to_listed_wells():
    state = init_state(demo=True)

    for device_id, scenario_name in DEMO_OVERRIDES.items():
        scenario = SCENARIOS[scenario_name]
        assert state[device_id]["tank_level_pct"] == scenario["tank_level_pct"]
        assert state[device_id]["temperature_f"] == scenario["temperature_f"]
        assert state[device_id]["pressure_psi"] == scenario["pressure_psi"]

    normal_well_id = next(w["device_id"] for w in WELLS if w["device_id"] not in DEMO_OVERRIDES)
    normal_scenario = SCENARIOS["normal"]
    assert state[normal_well_id]["tank_level_pct"] == normal_scenario["tank_level_pct"]


def test_init_state_single_well_override_does_not_affect_other_wells():
    state = init_state(well_overrides={"device_id": "well-tx-005", "scenario": "low_pressure"})

    scenario = SCENARIOS["low_pressure"]
    assert state["well-tx-005"]["pressure_psi"] == scenario["pressure_psi"]

    normal_scenario = SCENARIOS["normal"]
    assert state["well-tx-001"]["tank_level_pct"] == normal_scenario["tank_level_pct"]
