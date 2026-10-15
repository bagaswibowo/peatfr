#!/usr/bin/env python3
"""Regenerate the PeatFR HKI user manual to match the tabbed UI and the live-data
backend. Run from the repo root on sxz.

Scope: replace the eight old frontend feature chapters (which documented the old
single-scroll layout and two components that are no longer mounted) with five
chapters matching the four tabs + top bar; renumber the backend/deploy chapters
that follow; refresh every embedded source listing.

Ponytail note: one-shot doc generator, not a template engine.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANUAL = os.path.join(ROOT, "USER_MANUAL_PEATFR.md")

# (title, description, steps, code paths, screenshot file)
FEATURES = [
    (
        "FITUR 1: Bilah Atas, Pemilih Wilayah Global, & Mode Tampilan",
        "Bilah atas menyatukan identitas aplikasi, pemilih wilayah target, tombol tarik ulang "
        "telemetri, sakelar mode terang/gelap, dan tautan spesifikasi jurnal. Pemilih wilayah "
        "sengaja diletakkan di sini (bukan di panel konfigurasi) karena lokasi adalah state global "
        "yang memengaruhi seluruh tab.",
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
        "01-ringkasan.png",
    ),
    (
        "FITUR 2: Tab Ringkasan — Indeks Kerawanan PFVI & Peringatan Aktif",
        "Tab Ringkasan adalah layar pertama dan menjawab satu pertanyaan: seberapa berbahaya kondisi "
        "hari ini di wilayah terpilih. Isinya gauge PFVI beserta variabel penggeraknya, diikuti satu "
        "daftar peringatan aktif hasil klaster titik panas NASA FIRMS. Daftar peringatan hanya "
        "muncul di satu tempat, yaitu komponen ActiveAlerts.",
        [
            "Gauge tengah menampilkan **skor PFVI** skala 0 sampai 300 beserta kategorinya "
            "(Rendah < 75, Sedang 75-150, Tinggi 150-225, Ekstrem > 225).",
            "Empat angka di bawah narasi menampilkan muka air tanah (m), kelembapan tanah (%), "
            "FWI cuaca, dan status pembaruan satelit.",
            "Panel kanan menampilkan kesesuaian model (MSE hasil optimasi Nelder-Mead), proksimitas "
            "titik api radius 25 km, area terbakar FirePing, horizon proyeksi, dan sumber telemetri.",
            "Bagian **Peringatan aktif** mendaftar setiap klaster titik panas pada zona gambut dalam "
            "24 jam terakhir, diurutkan dari FRP tertinggi, lengkap dengan jumlah deteksi dan luas "
            "terbakar bila tersedia. Angka pada label tab Ringkasan adalah jumlah klaster aktif.",
            "Klik salah satu baris peringatan untuk berpindah ke tab Peta dan memfokuskan telemetri "
            "ke koordinat klaster tersebut.",
            "Bila sumber data tidak dapat dihubungi, aplikasi menampilkan banner merah dan menahan "
            "angka risiko kosong alih-alih menampilkan nilai perkiraan.",
        ],
        ["frontend/src/components/RiskStatusGauge.tsx", "frontend/src/components/ActiveAlerts.tsx"],
        "01-ringkasan.png",
    ),
    (
        "FITUR 3: Tab Peta Titik Panas — Peta Satelit & Inspektor Hotspot",
        "Peta GIS berbasis Esri World Imagery dengan layer thermal NASA FIRMS terotorisasi, hotspot "
        "vector, dan atribusi zona gambut. Inspektor di sisi kanan menampilkan rincian setiap titik "
        "yang dipilih.",
        [
            "Buka tab **Peta titik panas**.",
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
        "02-peta.png",
    ),
    (
        "FITUR 4: Tab Tren & Proyeksi — Konfigurasi Model & Grafik Time-Series",
        "Tab ini menggabungkan panel konfigurasi algoritma (untuk pengguna pakar) dengan grafik "
        "historis dan proyeksi PFVI, ditambah empat grafik variabel pendukung.",
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
        "03-tren.png",
    ),
    (
        "FITUR 5: Tab Simulasi — Skenario Bagaimana Jika",
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
        "04-simulasi.png",
    ),
]

# Chapters kept from the old manual, with their new numbers and listing source.
KEEP_RENUMBER = [
    ("## FITUR 9:", 6),
    ("## FITUR 10:", 7),
    ("## FITUR 11:", 8),
    ("## FITUR 12:", 9),
    ("## FITUR 13:", 10),
]

LISTING_SOURCES = {
    "backend/main.py": "backend/main.py",
    "backend/peatfr_engine/pfvi.py": "backend/peatfr_engine/pfvi.py",
    "backend/peatfr_engine/fire_intelligence.py": "backend/peatfr_engine/fire_intelligence.py",
    "frontend/src/App.tsx": "frontend/src/App.tsx",
    "docker-compose.yml": "docker-compose.yml",
}


def read(path):
    with io.open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return f.read().rstrip("\n")


def fence(path):
    ext = "tsx" if path.endswith((".tsx", ".ts")) else "yaml" if path.endswith(".yml") else "python"
    return "```" + ext + "\n" + read(path) + "\n```"


def screenshot_block(name, caption):
    rel = "docs/screenshots/" + name
    if not os.path.exists(os.path.join(ROOT, rel)):
        return f"> *Screenshot `{name}` belum tersedia pada repositori.*\n"
    return f"![{caption}]({rel})\n\n*Gambar: {caption}.*\n"


def build_feature(title, desc, steps, paths, shot):
    parts = [f"## {title}\n"]
    parts.append(f"**Deskripsi & Tujuan Fitur:** {desc}\n")
    parts.append(screenshot_block(shot, title.split(": ", 1)[1]))
    parts.append("**Cara Menggunakan:**\n")
    for i, s in enumerate(steps, 1):
        parts.append(f"{i}. {s}")
    parts.append("")
    for p in paths:
        parts.append(f"#### Kode Sumber (Source Code Listing): `{p}`\n")
        parts.append(fence(p))
        parts.append("")
    return "\n".join(parts)


def main():
    src = io.open(MANUAL, encoding="utf-8").read()

    # 1. Swap the old frontend chapters for the tab-based ones.
    start = src.index("## FITUR 1:")
    end = src.index("## FITUR 9:")
    generated = "\n---\n\n".join(build_feature(*f) for f in FEATURES)
    src = src[:start] + generated + "\n---\n\n" + src[end:]

    # 2. Renumber the chapters that follow, top-down so markers stay unique.
    for old_marker, new_num in KEEP_RENUMBER:
        i = src.index(old_marker)
        rest = src[i + len(old_marker):]
        colon = rest.index("\n")
        src = src[:i] + f"## FITUR {new_num}:" + rest[:colon] + rest[colon:]

    # 3. Refresh every embedded listing from the current source tree.
    for header, path in LISTING_SOURCES.items():
        marker = f"#### Kode Sumber (Source Code Listing): `{header}`"
        if marker not in src:
            print("  listing marker missing, skipped:", header)
            continue
        i = src.index(marker)
        body_start = src.index("```", i)
        body_end = src.index("```", body_start + 3) + 3
        src = src[:body_start] + fence(path) + src[body_end:]

    io.open(MANUAL, "w", encoding="utf-8").write(src)
    print("manual rewritten, lines:", src.count("\n") + 1)
    for m in re.finditer(r"^## (FITUR \d+:[^\n]*)", src, re.M):
        print("  ", m.group(1))


if __name__ == "__main__":
    main()
