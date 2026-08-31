import React from 'react';
import { Flame, BookOpen, Radio } from 'lucide-react';

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
    <header className="border-b border-slate-200 bg-white px-4 lg:px-8 py-3.5 mb-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">PeatFR</span>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Fire Intelligence System & EWS</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Sistem Peringatan Dini Kebakaran Lahan Gambut Tropis Indonesia (Mahdiyasa et al., 2025)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onOpenPaperModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors shadow-xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Spesifikasi Teoretis & Jurnal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
