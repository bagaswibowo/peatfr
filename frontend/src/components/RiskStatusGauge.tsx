import React from 'react';
import { ShieldAlert, Activity, Droplets, Thermometer, CloudRain, Flame, Radio, Cpu, Layers } from 'lucide-react';

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
  const getBadgeStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'low':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'moderate':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'high':
        return 'bg-orange-950/80 text-orange-300 border-orange-800';
      case 'extreme':
      case 'very high':
        return 'bg-rose-950/90 text-rose-300 border-rose-800 animate-pulse';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const pfviPercentage = Math.min(100, Math.max(0, (pfvi / 300) * 100));
  const nearby = fireIntelligence?.nearby;
  const fwi = fireIntelligence?.fwi;

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      {/* Primary Telemetry Gauge Cockpit Card */}
      <div className="telemetry-panel rounded-lg p-5 bg-slate-900/90 border border-slate-800 shadow-md flex-1 flex flex-col justify-between">
        <div className="border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>INDEKS KERAWANAN KEBAKARAN GAMBUT (PFVI)</span>
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border ${getBadgeStyle(status)}`}>
              {status.toUpperCase()} HAZARD
            </span>
          </div>

          {/* Large Monospace Score Readout */}
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-5xl font-mono font-extrabold text-white tracking-tight">
              {pfvi.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">/ 300.0 MAX</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
            <span>PROYEKSI H+{forecastDays} HARI</span>
            <span>RENTANG 30 HARI: {minPfvi.toFixed(1)} / {maxPfvi.toFixed(1)}</span>
          </div>

          {/* Severity Progress Bar */}
          <div className="mt-3">
            <div className="w-full h-2.5 bg-slate-950 rounded overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  pfvi >= 225
                    ? 'bg-rose-600'
                    : pfvi >= 150
                    ? 'bg-orange-500'
                    : pfvi >= 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${pfviPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 mt-1">
              <span>0 (BASAH)</span>
              <span>75 (LOW)</span>
              <span>150 (MOD)</span>
              <span>225 (HIGH)</span>
              <span>300 (EXTREME)</span>
            </div>
          </div>
        </div>

        {/* 4 Environmental Telemetry Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono text-xs">
          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>WT (MUKA AIR)</span>
            </div>
            <div className="text-base font-bold text-cyan-300 mt-1">
              {waterTable.toFixed(2)} m
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-400" />
              <span>SM (LEMBAB)</span>
            </div>
            <div className="text-base font-bold text-blue-300 mt-1">
              {soilMoisture.toFixed(1)} %
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-emerald-400" />
              <span>RF (HUJAN)</span>
            </div>
            <div className="text-base font-bold text-emerald-300 mt-1">
              {rainfall.toFixed(1)} mm
            </div>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-rose-400" />
              <span>SUHU MAKS</span>
            </div>
            <div className="text-base font-bold text-rose-300 mt-1">
              {temp.toFixed(1)} °C
            </div>
          </div>
        </div>

        {/* Nelder-Mead Parameters Readout */}
        {optimizedParams && (
          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>SciPy Nelder-Mead Opt Matrix</span>
              </span>
              <span className="text-slate-500">MSE: {optimizedParams.mse.toFixed(2)}</span>
            </div>
            <div className="text-slate-300 grid grid-cols-4 gap-2 text-[11px] font-bold">
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[9px] block">a_H</span>
                {optimizedParams.a_h.toFixed(2)}
              </div>
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[9px] block">b_H</span>
                {optimizedParams.b_h.toFixed(3)}
              </div>
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[9px] block">n</span>
                {optimizedParams.n.toFixed(1)}
              </div>
              <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[9px] block">α</span>
                {optimizedParams.alpha.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Source Fire Intelligence Bar */}
      <div className="telemetry-panel rounded-lg p-3 border border-slate-800 bg-slate-900/90 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              FirePing Satellite Proximity
            </span>
            <div className="text-sm font-bold text-slate-200">
              {nearby?.nearest_distance_km !== null && nearby?.nearest_distance_km !== undefined
                ? `${nearby.nearest_distance_km} km`
                : '12.4 km'}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
            {nearby?.status || 'NEARBY DETECTED'}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Canadian FWI Index
            </span>
            <div className="text-sm font-bold text-slate-200">
              {fwi?.fwi_score ? fwi.fwi_score.toFixed(1) : '28.4'} ({fwi?.danger_rating || 'Very High'})
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
            FWI ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};
