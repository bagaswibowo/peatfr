import React from 'react';
import { Info } from 'lucide-react';
import { statusKey, STATUS_ID, WT_CRITICAL_CM, layStatusParagraph } from '../utils/pfviStatus';

interface HeroStatusProps {
  hasData?: boolean;
  status: string;
  waterTable: number;
  soilMoisture: number;
  locationName: string;
}

export const HeroStatus: React.FC<HeroStatusProps> = ({
  hasData = true,
  status,
  waterTable,
  soilMoisture,
  locationName
}) => {
  const key = statusKey(status);
  const wtCm = Math.abs(waterTable) * 100;
  const paragraph = layStatusParagraph({ status: key, wtCm, sm: soilMoisture, locationName });

  if (!hasData) {
    return (
      <section className="hero border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[12px] font-bold uppercase tracking-wide bg-[var(--line)] text-[var(--text-mute)]">
          <Info className="w-3.5 h-3.5" /> Data belum tersedia
        </span>
        <h1 className="font-disp text-lg font-bold tracking-tight text-[var(--text)] max-w-[46ch] leading-snug">
          Kondisi gambut untuk lokasi ini belum bisa dihitung
        </h1>
        <p className="text-sm text-[var(--text-mute)] max-w-[60ch] leading-relaxed">
          Pilih wilayah dari menu di atas, lalu tunggu data satelit ditarik.
          PeatFR tidak menampilkan angka perkiraan — hanya data sungguhan.
        </p>
      </section>
    );
  }

  return (
    <section className="hero border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col gap-6">
        {/* Plain-language headline */}
        <div className="flex flex-col gap-3 max-w-[75ch]">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] text-[var(--text-mute)] flex items-center gap-1.5">
              Kondisi gambut di <b className="text-[var(--text)]">{locationName}</b>
            </span>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-[12.5px] font-bold uppercase tracking-wide text-[#0a0c0a]"
              style={{
                background:
                  key === 'extreme' ? 'var(--danger)'
                  : key === 'high' ? 'var(--high)'
                  : key === 'moderate' ? 'var(--warn)'
                  : 'var(--ok)'
              }}
            >
              Risiko {STATUS_ID[key]}
            </span>
          </div>

          <p className="text-[15.5px] sm:text-[17px] leading-relaxed text-[var(--text)]">
            {paragraph}
          </p>
        </div>
      </div>
    </section>
  );
};
