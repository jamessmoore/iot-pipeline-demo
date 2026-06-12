'use client';

import { useState } from 'react';
import Map from 'react-map-gl/maplibre';
import WellMarker from './WellMarker';

const STADIA_API_KEY = process.env.NEXT_PUBLIC_STADIA_API_KEY;

const MAP_STYLE = STADIA_API_KEY && STADIA_API_KEY !== 'your_key_here'
  ? `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_API_KEY}`
  : 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json';

const INITIAL_VIEW_STATE = {
  longitude: -102.5,
  latitude: 31.85,
  zoom: 7.2,
};

export default function TXMap({ wells, onSelectWell }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  return (
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
    >
      {wells.map((well) => (
        <WellMarker key={well.device_id} well={well} onSelect={onSelectWell} />
      ))}
    </Map>
  );
}
