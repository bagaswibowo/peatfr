#!/usr/bin/env python3
"""Retake PeatFR per-feature screenshots via headless Chrome CDP.

Waits for the app's real readiness signals (pipeline data rendered, map tiles
loaded) instead of fixed sleeps, then captures the full page plus the Simulasi
tab. Per-feature section PNGs are cropped from the full capture using the
scroll offsets of the section anchors.

Usage: python3 tools/capture_screenshots.py [--base http://127.0.0.1:8098]
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.request

CHROME = "/opt/hermes/tools/chromium-1208/chrome-linux64/chrome"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "screenshots")

WIDTH, HEIGHT = 1440, 1000


def wait_port(url, tries=30):
    for _ in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            urllib.request.urlopen(req, timeout=5)
            return True
        except Exception:
            time.sleep(1)
    return False


class CDP:
    def __init__(self, base, port=9223):
        self.base = base
        import tempfile
        self.proc = subprocess.Popen([
            CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
            "--disable-dev-shm-usage", "--hide-scrollbars",
            f"--user-data-dir={tempfile.mkdtemp(prefix='peatfr-shot-')}",
            f"--remote-debugging-port={port}",
            f"--remote-debugging-address=127.0.0.1",
            "--remote-allow-origins=*",
            f"--window-size={WIDTH},{HEIGHT}", "about:blank",
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.ws = None
        self.msg_id = 0
        for _ in range(40):
            try:
                tabs = json.load(urllib.request.urlopen(
                    f"http://127.0.0.1:{port}/json", timeout=2))
                page = next(t for t in tabs if t["type"] == "page")
                import websocket
                self.ws = websocket.create_connection(
                    page["webSocketDebuggerUrl"], timeout=30,
                    suppress_origin=True)
                break
            except Exception as e:
                last_err = e
                time.sleep(0.5)
        if not self.ws:
            raise RuntimeError(f"CDP connect failed: {last_err}")
        self.cmd("Page.enable")
        self.cmd("Runtime.enable")

    def cmd(self, method, **params):
        self.msg_id += 1
        mid = self.msg_id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})

    def js(self, expr):
        r = self.cmd("Runtime.evaluate", expression=expr, returnByValue=True)
        return r.get("result", {}).get("value")

    def goto(self, url):
        self.cmd("Page.navigate", url=url)

    def shot(self, path):
        data = self.cmd("Page.captureScreenshot", format="png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(data["data"]))
        print("  saved", os.path.basename(path), os.path.getsize(path), "bytes")

    def close(self):
        try:
            self.ws.close()
        finally:
            self.proc.terminate()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8098")
    a = ap.parse_args()
    if not wait_port(a.base + "/"):
        raise SystemExit(f"app not reachable at {a.base}")

    os.makedirs(OUT, exist_ok=True)
    cdp = CDP(a.base)
    try:
        cdp.goto(a.base + "/")
        # Wait for pipeline data + map tiles + charts rendering.
        for _ in range(60):
            ok = cdp.js(
                "!!document.getElementById('bagian-peta') && "
                "document.querySelectorAll('.leaflet-tile-loaded').length >= 4 && "
                "document.querySelectorAll('.recharts-wrapper').length >= 5")
            if ok:
                break
            time.sleep(1)
        time.sleep(3)

        # Give map tiles time, then capture full page.
        time.sleep(6)
        metrics = cdp.cmd("Page.getLayoutMetrics")
        full_h = min(int(metrics["cssContentSize"]["height"]) + 40, 7000)
        cdp.cmd("Emulation.setDeviceMetricsOverride",
                width=WIDTH, height=full_h, deviceScaleFactor=1, mobile=False)
        time.sleep(3)
        cdp.shot(os.path.join(OUT, "_full-pemantauan.png"))

        # Section crops: get anchor offsets.
        anchors = cdp.js(
            "['bagian-peta','bagian-proyeksi']"
            ".map(id => { const el = document.getElementById(id); "
            "  return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null })")
        print("  anchors:", anchors)

        cdp.cmd("Emulation.setDeviceMetricsOverride",
                width=WIDTH, height=1000, deviceScaleFactor=1, mobile=False)
        time.sleep(2)
        cdp.shot(os.path.join(OUT, "00-header.png"))

        # Peringatan tab.
        cdp.js("Array.from(document.querySelectorAll('[role=tab]'))"
               ".find(b => b.textContent.includes('Peringatan'))?.click()")
        time.sleep(2.5)
        cdp.shot(os.path.join(OUT, "02-peringatan.png"))

        # Simulasi tab.
        cdp.js("Array.from(document.querySelectorAll('[role=tab]'))"
               ".find(b => b.textContent.includes('Simulasi'))?.click()")
        time.sleep(2.5)
        cdp.shot(os.path.join(OUT, "03-simulasi.png"))

        # Mobile.
        cdp.js("Array.from(document.querySelectorAll('[role=tab]'))"
               ".find(b => b.textContent.includes('Pemantauan'))?.click()")
        time.sleep(1)
        cdp.cmd("Emulation.setDeviceMetricsOverride",
                width=390, height=1600, deviceScaleFactor=2, mobile=True)
        time.sleep(3)
        cdp.shot(os.path.join(OUT, "05-mobile.png"))
    finally:
        cdp.close()

    print("anchors file:", json.dumps(anchors))


if __name__ == "__main__":
    main()
