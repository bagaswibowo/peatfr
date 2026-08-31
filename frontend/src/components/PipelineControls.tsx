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
    <section className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-5">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-[var(--line-soft)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-[var(--r-sm)] bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent)]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
              <span>Konfigurasi Algoritma &amp; Model Pipeline</span>
            </h3>
            <p className="text-[11px] font-mono text-[var(--text-dim)] mt-0.5">
              Parameter telemetri lokasi target, algoritma imputasi, model AI time series, dan horizon EWS
            </p>
          </div>
        </div>

        {/* Location & Satellite Source Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 border ${
            isCustomLocation
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]'
              : 'bg-[#3fc98a14] text-[var(--ok)] border-[#3fc98a4d]'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              isCustomLocation ? 'bg-[var(--accent)]' : 'bg-[var(--ok)]'
            }`}></span>
            <span>
              Target: <strong>{selectedRegency ? selectedRegency.name : 'Kab. Siak'}</strong> ({selectedRegency ? `${selectedRegency.lat.toFixed(3)}°, ${selectedRegency.lon.toFixed(3)}°` : '0.820°, 102.050°'})
            </span>
          </span>
          
          <span className="bg-[var(--surface-2)] text-[var(--text-mute)] border border-[var(--line)] px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
            {isCustomLocation ? (
              <>
                <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Mode: Pinpoint Peta GIS</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>Mode: Preset Wilayah Admin</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Synchronized Mode Banner & Distinction Explainer */}
      <div className="mb-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] p-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <span className="text-[var(--text-dim)] text-[11px]">SUMBER TELEMETRI:</span>
            {isCustomLocation ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-line)] text-[11px] font-bold">
                <Target className="w-3.5 h-3.5" />
                <span>KOORDINAT SPESIFIK PETA / HOTSPOT ({selectedRegency?.lat.toFixed(3)}°, {selectedRegency?.lon.toFixed(3)}°)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#3fc98a14] text-[var(--ok)] border border-[#3fc98a4d] text-[11px] font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>CENTROID WILAYAH {selectedRegency?.name?.toUpperCase()}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDiffExplanation(!showDiffExplanation)}
            className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showDiffExplanation ? 'Sembunyikan' : 'Panduan Perbedaan Mode'}</span>
          </button>
        </div>

        {showDiffExplanation && (
          <div className="mt-3 pt-2.5 border-t border-[var(--line)] text-xs text-[var(--text-mute)] space-y-2 font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[var(--surface)] border border-[var(--line)] rounded p-2.5">
                <div className="flex items-center gap-1.5 text-[var(--ok)] font-bold text-xs mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>1. Dropdown Wilayah (Preset Admin)</span>
                </div>
                <p className="text-[11px] text-[var(--text-mute)] leading-relaxed font-sans">
                  Memilih wilayah administrasi resmi (38 Provinsi / 514 Kabupaten). Pipeline menghitung prediksi hydrologi pada pusat koordinat (centroid) kabupaten tersebut untuk analisis makro/kebijakan.
                </p>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--line)] rounded p-2.5">
                <div className="flex items-center gap-1.5 text-[var(--accent)] font-bold text-xs mb-1">
                  <Target className="w-4 h-4" />
                  <span>2. Klik Peta GIS / Hotspot Satelit (Mikro Point)</span>
                </div>
                <p className="text-[11px] text-[var(--text-mute)] leading-relaxed font-sans">
                  Mengklik langsung area peta atau memilih titik Hotspot Kebakaran NASA FIRMS. Pipeline mengambil data satelit Open-Meteo ERA5 pada titik Lat/Lon spesifik tersebut untuk inspeksi mikro lapangan.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-dim)] italic">
              * Keduanya terhubung langsung ke pipeline AI. Setiap kali Anda memilih dropdown atau mengklik peta, data satelit &amp; grafik proyeksi langsung diperbarui secara otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Grid Controls (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end font-mono">
        {/* 1. Target Location Selector */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-mute)] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
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
            className={`w-full border rounded-[var(--r-sm)] px-3 py-2 text-xs font-mono focus:outline-none cursor-pointer font-medium ${
              isCustomLocation
                ? 'bg-[var(--surface-2)] border-[var(--accent-line)] text-[var(--accent)] font-semibold'
                : 'bg-[var(--surface-2)] border-[var(--line)] text-[var(--text)] focus:border-[var(--accent)]'
            }`}
          >
            {isCustomLocation && (
              <option value="CUSTOM">
                [Titik Peta GIS] {selectedRegency?.name}
              </option>
            )}
            <optgroup label="Wilayah Kabupaten (Preset Admin)" className="bg-[var(--surface)] text-[var(--text)]">
              {allRegencies.map(({ prov, reg }) => (
                <option key={reg.id} value={reg.id} className="bg-[var(--surface)] text-[var(--text)]">
                  {prov.name} / {reg.name} {reg.peat ? '(Gambut)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* 2. Satellite Telemetry Fetch Button */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-mute)] mb-1.5 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-[var(--ok)]" />
            <span>Tarik Telemetri Satelit:</span>
          </label>
          <button
            type="button"
            onClick={onLoadRealtimeData}
            disabled={loadingRealtime}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[var(--r-sm)] bg-[#3fc98a14] hover:bg-[#3fc98a28] text-[var(--ok)] border border-[#3fc98a4d] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--ok)] ${loadingRealtime ? 'animate-spin' : ''}`} />
            <span>{loadingRealtime ? 'Tarik Satelit...' : 'Tarik Satelit Realtime'}</span>
          </button>
        </div>

        {/* 3. Imputation Method Selection */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-mute)] mb-1.5 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Imputasi Data Missing:</span>
          </label>
          <select
            value={imputation}
            onChange={(e) => setImputation(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] px-3 py-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer font-medium"
          >
            <option value="knn" className="bg-[var(--surface)]">kNN (Gower Distance)</option>
            <option value="spline" className="bg-[var(--surface)]">Cubic Spline Interpolation</option>
            <option value="loess" className="bg-[var(--surface)]">LOESS Smoothing</option>
            <option value="linear" className="bg-[var(--surface)]">Linear Interpolation</option>
          </select>
        </div>

        {/* 4. Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-mute)] mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Model Time Series AI:</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] px-3 py-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer font-medium"
          >
            <option value="arima" className="bg-[var(--surface)]">ARIMA + Box-Cox (Stokastik)</option>
            <option value="lstm" className="bg-[var(--surface)]">LSTM Neural Network (PyTorch)</option>
            <option value="gru" className="bg-[var(--surface)]">GRU Neural Network (PyTorch)</option>
          </select>
        </div>

        {/* 5. Forecast Horizon & Pipeline Execution */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-mute)] mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span>Horizon Proyeksi (h Hari):</span>
          </label>
          <div className="space-y-1.5">
            <select
              value={h}
              onChange={(e) => setH(parseInt(e.target.value))}
              className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer font-medium"
            >
              <option value={4} className="bg-[var(--surface)]">4 Hari (Default Jurnal)</option>
              <option value={7} className="bg-[var(--surface)]">7 Hari (1 Minggu)</option>
              <option value={14} className="bg-[var(--surface)]">14 Hari (2 Minggu)</option>
            </select>

            <button
              type="button"
              onClick={onRunPipeline}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--accent)] text-[#0a0c0a] font-mono font-bold px-3 py-1.5 text-xs rounded-[var(--r-sm)] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-[#0a0c0a]" />
              <span>{isRunning ? 'Memproses...' : 'Jalankan Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
