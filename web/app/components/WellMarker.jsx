'use client';

import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';

export default function WellMarker({ well, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const lat = well.location?.lat;
  const lon = well.location?.lon;

  if (lat === undefined || lon === undefined) return null;

  const isAlert = well.status === 'alert';

  return (
    <>
      <Marker longitude={lon} latitude={lat} anchor="center">
        <div
          className={`well-marker ${isAlert ? 'alert' : ''}`}
          onClick={() => onSelect(well)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
      </Marker>
      {hovered && (
        <Popup
          longitude={lon}
          latitude={lat}
          anchor="bottom"
          offset={12}
          closeButton={false}
          closeOnClick={false}
        >
          <div className="text-xs">
            <div className="font-display font-semibold text-text-primary">{well.location_name}</div>
            <div>
              <span className="text-text-muted">Tank: </span>
              <span className="text-amber font-semibold">{well.tank_level_pct}%</span>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}
