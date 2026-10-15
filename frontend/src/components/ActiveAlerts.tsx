import React from 'react';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface SevereAlert {
  id: string;
  title: string;
  location: string;
  lat: number;
  lon: number;
  severity: string;
  detection_count: number;
  frp_max_mw: number;
  estimated_burned_ha: number | null;
  burned_area_note?: string | null;
  updated_ago: string;
  satellite_sensor: string;
  peatland_attribution?: string;
}

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: 'Kebakaran parah',
  HIGH: 'Anomali termal tinggi',
  WARNING: 'Waspada gambut'
};

const severityClass = (severity: string) =>
  severity === 'CRITICAL' ? 'text-[var(--danger)] border-[var(--danger)]'
    : severity === 'HIGH' ? 'text-[var(--high)] border-[var(--high)]'
      : 'text-[var(--warn)] border-[var(--warn)]';

interface ActiveAlertsProps {
  alerts: SevereAlert[];
  onFocus: (alert: SevereAlert) => void;
}

/**
 * Single source of truth for active fire warnings. The map tab shows the markers,
 * this list is the only place the warning text appears — no second copy in the
 * chart or inspector panels.
 */
export const ActiveAlerts: React.FC<ActiveAlertsProps> = ({ alerts, onFocus }) => {
  const latest = alerts[0]?.updated_ago?.replace('Deteksi terbaru ', 'deteksi terbaru ');

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3">
        <h2 className="font-disp text-[17px] font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--danger)]" />
          <span>Peringatan kebakaran aktif</span>
        </h2>
        <p className="text-[13px] text-[var(--text-dim)]">
          Titik panas di lahan gambut, 24 jam terakhir{latest ? ` (${latest})` : ''}
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
          <p className="text-[13px] text-[var(--text-mute)]">
            Kabar baik: tidak ada titik api di lahan gambut dalam 24 jam terakhir.
          </p>
        </div>
      ) : (
        <ul className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] divide-y divide-[var(--line-soft)] overflow-hidden">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <button
                type="button"
                onClick={() => onFocus(alert)}
                className="w-full text-left px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 transition-colors hover:bg-[var(--surface-2)] cursor-pointer"
              >
                <span className={`shrink-0 self-start sm:self-center font-mono text-[11px] font-bold uppercase tracking-wider border rounded-[var(--r-sm)] px-2 py-0.5 ${severityClass(alert.severity)}`}>
                  {SEVERITY_LABEL[alert.severity] || alert.severity}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-medium text-[var(--text)] leading-snug">
                    {alert.location}
                  </span>
                  <span className="block font-mono text-[11.5px] text-[var(--text-dim)] mt-0.5">
                    {alert.detection_count} deteksi satelit · FRP maks {alert.frp_max_mw} MW
                    {alert.estimated_burned_ha ? ` · ±${alert.estimated_burned_ha} ha terbakar` : ' · luas terbakar belum diketahui'}
                  </span>
                </span>

                <span className="shrink-0 self-end sm:self-center font-mono text-[12px] font-semibold text-[var(--accent)] flex items-center gap-1">
                  <span>Lihat di peta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
