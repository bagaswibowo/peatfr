// Shared PFVI (Peat Fire Vulnerability Index) helpers — one source of truth
// for status thresholds, labels, and lay explanation. Status comes from the
// pipeline; everything derivable from it lives here.

export type StatusKey = 'low' | 'moderate' | 'high' | 'extreme' | 'unknown';

export const statusKey = (status: string | undefined | null): StatusKey => {
  const s = (status || '').toLowerCase();
  if (s === 'low' || s === 'moderate' || s === 'high' || s === 'extreme') return s;
  return 'unknown';
};

export const STATUS_ID: Record<StatusKey, string> = {
  low: 'Rendah',
  moderate: 'Sedang',
  high: 'Tinggi',
  extreme: 'Ekstrem',
  unknown: 'Tidak diketahui'
};

// PFVI thresholds used across the app (chart bands use the same numbers).
export const STATUS_MIN: Record<Exclude<StatusKey, 'unknown'>, number> = {
  low: 0,
  moderate: 75,
  high: 150,
  extreme: 225
};
export const STATUS_ORDER: Exclude<StatusKey, 'unknown'>[] = ['low', 'moderate', 'high', 'extreme'];

export const TREND_THRESHOLD = 10; // PFVI points over the forecast horizon

export function trendInfo(min: number, max: number): { label: string; tone: 'naik' | 'turun' | 'stabil' } {
  const delta = max - min;
  if (delta > TREND_THRESHOLD) return { label: 'cenderung NAIK', tone: 'naik' };
  if (delta < -TREND_THRESHOLD) return { label: 'cenderung TURUN', tone: 'turun' };
  return { label: 'cenderung stabil', tone: 'stabil' };
}

// PP 71/2014 critical water-table depth (40 cm below surface).
export const WT_CRITICAL_CM = 40;

// One short paragraph of plain Indonesian: what's happening + what to do.
export function layStatusParagraph(opts: {
  status: StatusKey;
  wtCm: number;
  sm: number;
  locationName?: string;
  trendLabel?: string;
}): string {
  const { status, wtCm, sm, locationName, trendLabel } = opts;
  const loc = locationName ? ` di ${locationName}` : '';
  const wtDry = wtCm > WT_CRITICAL_CM;
  const wtTxt = `Air tanah gambut sekarang sedalam ${wtCm.toFixed(0)} cm di bawah permukaan${
    wtDry ? ' — sudah melewati batas aman 40 cm (aturan PP 71/2014)' : ' — masih di atas batas aman 40 cm'
  }`;
  const smTxt = sm <= 0
    ? ''
    : sm < 45
      ? ', dan tanahnya sudah kering'
      : ', tanah masih cukup lembap';
  const trendTxt = trendLabel ? ` Kondisi ${trendLabel.toLowerCase().replace('cenderung ', 'cenderung ')} dalam beberapa hari ke depan.` : '';

  switch (status) {
    case 'extreme':
      return `${wtTxt}${smTxt}. Gambut yang mengering bisa terbakar di bawah permukaan dan menghasilkan asap tebal yang sulit dipadamkan. Yang bisa dilakukan warga: jangan membakar sampah atau membuka lahan sama sekali, tutup sekat kanal agar air tertahan, dan segera laporkan asap atau titik api apa pun ke ketua RT/RW atau Manggala Agni terdekat.${trendTxt}`;
    case 'high':
      return `${wtTxt}${smTxt}. Risiko kebakaran tinggi: gambut kering dapat menyala meski tanpa api besar di permukaan. Kurangi membuka lahan, jangan membakar apa pun, dan bantu jaga pintu sekat kanal tetap tertutup agar lahan tetap basah.${trendTxt}`;
    case 'moderate':
      return `${wtTxt}${smTxt}. Risiko sedang — tetap waspada, terutama saat cuaca panas berkepanjangan. Hindari pembakaran lahan dan laporkan jika melihat asap di area gambut${loc}.${trendTxt}`;
    case 'low':
      return `${wtTxt}${smTxt}. Risiko kebakaran saat ini rendah, tetapi kebiasaan baik tetap perlu: tidak membakar lahan dan menjaga kanal tetap berair.${trendTxt}`;
    default:
      return 'Status belum dapat ditentukan untuk lokasi ini.';
  }
}

// Badge labels for the four signal cards — computed from the actual value
// instead of hardcoded, so a critical reading never shows "Normal".
export function signalBadge(variable: 'WT' | 'SM' | 'Rf' | 'Temp', value: number): { label: string; tone: 'ok' | 'warn' | 'danger' } {
  switch (variable) {
    case 'WT': {
      const cm = Math.abs(value) * 100;
      if (cm > 80) return { label: 'Sangat kritis', tone: 'danger' };
      if (cm > WT_CRITICAL_CM) return { label: 'Melewati batas aman', tone: 'danger' };
      return { label: 'Aman', tone: 'ok' };
    }
    case 'SM':
      if (value < 30) return { label: 'Kering kritis', tone: 'danger' };
      if (value < 45) return { label: 'Kering', tone: 'warn' };
      return { label: 'Lembap', tone: 'ok' };
    case 'Rf':
      if (value < 1) return { label: 'Kering', tone: 'warn' };
      if (value <= 10) return { label: 'Hujan ringan', tone: 'ok' };
      return { label: 'Hujan deras', tone: 'ok' };
    case 'Temp':
      if (value >= 34) return { label: 'Sangat panas', tone: 'danger' };
      if (value >= 31) return { label: 'Panas', tone: 'warn' };
      return { label: 'Normal', tone: 'ok' };
  }
}

export function badgeToneClass(tone: 'ok' | 'warn' | 'danger'): string {
  switch (tone) {
    case 'danger': return 'bg-[#ff4d4d1f] text-[var(--danger)]';
    case 'warn': return 'bg-[#f0b23e1f] text-[var(--warn)]';
    default: return 'bg-[#3fc98a1f] text-[var(--ok)]';
  }
}
