import { describe, it, expect } from 'vitest';
import { computeStatus, THRESHOLDS } from '../wells.js';

describe('computeStatus', () => {
  it('returns normal when all readings are within thresholds', () => {
    const result = computeStatus({ tank_level_pct: 55, temperature_f: 95, pressure_psi: 160 });
    expect(result).toEqual({ status: 'normal', alert: 'none' });
  });

  it.each([
    [{ tank_level_pct: THRESHOLDS.tank_level_pct.low, temperature_f: 95, pressure_psi: 160 }, 'LOW_TANK'],
    [{ tank_level_pct: THRESHOLDS.tank_level_pct.high, temperature_f: 95, pressure_psi: 160 }, 'HIGH_TANK'],
    [{ tank_level_pct: 55, temperature_f: THRESHOLDS.temperature_f.low, pressure_psi: 160 }, 'LOW_TEMP'],
    [{ tank_level_pct: 55, temperature_f: THRESHOLDS.temperature_f.high, pressure_psi: 160 }, 'HIGH_TEMP'],
    [{ tank_level_pct: 55, temperature_f: 95, pressure_psi: THRESHOLDS.pressure_psi.low }, 'LOW_PRESSURE'],
    [{ tank_level_pct: 55, temperature_f: 95, pressure_psi: THRESHOLDS.pressure_psi.high }, 'HIGH_PRESSURE'],
  ])('flags %s as %s at the threshold boundary', (reading, expectedAlert) => {
    const result = computeStatus(reading);
    expect(result).toEqual({ status: 'alert', alert: expectedAlert });
  });

  it('joins multiple simultaneous high alerts in tank/temp/pressure order', () => {
    const result = computeStatus({ tank_level_pct: 94, temperature_f: 155, pressure_psi: 320 });
    expect(result).toEqual({ status: 'alert', alert: 'HIGH_TANK,HIGH_TEMP,HIGH_PRESSURE' });
  });

  it('joins non-adjacent alerts (tank + pressure, temp normal)', () => {
    const result = computeStatus({ tank_level_pct: 8, temperature_f: 95, pressure_psi: 35 });
    expect(result).toEqual({ status: 'alert', alert: 'LOW_TANK,LOW_PRESSURE' });
  });
});
