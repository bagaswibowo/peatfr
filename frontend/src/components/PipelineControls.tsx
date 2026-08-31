import React from 'react';
import { Settings, Play, Database, Cpu, Calendar, MapPin, RefreshCw, Satellite } from 'lucide-react';
import { Province, Regency } from './Header';

interface PipelineControlsProps {
  provinces: Province[];
  selectedProvince: Province | null;
  selectedRegency: Regency | null;
  onSelectRegion: (prov: Province, reg: Regency) => void;
  onLoadRealtimeData: () => void;
  loadingRealtime: boolean;
  imputation: string;
  setImputation: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  h: number;
  setH: (val: number) => void;
  epochs: number;
  setEpochs: (val: number) => void;
  onRunPipeline: () => void;
  isRunning: boolean;
}

export const PipelineControls: React.FC<PipelineControlsProps> = ({
  provinces,
  selectedProvince,
  selectedRegency,
  onSelectRegion,
  onLoadRealtimeData,
  loadingRealtime,
  imputation,
  setImputation,
  model,
  setModel,
  h,
  setH,
  epochs,
  setEpochs,
  onRunPipeline,
  isRunning
}) => {
  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              KONFIGURASI ALGORITMA & MODEL PIPELINE
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Data telemetri ditarik dari API Satelit Open-Meteo ERA5 & NASA FIRMS berdasarkan lokasi target terpilih
            </p>
          </div>
        </div>

        {/* Location & Satellite Source Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Target Lokasi: <strong>{selectedRegency ? selectedRegency.name : 'Kab. Siak'}</strong> ({selectedRegency ? `${selectedRegency.lat.toFixed(3)}°, ${selectedRegency.lon.toFixed(3)}°` : '0.820°, 102.050°'})</span>
          </span>
          <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold flex items-center gap-1">
            <Satellite className="w-3 h-3 text-blue-600" />
            <span>Open-Meteo ERA5 & FIRMS API</span>
          </span>
        </div>
      </div>

      {/* Grid Controls (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* 1. Target Location Selector (Single Unified Place) */}
        <div className="sm:col-span-2 lg:col-span-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lokasi Target Prediksi:</span>
            </span>
          </label>
          <div className="space-y-1.5">
            <select
              value={selectedProvince?.id || ''}
              onChange={(e) => {
                const foundProv = provinces.find((p) => p.id === e.target.value);
                if (foundProv && foundProv.regencies.length > 0) {
                  onSelectRegion(foundProv, foundProv.regencies[0]);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
            >
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>

            <select
              value={selectedRegency?.id || ''}
              onChange={(e) => {
                if (selectedProvince) {
                  const foundReg = selectedProvince.regencies.find((r) => r.id === e.target.value);
                  if (foundReg) onSelectRegion(selectedProvince, foundReg);
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
            >
              {selectedProvince?.regencies.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} {reg.peat ? '(Gambut)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Satellite Telemetry Fetch Button */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-blue-600" />
            <span>Telemetri Satelit:</span>
          </label>
          <button
            onClick={onLoadRealtimeData}
            disabled={loadingRealtime}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loadingRealtime ? 'animate-spin' : ''}`} />
            <span>{loadingRealtime ? 'Tarik Data...' : 'Tarik Satelit Realtime'}</span>
          </button>
        </div>

        {/* 3. Imputation Method Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-600" />
            <span>Imputasi Data Missing:</span>
          </label>
          <select
            value={imputation}
            onChange={(e) => setImputation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            <option value="knn">kNN (Gower Distance)</option>
            <option value="spline">Cubic Spline Interpolation</option>
            <option value="loess">LOESS Smoothing</option>
            <option value="linear">Linear Interpolation</option>
          </select>
        </div>

        {/* 4. Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Model Time Series AI:</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            <option value="arima">ARIMA + Box-Cox (Stokastik)</option>
            <option value="lstm">LSTM Neural Network (PyTorch)</option>
            <option value="gru">GRU Neural Network (PyTorch)</option>
          </select>
        </div>

        {/* 5. Forecast Horizon & Pipeline Execution */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Horizon Proyeksi (h Hari):</span>
          </label>
          <div className="space-y-1.5">
            <select
              value={h}
              onChange={(e) => setH(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
            >
              <option value={4}>4 Hari (Default Jurnal)</option>
              <option value={7}>7 Hari (1 Minggu)</option>
              <option value={14}>14 Hari (2 Minggu)</option>
            </select>

            <button
              onClick={onRunPipeline}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunning ? 'Memproses...' : 'Jalankan Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
