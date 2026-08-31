import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { Activity, Layers, Droplets, CloudRain, Thermometer } from 'lucide-react';

interface ForecastChartsProps {
  fullSeries: {
    WT: number[];
    SM: number[];
    Rf: number[];
    Temp: number[];
    PFVI: number[];
    DI_obs: number[];
  };
  forecastHorizon: number;
}

export const ForecastCharts: React.FC<ForecastChartsProps> = ({ fullSeries, forecastHorizon }) => {
  const totalPoints = fullSeries.PFVI.length;
  const historicalCount = totalPoints - forecastHorizon;

  // Prepare chart dataset
  const chartData = fullSeries.PFVI.map((pfviVal, idx) => {
    const isForecast = idx >= historicalCount;
    const dayLabel = isForecast ? `H+${idx - historicalCount + 1}` : `H-${historicalCount - idx}`;
    
    return {
      day: dayLabel,
      step: idx + 1,
      isForecast,
      PFVI_hist: !isForecast || idx === historicalCount - 1 ? pfviVal : null,
      PFVI_pred: isForecast ? pfviVal : null,
      DI_obs: fullSeries.DI_obs ? fullSeries.DI_obs[idx] : null,
      WT: fullSeries.WT[idx],
      SM: fullSeries.SM[idx],
      Rf: fullSeries.Rf[idx],
      Temp: fullSeries.Temp[idx],
    };
  });

  return (
    <div className="space-y-5 mb-5 font-mono">
      {/* Primary PFVI Time-Series & Forecast Chart */}
      <div className="telemetry-panel bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                GRAFIK HISTORIS & FORECAST PEAT FIRE VULNERABILITY INDEX (PFVI)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Garis Hijau Solid = Data Observasi/Historis | Garis Merah Putus-putus = Proyeksi H+{forecastHorizon} Hari Ke Depan
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-1 bg-emerald-500 inline-block rounded-xs" /> PFVI Observasi
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-1 bg-rose-500 border-t border-dashed border-rose-500 inline-block rounded-xs" /> Forecast
            </span>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 300]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
              />

              {/* Shaded Threshold Zones */}
              <ReferenceArea y1={225} y2={300} fill="#ef4444" fillOpacity={0.12} />
              <ReferenceArea y1={150} y2={225} fill="#f97316" fillOpacity={0.10} />
              <ReferenceArea y1={75} y2={150} fill="#f59e0b" fillOpacity={0.06} />

              <ReferenceLine y={225} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Extreme (225)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={150} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'High (150)', fill: '#f97316', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate (75)', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />

              <Line type="monotone" dataKey="PFVI_hist" stroke="#10b981" strokeWidth={2.5} dot={false} name="PFVI Historis" />
              <Line type="monotone" dataKey="PFVI_pred" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#ef4444' }} name="PFVI Forecast" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Parameter Synchronized Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Water Table Chart */}
        <div className="telemetry-panel bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-md">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Droplets className="w-3.5 h-3.5" />
              <span>KEDALAMAN MUKA AIR TANAH (WT - METER)</span>
            </span>
            <span className="text-cyan-400 font-mono">WT</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="WT" stroke="#0284c7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Moisture Chart */}
        <div className="telemetry-panel bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-md">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Layers className="w-3.5 h-3.5" />
              <span>KELEMBABAN TANAH (SM - %)</span>
            </span>
            <span className="text-blue-400 font-mono">SM</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[30, 80]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="SM" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall Chart */}
        <div className="telemetry-panel bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-md">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CloudRain className="w-3.5 h-3.5" />
              <span>CURAH HUJAN (RF - MM/HARI)</span>
            </span>
            <span className="text-emerald-400 font-mono">Rf</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="Rf" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="telemetry-panel bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-md">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Thermometer className="w-3.5 h-3.5" />
              <span>SUHU UDARA MAKS (TEMP - °C)</span>
            </span>
            <span className="text-rose-400 font-mono">Temp</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="Temp" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
