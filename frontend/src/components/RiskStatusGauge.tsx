import React from 'react';

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
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'extreme':
      case 'very high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const pfviPercentage = Math.min(100, Math.max(0, (pfvi / 300) * 100));

  const nearby = fireIntelligence?.nearby;
  const fwi = fireIntelligence?.fwi;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Telemetry Header Panel */}
      <div className="telemetry-panel rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-5 border-b border-slate-200">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
              Indeks Kerawanan Kebakaran Gambut (PFVI)
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-mono font-extrabold text-slate-900 tracking-tight">
                {pfvi.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">/ 300.0</span>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border ${getBadgeStyle(status)}`}>
                {status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Proyeksi {forecastDays} Hari Ke Depan (Rentang 30 Hari: {minPfvi.toFixed(1)} s.d {maxPfvi.toFixed(1)})
            </p>
          </div>

          {/* Nelder-Mead Parameters Readout */}
          {optimizedParams && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
              <div className="text-[11px] text-slate-700 font-bold uppercase tracking-wider flex items-center justify-between gap-4">
                <span>Nelder-Mead Opt</span>
                <span className="text-slate-500">MSE: {optimizedParams.mse.toFixed(2)}</span>
              </div>
              <div className="text-slate-600 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                <span>a_H = {optimizedParams.a_h.toFixed(2)}</span>
                <span>b_H = {optimizedParams.b_h.toFixed(3)}</span>
                <span>n = {optimizedParams.n.toFixed(1)}</span>
                <span>α = {optimizedParams.alpha.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Severity Progress Bar */}
        <div className="pt-4">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                pfvi >= 225
                  ? 'bg-red-600'
                  : pfvi >= 150
                  ? 'bg-orange-500'
                  : pfvi >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${pfviPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 mt-1.5">
            <span>0 (Basah)</span>
            <span>75 (Low)</span>
            <span>150 (Mod)</span>
            <span>225 (High)</span>
            <span>300 (Extreme)</span>
          </div>
        </div>
      </div>

      {/* Multi-Source Fire Intelligence Cockpit Bar */}
      <div className="telemetry-panel rounded-xl p-4 border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FirePing Proximity */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
              FirePing Satellite Proximity
            </span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {nearby?.nearest_distance_km !== null && nearby?.nearest_distance_km !== undefined
                ? `${nearby.nearest_distance_km} km`
                : 'Aman (>25 km)'}
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {nearby?.detection_count || 0} Deteksi (24j) ({nearby?.satellite_sources?.join(', ') || 'Modis/Viirs'})
            </span>
          </div>
          <div className={`px-2 py-1 text-[10px] font-mono font-bold rounded border ${nearby?.detection_count ? 'bg-red-100 text-red-700 border-red-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
            {nearby?.detection_count ? 'DETEKSI' : 'CLEAR'}
          </div>
        </div>

        {/* GWIS Burned Area */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
              GWIS 7-Day Burned Area
            </span>
            <div className="text-lg font-mono font-bold text-amber-600">
              {nearby?.burned_area_ha ? nearby.burned_area_ha.toLocaleString('id-ID') : '0'} <span className="text-xs text-slate-500 font-normal">Ha</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Estimasi Perimeter Satelit Global
            </span>
          </div>
          <div className="px-2 py-1 text-[10px] font-mono font-bold rounded border bg-amber-100 text-amber-800 border-amber-300">
            GWIS NRT
          </div>
        </div>

        {/* Weather FWI Index */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
              Atmospheric Fire Weather (FWI)
            </span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {fwi?.fwi_score !== undefined ? fwi.fwi_score.toFixed(1) : '24.5'} <span className="text-xs text-slate-500 font-normal">FWI</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {fwi?.source || 'OpenWeather / Canadian Engine'}
            </span>
          </div>
          <div className={`px-2 py-1 text-[10px] font-mono font-bold rounded border ${getBadgeStyle(fwi?.danger_rating || 'High')}`}>
            {(fwi?.danger_rating || 'HIGH').toUpperCase()}
          </div>
        </div>
      </div>

      {/* High-Density Environmental Telemetry Cockpit Bar */}
      <div className="telemetry-panel bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 shadow-sm">
        {/* WT */}
        <div className="p-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Water Table (WT)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {waterTable.toFixed(2)} <span className="text-xs font-normal text-slate-500">m</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {waterTable < -0.8 ? 'Kritis Rendah' : 'Normal'}
          </span>
        </div>

        {/* SM */}
        <div className="p-4 lg:pl-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Soil Moisture (SM)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {soilMoisture.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {soilMoisture < 45 ? 'Tanah Kering' : 'Lembab'}
          </span>
        </div>

        {/* Rf */}
        <div className="p-4 lg:pl-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Rainfall (Rf)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {rainfall.toFixed(1)} <span className="text-xs font-normal text-slate-500">mm/d</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {rainfall < 5.1 ? 'Tanpa Hujan Efektif' : 'Hujan Efektif'}
          </span>
        </div>

        {/* Temp */}
        <div className="p-4 lg:pl-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Temp Max (Temp)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {temp.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {temp > 34.5 ? 'Suhu Tinggi' : 'Normal'}
          </span>
        </div>
      </div>
    </div>
  );
};
