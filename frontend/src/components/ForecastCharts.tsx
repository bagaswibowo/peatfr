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
import { Activity } from 'lucide-react';

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
    <div className="space-y-6 mb-6">
      {/* Primary PFVI Time-Series & Forecast Chart */}
      <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-wide">
                Grafik Historis & Forecast Peat Fire Vulnerability Index (PFVI)
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Garis hijau solid = Data Observasi/Historis | Garis merah putus-putus = Proyeksi {forecastHorizon} Hari Ke Depan
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-3 h-1 bg-emerald-600 inline-block rounded" /> PFVI Observasi
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-3 h-1 bg-red-600 border-t border-dashed border-red-600 inline-block rounded" /> Forecast
            </span>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 300]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />

              {/* Shaded Threshold Zones */}
              <ReferenceArea y1={225} y2={300} fill="#dc2626" fillOpacity={0.08} />
              <ReferenceArea y1={150} y2={225} fill="#ea580c" fillOpacity={0.08} />
              <ReferenceArea y1={75} y2={150} fill="#d97706" fillOpacity={0.05} />

              <ReferenceLine y={225} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Extreme (225)', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={150} stroke="#ea580c" strokeDasharray="3 3" label={{ value: 'High (150)', fill: '#ea580c', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={75} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Moderate (75)', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }} />

              <Line type="monotone" dataKey="PFVI_hist" stroke="#16a34a" strokeWidth={2.5} dot={false} name="PFVI Historis" />
              <Line type="monotone" dataKey="PFVI_pred" stroke="#dc2626" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#dc2626' }} name="PFVI Forecast" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Parameter Synchronized Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Table Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Kedalaman Muka Air Tanah (WT - meter)</span>
            <span className="text-cyan-700 font-mono">WT</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="WT" stroke="#0891b2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Moisture Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Kelembaban Tanah (SM - %)</span>
            <span className="text-blue-700 font-mono">SM</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[30, 80]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="SM" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Curah Hujan (Rf - mm/hari)</span>
            <span className="text-indigo-700 font-mono">Rf</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="Rf" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Air Temp Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Suhu Udara Maksimum (Temp - °C)</span>
            <span className="text-rose-700 font-mono">Temp</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[28, 40]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="Temp" stroke="#e11d48" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
