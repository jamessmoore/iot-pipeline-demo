const WELLS = [
  { device_id: 'well-tx-001', location_name: 'Midland County #1', field_name: 'Midland Basin', operator: 'Lone Star Petroleum', lat: 31.9973, lon: -102.0779 },
  { device_id: 'well-tx-002', location_name: 'Ector County #1', field_name: 'Central Basin Platform', operator: 'Lone Star Petroleum', lat: 31.8457, lon: -102.3676 },
  { device_id: 'well-tx-003', location_name: 'Andrews County #1', field_name: 'Midland Basin', operator: 'Lone Star Petroleum', lat: 32.3187, lon: -102.5460 },
  { device_id: 'well-tx-004', location_name: 'Howard County #1', field_name: 'Midland Basin', operator: 'Lone Star Petroleum', lat: 32.2504, lon: -101.4787 },
  { device_id: 'well-tx-005', location_name: 'Reeves County #1', field_name: 'Delaware Basin', operator: 'Lone Star Petroleum', lat: 31.4229, lon: -103.4932 },
  { device_id: 'well-tx-006', location_name: 'Ward County #1', field_name: 'Delaware Basin', operator: 'Lone Star Petroleum', lat: 31.5952, lon: -102.8946 },
  { device_id: 'well-tx-007', location_name: 'Winkler County #1', field_name: 'Delaware Basin', operator: 'Lone Star Petroleum', lat: 31.8568, lon: -103.0930 },
  { device_id: 'well-tx-008', location_name: 'Crane County #1', field_name: 'Central Basin Platform', operator: 'Lone Star Petroleum', lat: 31.3974, lon: -102.3502 },
  { device_id: 'well-tx-009', location_name: 'Glasscock County #1', field_name: 'Midland Basin', operator: 'Lone Star Petroleum', lat: 31.8682, lon: -101.4865 },
  { device_id: 'well-tx-010', location_name: 'Loving County #1', field_name: 'Delaware Basin', operator: 'Lone Star Petroleum', lat: 31.7507, lon: -103.1574 },
];

const THRESHOLDS = {
  tank_level_pct: { low: 15, high: 90 },
  temperature_f: { low: 40, high: 140 },
  pressure_psi: { low: 50, high: 300 },
};

function computeStatus(reading) {
  const alerts = [];

  if (reading.tank_level_pct <= THRESHOLDS.tank_level_pct.low) alerts.push('LOW_TANK');
  if (reading.tank_level_pct >= THRESHOLDS.tank_level_pct.high) alerts.push('HIGH_TANK');

  if (reading.temperature_f <= THRESHOLDS.temperature_f.low) alerts.push('LOW_TEMP');
  if (reading.temperature_f >= THRESHOLDS.temperature_f.high) alerts.push('HIGH_TEMP');

  if (reading.pressure_psi <= THRESHOLDS.pressure_psi.low) alerts.push('LOW_PRESSURE');
  if (reading.pressure_psi >= THRESHOLDS.pressure_psi.high) alerts.push('HIGH_PRESSURE');

  if (alerts.length === 0) {
    return { status: 'normal', alert: 'none' };
  }
  return { status: 'alert', alert: alerts.join(',') };
}

module.exports = { WELLS, THRESHOLDS, computeStatus };
