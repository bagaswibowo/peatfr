#!/usr/bin/env python3
"""Generate USER_MANUAL_PEATFR_v2.md from live source files + screenshot placeholders."""
import os, re, datetime

ROOT = "/opt/data/peatfr"
OUT = "/opt/data/peatfr/USER_MANUAL_PEATFR_v2.md"
SS_DIR = "/opt/data/peatfr/docs/screenshots"

def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read().rstrip("\n")

def code_block(rel, lang="python"):
    src = read(rel)
    return f"```{lang}\n{src}\n```"

def ss(name, caption):
    p = os.path.join(SS_DIR, name)
    if os.path.exists(p):
        return f"![{caption}]({p})\n\n*{caption}*\n"
    return f"*[Screenshot: {caption} — {name}]*\n"

today = "31 Agustus 2026"

header = """# DOKUMEN PENDOKUMENTASIAN HAK CIPTA PROGRAM KOMPUTER (DJKI KEMENKUMHAM RI)
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
| **Tanggal & Tempat Pertama Diumumkan** | **@@TODAY@@** di Bandung, Jawa Barat, Republik Indonesia |
| **Teknologi Stack** | **Python 3.13** (FastAPI, PyTorch, SciPy) & **React 18** (TypeScript, Vite, Leaflet GIS) |
| **URL Akses Sistem** | https://peatfr.bagaswibowo.app/ |

---

# 1. GAMBARAN UMUM APLIKASI

PeatFR (Peatland Fire Vulnerability Index & Early Warning System) adalah platform pemantauan dan peringatan dini berbasis web yang dirancang khusus untuk memetakan dan memprediksi risiko kebakaran lahan gambut tropis di Indonesia (*Mahdiyasa et al., 2025 — Ecological Informatics 92, DOI 10.1016/j.ecoinf.2025.103532*).

Aplikasi ini menghubungkan empat lapis data:
1. **Telemetri lingkungan realtime** — Open-Meteo / ERA5-Land (suhu maksimum, soil moisture 0–7 cm & 7–28 cm, presipitasi harian).
2. **Citra thermal satelit** — NASA FIRMS (VIIRS 375m SNPP/NOAA-20/NOAA-21 & MODIS) melalui MAP_KEY terotorisasi, plus overlay WMS NASA GIBS.
3. **Vector alert kebakaran gambut** — Global Forest Watch (GFW) untuk deteksi titik api spesifik di poligon lahan gambut Indonesia, serta agregasi FirePing (deteksi terdekat & area terbakar GWIS).
4. **Model kecerdasan buatan** — ARIMA (stokastik + Box-Cox), LSTM & GRU (PyTorch) untuk memproyeksikan Indeks Kerawanan Kebakaran Gambut (PFVI) hingga 14 hari ke depan, dikalibrasi dengan optimasi Nelder-Mead (SciPy).

Seluruh aplikasi berjalan dalam arsitektur container Docker (`peatfr-api`, `peatfr-web`, `cftunnel-peatfr`) dan dipublikasikan melalui Cloudflare Tunnel ke domain `https://peatfr.bagaswibowo.app/`.

---

# 2. TUJUAN UTAMA APLIKASI

1. **Deteksi dini kebakaran bawah permukaan (smoldering fire):** memantau penurunan Muka Air Tanah (TMA) hingga di bawah batas kritis regulasi PP No. 71/2014 (−0.4 m), karena kebakaran gambut tropis dominan terjadi pada lapisan akrotelm yang kering.
2. **Kuantifikasi kerawanan dengan indeks fisik terkalibrasi (PFVI):** mensimulasikan neraca air harian (evapotranspirasi DF, curah hujan efektif RF, kapilaritas tanah WTF) dan mengkalibrasi parameter hidrologi (a_H, b_H, n, α) terhadap Drought Index observasi dari soil moisture.
3. **Proyeksi multi-model AI:** memberikan forecast 4/7/14 hari ke depan menggunakan ARIMA + Box-Cox, LSTM, dan GRU, dengan kategori risiko Low (<75), Moderate (75–150), High (150–225), Extreme (≥225).
4. **Analisis lanjutan untuk peneliti/pakar (Mode Pakar):** kontrol penuh atas metode imputasi data missing (kNN, spline, LOESS, linear) dan hyperparameter model.
5. **Operasional mitigasi berbasis bukti:** peta satelit live interaktif, simulasi skenario "what-if", dan data fire-intelligence multi-sumber untuk koordinasi lapangan BPBD/Manggala Agni.

---

# 3. ARSITEKTUR SISTEM & DESAIN TEKNIS (SYSTEM ARCHITECTURE)

Sistem PeatFR dirancang menggunakan arsitektur 4-tier:

```
+-----------------------------------------------------------------------------------+
|                    1. EXTERNAL DATA PROVIDERS LAYER                               |
|  [Open-Meteo ERA5]  [NASA FIRMS WMS/API]  [GFW Peatland]  [FirePing/GWIS]        |
|  [NASA GIBS WMS]    [OpenWeather FWI]                                             |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    2. BACKEND COMPUTATION ENGINE (FastAPI container)              |
|  - Realtime Satellite Proxy & Hydrologic Telemetry Mapper (ESTIMATE WT/SM)        |
|  - Physical Engine (PFVI: DF evapotranspirasi, RF rain, WTF van Genuchten)        |
|  - SciPy Nelder-Mead Optimization with Physical Bounds (a_H, b_H >= 0)            |
|  - PyTorch Deep Learning (LSTM/GRU) & Stochastic ARIMA+Box-Cox Forecasting        |
|  - Multi-Source Fire Intelligence Aggregator (TTL-cached)                         |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    3. CONTAINER & INFRASTRUCTURE LAYER                            |
|  [peatfr-api: Python 3.13]  <-->  [peatfr-web: Nginx+Vite]  <-->  [Cloudflare     |
|   (FastAPI :8097)                (:8098, React 18)             Tunnel --network   |
|                                                                 host]             |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    4. CLIENT PRESENTATION LAYER (React 18 + Leaflet)             |
|  - Header Navigasi & Pemilih Lokasi Provinsi/Kabupaten                           |
|  - Risk Status Gauge & Fire Intelligence Cockpit (PFVI, FirePing, FWI, GWIS)     |
|  - Live GIS Satellite Map (NASA FIRMS WMS, VIIRS hotspots, GFW, GIBS, klik lokasi)|
|  - Pipeline Controls (imputasi, model AI, horizon) + Forecast Charts             |
|  - What-If Scenario Simulator & Spesifikasi Teoretis (Modal)                     |
+-----------------------------------------------------------------------------------+
```

### Persamaan Matematika Model Fisika PeatFR:
* **Laju Evapotranspirasi (DF_t):**
  DF_t = [(300 − PFVI_{t−1}) · (0.4982 · e^{0.0905·Tmax + 1.6096} − 4.268) · dt · 10⁻³] / [1 + 10.88 · e^{−0.0017358·R0}]
* **Faktor Curah Hujan Efektif (RF_t):** RF_t = max(0, Rf_t − 5.1) (interception kanopi 5.1 mm/hari)
* **Faktor Muka Air Tanah (WTF_t, van Genuchten):** WTF_t = a_H − b_H · (1 − θ(v)) · 300, dengan θ(v) = [1 + (v/α)ⁿ]^(1−1/n), v = kedalaman TMA (cm)
* **Drought Index Observasi (DI_obs):** DI = 300 · (1 − (SM − fc)/(sat − fc)), di-clip ke [0, 300]
* **Kendala Fisik Optimasi:** a_H ≥ 0, b_H ≥ 0, n > 1.05, α > 0.01

---

# 4. DOKUMENTASI API & SUMBER DATA (DATA SOURCES & APIS)

### A. Sumber Data Satelit Eksternal

| Provider & Dataset | Endpoint / Service URL | Variabel & Penggunaan |
|---|---|---|
| **Open-Meteo / ERA5-Land** | `https://api.open-meteo.com/v1/forecast` | Suhu max 2m, soil moisture (0–7cm, 7–28cm), presipitasi harian; timezone Asia/Jakarta |
| **NASA FIRMS Area API** | `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{source}/{bbox}/{days}` | Hotspot VIIRS 375m & MODIS: lat/lon, bright_ti4 (K), FRP (MW), confidence, daynight |
| **NASA FIRMS WMS** | `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/` | Layer thermal VIIRS 24j & MODIS 24j (MAP_KEY terotorisasi) |
| **NASA GIBS WMS** | `https://gibs.earthdata.nasa.gov/wms/epsg3857/` | Citra thermal anomalies VIIRS SNPP 375m pass siang & malam |
| **GFW Peatland Alerts** | `https://data-api.globalforestwatch.org/dataset/nasa_viirs_fire_alerts/latest/query` | Query SQL: `iso='IDN' AND is__peatland=true` — kebakaran pada lahan gambut |
| **FirePing Public API** | `https://fireping.net/api/public/v1/fires/near` | Deteksi api terdekat (≤25 km), jarak, burned area GWIS 7-hari (zero-key) |
| **OpenWeather FWI** | `https://api.openweathermap.org/data/2.5/fwi/forecast` | Fire Weather Index (opsional; fallback ke estimasi meteorologis internal) |

### B. Spesifikasi Internal REST API (FastAPI Engine — container `peatfr-api:8097`)

| HTTP Method & Route | Fungsi & Deskripsi Operasional |
|---|---|
| `GET /` | Root service info (status, service name, version, docs link) |
| `GET /api/v1/health` | Health check engine (status: ok) |
| `GET /api/v1/indonesia/regions` | Hirarki administrasi provinsi & kabupaten (JSON `indonesia_admin.json`) |
| `GET /api/v1/realtime-peatland-data?lat&lon&days` | Proxy telemetri Open-Meteo → deret WT/SM/Rf/Temp + fire intelligence (FirePing + FWI) |
| `GET /api/v1/fire-intelligence/nearby?lat&lon&radius_m` | Deteksi titik api terdekat & burned area (FirePing/GWIS) |
| `GET /api/v1/fire-intelligence/gfw-peatland-fires?limit` | Vector kebakaran gambut GFW (is__peatland=true, iso=IDN) |
| `GET /api/v1/fire-intelligence/firms-hotspots?bbox&source&day_range` | Hotspot NASA FIRMS via MAP_KEY (VIIRS_SNPP_NRT, MODIS_NRT, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT) |
| `GET /api/v1/fire-intelligence/severe-alerts` | Peringatan area kebakaran gambut parah Indonesia |
| `GET /api/v1/fire-intelligence/fwi?lat&lon` | Fire Weather Index (OpenWeather / estimasi meteorologis) |
| `GET /api/v1/sabangau-sample` | Dataset sampel 192 hari Sabangau (Kalteng) dengan missing data intrinsik |
| `POST /api/v1/impute` | Imputasi data missing: kNN, spline, LOESS, linear |
| `POST /api/v1/forecast` | Forecasting ARIMA/LSTM/GRU (h, look_back, hidden_units, epochs) |
| `POST /api/v1/pipeline/auto` | Pipeline penuh: imputasi → forecasting → optimasi Nelder-Mead → simulasi PFVI → kategori risiko |

---
"""

