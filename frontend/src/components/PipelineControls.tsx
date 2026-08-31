import React, { useState } from 'react';
import { Settings, Play, Database, Cpu, Calendar, MapPin, RefreshCw, Satellite, CheckCircle2, Info, Navigation, Flame, Target, Building2, Sliders, Layers } from 'lucide-react';
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
  const [showDiffExplanation, setShowDiffExplanation] = useState(false);

  // Build flattened options list for dropdown
  const allRegencies: { prov: Province; reg: Regency }[] = [];
  provinces.forEach((prov) => {
    prov.regencies.forEach((reg) => {
      allRegencies.push({ prov, reg });
    });
  });

  const isCustomLocation = selectedRegency ? selectedRegency.id.startsWith('CUSTOM-') : false;

  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>KONFIGURASI ALGORITMA & MODEL PIPELINE</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Parameter telemetri lokasi target, algoritma imputasi satelit, model AI time series, dan horizon EWS
            </p>
          </div>
        </div>

        {/* Location & Satellite Source Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`px-3 py-1.5 rounded-lg font-mono font-semibold flex items-center gap-1.5 border ${
            isCustomLocation
              ? 'bg-sky-50 text-sky-900 border-sky-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              isCustomLocation ? 'bg-sky-500' : 'bg-emerald-500'
            }`}></span>
            <span>
              TARGET AKTIF: <strong>{selectedRegency ? selectedRegency.name : 'Kab. Siak'}</strong> ({selectedRegency ? `${selectedRegency.lat.toFixed(3)}°, ${selectedRegency.lon.toFixed(3)}°` : '0.820°, 102.050°'})
            </span>
          </span>
          
          <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold flex items-center gap-1.5">
            {isCustomLocation ? (
              <>
                <Target className="w-3.5 h-3.5 text-sky-600" />
                <span>MODE: PINPOINT PETA GIS</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>MODE: PRESET WILAYAH ADMIN</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Synchronized Mode Banner & Distinction Explainer */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span className="text-slate-500 font-mono text-[11px]">SUMBER TELEMETRI AKTIF:</span>
            {isCustomLocation ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[11px] font-bold">
                <Target className="w-3.5 h-3.5 text-sky-600" />
                <span>KOORDINAT SPESIFIK PETA / HOTSPOT ({selectedRegency?.lat.toFixed(3)}°, {selectedRegency?.lon.toFixed(3)}°)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[11px] font-bold">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>CENTROID WILAYAH {selectedRegency?.name?.toUpperCase()}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDiffExplanation(!showDiffExplanation)}
            className="text-[11px] font-mono font-medium text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showDiffExplanation ? 'Sembunyikan Penjelasan Mode' : 'Panduan Perbedaan Mode Lokasi'}</span>
          </button>
        </div>

        {showDiffExplanation && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-600 space-y-2 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1 font-mono">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Dropdown Wilayah (Preset Admin)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Memilih wilayah administrasi resmi (38 Provinsi / 514 Kabupaten). Pipeline menghitung prediksi hydrologi pada pusat koordinat (centroid) kabupaten tersebut untuk analisis makro/kebijakan.
                </p>
              </div>

              <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs mb-1 font-mono">
                  <Target className="w-4 h-4 text-sky-600" />
                  <span>2. Klik Peta GIS / Hotspot Satelit (Mikro Point)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Mengklik langsung area peta atau memilih titik Hotspot Kebakaran NASA FIRMS. Pipeline mengambil data satelit Open-Meteo ERA5 pada titik Lat/Lon spesifik tersebut untuk inspeksi mikro lapangan.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-mono italic">
              * Keduanya terhubung langsung ke pipeline AI. Setiap kali Anda memilih dropdown atau mengklik peta, data satelit & grafik proyeksi langsung diperbarui secara otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Grid Controls (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* 1. Target Location Selector */}
        <div>
          <label className="block text-xs font-mono font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lokasi Target Prediksi:</span>
            </span>
          </label>
          <select
            value={isCustomLocation ? 'CUSTOM' : (selectedRegency?.id || '')}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId === 'CUSTOM') return;
              const found = allRegencies.find((item) => item.reg.id === selectedId);
              if (found) {
                onSelectRegion(found.prov, found.reg);
              }
            }}
            className={`w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none cursor-pointer font-medium ${
              isCustomLocation
                ? 'bg-sky-50 border-sky-400 text-sky-900 font-semibold'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-600'
            }`}
          >
            {isCustomLocation && (
              <option value="CUSTOM">
                [Titik Peta GIS] {selectedRegency?.name}
              </option>
            )}
            <optgroup label="Wilayah Kabupaten (Preset Admin)">
              {allRegencies.map(({ prov, reg }) => (
                <option key={reg.id} value={reg.id}>
                  {prov.name} / {reg.name} {reg.peat ? '(Gambut)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 2. Satellite Telemetry Fetch Button */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-blue-600" />
            <span>Tarik Telemetri Satelit:</span>
          </label>
          <button
            type="button"
            onClick={onLoadRealtimeData}
            disabled={loadingRealtime}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loadingRealtime ? 'animate-spin' : ''}`} />
            <span>{loadingRealtime ? 'Tarik Data Satelit...' : 'Tarik Satelit Realtime'}</span>
          </button>
        </div>

        {/* 3. Imputation Method Selection */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
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
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
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
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
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
              type="button"
              onClick={onRunPipeline}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunning ? 'Memproses...' : 'Jalankan Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explanatory Data Source Callout Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        <span>
          <strong>ALUR SYNCHRONIZED GIS:</strong> Memilih lokasi dari dropdown Wilayah atau mengklik titik Peta GIS mengumpankan koordinat (<code className="font-mono text-emerald-700">Lat</code>, <code className="font-mono text-emerald-700">Lon</code>) ke API Satelit Open-Meteo ERA5 & NASA FIRMS untuk diperbarui di Risk Gauge & Grafik Proyeksi.
        </span>
      </div>
    </div>
  );
};
