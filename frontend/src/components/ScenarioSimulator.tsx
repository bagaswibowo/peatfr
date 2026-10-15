import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';

interface ScenarioSimulatorProps {
  currentPfvi?: number | null;
  optimizedParams?: { a_h: number; b_h: number; n: number; alpha: number; mse: number } | null;
}

// Paper defaults (Mahdiyasa et al., 2025) used only when the pipeline has not
// returned calibrated parameters for the selected location yet.
const PAPER_DEFAULTS = { a_h: 6.5, b_h: 0.02, n: 18.2, alpha: 0.9 };

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ currentPfvi, optimizedParams }) => {
  const [tempDelta, setTempDelta] = useState<number>(2.0);
  const [dryDays, setDryDays] = useState<number>(10);
  const [wtDepth, setWtDepth] = useState<number>(1.1); // meters below surface

  const hasBaseline = typeof currentPfvi === 'number' && Number.isFinite(currentPfvi) && currentPfvi > 0;
  const [initialPfvi, setInitialPfvi] = useState<number>(hasBaseline ? (currentPfvi as number) : 120);

  useEffect(() => {
    if (hasBaseline) {
      setInitialPfvi(currentPfvi as number);
    }
  }, [currentPfvi, hasBaseline]);

  // Simulates hypothetical scenario
  const simulateScenario = () => {
    let current = initialPfvi;
    const baseTemp = 33.5 + tempDelta;
    const wtCm = wtDepth * 100.0;

    const { a_h: aH, b_h: bH, n, alpha } = optimizedParams || PAPER_DEFAULTS;

    const timeline = [];
    for (let day = 1; day <= dryDays; day++) {
      const df = (300.0 - current) * (0.4982 * Math.exp(0.0905 * baseTemp + 1.6096) - 4.268) * 1e-3 / (1.0 + 10.88 * Math.exp(-0.0017358 * 3000));
      const rf = 0.0; // 0 mm rain during dry spell

      const m = 1.0 - 1.0 / n;
      const theta = Math.pow(1.0 + Math.pow(wtCm / alpha, n), -m);
      const wtf = aH - bH * (1.0 - theta) * 300.0;

      current = Math.min(300.0, Math.max(0.0, current + df - rf - wtf));
      timeline.push({ day, pfvi: current, df, wtf });
    }

    const mean = (pick: (row: { df: number; wtf: number }) => number) =>
      timeline.length ? timeline.reduce((s, row) => s + pick(row), 0) / timeline.length : 0;

    return { finalPfvi: current, timeline, meanDf: mean((r) => r.df), meanWtf: mean((r) => r.wtf) };
  };

  const simResult = simulateScenario();
  const delta = simResult.finalPfvi - initialPfvi;
  const category = simResult.finalPfvi >= 225 ? 'ekstrem' : simResult.finalPfvi >= 150 ? 'tinggi' : simResult.finalPfvi >= 75 ? 'sedang' : 'rendah';

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="font-disp text-[17px] font-bold tracking-tight text-[var(--text)]">Simulasi "bagaimana jika"</h2>
        <p className="text-xs text-[var(--text-dim)] mt-0.5">
          Uji dampak cuaca dan muka air tanah terhadap PFVI · parameter hidrologi{' '}
          {optimizedParams
            ? `terkalibrasi pipeline (aH ${optimizedParams.a_h.toFixed(2)}, bH ${optimizedParams.b_h.toFixed(3)}, n ${optimizedParams.n.toFixed(1)}, α ${optimizedParams.alpha.toFixed(2)})`
            : 'default jurnal Sabangau (Mahdiyasa dkk., 2025)'}
          {!hasBaseline ? ' · PFVI dasar belum tersedia untuk lokasi ini' : ''}
        </p>
      </div>

      <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Sliders Controls (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-[var(--line)]">
          {/* Slider 1: Temperature */}
          <div className="flex flex-col gap-2 font-mono">
            <div className="flex justify-between items-baseline font-sans text-xs">
              <span className="text-[var(--text-mute)]">Kenaikan suhu udara</span>
              <span className="font-mono text-[13px] font-bold text-[var(--accent)]">+{tempDelta.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              className="w-full h-[3px] bg-[var(--line)] rounded-full outline-none accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Slider 2: Dry Days */}
          <div className="flex flex-col gap-2 font-mono">
            <div className="flex justify-between items-baseline font-sans text-xs">
              <span className="text-[var(--text-mute)]">Durasi kemarau tanpa hujan</span>
              <span className="font-mono text-[13px] font-bold text-[var(--accent)]">{dryDays} hari</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={dryDays}
              onChange={(e) => setDryDays(parseInt(e.target.value))}
              className="w-full h-[3px] bg-[var(--line)] rounded-full outline-none accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Slider 3: Water Table */}
          <div className="flex flex-col gap-2 font-mono">
            <div className="flex justify-between items-baseline font-sans text-xs">
              <span className="text-[var(--text-mute)]">Kedalaman air tanah</span>
              <span className="font-mono text-[13px] font-bold text-[var(--accent)]">-{wtDepth.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={wtDepth}
              onChange={(e) => setWtDepth(parseFloat(e.target.value))}
              className="w-full h-[3px] bg-[var(--line)] rounded-full outline-none accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* Slider 4: Initial PFVI Baseline */}
          <div className="flex flex-col gap-2 font-mono">
            <div className="flex justify-between items-baseline font-sans text-xs">
              <span className="text-[var(--text-mute)]">Skor risiko awal</span>
              <span className="font-mono text-[13px] font-bold text-[var(--text)]">{initialPfvi.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="20"
              max="280"
              step="1"
              value={initialPfvi}
              onChange={(e) => setInitialPfvi(parseFloat(e.target.value))}
              className="w-full h-[3px] bg-[var(--line)] rounded-full outline-none accent-[var(--accent)] cursor-pointer"
            />
          </div>
        </div>

        {/* Right Result Readout (5 Cols) */}
        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-center gap-5">
          <div className="flex flex-col gap-1 font-mono">
            <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] font-sans">
              Skor risiko setelah simulasi
            </span>
            <span className="text-4xl font-bold tracking-tight text-[var(--accent)] my-1">
              {simResult.finalPfvi.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--text-mute)] font-sans">
              {delta >= 0 ? 'naik' : 'turun'} {Math.abs(delta).toFixed(1)} dari kondisi sekarang · level {category}
            </span>
          </div>

          <div className="flex gap-6 pt-4 border-t border-[var(--line-soft)] font-mono text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] text-[var(--text-dim)] font-sans">Evapotranspirasi rata-rata (DF)</span>
              <span className="text-[13px] font-medium text-[var(--text)]">{simResult.meanDf.toFixed(2)} PFVI/hari</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] text-[var(--text-dim)] font-sans">Serapan muka air (WTF)</span>
              <span className="text-[13px] font-medium text-[var(--text)]">{simResult.meanWtf.toFixed(2)} PFVI/hari</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
