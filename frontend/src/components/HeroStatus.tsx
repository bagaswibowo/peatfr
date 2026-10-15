import React, { useState } from 'react';
import { Printer, Info, Droplets, Flame } from 'lucide-react';
import { statusKey, StatusKey, STATUS_ID, STATUS_MIN, STATUS_ORDER, trendInfo, WT_CRITICAL_CM, layStatusParagraph } from '../utils/pfviStatus';

interface HeroStatusProps {
  hasData?: boolean;
  pfvi: number;
  status: string;
  waterTable: number;
  soilMoisture: number;
  forecastDays: number;
  minPfvi?: number;
  maxPfvi?: number;
  locationName: string;
  nearby?: {
    status?: string;
    detection_count?: number;
    nearest_distance_km?: number | null;
  };
}

// Status scale bar: one thick segmented strip with PFVI thresholds (0/75/150/225)
// and a needle at the current value — the signature element of the hero.
const StatusScale: React.FC<{ pfvi: number; status: StatusKey }> = ({ pfvi, status }) => {
  const pct = Math.min(100, Math.max(0, (pfvi / 300) * 100));
  return (
    <div className="w-full">
      <div className="relative h-3.5 rounded-full overflow-hidden flex border border-[var(--line)]">
        <div className="h-full bg-[var(--ok)]" style={{ width: '25%' }} />
        <div className="h-full bg-[var(--warn)]" style={{ width: '25%' }} />
        <div className="h-full bg-[var(--high)]" style={{ width: '25%' }} />
        <div className="h-full bg-[var(--danger)]" style={{ width: '25%' }} />
      </div>
      {/* Needle */}
      <div className="relative h-0">
        <div
          className="absolute -top-[15px] w-[3px] h-[19px] bg-[var(--text)] rounded-sm shadow transition-all duration-700"
          style={{ left: `calc(${pct}% - 1.5px)` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between font-mono text-[10.5px] text-[var(--text-dim)] mt-1.5">
        <span>0</span>
        <span>75</span>
        <span>150</span>
        <span>225</span>
        <span>300</span>
      </div>
      <div className="flex justify-between text-[10.5px] font-semibold mt-0.5">
        {STATUS_ORDER.map((k) => (
          <span
            key={k}
            className={k === status ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}
            style={{ width: '25%', textAlign: k === 'low' ? 'left' : k === 'extreme' ? 'right' : 'center' }}
          >
            {STATUS_ID[k]}
          </span>
        ))}
      </div>
    </div>
  );
};

export const HeroStatus: React.FC<HeroStatusProps> = ({
  hasData = true,
  pfvi,
  status,
  waterTable,
  soilMoisture,
  forecastDays,
  minPfvi = 0,
  maxPfvi = 0,
  locationName,
  nearby
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const key = statusKey(status);
  const wtCm = Math.abs(waterTable) * 100;
  const trend = trendInfo(minPfvi, maxPfvi);
  const paragraph = layStatusParagraph({
    status: key,
    wtCm,
    sm: soilMoisture,
    locationName,
    trendLabel: trend.label
  });

  const nearestDist = nearby?.nearest_distance_km ?? null;
  const hotspotTxt = nearby?.status === 'error'
    ? 'Sumber tidak terbaca'
    : nearestDist !== null
      ? (nearestDist <= 25 ? `⚠ ${nearestDist} km dari sini` : `${nearestDist} km dari sini`)
      : nearby?.status === 'no_detections'
        ? 'Tidak ada dalam radius 25 km'
        : 'Tidak tersedia';
  const hotspotDanger = nearestDist !== null && nearestDist <= 25;

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

        {/* Signature: status scale with needle */}
        <StatusScale pfvi={pfvi} status={key} />

        {/* Two quick facts */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13.5px]">
          <span className="flex items-center gap-1.5 text-[var(--text-mute)]">
            <Droplets className="w-4 h-4 text-[var(--ok)]" />
            Kedalaman air tanah: <b className="text-[var(--text)] num">{wtCm.toFixed(0)} cm</b>
            {wtCm > WT_CRITICAL_CM && <b className="text-[var(--danger)]">(terlalu kering)</b>}
          </span>
          <span className="flex items-center gap-1.5 text-[var(--text-mute)]">
            <Flame className={`w-4 h-4 ${hotspotDanger ? 'text-[var(--danger)]' : 'text-[var(--text-dim)]'}`} />
            Titik api terdekat: <b className={hotspotDanger ? 'text-[var(--danger)]' : 'text-[var(--text)]'}>{hotspotTxt}</b>
          </span>
        </div>

        {/* Technical detail, hidden behind a toggle */}
        <div className="border-t border-[var(--line-soft)] pt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowDetail(!showDetail)}
            aria-expanded={showDetail}
            className="self-start font-mono text-[12px] text-[var(--text-mute)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            {showDetail ? '▾ Tutup detail teknis' : '▸ Lihat detail teknis (angka PFVI & proyeksi)'}
          </button>
          {showDetail && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 font-mono text-[12.5px]">
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">Skor PFVI</dt>
                <dd className="num font-bold text-[var(--text)] text-base">{pfvi.toFixed(1)} <span className="text-[10.5px] font-normal text-[var(--text-dim)]">/ 300</span></dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">Proyeksi {forecastDays} hari</dt>
                <dd className="num font-bold text-[var(--text)] text-base">{minPfvi.toFixed(0)}–{maxPfvi.toFixed(0)}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">Muka air tanah</dt>
                <dd className="num font-bold text-[var(--text)] text-base">{waterTable.toFixed(2)} m</dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-wider text-[var(--text-dim)]">Kelembapan tanah</dt>
                <dd className="num font-bold text-[var(--text)] text-base">{soilMoisture.toFixed(1)}%</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </section>
  );
};

// Compact printable summary (kept for field printouts; plain wording).
export const PrintHint: React.FC = () => (
  <button
    type="button"
    onClick={() => window.print()}
    className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-mute)] hover:text-[var(--accent)] cursor-pointer"
  >
    <Printer className="w-3.5 h-3.5" />
    <span>Cetak ringkasan</span>
  </button>
);

export { STATUS_MIN };
