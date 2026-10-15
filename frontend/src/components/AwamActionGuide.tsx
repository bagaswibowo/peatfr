import React from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, FileText, Printer, Droplets, Users, Flame } from 'lucide-react';

interface AwamActionGuideProps {
  status: string;
  pfvi: number;
  waterTable: number;
  soilMoisture: number;
  rainfall: number;
  locationName: string;
}

export const AwamActionGuide: React.FC<AwamActionGuideProps> = ({
  status,
  pfvi,
  waterTable,
  soilMoisture,
  rainfall,
  locationName
}) => {
  const wtCm = Math.abs(waterTable) * 100;
  const isDanger = pfvi >= 150 || wtCm > 40;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${
            isDanger ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              PANDUAN LAPANGAN & REKOMENDASI AKSI MITIGASI (MODE AWAM)
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Ringkasan Status Kebencanaan & Aksi Pencegahan Kebakaran Gambut
            </h3>
          </div>
        </div>

        <button
          onClick={handlePrintReport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-mono text-xs font-bold transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Cetak Ringkasan Status Warning (PDF)</span>
        </button>
      </div>

      {/* Main Status Explanation Card */}
      <div className={`p-4 rounded-xl border mb-5 ${
        status.toLowerCase() === 'extreme' || pfvi >= 225
          ? 'bg-red-50 border-red-200 text-red-950'
          : status.toLowerCase() === 'high' || pfvi >= 150
          ? 'bg-orange-50 border-orange-200 text-orange-950'
          : status.toLowerCase() === 'moderate'
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center justify-between font-mono text-xs mb-2">
          <span className="font-bold uppercase tracking-wider">Lokasi Pengawasan: {locationName}</span>
          <span className="px-2.5 py-0.5 rounded font-bold border bg-white shadow-xs">
            STATUS LAPANGAN: {status.toUpperCase()}
          </span>
        </div>
        
        <p className="text-sm font-medium leading-relaxed mb-3">
          {wtCm > 40 ? (
            <>
              <strong>PERINGATAN KRITIS:</strong> Air tanah di lokasi ini telah turun hingga <strong>-{wtCm.toFixed(0)} cm</strong> (melebihi batas aman PP 71/2014 yaitu -40 cm). Lapisan gambut atas dalam kondisi kering kerontang dan sangat rentan memicu kebakaran api bawah permukaan (smoldering) yang menghasilkan asap tebal.
            </>
          ) : (
            <>
              <strong>KONDISI STABIL:</strong> Tinggi muka air tanah terjaga pada <strong>-{wtCm.toFixed(0)} cm</strong>. Gambut dalam keadaan cukup basah dan risiko kebakaran bawah permukaan relatif terkendali.
            </>
          )}
        </p>

        {/* Simple Plain-Indonesian Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 font-mono text-xs">
          <div className="bg-white/80 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Ketinggian Air Gambut</span>
            <span className="font-bold text-slate-900 text-sm">-{wtCm.toFixed(0)} cm</span>
            <span className={`text-[10px] block mt-0.5 font-semibold ${wtCm > 40 ? 'text-red-600' : 'text-emerald-600'}`}>
              {wtCm > 40 ? '⚠️ Terlalu Kering (>40cm)' : '✓ Aman (≤40cm)'}
            </span>
          </div>

          <div className="bg-white/80 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Kelembaban Lahan</span>
            <span className="font-bold text-slate-900 text-sm">{soilMoisture.toFixed(1)}%</span>
            <span className={`text-[10px] block mt-0.5 font-semibold ${soilMoisture < 45 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {soilMoisture < 45 ? '⚠️ Tanah Kering' : '✓ Lembab'}
            </span>
          </div>

          <div className="bg-white/80 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Hujan Efektif 24 Jam</span>
            <span className="font-bold text-slate-900 text-sm">{rainfall.toFixed(1)} mm</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {rainfall === 0 ? 'Tanpa Hujan' : 'Tercurah Hujan'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Concrete Action Step Cards for BPBD / Field Workers */}
      <div>
        <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          LANGKAH TANGGAP SEGERA MITIGASI LAPANGAN (STANDAR BRGM & MANGGALA AGNI)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
          {/* Action 1 */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-cyan-700 font-mono font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center text-[10px]">1</span>
              <span>Penyekatan & Pengisian Pintu Sekat Kanal</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Segera instruksikan tim sekat kanal lokal untuk menutup pintu air sekat kanal terdekat guna menahan peluasan air dan meningkatkan muka air tanah ke batas aman -40cm.
            </p>
          </div>

          {/* Action 2 */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-mono font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px]">2</span>
              <span>Patroli Siaga Manggala Agni & MPA</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Tingkatkan frekuensi patroli darat Masyarakat Peduli Api (MPA) di zona rawan. Pastikan tidak ada aktivitas pembukaan lahan (land clearing) dengan membakar.
            </p>
          </div>

          {/* Action 3 */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-mono font-bold">
              <span className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-[10px]">3</span>
              <span>Persiapan Operasi Rewetting / Basah Lahan</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Siapkan sumur bor gambut dan alokasi pompa air portable untuk melakukan penyiraman permukaan gambut yang mengering di titik hotspot terdeteksi satelit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