footer = """
---

# 6. LAMPIRAN INFRASTRUKTUR DEPLOYMENT

### docker-compose.yml
"""

body = []

# ---- FEATURES ----
body.append("""
# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG
""")

features = [
    ("FITUR 1", "Header Navigasi & Pemilih Lokasi (Provinsi/Kabupaten + Tombol Aksi)",
     "Komponen navigasi utama aplikasi. Menampilkan brand PeatFR dengan badge 'Fire Intelligence Light', informasi jurnal (Mahdiyasa et al., 2025), dropdown Provinsi & Kabupaten/Kota (dengan label '(Gambut)' untuk wilayah lahan gambut), tombol **Satelit Realtime** untuk memuat ulang data satelit, dan tombol **Spesifikasi Teoretis** untuk membuka modal metodologi jurnal.",
     "Cara Menggunakan:",
     ["Pilih **Provinsi** pada dropdown pertama (default: Riau).",
      "Pilih **Kabupaten/Kota** pada dropdown kedua (default: Kab. Siak — ditandai '(Gambut)').",
      "Tekan tombol **Satelit Realtime** untuk menarik ulang data Open-Meteo & fire intelligence lokasi terpilih.",
      "Tekan tombol **Spesifikasi Teoretis** untuk melihat metadata jurnal PeatFR dan daftar integrasi API satelit."],
     "frontend/src/components/Header.tsx", "tsx",
     "ss_header.png", "Header PeatFR: navigasi, pemilih lokasi, dan tombol aksi"),

    ("FITUR 2", "Cockpit Status Kerawanan (Risk Status Gauge) & Fire Intelligence",
     "Panel telemetri atas menampilkan nilai **Indeks Kerawanan Kebakaran Gambut (PFVI)** saat ini (0–300) dengan badge kategori risiko (LOW/MODERATE/HIGH/EXTREME), progress bar severity, hasil optimasi **Nelder-Mead** (a_H, b_H, n, α, MSE), tiga kartu fire intelligence (**FirePing Proximity** — jarak titik api terdekat & jumlah deteksi 24 jam; **GWIS 7-Day Burned Area** — estimasi area terbakar; **FWI** — Fire Weather Index & danger rating), serta empat panel telemetri lingkungan (**WT** muka air tanah, **SM** soil moisture, **Rf** curah hujan, **Temp** suhu maksimum) dengan ambang kritis masing-masing.",
     "Cara Menggunakan:",
     ["Amati angka PFVI besar dan badge warna untuk status kerawanan saat ini (proyeksi h-hari ke depan).",
      "Cek blok **Nelder-Mead Opt** untuk melihat parameter kalibrasi hidrologi hasil optimasi (MSE semakin kecil semakin baik).",
      "Periksa tiga kartu fire intelligence: jarak titik api terdekat (km), area terbakar (ha), dan skor FWI beserta danger rating.",
      "Pantau empat kolom telemetri: WT < −0.8 m = Kritis; SM < 45% = Tanah Kering; Rf < 5.1 mm = Tanpa Hujan Efektif; Temp > 34.5 °C = Suhu Tinggi."],
     "frontend/src/components/RiskStatusGauge.tsx", "tsx",
     "ss_gauge.png", "Risk Status Gauge: PFVI, Fire Intelligence Cockpit, dan telemetri lingkungan"),

    ("FITUR 3", "Peta Satelit Live Interaktif (NASA FIRMS, VIIRS 375m, GFW Gambut, GIBS)",
     "Peta GIS interaktif berbasis **Leaflet** dengan empat overlay satelit live yang dapat di-toggle: **FIRMS WMS (NASA Key)** — layer thermal VIIRS/MODIS 24 jam; **Hotspots API** — titik api vektor NASA FIRMS (VIIRS_SNPP_NRT) dengan jumlah hotspot hari ini; **GFW Vector Gambut** — titik api pada poligon lahan gambut Indonesia; **NASA GIBS 375m** — citra thermal anomalies VIIRS SNPP pass siang/malam. Marker lokasi stasiun berwarna sesuai risiko PFVI (hijau → merah). Pengguna dapat **klik titik mana pun di peta** untuk membuat target inspeksi baru, mendapatkan koordinat & jarak ke stasiun utama; aplikasi otomatis memuat ulang pipeline untuk koordinat tersebut (fly-to animasi).",
     "Cara Menggunakan:",
     ["Gunakan peta untuk melihat sebaran titik api di sekitar lokasi terpilih (marker oranye = FIRMS, merah = GFW).",
      "Klik tombol toggle di pojok kanan atas peta untuk mengaktifkan/menonaktifkan tiap lapisan satelit (jumlah hotspot tampil pada tombol **Hotspots API**).",
      "Klik sembarang titik pada peta — sebuah marker target biru muncul dan panel inspeksi menampilkan latitude/longitude & jarak ke stasiun; pipeline otomatis dijalankan untuk titik tersebut.",
      "Klik marker hotspot untuk melihat detail (brightness TI4, FRP, tanggal akuisisi, satelit, confidence, day/night)."],
     "frontend/src/components/PeatlandMap.tsx", "tsx",
     "ss_map.png", "Peta Satelit Live: overlay FIRMS WMS, hotspots API, GFW gambut, dan GIBS 375m"),

    ("FITUR 4", "Kontrol Algoritma Pipeline (Imputasi, Model Forecasting, Horizon) — Mode Pakar",
     "Panel konfigurasi pipeline eksperimen untuk peneliti: **Imputasi Data Missing** (kNN Gower Distance, Cubic Spline, LOESS Smoothing, Linear Interpolation), **Model Time Series Forecasting** (ARIMA + Box-Cox stokastik, LSTM PyTorch, GRU PyTorch), dan **Horizon Proyeksi** (4 hari default jurnal, 7 hari, 14 hari). Tombol **Jalankan Pipeline Auto** memicu backend `POST /api/v1/pipeline/auto` yang menjalankan imputasi → forecasting → optimasi Nelder-Mead → simulasi PFVI → klasifikasi risiko secara berantai.",
     "Cara Menggunakan:",
     ["Pilih metode imputasi (default: kNN) — digunakan bila data telemetri memiliki nilai kosong (NaN).",
      "Pilih model forecasting (default: ARIMA; LSTM/GRU melatih jaringan saraf di backend).",
      "Pilih horizon proyeksi (4/7/14 hari).",
      "Tekan **Jalankan Pipeline Auto** dan tunggu hasil (indikator spinner saat proses berjalan); hasil langsung memperbarui gauge, grafik, dan peta."],
     ["frontend/src/components/PipelineControls.tsx", "backend/main.py"], "tsx",
     "ss_pipeline.png", "Pipeline Controls: imputasi, model AI, dan horizon proyeksi"),

    ("FITUR 5", "Grafik Historis & Proyeksi Time-Series (Forecast Charts)",
     "Visualisasi recharts interaktif: grafik utama **PFVI observasi vs forecast** (garis hijau solid vs garis merah putus-putus) dengan zona ambang berwarna (Extreme ≥225, High 150–225, Moderate 75–150), garis referensi threshold, dan grafik pendukung deret **WT, SM, Rf, Temp** (historis + proyeksi). Data berasal dari `full_series` hasil pipeline (DF, RF, WTF, DI_obs, PFVI).",
     "Cara Menggunakan:",
     ["Amati grafik PFVI: bagian kiri (hijau) = observasi historis, bagian kanan (merah putus-putus) = proyeksi ke depan.",
      "Hover pada grafik untuk melihat tooltip nilai per hari (step H-…/H+…).",
      "Cek grafik pendukung WT/SM/Rf/Temp untuk melihat lintasan proyeksi tiap variabel hidrologi."],
     "frontend/src/components/ForecastCharts.tsx", "tsx",
     "ss_charts.png", "Grafik historis & proyeksi PFVI beserta deret WT/SM/Rf/Temp"),

    ("FITUR 6", "Simulator Skenario Cuaca What-If (Scenario Simulator)",
     "Alat simulasi hipotetis di sisi klien: pengguna menggeser empat slider — **Kenaikan Suhu** (+0…+5 °C), **Durasi Kemarau** (1–30 hari tanpa hujan), **Kedalaman Muka Air Tanah** (0.2–1.8 m), dan **PFVI Baseline Awal** (20–250) — lalu aplikasi menghitung ulang PFVI akhir setelah N hari kemarau menggunakan persamaan fisik PeatFR (DF evapotranspirasi, RF = 0, WTF van Genuchten dengan parameter kalibrasi Sabangau: a_H=6.5, b_H=0.02, n=18.2, α=0.9). Hasil menampilkan **PFVI Prediksi**, laju DF, dan WTF.",
     "Cara Menggunakan:",
     ["Geser slider **Kenaikan Suhu Udara** untuk mensimulasikan gelombang panas.",
      "Geser slider **Durasi Kemarau Tanpa Hujan** untuk jangka waktu kekeringan.",
      "Geser slider **Kedalaman Muka Air Tanah** — semakin dalam TMA, semakin besar kapilaritas yang hilang (WTF).",
      "Atur **PFVI Baseline Awal** lalu baca kotak hasil: PFVI prediksi setelah N hari dan komponen DF/WTF per hari."],
     "frontend/src/components/ScenarioSimulator.tsx", "tsx",
     "ss_simulator.png", "What-If Simulator: pengujian skenario suhu, kemarau, dan kedalaman TMA"),

    ("FITUR 7", "Modal Spesifikasi Teoretis (Metadata Jurnal & Integrasi API Satelit)",
     "Modal ringkasan metodologi: informasi publikasi jurnal PeatFR (*Ecological Informatics 92 (2025) 103532, Elsevier, DOI 10.1016/j.ecoinf.2025.103532*; penulis: Mahdiyasa, Melly, Pasaribu (ITB), Taufik (IPB), Muljadi (Univ. Nottingham)) dan daftar integrasi open satellite & hotspot data sources (NASA FIRMS, GIBS, GFW, Open-Meteo).",
     "Cara Menggunakan:",
     ["Klik tombol **Spesifikasi Teoretis** di header.",
      "Baca metadata jurnal (judul, penulis, jurnal, DOI) pada panel pertama.",
      "Gulir daftar integrasi API satelit pada panel kedua.",
      "Tekan tombol **X** atau area gelap di luar modal untuk menutup."],
     "frontend/src/components/TheoreticalSpecsModal.tsx", "tsx",
     "ss_modal.png", "Modal Spesifikasi Teoretis: metadata jurnal & integrasi API satelit"),
]

