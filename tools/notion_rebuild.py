#!/usr/bin/env python3
"""Rebuild the PeatFR Notion user manual from USER_MANUAL_PEATFR.md.

Reads the markdown manual, converts it to Notion blocks, wipes the page's current
top-level blocks, uploads the per-feature screenshots, and re-appends everything in
order. Run from the repo root on sxz.

Usage: python3 tools/notion_rebuild.py [--dry-run]
"""
import io
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.request
import uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANUAL = os.path.join(ROOT, "USER_MANUAL_PEATFR.md")
PAGE_ID = "3cd86925eac58022a044e1325f116343"
API = "https://api.notion.com/v1"
NOTION_VERSION = "2025-09-03"
CHUNK = 1900          # Notion rich_text content limit is 2000
BATCH = 40            # blocks per append request

# Token comes from the environment (piped over SSH stdin) so it never lands in a
# command line or a repo file. Local fallback only for running on this container.
def _token():
    tok = os.environ.get("NOTION_TOKEN") or os.environ.get("NOTION_API_KEY")
    if not tok:
        src = "/opt/data/populate_notion.py"
        if os.path.exists(src):
            m = re.search(r"TOKEN\s*=\s*'([^']+)'", io.open(src, encoding="utf-8").read())
            tok = m.group(1) if m else None
    if not tok:
        raise SystemExit("NOTION_TOKEN not set")
    return tok.strip()


TOKEN = _token()
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
}

# Notion accepts a fixed language enum; map file extensions onto it.
LANG_MAP = {
    "tsx": "typescript", "ts": "typescript", "js": "javascript", "jsx": "javascript",
    "yml": "yaml", "sh": "bash", "py": "python", "md": "markdown",
}


def api(method, path, payload=None, raw=None, content_type=None, timeout=60):
    url = path if path.startswith("http") else API + path
    data = raw if raw is not None else (json.dumps(payload).encode() if payload is not None else None)
    headers = dict(HEADERS)
    if content_type:
        headers["Content-Type"] = content_type
    elif data is None:
        headers.pop("Content-Type")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read().decode()
                return json.loads(body) if body.strip() else {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode()[:400]
            if e.code in (429, 502, 503, 504) and attempt < 3:
                time.sleep(2 * (attempt + 1))
                continue
            raise RuntimeError(f"{method} {url} -> HTTP {e.code}: {detail}")
    raise RuntimeError("unreachable")


# ---------------------------------------------------------------- inline rich text
INLINE = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\*[^*]+?\*|\$[^$\n]+?\$)")


def rich_text(text, limit=CHUNK):
    """Split markdown inline emphasis/code/equations into Notion rich_text runs."""
    text = text.replace("\t", "  ")
    out = []
    for part in INLINE.split(text):
        if not part:
            continue
        ann = {"bold": False, "italic": False, "code": False}
        body = part
        if part.startswith("**") and part.endswith("**") and len(part) > 4:
            body, ann["bold"] = part[2:-2], True
        elif part.startswith("`") and part.endswith("`") and len(part) > 2:
            body, ann["code"] = part[1:-1], True
        elif part.startswith("*") and part.endswith("*") and len(part) > 2:
            body, ann["italic"] = part[1:-1], True
        elif part.startswith("$") and part.endswith("$") and len(part) > 2:
            # Inline math: native Notion equation rich_text (renders KaTeX).
            for i in range(0, len(part) - 2, limit):
                out.append({"type": "equation",
                            "equation": {"expression": part[1:-1][i:i + limit]}})
            continue
        # Notion rejects empty content strings and caps each run at 2000 chars.
        for i in range(0, max(len(body), 1), limit):
            piece = body[i:i + limit] or " "
            out.append({"type": "text", "text": {"content": piece}, "annotations": dict(ann)})
    return out or [{"type": "text", "text": {"content": " "}}]


def code_rich_text(code):
    """Notion caps every rich_text run at 2000 chars — split, do not truncate."""
    return [{"type": "text", "text": {"content": code[i:i + CHUNK]}}
            for i in range(0, len(code), CHUNK)] or [{"type": "text", "text": {"content": " "}}]


def block(kind, **payload):
    return {"object": "block", "type": kind, kind: payload}


# ---------------------------------------------------------------- image upload
UPLOADED = {}


def upload_image(rel_path):
    """Notion 3-step file upload; returns file_upload id (cached per run)."""
    if rel_path in UPLOADED:
        return UPLOADED[rel_path]
    abs_path = os.path.join(ROOT, rel_path)
    if not os.path.exists(abs_path):
        print("   ! image missing, skipped:", rel_path)
        return None
    filename = os.path.basename(abs_path)
    ctype = mimetypes.guess_type(filename)[0] or "image/png"
    slot = api("POST", "/file_uploads", {"filename": filename, "content_type": ctype})
    upload_url = slot.get("upload_url") or f"{API}/file_uploads/{slot['id']}/send"
    with open(abs_path, "rb") as f:
        blob = f.read()
    boundary = "----peatfr" + uuid.uuid4().hex
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\n"
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode() + blob + f"\r\n--{boundary}--\r\n".encode()
    api("POST", upload_url, raw=body, content_type=f"multipart/form-data; boundary={boundary}")
    sent = api("GET", f"/file_uploads/{slot['id']}")
    if sent.get("status") not in ("uploaded", "pending"):
        raise RuntimeError(f"upload not confirmed for {rel_path}: {sent.get('status')}")
    UPLOADED[rel_path] = slot["id"]
    print(f"   uploaded: {rel_path} -> {slot['id']} ({sent.get('status')})")
    return slot["id"]


