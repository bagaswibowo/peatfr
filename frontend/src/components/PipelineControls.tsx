import React from 'react';
import { Settings, Play, Database, Cpu, Calendar } from 'lucide-react';

interface PipelineControlsProps {
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
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            KONFIGURASI ALGORITMA & MODEL PIPELINE
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono font-semibold">FastAPI Engine</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Imputation Method Selection */}
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

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Model Time Series Forecasting:</span>
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

        {/* Forecast Horizon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Horizon Proyeksi (h Hari):</span>
          </label>
          <select
            value={h}
            onChange={(e) => setH(parseInt(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            <option value={4}>4 Hari Ke Depan (Default Jurnal)</option>
            <option value={7}>7 Hari Ke Depan (1 Minggu)</option>
            <option value={14}>14 Hari Ke Depan (2 Minggu)</option>
          </select>
        </div>

        {/* Execute Button */}
        <div>
          <button
            onClick={onRunPipeline}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Menjalankan Exec Engine...' : 'Jalankan Pipeline Auto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
