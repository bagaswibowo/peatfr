#!/usr/bin/env python3
"""Refresh the embedded source listings inside USER_MANUAL_PEATFR.md so the manual
never drifts from the code. Run from the repo root on sxz (or locally).

Every `#### Kode Sumber (Source Code Listing): `<path>`` header is followed by one
fenced block; this rewrites that block from the file on disk. Files listed in the
manual but missing on disk are reported and left untouched.
"""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANUAL = os.path.join(ROOT, "USER_MANUAL_PEATFR.md")

EXT = {".tsx": "tsx", ".ts": "tsx", ".py": "python", ".yml": "yaml", ".yaml": "yaml", ".json": "json"}


def fence_for(path):
    lang = EXT.get(os.path.splitext(path)[1], "plain text")
    with io.open(os.path.join(ROOT, path), encoding="utf-8") as f:
        return "```" + lang + "\n" + f.read().rstrip("\n") + "\n```"


def main():
    src = io.open(MANUAL, encoding="utf-8").read()
    pattern = re.compile(r"(#### Kode Sumber \(Source Code Listing\): `([^`]+)`\n\s*)(```[a-z ]*\n.*?\n```)", re.S)
    refreshed, missing = 0, []

    def repl(m):
        nonlocal refreshed
        header, path, _old = m.group(1), m.group(2), m.group(3)
        if not os.path.exists(os.path.join(ROOT, path)):
            missing.append(path)
            return m.group(0)
        refreshed += 1
        return header + fence_for(path)

    src = pattern.sub(repl, src)
    io.open(MANUAL, "w", encoding="utf-8").write(src)
    print(f"refreshed {refreshed} listings; missing on disk: {missing or 'none'}")


if __name__ == "__main__":
    main()
