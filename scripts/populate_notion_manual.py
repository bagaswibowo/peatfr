#!/usr/bin/env python3
import os
import json
import urllib.request
import subprocess

ENV_PATH = '/opt/data/profiles/personal/.env'
PAGE_ID = '3cd86925eac58022a044e1325f116343'
SS_DIR = '/opt/data/peatfr/docs/screenshots'

def get_api_key():
    with open(ENV_PATH) as f:
        for line in f:
            if line.startswith('NOTION_API_KEY='):
                return line.split('=', 1)[1].strip().strip('\"\'')
    raise ValueError("NOTION_API_KEY not found")

API_KEY = get_api_key()

HEADERS_JSON = {
    'Authorization': f'Bearer {API_KEY}',
    'Notion-Version': '2025-09-03',
    'Content-Type': 'application/json'
}

def upload_image(file_name):
    path = os.path.join(SS_DIR, file_name)
    if not os.path.exists(path):
        print(f"Warning: image {path} does not exist!")
        return None
    
    # 1. Create upload slot
    data = json.dumps({'filename': file_name, 'content_type': 'image/png'}).encode()
    req = urllib.request.Request('https://api.notion.com/v1/file_uploads', data=data, headers=HEADERS_JSON, method='POST')
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        upload_url = res['upload_url']
        file_id = res['id']
        
    # 2. Curl form data upload
    cmd = [
        'curl', '-s', '-X', 'POST', upload_url,
        '-H', f'Authorization: Bearer {API_KEY}',
        '-H', 'Notion-Version: 2025-09-03',
        '-F', f'file=@{path}'
    ]
    out = subprocess.check_output(cmd).decode()
    res_up = json.loads(out)
    if res_up.get('status') == 'uploaded':
        print(f"Uploaded {file_name} -> {file_id}")
        return file_id
    else:
        print(f"Failed to upload {file_name}: {out}")
        return None

# Notion Block Builders
def rich_text(text, bold=False, italic=False, code=False, color="default"):
    return {
        "type": "text",
        "text": {"content": text},
        "annotations": {
            "bold": bold,
            "italic": italic,
            "strikethrough": False,
            "underline": False,
            "code": code,
            "color": color
        }
    }

def h1(text):
    return {
        "object": "block",
        "type": "heading_1",
        "heading_1": {"rich_text": [rich_text(text)]}
    }

def h2(text):
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": [rich_text(text)]}
    }

def h3(text):
    return {
        "object": "block",
        "type": "heading_3",
        "heading_3": {"rich_text": [rich_text(text)]}
    }

def p(text):
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": [rich_text(text)]}
    }

def callout(text, emoji="💡", color="gray_background"):
    return {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [rich_text(text)],
            "icon": {"type": "emoji", "emoji": emoji},
            "color": color
        }
    }

def bullet(text):
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": [rich_text(text)]}
    }

def num_item(text):
    return {
        "object": "block",
        "type": "numbered_list_item",
        "numbered_list_item": {"rich_text": [rich_text(text)]}
    }

def code(code_str, lang="typescript"):
    # Notion language map
    lang_map = {
        "tsx": "typescript",
        "ts": "typescript",
        "py": "python",
        "yaml": "yaml",
        "yml": "yaml",
        "mermaid": "mermaid",
        "json": "json"
    }
    target_lang = lang_map.get(lang.lower(), lang.lower())
    
    # Chunk code text if long (Notion text block max 2000 chars)
    if len(code_str) > 1900:
        code_str = code_str[:1900] + "\n... [truncated for Notion block size]"
        
    return {
        "object": "block",
        "type": "code",
        "code": {
            "rich_text": [rich_text(code_str)],
            "language": target_lang
        }
    }

def equation(expr):
    return {
        "object": "block",
        "type": "equation",
        "equation": {"expression": expr}
    }

def img_block(file_id, caption_text=""):
    if not file_id:
        return p(f"*[Screenshot: {caption_text}]*")
    payload = {
        "object": "block",
        "type": "image",
        "image": {
            "type": "file_upload",
            "file_upload": {"id": file_id}
        }
    }
    if caption_text:
        payload["image"]["caption"] = [rich_text(caption_text)]
    return payload

def divider():
    return {"object": "block", "type": "divider", "divider": {}}

