#!/usr/bin/env python3
import os
import re
import textwrap
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Preformatted, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

MD_PATH = "/opt/data/peatfr/USER_MANUAL_PEATFR_v2.md"
PDF_PATH = "/opt/data/peatfr/USER_MANUAL_PEATFR_v2.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 800, "DOKUMEN HAK CIPTA PROGRAM KOMPUTER — APLIKASI PEATFR")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 794, 541, 794)
            
        # Footer
        text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(541, 36, text)
        self.drawString(54, 36, "STRICTLY CONFIDENTIAL — UNIVERSITAS TELKOM / KEMENKUMHAM RI")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 541, 48)
        
        self.restoreState()

def prepare_code_block(code_text, max_chars=68):
    lines = code_text.splitlines()
    output_lines = []
    
    for i, line in enumerate(lines, 1):
        line = line.replace('\t', '  ')
        if len(line) <= max_chars:
            output_lines.append(f"{i:3d} | {line}")
        else:
            wrapped = textwrap.wrap(line, width=max_chars, break_long_words=True, break_on_hyphens=False)
            if wrapped:
                output_lines.append(f"{i:3d} | {wrapped[0]}")
                for sub in wrapped[1:]:
                    output_lines.append(f"    |   {sub}")
            else:
                output_lines.append(f"{i:3d} | ")
                
    return "\n".join(output_lines)

def build_pdf():
    print(f"Reading {MD_PATH}...")
    with open(MD_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        alignment=0,
        spaceAfter=8
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='Courier',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=4,
        spaceAfter=8
    )
    
    caption_style = ParagraphStyle(
        'CaptionStyle',
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B'),
        alignment=1,
        spaceBefore=4,
        spaceAfter=12
    )

    story = []

    # Split into lines/blocks
    lines = content.splitlines()
    i = 0
    n = len(lines)

    table_data_buffer = []
    in_code = False
    code_buffer = []
    code_lang = ""

    while i < n:
        line = lines[i].rstrip()
        
        # Code block handling
        if line.startswith("```"):
            if in_code:
                # End of code block
                code_text = "\n".join(code_buffer)
                formatted_code = prepare_code_block(code_text)
                
                # Preformatted directly allows page splitting
                p_code = Preformatted(formatted_code, code_style)
                story.append(Spacer(1, 4))
                story.append(p_code)
                story.append(Spacer(1, 6))
                
                in_code = False
                code_buffer = []
            else:
                in_code = True
                code_lang = line[3:].strip()
                code_buffer = []
            i += 1
            continue

        if in_code:
            code_buffer.append(line)
            i += 1
            continue

        # Empty line
        if not line.strip():
            i += 1
            continue

        # Headers
        if line.startswith("# "):
            txt = line[2:].strip()
            story.append(Spacer(1, 10))
            story.append(Paragraph(txt, title_style if i < 10 else h1_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10, spaceBefore=2))
            i += 1
            continue

        if line.startswith("## "):
            txt = line[3:].strip()
            story.append(Paragraph(txt, h2_style))
            i += 1
            continue

        if line.startswith("### "):
            txt = line[4:].strip()
            story.append(Paragraph(txt, h3_style))
            i += 1
            continue

        if line.startswith("#### "):
            txt = line[5:].strip()
            story.append(Paragraph(txt, h3_style))
            i += 1
            continue

        # Markdown Images ![alt](path)
        img_match = re.match(r'^!\[(.*?)\]\((.*?)\)', line)
        if img_match:
            alt, path = img_match.groups()
            if os.path.exists(path):
                try:
                    # Insert Image resized to fit width 480
                    img = Image(path, width=480, height=270) # Standard 16:9 ratio
                    story.append(Spacer(1, 6))
                    story.append(img)
                    if alt:
                        story.append(Paragraph(f"Gambar: {alt}", caption_style))
                except Exception as e:
                    print(f"Error loading image {path}: {e}")
            i += 1
            continue

        # Captions like *Caption*
        if line.startswith("*") and line.endswith("*") and not line.startswith("**"):
            txt = line[1:-1].strip()
            story.append(Paragraph(txt, caption_style))
            i += 1
            continue

        # Markdown Table Parsing
        if line.startswith("|"):
            table_lines = []
            while i < n and lines[i].rstrip().startswith("|"):
                tline = lines[i].rstrip()
                # Skip separator line like |---|---|
                if not re.match(r'^\|[\s\:\-]+\|', tline):
                    cells = [c.strip() for c in tline.split("|")[1:-1]]
                    table_lines.append(cells)
                i += 1
            
            if table_lines:
                # Build reportlab table
                formatted_table_data = []
                for row_idx, row in enumerate(table_lines):
                    formatted_row = []
                    for cell in row:
                        cell_p = Paragraph(cell, ParagraphStyle('TableCell', parent=body_style, fontSize=8, leading=11))
                        formatted_row.append(cell_p)
                    formatted_table_data.append(formatted_row)
                
                # Calculate widths evenly
                col_num = len(table_lines[0])
                col_w = 487 / max(1, col_num)
                
                t = Table(formatted_table_data, colWidths=[col_w]*col_num)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                story.append(Spacer(1, 6))
                story.append(t)
                story.append(Spacer(1, 8))
            continue

        # Bullet items
        if line.startswith("- ") or line.startswith("* "):
            txt = line[2:].strip()
            # formatting bold inline **txt**
            txt = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', txt)
            txt = re.sub(r'\*(.*?)\*', r'<i>\1</i>', txt)
            story.append(Paragraph(f"• {txt}", bullet_style))
            i += 1
            continue

        if re.match(r'^\d+\.\s', line):
            txt = re.sub(r'^\d+\.\s', '', line).strip()
            txt = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', txt)
            txt = re.sub(r'\*(.*?)\*', r'<i>\1</i>', txt)
            story.append(Paragraph(f"1. {txt}", bullet_style))
            i += 1
            continue

        # Standard Paragraph
        txt = line.strip()
        txt = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', txt)
        txt = re.sub(r'\*(.*?)\*', r'<i>\1</i>', txt)
        txt = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', txt)
        story.append(Paragraph(txt, body_style))
        i += 1

    print(f"Building document to {PDF_PATH} with NumberedCanvas...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {PDF_PATH}!")

if __name__ == "__main__":
    build_pdf()
