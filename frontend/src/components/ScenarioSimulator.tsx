import React, { useState } from 'react';
import { Sliders, Flame, AlertTriangle } from 'lucide-react';

export const ScenarioSimulator: React.FC = () => {
  const [tempDelta, setTempDelta] = useState<number>(2.0);
  const [dryDays, setDryDays] = useState<number>(10);
  const [wtDepth, setWtDepth] = useState<number>(1.1); // meters below surface
  const [initialPfvi, setInitialPfvi] = useState<number>(180.0);

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

  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-wide">
              Simulasi Skenario Cuaca & Respon Kerawanan Lahan ("What-If Scenario")
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Uji dampak kenaikan suhu, periode kemarau, dan penurunan muka air tanah terhadap indeks PFVI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Input Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Temp Delta Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>Kenaikan Suhu Udara (Temp Delta):</span>
              <span className="text-rose-600 font-bold">+{tempDelta.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Dry Spell Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>Durasi Kemarau Tanpa Hujan (Hari):</span>
              <span className="text-amber-600 font-bold">{dryDays} Hari</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={dryDays}
              onChange={(e) => setDryDays(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Water Table Depth Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>Kedalaman Muka Air Tanah (WT Depth Below Surface):</span>
              <span className="text-cyan-700 font-bold">-{wtDepth.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.8"
              step="0.05"
              value={wtDepth}
              onChange={(e) => setWtDepth(parseFloat(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Initial PFVI */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>PFVI Baseline Awal:</span>
              <span className="text-slate-900 font-bold">{initialPfvi.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="20"
              max="250"
              step="5"
              value={initialPfvi}
              onChange={(e) => setInitialPfvi(parseFloat(e.target.value))}
              className="w-full accent-slate-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Simulation Result Readout Box */}
        <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>Hasil Proyeksi Skenario</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>

            <div className="space-y-4 my-3">
              <div>
                <div className="text-xs text-slate-500 font-medium">PFVI Awal:</div>
                <div className="text-xl font-mono font-bold text-slate-800">{initialPfvi.toFixed(1)} / 300.0</div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">PFVI Prediksi Setelah {dryDays} Hari:</div>
                <div className="text-3xl font-mono font-extrabold text-red-600">
                  {simResult.finalPfvi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 300.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-600 font-medium space-y-1">
            <div className="flex justify-between">
              <span>Laju Evapotranspirasi (DF):</span>
              <span className="font-mono font-bold text-slate-800">+{simResult.timeline[0]?.df.toFixed(2)} /hr</span>
            </div>
            <div className="flex justify-between">
              <span>Kapilaritas Air Tanah (WTF):</span>
              <span className="font-mono font-bold text-slate-800">-{simResult.timeline[0]?.wtf.toFixed(2)} /hr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
