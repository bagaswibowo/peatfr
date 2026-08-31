import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, RefreshCw, BookOpen } from 'lucide-react';

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
  selectedProvince: Province | null;
  selectedRegency: Regency | null;
  onSelectRegion: (prov: Province, reg: Regency) => void;
  onLoadRealtimeData: () => void;
  onOpenPaperModal: () => void;
  loadingRealtime: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedProvince,
  selectedRegency,
  onSelectRegion,
  onLoadRealtimeData,
  onOpenPaperModal,
  loadingRealtime
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    axios.get('/api/v1/indonesia/regions')
      .then((res) => {
        if (res.data && res.data.provinces) {
          setProvinces(res.data.provinces);
        }
      })
      .catch((err) => console.warn('Could not fetch Indonesia regions:', err));
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white px-4 lg:px-8 py-3.5 mb-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">PeatFR</span>
                <span className="text-slate-400">/</span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Fire Intelligence Light
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Peringatan Dini Kebakaran Lahan Gambut Indonesia (Mahdiyasa et al., 2025)
              </p>
            </div>
          </div>
        </div>

        {/* Location Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Province Selector */}
          <select
            value={selectedProvince?.id || ''}
            onChange={(e) => {
              const foundProv = provinces.find((p) => p.id === e.target.value);
              if (foundProv && foundProv.regencies.length > 0) {
                onSelectRegion(foundProv, foundProv.regencies[0]);
              }
            }}
            className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            {provinces.map((prov) => (
              <option key={prov.id} value={prov.id} className="bg-white text-slate-900">
                {prov.name}
              </option>
            ))}
          </select>

          {/* Regency Selector */}
          <select
            value={selectedRegency?.id || ''}
            onChange={(e) => {
              if (selectedProvince) {
                const foundReg = selectedProvince.regencies.find((r) => r.id === e.target.value);
                if (foundReg) onSelectRegion(selectedProvince, foundReg);
              }
            }}
            className="bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            {selectedProvince?.regencies.map((reg) => (
              <option key={reg.id} value={reg.id} className="bg-white text-slate-900">
                {reg.name} {reg.peat ? '(Gambut)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={onLoadRealtimeData}
            disabled={loadingRealtime}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRealtime ? 'animate-spin' : ''}`} />
            <span>Satelit Realtime</span>
          </button>

          <button
            onClick={onOpenPaperModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Spesifikasi Teoretis</span>
          </button>
        </div>
      </div>
    </header>
  );
};
