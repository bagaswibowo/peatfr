#!/usr/bin/env python3
"""Pass 3: attach the now-present screenshots to each feature chapter. Run from
the repo root on sxz (screenshots must already exist under docs/screenshots/)."""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANUAL = os.path.join(ROOT, "USER_MANUAL_PEATFR.md")

# feature number -> (screenshot file, caption)
SHOTS = {
    1: ("00-header.png", "Bilah atas PeatFR: pemilih wilayah global, tarik ulang telemetri, mode tampilan, dan tab bar empat layar"),
    2: ("01-ringkasan.png", "Tab Ringkasan: gauge PFVI, variabel penggerak, dan daftar Peringatan Aktif"),
    3: ("02-peta.png", "Tab Peta Titik Panas: layer NASA FIRMS, marker hotspot, dan Inspektor Titik Panas"),
    4: ("03-tren.png", "Tab Tren & Proyeksi: panel konfigurasi model, grafik PFVI, dan variabel pendukung"),
    5: ("04-simulasi.png", "Tab Simulasi: skenario bagaimana jika dengan parameter hidrologi terkalibrasi"),
}

MOBILE_CAPTION = "Tampilan mobile 390px: bilah atas dan tab bar tetap rapi tanpa overflow horizontal"


def main():
    src = io.open(MANUAL, encoding="utf-8").read()
    lines = src.split("\n")
    out = []
    current = None
    inserted_mobile = False

    for line in lines:
        m = re.match(r"^## FITUR (\d+):", line)
        if m:
            current = int(m.group(1))
        out.append(line)

        # Drop the "not available" placeholder, if any, then insert the real image.
        if line.startswith("> *Screenshot `") and "belum tersedia" in line:
            out.pop()
            continue

        if current in SHOTS and line.startswith("**Deskripsi & Tujuan Fitur:**"):
            name, caption = SHOTS[current]
            rel = "docs/screenshots/" + name
            if os.path.exists(os.path.join(ROOT, rel)):
                out.append("")
                out.append(f"![{caption}]({rel})")
                out.append("")
                out.append(f"*Gambar: {caption}.*")
                out.append("")
                if current == 5 and os.path.exists(os.path.join(ROOT, "docs/screenshots/05-mobile.png")):
                    out.append(f"![{MOBILE_CAPTION}](docs/screenshots/05-mobile.png)")
                    out.append("")
                    out.append(f"*Gambar: {MOBILE_CAPTION}.*")
                    out.append("")
                    inserted_mobile = True
            else:
                print("  missing file:", rel)

    src = "\n".join(out)
    io.open(MANUAL, "w", encoding="utf-8").write(src)
    print("pass 3 done, lines:", src.count("\n") + 1, "| mobile block:", inserted_mobile)
    for m in re.finditer(r"!\[[^\]]*\]\(([^)]+)\)", src):
        print("  img:", m.group(1))


if __name__ == "__main__":
    main()
