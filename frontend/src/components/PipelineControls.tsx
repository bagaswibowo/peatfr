import React, { useState } from 'react';
import { Settings, Play, Database, Cpu, Calendar, RefreshCw, Satellite, Info, Layers } from 'lucide-react';

interface PipelineControlsProps {
  soilType: string;
  imputation: string;
  setImputation: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  h: number;
  setH: (val: number) => void;
  onRunPipeline: () => void;
  isRunning: boolean;
}

const FIELD = 'w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer';
const LABEL = 'block text-[12.5px] font-semibold text-[var(--text-mute)] mb-1.5';

/**
 * Expert-only knobs. Target location now lives in the top bar (global state) and the
 * satellite fetch on the header refresh button, so this panel keeps only the choices
 * that genuinely need explaining.
 */
export const PipelineControls: React.FC<PipelineControlsProps> = ({
  soilType,
  imputation,
  setImputation,
  model,
  setModel,
  h,
  setH,
  onRunPipeline,
  isRunning
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <section className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[var(--line-soft)] pb-3">
        <h2 className="font-disp text-[15px] font-bold text-[var(--text)] flex items-center gap-2">
          <Settings className="w-4 h-4 text-[var(--accent)]" />
          <span>Pengaturan perhitungan</span>
        </h2>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            soilType.startsWith('Gambut')
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]'
              : 'bg-[var(--surface-2)] text-[var(--text-mute)] border-[var(--line)]'
          }`}>
            <Layers className="w-3.5 h-3.5" />
            <span>Jenis tanah: {soilType}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            aria-expanded={showHelp}
            className="flex items-center gap-1 text-[var(--text-mute)] hover:text-[var(--accent)] cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showHelp ? 'Tutup panduan' : 'Panduan'}</span>
          </button>
        </div>
      </div>

      {showHelp && (
        <p className="mb-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] p-3.5 text-[13px] text-[var(--text-mute)] leading-relaxed">
          <b className="text-[var(--text)]">Cara mengisi data kosong</b> menentukan bagaimana data satelit yang bolong diisi sebelum dihitung — biarkan bawaan (kNN) kalau ragu.{' '}
          <b className="text-[var(--text)]">Model perhitungan</b> adalah mesin yang memproyeksikan cuaca dan tanah ke depan — ARIMA adalah bawaan yang cepat dan stabil.{' '}
          <b className="text-[var(--text)]">Berapa hari ke depan</b> menentukan seberapa jauh proyeksi dihitung.
          Wilayah target diatur dari pemilih wilayah di bar atas; klik peta atau tombol &quot;Lihat di peta&quot;
          pada peringatan untuk memakai koordinat spesifik.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className={LABEL} htmlFor="opt-imputation">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Cara mengisi data kosong</span>
            </span>
          </label>
          <select id="opt-imputation" value={imputation} onChange={(e) => setImputation(e.target.value)} className={FIELD}>
            <option value="knn">kNN (bawaan, paling aman)</option>
            <option value="spline">Cubic Spline</option>
            <option value="loess">LOESS Smoothing</option>
            <option value="linear">Interpolasi Linear</option>
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="opt-model">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Model perhitungan</span>
            </span>
          </label>
          <select id="opt-model" value={model} onChange={(e) => setModel(e.target.value)} className={FIELD}>
            <option value="arima">ARIMA (bawaan, cepat)</option>
            <option value="lstm">LSTM (AI, lebih berat)</option>
            <option value="gru">GRU (AI, lebih berat)</option>
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="opt-horizon">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Berapa hari ke depan</span>
            </span>
          </label>
          <select id="opt-horizon" value={h} onChange={(e) => setH(parseInt(e.target.value))} className={FIELD}>
            <option value={4}>4 hari</option>
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onRunPipeline}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-[#0a0c0a] font-bold px-4 py-2.5 text-[13.5px] rounded-[var(--r-sm)] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-[#0a0c0a]" />}
          <span>{isRunning ? 'Menghitung...' : 'Hitung ulang proyeksi'}</span>
        </button>
      </div>

      <p className="mt-3 text-[12px] text-[var(--text-dim)] flex items-center gap-1.5">
        <Satellite className="w-3.5 h-3.5" />
        <span>Data satelit ditarik otomatis saat wilayah diganti. Tombol tarik ulang ada di bar atas.</span>
      </p>
    </section>
  );
};
