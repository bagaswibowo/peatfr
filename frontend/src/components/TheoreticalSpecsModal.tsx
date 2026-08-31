import React from 'react';
import { X, BookOpen, Satellite, Cpu, Activity, Calculator, Sparkles } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface TheoreticalSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MathBlock: React.FC<{ math: string }> = ({ math }) => {
  try {
    const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
    return <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    return <div className="font-mono text-xs">{math}</div>;
  }
};

const MathInline: React.FC<{ math: string }> = ({ math }) => {
  try {
    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    return <span>{math}</span>;
  }
};

export const TheoreticalSpecsModal: React.FC<TheoreticalSpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 border border-slate-200 shadow-2xl text-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-wide">
              Metodologi Jurnal & Formulasi Matematika Satelit (KaTeX Symbols)
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

          {/* Card 2: Satellite Data Integration */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2">
            <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-amber-700" /> Integrasi Open Satellite & Hotspot Data Sources
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-amber-950">
              <li>
                <strong>NASA FIRMS (Fire Information for Resource Management System):</strong> Real-time deteksi titik panas thermal VIIRS 375m (SNPP & NOAA-20) dalam 24 jam terakhir.
              </li>
              <li>
                <strong>Open-Meteo & ECMWF ERA5-Land Reanalysis:</strong> Data telemetri harian untuk temperatur maksimum, curah hujan, dan kelembaban tanah (0-7cm & 7-28cm).
              </li>
              <li>
                <strong>Global Forest Watch (GFW) & OpenEPI APIs:</strong> Poligon spasial lahan gambut dan data historis tutupan lahan Indonesia.
              </li>
            </ul>
          </div>

          {/* Section 3: 6 Formulasi Matematika Lengkap (KaTeX Symbol Render) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" /> Formulasi Matematika & Simbol Persamaan (Sesuai Notion)
            </h4>

            {/* Formula 1: Evapotranspiration Loss (DF_t) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <span className="font-bold text-amber-800 text-xs block">1. Evapotranspiration Loss (Drought Factor <MathInline math="\text{DF}_t" />):</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-900">
                <MathBlock math="\text{DF}_t = \min\left(10, \; \text{DF}_{t-1} + \frac{0.5 \cdot (T_{\max, t} - 25)}{1 + 0.1 \cdot R_t}\right)" />
              </div>
              <p className="text-[11px] text-slate-500">Fungsi penguapan bertahap terhadap temperatur maksimum harian (<MathInline math="T_{\max}" />) dan curah hujan efektif (<MathInline math="R_t" />).</p>
            </div>

            {/* Formula 2: Water Table Position (WT_t) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <span className="font-bold text-cyan-800 text-xs block">2. Water Table Position (van Genuchten Retention <MathInline math="\text{WT}_t" />):</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-900">
                <MathBlock math="\text{WT}_t = -0.4 + a_H \cdot \max\left(0, \; \theta_t - \theta_{\text{fc}}\right)^{b_H} \quad \text{dengan } a_H, b_H \ge 0" />
              </div>
              <p className="text-[11px] text-slate-500">Retensi air tanah van Genuchten <MathInline math="\theta(v) = [1 + (v/\alpha)^n]^{-m}" /> dengan batas fisik <MathInline math="a_H, b_H \ge 0" />.</p>
            </div>

            {/* Formula 3: Consolidate PFVI_t */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm space-y-1.5 bg-emerald-50/30">
              <span className="font-bold text-emerald-900 text-xs block">3. Indeks Kerawanan Kebakaran Gambut (<MathInline math="\text{PFVI}_t" />):</span>
              <div className="bg-emerald-950 text-emerald-100 p-3 rounded-lg border border-emerald-800 shadow-inner">
                <MathBlock math="\text{PFVI}_t = 100 \cdot \left( 0.4 \cdot \frac{\text{DF}_t}{10} + 0.4 \cdot \max\left(0, \frac{-\text{WT}_t}{0.4}\right) + 0.2 \cdot (1 - \theta_t) \right)" />
              </div>
              <p className="text-[11px] text-slate-600">Bobot gabungan 40% Drought Factor, 40% Defisit Muka Air Tanah (-0.4m), dan 20% Soil Moisture Deficit.</p>
            </div>

            {/* Formula 4: Box-Cox Transformation */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <span className="font-bold text-purple-800 text-xs block">4. Transformasi Box-Cox (<MathInline math="y_t^{(\lambda)}" />):</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-900">
                <MathBlock math="y_t^{(\lambda)} = \begin{cases} \dfrac{y_t^\lambda - 1}{\lambda}, & \text{bila } \lambda \neq 0 \\[8pt] \ln(y_t), & \text{bila } \lambda = 0 \end{cases}" />
              </div>
              <p className="text-[11px] text-slate-500">Stabilisasi varians deret waktu non-stasioner sebelum pemodelan stokastik ARIMA.</p>
            </div>

            {/* Formula 5: ARIMA(p, d, q) Model */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <span className="font-bold text-blue-800 text-xs block">5. Model Deret Waktu Stochastic ARIMA(<MathInline math="p, d, q" />):</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-900">
                <MathBlock math="y_t = c + \sum_{i=1}^p \phi_i y_{t-i} + \sum_{j=1}^q \theta_j \varepsilon_{t-j} + \varepsilon_t" />
              </div>
              <p className="text-[11px] text-slate-500">Kombinasi Autoregressive (<MathInline math="\phi_i" />) dan Moving Average (<MathInline math="\theta_j" />) dengan derau putih <MathInline math="\varepsilon_t" />.</p>
            </div>

            {/* Formula 6: Nelder-Mead Optimization Objective Function */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <span className="font-bold text-indigo-800 text-xs block">6. Fungsi Tujuan Optimasi Nelder-Mead (Kalibrasi Parameter):</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-900">
                <MathBlock math="\min_{a_H, b_H \ge 0} \; \text{MSE} = \frac{1}{N} \sum_{i=1}^N \left( \text{PFVI}_i(a_H, b_H) - \text{DI}_{\text{obs}, i} \right)^2" />
              </div>
              <p className="text-[11px] text-slate-500">Optimasi terikat tanpa derivatif untuk meminimalkan MSE terhadap Indeks Kekeringan Observasi (<MathInline math="\text{DI}_{\text{obs}}" />).</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Tutup Modal
          </button>
        </div>
      </div>
    </div>
  );
};
