import { NextResponse } from 'next/server';
import { getHistory, getAlertHistory } from '../../../lib/opensearch';

export async function GET(request, { params }) {
  const deviceId = params.id;

  try {
    const [history, alertHistory] = await Promise.all([
      getHistory(deviceId, 50),
      getAlertHistory(deviceId, 20),
    ]);

    return NextResponse.json({ device_id: deviceId, history, alertHistory });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
