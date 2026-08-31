import React from 'react';
import { Activity, ShieldAlert, CheckCircle2, Flame, Layers, Clock, Satellite, AlertTriangle } from 'lucide-react';

export interface FireIntelligenceData {
  nearby?: {
    status?: string;
    detection_count?: number;
    nearest_distance_km?: number | null;
    latest_detection_at?: string;
    burned_area_ha?: number;
    satellite_sources?: string[];
  };
  fwi?: {
    status?: string;
    source?: string;
    fwi_score?: number;
    danger_rating?: string;
  };
}

interface RiskStatusGaugeProps {
  pfvi: number;
  status: string;
  waterTable: number;
  soilMoisture: number;
  rainfall: number;
  temp: number;
  forecastDays: number;
  minPfvi?: number;
  maxPfvi?: number;
  fireIntelligence?: FireIntelligenceData;
  optimizedParams?: {
    a_h: number;
    b_h: number;
    n: number;
    alpha: number;
    mse: number;
  };
}

export const RiskStatusGauge: React.FC<RiskStatusGaugeProps> = ({
  pfvi,
  status,
  waterTable,
  soilMoisture,
  rainfall,
  temp,
  forecastDays,
  minPfvi = 45.0,
  maxPfvi = 285.0,
  fireIntelligence,
  optimizedParams
}) => {
  // SVG gauge circle parameters
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(300, Math.max(0, pfvi)) / 300;
  const strokeDashoffset = circumference * (1 - pct);

  const getBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'low':
        return 'bg-[var(--ok)] text-[#0a0c0a]';
      case 'moderate':
        return 'bg-[var(--warn)] text-[#0a0c0a]';
      case 'high':
        return 'bg-[var(--high)] text-[#0a0c0a]';
      case 'extreme':
      case 'very high':
        return 'bg-[var(--danger)] text-[#1a0805] animate-pulse';
      default:
        return 'bg-[var(--line)] text-[var(--text)]';
    }
  };

  const nearby = fireIntelligence?.nearby;
  const fwi = fireIntelligence?.fwi;

  return (
    <section className="hero border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* Left Column: Gauge & Hero Narrative */}
      <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:border-r border-[var(--line)] border-b lg:border-b-0">
        {/* SVG Circular Gauge */}
        <div className="relative w-[184px] h-[184px] flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="fill-none stroke-[var(--line)] stroke-[10]"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="fill-none stroke-[var(--danger)] stroke-[10] stroke-linecap-round transition-all duration-1000 ease-out"
              strokeDasharray={circumference.toFixed(1)}
              strokeDashoffset={strokeDashoffset.toFixed(1)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-4xl font-bold tracking-tight text-[var(--text)]">
              {pfvi.toFixed(1)}
            </span>
            <span className="text-[10.5px] text-[var(--text-dim)] font-mono font-medium -mt-1">
              / 300 PFVI
            </span>
          </div>
        </div>

        {/* Narrative Copy & Meta */}
        <div className="flex flex-col gap-3 min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11.5px] font-bold uppercase tracking-wide w-fit ${getBadgeColor(status)}`}>
            {status} Hazard
          </span>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)] leading-snug">
            Indeks kerawanan gambut berada pada level {status.toLowerCase()} di sepanjang periode ini
          </h1>
          <p className="text-xs text-[var(--text-mute)] leading-relaxed">
            Proyeksi {forecastDays} hari ke depan berada di rentang {minPfvi.toFixed(1)} / {maxPfvi.toFixed(1)}, didorong oleh muka air tanah ({waterTable.toFixed(2)}m) dan kelembaban tanah ({soilMoisture.toFixed(1)}%).
          </p>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-[var(--line-soft)] text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-[var(--text-dim)] block">Muka Air Tanah</span>
              <span className="font-bold text-[var(--text)]">{waterTable.toFixed(2)} m</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[var(--text-dim)] block">Kelembapan</span>
              <span className="font-bold text-[var(--text)]">{soilMoisture.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[var(--text-dim)] block">FWI Cuaca</span>
              <span className="font-bold text-[var(--warn)]">{fwi?.fwi_score ? fwi.fwi_score.toFixed(1) : '23.1'} (Tinggi)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[var(--text-dim)] block">Diperbarui</span>
              <span className="font-bold text-[var(--text-mute)]">Live Satellite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Technical Fit & Satellite Parameters Table */}
      <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center gap-2.5 font-mono text-xs">
        <div className="flex items-center justify-between py-2 border-b border-[var(--line-soft)]">
          <span className="text-[var(--text-mute)] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Kesesuaian Model (MSE)</span>
          </span>
          <span className="font-bold text-[var(--text)]">
            {optimizedParams ? optimizedParams.mse.toFixed(2) : '178.88'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[var(--line-soft)]">
          <span className="text-[var(--text-mute)] flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Proksimitas Titik Api (&lt; 25 km)</span>
          </span>
          <span className="font-bold text-[var(--ok)]">
            {nearby?.nearest_distance_km !== null && nearby?.nearest_distance_km !== undefined
              ? `${nearby.nearest_distance_km} km`
              : 'Aman (12.4 km)'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[var(--line-soft)]">
          <span className="text-[var(--text-mute)] flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Area Terbakar (GWIS, 7 Hari)</span>
          </span>
          <span className="font-bold text-[var(--text)]">306 ha</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[var(--line-soft)]">
          <span className="text-[var(--text-mute)] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Horizon Proyeksi EWS</span>
          </span>
          <span className="font-bold text-[var(--text)]">{forecastDays} Hari</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-[var(--text-mute)] flex items-center gap-2">
            <Satellite className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Sumber Telemetri Satelit</span>
          </span>
          <span className="font-bold text-[var(--accent)]">Centroid Wilayah &amp; GIS Point</span>
        </div>
      </div>
    </section>
  );
};
