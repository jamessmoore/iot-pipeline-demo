'use client';

import { useEffect, useState } from 'react';
import TXMap from './components/TXMap';
import TelemetryPanel from './components/TelemetryPanel';
import StatusBar from './components/StatusBar';
import { WELLS } from './lib/wells';

export default function Home() {
  const [readings, setReadings] = useState({});
  const [selectedWellId, setSelectedWellId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const source = new EventSource('/api/stream');

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const byId = {};
      data.forEach((reading) => {
        byId[reading.device_id] = reading;
      });
      setReadings((prev) => ({ ...prev, ...byId }));
      setLastUpdate(new Date());
    };

    return () => source.close();
  }, []);

  const wells = WELLS.map((well) => {
    const latest = readings[well.device_id];
    return {
      ...well,
      ...latest,
      location: latest?.location || { lat: well.lat, lon: well.lon },
      status: latest?.status || 'normal',
    };
  });

  const selectedWell = wells.find((w) => w.device_id === selectedWellId) || null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <StatusBar wells={wells} lastUpdate={lastUpdate} />
      <TXMap wells={wells} onSelectWell={(well) => setSelectedWellId(well.device_id)} />
      <TelemetryPanel well={selectedWell} onClose={() => setSelectedWellId(null)} />
    </main>
  );
}