# ---------------------------------------------------------------- markdown parsing
def parse_markdown(md):
    lines = md.split("\n")
    blocks = []
    i = 0
    n = len(lines)

    def flush_table(rows):
        if not rows:
            return
        cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
        # Drop the |---|---| separator row.
        cells = [c for c in cells if not all(set(x) <= set("-: ") for x in c)]
        if not cells:
            return
        width = max(len(c) for c in cells)
        cells = [c + [""] * (width - len(c)) for c in cells]
        blocks.append(block("table", table_width=width, has_column_header=True, has_row_header=False,
                            children=[block("table_row", cells=[rich_text(x) for x in row]) for row in cells]))

    table_rows = []
    while i < n:
        raw = lines[i]
        line = raw.rstrip()
        stripped = line.strip()

        # fenced code
        if stripped.startswith("```"):
            if table_rows:
                flush_table(table_rows); table_rows = []
            lang = stripped[3:].strip() or "plain text"
            lang = LANG_MAP.get(lang, lang)
            buf = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1  # closing fence
            code = "\n".join(buf).rstrip()
            # Block math renders as a native Notion equation block.
            if lang == "math":
                blocks.append({"object": "block", "type": "equation",
                               "equation": {"expression": code}})
                continue
            valid = {"python", "yaml", "json", "bash", "javascript", "typescript", "sql", "mermaid",
                     "html", "css", "plain text", "markdown", "shell", "docker", "r", "java", "go",
                     "rust", "kotlin", "swift", "php", "ruby", "c", "c++", "c#", "latex", "diff"}
            blocks.append(block("code", rich_text=code_rich_text(code),
                                language=lang if lang in valid else "plain text"))
            continue

        # image
        m = re.match(r"!\[[^\]]*\]\(([^)]+)\)", stripped)
        if m:
            if table_rows:
                flush_table(table_rows); table_rows = []
            fid = upload_image(m.group(1))
            if fid:
                blocks.append(block("image", type="file_upload", file_upload={"id": fid}))
            i += 1
            continue

        # table row
        if stripped.startswith("|") and stripped.endswith("|"):
            table_rows.append(stripped)
            i += 1
            continue
        if table_rows:
            flush_table(table_rows); table_rows = []

        if not stripped or stripped in ("---", "***", "___"):
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            level = min(len(m.group(1)), 3)
            blocks.append(block(f"heading_{level}", rich_text=rich_text(m.group(2))))
            i += 1
            continue

        m = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if m:
            blocks.append(block("numbered_list_item", rich_text=rich_text(m.group(2))))
            i += 1
            continue

        m = re.match(r"^[-*]\s+(.*)$", stripped)
        if m:
            blocks.append(block("bulleted_list_item", rich_text=rich_text(m.group(1))))
            i += 1
            continue

        if stripped.startswith(">"):
            blocks.append(block("quote", rich_text=rich_text(stripped.lstrip("> ").strip())))
            i += 1
            continue

        blocks.append(block("paragraph", rich_text=rich_text(stripped)))
        i += 1

    if table_rows:
        flush_table(table_rows)
    return blocks


# ---------------------------------------------------------------- page ops
def all_top_level_blocks(page_id):
    blocks, cursor = [], None
    while True:
        path = f"/blocks/{page_id}/children?page_size=100" + (f"&start_cursor={cursor}" if cursor else "")
        data = api("GET", path)
        blocks.extend(data["results"])
        if not data.get("has_more"):
            return blocks
        cursor = data["next_cursor"]


def wipe(page_id):
    for b in all_top_level_blocks(page_id):
        api("DELETE", f"/blocks/{b['id']}")
        time.sleep(0.12)


def append(page_id, blocks):
    for i in range(0, len(blocks), BATCH):
        chunk = blocks[i:i + BATCH]
        api("PATCH", f"/blocks/{page_id}/children", {"children": chunk})
        print(f"   appended {min(i + BATCH, len(blocks))}/{len(blocks)}")
        time.sleep(0.35)


def main():
    dry = "--dry-run" in sys.argv
    md = io.open(MANUAL, encoding="utf-8").read()
    if dry:
        # No uploads during dry run: swap image blocks for paragraphs to count shapes.
        blocks = parse_markdown(re.sub(r"!\[[^\]]*\]\([^)]+\)", "_(screenshot)_", md))
    else:
        blocks = parse_markdown(md)
    print("generated blocks:", len(blocks))
    kinds = {}
    for b in blocks:
        kinds[b["type"]] = kinds.get(b["type"], 0) + 1
    print("by type:", kinds)
    if dry:
        return

    print("wiping existing page blocks...")
    wipe(PAGE_ID)
    print("appending...")
    append(PAGE_ID, blocks)

    final = all_top_level_blocks(PAGE_ID)
    print("final top-level blocks:", len(final))
    images = [b for b in final if b["type"] == "image"]
    print("image blocks:", len(images))

    # Hard checks: a silent partial rebuild is worse than a loud failure.
    assert len(final) == len(blocks), f"expected {len(blocks)} blocks, page has {len(final)}"
    assert len(images) == len(UPLOADED), f"expected {len(UPLOADED)} images, page has {len(images)}"
    ids = {b["id"] for b in images}
    assert len(ids) == len(images), "duplicate image block ids"
    print("VERIFIED: page matches the generated block list.")


if __name__ == "__main__":
    main()
