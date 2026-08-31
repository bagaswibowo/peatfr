import React from 'react';
import { X, BookOpen, Satellite, Calculator } from 'lucide-react';
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#0a0c0a]/80 backdrop-blur-sm">
      <div className="bg-[var(--surface)] w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-[var(--r-md)] p-6 border border-[var(--line)] shadow-2xl text-[var(--text)] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-sm font-bold tracking-tight text-[var(--text)]">
              Metodologi Jurnal &amp; Formulasi Matematika Satelit
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--r-sm)] hover:bg-[var(--surface-2)] text-[var(--text-mute)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-[var(--text-mute)]">
          {/* Card 1: Journal Reference */}
          <div className="bg-[var(--accent-soft)] p-4 rounded-[var(--r-sm)] border border-[var(--accent-line)]">
            <h4 className="font-bold text-[var(--accent)] mb-1.5 text-xs flex items-center gap-1.5 uppercase font-mono">
              <BookOpen className="w-4 h-4" /> Informasi Publikasi Jurnal Acuan
            </h4>
            <p className="text-[var(--text)]"><strong>Judul:</strong> Peatfr: An R package to forecast tropical peatland fire risk with stochastic, machine learning, and optimisation methods</p>
            <p className="text-[var(--text)]"><strong>Penulis:</strong> Adilan W. Mahdiyasa, Melly, Udjianna S. Pasaribu (ITB), Muh Taufik (IPB), Bagus P. Muljadi (Univ. of Nottingham)</p>
            <p className="text-[var(--text)]"><strong>Jurnal:</strong> Ecological Informatics 92 (2025) 103532, Elsevier</p>
            <p className="text-[var(--text)]"><strong>DOI:</strong> <a href="https://doi.org/10.1016/j.ecoinf.2025.103532" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline font-medium">10.1016/j.ecoinf.2025.103532</a></p>
          </div>

          {/* Card 2: Satellite Data Integration */}
          <div className="bg-[var(--surface-2)] p-4 rounded-[var(--r-sm)] border border-[var(--line)] space-y-2">
            <h4 className="font-bold text-[var(--text)] text-xs flex items-center gap-1.5 uppercase font-mono">
              <Satellite className="w-4 h-4 text-[var(--ok)]" /> Integrasi Open Satellite &amp; Hotspot Data Sources
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-mute)]">
              <li>
                <strong>NASA FIRMS (Fire Information for Resource Management System):</strong> Real-time deteksi titik panas thermal VIIRS 375m (SNPP &amp; NOAA-20) dalam 24 jam terakhir.
              </li>
              <li>
                <strong>Open-Meteo &amp; ECMWF ERA5-Land Reanalysis:</strong> Data telemetri harian untuk temperatur maksimum, curah hujan, dan kelembaban tanah (0-7cm &amp; 7-28cm).
              </li>
              <li>
                <strong>Global Forest Watch (GFW) &amp; OpenEPI APIs:</strong> Poligon spasial lahan gambut dan data historis tutupan lahan Indonesia.
              </li>
            </ul>
          </div>

          {/* Section 3: 6 Formulasi Matematika Lengkap */}
          <div className="bg-[var(--surface-2)] p-4 rounded-[var(--r-sm)] border border-[var(--line)] space-y-4 font-mono">
            <h4 className="font-bold text-[var(--text)] text-xs flex items-center gap-1.5 uppercase font-sans">
              <Calculator className="w-4 h-4 text-[var(--accent)]" /> Formulasi Matematika &amp; Simbol Persamaan
            </h4>

            {/* Formula 1 */}
            <div className="bg-[var(--surface)] p-3.5 rounded border border-[var(--line)] space-y-1.5">
              <span className="font-bold text-[var(--warn)] text-xs block font-sans">1. Evapotranspiration Loss (Drought Factor <MathInline math="\text{DF}_t" />):</span>
              <div className="bg-[var(--bg)] p-2.5 rounded border border-[var(--line)] text-[var(--text)]">
                <MathBlock math="\text{DF}_t = \min\left(10, \; \text{DF}_{t-1} + \frac{0.5 \cdot (T_{\max, t} - 25)}{1 + 0.1 \cdot R_t}\right)" />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] font-sans">Fungsi penguapan bertahap terhadap temperatur maksimum harian (<MathInline math="T_{\max}" />) dan curah hujan efektif (<MathInline math="R_t" />).</p>
            </div>

            {/* Formula 2 */}
            <div className="bg-[var(--surface)] p-3.5 rounded border border-[var(--line)] space-y-1.5">
              <span className="font-bold text-[var(--ok)] text-xs block font-sans">2. Water Table Position (van Genuchten Retention <MathInline math="\text{WT}_t" />):</span>
              <div className="bg-[var(--bg)] p-2.5 rounded border border-[var(--line)] text-[var(--text)]">
                <MathBlock math="\text{WT}_t = -0.4 + a_H \cdot \max\left(0, \; \theta_t - \theta_{\text{fc}}\right)^{b_H} \quad \text{dengan } a_H, b_H \ge 0" />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] font-sans">Retensi air tanah van Genuchten <MathInline math="\theta(v) = [1 + (v/\alpha)^n]^{-m}" /> dengan batas fisik <MathInline math="a_H, b_H \ge 0" />.</p>
            </div>

            {/* Formula 3 */}
            <div className="bg-[var(--surface)] p-3.5 rounded border border-[var(--accent-line)] space-y-1.5 bg-[var(--accent-soft)]">
              <span className="font-bold text-[var(--accent)] text-xs block font-sans">3. Indeks Kerawanan Kebakaran Gambut (<MathInline math="\text{PFVI}_t" />):</span>
              <div className="bg-[var(--bg)] text-[var(--accent)] p-3 rounded border border-[var(--accent-line)]">
                <MathBlock math="\text{PFVI}_t = 100 \cdot \left( 0.4 \cdot \frac{\text{DF}_t}{10} + 0.4 \cdot \max\left(0, \frac{-\text{WT}_t}{0.4}\right) + 0.2 \cdot (1 - \theta_t) \right)" />
              </div>
              <p className="text-[11px] text-[var(--text-mute)] font-sans">Bobot gabungan 40% Drought Factor, 40% Defisit Muka Air Tanah (-0.4m), dan 20% Soil Moisture Deficit.</p>
            </div>

            {/* Formula 4 */}
            <div className="bg-[var(--surface)] p-3.5 rounded border border-[var(--line)] space-y-1.5">
              <span className="font-bold text-[var(--text-mute)] text-xs block font-sans">4. Transformasi Box-Cox (<MathInline math="y_t^{(\lambda)}" />):</span>
              <div className="bg-[var(--bg)] p-2.5 rounded border border-[var(--line)] text-[var(--text)]">
                <MathBlock math="y_t^{(\lambda)} = \begin{cases} \dfrac{y_t^\lambda - 1}{\lambda}, & \text{bila } \lambda \neq 0 \\[8pt] \ln(y_t), & \text{bila } \lambda = 0 \end{cases}" />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] font-sans">Stabilisasi varians deret waktu non-stasioner sebelum pemodelan stokastik ARIMA.</p>
            </div>

            {/* Formula 5 */}
            <div className="bg-[var(--surface)] p-3.5 rounded border border-[var(--line)] space-y-1.5">
              <span className="font-bold text-[var(--text-mute)] text-xs block font-sans">5. Model Deret Waktu Stochastic ARIMA(<MathInline math="p, d, q" />):</span>
              <div className="bg-[var(--bg)] p-2.5 rounded border border-[var(--line)] text-[var(--text)]">
                <MathBlock math="y_t = c + \sum_{i=1}^p \phi_i y_{t-i} + \sum_{j=1}^q \theta_j \varepsilon_{t-j} + \varepsilon_t" />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] font-sans">Kombinasi Autoregressive (<MathInline math="\phi_i" />) dan Moving Average (<MathInline math="\theta_j" />) dengan derau putih <MathInline math="\varepsilon_t" />.</p>
            </div>

            {/* Formula 6 */}
            <div className="bg-[var(--surface)] p-3.5 rounded border border-[var(--line)] space-y-1.5">
              <span className="font-bold text-[var(--text-mute)] text-xs block font-sans">6. Fungsi Tujuan Optimasi Nelder-Mead (Kalibrasi Parameter):</span>
              <div className="bg-[var(--bg)] p-2.5 rounded border border-[var(--line)] text-[var(--text)]">
                <MathBlock math="\min_{a_H, b_H \ge 0} \; \text{MSE} = \frac{1}{N} \sum_{i=1}^N \left( \text{PFVI}_i(a_H, b_H) - \text{DI}_{\text{obs}, i} \right)^2" />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] font-sans">Optimasi terikat tanpa derivatif untuk meminimalkan MSE terhadap Indeks Kekeringan Observasi (<MathInline math="\text{DI}_{\text{obs}}" />).</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[var(--line)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[var(--accent)] text-[#0a0c0a] font-mono font-bold rounded-[var(--r-sm)] text-xs transition-opacity hover:opacity-90 cursor-pointer"
          >
            Tutup Modal
          </button>
        </div>
      </div>
    </div>
  );
};
