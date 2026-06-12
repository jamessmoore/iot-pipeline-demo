'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { THRESHOLDS } from '../lib/wells';

const AXIS_STYLE = { fontSize: 11, fill: '#7d8590' };
const GRID_STROKE = '#30363d';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-2 font-display text-sm font-semibold text-text-primary">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function WellCharts({ history }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Tank Level (%)">
        <AreaChart data={history}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={AXIS_STYLE} />
          <YAxis domain={[0, 100]} tick={AXIS_STYLE} />
          <Tooltip
            labelFormatter={formatTime}
            contentStyle={{ background: '#161b22', border: '1px solid #30363d' }}
          />
          <ReferenceLine
            y={THRESHOLDS.tank_level_pct.low}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Alert Low', position: 'insideBottomLeft', fill: '#ef4444', fontSize: 10 }}
          />
          <ReferenceLine
            y={THRESHOLDS.tank_level_pct.high}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Alert High', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }}
          />
          <Area type="monotone" dataKey="tank_level_pct" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Temperature (°F)">
        <LineChart data={history}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip
            labelFormatter={formatTime}
            contentStyle={{ background: '#161b22', border: '1px solid #30363d' }}
          />
          <ReferenceLine
            y={THRESHOLDS.temperature_f.low}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Alert Low', position: 'insideBottomLeft', fill: '#ef4444', fontSize: 10 }}
          />
          <ReferenceLine
            y={THRESHOLDS.temperature_f.high}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Alert High', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }}
          />
          <Line type="monotone" dataKey="temperature_f" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Pressure (PSI)">
        <LineChart data={history}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip
            labelFormatter={formatTime}
            contentStyle={{ background: '#161b22', border: '1px solid #30363d' }}
          />
          <ReferenceLine
            y={THRESHOLDS.pressure_psi.low}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Alert Low', position: 'insideBottomLeft', fill: '#ef4444', fontSize: 10 }}
          />
          <ReferenceLine
            y={THRESHOLDS.pressure_psi.high}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Alert High', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }}
          />
          <Line type="monotone" dataKey="pressure_psi" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Flow Rate (BPD)">
        <BarChart data={history}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={AXIS_STYLE} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip
            labelFormatter={formatTime}
            contentStyle={{ background: '#161b22', border: '1px solid #30363d' }}
          />
          <Bar dataKey="flow_rate_bpd" fill="#f59e0b" />
        </BarChart>
      </ChartCard>
    </div>
  );
}
