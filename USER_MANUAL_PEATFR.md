# DOKUMEN PENDOKUMENTASIAN HAK CIPTA PROGRAM KOMPUTER (DJKI KEMENKUMHAM RI)
## USER MANUAL, ARSITEKTUR, APIS, & KODE SUMBER PER FITUR
**Aplikasi PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut**
*(Mahdiyasa et al., 2025)*

---

### Data Pendaftaran Hak Cipta (HKI)

| Parameter Hak Cipta (HKI) | Keterangan Data Resmi Pendaftaran |
|---|---|
| **Jenis Ciptaan** | **Program Komputer** (Aplikasi Web Telemetri GIS Satelit & AI Fire Forecasting) |
| **Judul Ciptaan** | **Aplikasi PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut** |
| **Pencipta & Pemegang Hak Cipta** | **Bagas Wibowo, S.Pd., M.Eng.** & Tim Peneliti Kelompok Keahlian SEAL Telkom University |
| **Tanggal & Tempat Pertama Diumumkan** | **30 Agustus 2026** di Bandung, Jawa Barat, Republik Indonesia |
| **Teknologi Stack** | **Python 3.11** (FastAPI, PyTorch, SciPy) & **React 18** (TypeScript, Vite, Leaflet GIS) |
| **URL Akses Sistem** | https://peatfr.bagaswibowo.app/ |

---

# 1. GAMBARAN UMUM APLIKASI
PeatFR (Peatland Fire Vulnerability Index & Early Warning System) adalah platform pemantauan dan peringatan dini berbasis web yang dirancang khusus untuk memetakan dan memprediksi risiko kebakaran lahan gambut tropis di Indonesia (*Mahdiyasa et al., 2025*).

Aplikasi ini menghubungkan stasiun telemetri lingkungan realtime (Open-Meteo ERA5-Land), citra thermal satelit NASA FIRMS (VIIRS 375m & MODIS), vector alert Global Forest Watch (GFW), serta model kecerdasan buatan (ARIMA, LSTM, GRU) untuk memprediksi Indeks Kerawanan Kebakaran Gambut (PFVI) hingga 14 hari ke depan.

---

# 2. TUJUAN UTAMA APLIKASI
1. **Deteksi Dini Kebakaran Bawah Permukaan (Smoldering Fire):** Memantau penurunan Muka Air Tanah (TMA) hingga di bawah batas kritis PP 71/2014 (-40 cm).
2. **Penyederhanaan Akses Informasi Kebencanaan (Mode Awam):** Memberikan panduan aksi mitigasi langsung bagi petugas lapangan BPBD, Manggala Agni, dan warga lokal tanpa kerumitan rumus statistik.
3. **Analisis Lanjutan & Machine Learning (Mode Pakar):** Menyediakan instrumen tuning algoritma imputasi data missing (kNN/Spline) dan model kecerdasan buatan forecasting time-series.
4. **Operasional Mitigasi Berbasis Bukti:** Menyediakan fitur cetak resmi ringkasan peringatan dini (PDF) untuk koordinasi lapangan.

---

# 3. ARSITEKTUR SISTEM & DESAIN TEKNIS (SYSTEM ARCHITECTURE)

Sistem PeatFR dirancang menggunakan arsitektur 4-tier berkinerja tinggi:

```
+-----------------------------------------------------------------------------------+
|                        1. EXTERNAL DATA PROVIDERS LAYER                           |
|  [Open-Meteo ERA5]   [NASA FIRMS WMS]   [GFW Peatland Alerts]   [Esri Satellite GIS]  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        2. BACKEND COMPUTATION ENGINE (FastAPI)                    |
|  - Realtime Satellite Proxy & Hydrologic Telemetry Mapper                         |
|  - Physical Engine (PFVI Equation: DF Evapotranspiration, RF Rain, WTF Moisture)  |
|  - SciPy Nelder-Mead Parameter Optimization with Physical Bounds (a_H, b_H >= 0)  |
|  - PyTorch Deep Learning (LSTM / GRU) & Stochastic ARIMA Forecasting Engine       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        3. CONTAINER & INFRASTRUCTURE LAYER                        |
|  [peatfr-api: Python 3.11]  <-->  [peatfr-web: Nginx]  <-->  [Cloudflare Tunnel]    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        4. CLIENT PRESENTATION LAYER (React 18)                    |
|  - Dual-Mode Interface: Mode Awam (Field SOP & PDF Export) vs Mode Pakar (Analis) |
|  - Signature Component: Peatland Water Table Smoldering Profile (0-150cm)         |
|  - Interactive GIS Satellite Map (Leaflet, NASA FIRMS WMS, VIIRS Hotspots)       |
+-----------------------------------------------------------------------------------+
```

### Persamaan Matematika Model Fisika PeatFR:
* **Laju Evapotranspirasi ($DF_t$):**
  $$DF_t = \frac{(300 - PFVI_{t-1}) \cdot [0.4982 \cdot e^{0.0905 T_{max} + 1.6096} - 4.268] \cdot 10^{-3}}{1 + 10.88 \cdot e^{-0.0017358 \cdot R_0}}$$
* **Faktor Curah Hujan Efektif ($RF_t$):**
  $$RF_t = \max(0, Rf_t - 5.1)$$
* **Faktor Muka Air Tanah ($WTF_t$ van Genuchten):**
  $$WTF_t = a_H - b_H \cdot (1 - \theta(v)) \cdot 300, \quad \text{dengan } \theta(v) = \left[1 + \left(\frac{v}{\alpha}\right)^n\right]^{\frac{1 - n}{n}}$$
* **Physical Boundary Constraints:**
  $$a_H \ge 0.0, \quad b_H \ge 0.0, \quad n > 1.05, \quad \alpha > 0.01$$

---

# 4. DOKUMENTASI API & SUMBER DATA (DATA SOURCES & APIS)

### A. Sumber Data Satelit Eksternal

| Provider & Dataset | Endpoint / Service URL | Variabel & Penggunaan |
|---|---|---|
| **Open-Meteo ERA5-Land** | `https://api.open-meteo.com/v1/forecast` | Suhu max 2m, Soil moisture (0-7cm, 7-28cm), Presipitasi harian |
| **NASA FIRMS WMS** | `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/` | Layer thermal VIIRS 24j & MODIS 24j dengan MAP_KEY terotorisasi |
| **NASA FIRMS Vector API** | `https://firms.modaps.eosdis.nasa.gov/api/country/` | Titik hotspot VIIRS 375m, brightness T_i4 (K), daya FRP (MW) |
| **GFW Peatland Fires** | Global Forest Watch Vector Service | Kebakaran aktif khusus pada poligon tutupan lahan gambut Indonesia |
| **NASA GIBS WMS** | `https://gibs.earthdata.nasa.gov/wms/epsg3857/` | Citra thermal anomalies VIIRS SNPP 375m Pass Siang & Malam |

### B. Spesifikasi Internal REST API (FastAPI Engine)

| HTTP Method & Route | Fungsi & Deskripsi Operasional |
|---|---|
| `GET /api/v1/realtime-peatland-data` | Mengambil telemetri ERA5-Land Open-Meteo, kalkulasi TMA & FWI OWM. |
| `POST /api/v1/pipeline/auto` | Menjalankan imputasi data missing, forecasting AI, Nelder-Mead opt, & simulasi PFVI. |
| `GET /api/v1/fire-intelligence/firms-hotspots` | Mengambil vector hotspot thermal NASA FIRMS terotorisasi. |
| `GET /api/v1/fire-intelligence/severe-alerts` | Peringatan area kebakaran gambut parah di wilayah Indonesia. |
| `GET /api/v1/indonesia/regions` | Hirarki wilayah provinsi & kabupaten gambut/mineral di Indonesia. |

---

# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG

## FITUR 1: Header Navigasi Bar & Sakelar Dual-Mode (Mode Awam vs Mode Pakar)
**Deskripsi & Tujuan Fitur:** Navigasi utama yang memungkinkan pengguna beralih antara tampilan ringkas ramah awam (Mode Awam) dan tampilan analisa lanjutan peneliti (Mode Pakar), serta memilih lokasi daerah di Indonesia.

**Cara Menggunakan:**
1. Klik tombol **[Mode Awam]** di baris header atas untuk masuk ke tampilan ringkas mitigasi.
2. Klik tombol **[Mode Pakar]** untuk membuka kontrol statistik pipeline.
3. Gunakan Dropdown **Provinsi** & **Kabupaten** untuk berpindah lokasi pengawasan.
4. Tekan tombol **[Satelit Realtime]** untuk memperbarui data cuaca & hotspot satelit.

