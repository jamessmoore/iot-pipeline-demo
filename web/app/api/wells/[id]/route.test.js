import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/opensearch', () => ({
  getHistory: vi.fn(),
  getAlertHistory: vi.fn(),
}));

import { getHistory, getAlertHistory } from '../../../lib/opensearch';
import { GET } from './route';

describe('GET /api/wells/[id]', () => {
  beforeEach(() => {
    getHistory.mockReset();
    getAlertHistory.mockReset();
  });

  it('combines history and alert history for the requested well', async () => {
    getHistory.mockResolvedValue([{ tank_level_pct: 50 }]);
    getAlertHistory.mockResolvedValue([{ alert: 'LOW_TANK' }]);

    const request = new Request('http://localhost/api/wells/well-tx-003');
    const response = await GET(request, { params: { id: 'well-tx-003' } });

    expect(getHistory).toHaveBeenCalledWith('well-tx-003', 50);
    expect(getAlertHistory).toHaveBeenCalledWith('well-tx-003', 20);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      device_id: 'well-tx-003',
      history: [{ tank_level_pct: 50 }],
      alertHistory: [{ alert: 'LOW_TANK' }],
    });
  });

  it('returns 500 when either lookup fails', async () => {
    getHistory.mockResolvedValue([]);
    getAlertHistory.mockRejectedValue(new Error('opensearch unreachable'));

    const request = new Request('http://localhost/api/wells/well-tx-003');
    const response = await GET(request, { params: { id: 'well-tx-003' } });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'opensearch unreachable' });
  });
});
