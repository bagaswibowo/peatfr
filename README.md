# PeatFR — Fire Intelligence System & Early Warning Kebakaran Lahan Gambut

[![Live System](https://img.shields.io/badge/System-Live_Production-emerald?style=for-the-badge&logo=cloudflare)](https://peatfr.bagaswibowo.app/)
[![Notion Manual](https://img.shields.io/badge/Notion-User_Manual-blue?style=for-the-badge&logo=notion)](https://app.notion.com/p/dosen0601/User-Manual-PEAT-FR-3cd86925eac58022a044e1325f116343)
[![Journal Paper](https://img.shields.io/badge/Ecological_Informatics-2025-orange?style=for-the-badge&logo=elsevier)](https://doi.org/10.1016/j.ecoinf.2025.103532)

**PeatFR (Peatland Fire Vulnerability Index & Early Warning System)** adalah platform pemantauan dan sistem peringatan dini berbasis web yang dirancang untuk memetakan dan memprediksi risiko kebakaran lahan gambut tropis di Indonesia (*Mahdiyasa et al., 2025 — Ecological Informatics 92*).

Platform ini menghubungkan model stokastik ARIMA + Box-Cox, deep learning PyTorch (LSTM & GRU), optimasi fisik Nelder-Mead, telemetri Open-Meteo ERA5, citra thermal NASA FIRMS VIIRS 375m / MODIS, dan layer tutupan lahan gambut Global Forest Watch (GFW).

---

## 📌 Links & Resource Quick Access

- **Production Live URL:** [https://peatfr.bagaswibowo.app/](https://peatfr.bagaswibowo.app/)
- **Notion Interactive User Manual:** [User Manual PEAT FR (Dosen 0601)](https://app.notion.com/p/dosen0601/User-Manual-PEAT-FR-3cd86925eac58022a044e1325f116343)
- **Baseline Journal Paper:** *Peatfr: An R package to forecast tropical peatland fire risk with stochastic, machine learning, and optimisation methods* (Ecological Informatics 92, DOI: `10.1016/j.ecoinf.2025.103532`)
- **Baseline R Package GitHub:** [https://github.com/mellygsln/peatfr](https://github.com/mellygsln/peatfr)
- **Sabangau Benchmark Dataset:** [https://bit.ly/DatasetSabangau](https://bit.ly/DatasetSabangau)

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                    1. EXTERNAL DATA PROVIDERS LAYER                               |
|  [Open-Meteo ERA5]  [NASA FIRMS API]  [GFW Peatland]  [FirePing/GWIS]            |
|  [NASA GIBS WMS]    [OpenWeather FWI]                                             |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    2. BACKEND COMPUTATION ENGINE (FastAPI Container :8097)        |
|  - Realtime Satellite Proxy & Hydrologic Telemetry Mapper (ESTIMATE WT/SM)        |
|  - Physical Engine (PFVI: DF evapotranspirasi, RF rain, WTF van Genuchten)        |
|  - SciPy Nelder-Mead Optimization with Physical Bounds (a_H, b_H >= 0)            |
|  - PyTorch Deep Learning (LSTM/GRU) & Stochastic ARIMA+Box-Cox Forecasting        |
|  - Multi-Source Fire Intelligence Aggregator (TTL-cached)                         |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    3. CONTAINER & INFRASTRUCTURE LAYER                            |
|  [peatfr-api: Python 3.13]  <-->  [peatfr-web: Nginx+Vite]  <-->  [Cloudflare     |
|   (FastAPI :8097)                (:8098, React 18 Light)       Tunnel --network   |
|                                                                 host]             |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    4. CLIENT PRESENTATION LAYER (React 18 Light Mode)             |
|  [Cockpit Gauge] [Peta Satelit Live] [Pipeline Control] [Forecast Charts]         |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Key Features Built Beyond Baseline Journal R Package

| Feature Component | Baseline R Package (`peatfr`) | Production Web App (`peatfr.bagaswibowo.app`) |
|---|---|---|
| **Interface** | R Script / CLI | React 18 + Vite Crisp Light Mode Web Interface |
| **Backend Engine** | R package functions | Python 3.13 FastAPI Engine with PyTorch & SciPy |
| **Data Source** | Static CSV (Sabangau 192-day sample) | Live Realtime Open-Meteo ERA5 API (38 Indonesian Provinces) |
| **Fire Hotspots** | Offline points | Live NASA FIRMS API (VIIRS 375m & MODIS) within 50km radius |
| **Spatial GIS** | Static ggplot maps | Interactive Leaflet Map with GFW Peatland & NASA GIBS WMS |
| **Fire Intelligence** | None | Multi-Source Aggregator (FIRMS, GFW, FirePing/GWIS) |
| **Simulator** | Manual script rerun | Interactive What-If Weather Scenario Simulator Sliders |
| **Deployment** | Local R environment | Docker Compose + Cloudflare Tunnel Deployment |

---

## 🛠️ Quick Start (Docker Container Deployment)

```bash
# Clone repository
git clone https://github.com/bagaswibowo/peatfr.git
cd peatfr

# Start container services
docker-compose up -d --build

# Inspect logs
docker-compose logs -f peatfr-api
```

---

## 📄 License & Citation

Licensed under MIT License.
If using this software for academic research, please cite:

```bibtex
@article{Mahdiyasa2025peatfr,
  title = {Peatfr: An R package to forecast tropical peatland fire risk with stochastic, machine learning, and optimisation methods},
  author = {Mahdiyasa, Adilan W. and Melly and Pasaribu, Udjianna S. and Taufik, Muh and Muljadi, Bagus P.},
  journal = {Ecological Informatics},
  volume = {92},
  pages = {103532},
  year = {2025},
  publisher = {Elsevier},
  doi = {10.1016/j.ecoinf.2025.103532}
}
```
