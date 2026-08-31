import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';

interface ScenarioSimulatorProps {
  currentPfvi?: number;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ currentPfvi = 180.0 }) => {
  const [tempDelta, setTempDelta] = useState<number>(2.0);
  const [dryDays, setDryDays] = useState<number>(10);
  const [wtDepth, setWtDepth] = useState<number>(1.1); // meters below surface
  const [initialPfvi, setInitialPfvi] = useState<number>(currentPfvi);

  useEffect(() => {
    if (currentPfvi) {
      setInitialPfvi(currentPfvi);
    }
  }, [currentPfvi]);

  // Simulates hypothetical scenario
  const simulateScenario = () => {
    let current = initialPfvi;
    const baseTemp = 33.5 + tempDelta;
    const wtCm = wtDepth * 100.0;
    
    // Calibration parameters (typical Sabangau calibrated values)
    const aH = 6.5;
    const bH = 0.02;
    const n = 18.2;
    const alpha = 0.9;

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
    return { finalPfvi: current, timeline };
  };

  const simResult = simulateScenario();
  const delta = simResult.finalPfvi - initialPfvi;
  const category = simResult.finalPfvi >= 225 ? 'ekstrem' : simResult.finalPfvi >= 150 ? 'tinggi' : simResult.finalPfvi >= 75 ? 'sedang' : 'rendah';

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Simulasi skenario "bagaimana jika"</h2>
        <p className="text-xs text-[var(--text-dim)] mt-0.5">Uji dampak cuaca dan muka air tanah terhadap PFVI</p>
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
              <span className="text-[var(--text-mute)]">Kedalaman muka air tanah</span>
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
              <span className="text-[var(--text-mute)]">PFVI dasar awal</span>
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
              Proyeksi PFVI setelah periode simulasi
            </span>
            <span className="text-4xl font-bold tracking-tight text-[var(--accent)] my-1">
              {simResult.finalPfvi.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--text-mute)] font-sans">
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)} dari dasar · kategori {category}
            </span>
          </div>

          <div className="flex gap-6 pt-4 border-t border-[var(--line-soft)] font-mono text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] text-[var(--text-dim)] font-sans">Laju evapotranspirasi</span>
              <span className="text-[13px] font-medium text-[var(--text)]">+{(2.1 + tempDelta * 1.35).toFixed(2)} /jam</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10.5px] text-[var(--text-dim)] font-sans">Kapilaritas air tanah</span>
              <span className="text-[13px] font-medium text-[var(--text)]">{(-0.12 - wtDepth * 0.28).toFixed(2)} /jam</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
