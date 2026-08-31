import React from 'react';
import { Flame, BookOpen, Sun, Moon, Database } from 'lucide-react';

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
  model: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPaperModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedProvince,
  selectedRegency,
  model,
  theme,
  onToggleTheme,
  onOpenPaperModal
}) => {
  const modelName = model === 'arima' ? 'ARIMA + Box-Cox' : model === 'lstm' ? 'LSTM PyTorch' : 'GRU PyTorch';
  const locationName = selectedRegency
    ? `${selectedRegency.name}, ${selectedProvince?.name || 'Indonesia'}`
    : 'Kab. Siak, Riau';
  const coords = selectedRegency
    ? `${selectedRegency.lat.toFixed(3)}, ${selectedRegency.lon.toFixed(3)}`
    : '0.820, 102.050';

  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-7 flex items-center justify-between h-[60px] gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] rounded-[var(--r-sm)] bg-[var(--accent)] flex items-center justify-center text-[#0a0c0a] flex-shrink-0 shadow-xs">
            <Flame className="w-[17px] h-[17px] stroke-[#0a0c0a] stroke-[2.2]" />
          </div>
          <div className="flex flex-col leading-tight">
            <b className="font-bold text-[15px] tracking-tight text-[var(--text)]">PeatFR</b>
            <span className="text-[11px] text-[var(--text-dim)]">Fire Intelligence &amp; EWS / lahan gambut tropis</span>
          </div>
        </div>

        {/* Topbar Mid Stats (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-mono">Wilayah</span>
            <span className="text-[12.5px] text-[var(--text)] font-medium">{locationName}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-mono">Koordinat</span>
            <span className="text-[12.5px] font-mono text-[var(--text)]">{coords}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-mono">Model AI</span>
            <span className="text-[12.5px] font-mono text-[var(--ok)] font-medium">{modelName}</span>
          </div>
        </div>

        {/* Topbar Right Controls */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenPaperModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] rounded-full text-[11px] font-mono text-[var(--text-mute)] hover:border-[var(--accent-line)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Spesifikasi Jurnal</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] rounded-full text-[11px] font-mono text-[var(--text-mute)] hover:border-[var(--accent-line)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Ganti mode terang/gelap"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Mode terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Mode gelap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
