import React from 'react';
import { X, BookOpen, Satellite, Flame, Cpu, Activity } from 'lucide-react';

interface TheoreticalSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoreticalSpecsModal: React.FC<TheoreticalSpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 border border-slate-200 shadow-2xl text-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-wide">
              Metodologi Jurnal & Integrasi Open Satellite APIs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600">
          {/* Card 1: Journal Reference */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80">
            <h4 className="font-bold text-emerald-900 mb-1.5 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" /> Informasi Publikasi Jurnal Acuan
            </h4>
            <p className="text-emerald-950"><strong>Judul:</strong> Peatfr: An R package to forecast tropical peatland fire risk with stochastic, machine learning, and optimisation methods</p>
            <p className="text-emerald-950"><strong>Penulis:</strong> Adilan W. Mahdiyasa, Melly, Udjianna S. Pasaribu (ITB), Muh Taufik (IPB), Bagus P. Muljadi (Univ. of Nottingham)</p>
            <p className="text-emerald-950"><strong>Jurnal:</strong> Ecological Informatics 92 (2025) 103532, Elsevier</p>
            <p className="text-emerald-950"><strong>DOI:</strong> <a href="https://doi.org/10.1016/j.ecoinf.2025.103532" target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 underline font-medium">10.1016/j.ecoinf.2025.103532</a></p>
          </div>

          {/* Card 2: Satellite Data Integrations */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-amber-700" /> Integrasi Open Satellite & Hotspot Data Sources
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-amber-950">
              <li>
                <strong>NASA FIRMS (Fire Information for Resource Management System):</strong> Overlay WMS real-time deteksi titik panas thermal VIIRS 375m (SNPP & NOAA-20) dalam 24 jam terakhir di seluruh wilayah Indonesia.
              </li>
              <li>
                <strong>Open-Meteo & ECMWF ERA5-Land Reanalysis:</strong> Data telemetri real-time harian untuk temperatur maksimum, curah hujan, dan kelembaban tanah (0-7cm & 7-28cm) di seluruh stasiun gambut Indonesia.
              </li>
              <li>
                <strong>Global Forest Watch (GFW) & OpenEPI APIs:</strong> Dataset sejarah kebakaran dan peta tutupan lahan gambut tropis Indonesia.
              </li>
            </ul>
          </div>

          {/* Card 3: Formulasi Matematika PFVI Clean Typography */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> 1. Formulasi Peat Fire Vulnerability Index (PFVI)
            </h4>
            <p className="text-slate-700">PFVI mengintegrasikan neraca air atmosferik harian, kelembaban tanah, dan kapilaritas muka air tanah:</p>
            
            {/* Primary Formula Box */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-md text-center font-serif text-base tracking-wide border border-slate-700">
              <span className="font-bold text-emerald-400">PFVI</span><sub className="text-xs text-slate-400">t</sub> = <span className="font-bold text-emerald-400">PFVI</span><sub className="text-xs text-slate-400">t−1</sub> + <span className="font-bold text-amber-300">DF</span><sub className="text-xs text-slate-400">t</sub> − <span className="font-bold text-blue-300">RF</span><sub className="text-xs text-slate-400">t</sub> − <span className="font-bold text-cyan-300">WTF</span><sub className="text-xs text-slate-400">t</sub>
            </div>

            {/* Sub-components Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-amber-800 block mb-1 text-xs">Evapotranspiration Loss (DF<sub>t</sub>):</span>
                <div className="font-serif text-slate-800 text-center py-1 text-sm bg-slate-50 rounded border border-slate-200 my-1">
                  DF<sub>t</sub> = min(10, DF<sub>t−1</sub> + <sup>0.5 × (T<sub>max,t</sub> − 25)</sup> / <sub>1 + 0.1 × R<sub>t</sub></sub>)
                </div>
                <p className="text-[11px] text-slate-500">Akumulasi evaporasi tanah berbasis suhu max harian (T<sub>max</sub>) dan presipitasi (R<sub>t</sub>).</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-cyan-800 block mb-1 text-xs">Water Table Factor (WTF<sub>t</sub>):</span>
                <div className="font-serif text-slate-800 text-center py-1 text-sm bg-slate-50 rounded border border-slate-200 my-1">
                  WTF<sub>t</sub> = a<sub>H</sub> × max(0, θ<sub>t</sub> − θ<sub>fc</sub>)<sup>b<sub>H</sub></sup>
                </div>
                <p className="text-[11px] text-slate-500">Retensi air van Genuchten θ(v) = [1 + (v/α)<sup>n</sup>]<sup>−m</sup> dengan constraint a<sub>H</sub>, b<sub>H</sub> ≥ 0.</p>
              </div>
            </div>

            <ul className="list-disc pl-5 space-y-1 mt-2 text-slate-700">
              <li><strong>DF<sub>t</sub> (Evapotranspiration Loss):</strong> Fungsi dari temperatur maksimum udara (T<sub>m</sub>) dan curah hujan harian (R<sub>0</sub>).</li>
              <li><strong>RF<sub>t</sub> (Rainfall Factor):</strong> Mengakomodasi intersepsi kanopi awal (ambang 5.1 mm/hari).</li>
              <li><strong>WTF<sub>t</sub> (Water Table Factor):</strong> Menggunakan fungsi retensi tanah van Genuchten θ(v) = [1 + (v/α)<sup>n</sup>]<sup>−m</sup>.</li>
            </ul>
          </div>

          {/* Card 4: Nelder-Mead Optimization */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" /> 2. Optimisasi Parameter Nelder-Mead
            </h4>
            <p className="text-slate-700">
              Parameter a<sub>H</sub>, b<sub>H</sub>, α, n dikalibrasi secara dinamis tanpa derivatif untuk meminimalkan Mean Squared Error (MSE) antara PFVI simulasi dengan Indeks Kekeringan Observasi (DI<sub>obs</sub>) yang dihitung dari sensor kelembaban tanah.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
