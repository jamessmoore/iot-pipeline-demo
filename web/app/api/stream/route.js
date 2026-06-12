import { getLatestForAllWells } from '../../lib/opensearch';

export const dynamic = 'force-dynamic';

const POLL_INTERVAL_MS = 2000;

export async function GET(request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = async () => {
        try {
          const readings = await getLatestForAllWells();
          const event = `data: ${JSON.stringify(readings)}\n\n`;
          controller.enqueue(encoder.encode(event));
        } catch (err) {
          const event = `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`;
          controller.enqueue(encoder.encode(event));
        }
      };

      send();
      const interval = setInterval(send, POLL_INTERVAL_MS);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
