import Link from 'next/link';
import { getHistory, getAlertHistory } from '../../lib/opensearch';
import { WELLS, THRESHOLDS } from '../../lib/wells';
import WellCharts from '../../components/WellCharts';

function tankColor(pct) {
  if (pct <= THRESHOLDS.tank_level_pct.low || pct >= THRESHOLDS.tank_level_pct.high) {
    return 'text-alert';
  }
  return 'text-amber';
}

function MetricCard({ label, value, unit, valueClassName }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`mt-1 font-mono text-3xl font-semibold ${valueClassName || 'text-text-primary'}`}>
        {value ?? '—'}
        <span className="ml-1 text-base text-text-muted">{unit}</span>
      </div>
    </div>
  );
}

export default async function WellDetailPage({ params }) {
  const well = WELLS.find((w) => w.device_id === params.id);
  const [history, alertHistory] = await Promise.all([
    getHistory(params.id, 50),
    getAlertHistory(params.id, 20),
  ]);

  const latest = history[history.length - 1];

  return (
    <main className="min-h-screen bg-background p-6 text-text-primary">
      <nav className="mb-4 text-sm text-text-muted">
        <Link href="/" className="hover:underline">
          ← Map Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span>{well?.location_name || params.id}</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">{well?.location_name || params.id}</h1>
        <div className="mt-1 text-sm text-text-muted">
          {well?.operator} · {well?.field_name} · {params.id}
        </div>
        {latest && (
          <div className="mt-2">
            {latest.status === 'alert' ? (
              <span className="rounded-full bg-alert px-2 py-0.5 text-xs font-semibold text-white">
                ALERT: {latest.alert}
              </span>
            ) : (
              <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-semibold text-amber">
                normal
              </span>
            )}
          </div>
        )}
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Tank Level"
          value={latest?.tank_level_pct}
          unit="%"
          valueClassName={latest ? tankColor(latest.tank_level_pct) : undefined}
        />
        <MetricCard label="Temperature" value={latest?.temperature_f} unit="°F" />
        <MetricCard label="Pressure" value={latest?.pressure_psi} unit="psi" />
        <MetricCard label="Flow Rate" value={latest?.flow_rate_bpd} unit="bpd" />
      </section>

      <section className="mb-6">
        <WellCharts history={history} />
      </section>

      <section>
        <h2 className="mb-2 font-display text-lg font-semibold">Alert History</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Alert Type</th>
                <th className="p-3">Tank %</th>
                <th className="p-3">Temp</th>
                <th className="p-3">Pressure</th>
              </tr>
            </thead>
            <tbody>
              {alertHistory.length === 0 ? (
                <tr>
                  <td className="p-3 text-text-muted" colSpan={5}>
                    No alerts recorded.
                  </td>
                </tr>
              ) : (
                alertHistory.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-alert">{row.alert}</td>
                    <td className="p-3 font-mono">{row.tank_level_pct}%</td>
                    <td className="p-3 font-mono">{row.temperature_f}°F</td>
                    <td className="p-3 font-mono">{row.pressure_psi} psi</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
