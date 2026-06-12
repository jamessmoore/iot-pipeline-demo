'use client';

export default function StatusBar({ wells, lastUpdate }) {
  const total = wells.length;
  const alertCount = wells.filter((w) => w.status === 'alert').length;

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-4 rounded-lg border border-border bg-surface/90 px-4 py-2 shadow-lg backdrop-blur">
      <span className="font-display text-sm font-semibold text-text-primary">
        IOT-pipeline-demo
      </span>
      <span className="text-xs text-text-muted">
        {total} wells online
      </span>
      {alertCount > 0 ? (
        <span className="rounded-full bg-alert px-2 py-0.5 text-xs font-semibold text-white">
          {alertCount} alert{alertCount > 1 ? 's' : ''}
        </span>
      ) : (
        <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-semibold text-amber">
          all clear
        </span>
      )}
      <span className="text-xs text-text-muted">
        {lastUpdate ? `updated ${lastUpdate.toLocaleTimeString()}` : 'connecting…'}
      </span>
    </div>
  );
}
