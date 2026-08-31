import React from 'react';
import { X, BookOpen, Satellite, Flame } from 'lucide-react';

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
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80">
            <h4 className="font-bold text-emerald-900 mb-1.5 text-sm flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" /> Informasi Publikasi Jurnal
            </h4>
            <p className="text-emerald-950"><strong>Judul:</strong> Peatfr: An R package to forecast tropical peatland fire risk with stochastic, machine learning, and optimisation methods</p>
            <p className="text-emerald-950"><strong>Penulis:</strong> Adilan W. Mahdiyasa, Melly, Udjianna S. Pasaribu (ITB), Muh Taufik (IPB), Bagus P. Muljadi (Univ. of Nottingham)</p>
            <p className="text-emerald-950"><strong>Jurnal:</strong> Ecological Informatics 92 (2025) 103532, Elsevier</p>
            <p className="text-emerald-950"><strong>DOI:</strong> <a href="https://doi.org/10.1016/j.ecoinf.2025.103532" target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 underline font-medium">10.1016/j.ecoinf.2025.103532</a></p>
          </div>

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

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm mb-2">1. Formula Peat Fire Vulnerability Index (PFVI)</h4>
            <p className="mb-2 text-slate-700">PFVI mengintegrasikan neraca air atmosferik, kelembaban tanah, dan kapilaritas air tanah:</p>
            <div className="font-mono bg-white p-3 rounded-lg border border-slate-300 text-emerald-700 font-semibold shadow-sm text-center text-sm">
              {"PFVI_t = PFVI_{t-1} + DF_t - RF_t - WTF_t"}
            </div>
            <ul className="list-disc pl-5 space-y-1 mt-2 text-slate-700">
              <li><strong>DF_t (Evapotranspiration Loss):</strong> Fungsi dari temperatur maksimum udara (T_m) dan curah hujan tahunan (R_0).</li>
              <li><strong>RF_t (Rainfall Factor):</strong> Mengakomodasi intersepsi kanopi awal (ambang 5.1 mm/hari).</li>
              <li><strong>WTF_t (Water Table Factor):</strong> Menggunakan fungsi retensi tanah van Genuchten θ(v) = [1 + (v/α)^n]^-m.</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 text-sm mb-2">2. Optimisasi Parameter Nelder-Mead</h4>
            <p className="text-slate-700">
              Parameter a_H, b_H, α, n dikalibrasi secara dinamis tanpa derivatif untuk meminimalkan Mean Squared Error (MSE) antara PFVI simulasi dengan Indeks Kekeringan Observasi (DI_obs) yang dihitung dari sensor kelembaban tanah.
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
