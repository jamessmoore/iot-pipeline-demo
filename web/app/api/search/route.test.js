import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/opensearch', () => ({
  getHistory: vi.fn(),
}));

import { getHistory } from '../../lib/opensearch';
import { GET } from './route';

describe('GET /api/search', () => {
  beforeEach(() => {
    getHistory.mockReset();
  });

  it('returns 400 when device_id is missing', async () => {
    const request = new Request('http://localhost/api/search');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'device_id is required' });
    expect(getHistory).not.toHaveBeenCalled();
  });

  it('forwards device_id, from, and size to getHistory', async () => {
    getHistory.mockResolvedValue([{ device_id: 'well-tx-003', tank_level_pct: 50 }]);
    const request = new Request(
      'http://localhost/api/search?device_id=well-tx-003&from=2026-06-01T00:00:00Z&size=10'
    );

    const response = await GET(request);

    expect(getHistory).toHaveBeenCalledWith('well-tx-003', 10, '2026-06-01T00:00:00Z');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ device_id: 'well-tx-003', tank_level_pct: 50 }]);
  });

  it('defaults size to 50 when not provided', async () => {
    getHistory.mockResolvedValue([]);
    const request = new Request('http://localhost/api/search?device_id=well-tx-003');

    await GET(request);

    expect(getHistory).toHaveBeenCalledWith('well-tx-003', 50, null);
  });

  it('returns 500 when getHistory throws', async () => {
    getHistory.mockRejectedValue(new Error('opensearch unreachable'));
    const request = new Request('http://localhost/api/search?device_id=well-tx-003');

    const response = await GET(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'opensearch unreachable' });
  });
});
