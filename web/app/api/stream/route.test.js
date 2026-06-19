import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/opensearch', () => ({
  getLatestForAllWells: vi.fn(),
}));

import { getLatestForAllWells } from '../../lib/opensearch';
import { GET } from './route';

async function readFirstChunk(response) {
  const reader = response.body.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return new TextDecoder().decode(value);
}

describe('GET /api/stream', () => {
  beforeEach(() => {
    getLatestForAllWells.mockReset();
  });

  it('emits an SSE event with the latest readings', async () => {
    getLatestForAllWells.mockResolvedValue([{ device_id: 'well-tx-001', status: 'normal' }]);
    const controller = new AbortController();
    const request = new Request('http://localhost/api/stream', { signal: controller.signal });

    const response = await GET(request);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const chunk = await readFirstChunk(response);
    expect(chunk).toContain('data: ');
    expect(chunk).toContain('well-tx-001');

    controller.abort();
  });

  it('emits an SSE error event when the lookup fails', async () => {
    getLatestForAllWells.mockRejectedValue(new Error('opensearch unreachable'));
    const controller = new AbortController();
    const request = new Request('http://localhost/api/stream', { signal: controller.signal });

    const response = await GET(request);
    const chunk = await readFirstChunk(response);

    expect(chunk).toContain('event: error');
    expect(chunk).toContain('opensearch unreachable');

    controller.abort();
  });
});
