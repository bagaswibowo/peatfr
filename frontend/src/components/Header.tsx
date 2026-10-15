import React from 'react';
import { Flame, BookOpen, Sun, Moon, RefreshCw, MapPin } from 'lucide-react';

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
  provinces: Province[];
  selectedProvince: Province | null;
  selectedRegency: Regency | null;
  model: string;
  theme: 'dark' | 'light';
  loadingRealtime: boolean;
  onSelectRegion: (prov: Province, reg: Regency) => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  onOpenPaperModal: () => void;
}

export function getRegionNameFromCoords(lat: number, lon: number): string {
  if (lon >= 95 && lon < 109) return 'Sumatra';
  if (lon >= 108 && lon < 119) return 'Kalimantan';
  if (lon >= 118 && lon < 125) return 'Sulawesi';
  if (lon >= 125 && lon < 142) return 'Papua';
  if (lon >= 105 && lon < 116 && lat < -5) return 'Jawa';
  return 'Indonesia';
}

export const Header: React.FC<HeaderProps> = ({
  provinces,
  selectedProvince,
  selectedRegency,
  model,
  theme,
  loadingRealtime,
  onSelectRegion,
  onRefresh,
  onToggleTheme,
  onOpenPaperModal
}) => {
  const modelName = model === 'arima' ? 'ARIMA + Box-Cox' : model === 'lstm' ? 'LSTM PyTorch' : 'GRU PyTorch';

  const isCustomLocation = selectedRegency ? selectedRegency.id.startsWith('CUSTOM-') : false;

  // Region selection is global state, so it lives in the top bar and is reachable
  // from every tab instead of sitting inside the algorithm panel.
  const allRegencies: { prov: Province; reg: Regency }[] = [];
  provinces.forEach((prov) => {
    (prov.regencies || []).forEach((reg) => allRegencies.push({ prov, reg }));
  });

  const coords = selectedRegency
    ? `${selectedRegency.lat.toFixed(3)}, ${selectedRegency.lon.toFixed(3)}`
    : '-';

  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-7 flex items-center justify-between h-[60px] gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-[30px] h-[30px] rounded-[var(--r-sm)] bg-[var(--accent)] flex items-center justify-center text-[#0a0c0a] flex-shrink-0">
            <Flame className="w-[17px] h-[17px] stroke-[#0a0c0a] stroke-[2.2]" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <b className="font-bold text-[15px] tracking-tight text-[var(--text)]">PeatFR</b>
            <span className="text-[11px] text-[var(--text-dim)]">EWS kebakaran gambut</span>
          </div>
        </div>

        {/* Region Selector (primary control, visible on every tab) */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[420px]">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <select
            value={isCustomLocation ? 'CUSTOM' : (selectedRegency?.id || '')}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId === 'CUSTOM') return;
              const found = allRegencies.find((item) => item.reg.id === selectedId);
              if (found) onSelectRegion(found.prov, found.reg);
            }}
            aria-label="Pilih wilayah target pemantauan"
            className="w-full min-w-0 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {isCustomLocation && <option value="CUSTOM">{selectedRegency?.name}</option>}
            {allRegencies.map(({ prov, reg }) => (
              <option key={reg.id} value={reg.id}>
                {prov.name} / {reg.name}{reg.peat ? ' (Gambut)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingRealtime}
            title="Tarik ulang telemetri satelit"
            aria-label="Tarik ulang telemetri satelit"
            className="shrink-0 p-1.5 border border-[var(--line)] rounded-[var(--r-sm)] text-[var(--text-mute)] hover:border-[var(--accent-line)] hover:text-[var(--accent)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRealtime ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Secondary telemetry readout */}
        <div className="hidden xl:flex items-center gap-5 text-xs shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-mono">Koordinat</span>
            <span className="text-[12px] font-mono text-[var(--text)]">{coords}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)] font-mono">Model AI</span>
            <span className="text-[12px] font-mono text-[var(--ok)] font-medium">{modelName}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPaperModal}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] rounded-full text-[11px] font-mono text-[var(--text-mute)] hover:border-[var(--accent-line)] hover:text-[var(--text)] transition-colors cursor-pointer"
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
                <span className="hidden sm:inline">Mode terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Mode gelap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
