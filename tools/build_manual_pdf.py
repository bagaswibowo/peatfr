#!/usr/bin/env python3
"""Regenerate USER_MANUAL_PEATFR.pdf from the markdown manual.

Run locally on the Hermes container with /opt/data/.venv/bin/python (reportlab 5.x).
Handles the manual's shape: h1/h2/h3, paragraphs, bullet/numbered lists, GFM tables,
fenced code with line numbers and wrapping, and the per-feature screenshots.

Usage: /opt/data/.venv/bin/python tools/build_manual_pdf.py [--repo DIR]
"""
import argparse
import html
import io
import os
import re
import textwrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph,
                                Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle)

ACCENT = colors.HexColor("#C2410C")
INK = colors.HexColor("#1C1917")
MUTE = colors.HexColor("#57534E")
LINE = colors.HexColor("#D6D3D1")
CODE_BG = colors.HexColor("#F5F5F4")

ss = getSampleStyleSheet()
STYLES = {
    "title": ParagraphStyle("title", parent=ss["Title"], fontName="Helvetica-Bold", fontSize=20,
                            leading=24, textColor=INK, alignment=TA_LEFT, spaceAfter=10),
    "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontName="Helvetica-Bold", fontSize=15,
                         leading=19, textColor=ACCENT, spaceBefore=16, spaceAfter=8),
    "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold", fontSize=12.5,
                         leading=16, textColor=INK, spaceBefore=13, spaceAfter=6),
    "h3": ParagraphStyle("h3", parent=ss["Heading3"], fontName="Helvetica-Bold", fontSize=10.5,
                         leading=14, textColor=MUTE, spaceBefore=10, spaceAfter=4),
    "body": ParagraphStyle("body", parent=ss["BodyText"], fontName="Helvetica", fontSize=9.5,
                           leading=13.5, textColor=INK, spaceAfter=5),
    "bullet": ParagraphStyle("bullet", parent=ss["BodyText"], fontName="Helvetica", fontSize=9.5,
                             leading=13.5, textColor=INK, leftIndent=14, bulletIndent=4, spaceAfter=3),
    "quote": ParagraphStyle("quote", parent=ss["BodyText"], fontName="Helvetica-Oblique", fontSize=9,
                            leading=13, textColor=MUTE, leftIndent=10, spaceAfter=5),
    "caption": ParagraphStyle("caption", parent=ss["BodyText"], fontName="Helvetica-Oblique",
                              fontSize=8, leading=11, textColor=MUTE, spaceAfter=8),
    "cell": ParagraphStyle("cell", parent=ss["BodyText"], fontName="Helvetica", fontSize=8,
                           leading=10.5, textColor=INK, spaceAfter=0),
    "cellh": ParagraphStyle("cellh", parent=ss["BodyText"], fontName="Helvetica-Bold", fontSize=8,
                            leading=10.5, textColor=colors.white, spaceAfter=0),
}

INLINE = re.compile(r"(\*\*.+?\*\*|`[^`]+`)")


def inline_md(text):
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r"<font face='Courier'>\1</font>", text)
    return text


def code_block(code, max_chars=92):
    lines = []
    for i, line in enumerate(code.splitlines(), 1):
        line = line.replace("\t", "  ")
        if len(line) <= max_chars:
            lines.append(f"{i:3d} | {line}")
        else:
            wrapped = textwrap.wrap(line, width=max_chars, break_long_words=True,
                                    break_on_hyphens=False) or [""]
            lines.append(f"{i:3d} | {wrapped[0]}")
            lines += [f"    |   {w}" for w in wrapped[1:]]
    return Preformatted("\n".join(lines), ParagraphStyle(
        "code", fontName="Courier", fontSize=7, leading=8.6, textColor=INK,
        backColor=CODE_BG, borderPadding=5, spaceBefore=4, spaceAfter=8))


def make_table(rows, avail_width):
    head, *body = rows
    style = ParagraphStyle
    data = [[Paragraph(inline_md(c), STYLES["cellh"]) for c in head]]
    for r in body:
        data.append([Paragraph(inline_md(c), STYLES["cell"]) for c in r])
    width = max(len(r) for r in rows)
    col_w = avail_width / width
    t = Table(data, colWidths=[col_w] * width, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAF9")]),
    ]))
    return t


def build(repo, out_path):
    md = io.open(os.path.join(repo, "USER_MANUAL_PEATFR.md"), encoding="utf-8").read()
    story = []
    lines = md.split("\n")
    i, n = 0, len(lines)
    avail = A4[0] - 3.4 * cm

    while i < n:
        line = lines[i]
        s = line.strip()

        if s.startswith("```"):
            lang = s[3:].strip()
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            if lang == "math":
                # Render TeX source as-is; the PDF has no KaTeX, but the listing is
                # still readable and correct.
                story.append(code_block("$ " + " ".join(buf) + " $", max_chars=92))
                continue
            story.append(code_block("\n".join(buf)))
            continue

        m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", s)
        if m:
            path = os.path.join(repo, m.group(2))
            if os.path.exists(path):
                from PIL import Image as PILImage
                with PILImage.open(path) as im:
                    w, h = im.size
                max_h = A4[1] - 6.0 * cm
                scale = min(avail / w, max_h / h, 1.0)
                story.append(Image(path, width=w * scale, height=h * scale))
                story.append(Paragraph(inline_md(m.group(1)), STYLES["caption"]))
            i += 1
            continue

        if s.startswith("|") and s.endswith("|"):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            rows = [r for r in rows if not all(set(c) <= set("-: ") for c in r)]
            if rows:
                story.append(Spacer(1, 4))
                story.append(make_table(rows, avail))
                story.append(Spacer(1, 8))
            continue

        if not s or s in ("---", "***", "___"):
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            lvl = min(len(m.group(1)), 3)
            style = STYLES["title"] if lvl == 1 and not story else STYLES[f"h{lvl}"]
            story.append(Paragraph(inline_md(m.group(2)), style))
            i += 1
            continue

        m = re.match(r"^(\d+)\.\s+(.*)$", s)
        if m:
            story.append(Paragraph(inline_md(m.group(2)), STYLES["bullet"], bulletText=f"{m.group(1)}."))
            i += 1
            continue

        m = re.match(r"^[-*]\s+(.*)$", s)
        if m:
            story.append(Paragraph(inline_md(m.group(1)), STYLES["bullet"], bulletText="\u2022"))
            i += 1
            continue

        if s.startswith(">"):
            story.append(Paragraph(inline_md(s.lstrip("> ").strip()), STYLES["quote"]))
            i += 1
            continue

        story.append(Paragraph(inline_md(s), STYLES["body"]))
        i += 1

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(1.7 * cm, 1.5 * cm, A4[0] - 1.7 * cm, 1.5 * cm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTE)
        canvas.drawString(1.7 * cm, 1.05 * cm, "PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut")
        canvas.drawRightString(A4[0] - 1.7 * cm, 1.05 * cm, f"Halaman {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(out_path, pagesize=A4, title="PeatFR User Manual",
                            author="Bagas Wibowo", leftMargin=1.7 * cm, rightMargin=1.7 * cm,
                            topMargin=1.6 * cm, bottomMargin=1.9 * cm)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print("wrote", out_path, os.path.getsize(out_path), "bytes")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    build(a.repo, a.out or os.path.join(a.repo, "USER_MANUAL_PEATFR.pdf"))