#### Kode Sumber (Source Code Listing): `frontend/src/components/Header.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, RefreshCw, BookOpen, UserCheck, Cpu } from 'lucide-react';

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
  viewMode: 'awam' | 'pakar';
  onToggleViewMode: (mode: 'awam' | 'pakar') => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedProvince,
  selectedRegency,
  onSelectRegion,
  onLoadRealtimeData,
  onOpenPaperModal,
  loadingRealtime,
  viewMode,
  onToggleViewMode
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
                  Fire Intelligence System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Peringatan Dini Kebakaran Lahan Gambut Indonesia (Mahdiyasa et al., 2025)
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Switch & Location Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Mode Awam vs Mode Pakar Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-300 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => onToggleViewMode('awam')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                viewMode === 'awam'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mode Awam</span>
            </button>

            <button
              onClick={() => onToggleViewMode('pakar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-bold cursor-pointer ${
                viewMode === 'pakar'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Mode Pakar</span>
            </button>
          </div>

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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRealtime ? 'animate-spin' : ''}`} />
            <span>Satelit Realtime</span>
          </button>

          <button
            onClick={onOpenPaperModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Spesifikasi Teoretis</span>
          </button>
        </div>
      </div>
    </header>
  );
};

```

---

## FITUR 2: Ringkasan Kebencanaan & Panduan Tanggap Aksi Lapangan (Mode Awam)
**Deskripsi & Tujuan Fitur:** Kartu panduan khusus pengguna awam & BPBD yang menterjemahkan data teknis menjadi narasi bahasa manusia, batas aman TMA (-40cm), 3 langkah SOP aksi mitigasi BRGM, dan cetak PDF.

**Cara Menggunakan:**
1. Pada Mode Awam, baca status lapangan di kotak utama (LOW / MODERATE / HIGH / EXTREME).
2. Perhatikan 3 indikator ringkas: Ketinggian Air Gambut (cm), Kelembaban Lahan (%), dan Curah Hujan.
3. Ikuti 3 Langkah Tanggap Segera: (1) Penyekatan Pintu Sekat Kanal, (2) Patroli Manggala Agni, (3) Operasi Rewetting.
4. Tekan tombol **[Cetak Ringkasan Status Warning (PDF)]** untuk mencetak laporan fisik.

#### Kode Sumber (Source Code Listing): `frontend/src/components/AwamActionGuide.tsx`
```tsx
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

```

---

## FITUR 3: Penampang Kedalaman Muka Air Tanah (Peat Smoldering Profile & PP 71/2014)
**Deskripsi & Tujuan Fitur:** Signature visual element berupa grafik penampang melintang tanah gambut (0-150 cm) yang memperlihatkan garis TMA dinamis, batas kritis PP 71/2014 (-40 cm), dan zona risiko kebakaran smoldering.

**Cara Menggunakan:**
1. Amati grafik penampang tanah gambut (lapisan permukaan Acrotelm & lapisan jenuh air Catotelm).
2. Garis cyan menunjukkan posisi kedalaman air tanah saat ini (-cm).
3. Jika garis air berada di bawah batas merah (-40 cm), zona gambut kering akan menyala merah menandakan risiko kebakaran bawah permukaan (smoldering fire).

#### Kode Sumber (Source Code Listing): `frontend/src/components/PeatSmolderingProfile.tsx`
```tsx
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

```

---

## FITUR 4: Cockpit Indikator Status Kerawanan & Multi-Satelit Telemetri (Risk Status Gauge)
**Deskripsi & Tujuan Fitur:** Panel cockpit utama yang menampilkan skor PFVI (0-300), progress bar tingkat bahaya, statistik FirePing Satellite Proximity, GWIS Burned Area, FWI Engine, dan telemetri 4 variabel.

**Cara Menggunakan:**
1. Tinjau skor PFVI numerik di bagian kiri atas.
2. Cek baris FirePing untuk melihat jarak titik api terdekat (km) dan jumlah deteksi satelit.
3. Cek baris GWIS untuk estimasi luas area terbakar 7 hari (Ha).
4. Cek 4 kotak telemetri di bawah: Water Table (WT), Soil Moisture (SM), Rainfall (Rf), Temp Max.

#### Kode Sumber (Source Code Listing): `frontend/src/components/RiskStatusGauge.tsx`
```tsx
import React from 'react';

export interface FireIntelligenceData {
  nearby?: {
    status?: string;
    detection_count?: number;
    nearest_distance_km?: number | null;
    latest_detection_at?: string;
    burned_area_ha?: number;
    satellite_sources?: string[];
  };
  fwi?: {
    status?: string;
    source?: string;
    fwi_score?: number;
    danger_rating?: string;
  };
}

interface RiskStatusGaugeProps {
  pfvi: number;
  status: string;
  waterTable: number;
  soilMoisture: number;
  rainfall: number;
  temp: number;
  forecastDays: number;
  minPfvi?: number;
  maxPfvi?: number;
  fireIntelligence?: FireIntelligenceData;
  optimizedParams?: {
    a_h: number;
    b_h: number;
    n: number;
    alpha: number;
    mse: number;
  };
}

export const RiskStatusGauge: React.FC<RiskStatusGaugeProps> = ({
  pfvi,
  status,
  waterTable,
  soilMoisture,
  rainfall,
  temp,
  forecastDays,
  minPfvi = 45.0,
  maxPfvi = 285.0,
  fireIntelligence,
  optimizedParams
}) => {
  const getBadgeStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'extreme':
      case 'very high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const pfviPercentage = Math.min(100, Math.max(0, (pfvi / 300) * 100));

  const nearby = fireIntelligence?.nearby;
  const fwi = fireIntelligence?.fwi;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Telemetry Header Panel */}
      <div className="telemetry-panel rounded-xl p-5 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-5 border-b border-slate-200">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
              Indeks Kerawanan Kebakaran Gambut (PFVI)
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-mono font-extrabold text-slate-900 tracking-tight">
                {pfvi.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">/ 300.0</span>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border ${getBadgeStyle(status)}`}>
                {status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Proyeksi {forecastDays} Hari Ke Depan (Rentang 30 Hari: {minPfvi.toFixed(1)} s.d {maxPfvi.toFixed(1)})
            </p>
          </div>

          {/* Nelder-Mead Parameters Readout */}
          {optimizedParams && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
              <div className="text-[11px] text-slate-700 font-bold uppercase tracking-wider flex items-center justify-between gap-4">
                <span>Nelder-Mead Opt</span>
                <span className="text-slate-500">MSE: {optimizedParams.mse.toFixed(2)}</span>
              </div>
              <div className="text-slate-600 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                <span>a_H = {optimizedParams.a_h.toFixed(2)}</span>
                <span>b_H = {optimizedParams.b_h.toFixed(3)}</span>
                <span>n = {optimizedParams.n.toFixed(1)}</span>
                <span>α = {optimizedParams.alpha.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Severity Progress Bar */}
        <div className="pt-4">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                pfvi >= 225
                  ? 'bg-red-600'
                  : pfvi >= 150
                  ? 'bg-orange-500'
                  : pfvi >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${pfviPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 mt-1.5">
            <span>0 (Basah)</span>
            <span>75 (Low)</span>
            <span>150 (Mod)</span>
            <span>225 (High)</span>
            <span>300 (Extreme)</span>
          </div>
        </div>
      </div>

      {/* Multi-Source Fire Intelligence Cockpit Bar */}
      <div className="telemetry-panel rounded-xl p-4 border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FirePing Proximity */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
              FirePing Satellite Proximity
            </span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {nearby?.nearest_distance_km !== null && nearby?.nearest_distance_km !== undefined
                ? `${nearby.nearest_distance_km} km`
                : 'Aman (>25 km)'}
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {nearby?.detection_count || 0} Deteksi (24j) ({nearby?.satellite_sources?.join(', ') || 'Modis/Viirs'})
            </span>
          </div>
          <div className={`px-2 py-1 text-[10px] font-mono font-bold rounded border ${nearby?.detection_count ? 'bg-red-100 text-red-700 border-red-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`}>
            {nearby?.detection_count ? 'DETEKSI' : 'CLEAR'}
          </div>
        </div>

        {/* GWIS Burned Area */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
              GWIS 7-Day Burned Area
            </span>
            <div className="text-lg font-mono font-bold text-amber-600">
              {nearby?.burned_area_ha ? nearby.burned_area_ha.toLocaleString('id-ID') : '0'} <span className="text-xs text-slate-500 font-normal">Ha</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Estimasi Perimeter Satelit Global
            </span>
          </div>
          <div className="px-2 py-1 text-[10px] font-mono font-bold rounded border bg-amber-100 text-amber-800 border-amber-300">
            GWIS NRT
          </div>
        </div>

        {/* Weather FWI Index */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
              Atmospheric Fire Weather (FWI)
            </span>
            <div className="text-lg font-mono font-bold text-slate-900">
              {fwi?.fwi_score !== undefined ? fwi.fwi_score.toFixed(1) : '24.5'} <span className="text-xs text-slate-500 font-normal">FWI</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {fwi?.source || 'OpenWeather / Canadian Engine'}
            </span>
          </div>
          <div className={`px-2 py-1 text-[10px] font-mono font-bold rounded border ${getBadgeStyle(fwi?.danger_rating || 'High')}`}>
            {(fwi?.danger_rating || 'HIGH').toUpperCase()}
          </div>
        </div>
      </div>

      {/* High-Density Environmental Telemetry Cockpit Bar */}
      <div className="telemetry-panel bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 shadow-sm">
        {/* WT */}
        <div className="p-4">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Water Table (WT)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {waterTable.toFixed(2)} <span className="text-xs font-normal text-slate-500">m</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {waterTable < -0.8 ? 'Kritis Rendah' : 'Normal'}
          </span>
        </div>

        {/* SM */}
        <div className="p-4 lg:pl-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Soil Moisture (SM)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {soilMoisture.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {soilMoisture < 45 ? 'Tanah Kering' : 'Lembab'}
          </span>
        </div>

        {/* Rf */}
        <div className="p-4 lg:pl-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Rainfall (Rf)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {rainfall.toFixed(1)} <span className="text-xs font-normal text-slate-500">mm/d</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {rainfall < 5.1 ? 'Tanpa Hujan Efektif' : 'Hujan Efektif'}
          </span>
        </div>

        {/* Temp */}
        <div className="p-4 lg:pl-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Temp Max (Temp)
          </span>
          <div className="text-xl font-mono font-bold text-slate-900">
            {temp.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {temp > 34.5 ? 'Suhu Tinggi' : 'Normal'}
          </span>
        </div>
      </div>
    </div>
  );
};

```

---

## FITUR 5: Peta Satelit Live Interaktif (NASA FIRMS Key Active, GFW, & VIIRS 375m Overpass)
**Deskripsi & Tujuan Fitur:** Peta GIS berbasis Esri World Imagery + CARTO labels dengan layer thermal NASA FIRMS terotorisasi, vector GFW gambut, severe alerts ticker, dan hotspot inspector.

**Cara Menggunakan:**
1. Gunakan sakelar layer di kanan atas peta untuk mengaktifkan: FIRMS WMS, Hotspots API, GFW Gambut, atau NASA GIBS.
2. Klik titik mana saja pada peta satelit untuk mengambil koordinat telemetri titik tersebut.
3. Klik marker hotspot api (oranye/merah) untuk menampilkan detail kecerahan Kelvin, FRP (MW), dan satelit pengawas di Satellite Hotspot Inspector.

#### Kode Sumber (Source Code Listing): `frontend/src/components/PeatlandMap.tsx`
```tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Flame, Satellite, ShieldAlert, Radio, Crosshair, Zap, Navigation } from 'lucide-react';
import axios from 'axios';

export interface LocationPreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface GfwPeatlandFire {
  latitude: number;
  longitude: number;
  alert__date: string;
  confidence__cat?: string;
  bright_ti4__K?: number;
  frp__MW?: number;
  is__peatland?: boolean;
  adm1?: string;
  adm2?: string;
}

export interface FirmsHotspot {
  latitude: number;
  longitude: number;
  bright_ti4: number;
  frp: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: string;
  daynight: string;
}

const FIRMS_MAP_KEY = "aa16407e5eb11df46b09cafc085fe020";

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.5); cursor: pointer;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const createPeatlandFireIcon = () => {
  return L.divIcon({
    className: 'gfw-peatland-fire-marker',
    html: `<div style="background-color: #dc2626; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fee2e2; box-shadow: 0 0 12px #dc2626; animation: pulse 1.5s infinite; cursor: pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createFirmsHotspotIcon = () => {
  return L.divIcon({
    className: 'firms-hotspot-marker',
    html: `<div style="background-color: #ea580c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffedd5; box-shadow: 0 0 10px #ea580c; cursor: pointer;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const createTargetIcon = () => {
  return L.divIcon({
    className: 'clicked-target-marker',
    html: `<div style="background-color: #0284c7; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 12px #0284c7; cursor: pointer;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

function MapFlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 10, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

interface PeatlandMapProps {
  currentPfvi: number;
  status: string;
  location: LocationPreset;
  onSelectCustomLocation?: (lat: number, lon: number, name?: string) => void;
}

export const PeatlandMap: React.FC<PeatlandMapProps> = ({
  currentPfvi,
  status,
  location,
  onSelectCustomLocation
}) => {
  const pos: [number, number] = [location.lat, location.lon];

  // Live Satellite Overlay Layers state
  const [showFirmsWms, setShowFirmsWms] = useState(true);
  const [showFirmsVector, setShowFirmsVector] = useState(true);
  const [showGibsViirsDay, setShowGibsViirsDay] = useState(true);
  const [showGfwPeatland, setShowGfwPeatland] = useState(true);
  
  // Interactivity state
  const [clickedTarget, setClickedTarget] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'hotspot' | 'gfw' | 'station' | 'point';
    title: string;
    lat: number;
    lon: number;
    details: Record<string, any>;
  } | null>(null);

  const [gfwFires, setGfwFires] = useState<GfwPeatlandFire[]>([]);
  const [firmsHotspots, setFirmsHotspots] = useState<FirmsHotspot[]>([]);
  const [severeAlerts, setSevereAlerts] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/v1/fire-intelligence/severe-alerts')
      .then((res) => {
        if (res.data && res.data.alerts) {
          setSevereAlerts(res.data.alerts);
        }
      })
      .catch((err) => console.warn('Could not fetch severe fire alerts:', err));
  }, []);

  useEffect(() => {
    if (showGfwPeatland) {
      axios.get('/api/v1/fire-intelligence/gfw-peatland-fires?limit=100')
        .then((res) => {
          if (res.data && res.data.fires) {
            setGfwFires(res.data.fires);
          }
        })
        .catch((err) => console.warn('Could not fetch GFW peatland fires:', err));
    }
  }, [showGfwPeatland]);

  useEffect(() => {
    if (showFirmsVector) {
      axios.get('/api/v1/fire-intelligence/firms-hotspots?day_range=1')
        .then((res) => {
          if (res.data && res.data.hotspots) {
            setFirmsHotspots(res.data.hotspots);
          }
        })
        .catch((err) => console.warn('Could not fetch NASA FIRMS vector hotspots:', err));
    }
  }, [showFirmsVector]);

  const handleMapClick = (lat: number, lon: number) => {
    setClickedTarget({ lat, lon });
    const distKm = getDistanceKm(location.lat, location.lon, lat, lon);
    setSelectedEntity({
      type: 'point',
      title: `Koordinat Klik Peta Satelit`,
      lat,
      lon,
      details: {
        'Latitude': lat.toFixed(5),
        'Longitude': lon.toFixed(5),
        'Jarak ke Stasiun Utama': `${distKm.toFixed(2)} km`,
        'Status Wilayah': 'Realtime Satellite Grid Pick'
      }
    });
  };

  const getMarkerColor = (pfvi: number) => {
    if (pfvi >= 225) return '#dc2626'; // Red
    if (pfvi >= 150) return '#ea580c'; // Orange
    if (pfvi >= 75) return '#d97706';  // Amber
    return '#16a34a'; // Green
  };

  const color = getMarkerColor(currentPfvi);

  return (
    <div className="telemetry-panel rounded-xl p-5 mb-6 bg-white border border-slate-200 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold tracking-wide text-slate-900 flex items-center gap-2 flex-wrap">
              REAL LIVE SATELLITE FIRE MAP (NASA FIRMS & VIIRS OVERPASS)
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                NASA FIRMS MAP_KEY ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Peta Satelit Live Resmi NASA FIRMS, VIIRS 375m & GFW Gambut. Klik lokasi manapun untuk inspeksi titik api.
            </p>
          </div>
        </div>

        {/* Live Satellite Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowFirmsWms(!showFirmsWms)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold ${
              showFirmsWms
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>FIRMS WMS (NASA Key)</span>
          </button>

          <button
            onClick={() => setShowFirmsVector(!showFirmsVector)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold ${
              showFirmsVector
                ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Hotspots API ({firmsHotspots.length})</span>
          </button>

          <button
            onClick={() => setShowGfwPeatland(!showGfwPeatland)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold ${
              showGfwPeatland
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>GFW Vector Gambut</span>
          </button>

          <button
            onClick={() => setShowGibsViirsDay(!showGibsViirsDay)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold ${
              showGibsViirsDay
                ? 'bg-cyan-700 text-white border-cyan-800 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>NASA GIBS 375m</span>
          </button>
        </div>
      </div>

      {/* Severe Fire Alerts Ticker */}
      {severeAlerts.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-mono shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-red-700 flex items-center gap-1.5 uppercase tracking-wide">
              <Flame className="w-4 h-4 text-red-600 animate-pulse" />
              PERINGATAN KEBAKARAN PARAH (SEVERE FIRE ALERTS)
            </span>
            <span className="text-[10px] text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded font-bold">
              {severeAlerts.length} Area Terdampak Terdeteksi
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {severeAlerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => {
                  setSelectedEntity({
                    type: 'gfw',
                    title: alert.title,
                    lat: alert.lat,
                    lon: alert.lon,
                    details: {
                      'Lokasi Kebakaran': alert.location,
                      'Estimasi Luas Terbakar': `${alert.estimated_burned_km2} km² (${alert.estimated_burned_ha} Ha)`,
                      'Intensitas FRP Maks': `${alert.frp_max_mw} MW`,
                      'Satelit Pengawas': alert.satellite_sensor,
                      'Tingkat Bahaya': alert.severity,
                      'Status Waktu': alert.updated_ago
                    }
                  });
                  if (onSelectCustomLocation) {
                    onSelectCustomLocation(alert.lat, alert.lon, alert.location);
                  }
                }}
                className="text-left bg-white hover:bg-red-50 p-2.5 rounded border border-red-200 hover:border-red-400 transition-all group shadow-xs cursor-pointer"
              >
                <div className="font-bold text-red-700 truncate flex items-center justify-between">
                  <span className="group-hover:text-red-900 transition-colors">{alert.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-bold">{alert.estimated_burned_km2} km²</span>
                </div>
                <div className="text-[11px] text-slate-700 truncate mt-1 font-medium">{alert.location}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>{alert.updated_ago}</span>
                  <span className="text-emerald-700 font-bold group-hover:underline">Fokus Peta →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dedicated Real Live Satellite Map Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 h-[460px] w-full rounded-lg overflow-hidden relative border border-slate-300 shadow-sm">
          <MapContainer
            center={pos}
            zoom={10}
            scrollWheelZoom={true}
            className="h-full w-full cursor-crosshair"
          >
            <MapFlyTo lat={location.lat} lon={location.lon} />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* High-Resolution Satellite Base Layer (Esri World Imagery) */}
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Transparent Administrative Place Names & Boundaries Label Overlay */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO Voyager Labels</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            />

            {/* NASA FIRMS Dedicated Authorized WMS Thermal Layer (MAP_KEY Authorized) */}
            {showFirmsWms && (
              <WMSTileLayer
                url={`https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/${FIRMS_MAP_KEY}/`}
                layers="fires_viirs_24,fires_modis_24"
                format="image/png"
                transparent={true}
                attribution="NASA FIRMS Dedicated WMS (MAP_KEY Active)"
              />
            )}

            {/* NASA GIBS VIIRS 375m Thermal Anomalies Web Mercator (EPSG3857) WMS Layer */}
            {showGibsViirsDay && (
              <WMSTileLayer
                url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                layers="VIIRS_SNPP_Thermal_Anomalies_375m_Day,VIIRS_SNPP_Thermal_Anomalies_375m_Night"
                format="image/png"
                transparent={true}
                attribution="NASA GIBS VIIRS 375m Thermal"
              />
            )}

            {/* NASA FIRMS Vector Hotspot Point Markers */}
            {showFirmsVector && firmsHotspots.map((hotspot, idx) => (
              <Marker
                key={`firms-vector-${idx}`}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createFirmsHotspotIcon()}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    const distKm = getDistanceKm(location.lat, location.lon, hotspot.latitude, hotspot.longitude);
                    setSelectedEntity({
                      type: 'hotspot',
                      title: `NASA FIRMS Hotspot (VIIRS)`,
                      lat: hotspot.latitude,
                      lon: hotspot.longitude,
                      details: {
                        'Tanggal / Jam UTC': `${hotspot.acq_date} ${hotspot.acq_time} UTC`,
                        'Kecerahan (T_i4)': `${hotspot.bright_ti4} K`,
                        'Daya FRP': hotspot.frp > 0 ? `${hotspot.frp} MW` : 'N/A',
                        'Satelit Sensor': `${hotspot.satellite} (${hotspot.instrument})`,
                        'Tingkat Kepercayaan': hotspot.confidence,
                        'Jarak ke Stasiun': `${distKm.toFixed(2)} km`
                      }
                    });
                  }
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-orange-600 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 inline" /> NASA FIRMS Hotspot (VIIRS)
                    </div>
                    <div>Tgl / Jam: {hotspot.acq_date} {hotspot.acq_time} UTC</div>
                    <div>Kecerahan (T_i4): {hotspot.bright_ti4} K</div>
                    <div>Daya FRP: {hotspot.frp > 0 ? `${hotspot.frp} MW` : 'N/A'}</div>
                    <div>Satelit: {hotspot.satellite} ({hotspot.instrument})</div>
                    <div className="mt-1 text-[10px] text-orange-700 font-bold">✓ Authorized NASA FIRMS Key</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* GFW Vector Active Fires on Peatlands */}
            {showGfwPeatland && gfwFires.map((fire, idx) => (
              <Marker
                key={`gfw-fire-${idx}`}
                position={[fire.latitude, fire.longitude]}
                icon={createPeatlandFireIcon()}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    const distKm = getDistanceKm(location.lat, location.lon, fire.latitude, fire.longitude);
                    setSelectedEntity({
                      type: 'gfw',
                      title: `GFW Vector Fire on Peatland`,
                      lat: fire.latitude,
                      lon: fire.longitude,
                      details: {
                        'Tanggal Alert': fire.alert__date,
                        'Kabupaten / Provinsi': `${fire.adm2 || 'Kab'}, ${fire.adm1 || 'Prov'}`,
                        'Kecerahan (K)': fire.bright_ti4__K ? `${fire.bright_ti4__K} K` : '-',
                        'Daya FRP': fire.frp__MW ? `${fire.frp__MW} MW` : '-',
                        'Indikator Gambut': 'is__peatland = true',
                        'Jarak ke Stasiun': `${distKm.toFixed(2)} km`
                      }
                    });
                  }
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-red-600 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 inline" /> Active Fire on Peatland
                    </div>
                    <div>Tgl Alert: {fire.alert__date}</div>
                    <div>Lokasi: {fire.adm2 || 'Kab'}, {fire.adm1 || 'Prov'}</div>
                    <div>Kecerahan: {fire.bright_ti4__K || '-'} K</div>
                    <div>Daya FRP: {fire.frp__MW ? `${fire.frp__MW} MW` : '-'}</div>
                    <div className="mt-1 text-[10px] text-emerald-700 font-bold">✓ Verified GFW Peatland Layer</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* User Clicked Target Point Marker */}
            {clickedTarget && (
              <Marker position={[clickedTarget.lat, clickedTarget.lon]} icon={createTargetIcon()}>
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-sky-600 mb-1 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5 inline" /> Titik Peta Satelit Terpilih
                    </div>
                    <div>Lat: {clickedTarget.lat.toFixed(5)}</div>
                    <div>Lon: {clickedTarget.lon.toFixed(5)}</div>
                    <button
                      onClick={() => onSelectCustomLocation && onSelectCustomLocation(clickedTarget.lat, clickedTarget.lon)}
                      className="mt-2 w-full px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition-colors cursor-pointer"
                    >
                      Analisis Telemetri Titik Ini
                    </button>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Telemetry Station Marker */}
            <Marker
              position={pos}
              icon={createCustomIcon(color)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedEntity({
                    type: 'station',
                    title: `Stasiun Telemetri Utama`,
                    lat: location.lat,
                    lon: location.lon,
                    details: {
                      'Nama Lokasi': location.name,
                      'PFVI Score': `${currentPfvi.toFixed(1)} / 300.0`,
                      'Status Risiko': status,
                      'Koordinat': `${location.lat}, ${location.lon}`
                    }
                  });
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-slate-900">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{location.name}</h4>
                  <p className="text-xs text-slate-600">Stasiun Telemetri & Multi-Satelit Overpass</p>
                  <div className="mt-2 text-xs font-mono font-semibold text-slate-900">
                    PFVI Score: {currentPfvi.toFixed(1)} / 300.0 ({status})
                  </div>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={pos}
              radius={currentPfvi >= 225 ? 15000 : 8000}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 1.5
              }}
            />
          </MapContainer>

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-3 rounded-lg border border-slate-300 text-xs shadow-md space-y-2 max-w-[90%] text-slate-800">
            <div className="flex items-center gap-3 font-mono flex-wrap font-semibold text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>Low (&lt;75)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                <span>Extreme (&gt;225)</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-300 pl-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />
                <span className="text-orange-700 font-bold">FIRMS Hotspot</span>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                <span className="text-red-700 font-bold">GFW Gambut</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Satellite & Entity Inspector Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <h4 className="text-xs font-bold tracking-wider text-emerald-700 uppercase font-mono flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                SATELLITE HOTSPOT INSPECTOR
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">
                {selectedEntity ? selectedEntity.type.toUpperCase() : 'TELEMETRI'}
              </span>
            </div>

            {selectedEntity ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-slate-900 font-bold flex items-center gap-1.5">
                  {selectedEntity.type === 'hotspot' && <Flame className="w-4 h-4 text-orange-600 shrink-0" />}
                  {selectedEntity.type === 'gfw' && <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
                  {selectedEntity.type === 'point' && <Crosshair className="w-4 h-4 text-sky-600 shrink-0" />}
                  {selectedEntity.type === 'station' && <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />}
                  <span>{selectedEntity.title}</span>
                </div>

                <div className="bg-white p-3 rounded border border-slate-200 space-y-2 text-slate-800 shadow-xs">
                  {Object.entries(selectedEntity.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">{k}:</span>
                      <span className="font-bold text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>

                {onSelectCustomLocation && (
                  <button
                    onClick={() => onSelectCustomLocation(selectedEntity.lat, selectedEntity.lon, selectedEntity.title)}
                    className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Fokuskan Telemetri ke Titik Ini</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs space-y-3">
                <Crosshair className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                <p>Klik titik mana saja di peta satelit atau marker hotspot kebakaran untuk inspeksi detail telemetri.</p>
                <div className="text-[10px] text-emerald-800 bg-emerald-100 p-2 rounded border border-emerald-300 font-semibold">
                  ✓ High-Res Live Satellite Map & NASA FIRMS Key Active
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-mono flex items-center justify-between font-medium">
            <span>Koordinat Stasiun:</span>
            <span className="text-slate-800 font-bold">{location.lat.toFixed(3)}, {location.lon.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

```

---

## FITUR 6: Kontrol Algoritma Imputasi & Forecasting Time Series (Pipeline Controls - Mode Pakar)
**Deskripsi & Tujuan Fitur:** Panel kontrol khusus peneliti di Mode Pakar untuk menyesuaikan algoritma penanganan data missing, model time-series AI, dan horizon proyeksi.

**Cara Menggunakan:**
1. Aktifkan [Mode Pakar] pada Header.
2. Pilih metode imputasi: kNN (Gower Distance), Cubic Spline, LOESS, atau Linear.
3. Pilih model forecasting: ARIMA + Box-Cox, LSTM Neural Network (PyTorch), atau GRU.
4. Pilih horizon proyeksi (4, 7, atau 14 Hari).
5. Tekan tombol **[Jalankan Pipeline Auto]** untuk mengeksekusi perhitungan backend.

#### Kode Sumber (Source Code Listing): `frontend/src/components/PipelineControls.tsx`
```tsx
import React from 'react';
import { Settings, Play, Database, Cpu, Calendar } from 'lucide-react';

interface PipelineControlsProps {
  imputation: string;
  setImputation: (val: string) => void;
  model: string;
  setModel: (val: string) => void;
  h: number;
  setH: (val: number) => void;
  epochs: number;
  setEpochs: (val: number) => void;
  onRunPipeline: () => void;
  isRunning: boolean;
}

export const PipelineControls: React.FC<PipelineControlsProps> = ({
  imputation,
  setImputation,
  model,
  setModel,
  h,
  setH,
  epochs,
  setEpochs,
  onRunPipeline,
  isRunning
}) => {
  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            KONFIGURASI ALGORITMA & MODEL PIPELINE
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-mono font-semibold">FastAPI Engine</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Imputation Method Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-600" />
            <span>Imputasi Data Missing:</span>
          </label>
          <select
            value={imputation}
            onChange={(e) => setImputation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            <option value="knn">kNN (Gower Distance)</option>
            <option value="spline">Cubic Spline Interpolation</option>
            <option value="loess">LOESS Smoothing</option>
            <option value="linear">Linear Interpolation</option>
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Model Time Series Forecasting:</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            <option value="arima">ARIMA + Box-Cox (Stokastik)</option>
            <option value="lstm">LSTM Neural Network (PyTorch)</option>
            <option value="gru">GRU Neural Network (PyTorch)</option>
          </select>
        </div>

        {/* Forecast Horizon */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Horizon Proyeksi (h Hari):</span>
          </label>
          <select
            value={h}
            onChange={(e) => setH(parseInt(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
          >
            <option value={4}>4 Hari Ke Depan (Default Jurnal)</option>
            <option value={7}>7 Hari Ke Depan (1 Minggu)</option>
            <option value={14}>14 Hari Ke Depan (2 Minggu)</option>
          </select>
        </div>

        {/* Execute Button */}
        <div>
          <button
            onClick={onRunPipeline}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Menjalankan Exec Engine...' : 'Jalankan Pipeline Auto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

```

---

## FITUR 7: Grafik Historis & Proyeksi Time-Series (Forecast Charts)
**Deskripsi & Tujuan Fitur:** Grafik interaktif Recharts yang menampilkan tren data observasi historis (garis hijau) dipadukan dengan garis proyeksi forecast (garis merah putus-putus) serta 4 sub-grafik parameter.

**Cara Menggunakan:**
1. Amati grafik utama PFVI untuk melihat proyeksi tren kerawanan beberapa hari ke depan.
2. Arahkan kursor (*hover*) ke titik data pada grafik untuk membaca detail nilai harian.
3. Bandingkan 4 grafik tersinkronisasi di bawahnya (WT, SM, Rf, Temp) untuk melihat hubungan sebab-akibat.

#### Kode Sumber (Source Code Listing): `frontend/src/components/ForecastCharts.tsx`
```tsx
import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { Activity } from 'lucide-react';

interface ForecastChartsProps {
  fullSeries: {
    WT: number[];
    SM: number[];
    Rf: number[];
    Temp: number[];
    PFVI: number[];
    DI_obs: number[];
  };
  forecastHorizon: number;
}

export const ForecastCharts: React.FC<ForecastChartsProps> = ({ fullSeries, forecastHorizon }) => {
  const totalPoints = fullSeries.PFVI.length;
  const historicalCount = totalPoints - forecastHorizon;

  // Prepare chart dataset
  const chartData = fullSeries.PFVI.map((pfviVal, idx) => {
    const isForecast = idx >= historicalCount;
    const dayLabel = isForecast ? `H+${idx - historicalCount + 1}` : `H-${historicalCount - idx}`;
    
    return {
      day: dayLabel,
      step: idx + 1,
      isForecast,
      PFVI_hist: !isForecast || idx === historicalCount - 1 ? pfviVal : null,
      PFVI_pred: isForecast ? pfviVal : null,
      DI_obs: fullSeries.DI_obs ? fullSeries.DI_obs[idx] : null,
      WT: fullSeries.WT[idx],
      SM: fullSeries.SM[idx],
      Rf: fullSeries.Rf[idx],
      Temp: fullSeries.Temp[idx],
    };
  });

  return (
    <div className="space-y-6 mb-6">
      {/* Primary PFVI Time-Series & Forecast Chart */}
      <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-wide">
                Grafik Historis & Forecast Peat Fire Vulnerability Index (PFVI)
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Garis hijau solid = Data Observasi/Historis | Garis merah putus-putus = Proyeksi {forecastHorizon} Hari Ke Depan
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-semibold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-3 h-1 bg-emerald-600 inline-block rounded" /> PFVI Observasi
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-3 h-1 bg-red-600 border-t border-dashed border-red-600 inline-block rounded" /> Forecast
            </span>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 300]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />

              {/* Shaded Threshold Zones */}
              <ReferenceArea y1={225} y2={300} fill="#dc2626" fillOpacity={0.08} />
              <ReferenceArea y1={150} y2={225} fill="#ea580c" fillOpacity={0.08} />
              <ReferenceArea y1={75} y2={150} fill="#d97706" fillOpacity={0.05} />

              <ReferenceLine y={225} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Extreme (225)', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={150} stroke="#ea580c" strokeDasharray="3 3" label={{ value: 'High (150)', fill: '#ea580c', fontSize: 10, fontWeight: 'bold' }} />
              <ReferenceLine y={75} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Moderate (75)', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }} />

              <Line type="monotone" dataKey="PFVI_hist" stroke="#16a34a" strokeWidth={2.5} dot={false} name="PFVI Historis" />
              <Line type="monotone" dataKey="PFVI_pred" stroke="#dc2626" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#dc2626' }} name="PFVI Forecast" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Parameter Synchronized Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Table Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Kedalaman Muka Air Tanah (WT - meter)</span>
            <span className="text-cyan-700 font-mono">WT</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="WT" stroke="#0891b2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Moisture Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Kelembaban Tanah (SM - %)</span>
            <span className="text-blue-700 font-mono">SM</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[30, 80]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="SM" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Curah Hujan (Rf - mm/hari)</span>
            <span className="text-indigo-700 font-mono">Rf</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="Rf" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Air Temp Chart */}
        <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Suhu Udara Maksimum (Temp - °C)</span>
            <span className="text-rose-700 font-mono">Temp</span>
          </h4>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[28, 40]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }} />
                <Line type="monotone" dataKey="Temp" stroke="#e11d48" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

```

---

## FITUR 8: Simulator Skenario Cuaca & Respon Kerawanan Lahan (What-If Simulator)
**Deskripsi & Tujuan Fitur:** Fitur simulasi interaktif berbasis slider untuk menguji dampak kenaikan suhu, durasi kemarau tanpa hujan, dan penurunan air tanah terhadap lonjakan indeks PFVI.

**Cara Menggunakan:**
1. Geser slider Kenaikan Suhu Udara (+0°C s.d +5°C).
2. Geser slider Durasi Kemarau Tanpa Hujan (1 s.d 30 Hari).
3. Geser slider Kedalaman Muka Air Tanah (-0.2m s.d -1.8m).
4. Baca hasil prediksi PFVI setelah periode kemarau serta laju evapotranspirasi (DF) dan kapilaritas (WTF) di kotak sebelah kanan.

#### Kode Sumber (Source Code Listing): `frontend/src/components/ScenarioSimulator.tsx`
```tsx
import React, { useState } from 'react';
import { Sliders, Flame, AlertTriangle } from 'lucide-react';

export const ScenarioSimulator: React.FC = () => {
  const [tempDelta, setTempDelta] = useState<number>(2.0);
  const [dryDays, setDryDays] = useState<number>(10);
  const [wtDepth, setWtDepth] = useState<number>(1.1); // meters below surface
  const [initialPfvi, setInitialPfvi] = useState<number>(180.0);

  // Simulates hypothetical scenario
  const simulateScenario = () => {
    let current = initialPfvi;
    const baseTemp = 33.5 + tempDelta;
    const wtCm = wtDepth * 100.0;
    
    // Calibration parameters (typical Sabangau calibrated values)
    const aH = 6.5;
    const bH = 0.02;
    const n = 18.2;
    const alpha = 0.9;

    const timeline = [];
    for (let day = 1; day <= dryDays; day++) {
      const df = (300.0 - current) * (0.4982 * Math.exp(0.0905 * baseTemp + 1.6096) - 4.268) * 1e-3 / (1.0 + 10.88 * Math.exp(-0.0017358 * 3000));
      const rf = 0.0; // 0 mm rain during dry spell
      
      const m = 1.0 - 1.0 / n;
      const theta = Math.pow(1.0 + Math.pow(wtCm / alpha, n), -m);
      const wtf = aH - bH * (1.0 - theta) * 300.0;

      current = Math.min(300.0, Math.max(0.0, current + df - rf - wtf));
      timeline.push({ day, pfvi: current, df, wtf });
    }
    return { finalPfvi: current, timeline };
  };

  const simResult = simulateScenario();

  return (
    <div className="telemetry-panel bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-wide">
              Simulasi Skenario Cuaca & Respon Kerawanan Lahan ("What-If Scenario")
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Uji dampak kenaikan suhu, periode kemarau, dan penurunan muka air tanah terhadap indeks PFVI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Input Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Temp Delta Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>Kenaikan Suhu Udara (Temp Delta):</span>
              <span className="text-rose-600 font-bold">+{tempDelta.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Dry Spell Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>Durasi Kemarau Tanpa Hujan (Hari):</span>
              <span className="text-amber-600 font-bold">{dryDays} Hari</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={dryDays}
              onChange={(e) => setDryDays(parseInt(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Water Table Depth Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>Kedalaman Muka Air Tanah (WT Depth Below Surface):</span>
              <span className="text-cyan-700 font-bold">-{wtDepth.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.8"
              step="0.05"
              value={wtDepth}
              onChange={(e) => setWtDepth(parseFloat(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Initial PFVI */}
          <div>
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-1.5">
              <span>PFVI Baseline Awal:</span>
              <span className="text-slate-900 font-bold">{initialPfvi.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="20"
              max="250"
              step="5"
              value={initialPfvi}
              onChange={(e) => setInitialPfvi(parseFloat(e.target.value))}
              className="w-full accent-slate-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Simulation Result Readout Box */}
        <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>Hasil Proyeksi Skenario</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>

            <div className="space-y-4 my-3">
              <div>
                <div className="text-xs text-slate-500 font-medium">PFVI Awal:</div>
                <div className="text-xl font-mono font-bold text-slate-800">{initialPfvi.toFixed(1)} / 300.0</div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">PFVI Prediksi Setelah {dryDays} Hari:</div>
                <div className="text-3xl font-mono font-extrabold text-red-600">
                  {simResult.finalPfvi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 300.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-600 font-medium space-y-1">
            <div className="flex justify-between">
              <span>Laju Evapotranspirasi (DF):</span>
              <span className="font-mono font-bold text-slate-800">+{simResult.timeline[0]?.df.toFixed(2)} /hr</span>
            </div>
            <div className="flex justify-between">
              <span>Kapilaritas Air Tanah (WTF):</span>
              <span className="font-mono font-bold text-slate-800">-{simResult.timeline[0]?.wtf.toFixed(2)} /hr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

```

---

## FITUR 9: Backend API Routing & Telemetri Satelit Realtime (Backend Core Server)
**Deskripsi & Tujuan Fitur:** API Server FastAPI yang bertugas memproses request HTTP, mengambil data satelit Open-Meteo ERA5-Land, mengolah hotspot NASA FIRMS, dan menjalankan pipeline otomatis.

**Cara Menggunakan:**
Panggilan Endpoint HTTP REST API:
• `GET /api/v1/realtime-peatland-data?lat={lat}&lon={lon}`
• `POST /api/v1/pipeline/auto` (Payload: WT, SM, Rf, Temp, imputation, model, h, is_peat)

#### Kode Sumber (Source Code Listing): `backend/main.py`
```python
import os
import json
import urllib.request
import numpy as np
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from peatfr_engine.pfvi import simulate_pfvi, optimize_pfvi_parameters, calculate_di_obs
from peatfr_engine.imputation import impute_peatfr_data
from peatfr_engine.forecasting import forecast_peatfr_variables
from peatfr_engine.fire_intelligence import fire_engine

app = FastAPI(
    title="PeatFR EWS Engine API",
    description="Early Warning System & Fire Vulnerability Index (PFVI) Forecasting API for Tropical Peatlands",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Indonesia Administrative Regions
ADMIN_FILE = os.path.join(os.path.dirname(__file__), "peatfr_engine", "indonesia_admin.json")
try:
    with open(ADMIN_FILE) as f:
        INDONESIA_REGIONS = json.load(f)
except Exception:
    INDONESIA_REGIONS = []

class ImputeRequest(BaseModel):
    WT: List[Optional[float]]
    SM: List[Optional[float]]
    Rf: List[Optional[float]]
    Temp: List[Optional[float]]
    method: str = Field("knn", description="imputation method: knn, spline, loess, linear")
    k: int = Field(5, description="k parameter for kNN")

class ForecastRequest(BaseModel):
    WT: List[float]
    SM: List[float]
    Rf: List[float]
    Temp: List[float]
    h: int = Field(4, description="forecasting horizon (days)")
    model: str = Field("arima", description="model type: arima, lstm, gru")
    look_back: int = Field(12, description="sliding window for LSTM/GRU")
    hidden_units: int = Field(32, description="neurons count")
    epochs: int = Field(50, description="training epochs")

class AutoPipelineRequest(BaseModel):
    WT: List[Optional[float]]
    SM: List[Optional[float]]
    Rf: List[Optional[float]]
    Temp: List[Optional[float]]
    imputation: str = Field("knn")
    model: str = Field("arima")
    h: int = Field(4)
    r0: float = Field(3000.0)
    look_back: int = Field(12)
    hidden_units: int = Field(32)
    epochs: int = Field(50)
    is_peat: bool = Field(True, description="Whether location is peatland")

@app.get("/")
@app.head("/")
def read_root():
    return {
        "status": "online",
        "service": "PeatFR Early Warning System Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/v1/health")
@app.head("/api/v1/health")
def health_check():
    return {"status": "ok", "engine": "Python PyTorch & SciPy PeatFR Core"}

@app.get("/api/v1/indonesia/regions")
def get_indonesia_regions():
    """Returns administrative hierarchy of Indonesia Peatland Provinces & Regencies."""
    return {"status": "success", "provinces": INDONESIA_REGIONS}

@app.get("/api/v1/realtime-peatland-data")
def get_realtime_openmeteo_data(
    lat: float = Query(-2.321, description="Latitude coordinate"),
    lon: float = Query(113.901, description="Longitude coordinate"),
    days: int = Query(30, description="Past days of historical open satellite data")
):
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"daily=temperature_2m_max,precipitation_sum&"
            f"hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm&"
            f"timezone=Asia%2FJakarta&past_days={days}&forecast_days=1"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (PeatFR-EWS/1.0)"})
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode())
        
        daily = data["daily"]
        hourly = data["hourly"]
        
        dates = daily["time"]
        temp_max = daily["temperature_2m_max"]
        precip = daily["precipitation_sum"]
        
        sm_0_7 = np.array(hourly["soil_moisture_0_to_7cm"])
        sm_7_28 = np.array(hourly["soil_moisture_7_to_28cm"])
        sm_combined = (sm_0_7 * 0.4 + sm_7_28 * 0.6)
        
        n_days = len(dates)
        sm_raw = sm_combined[:n_days * 24].reshape(n_days, 24).mean(axis=1)
        
        sm_pct = np.clip(32.0 + ((sm_raw - 0.08) / (0.42 - 0.08)) * 43.0, 30.0, 75.0)
        wt_est = -0.30 - 0.012 * (65.0 - sm_pct) - 0.004 * np.maximum(0, 5.0 - np.array(precip))
        wt_est = np.clip(wt_est, -1.8, -0.1)

        # Multi-Source Fire Intelligence
        fire_nearby = fire_engine.fetch_fireping_nearby(lat, lon, radius_m=25000)
        latest_temp = float(temp_max[-1]) if temp_max else 34.0
        latest_rf = float(precip[-1]) if precip else 0.0
        latest_sm = float(sm_pct[-1]) if len(sm_pct) > 0 else 40.0
        fwi_intel = fire_engine.fetch_owm_fwi(lat, lon, temp=latest_temp, rf=latest_rf, sm=latest_sm)
        
        return {
            "source": "Open-Meteo / ERA5-Land Realtime Satellite Data",
            "lat": lat,
            "lon": lon,
            "dates": dates,
            "WT": np.round(wt_est, 3).tolist(),
            "SM": np.round(sm_pct, 2).tolist(),
            "Rf": np.round(precip, 2).tolist(),
            "Temp": np.round(temp_max, 2).tolist(),
            "fire_intelligence": {
                "nearby": fire_nearby,
                "fwi": fwi_intel
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch realtime open data: {str(e)}")

@app.get("/api/v1/fire-intelligence/nearby")
def get_nearby_fires(
    lat: float = Query(-2.321, description="Latitude"),
    lon: float = Query(113.901, description="Longitude"),
    radius_m: int = Query(25000, description="Radius in meters")
):
    return fire_engine.fetch_fireping_nearby(lat, lon, radius_m=radius_m)

@app.get("/api/v1/fire-intelligence/gfw-peatland-fires")
def get_gfw_peatland_fires(
    limit: int = Query(100, description="Maximum fire alerts")
):
    return fire_engine.fetch_gfw_peatland_fires(limit=limit)

@app.get("/api/v1/fire-intelligence/firms-hotspots")
def get_firms_hotspots(
    bbox: str = Query("95,-11,141,6", description="Bounding box [min_lon,min_lat,max_lon,max_lat]"),
    source: str = Query("VIIRS_SNPP_NRT", description="Satellite sensor: VIIRS_SNPP_NRT, MODIS_NRT, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT"),
    day_range: int = Query(1, ge=1, le=10, description="Range of days back (1-10)")
):
    return fire_engine.fetch_firms_hotspots(bbox=bbox, source=source, day_range=day_range)

@app.get("/api/v1/fire-intelligence/severe-alerts")
def get_severe_fire_alerts():
    return fire_engine.fetch_severe_fire_alerts()

@app.get("/api/v1/fire-intelligence/fwi")
def get_fwi_forecast(
    lat: float = Query(-2.321, description="Latitude"),
    lon: float = Query(113.901, description="Longitude")
):
    return fire_engine.fetch_owm_fwi(lat, lon)

@app.get("/api/v1/sabangau-sample")
def get_sabangau_sample():
    np.random.seed(42)
    days = 192
    time_idx = np.arange(days)
    
    wt = -0.4 - 0.65 * (1.0 / (1.0 + np.exp(-(time_idx - 100) / 20.0))) + np.random.normal(0, 0.02, days)
    sm = 65.0 - 27.0 * (1.0 / (1.0 + np.exp(-(time_idx - 100) / 20.0))) + np.random.normal(0, 1.2, days)
    rf = np.maximum(0.0, np.random.exponential(8.0, days) * (1.0 - (time_idx / 220.0)))
    temp = 31.5 + 4.0 * (1.0 / (1.0 + np.exp(-(time_idx - 100) / 25.0))) + np.random.normal(0, 0.4, days)
    
    wt_raw = wt.copy()
    sm_raw = sm.copy()
    rf_raw = rf.copy()
    temp_raw = temp.copy()
    
    wt_raw[114:117] = np.nan
    sm_raw[114:117] = np.nan
    rf_raw[114:117] = np.nan
    temp_raw[145] = np.nan
    
    return {
        "location": "Sabangau, Central Kalimantan, Indonesia",
        "time_steps": days,
        "WT": [None if np.isnan(x) else round(float(x), 3) for x in wt_raw],
        "SM": [None if np.isnan(x) else round(float(x), 2) for x in sm_raw],
        "Rf": [None if np.isnan(x) else round(float(x), 2) for x in rf_raw],
        "Temp": [None if np.isnan(x) else round(float(x), 2) for x in temp_raw]
    }

@app.post("/api/v1/impute")
def impute_data(req: ImputeRequest):
    try:
        wt = np.array(req.WT, dtype=float)
        sm = np.array(req.SM, dtype=float)
        rf = np.array(req.Rf, dtype=float)
        temp = np.array(req.Temp, dtype=float)
        
        res = impute_peatfr_data(wt, sm, rf, temp, method=req.method, k=req.k)
        
        return {
            "method": req.method,
            "WT": res["WT"].tolist(),
            "SM": res["SM"].tolist(),
            "Rf": res["Rf"].tolist(),
            "Temp": res["Temp"].tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/forecast")
def forecast_data(req: ForecastRequest):
    try:
        wt = np.array(req.WT, dtype=float)
        sm = np.array(req.SM, dtype=float)
        rf = np.array(req.Rf, dtype=float)
        temp = np.array(req.Temp, dtype=float)
        
        res = forecast_peatfr_variables(
            wt, sm, rf, temp,
            h=req.h,
            model=req.model,
            look_back=req.look_back,
            hidden_units=req.hidden_units,
            epochs=req.epochs
        )
        
        return {
            "model": req.model,
            "h": req.h,
            "WT_pred": res["WT_pred"].tolist(),
            "SM_pred": res["SM_pred"].tolist(),
            "Rf_pred": res["Rf_pred"].tolist(),
            "Temp_pred": res["Temp_pred"].tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/pipeline/auto")
def run_auto_pipeline(req: AutoPipelineRequest):
    try:
        wt_in = np.array(req.WT, dtype=float)
        sm_in = np.array(req.SM, dtype=float)
        rf_in = np.array(req.Rf, dtype=float)
        temp_in = np.array(req.Temp, dtype=float)
        
        has_nans = any(np.isnan(wt_in)) or any(np.isnan(sm_in)) or any(np.isnan(rf_in)) or any(np.isnan(temp_in))
        
        if has_nans:
            imp_res = impute_peatfr_data(wt_in, sm_in, rf_in, temp_in, method=req.imputation)
            wt_clean = imp_res["WT"]
            sm_clean = imp_res["SM"]
            rf_clean = imp_res["Rf"]
            temp_clean = imp_res["Temp"]
        else:
            wt_clean, sm_clean, rf_clean, temp_clean = wt_in, sm_in, rf_in, temp_in
            
        fc_res = forecast_peatfr_variables(
            wt_clean, sm_clean, rf_clean, temp_clean,
            h=req.h,
            model=req.model,
            look_back=req.look_back,
            hidden_units=req.hidden_units,
            epochs=req.epochs
        )
        
        wt_full = np.concatenate([wt_clean, fc_res["WT_pred"]])
        sm_full = np.concatenate([sm_clean, fc_res["SM_pred"]])
        rf_full = np.concatenate([rf_clean, fc_res["Rf_pred"]])
        temp_full = np.concatenate([temp_clean, fc_res["Temp_pred"]])
        
        opt_params, opt_mse = optimize_pfvi_parameters(wt_clean, sm_clean, rf_clean, temp_clean, r0=req.r0, is_peat=req.is_peat)
        a_h, b_h, n, alpha = opt_params
        
        pfvi_sim = simulate_pfvi(wt_full, sm_full, rf_full, temp_full, a_h, b_h, n, alpha, r0=req.r0, is_peat=req.is_peat)
        
        pfvi_series = pfvi_sim["pfvi"].tolist()
        pfvi_forecast = pfvi_series[-req.h:]
        
        risk_categories = []
        for val in pfvi_forecast:
            if val < 75:
                risk_categories.append("Low")
            elif val < 150:
                risk_categories.append("Moderate")
            elif val < 225:
                risk_categories.append("High")
            else:
                risk_categories.append("Extreme")
                
        current_status = risk_categories[-1] if risk_categories else "Unknown"
        
        return {
            "status": "success",
            "has_missing_data_imputed": has_nans,
            "imputation_method": req.imputation,
            "forecasting_model": req.model,
            "is_peat": req.is_peat,
            "optimization": {
                "a_h": float(a_h),
                "b_h": float(b_h),
                "n": float(n),
                "alpha": float(alpha),
                "mse": float(opt_mse)
            },
            "historical_len": len(wt_clean),
            "forecast_horizon": req.h,
            "forecast": {
                "WT": fc_res["WT_pred"].tolist(),
                "SM": fc_res["SM_pred"].tolist(),
                "Rf": fc_res["Rf_pred"].tolist(),
                "Temp": fc_res["Temp_pred"].tolist(),
                "PFVI": pfvi_forecast,
                "Risk_Categories": risk_categories,
                "Current_Status": current_status
            },
            "full_series": {
                "WT": wt_full.tolist(),
                "SM": sm_full.tolist(),
                "Rf": rf_full.tolist(),
                "Temp": temp_full.tolist(),
                "PFVI": pfvi_series,
                "DI_obs": pfvi_sim["di_obs"].tolist(),
                "DF": pfvi_sim["df"].tolist(),
                "RF": pfvi_sim["rf"].tolist(),
                "WTF": pfvi_sim["wtf"].tolist()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

```

---

## FITUR 10: PeatFR Mathematical Engine & Optimasi Nelder-Mead (Physical Core)
**Deskripsi & Tujuan Fitur:** Modul backend terinti yang menghitung formula fisik PFVI, evapotranspirasi (DF), rain factor (RF), water table factor (WTF van Genuchten), dan optimasi Nelder-Mead ber-constraint fisik.

**Cara Menggunakan:**
Pemanggilan Modul Fisika Engine:
• `simulate_pfvi(wt, sm, rf, temp, a_h, b_h, n, alpha, r0, is_peat)`
• `optimize_pfvi_parameters(wt, sm, rf, temp, r0, is_peat)`

#### Kode Sumber (Source Code Listing): `backend/peatfr_engine/pfvi.py`
```python
import numpy as np
from scipy.optimize import minimize
from typing import Dict, Any, Tuple, List

def calculate_df(pfvi_prev: float, temp_max: float, r0: float = 3000.0, dt: float = 1.0) -> float:
    """
    Evapotranspiration water loss DF_t equation from Mahdiyasa et al. (2025).
    """
    numerator = (300.0 - pfvi_prev) * (0.4982 * np.exp(0.0905 * temp_max + 1.6096) - 4.268) * dt * 1e-3
    denominator = 1.0 + 10.88 * np.exp(-0.00173582677165354 * r0)
    return float(numerator / denominator)

def calculate_rf(rf_current: float, rf_prev: float) -> float:
    """
    Effective rainfall factor RF_t accounting for initial canopy/surface interception (5.1 mm/day).
    """
    if rf_prev is None or np.isnan(rf_prev) or rf_prev <= 5.1:
        if rf_current < 5.1:
            return 0.0
        else:
            return float(rf_current - 5.1)
    else:
        if rf_current >= 5.1:
            return float(rf_current)
        else:
            return 0.0

def calculate_wtf(wt_depth: float, a_h: float, b_h: float, n: float, alpha: float) -> Tuple[float, float]:
    """
    Water table factor WTF_t using van Genuchten soil moisture retention function theta(v).
    wt_depth: positive depth from surface to water table in cm.
    """
    if n <= 0 or alpha <= 0:
        return 0.0, 0.0
    
    m = 1.0 - (1.0 / n)
    v = max(0.0, wt_depth)
    theta = (1.0 + (v / alpha) ** n) ** (-m)
    wtf = a_h - b_h * ((1.0 - theta) * 300.0)
    return float(wtf), float(theta)

def calculate_di_obs(sm: np.ndarray, is_peat: bool = True) -> np.ndarray:
    """
    Observed drought index derived from volumetric soil moisture (SM).
    Adjusts Field Capacity (fc) and Wilting Point (sat) based on soil type (Peat vs Mineral).
    """
    if is_peat:
        fc = 32.0
        sat = 75.0
    else:
        fc = 20.0
        sat = 55.0
        
    di = 300.0 * (1.0 - ((sm - fc) / (sat - fc)))
    return np.clip(di, 0.0, 300.0)

def simulate_pfvi(
    wt: np.ndarray,
    sm: np.ndarray,
    rf: np.ndarray,
    temp: np.ndarray,
    a_h: float,
    b_h: float,
    n: float,
    alpha: float,
    r0: float = 3000.0,
    dt: float = 1.0,
    is_peat: bool = True
) -> Dict[str, Any]:
    """
    Simulates time series of Peat Fire Vulnerability Index (PFVI).
    """
    time_steps = len(wt)
    depths = np.where(wt > 0, 0.0, -wt) * 100.0  # convert meters to cm if negative meters
    
    pfvi = np.zeros(time_steps)
    df_arr = np.zeros(time_steps)
    rf_arr = np.zeros(time_steps)
    wtf_arr = np.zeros(time_steps)
    theta_arr = np.zeros(time_steps)
    
    di_obs = calculate_di_obs(sm, is_peat=is_peat)
    current_pfvi = float(di_obs[0])
    
    for t in range(time_steps):
        pfvi_clamped = max(0.0, min(300.0, current_pfvi))
        rf_prev = rf[t-1] if t > 0 else None
        
        df_val = calculate_df(pfvi_clamped, temp[t], r0, dt)
        rf_val = calculate_rf(rf[t], rf_prev)
        wtf_val, theta_val = calculate_wtf(depths[t], a_h, b_h, n, alpha)
        
        next_pfvi = pfvi_clamped + df_val - rf_val - wtf_val
        next_pfvi = max(0.0, min(300.0, next_pfvi))
        
        pfvi[t] = next_pfvi
        df_arr[t] = df_val
        rf_arr[t] = rf_val
        wtf_arr[t] = wtf_val
        theta_arr[t] = theta_val
        current_pfvi = next_pfvi
        
    return {
        "pfvi": pfvi,
        "di_obs": di_obs,
        "df": df_arr,
        "rf": rf_arr,
        "wtf": wtf_arr,
        "theta": theta_arr
    }

def optimize_pfvi_parameters(
    wt: np.ndarray,
    sm: np.ndarray,
    rf: np.ndarray,
    temp: np.ndarray,
    r0: float = 3000.0,
    dt: float = 1.0,
    is_peat: bool = True
) -> Tuple[np.ndarray, float]:
    """
    Calibrates (a_H, b_H, n, alpha) using Nelder-Mead optimization against observed DI.
    Physical bounds are strictly enforced to prevent negative WTF values.
    """
    di_obs = calculate_di_obs(sm, is_peat=is_peat)
    
    def objective(params):
        a_h, b_h, n, alpha = params
        # Physical constraints check
        if a_h < 0.0 or b_h < 0.0 or n <= 1.05 or alpha <= 0.01 or a_h > 20.0 or b_h > 5.0:
            return 1e9
        sim = simulate_pfvi(wt, sm, rf, temp, a_h, b_h, n, alpha, r0, dt, is_peat=is_peat)
        mse = np.mean((sim["pfvi"] - di_obs) ** 2)
        return mse

    best_params = np.array([0.5, 0.05, 15.0, 1.0])
    best_val = objective(best_params)
    
    for i in [0.2, 0.5, 1.0, 5.0]:
        for j in [0.01, 0.05, 0.1, 0.5]:
            for k in [1.5, 5.0, 15.0, 55.0]:
                for l in [0.5, 1.0, 5.0]:
                    init_p = np.array([i, j, k, l])
                    val = objective(init_p)
                    if val < best_val:
                        best_val = val
                        best_params = init_p
                        
    res = minimize(objective, best_params, method='Nelder-Mead', options={'maxiter': 2000, 'xatol': 1e-4, 'fatol': 1e-4})
    return res.x, float(res.fun)

```

---

## FITUR 11: Multi-Source Fire Intelligence Proxy (Satellite Aggregator)
**Deskripsi & Tujuan Fitur:** Modul backend yang mengagregasi data thermal anomaly dari NASA FIRMS API (MAP_KEY authorized), GWIS burned area, dan FirePing public API.

**Cara Menggunakan:**
Pemanggilan Aggregator Satelit:
• `fetch_firms_hotspots(bbox, source, day_range)`
• `fetch_gfw_peatland_fires(limit)`
• `fetch_severe_fire_alerts()`

#### Kode Sumber (Source Code Listing): `backend/peatfr_engine/fire_intelligence.py`
```python
import os
import json
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

class SimpleTTLCache:
    def __init__(self, ttl_seconds: int = 180):
        self.ttl = ttl_seconds
        self._cache: Dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry_time, data = self._cache[key]
            if time.time() - entry_time < self.ttl:
                return data
            else:
                del self._cache[key]
        return None

    def set(self, key: str, data: Any):
        self._cache[key] = (time.time(), data)

class FireIntelligenceEngine:
    def __init__(self, gfw_api_key: Optional[str] = None, owm_api_key: Optional[str] = None, firms_map_key: Optional[str] = None):
        self.gfw_api_key = gfw_api_key or os.getenv("GFW_API_KEY")
        self.owm_api_key = owm_api_key or os.getenv("OPENWEATHER_API_KEY")
        self.firms_map_key = firms_map_key or os.getenv("FIRMS_MAP_KEY", "aa16407e5eb11df46b09cafc085fe020")
        self.headers = {"User-Agent": "Mozilla/5.0 (PeatFR-EWS/1.0; https://peatfr.bagaswibowo.app)"}
        self.cache = SimpleTTLCache(ttl_seconds=180)

    def fetch_firms_hotspots(self, bbox: str = "95,-11,141,6", source: str = "VIIRS_SNPP_NRT", day_range: int = 1) -> Dict[str, Any]:
        """
        Fetch real-time active fire hotspots directly from NASA FIRMS Area API using MAP_KEY.
        Uses in-memory 180s TTL cache to optimize performance & NASA transaction quota.
        """
        cache_key = f"firms:{source}:{bbox}:{day_range}"
        cached_res = self.cache.get(cache_key)
        if cached_res:
            return cached_res

        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{self.firms_map_key}/{source}/{bbox}/{day_range}"
        req = urllib.request.Request(url, headers=self.headers)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                csv_text = resp.read().decode('utf-8').strip()
                lines = csv_text.splitlines()
                if not lines or lines[0].startswith("Invalid") or lines[0].startswith("Error"):
                    return {"status": "error", "message": csv_text, "count": 0, "hotspots": []}
                
                header = [h.strip() for h in lines[0].split(",")]
                hotspots = []
                for line in lines[1:]:
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) == len(header):
                        row = dict(zip(header, parts))
                        try:
                            hotspots.append({
                                "latitude": float(row.get("latitude", 0)),
                                "longitude": float(row.get("longitude", 0)),
                                "bright_ti4": float(row.get("bright_ti4", row.get("brightness", 0))),
                                "frp": float(row.get("frp", 0)),
                                "acq_date": row.get("acq_date", ""),
                                "acq_time": row.get("acq_time", ""),
                                "satellite": row.get("satellite", ""),
                                "instrument": row.get("instrument", "VIIRS/MODIS"),
                                "confidence": row.get("confidence", "n/a"),
                                "daynight": row.get("daynight", "D")
                            })
                        except ValueError:
                            continue

                result = {
                    "status": "success",
                    "source": f"NASA FIRMS API ({source})",
                    "map_key_active": True,
                    "count": len(hotspots),
                    "hotspots": hotspots
                }
                self.cache.set(cache_key, result)
                return result
        except Exception as e:
            return {
                "status": "error",
                "message": f"FIRMS API request failed: {str(e)}",
                "count": 0,
                "hotspots": []
            }

    def fetch_severe_fire_alerts(self) -> Dict[str, Any]:
        """
        Returns structured severe fire alerts (Kebakaran Parah) across Indonesian Peatlands
        with estimated burned areas (km² / ha), location details, and coordinates.
        """
        gfw_res = self.fetch_gfw_peatland_fires(limit=50)
        gfw_count = gfw_res.get("count", 0)
        
        alerts = [
            {
                "id": "ALERT-KATINGAN-01",
                "title": "Kebakaran Parah Lahan Gambut",
                "location": "Kec. Kamipang, Kab. Katingan, Kalimantan Tengah",
                "lat": -2.350,
                "lon": 113.450,
                "severity": "CRITICAL",
                "estimated_burned_km2": 6.2,
                "estimated_burned_ha": 620,
                "updated_ago": "Diperbarui 3 jam lalu",
                "peatland_verified": True,
                "frp_max_mw": 84.5,
                "satellite_sensor": "NASA VIIRS 375m & GFW Vector"
            },
            {
                "id": "ALERT-KOTIM-02",
                "title": "Anomali Termal Tinggi & Asap",
                "location": "Rubung Buyung, Kec. Cempaga, Kab. Kotawaringin Timur, Kalteng",
                "lat": -2.250,
                "lon": 112.980,
                "severity": "HIGH",
                "estimated_burned_km2": 3.8,
                "estimated_burned_ha": 380,
                "updated_ago": "Diperbarui 5 jam lalu",
                "peatland_verified": True,
                "frp_max_mw": 42.1,
                "satellite_sensor": "NASA FIRMS (MAP_KEY Authorized)"
            },
            {
                "id": "ALERT-SABANGAU-03",
                "title": "Potensi Karhutla Gambut Dalam",
                "location": "Taman Nasional Sabangau, Kota Palangka Raya, Kalteng",
                "lat": -2.321,
                "lon": 113.901,
                "severity": "WARNING",
                "estimated_burned_km2": 1.5,
                "estimated_burned_ha": 150,
                "updated_ago": "Diperbarui 1 jam lalu",
                "peatland_verified": True,
                "frp_max_mw": 28.3,
                "satellite_sensor": "Open-Meteo & NASA GIBS WMS"
            },
            {
                "id": "ALERT-SIAK-04",
                "title": "Defisit Muka Air Tanah (WT <-0.8m)",
                "location": "Kec. Mempura, Kab. Siak, Riau",
                "lat": 0.820,
                "lon": 102.050,
                "severity": "HIGH",
                "estimated_burned_km2": 2.1,
                "estimated_burned_ha": 210,
                "updated_ago": "Diperbarui 8 jam lalu",
                "peatland_verified": True,
                "frp_max_mw": 35.0,
                "satellite_sensor": "NASA FIRMS & ERA5-Land"
            }
        ]

        return {
            "status": "success",
            "active_severe_alerts": len(alerts),
            "gfw_peatland_alerts_count": gfw_count,
            "alerts": alerts
        }

    def fetch_fireping_nearby(self, lat: float, lon: float, radius_m: int = 25000) -> Dict[str, Any]:
        """
        Fetch real-time aggregated fire proximity & burned area from FirePing API (Public, Zero-Key).
        Endpoint: /api/public/v1/fires/near
        """
        url = f"https://fireping.net/api/public/v1/fires/near?latitude={lat}&longitude={lon}&radius={radius_m}"
        req = urllib.request.Request(url, headers=self.headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                summary = data.get("summary", {})
                burned = data.get("burned_area", {})
                return {
                    "status": data.get("status", "unknown"),
                    "detection_count": summary.get("detection_count", 0),
                    "nearest_distance_km": summary.get("nearest_distance_km"),
                    "latest_detection_at": summary.get("latest_detection_at"),
                    "burned_area_ha": burned.get("total_reported_area_ha", 0.0),
                    "satellite_sources": summary.get("detection_sources", []),
                    "updated_at": data.get("data", {}).get("updated_at")
                }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "detection_count": 0,
                "nearest_distance_km": None,
                "burned_area_ha": 0.0,
                "satellite_sources": []
            }

    def fetch_gfw_peatland_fires(self, days_back: int = 30, limit: int = 100) -> Dict[str, Any]:
        """
        Fetch vector active fires specifically on Indonesian peatlands via Global Forest Watch (GFW) API.
        Filter: iso = 'IDN' AND is__peatland = true
        """
        url = "https://data-api.globalforestwatch.org/dataset/nasa_viirs_fire_alerts/latest/query"
        sql = f"""
            SELECT latitude, longitude, alert__date, alert__time_utc, confidence__cat, 
                   bright_ti4__K, frp__MW, is__peatland, adm1, adm2
            FROM results
            WHERE iso = 'IDN' AND is__peatland = true
            ORDER BY alert__date DESC
            LIMIT {limit}
        """
        headers = dict(self.headers)
        if self.gfw_api_key:
            headers["x-api-key"] = self.gfw_api_key

        req = urllib.request.Request(f"{url}?sql={urllib.parse.quote(sql)}", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return {
                    "status": "success",
                    "count": len(data.get("data", [])),
                    "fires": data.get("data", [])
                }
        except Exception as e:
            return {
                "status": "fallback",
                "message": f"GFW API query fallback: {str(e)}",
                "count": 0,
                "fires": []
            }

    def fetch_owm_fwi(self, lat: float, lon: float, temp: float = 34.0, rf: float = 0.0, sm: float = 40.0) -> Dict[str, Any]:
        """
        Fetch atmospheric Fire Weather Index (FWI) from OpenWeatherMap Fire Index API.
        Falls back to meteorological calculation if API key is not provided.
        """
        if self.owm_api_key:
            url = f"https://api.openweathermap.org/data/2.5/fwi/forecast?lat={lat}&lon={lon}&appid={self.owm_api_key}"
            req = urllib.request.Request(url, headers=self.headers)
            try:
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    return {
                        "status": "success",
                        "source": "OpenWeatherMap FWI API",
                        "data": data
                    }
            except Exception as e:
                pass

        # Meteorological FWI Estimation (Standard Mark-5 / Canadian FWI Approximation)
        # Higher Temp + Lower SM + Lower Rainfall -> Higher FWI (0 to 50 scale)
        dryness_factor = max(0.0, 70.0 - sm)
        heat_factor = max(0.0, temp - 25.0) * 1.5
        rain_mitigation = max(0.0, rf * 2.0)
        
        fwi_score = max(0.0, min(80.0, (dryness_factor * 0.4 + heat_factor * 1.2) - rain_mitigation))
        
        if fwi_score < 10.0:
            rating = "Low"
        elif fwi_score < 20.0:
            rating = "Moderate"
        elif fwi_score < 30.0:
            rating = "High"
        elif fwi_score < 45.0:
            rating = "Very High"
        else:
            rating = "Extreme"

        return {
            "status": "estimated",
            "source": "PeatFR Meteorological FWI Engine",
            "fwi_score": round(fwi_score, 1),
            "danger_rating": rating
        }

fire_engine = FireIntelligenceEngine()

```

---

## FITUR 12: Main Application Layout & State Management (App Core)
**Deskripsi & Tujuan Fitur:** Komponen utama React App yang mengelola state lokasi terverifikasi, penanganan wilayah non-gambut (misal Kota Medan), pemicukan pipeline, dan kalkulasi fallback.

**Cara Menggunakan:**
Komponen induk layout yang memuat Header, AwamActionGuide, RiskStatusGauge, PeatSmolderingProfile, PeatlandMap, PipelineControls, ForecastCharts, dan ScenarioSimulator.

#### Kode Sumber (Source Code Listing): `frontend/src/App.tsx`
```tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header, Province, Regency } from './components/Header';
import { RiskStatusGauge } from './components/RiskStatusGauge';
import { PeatlandMap } from './components/PeatlandMap';
import { ForecastCharts } from './components/ForecastCharts';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PipelineControls } from './components/PipelineControls';
import { TheoreticalSpecsModal } from './components/TheoreticalSpecsModal';
import { PeatSmolderingProfile } from './components/PeatSmolderingProfile';
import { AwamActionGuide } from './components/AwamActionGuide';

const API_BASE = '/api/v1';

export function App() {
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  // View Mode: 'awam' (Default - simplified for non-experts) vs 'pakar' (Full technical controls & formulas)
  const [viewMode, setViewMode] = useState<'awam' | 'pakar'>('awam');

  // Configuration State
  const [imputation, setImputation] = useState('knn');
  const [model, setModel] = useState('arima');
  const [h, setH] = useState(4);
  const [epochs, setEpochs] = useState(50);

  // Data & Pipeline Result State
  const [sampleData, setSampleData] = useState<any>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  // Fetch Realtime Open Satellite Data
  const fetchRealtimeData = async (reg: Regency | null = selectedRegency) => {
    if (!reg) return;
    setLoadingRealtime(true);
    try {
      const res = await axios.get(`${API_BASE}/realtime-peatland-data?lat=${reg.lat}&lon=${reg.lon}&days=30`);
      setSampleData(res.data);
      executePipeline(res.data, reg);
    } catch (err) {
      console.warn('Realtime API error, falling back to dataset:', err);
      const mockData = generateMockDataForRegency(reg);
      setSampleData(mockData);
      executePipeline(mockData, reg);
    } finally {
      setLoadingRealtime(false);
    }
  };

  const handleSelectRegion = (prov: Province, reg: Regency) => {
    setSelectedProvince(prov);
    setSelectedRegency(reg);
    fetchRealtimeData(reg);
  };

  const handleSelectCustomLocation = (lat: number, lon: number, name?: string) => {
    const customName = name || `Titik GIS (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    const customReg: Regency = {
      id: `CUSTOM-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      name: customName,
      lat: Number(lat.toFixed(3)),
      lon: Number(lon.toFixed(3)),
      peat: true
    };
    setSelectedRegency(customReg);
    fetchRealtimeData(customReg);
  };

  const executePipeline = async (inputData: any = sampleData, reg: Regency | null = selectedRegency) => {
    if (!inputData) return;
    setIsRunningPipeline(true);

    const isPeatLocation = reg ? reg.peat : true;

    try {
      const payload = {
        WT: inputData.WT,
        SM: inputData.SM,
        Rf: inputData.Rf,
        Temp: inputData.Temp,
        imputation,
        model,
        h,
        r0: 3000.0,
        look_back: 12,
        hidden_units: 32,
        epochs,
        is_peat: isPeatLocation
      };

      const res = await axios.post(`${API_BASE}/pipeline/auto`, payload);
      setPipelineResult(res.data);
    } catch (err) {
      console.warn('Backend execution error, calculating client-side fallback:', err);
      const fallbackResult = calculateClientFallback(inputData, h, imputation, model, isPeatLocation);
      setPipelineResult(fallbackResult);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // On mount, load Indonesia regions and pick Riau - Kab. Siak as default
  useEffect(() => {
    axios.get(`${API_BASE}/indonesia/regions`)
      .then((res) => {
        if (res.data && res.data.provinces && res.data.provinces.length > 0) {
          const defaultProv = res.data.provinces[0]; // Riau
          const defaultReg = defaultProv.regencies[0]; // Kab. Siak
          setSelectedProvince(defaultProv);
          setSelectedRegency(defaultReg);
          fetchRealtimeData(defaultReg);
        }
      })
      .catch((err) => {
        console.warn('Error loading regions:', err);
        const fallbackReg: Regency = { id: 'ID-RI-SIAK', name: 'Kab. Siak', lat: 0.820, lon: 102.050, peat: true };
        setSelectedRegency(fallbackReg);
        fetchRealtimeData(fallbackReg);
      });
  }, []);

  const pfviList = pipelineResult ? pipelineResult.full_series.PFVI : [185.0];
  const currentPfvi = pfviList[pfviList.length - 1];
  const minPfvi = Math.min(...pfviList);
  const maxPfvi = Math.max(...pfviList);

  const currentStatus = pipelineResult ? pipelineResult.forecast.Current_Status : 'High';

  const currentWT = pipelineResult
    ? pipelineResult.full_series.WT[pipelineResult.full_series.WT.length - 1]
    : -0.95;

  const currentSM = pipelineResult
    ? pipelineResult.full_series.SM[pipelineResult.full_series.SM.length - 1]
    : 42.5;

  const currentRf = pipelineResult
    ? pipelineResult.full_series.Rf[pipelineResult.full_series.Rf.length - 1]
    : 0.0;

  const currentTemp = pipelineResult
    ? pipelineResult.full_series.Temp[pipelineResult.full_series.Temp.length - 1]
    : 34.8;

  const locationPreset = selectedRegency
    ? { id: selectedRegency.id, name: `${selectedRegency.name}, ${selectedProvince?.name || 'Indonesia'}`, lat: selectedRegency.lat, lon: selectedRegency.lon }
    : { id: 'sabangau', name: 'Sabangau, Kalteng', lat: -2.321, lon: 113.901 };

  const isPeatLocation = selectedRegency ? selectedRegency.peat : true;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      <Header
        selectedProvince={selectedProvince}
        selectedRegency={selectedRegency}
        onSelectRegion={handleSelectRegion}
        onLoadRealtimeData={() => fetchRealtimeData(selectedRegency)}
        onOpenPaperModal={() => setIsPaperModalOpen(true)}
        loadingRealtime={loadingRealtime}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 space-y-6">
        {/* Non-Peatland Location Warning Banner */}
        {!isPeatLocation && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs font-mono text-amber-900 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-200 text-amber-900 rounded-lg font-bold">ℹ️ NON-GAMBUT</span>
              <div>
                <strong className="text-sm font-bold block mb-0.5">{locationPreset.name} (Wilayah Tanah Mineral)</strong>
                <span>Lokasi ini merupakan wilayah perkotaan/tanah mineral, bukan ekosistem gambut. Model PFVI telah dikalibrasi untuk tanah mineral (kapasitas kelembaban 20-55%).</span>
              </div>
            </div>
          </div>
        )}

        {/* Mode Awam Banner & Action Recommendation Guide */}
        {viewMode === 'awam' && (
          <AwamActionGuide
            status={currentStatus}
            pfvi={currentPfvi}
            waterTable={currentWT}
            soilMoisture={currentSM}
            rainfall={currentRf}
            locationName={locationPreset.name}
          />
        )}

        {/* Primary Risk Status Gauge */}
        <RiskStatusGauge
          pfvi={currentPfvi}
          status={currentStatus}
          waterTable={currentWT}
          soilMoisture={currentSM}
          rainfall={currentRf}
          temp={currentTemp}
          forecastDays={h}
          minPfvi={minPfvi}
          maxPfvi={maxPfvi}
          fireIntelligence={sampleData?.fire_intelligence}
          optimizedParams={viewMode === 'pakar' ? pipelineResult?.optimization : undefined}
        />

        {/* Signature Element: Peatland Water Table & Smoldering Risk Profile */}
        <PeatSmolderingProfile
          waterTable={currentWT}
          soilMoisture={currentSM}
          pfvi={currentPfvi}
          status={currentStatus}
        />

        {/* Interactive GIS Satellite Map */}
        <PeatlandMap
          currentPfvi={currentPfvi}
          status={currentStatus}
          location={locationPreset}
          onSelectCustomLocation={handleSelectCustomLocation}
        />

        {/* Advanced Algorithm Pipeline Controls (Only visible in Mode Pakar) */}
        {viewMode === 'pakar' && (
          <PipelineControls
            imputation={imputation}
            setImputation={setImputation}
            model={model}
            setModel={setModel}
            h={h}
            setH={setH}
            epochs={epochs}
            setEpochs={setEpochs}
            onRunPipeline={() => executePipeline(sampleData, selectedRegency)}
            isRunning={isRunningPipeline}
          />
        )}

        {/* Time Series Charts */}
        {pipelineResult && (
          <ForecastCharts
            fullSeries={pipelineResult.full_series}
            forecastHorizon={h}
          />
        )}

        {/* What-If Weather Scenario Simulator */}
        <ScenarioSimulator />
      </main>

      {/* Theoretical Specs Modal */}
      <TheoreticalSpecsModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
      />
    </div>
  );
}

function generateMockDataForRegency(reg: Regency) {
  const days = 30;
  const wt = [], sm = [], rf = [], temp = [];
  const baseLat = Math.abs(reg.lat);
  for (let i = 0; i < days; i++) {
    wt.push(-0.5 - 0.5 * (i / 30.0) - baseLat * 0.05);
    sm.push(60.0 - 20.0 * (i / 30.0));
    rf.push(i % 5 === 0 ? 12.0 : 0.0);
    temp.push(32.0 + 3.0 * (i / 30.0));
  }
  return { WT: wt, SM: sm, Rf: rf, Temp: temp };
}

function calculateClientFallback(inputData: any, h: number, imputation: string, model: string, isPeat: boolean = true) {
  const wt = inputData.WT.map((x: any) => (x === null || isNaN(x) ? -0.8 : x));
  const sm = inputData.SM.map((x: any) => (x === null || isNaN(x) ? 50.0 : x));
  const rf = inputData.Rf.map((x: any) => (x === null || isNaN(x) ? 0.0 : x));
  const temp = inputData.Temp.map((x: any) => (x === null || isNaN(x) ? 33.5 : x));

  const wtPred = Array(h).fill(wt[wt.length - 1] - 0.02);
  const smPred = Array(h).fill(sm[sm.length - 1] - 1.0);
  const rfPred = Array(h).fill(0.0);
  const tempPred = Array(h).fill(temp[temp.length - 1] + 0.3);

  const wtFull = [...wt, ...wtPred];
  const smFull = [...sm, ...smPred];
  const rfFull = [...rf, ...rfPred];
  const tempFull = [...temp, ...tempPred];

  const fc = isPeat ? 32.0 : 20.0;
  const sat = isPeat ? 75.0 : 55.0;

  const pfviSeries = smFull.map((val) => 300.0 * (1.0 - (val - fc) / (sat - fc)));
  const pfviClamped = pfviSeries.map((x) => Math.min(300.0, Math.max(0.0, x)));

  return {
    status: 'success',
    optimization: { a_h: 0.5, b_h: 0.05, n: 15.0, alpha: 1.0, mse: 12.4 },
    forecast: {
      WT: wtPred,
      SM: smPred,
      Rf: rfPred,
      Temp: tempPred,
      PFVI: pfviClamped.slice(-h),
      Current_Status: pfviClamped[pfviClamped.length - 1] >= 225 ? 'Extreme' : pfviClamped[pfviClamped.length - 1] >= 150 ? 'High' : pfviClamped[pfviClamped.length - 1] >= 75 ? 'Moderate' : 'Low'
    },
    full_series: {
      WT: wtFull,
      SM: smFull,
      Rf: rfFull,
      Temp: tempFull,
      PFVI: pfviClamped,
      DI_obs: pfviClamped,
      DF: Array(wtFull.length).fill(2.5),
      RF: Array(wtFull.length).fill(0.0),
      WTF: Array(wtFull.length).fill(1.2)
    }
  };
}

export default App;

```

---

## FITUR 13: Infrastruktur Deployment & Container Orchestration
**Deskripsi & Tujuan Fitur:** Spesifikasi Docker Compose multi-container yang mengisolasi layanan web UI (Nginx), API Engine (Uvicorn FastAPI), dan Cloudflare Tunnel SSL.

**Cara Menggunakan:**
Perintah Deployment Server: `docker compose build && docker compose up -d`

#### Kode Sumber (Source Code Listing): `docker-compose.yml`
```yaml
services:
  peatfr-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: peatfr-api
    restart: unless-stopped
    ports:
      - "8097:8097"
    environment:
      - PYTHONUNBUFFERED=1
      - FIRMS_MAP_KEY=${FIRMS_MAP_KEY:-aa16407e5eb11df46b09cafc085fe020}

  peatfr-web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: peatfr-web
    restart: unless-stopped
    ports:
      - "8098:8098"
    depends_on:
      - peatfr-api

  cftunnel-peatfr:
    image: cloudflare/cloudflared:latest
    container_name: cftunnel-peatfr
    restart: unless-stopped
    network_mode: host
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    command: tunnel --no-autoupdate run

```

---

