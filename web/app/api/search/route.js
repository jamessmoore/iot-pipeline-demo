import { NextResponse } from 'next/server';
import { getHistory } from '../../lib/opensearch';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('device_id');
  const from = searchParams.get('from');
  const size = parseInt(searchParams.get('size') || '50', 10);

  if (!deviceId) {
    return NextResponse.json({ error: 'device_id is required' }, { status: 400 });
  }

  try {
    const readings = await getHistory(deviceId, size, from);
    return NextResponse.json(readings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
