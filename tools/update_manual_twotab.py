#!/usr/bin/env python3
"""Collapse the PeatFR manual's feature chapters from four tabs to two.

Tab layout changed: Ringkasan + Peta + Tren merged into one 'Pemantauan' tab with
in-tab section chips; only 'Simulasi' remains separate. This rewrites the feature
chapters accordingly and re-embeds the new screenshots. Run from the repo root.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANUAL = os.path.join(ROOT, "USER_MANUAL_PEATFR.md")

FEATURES = [
    (
        "FITUR 1: Bilah Atas, Pemilih Wilayah Global, & Mode Tampilan",
        "Bilah atas menyatukan identitas aplikasi, pemilih wilayah target, tombol tarik ulang "
        "telemetri, sakelar mode terang/gelap, dan tautan spesifikasi jurnal. Pemilih wilayah "
        "sengaja diletakkan di sini karena lokasi adalah state global yang memengaruhi kedua tab.",
        [
            "Buka **https://peatfr.bagaswibowo.app**.",
            "Pilih wilayah target dari dropdown **Provinsi / Kabupaten** di bilah atas. Kabupaten "
            "bertanda **(Gambut)** memakai konstanta retensi air gambut (FC 32%, saturasi 75%); "
            "wilayah tanpa tanda memakai konstanta tanah mineral (FC 20%, saturasi 55%).",
            "Perubahan wilayah langsung memicu penarikan telemetri Open-Meteo ERA5-Land dan "
            "menjalankan ulang pipeline PFVI secara otomatis.",
            "Klik ikon **panah melingkar** di kanan dropdown untuk menarik ulang telemetri tanpa "
            "mengganti wilayah.",
            "Klik **Mode terang / Mode gelap** untuk berpindah tema. Pilihan tema tidak mengubah data.",
            "Klik **Spesifikasi Jurnal** untuk membuka modal ringkasan metodologi (render KaTeX).",
        ],
        ["frontend/src/components/Header.tsx"],
        "00-header.png",
        "Bilah atas PeatFR: pemilih wilayah global, tarik ulang telemetri, mode tampilan, dan dua tab operasional",
    ),
    (
        "FITUR 2: Tab Pemantauan — Status Kerawanan PFVI",
        "Tab Pemantauan memuat seluruh alur pemantauan dalam satu layar kerja. Blok pertamanya "
        "menjawab pertanyaan paling mendesak: seberapa berbahaya kondisi hari ini di wilayah "
        "terpilih. Tab ini juga menyediakan chip navigasi bagian (Status, Peringatan, Peta, "
        "Proyeksi) sehingga pengguna dapat melompat langsung tanpa menggulir panjang.",
        [
            "Tab **Pemantauan** terbuka secara default saat aplikasi dimuat.",
            "Gauge tengah menampilkan **skor PFVI** skala 0 sampai 300 beserta kategorinya "
            "(Rendah < 75, Sedang 75-150, Tinggi 150-225, Ekstrem > 225).",
            "Empat angka di bawah narasi menampilkan muka air tanah (m), kelembapan tanah (%), "
            "FWI cuaca, dan status pembaruan satelit.",
            "Panel kanan menampilkan kesesuaian model (MSE hasil optimasi Nelder-Mead), proksimitas "
            "titik api radius 25 km, area terbakar FirePing, horizon proyeksi, dan sumber telemetri.",
            "Gunakan chip **Status / Peringatan / Peta / Proyeksi** di bawah tab bar untuk melompat "
            "ke bagian yang dituju.",
            "Bila sumber data tidak dapat dihubungi, aplikasi menampilkan banner merah dan menahan "
            "angka risiko kosong alih-alih menampilkan nilai perkiraan.",
        ],
        ["frontend/src/components/RiskStatusGauge.tsx"],
        "01a-status.png",
        "Bagian Status tab Pemantauan: gauge PFVI, narasi kerawanan, dan panel kesesuaian model",
    ),
    (
        "FITUR 3: Tab Pemantauan — Peringatan Aktif Klaster Hotspot",
        "Daftar peringatan hasil klaster titik panas NASA FIRMS pada zona gambut. Ini satu-satunya "
        "tempat teks peringatan ditampilkan, sehingga pengguna tidak menemukan informasi yang sama "
        "di dua tempat berbeda.",
        [
            "Bagian **Peringatan aktif** mendaftar setiap klaster titik panas pada zona gambut dalam "
            "24 jam terakhir, diurutkan dari FRP tertinggi.",
            "Setiap baris menampilkan tingkat bahaya (Kebakaran parah / Anomali termal tinggi / "
            "Waspada gambut), wilayah, jumlah deteksi, FRP maksimum, dan luas terbakar bila tersedia.",
            "Angka pada label tab Pemantauan adalah jumlah klaster aktif.",
            "Klik **Lihat di peta** pada baris mana pun untuk memfokuskan peta ke koordinat klaster "
            "tersebut dan menggulir ke bagian Peta.",
            "Bila tidak ada klaster dalam 24 jam terakhir, aplikasi menampilkan status aman, bukan "
            "daftar kosong tanpa penjelasan.",
        ],
        ["frontend/src/components/ActiveAlerts.tsx"],
        "01b-peringatan.png",
        "Bagian Peringatan tab Pemantauan: daftar klaster hotspot zona gambut terurut FRP",
    ),
    (
        "FITUR 4: Tab Pemantauan — Peta Titik Panas & Inspektor Hotspot",
        "Peta GIS berbasis Esri World Imagery dengan layer thermal NASA FIRMS terotorisasi, hotspot "
        "vector, dan atribusi zona gambut. Inspektor di sisi kanan menampilkan rincian setiap titik "
        "yang dipilih.",
        [
            "Gulir ke bagian **Peta** atau klik chip Peta di bawah tab bar.",
            "Aktifkan atau matikan layer lewat tombol di kanan atas peta: **FIRMS WMS (NASA Key)**, "
            "**Hotspots API** (jumlah deteksi vector), dan **Zona Gambut** (deteksi yang "
            "diatribusikan ke kabupaten gambut terdekat, maksimum 75 km).",
            "Klik titik mana pun pada peta untuk mengambil koordinat dan menarik telemetri titik "
            "tersebut; peta memfokus ulang ke lokasi baru.",
            "Klik marker hotspot (oranye/merah) untuk melihat tanggal-jam akuisisi UTC, kecerahan "
            "T_i4 (K), daya FRP (MW), satelit pengawas, dan jarak ke stasiun utama.",
            "Panel **Inspektor Titik Panas** di kanan menampilkan rincian titik terpilih beserta "
            "tombol **Fokuskan Telemetri ke Titik Ini**.",
            "Legenda di bawah inspektor menjelaskan ambang warna marker: Rendah < 75, Sedang 75-150, "
            "Tinggi 150-225, Ekstrem > 225.",
        ],
        ["frontend/src/components/PeatlandMap.tsx"],
        "01c-peta.png",
        "Bagian Peta tab Pemantauan: layer NASA FIRMS, marker hotspot, dan Inspektor Titik Panas",
    ),
    (
        "FITUR 5: Tab Pemantauan — Konfigurasi Model & Grafik Proyeksi",
        "Bagian Proyeksi menggabungkan panel konfigurasi algoritma (untuk pengguna pakar) dengan "
        "grafik historis dan proyeksi PFVI, ditambah empat grafik variabel pendukung.",
        [
            "Pilih **Imputasi data kosong**: kNN (Gower Distance), Cubic Spline, LOESS, atau Linear.",
            "Pilih **Model proyeksi**: ARIMA + Box-Cox, LSTM (PyTorch), atau GRU (PyTorch).",
            "Pilih **Horizon proyeksi**: 4, 7, atau 14 hari.",
            "Klik **Hitung ulang proyeksi** untuk menjalankan ulang imputasi, forecasting, dan "
            "optimasi parameter Nelder-Mead.",
            "Grafik **Historis & proyeksi PFVI** menampilkan garis solid untuk observasi dan garis "
            "putus-putus untuk proyeksi, dengan pita warna ambang risiko.",
            "Panel **Variabel pendukung** menampilkan muka air tanah, kelembapan tanah, curah hujan, "
            "dan suhu maksimum sebagai grafik kecil.",
        ],
        ["frontend/src/components/PipelineControls.tsx", "frontend/src/components/ForecastCharts.tsx"],
        "01d-proyeksi.png",
        "Bagian Proyeksi tab Pemantauan: konfigurasi model, sinyal penggerak, dan grafik PFVI historis-proyeksi",
    ),
    (
        "FITUR 6: Tab Simulasi — Skenario Bagaimana Jika",
        "Simulator interaktif untuk menguji dampak kenaikan suhu, durasi kemarau, dan kedalaman muka "
        "air tanah terhadap PFVI. Simulator memakai parameter hidrologi hasil kalibrasi pipeline "
        "untuk wilayah terpilih, dan jatuh ke nilai default jurnal Sabangau hanya bila pipeline "
        "belum menghasilkan parameter.",
        [
            "Buka tab **Simulasi**.",
            "Geser **Kenaikan suhu udara** (0-6 derajat Celsius) dan **Durasi kemarau tanpa hujan** "
            "(0-30 hari).",
            "Geser **Kedalaman muka air tanah** (0-3 m) sesuai skenario drainase yang ingin diuji.",
            "Geser **PFVI dasar awal** bila ingin memulai dari kondisi hipotetis, bukan kondisi "
            "terkini.",
            "Baca **Proyeksi PFVI setelah periode simulasi** beserta selisih terhadap dasar dan "
            "kategorinya.",
            "Angka **Evapotranspirasi rata-rata (DF)** dan **Serapan muka air (WTF)** di bawahnya "
            "adalah rata-rata harian yang benar-benar dihitung model selama periode simulasi.",
        ],
        ["frontend/src/components/ScenarioSimulator.tsx"],
        "02-simulasi.png",
        "Tab Simulasi: skenario bagaimana jika dengan parameter hidrologi terkalibrasi",
    ),
]

MOBILE = ("05-mobile.png", "Tampilan mobile 390px: bilah atas, dua tab, dan chip navigasi bagian tetap rapi tanpa overflow horizontal")

# Chapter headers that follow the frontend features (kept, renumbered). Process in
# reverse so a freshly written number can never collide with an unprocessed marker.
KEEP = [
    ("## FITUR 10: Infrastruktur Deployment", 11),
    ("## FITUR 9: Main Application", 10),
    ("## FITUR 8: Multi-Source Fire", 9),
    ("## FITUR 7: PeatFR Mathematical", 8),
    ("## FITUR 6: Backend API", 7),
]

NEW_INDEX = """# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG

