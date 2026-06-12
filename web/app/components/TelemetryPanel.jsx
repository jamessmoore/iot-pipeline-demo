'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { THRESHOLDS } from '../lib/wells';

function tankColor(pct) {
  if (pct <= THRESHOLDS.tank_level_pct.low || pct >= THRESHOLDS.tank_level_pct.high) {
    return 'text-alert';
  }
  return 'text-amber';
}

function MetricCard({ label, value, unit, valueClassName }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${valueClassName || 'text-text-primary'}`}>
        {value}
        <span className="ml-1 text-sm text-text-muted">{unit}</span>
      </div>
    </div>
  );
}

export default function TelemetryPanel({ well, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!well) return;
    let cancelled = false;

    fetch(`/api/search?device_id=${well.device_id}&size=20`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });

    return () => {
      cancelled = true;
    };
  }, [well]);

  return (
    <div
      className={`absolute right-0 top-0 z-20 h-full w-full max-w-sm transform border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
        well ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {well && (
        <div className="flex h-full flex-col overflow-y-auto p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">
                {well.location_name}
              </h2>
              <div className="text-xs text-text-muted">{well.operator}</div>
              <div className="text-xs text-text-muted">{well.field_name}</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-border px-2 py-1 text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="mt-3">
            {well.status === 'alert' ? (
              <span className="rounded-full bg-alert px-2 py-0.5 text-xs font-semibold text-white">
                ALERT: {well.alert}
              </span>
            ) : (
              <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-semibold text-amber">
                normal
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard
              label="Tank Level"
              value={well.tank_level_pct}
              unit="%"
              valueClassName={tankColor(well.tank_level_pct)}
            />
            <MetricCard label="Temperature" value={well.temperature_f} unit="°F" />
            <MetricCard label="Pressure" value={well.pressure_psi} unit="psi" />
            <MetricCard label="Flow Rate" value={well.flow_rate_bpd} unit="bpd" />
          </div>

          <div className="mt-4">
            <div className="mb-1 text-xs text-text-muted">Tank Level — last {history.length} readings</div>
            <div className="h-24 rounded-lg border border-border bg-background p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <Line
                    type="monotone"
                    dataKey="tank_level_pct"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4">
            <Link
              href={`/well/${well.device_id}`}
              className="text-sm font-semibold text-amber hover:underline"
            >
              View Full History →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
