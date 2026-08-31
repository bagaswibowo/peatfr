import React from 'react';
import { Flame, BookOpen, Radio, Shield, Cpu, Activity, Database } from 'lucide-react';

export interface Regency {
  id: string;
  name: string;
  lat: number;
  lon: number;
  peat: boolean;
}

export interface Province {
  id: string;
  name: string;
  lat: number;
  lon: number;
  regencies: Regency[];
}

interface HeaderProps {
  onOpenPaperModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPaperModal }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3 mb-5 sticky top-0 z-[1100]">
      <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-extrabold text-white tracking-tight">PeatFR</span>
                <span className="text-slate-700">|</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>EWS TELEMETRY SYSTEM v2.4</span>
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 font-medium mt-0.5">
                Sistem Peringatan Dini Kebakaran Lahan Gambut Tropis Indonesia (Mahdiyasa et al., 2025)
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Telemetry Telemetry Status Badges & Specs Modal Trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400 border-r border-slate-800 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>ENGINE: <strong className="text-slate-200">SciPy NM Opt</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>SAT: <strong className="text-slate-200">ERA5 / FIRMS</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPaperModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spesifikasi Teoretis Jurnal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