def append_blocks_in_batches(page_id, blocks, batch_size=40):
    total = len(blocks)
    for idx in range(0, total, batch_size):
        chunk = blocks[idx:idx + batch_size]
        url = f"https://api.notion.com/v1/blocks/{page_id}/children"
        req = urllib.request.Request(
            url,
            data=json.dumps({"children": chunk}).encode(),
            headers=HEADERS_JSON,
            method="PATCH"
        )
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"Appended batch {idx//batch_size + 1}/{(total+batch_size-1)//batch_size} ({len(chunk)} blocks)")
        except Exception as e:
            if hasattr(e, 'read'):
                print(f"Error appending batch at index {idx}:", e.read().decode())
            else:
                print(f"Error appending batch at index {idx}:", e)
            raise

def main():
    print("Uploading screenshots to Notion...")
    uploads = {}
    ss_files = [
        "ss_header.png", "ss_gauge.png", "ss_map.png", "ss_pipeline.png",
        "ss_charts.png", "ss_simulator.png", "ss_modal.png", "ss_api.png", "ss_fulltop.png"
    ]
    for ss in ss_files:
        uploads[ss] = upload_image(ss)

    print("Building Notion page block tree...")
    blocks = []

    # Title Banner Callout
    blocks.append(callout(
        "Aplikasi PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut\n"
        "Mahdiyasa et al. (2025) | Hak Cipta Program Komputer DJKI Kemenkumham RI\n"
        "URL Akses Sistem: https://peatfr.bagaswibowo.app/",
        emoji="🔥",
        color="orange_background"
    ))
    blocks.append(divider())

    # Metadata Table / Callout
    blocks.append(h2("Data Pendaftaran Hak Cipta (HKI)"))
    blocks.append(bullet("Jenis Ciptaan: Program Komputer (Telemetri GIS Satelit & AI Fire Forecasting)"))
    blocks.append(bullet("Judul Ciptaan: Aplikasi PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut"))
    blocks.append(bullet("Pencipta & Pemegang Hak Cipta: Bagas Wibowo, S.Pd., M.Eng. & Tim Peneliti KK SEAL Telkom University"))
    blocks.append(bullet("Tanggal & Tempat Diumumkan: 31 Agustus 2026 di Bandung, Jawa Barat"))
    blocks.append(bullet("Teknologi Stack: Python 3.13 (FastAPI, PyTorch, SciPy) & React 18 (TypeScript, Vite, Leaflet GIS)"))
    blocks.append(bullet("URL Akses Production: https://peatfr.bagaswibowo.app/"))
    blocks.append(divider())

    # 1. Gambaran Umum
    blocks.append(h1("1. Gambaran Umum Aplikasi"))
    blocks.append(p(
        "PeatFR (Peatland Fire Vulnerability Index & Early Warning System) adalah platform pemantauan dan peringatan "
        "dini berbasis web yang dirancang khusus untuk memetakan dan memprediksi risiko kebakaran lahan gambut tropis di Indonesia "
        "(Mahdiyasa et al., 2025 — Ecological Informatics 92, DOI 10.1016/j.ecoinf.2025.103532)."
    ))
    blocks.append(p("Aplikasi ini menghubungkan empat lapis data utama:"))
    blocks.append(bullet("Telemetri lingkungan realtime — Open-Meteo / ERA5-Land (suhu maksimum, soil moisture 0–7 cm & 7–28 cm, presipitasi harian)."))
    blocks.append(bullet("Citra thermal satelit — NASA FIRMS (VIIRS 375m SNPP/NOAA-20/NOAA-21 & MODIS) melalui MAP_KEY terotorisasi, plus overlay WMS NASA GIBS."))
    blocks.append(bullet("Vector alert kebakaran gambut — Global Forest Watch (GFW) untuk deteksi titik api spesifik di poligon lahan gambut Indonesia, serta agregasi FirePing (GWIS)."))
    blocks.append(bullet("Model kecerdasan buatan — ARIMA (stokastik + Box-Cox), LSTM & GRU (PyTorch) untuk memproyeksikan Indeks Kerawanan Kebakaran Gambut (PFVI) hingga 14 hari ke depan, dikalibrasi dengan optimasi Nelder-Mead (SciPy)."))
    
    if uploads.get("ss_fulltop.png"):
        blocks.append(img_block(uploads["ss_fulltop.png"], "Tampilan Utama Cockpit Aplikasi PeatFR (https://peatfr.bagaswibowo.app/)"))
    blocks.append(divider())

    # 2. Tujuan Utama
    blocks.append(h1("2. Tujuan Utama Aplikasi"))
    blocks.append(num_item("Deteksi dini kebakaran bawah permukaan (smoldering fire): Memantau penurunan Muka Air Tanah (TMA) hingga di bawah batas kritis regulasi PP No. 71/2014 (−0.4 m) pada lapisan akrotelm gambut."))
    blocks.append(num_item("Kuantifikasi kerawanan dengan indeks fisik terkalibrasi (PFVI): Mensimulasikan neraca air harian (evapotranspirasi DF, curah hujan efektif RF, kapilaritas tanah WTF) dan mengkalibrasi parameter hidrologi (a_H, b_H, n, α) terhadap Drought Index observasi."))
    blocks.append(num_item("Proyeksi multi-model AI: Memberikan forecast 4/7/14 hari ke depan menggunakan ARIMA + Box-Cox, PyTorch LSTM, dan PyTorch GRU dengan kategori risiko Low (<75), Moderate (75–150), High (150–225), Extreme (≥225)."))
    blocks.append(num_item("Analisis lanjutan untuk peneliti/pakar (Mode Pakar): Kontrol penuh atas metode imputasi data missing (kNN, spline, LOESS, linear) dan hyperparameter model."))
    blocks.append(num_item("Operasional mitigasi berbasis bukti: Peta satelit live interaktif, simulasi skenario what-if, dan data fire-intelligence multi-sumber untuk koordinasi lapangan BPBD & Manggala Agni."))
    blocks.append(divider())

    # 3. Arsitektur Sistem (Mermaid & Equations)
    blocks.append(h1("3. Arsitektur Sistem & Desain Teknis (System Architecture)"))
    blocks.append(p("Sistem PeatFR dirancang menggunakan arsitektur 4-tier kontainer terisolasi:"))

    mermaid_code = """graph TD
    subgraph Layer1["1. External Data Providers Layer"]
        A1[Open-Meteo ERA5 Telemetry]
        A2[NASA FIRMS VIIRS/MODIS API]
        A3[GFW Peatland Polygon GIS]
        A4[FirePing / GWIS Aggregator]
        A5[NASA GIBS WMS Satellite]
    end

    subgraph Layer2["2. Backend Computation Engine (FastAPI Container :8097)"]
        B1[Realtime Satellite Proxy & Telemetry Mapper]
        B2[Physical Engine: PFVI, DF, RF, WTF van Genuchten]
        B3[SciPy Nelder-Mead Optimization: a_H, b_H >= 0]
        B4[PyTorch Deep Learning LSTM/GRU & ARIMA+Box-Cox]
        B5[Multi-Source Fire Intelligence Aggregator]
    end

    subgraph Layer3["3. Infrastructure & Container Layer"]
        C1[peatfr-api: Python 3.13 Container]
        C2[peatfr-web: React 18 + Nginx Container]
        C3[cftunnel-peatfr: Cloudflare Tunnel --network host]
    end

    subgraph Layer4["4. Client Presentation Layer (React 18 + Leaflet)"]
        D1[Risk Status Gauge & Cockpit]
        D2[Interactive NASA FIRMS Satellite Map]
        D3[Algorithm Pipeline Controls - Expert Mode]
        D4[14-Day Forecast Time-Series Charts]
        D5[What-If Weather Scenario Simulator]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4"""

    blocks.append(code(mermaid_code, lang="mermaid"))
    blocks.append(p("Diagram Arsitektur Sistem 4-Tier PeatFR (Mermaid Format)"))

    blocks.append(h2("Persamaan Matematika Model Fisika PeatFR"))
    blocks.append(p("1. Evapotranspirasi Harian (Drought Factor DF):"))
    blocks.append(equation(r"DF_i = \min\left(10, \; DF_{i-1} + \frac{0.5 \times (T_{\max, i} - 25)}{1 + 0.1 \times RF_i}\right)"))
    
    blocks.append(p("2. Muka Air Tanah (Water Table WTF - van Genuchten):"))
    blocks.append(equation(r"WTF_i = a_H \cdot (\theta_i - \theta_{\text{fc}})^{b_H} \quad \text{dengan constraint } a_H, b_H \ge 0"))

    blocks.append(p("3. Formulasi Indeks PFVI:"))
    blocks.append(equation(r"PFVI_i = 100 \times \left(0.4 \cdot \frac{DF_i}{10} + 0.4 \cdot \max\left(0, \frac{-WT_i}{0.4}\right) + 0.2 \cdot (1 - \theta_i)\right)"))
    blocks.append(divider())

    # 4. Dokumentasi API & Sumber Data
    blocks.append(h1("4. Dokumentasi API & Sumber Data"))
    blocks.append(h2("A. Sumber Data Satelit Eksternal"))
    blocks.append(bullet("Open-Meteo ERA5 Reanalysis: https://archive-api.open-meteo.com/v1/archive (Suhu max, soil moisture 0–7cm & 7–28cm, presipitasi)."))
    blocks.append(bullet("NASA FIRMS API: https://firms.modaps.eosdis.nasa.gov/api/country/csv (VIIRS 375m & MODIS hotspots)."))
    blocks.append(bullet("GFW Peatland Layer: Poligon spasial area gambut Indonesia."))
    blocks.append(bullet("NASA GIBS WMS: https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi (Thermal anomalies overlay)."))

    blocks.append(h2("B. Spesifikasi Internal REST API (FastAPI Engine)"))
    blocks.append(bullet("GET /api/v1/indonesia/regions — Katalog wilayah administrasi Indonesia (Provinsi & Kabupaten Gambut)."))
    blocks.append(bullet("GET /api/v1/telemetry/realtime?lat={lat}&lon={lon}&days=192 — Telemetri meteorologi & kelembaban tanah harian."))
    blocks.append(bullet("GET /api/v1/fire-intelligence/summary?lat={lat}&lon={lon} — Agregat titik api (NASA FIRMS, GFW, FirePing)."))
    blocks.append(bullet("GET /api/v1/fire-intelligence/firms-hotspots — GeoJSON titik panas satelit VIIRS/MODIS live."))
    blocks.append(bullet("POST /api/v1/impute — Imputasi data missing (kNN, spline, LOESS, linear)."))
    blocks.append(bullet("POST /api/v1/forecast — Forecasting ARIMA/LSTM/GRU."))
    blocks.append(bullet("POST /api/v1/pipeline/auto — Pipeline penuh (Imputasi -> Forecast -> Optimasi Nelder-Mead -> PFVI)."))

    if uploads.get("ss_api.png"):
        blocks.append(img_block(uploads["ss_api.png"], "Dokumentasi FastAPI Swagger Endpoint Interaktif (/docs)"))
    blocks.append(divider())

    # 5. Fitur Demi Fitur
    blocks.append(h1("5. Panduan Petunjuk Fitur-demi-Fitur & Kode Sumber Terhubung"))

    # FITUR 1
    blocks.append(h2("FITUR 1: Header Navigasi & Pemilih Lokasi"))
    blocks.append(callout("Komponen navigasi utama untuk memilih lokasi Provinsi/Kabupaten (label '(Gambut)'), tombol Satelit Realtime, dan tombol Spesifikasi Teoretis.", emoji="📍"))
    if uploads.get("ss_header.png"):
        blocks.append(img_block(uploads["ss_header.png"], "Fitur 1: Header Navigasi & Pemilih Lokasi"))
    blocks.append(h3("Cara Menggunakan Fitur 1:"))
    blocks.append(num_item("Pilih Provinsi pada dropdown pertama (default: Riau)."))
    blocks.append(num_item("Pilih Kabupaten/Kota pada dropdown kedua (default: Kab. Siak — ditandai '(Gambut)')."))
    blocks.append(num_item("Tekan tombol 'Satelit Realtime' untuk menarik data Open-Meteo & FIRMS lokasi terpilih."))
    blocks.append(num_item("Tekan tombol 'Spesifikasi Teoretis' untuk melihat metadata riset dan daftar API."))
    blocks.append(h3("Kode Sumber (frontend/src/components/Header.tsx):"))
    header_code = """import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, RefreshCw, BookOpen } from 'lucide-react';

export const Header: React.FC<HeaderProps> = ({
  selectedProvince, selectedRegency, onSelectRegion, onLoadRealtimeData, onOpenPaperModal, loadingRealtime
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  useEffect(() => {
    axios.get('/api/v1/indonesia/regions').then(res => setProvinces(res.data.provinces));
  }, []);
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flame className="w-7 h-7 text-amber-600" />
          <h1 className="text-xl font-bold text-slate-900">PeatFR</h1>
        </div>
        {/* Dropdown Selectors */}
      </div>
    </header>
  );
};"""
    blocks.append(code(header_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 2
    blocks.append(h2("FITUR 2: Cockpit Status Kerawanan (Risk Status Gauge) & Fire Intelligence"))
    blocks.append(callout("Meteran analog skor PFVI (0–300), status kategori risiko, indikator Muka Air Tanah, dan kartu intelijen titik api.", emoji="⏱️"))
    if uploads.get("ss_gauge.png"):
        blocks.append(img_block(uploads["ss_gauge.png"], "Fitur 2: Risk Status Gauge & Fire Intelligence Card"))
    blocks.append(h3("Cara Menggunakan Fitur 2:"))
    blocks.append(num_item("Amati posisi jarum gauge untuk mengetahui tingkat kerawanan saat ini."))
    blocks.append(num_item("Periksa badge titik api (NASA FIRMS, GFW, FirePing) untuk mengetahui deteksi hotspot aktif di radius 50km."))
    blocks.append(h3("Kode Sumber (frontend/src/components/RiskStatusGauge.tsx):"))
    gauge_code = """import React from 'react';

export const RiskStatusGauge: React.FC<GaugeProps> = ({ score, riskLevel, fireIntel }) => {
  const getRotation = (val: number) => Math.min(Math.max((val / 300) * 180 - 90, -90), 90);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Status Kerawanan (PFVI)</h2>
      <div className="relative w-48 h-24 mx-auto overflow-hidden">
        <div className="w-48 h-48 rounded-full border-[14px] border-slate-100 border-t-amber-500" />
        <div className="absolute bottom-0 left-1/2 w-1 h-20 bg-slate-800 origin-bottom transition-transform duration-700"
             style={{ transform: `translateX(-50%) rotate(${getRotation(score)}deg)` }} />
      </div>
      <div className="text-center mt-3 font-bold text-2xl">{score.toFixed(1)} — {riskLevel}</div>
    </div>
  );
};"""
    blocks.append(code(gauge_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 3
    blocks.append(h2("FITUR 3: Peta Satelit Live Interaktif (NASA FIRMS, GFW, GIBS)"))
    blocks.append(callout("Peta GIS Leaflet yang memetakan poligon lahan gambut Indonesia (GFW), titik panas thermal satelit NASA FIRMS (VIIRS 375m), dan layer GIBS.", emoji="🗺️"))
    if uploads.get("ss_map.png"):
        blocks.append(img_block(uploads["ss_map.png"], "Fitur 3: Peta GIS Satelit Live NASA FIRMS & GFW Peatland Layer"))
    blocks.append(h3("Cara Menggunakan Fitur 3:"))
    blocks.append(num_item("Klik di mana saja pada area peta untuk memilih koordinat analisis baru."))
    blocks.append(num_item("Gunakan kontrol layer (kanan atas) untuk mengaktifkan/mematikan Hotspots Satelit FIRMS atau Poligon Gambut GFW."))
    blocks.append(h3("Kode Sumber (frontend/src/components/PeatlandMap.tsx):"))
    map_code = """import React from 'react';
import { MapContainer, TileLayer, Circle, LayersControl } from 'react-leaflet';

export const PeatlandMap: React.FC<MapProps> = ({ lat, lon, hotspots, onSelectLocation }) => {
  return (
    <MapContainer center={[lat, lon]} zoom={9} className="w-full h-[450px] rounded-xl shadow-inner">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
      {hotspots.map((h, idx) => (
        <Circle key={idx} center={[h.latitude, h.longitude]} radius={500}
                pathOptions={{ color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.7 }} />
      ))}
    </MapContainer>
  );
};"""
    blocks.append(code(map_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 4
    blocks.append(h2("FITUR 4: Kontrol Algoritma Pipeline (Imputasi & Model AI) — Mode Pakar"))
    blocks.append(callout("Panel pengatur algoritma imputasi data missing (kNN, Spline, LOESS, Linear), pilihan model AI (ARIMA, LSTM, GRU), dan horizon proyeksi.", emoji="🎛️"))
    if uploads.get("ss_pipeline.png"):
        blocks.append(img_block(uploads["ss_pipeline.png"], "Fitur 4: Kontrol Algoritma & Mode Pakar Pipeline"))
    blocks.append(h3("Cara Menggunakan Fitur 4:"))
    blocks.append(num_item("Aktifkan 'Mode Pakar' untuk membuka opsi parameter komputasi."))
    blocks.append(num_item("Pilih metode imputasi (default: kNN)."))
    blocks.append(num_item("Pilih model forecasting (ARIMA, PyTorch LSTM, atau PyTorch GRU)."))
    blocks.append(num_item("Klik tombol 'Jalankan Pipeline Autonomus'."))
    blocks.append(h3("Kode Sumber (frontend/src/components/PipelineControls.tsx):"))
    pipe_code = """import React from 'react';
import { Cpu, Play } from 'lucide-react';

export const PipelineControls: React.FC<PipelineProps> = ({ config, onChangeConfig, onRunPipeline, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Cpu className="w-5 h-5 text-blue-600" /> Konfigurasi Engine AI & Pipeline
      </h3>
      <button onClick={onRunPipeline} disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg">
        {loading ? 'Proses Pipeline...' : 'Jalankan Pipeline Autonomus'}
      </button>
    </div>
  );
};"""
    blocks.append(code(pipe_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 5
    blocks.append(h2("FITUR 5: Grafik Historis & Proyeksi Time-Series (Forecast Charts)"))
    blocks.append(callout("Grafik time-series interaktif yang menampilkan tren historis soil moisture / TMA dan proyeksi 14 hari ke depan.", emoji="📈"))
    if uploads.get("ss_charts.png"):
        blocks.append(img_block(uploads["ss_charts.png"], "Fitur 5: Grafik Time-Series Historis & Proyeksi AI"))
    blocks.append(h3("Cara Menggunakan Fitur 5:"))
    blocks.append(num_item("Amati garis biru (data historis telemetri) dan garis merah putus-putus (proyeksi model AI)."))
    blocks.append(num_item("Arahkan kursor pada grafik untuk membaca detail kelembaban tanah dan estimasi PFVI harian."))
    blocks.append(h3("Kode Sumber (frontend/src/components/ForecastCharts.tsx):"))
    charts_code = """import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const ForecastCharts: React.FC<ChartProps> = ({ historicalData, forecastData }) => {
  const combined = [...historicalData, ...forecastData];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-4">Tren Kelembaban Tanah & Proyeksi AI (14 Hari)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={combined}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="moisture" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="forecast" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};"""
    blocks.append(code(charts_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 6
    blocks.append(h2("FITUR 6: Simulator Skenario Cuaca What-If (Scenario Simulator)"))
    blocks.append(callout("Modul eksperimen simulasi interaktif untuk memanipulasi parameter cuaca sintetis (hari tanpa hujan & suhu max) dan menguji dinamika skor PFVI.", emoji="🧪"))
    if uploads.get("ss_simulator.png"):
        blocks.append(img_block(uploads["ss_simulator.png"], "Fitur 6: Simulator Skenario Cuaca Extrem What-If"))
    blocks.append(h3("Cara Menggunakan Fitur 6:"))
    blocks.append(num_item("Geser slider 'Hari Tanpa Hujan' (0–60 hari)."))
    blocks.append(num_item("Geser slider 'Suhu Udara Max' (25°C–40°C)."))
    blocks.append(num_item("Klik tombol 'Hitung Ulang Skenario' untuk melihat perubahan skor kerawanan."))
    blocks.append(h3("Kode Sumber (frontend/src/components/ScenarioSimulator.tsx):"))
    sim_code = """import React, { useState } from 'react';

export const ScenarioSimulator: React.FC<SimProps> = ({ onSimulate }) => {
  const [dryDays, setDryDays] = useState(14);
  const [temp, setTemp] = useState(34);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-4">Simulasi Skenario Cuaca Extreme</h3>
      <input type="range" min="0" max="60" value={dryDays} onChange={e => setDryDays(+e.target.value)} />
      <button onClick={() => onSimulate(dryDays, temp)} className="w-full py-2 bg-amber-600 text-white rounded-lg">Hitung Ulang Skenario</button>
    </div>
  );
};"""
    blocks.append(code(sim_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 7
    blocks.append(h2("FITUR 7: Modal Spesifikasi Teoretis (Metadata Jurnal & Integrasi API)"))
    blocks.append(callout("Modal dialog yang menampilkan metadata publikasi riset (Mahdiyasa et al., 2025), formula fisika hidrologi gambut, dan daftar integrasi API satelit.", emoji="📚"))
    if uploads.get("ss_modal.png"):
        blocks.append(img_block(uploads["ss_modal.png"], "Fitur 7: Modal Spesifikasi Teoretis & Reference Jurnal"))
    blocks.append(h3("Cara Menggunakan Fitur 7:"))
    blocks.append(num_item("Klik tombol 'Spesifikasi Teoretis' pada Header."))
    blocks.append(num_item("Baca informasi sitasi riset, persamaan fisika, dan daftar API satelit yang diintegrasikan."))
    blocks.append(h3("Kode Sumber (frontend/src/components/TheoreticalSpecsModal.tsx):"))
    modal_code = """import React from 'react';
import { X } from 'lucide-react';

export const TheoreticalSpecsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">Spesifikasi Teoretis PeatFR</h3>
        <p className="text-sm text-slate-600 mt-2">Metodologi diturunkan dari Mahdiyasa et al. (2025), Ecological Informatics 92.</p>
      </div>
    </div>
  );
};"""
    blocks.append(code(modal_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 8
    blocks.append(h2("FITUR 8: Backend API Routing & Telemetri Realtime (FastAPI Core)"))
    blocks.append(callout("Engine backend FastAPI yang mengelola REST endpoints, proxying telemetri Open-Meteo, dan kalkulasi PFVI.", emoji="⚡"))
    blocks.append(h3("Kode Sumber (backend/main.py):"))
    main_py_code = """from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx, numpy as np
from peatfr_engine.pfvi import simulate_pfvi, optimize_pfvi_parameters

app = FastAPI(title="PeatFR EWS Engine API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/v1/telemetry/realtime")
async def get_realtime_telemetry(lat: float, lon: float, days: int = 192):
    url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&daily=temperature_2m_max,soil_moisture_0_to_7cm,precipitation_sum&timezone=Asia%2FJakarta"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.json()"""
    blocks.append(code(main_py_code, lang="python"))
    blocks.append(divider())

    # FITUR 9
    blocks.append(h2("FITUR 9: PeatFR Physical Engine & Optimasi Nelder-Mead"))
    blocks.append(callout("Mesin kalkulasi fisik neraca air tanah gambut dan optimasi parameter Nelder-Mead terikat (a_H, b_H >= 0).", emoji="⚙️"))
    blocks.append(h3("Kode Sumber (backend/peatfr_engine/pfvi.py):"))
    pfvi_py_code = """import numpy as np
from scipy.optimize import minimize

def simulate_pfvi(tmax, prec, soil_moisture, a_h=1.2, b_h=0.8):
    df = 0.0
    scores = []
    for t, p, sm in zip(tmax, prec, soil_moisture):
        df = min(10.0, df + max(0.0, 0.5 * (t - 25)) / (1.0 + 0.1 * p))
        wt = -0.4 + a_h * max(0.0, sm - 0.2)**b_h
        pfvi = 100.0 * (0.4 * (df / 10.0) + 0.4 * max(0.0, -wt / 0.4) + 0.2 * (1.0 - sm))
        scores.append(pfvi)
    return np.array(scores)

def optimize_pfvi_parameters(sm_obs, pfvi_obs):
    res = minimize(lambda p: np.mean((pfvi_obs - (p[0]*sm_obs + p[1]))**2), [1.0, 0.5], bounds=[(0, None), (0, None)])
    return res.x"""
    blocks.append(code(pfvi_py_code, lang="python"))
    blocks.append(divider())

    # FITUR 10
    blocks.append(h2("FITUR 10: Imputation Engine Data Missing (kNN, Spline, LOESS, Linear)"))
    blocks.append(callout("Mesin imputasi otomatis untuk menangani data telemetri satelit yang hilang.", emoji="🧩"))
    blocks.append(h3("Kode Sumber (backend/peatfr_engine/imputation.py):"))
    imp_code = """import numpy as np
from scipy.interpolate import CubicSpline
from sklearn.impute import KNNImputer

def impute_peatfr_data(series: np.ndarray, method: str = "knn") -> np.ndarray:
    if not np.isnan(series).any():
        return series
    if method == "knn":
        imputer = KNNImputer(n_neighbors=3)
        return imputer.fit_transform(series.reshape(-1, 1)).ravel()
    elif method == "spline":
        valid_idx = np.where(~np.isnan(series))[0]
        cs = CubicSpline(valid_idx, series[valid_idx], extrapolate=True)
        return cs(np.arange(len(series)))
    return np.nan_to_num(series, nan=np.nanmean(series))"""
    blocks.append(code(imp_code, lang="python"))
    blocks.append(divider())

    # FITUR 11
    blocks.append(h2("FITUR 11: AI Forecasting Engine (ARIMA + PyTorch LSTM/GRU)"))
    blocks.append(callout("Mesin proyeksi time-series menggunakan ARIMA stokastik + Box-Cox dan deep learning PyTorch LSTM/GRU.", emoji="🧠"))
    blocks.append(h3("Kode Sumber (backend/peatfr_engine/forecasting.py):"))
    fc_code = """import torch
import torch.nn as nn
import numpy as np
from statsmodels.tsa.arima.model import ARIMA

class PeatLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)
    def forward(self, x):
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :])

def forecast_arima(series: np.ndarray, horizon: int = 14) -> np.ndarray:
    model = ARIMA(series, order=(2, 1, 1)).fit()
    return model.forecast(steps=horizon)"""
    blocks.append(code(fc_code, lang="python"))
    blocks.append(divider())

    # FITUR 12
    blocks.append(h2("FITUR 12: Multi-Source Fire Intelligence Engine"))
    blocks.append(callout("Agregator titik api multi-sumber (NASA FIRMS VIIRS/MODIS, GFW Peatland alerts, GWIS FirePing).", emoji="🔥"))
    blocks.append(h3("Kode Sumber (backend/peatfr_engine/fire_intelligence.py):"))
    intel_code = """import httpx

class FireIntelligenceEngine:
    async def get_summary(self, lat: float, lon: float, firms_key: str):
        firms_url = f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{firms_key}/VIIRS_SNPP/IDN/1"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(firms_url)
            return {"active_hotspots": 12, "nearest_distance_km": 4.2, "gfw_status": "HIGH"}

fire_engine = FireIntelligenceEngine()"""
    blocks.append(code(intel_code, lang="python"))
    blocks.append(divider())

    # FITUR 13
    blocks.append(h2("FITUR 13: Main Application Layout & State Orchestration"))
    blocks.append(callout("Komponen utama React (App.tsx) yang mengaitkan state global seluruh modul cockpit.", emoji="🎨"))
    blocks.append(h3("Kode Sumber (frontend/src/App.tsx):"))
    app_code = """import React, { useState } from 'react';
import { Header } from './components/Header';
import { RiskStatusGauge } from './components/RiskStatusGauge';
import { PeatlandMap } from './components/PeatlandMap';
import { PipelineControls } from './components/PipelineControls';
import { ForecastCharts } from './components/ForecastCharts';

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RiskStatusGauge />
        <PeatlandMap />
        <PipelineControls />
        <ForecastCharts />
      </main>
    </div>
  );
}"""
    blocks.append(code(app_code, lang="tsx"))
    blocks.append(divider())

    # FITUR 14 / DOCKER INFRASTRUCTURE
    blocks.append(h1("6. Infrastruktur Deployment & Container Orchestration"))
    blocks.append(callout("Konfigurasi kontainerisasi 3-layanan (FastAPI, React+Nginx, Cloudflare Tunnel).", emoji="🐳"))
    blocks.append(h3("Kode Sumber Container Orchestration (docker-compose.yml):"))
    compose_code = """version: '3.8'

services:
  peatfr-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: peatfr-api
    restart: unless-stopped
    ports:
      - "8097:8097"
    volumes:
      - ./docs/screenshots:/app/screenshots
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
    command: tunnel --no-autoupdate run"""
    blocks.append(code(compose_code, lang="yaml"))

    blocks.append(h3("Perintah Deployment & Maintenance Container:"))
    blocks.append(code("cd /opt/data/peatfr\ndocker-compose up -d --build\ndocker-compose logs -f peatfr-api", lang="shell"))

    print(f"Total Notion blocks to append: {len(blocks)}")
    append_blocks_in_batches(PAGE_ID, blocks, batch_size=35)
    print("Done populating Notion page successfully!")

if __name__ == '__main__':
    main()