Aplikasi disusun sebagai dua tab operasional dengan satu bilah atas global. Tab **Pemantauan** memuat
seluruh alur pemantauan (status, peringatan, peta, proyeksi) dan menyediakan chip navigasi bagian agar
pengguna tidak perlu menggulir panjang; tab **Simulasi** memuat simulator skenario. Setiap fitur di bawah
ini memuat deskripsi, tangkapan layar mode terang, langkah penggunaan, dan daftar kode sumber terkait.

| Fitur | Layar / Komponen | Berkas Sumber Utama |
|---|---|---|
| 1. Bilah Atas & Pemilih Wilayah Global | Kedua tab | `Header.tsx` |
| 2. Status Kerawanan PFVI | Tab Pemantauan (bagian Status) | `RiskStatusGauge.tsx` |
| 3. Peringatan Aktif Klaster Hotspot | Tab Pemantauan (bagian Peringatan) | `ActiveAlerts.tsx` |
| 4. Peta Titik Panas & Inspektor | Tab Pemantauan (bagian Peta) | `PeatlandMap.tsx` |
| 5. Konfigurasi Model & Grafik Proyeksi | Tab Pemantauan (bagian Proyeksi) | `PipelineControls.tsx`, `ForecastCharts.tsx` |
| 6. Simulasi Skenario | Tab Simulasi | `ScenarioSimulator.tsx` |
| 7. Backend API & Telemetri Realtime | FastAPI :8097 | `main.py` |
| 8. Physical Engine & Optimasi Nelder-Mead | FastAPI :8097 | `pfvi.py` |
| 9. Multi-Source Fire Intelligence Proxy | FastAPI :8097 | `fire_intelligence.py` |
| 10. Shell Aplikasi (Tab Router & State Global) | React 18 | `App.tsx` |
| 11. Infrastruktur Deployment | Docker Compose | `docker-compose.yml` |
"""


def read(path):
    with io.open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read().rstrip("\n")


def fence(path):
    ext = "tsx" if path.endswith((".tsx", ".ts")) else "yaml" if path.endswith(".yml") else "python"
    return "```" + ext + "\n" + read(path) + "\n```"


def build(title, desc, steps, paths, shot, caption, include_mobile=False):
    parts = [f"## {title}\n", f"**Deskripsi & Tujuan Fitur:** {desc}\n"]
    if os.path.exists(os.path.join(ROOT, "docs/screenshots", shot)):
        parts += [f"![{caption}](docs/screenshots/{shot})", "", f"*Gambar: {caption}.*", ""]
    if include_mobile and os.path.exists(os.path.join(ROOT, "docs/screenshots", MOBILE[0])):
        parts += [f"![{MOBILE[1]}](docs/screenshots/{MOBILE[0]})", "", f"*Gambar: {MOBILE[1]}.*", ""]
    parts.append("**Cara Menggunakan:**\n")
    parts += [f"{i}. {s}" for i, s in enumerate(steps, 1)]
    parts.append("")
    for p in paths:
        parts += [f"#### Kode Sumber (Source Code Listing): `{p}`\n", fence(p), ""]
    return "\n".join(parts)


def main():
    src = io.open(MANUAL, encoding="utf-8").read()

    start = src.index("## FITUR 1:")
    end = src.index("## FITUR 6: Backend API")
    generated = "\n---\n\n".join(
        build(*f, include_mobile=(f[0].startswith("FITUR 1"))) for f in FEATURES
    )
    src = src[:start] + generated + "\n---\n\n" + src[end:]

    # Renumber the kept chapters.
    for marker, num in KEEP:
        i = src.index(marker)
        rest = src[i + len(marker):]
        src = src[:i] + f"## FITUR {num}:" + marker.split(":", 1)[1] + rest

    # Replace the chapter-5 index table.
    idx = src.index("# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG")
    body = src[idx + len("# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG"):]
    nxt = body.index("\n## FITUR 1:")
    src = src[:idx] + NEW_INDEX + body[nxt:]

    # Narrative fixes for the two-tab model.
    src = src.replace(
        "*Antarmuka PeatFR disusun sebagai empat tab operasional (Ringkasan, Peta Titik Panas, "
        "Tren & Proyeksi, Simulasi) dengan satu bilah atas global untuk pemilihan wilayah target. "
        "Seluruh angka yang ditampilkan berasal dari API publik tanpa data simulasi.*",
        "*Antarmuka PeatFR disusun sebagai dua tab operasional (Pemantauan dan Simulasi) dengan satu "
        "bilah atas global untuk pemilihan wilayah target. Seluruh angka yang ditampilkan berasal "
        "dari API publik tanpa data simulasi.*",
    )
    src = src.replace(
        "|  - Tabbed Interface: Ringkasan | Peta Titik Panas | Tren & Proyeksi | Simulasi       |",
        "|  - Tabbed Interface: Pemantauan (Status | Peringatan | Peta | Proyeksi) + Simulasi   |",
    )
    src = src.replace(
        "Tab **Ringkasan** memuat RiskStatusGauge dan ActiveAlerts; tab **Peta titik panas** memuat PeatlandMap; tab **Tren & proyeksi** memuat PipelineControls dan ForecastCharts; tab **Simulasi** memuat ScenarioSimulator.",
        "Tab **Pemantauan** memuat RiskStatusGauge, ActiveAlerts, PeatlandMap, PipelineControls, dan ForecastCharts secara berurutan dengan chip navigasi bagian; tab **Simulasi** memuat ScenarioSimulator.",
    )

    io.open(MANUAL, "w", encoding="utf-8").write(src)
    print("manual collapsed to two tabs, lines:", src.count("\n") + 1)
    for m in re.finditer(r"^## (FITUR \d+:[^\n]*)", src, re.M):
        print("  ", m.group(1))
    for m in re.finditer(r"!\[[^\]]*\]\(([^)]+)\)", src):
        print("   img:", m.group(1))


if __name__ == "__main__":
    main()
