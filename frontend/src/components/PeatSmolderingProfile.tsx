import React from 'react';
import { AlertTriangle, Droplets, Flame, ShieldCheck, Thermometer } from 'lucide-react';

interface PeatSmolderingProfileProps {
  waterTable: number;
  soilMoisture: number;
  pfvi: number;
  status: string;
}

export const PeatSmolderingProfile: React.FC<PeatSmolderingProfileProps> = ({
  waterTable,
  soilMoisture,
  pfvi,
  status
}) => {
  const wtDepthCm = Math.abs(waterTable) * 100;
  const wtVisualPercent = Math.min(92, Math.max(15, (wtDepthCm / 150) * 100));
  
  const isCritical = wtDepthCm > 40;
  const isExtreme = wtDepthCm > 80 || pfvi >= 225;

  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-md font-mono font-bold text-xs">
              SIGNATURE PROFILE
            </span>
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              Penampang Kedalaman Muka Air Tanah & Risiko Kebakaran Gambut Bawah Permukaan (Smoldering Risk)
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Visualisasi profil tanah gambut tropis (PP No. 71/2014): Batas kritis TMA adalah 40 cm di bawah permukaan tanah.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
            isExtreme 
              ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
              : isCritical
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {isExtreme ? <Flame className="w-3.5 h-3.5" /> : isCritical ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isExtreme ? 'KEDALAMAN AIR SANGAT KRITIS (>80cm)' : isCritical ? 'MELEBIHI BATAS AMAN PP 71/2014 (>40cm)' : 'TMA AMAN (≤40cm)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Visual Cross-Section Profile Graphic */}
        <div className="lg:col-span-7 bg-slate-900 rounded-lg p-4 text-white relative overflow-hidden border border-slate-800 shadow-inner">
          {/* Header Legend inside Graphic */}
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-300 mb-3 border-b border-slate-700/60 pb-2">
            <span>PROFIL TANAH GAMBUT (0 s.d 150 cm)</span>
            <span className="text-emerald-400 font-bold">TMA Saat ini: -{wtDepthCm.toFixed(0)} cm ({waterTable.toFixed(2)} m)</span>
          </div>

          {/* Soil Layer Stack */}
          <div className="relative h-[220px] w-full rounded overflow-hidden border border-slate-700">
            {/* Surface Vegetation Layer (0-10cm visual) */}
            <div className="h-[12%] bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 border-b border-amber-900/50 relative flex items-center px-3 justify-between">
              <span className="text-[10px] font-bold font-mono text-emerald-200 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Permukaan Lahan & Vegetasi Gambut (0 cm)
              </span>
              <span className="text-[10px] font-mono text-emerald-300">Acrotelm Top</span>
            </div>

            {/* Dry Peat Hazard Zone (Between 0cm and WT depth) */}
            <div 
              className={`transition-all duration-700 relative flex flex-col justify-center px-3 ${
                isCritical 
                  ? 'bg-gradient-to-b from-amber-950/90 via-orange-950/80 to-red-950/90 border-b-2 border-red-500' 
                  : 'bg-amber-900/60 border-b-2 border-emerald-400'
              }`}
              style={{ height: `${Math.max(15, wtVisualPercent - 12)}%` }}
            >
              {/* Smoldering Risk Warning Text inside dry layer */}
              {isCritical && (
                <div className="flex items-center justify-between text-[11px] font-mono text-red-300 font-bold z-10">
                  <span className="flex items-center gap-1.5 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/80">
                    <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    ZONA GAMBUT KERING RENTANG ANGIN (RAWAN SMOLDERING FIRE)
                  </span>
                  <span className="text-[10px] text-amber-200">Tebal Lapisan Kering: {wtDepthCm.toFixed(0)} cm</span>
                </div>
              )}
            </div>

            {/* Saturated Water Table Layer (Below WT depth) */}
            <div 
              className="bg-gradient-to-b from-teal-900/90 via-cyan-950/90 to-slate-950 relative flex items-start p-3"
              style={{ height: `${100 - wtVisualPercent}%` }}
            >
              <div className="flex items-center justify-between w-full text-[10px] font-mono text-cyan-300 font-bold">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  ZONA GAMBUT JENUH AIR (CATOTELM SATURATED LAYER)
                </span>
                <span>Air Tanah Stabil</span>
              </div>
            </div>

            {/* Dynamic Water Table Line Indicator */}
            <div 
              className="absolute left-0 right-0 z-20 flex items-center justify-between px-3 transition-all duration-700 pointer-events-none"
              style={{ top: `calc(${wtVisualPercent}% - 10px)` }}
            >
              <div className="h-0.5 w-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] flex items-center justify-between">
                <span className="bg-cyan-500 text-slate-950 font-mono font-extrabold text-[10px] px-2 py-0.5 rounded-r shadow-md">
                  MUKA AIR TANAH (TMA): -{wtDepthCm.toFixed(0)} cm
                </span>
                <span className="bg-slate-900 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/50">
                  {waterTable.toFixed(2)} m
                </span>
              </div>
            </div>

            {/* PP 71/2014 Kritis Threshold Line at -40cm */}
            <div 
              className="absolute left-0 right-0 z-10 border-t border-dashed border-red-400/70 flex items-center justify-end px-3 pointer-events-none"
              style={{ top: '35%' }}
            >
              <span className="text-[9px] font-mono text-red-300 bg-red-950/90 px-1.5 py-0.2 rounded border border-red-800">
                Batas Maks Kritis PP 71/2014 (-40 cm)
              </span>
            </div>
          </div>
        </div>

        {/* Informational Diagnostics & Realworld Context */}
        <div className="lg:col-span-5 space-y-3 font-mono text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Analisis Risiko Kerusakan Gambut
            </span>
            <div className="text-sm font-bold text-slate-900 mb-1">
              {isCritical ? 'Terjadi Sub-Surface Drying (Pengeringan Dalam)' : 'Kondisi Kebasahan Lahan Normal'}
            </div>
            <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
              {isCritical
                ? `Muka air tanah berada pada kedalaman ${wtDepthCm.toFixed(0)} cm. Udara terperangkap dalam pori gambut, menyebabkan oksigenasi bahan organik yang memicu api bawah permukaan (smoldering) sulit dipadamkan jika terjadi titik api.`
                : 'Muka air tanah terjaga di atas batas kritis -40 cm. Lapisan gambut aman dari risiko kebakaran bawah permukaan.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Kelembaban Gambut</span>
              <span className="text-base font-bold text-slate-900 flex items-center gap-1">
                <Thermometer className="w-4 h-4 text-amber-600" />
                {soilMoisture.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-500">{soilMoisture < 45 ? 'Kering Kritis' : 'Cukup Lembab'}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Status Regulasi</span>
              <span className={`text-xs font-bold block mt-1 ${isCritical ? 'text-red-700 font-bold' : 'text-emerald-700'}`}>
                {isCritical ? 'MEMERLUKAN REWETTING' : 'MEMENUHI PP 71/2014'}
              </span>
              <span className="text-[9px] text-slate-500">Standar BRGM RI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
