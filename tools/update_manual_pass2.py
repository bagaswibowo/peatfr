#!/usr/bin/env python3
"""Second pass on the PeatFR manual: clean the stale narrative sections left by
the tab refactor (tujuan utama, arsitektur client layer, App core description)
and refresh the feature index in chapter 5. Run from the repo root on sxz."""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANUAL = os.path.join(ROOT, "USER_MANUAL_PEATFR.md")

REPLACEMENTS = [
    # 2. TUJUAN UTAMA — drop the removed dual-mode/PDF claims.
    (
        "2. **Penyederhanaan Akses Informasi Kebencanaan (Mode Awam):** Memberikan panduan aksi mitigasi langsung bagi petugas lapangan BPBD, Manggala Agni, dan warga lokal tanpa kerumitan rumus statistik.",
        "2. **Penyederhanaan Akses Informasi Kebencanaan:** Menyajikan status kerawanan, daftar peringatan aktif, dan peta titik panas pada layar terpisah per tab sehingga petugas lapangan BPBD, Manggala Agni, dan warga lokal dapat membaca status tanpa membuka rumus statistik.",
    ),
    (
        "4. **Operasional Mitigasi Berbasis Bukti:** Menyediakan fitur cetak resmi ringkasan peringatan dini (PDF) untuk koordinasi lapangan.",
        "4. **Operasional Mitigasi Berbasis Bukti:** Menampilkan angka pendukung yang dapat diaudit (jumlah deteksi hotspot, FRP maksimum, luas terbakar, MSE optimasi) dan menandai secara eksplisit setiap nilai yang tidak tersedia, sehingga koordinasi lapangan tidak berpijak pada angka perkiraan.",
    ),
    # 3. ARSITEKTUR — client layer description.
    (
        "|  - Dual-Mode Interface: Mode Awam (Field SOP & PDF Export) vs Mode Pakar (Analis) |",
        "|  - Tabbed Interface: Ringkasan | Peta Titik Panas | Tren & Proyeksi | Simulasi       |",
    ),
    (
        "|  - Signature Component: Peatland Water Table Smoldering Profile (0-150cm)         |",
        "|  - Signature Component: Peringatan Aktif (klaster hotspot zona gambut, FRP-graded) |",
    ),
    (
        "|  - Interactive GIS Satellite Map (Leaflet, NASA FIRMS WMS, VIIRS Hotspots)       |",
        "|  - Interactive GIS Satellite Map (Leaflet, NASA FIRMS WMS, VIIRS Hotspots)         |",
    ),
    # 9. App core description.
    (
        "**Deskripsi & Tujuan Fitur:** Komponen utama React App yang mengelola state lokasi terverifikasi, penanganan wilayah non-gambut (misal Kota Medan), pemicukan pipeline, dan kalkulasi fallback.",
        "**Deskripsi & Tujuan Fitur:** Shell aplikasi yang mengelola state global (wilayah target, hasil telemetri, hasil pipeline, daftar peringatan aktif) dan merutekannya ke empat tab. Lokasi dan atribusi jenis tanah menjadi state bersama antara bilah atas, peta, dan panel konfigurasi.",
    ),
    (
        "Komponen induk layout yang memuat Header, AwamActionGuide, RiskStatusGauge, PeatSmolderingProfile, PeatlandMap, PipelineControls, ForecastCharts, dan ScenarioSimulator.",
        "Tab **Ringkasan** memuat RiskStatusGauge dan ActiveAlerts; tab **Peta titik panas** memuat PeatlandMap; tab **Tren & proyeksi** memuat PipelineControls dan ForecastCharts; tab **Simulasi** memuat ScenarioSimulator. Bilah atas (Header) memuat pemilih wilayah dan kontrol tema, sedangkan TheoreticalSpecsModal terbuka dari bilah atas maupun footer.",
    ),
]

# Feature index in chapter 5 (replaces the old 13-row list if present).
OLD_INDEX_MARKER = "# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG"
NEW_INDEX = """# 5. PANDUAN PETUNJUK FITUR-DEMI-FITUR & KODE SUMBER TERHUBUNG

Aplikasi disusun sebagai empat tab operasional dengan satu bilah atas global. Setiap fitur di bawah
ini memuat deskripsi, tangkapan layar mode terang, langkah penggunaan, dan daftar kode sumber terkait.

| Fitur | Layar / Komponen | Berkas Sumber Utama |
|---|---|---|
| 1. Bilah Atas & Pemilih Wilayah Global | Semua tab | `Header.tsx` |
| 2. Tab Ringkasan (PFVI & Peringatan Aktif) | Tab Ringkasan | `RiskStatusGauge.tsx`, `ActiveAlerts.tsx` |
| 3. Tab Peta Titik Panas | Tab Peta | `PeatlandMap.tsx` |
| 4. Tab Tren & Proyeksi | Tab Tren | `PipelineControls.tsx`, `ForecastCharts.tsx` |
| 5. Tab Simulasi Skenario | Tab Simulasi | `ScenarioSimulator.tsx` |
| 6. Backend API & Telemetri Realtime | FastAPI :8097 | `main.py` |
| 7. Physical Engine & Optimasi Nelder-Mead | FastAPI :8097 | `pfvi.py` |
| 8. Multi-Source Fire Intelligence Proxy | FastAPI :8097 | `fire_intelligence.py` |
| 9. Shell Aplikasi (Tab Router & State Global) | React 18 | `App.tsx` |
| 10. Infrastruktur Deployment | Docker Compose | `docker-compose.yml` |
"""


def main():
    src = io.open(MANUAL, encoding="utf-8").read()
    for old, new in REPLACEMENTS:
        if old not in src:
            print("  MISS:", old[:70])
            continue
        src = src.replace(old, new, 1)

    # Insert the feature index table right after the chapter 5 heading, replacing
    # whatever prose paragraph currently follows it.
    i = src.index(OLD_INDEX_MARKER)
    body = src[i + len(OLD_INDEX_MARKER):]
    next_chapter = body.index("\n## FITUR 1:")
    src = src[:i] + NEW_INDEX + body[next_chapter:]

    # Refresh the stale feature inventory in chapter 4's API table note and the
    # deployment chapter's image reference list.
    src = src.replace(
        "**Aplikasi PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut**",
        "**Aplikasi PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut**\n\n"
        "*Antarmuka PeatFR disusun sebagai empat tab operasional (Ringkasan, Peta Titik Panas, "
        "Tren & Proyeksi, Simulasi) dengan satu bilah atas global untuk pemilihan wilayah target. "
        "Seluruh angka yang ditampilkan berasal dari API publik tanpa data simulasi.*",
    )

    io.open(MANUAL, "w", encoding="utf-8").write(src)
    print("pass 2 done, lines:", src.count("\n") + 1)


if __name__ == "__main__":
    main()
