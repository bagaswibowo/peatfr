#!/usr/bin/env python3
"""Capture PeatFR UI screenshots for the user manual (live production site)."""
import os, time
from playwright.sync_api import sync_playwright

SS_DIR = "/opt/data/peatfr/docs/screenshots"
os.makedirs(SS_DIR, exist_ok=True)
URL = "https://peatfr.bagaswibowo.app/"

def shot(page, name, caption=None):
    path = os.path.join(SS_DIR, name)
    page.screenshot(path=path, full_page=False)
    print(f"OK {name} ({os.path.getsize(path)} bytes)")
    return path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--ignore-certificate-errors"])
    ctx = browser.new_context(viewport={"width": 1440, "height": 940}, device_scale_factor=1.5)
    page = ctx.new_page()

    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    print("Opening", URL)
    page.goto(URL, wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(9000)  # let satellite layers & pipeline settle

    # --- 1. Header (top strip) ---
    header = page.locator("header").first
    header.screenshot(path=os.path.join(SS_DIR, "ss_header.png"))
    print("OK ss_header.png")

    # --- 2. Risk Status Gauge (top telemetry panel) ---
    gauge = page.locator("div.telemetry-panel").nth(0)
    # The first telemetry-panel is the risk gauge block (contains PFVI)
    try:
        gauge.screenshot(path=os.path.join(SS_DIR, "ss_gauge.png"))
        print("OK ss_gauge.png")
    except Exception as e:
        print("gauge err", e)

    # --- 3. Live Satellite Map ---
    map_el = page.locator("div.telemetry-panel").nth(1)
    try:
        map_el.screenshot(path=os.path.join(SS_DIR, "ss_map.png"))
        print("OK ss_map.png")
    except Exception as e:
        print("map err", e)

    # --- 4. Pipeline Controls ---
    pipe = page.locator("div.telemetry-panel").nth(2)
    try:
        pipe.screenshot(path=os.path.join(SS_DIR, "ss_pipeline.png"))
        print("OK ss_pipeline.png")
    except Exception as e:
        print("pipeline err", e)

    # --- 5. Forecast Charts (first chart panel) ---
    charts = page.locator("div.telemetry-panel").nth(3)
    try:
        charts.screenshot(path=os.path.join(SS_DIR, "ss_charts.png"))
        print("OK ss_charts.png")
    except Exception as e:
        print("charts err", e)

    # --- 6. Scenario Simulator (what-if) ---
    sim = page.locator("div.telemetry-panel").nth(4)
    try:
        sim.screenshot(path=os.path.join(SS_DIR, "ss_simulator.png"))
        print("OK ss_simulator.png")
    except Exception as e:
        print("sim err", e)

    # --- 7. Theoretical Specs Modal ---
    try:
        page.get_by_role("button", name="Spesifikasi Teoretis").click(timeout=8000)
        page.wait_for_timeout(1200)
        modal = page.locator("div.fixed.inset-0.z-\\[100\\]")
        modal.screenshot(path=os.path.join(SS_DIR, "ss_modal.png"))
        print("OK ss_modal.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)
    except Exception as e:
        print("modal err", e)

    # --- 8. Full page overview (top) ---
    page.screenshot(path=os.path.join(SS_DIR, "ss_fulltop.png"), full_page=False)
    print("OK ss_fulltop.png")

    # --- 9. API docs (Swagger) as feature 8 screenshot ---
    try:
        page.goto(URL + "api/v1/docs", wait_until="networkidle", timeout=45000)
        page.wait_for_timeout(3500)
        page.screenshot(path=os.path.join(SS_DIR, "ss_api.png"))
        print("OK ss_api.png")
    except Exception as e:
        print("api docs err", e)

    browser.close()

print("\n--- console errors ---")
for e in errors[:12]:
    print("ERR:", e)
print("DONE")