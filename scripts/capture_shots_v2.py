#!/usr/bin/env python3
"""Capture PeatFR UI screenshots v2 — wait for pipeline results, scroll into view."""
import os, time
from playwright.sync_api import sync_playwright

SS_DIR = "/opt/data/peatfr/docs/screenshots"
os.makedirs(SS_DIR, exist_ok=True)
URL = "https://peatfr.bagaswibowo.app/"

def el_shot(page, loc, name, scroll=True, wait_ms=1500):
    """Scroll element into view, wait, screenshot element."""
    try:
        el = page.locator(loc).first
        if scroll:
            el.scroll_into_view_if_needed(timeout=8000)
        page.wait_for_timeout(wait_ms)
        el.screenshot(path=os.path.join(SS_DIR, name))
        print(f"OK {name} ({os.path.getsize(os.path.join(SS_DIR, name))} bytes)")
        return True
    except Exception as e:
        print(f"FAIL {name}: {e}")
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 940}, device_scale_factor=1.5)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(URL, wait_until="domcontentloaded", timeout=60000)

    # Wait for pipeline result -> charts header appears
    print("Waiting for pipeline result (charts)...")
    try:
        page.wait_for_selector("text=Grafik Historis & Forecast", timeout=90000)
        print("Pipeline done — charts rendered")
    except Exception:
        print("WARN: charts not found in 90s — falling back to wait")

    page.wait_for_timeout(4000)  # settle satellite tiles + animations

    # 1. Header
    el_shot(page, "header", "ss_header.png", scroll=False, wait_ms=800)

    # 2. Gauge (scroll to top first)
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(600)
    el_shot(page, "div.telemetry-panel >> nth=0", "ss_gauge.png", scroll=False, wait_ms=1000)

    # 3. Map — scroll into view so Leaflet tiles render
    el_shot(page, "div.telemetry-panel >> nth=1", "ss_map.png", scroll=True, wait_ms=3500)

    # 4. Pipeline controls
    el_shot(page, "div.telemetry-panel >> nth=2", "ss_pipeline.png", scroll=True, wait_ms=800)

    # 5. Charts panel (first chart = PFVI forecast)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(800)
    # find the chart panel by its heading container (telemetry-panel containing 'Grafik Historis')
    chart_panel = page.locator('div.telemetry-panel:has-text("Grafik Historis & Forecast")').first
    try:
        chart_panel.scroll_into_view_if_needed(timeout=8000)
        page.wait_for_timeout(2000)
        chart_panel.screenshot(path=os.path.join(SS_DIR, "ss_charts.png"))
        print("OK ss_charts.png (chart panel)")
    except Exception as e:
        print("FAIL charts:", e)

    # 6. Scenario simulator
    el_shot(page, 'div.telemetry-panel:has-text("Simulasi Skenario Cuaca")', "ss_simulator.png", scroll=True, wait_ms=800)

    # 7. Full top (BEFORE modal)
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(SS_DIR, "ss_fulltop.png"))
    print("OK ss_fulltop.png (viewport)")

    # 8. Modal
    try:
        page.get_by_role("button", name="Spesifikasi Teoretis").click(timeout=8000)
        page.wait_for_timeout(1500)
        modal = page.locator("div.fixed.inset-0.z-\\[100\\]")
        modal.screenshot(path=os.path.join(SS_DIR, "ss_modal.png"))
        print("OK ss_modal.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
    except Exception as e:
        print("FAIL modal:", e)

    # 9. Swagger API docs at /docs
    try:
        page.goto(URL + "docs", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(5000)
        page.screenshot(path=os.path.join(SS_DIR, "ss_api.png"))
        print("OK ss_api.png (swagger)")
    except Exception as e:
        print("FAIL api docs:", e)

    browser.close()

print("\n--- page errors ---")
for e in errors[:10]:
    print("ERR:", e)
print("DONE")