for fid, title, desc, howto_label, steps, code_refs, lang, ss_name, ss_caption in features:
    body.append(f"""
## {fid}: {title}

**Deskripsi & Tujuan Fitur:** {desc}

---

**{howto_label}**
""" + "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps)) + f"""

---

#### Kode Sumber (Source Code Listing): {', '.join(code_refs) if isinstance(code_refs, list) else code_refs}
""" + (code_block(code_refs, lang) if isinstance(code_refs, str) else "\n".join(f"`{c}`:\n\n" + code_block(c, lang) for c in code_refs)) + f"""

---
**Screenshot Aplikasi:**
""" + ss(ss_name, ss_caption))

# ---- BACKEND FEATURES ----
backend_features = [
    ("FITUR 8", "Backend API Routing & Telemetri Satelit Realtime (FastAPI Core)",
     "Server FastAPI (container `peatfr-api`) menyediakan 13 endpoint REST (lihat Bab 4.B) termasuk proxy telemetri Open-Meteo yang mengestimasi deret **WT** (dari soil moisture & presipitasi), **SM** (kombinasi bobot 0–7cm & 7–28cm), **Rf**, dan **Temp** dengan timezone Asia/Jakarta, lalu menggabungkan Fire Intelligence (FirePing nearby + FWI). Endpoint `/api/v1/pipeline/auto` adalah orkestrator pipeline lengkap: deteksi NaN → imputasi → forecasting → optimasi Nelder-Mead → simulasi PFVI → kategori risiko.",
     "Cara Menggunakan (Developer/API Consumer):",
     ["Jalankan container atau akses `https://peatfr.bagaswibowo.app/api/v1/health` untuk cek status.",
      "Panggil `GET /api/v1/realtime-peatland-data?lat=-2.321&lon=113.901&days=30` untuk deret telemetri + fire intelligence.",
      "Kirim `POST /api/v1/pipeline/auto` dengan JSON {WT, SM, Rf, Temp, imputation, model, h, ...} untuk pipeline penuh.",
      "Dokumentasi interaktif tersedia di `/docs` (Swagger UI)."],
     "backend/main.py", "python",
     "ss_api.png", "FastAPI Backend: routing API & pipeline auto (dokumentasi /docs)"),

    ("FITUR 9", "PeatFR Mathematical Engine & Optimasi Nelder-Mead (Physical Core)",
     "Inti matematis aplikasi: fungsi `calculate_df` (laju evapotranspirasi dari suhu maksimum & PFVI sebelumnya), `calculate_rf` (curah hujan efektif dengan interception 5.1 mm/hari), `calculate_wtf` (faktor muka air tanah menggunakan kurva retensi van Genuchten θ(v)), `calculate_di_obs` (drought index observasi dari soil moisture, dengan fc=40%/sat=70% untuk gambut), `simulate_pfvi` (simulasi rekursif PFVI 0–300 dengan konstrain fisik), dan `optimize_pfvi_parameters` (grid search awal multi-titik + minimasi Nelder-Mead terhadap MSE PFVI vs DI_obs).",
     "Cara Menggunakan (Peneliti):",
     ["Pahami persamaan fisika pada Bab 3 — DF menaikkan PFVI (kekeringan), RF menurunkan (hujan), WTF menurunkan (kapilaritas tanah basah).",
      "Optimasi dilakukan otomatis pada setiap pipeline; hasil (a_H, b_H, n, α, MSE) tampil pada panel Nelder-Mead.",
      "Ubah tipe lahan (gambut vs mineral) dengan memvariasikan fc/sat pada pemanggilan `calculate_di_obs`."],
     "backend/peatfr_engine/pfvi.py", "python",
     None, ""),

    ("FITUR 10", "Imputation Engine Data Missing (kNN, Spline, LOESS, Linear)",
     "Modul `imputation.py` menyediakan empat algoritma pengisian data kosong (NaN) pada deret time-series telemetri: **linear** (interpolasi pandas limit_direction='both'), **spline** (CubicSpline dengan ekstrapolasi; fallback linear jika < 4 titik valid), **loess** (LOWESS statsmodels dengan interpolasi; fallback linear jika < 10 titik valid), dan **kNN** (imputasi multivariat berbasis jarak Gower-like pada data ternormalisasi [0,1], rata-rata k tetangga terdekat + fallback interpolasi linear).",
     "Cara Menggunakan (Peneliti):",
     ["Pipeline otomatis mendeteksi NaN dan memanggil metode terpilih (default kNN).",
      "Pengujian mandiri: `POST /api/v1/impute` dengan array yang mengandung `null` pada WT/SM/Rf/Temp.",
      "Dataset sampel `/api/v1/sabangau-sample` sengaja mengandung NaN pada indeks 114–117 dan 145 untuk uji imputasi."],
     "backend/peatfr_engine/imputation.py", "python",
     None, ""),

    ("FITUR 11", "Forecasting Engine (ARIMA + Box-Cox & PyTorch LSTM/GRU)",
     "Modul `forecasting.py` mengimplementasikan tiga model: **ARIMA** (transformasi Box-Cox dengan shift positif bila ada nilai ≤ 0, pencarian AIC atas p∈{1,2}, d∈{0,1}, q∈{0,1,2}, inverse Box-Cox, fallback tren linear), **LSTM** dan **GRU** (jaringan saraf PyTorch 2-layer dengan hidden_units, look_back sliding window, training Adam lr=0.01 & MSELoss, prediksi autoregresif iteratif dengan update window). Fungsi `forecast_peatfr_variables` menjalankan keempat variabel (WT/SM/Rf/Temp) dengan model yang sama.",
     "Cara Menggunakan (Peneliti):",
     ["Pilih model di panel Pipeline Controls atau via `POST /api/v1/forecast` (field model: arima|lstm|gru).",
      "Ubah `look_back` (window), `hidden_units`, `epochs` untuk tuning LSTM/GRU.",
      "ARIMA dipilih default karena cepat & deterministik; LSTM/GRU direkomendasikan untuk dataset panjang (>30 titik)."],
     "backend/peatfr_engine/forecasting.py", "python",
     None, ""),

    ("FITUR 12", "Multi-Source Fire Intelligence Engine (Satellite Aggregator)",
     "Modul `fire_intelligence.py` mengagregasi 5 sumber data kebakaran dalam satu kelas `FireIntelligenceEngine` dengan **SimpleTTLCache 180 detik** (menghemat kuota API NASA): **NASA FIRMS Area API** (CSV hotspot VIIRS/MODIS, parsing header dinamis, MAP_KEY default `aa16407e…fe020`), **Severe Fire Alerts** (struktur peringatan Katingan/Kotim/Sabangau/Siak dengan estimasi area terbakar), **FirePing Public API** (deteksi terdekat, burned area GWIS), **GFW Data API** (query SQL `iso='IDN' AND is__peatland=true`), dan **OpenWeather FWI** (fallback estimasi meteorologis: dryness × 0.4 + heat × 1.2 − rain × 2.0, rating Low→Extreme).",
     "Cara Menggunakan (Developer):",
     ["Akses `/api/v1/fire-intelligence/nearby?lat&lon&radius_m=25000` untuk deteksi api terdekat.",
      "Akses `/api/v1/fire-intelligence/firms-hotspots?bbox=95,-11,141,6&source=VIIRS_SNPP_NRT&day_range=1` untuk hotspot nasional.",
      "Akses `/api/v1/fire-intelligence/gfw-peatland-fires?limit=100` untuk kebakaran spesifik lahan gambut.",
      "Akses `/api/v1/fire-intelligence/severe-alerts` untuk peringatan parah terstruktur.",
      "Nilai MAP_KEY dapat di-override via environment variable `FIRMS_MAP_KEY` pada container."],
     "backend/peatfr_engine/fire_intelligence.py", "python",
     None, ""),

    ("FITUR 13", "Main Application Layout & State Orchestration (App Core)",
     "Komponen root React `App.tsx` mengorkestrasi seluruh state aplikasi: pemilihan wilayah (provinsi/kabupaten), pengambilan data realtime (dengan **fallback mock data** bila API gagal), eksekusi pipeline (dengan **fallback kalkulasi klien** bila backend error), dan rendering berurutan: Header → RiskStatusGauge → PeatlandMap → PipelineControls → ForecastCharts → ScenarioSimulator → TheoreticalSpecsModal. Default wilayah: Riau – Kab. Siak (0.820, 102.050).",
     "Cara Menggunakan (Developer):",
     ["File ini adalah titik masuk state; tambahkan fitur baru dengan menambah komponen di blok `<main>`.",
      "Handler `handleSelectCustomLocation` dipanggil saat user mengklik peta — koordinat baru langsung memicu `fetchRealtimeData` & `executePipeline`."],
     "frontend/src/App.tsx", "tsx",
     None, ""),
]

for fid, title, desc, howto_label, steps, code_refs, lang, ss_name, ss_caption in backend_features:
    body.append(f"""
## {fid}: {title}

**Deskripsi & Tujuan Fitur:** {desc}

---

**{howto_label}**
""" + "\n".join(f"{i+1}. {s}" for i, s in enumerate(steps)) + f"""

---

#### Kode Sumber (Source Code Listing): {code_refs}
""" + code_block(code_refs, lang) + (f"\n---\n**Screenshot Aplikasi:**\n" + ss(ss_name, ss_caption) if ss_name else "\n"))

# ---- INFRA ----
body.append(f"""
## FITUR 14: Infrastruktur Deployment & Container Orchestration (Docker Compose + Cloudflare Tunnel)

**Deskripsi & Tujuan Fitur:** Infrastruktur container 3-layanan: `peatfr-api` (FastAPI, port 8097, env `FIRMS_MAP_KEY` dengan default `aa16407e5eb11df46b09cafc085fe020`), `peatfr-web` (Nginx + build Vite React, port 8098, `depends_on` API), dan `cftunnel-peatfr` (cloudflared, `network_mode: host`, memublikasikan layanan ke domain `peatfr.bagaswibowo.app` tanpa membuka port publik). Semua layanan `restart: unless-stopped`.

**Cara Menggunakan (Ops/Deploy):**
1. Salin `.env` berisi `FIRMS_MAP_KEY=...` dan `TUNNEL_TOKEN=...` (Cloudflare Tunnel token).
2. Jalankan `docker compose up -d --build` dari root proyek.
3. Verifikasi: `curl http://localhost:8097/api/v1/health` dan buka `https://peatfr.bagaswibowo.app/`.
4. Update kode → `docker compose up -d --build` (idempotent, zero-downtime via restart policy).

**Kode Sumber (Source Code Listing):**
""" + code_block("docker-compose.yml", "yaml") + """

`frontend/Dockerfile`:
""" + code_block("frontend/Dockerfile", "dockerfile") + """

`frontend/nginx.conf`:
""" + code_block("frontend/nginx.conf", "nginx") + """

`backend/Dockerfile`:
""" + code_block("backend/Dockerfile", "dockerfile") + """

`frontend/package.json` (dependensi sistem):
""" + code_block("frontend/package.json", "json"))

full = header + "\n".join(body) + footer + code_block("docker-compose.yml", "yaml")
full = full.replace("@@TODAY@@", today)

# write
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(full)
print(f"OK wrote {OUT} ({len(full)} chars, {full.count(chr(10))} lines)")
print("Screenshots embedded:", [n for n in os.listdir(SS_DIR)] if os.path.isdir(SS_DIR) else "NONE YET")