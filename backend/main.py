import os
import json
import urllib.request
import numpy as np
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from peatfr_engine.pfvi import simulate_pfvi, optimize_pfvi_parameters, calculate_di_obs
from peatfr_engine.imputation import impute_peatfr_data
from peatfr_engine.forecasting import forecast_peatfr_variables
from peatfr_engine.fire_intelligence import fire_engine

app = FastAPI(
    title="PeatFR EWS Engine API",
    description="Early Warning System & Fire Vulnerability Index (PFVI) Forecasting API for Tropical Peatlands",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("/app/screenshots", exist_ok=True)
app.mount("/api/v1/screenshots", StaticFiles(directory="/app/screenshots"), name="screenshots")

# Load Indonesia Administrative Regions
ADMIN_FILE = os.path.join(os.path.dirname(__file__), "peatfr_engine", "indonesia_admin.json")
try:
    with open(ADMIN_FILE) as f:
        INDONESIA_REGIONS = json.load(f)
except Exception:
    INDONESIA_REGIONS = []

class ImputeRequest(BaseModel):
    WT: List[Optional[float]]
    SM: List[Optional[float]]
    Rf: List[Optional[float]]
    Temp: List[Optional[float]]
    method: str = Field("knn", description="imputation method: knn, spline, loess, linear")
    k: int = Field(5, description="k parameter for kNN")

class ForecastRequest(BaseModel):
    WT: List[float]
    SM: List[float]
    Rf: List[float]
    Temp: List[float]
    h: int = Field(4, description="forecasting horizon (days)")
    model: str = Field("arima", description="model type: arima, lstm, gru")
    look_back: int = Field(12, description="sliding window for LSTM/GRU")
    hidden_units: int = Field(32, description="neurons count")
    epochs: int = Field(50, description="training epochs")

class AutoPipelineRequest(BaseModel):
    WT: List[Optional[float]]
    SM: List[Optional[float]]
    Rf: List[Optional[float]]
    Temp: List[Optional[float]]
    imputation: str = Field("knn")
    model: str = Field("arima")
    h: int = Field(4)
    r0: float = Field(3000.0)
    look_back: int = Field(12)
    hidden_units: int = Field(32)
    epochs: int = Field(50)

@app.get("/")
@app.head("/")
def read_root():
    return {
        "status": "online",
        "service": "PeatFR Early Warning System Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/v1/health")
@app.head("/api/v1/health")
def health_check():
    return {"status": "ok", "engine": "Python PyTorch & SciPy PeatFR Core"}

@app.get("/api/v1/indonesia/regions")
def get_indonesia_regions():
    """Returns administrative hierarchy of Indonesia Peatland Provinces & Regencies."""
    return {"status": "success", "provinces": INDONESIA_REGIONS}

@app.get("/api/v1/realtime-peatland-data")
def get_realtime_openmeteo_data(
    lat: float = Query(-2.321, description="Latitude coordinate"),
    lon: float = Query(113.901, description="Longitude coordinate"),
    days: int = Query(30, description="Past days of historical open satellite data")
):
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"daily=temperature_2m_max,precipitation_sum&"
            f"hourly=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm&"
            f"timezone=Asia%2FJakarta&past_days={days}&forecast_days=1"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (PeatFR-EWS/1.0)"})
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode())
        
        daily = data["daily"]
        hourly = data["hourly"]
        
        dates = daily["time"]
        temp_max = daily["temperature_2m_max"]
        precip = daily["precipitation_sum"]
        
        sm_0_7 = np.array(hourly["soil_moisture_0_to_7cm"])
        sm_7_28 = np.array(hourly["soil_moisture_7_to_28cm"])
        sm_combined = (sm_0_7 * 0.4 + sm_7_28 * 0.6)
        
        n_days = len(dates)
        sm_raw = sm_combined[:n_days * 24].reshape(n_days, 24).mean(axis=1)
        
        sm_pct = np.clip(32.0 + ((sm_raw - 0.08) / (0.42 - 0.08)) * 43.0, 30.0, 75.0)
        wt_est = -0.30 - 0.012 * (65.0 - sm_pct) - 0.004 * np.maximum(0, 5.0 - np.array(precip))
        wt_est = np.clip(wt_est, -1.8, -0.1)

        # Multi-Source Fire Intelligence
        fire_nearby = fire_engine.fetch_fireping_nearby(lat, lon, radius_m=25000)
        latest_temp = float(temp_max[-1]) if temp_max else 34.0
        latest_rf = float(precip[-1]) if precip else 0.0
        latest_sm = float(sm_pct[-1]) if len(sm_pct) > 0 else 40.0
        fwi_intel = fire_engine.fetch_owm_fwi(lat, lon, temp=latest_temp, rf=latest_rf, sm=latest_sm)
        
        return {
            "source": "Open-Meteo / ERA5-Land Realtime Satellite Data",
            "lat": lat,
            "lon": lon,
            "dates": dates,
            "WT": np.round(wt_est, 3).tolist(),
            "SM": np.round(sm_pct, 2).tolist(),
            "Rf": np.round(precip, 2).tolist(),
            "Temp": np.round(temp_max, 2).tolist(),
            "fire_intelligence": {
                "nearby": fire_nearby,
                "fwi": fwi_intel
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch realtime open data: {str(e)}")

@app.get("/api/v1/fire-intelligence/nearby")
def get_nearby_fires(
    lat: float = Query(-2.321, description="Latitude"),
    lon: float = Query(113.901, description="Longitude"),
    radius_m: int = Query(25000, description="Radius in meters")
):
    """Fetch nearby satellite fire detection & GWIS 7-day burned area (FirePing Public API)."""
    return fire_engine.fetch_fireping_nearby(lat, lon, radius_m=radius_m)

@app.get("/api/v1/fire-intelligence/gfw-peatland-fires")
def get_gfw_peatland_fires(
    limit: int = Query(100, description="Maximum fire alerts")
):
    """Fetch vector NASA VIIRS active fire alerts specifically on Indonesian peatlands (is__peatland = true)."""
    return fire_engine.fetch_gfw_peatland_fires(limit=limit)

@app.get("/api/v1/fire-intelligence/firms-hotspots")
def get_firms_hotspots(
    bbox: str = Query("95,-11,141,6", description="Bounding box [min_lon,min_lat,max_lon,max_lat]"),
    source: str = Query("VIIRS_SNPP_NRT", description="Satellite sensor: VIIRS_SNPP_NRT, MODIS_NRT, VIIRS_NOAA20_NRT, VIIRS_NOAA21_NRT"),
    day_range: int = Query(1, ge=1, le=10, description="Range of days back (1-10)")
):
    """Fetch live NASA FIRMS active fire hotspots via authorized MAP_KEY."""
    return fire_engine.fetch_firms_hotspots(bbox=bbox, source=source, day_range=day_range)

@app.get("/api/v1/fire-intelligence/severe-alerts")
def get_severe_fire_alerts():
    """Fetch active severe fire alerts (Kebakaran Parah) across Indonesian Peatlands."""
    return fire_engine.fetch_severe_fire_alerts()

@app.get("/api/v1/fire-intelligence/fwi")
def get_fwi_forecast(
    lat: float = Query(-2.321, description="Latitude"),
    lon: float = Query(113.901, description="Longitude")
):
    """Fetch Fire Weather Index (FWI) forecast (OpenWeatherMap / Canadian FWI Engine)."""
    return fire_engine.fetch_owm_fwi(lat, lon)

@app.get("/api/v1/sabangau-sample")
def get_sabangau_sample():
    np.random.seed(42)
    days = 192
    time_idx = np.arange(days)
    
    wt = -0.4 - 0.65 * (1.0 / (1.0 + np.exp(-(time_idx - 100) / 20.0))) + np.random.normal(0, 0.02, days)
    sm = 65.0 - 27.0 * (1.0 / (1.0 + np.exp(-(time_idx - 100) / 20.0))) + np.random.normal(0, 1.2, days)
    rf = np.maximum(0.0, np.random.exponential(8.0, days) * (1.0 - (time_idx / 220.0)))
    temp = 31.5 + 4.0 * (1.0 / (1.0 + np.exp(-(time_idx - 100) / 25.0))) + np.random.normal(0, 0.4, days)
    
    wt_raw = wt.copy()
    sm_raw = sm.copy()
    rf_raw = rf.copy()
    temp_raw = temp.copy()
    
    wt_raw[114:117] = np.nan
    sm_raw[114:117] = np.nan
    rf_raw[114:117] = np.nan
    temp_raw[145] = np.nan
    
    return {
        "location": "Sabangau, Central Kalimantan, Indonesia",
        "time_steps": days,
        "WT": [None if np.isnan(x) else round(float(x), 3) for x in wt_raw],
        "SM": [None if np.isnan(x) else round(float(x), 2) for x in sm_raw],
        "Rf": [None if np.isnan(x) else round(float(x), 2) for x in rf_raw],
        "Temp": [None if np.isnan(x) else round(float(x), 2) for x in temp_raw]
    }

@app.post("/api/v1/impute")
def impute_data(req: ImputeRequest):
    try:
        wt = np.array(req.WT, dtype=float)
        sm = np.array(req.SM, dtype=float)
        rf = np.array(req.Rf, dtype=float)
        temp = np.array(req.Temp, dtype=float)
        
        res = impute_peatfr_data(wt, sm, rf, temp, method=req.method, k=req.k)
        
        return {
            "method": req.method,
            "WT": res["WT"].tolist(),
            "SM": res["SM"].tolist(),
            "Rf": res["Rf"].tolist(),
            "Temp": res["Temp"].tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/forecast")
def forecast_data(req: ForecastRequest):
    try:
        wt = np.array(req.WT, dtype=float)
        sm = np.array(req.SM, dtype=float)
        rf = np.array(req.Rf, dtype=float)
        temp = np.array(req.Temp, dtype=float)
        
        res = forecast_peatfr_variables(
            wt, sm, rf, temp,
            h=req.h,
            model=req.model,
            look_back=req.look_back,
            hidden_units=req.hidden_units,
            epochs=req.epochs
        )
        
        return {
            "model": req.model,
            "h": req.h,
            "WT_pred": res["WT_pred"].tolist(),
            "SM_pred": res["SM_pred"].tolist(),
            "Rf_pred": res["Rf_pred"].tolist(),
            "Temp_pred": res["Temp_pred"].tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/pipeline/auto")
def run_auto_pipeline(req: AutoPipelineRequest):
    try:
        wt_in = np.array(req.WT, dtype=float)
        sm_in = np.array(req.SM, dtype=float)
        rf_in = np.array(req.Rf, dtype=float)
        temp_in = np.array(req.Temp, dtype=float)
        
        has_nans = any(np.isnan(wt_in)) or any(np.isnan(sm_in)) or any(np.isnan(rf_in)) or any(np.isnan(temp_in))
        
        if has_nans:
            imp_res = impute_peatfr_data(wt_in, sm_in, rf_in, temp_in, method=req.imputation)
            wt_clean = imp_res["WT"]
            sm_clean = imp_res["SM"]
            rf_clean = imp_res["Rf"]
            temp_clean = imp_res["Temp"]
        else:
            wt_clean, sm_clean, rf_clean, temp_clean = wt_in, sm_in, rf_in, temp_in
            
        fc_res = forecast_peatfr_variables(
            wt_clean, sm_clean, rf_clean, temp_clean,
            h=req.h,
            model=req.model,
            look_back=req.look_back,
            hidden_units=req.hidden_units,
            epochs=req.epochs
        )
        
        wt_full = np.concatenate([wt_clean, fc_res["WT_pred"]])
        sm_full = np.concatenate([sm_clean, fc_res["SM_pred"]])
        rf_full = np.concatenate([rf_clean, fc_res["Rf_pred"]])
        temp_full = np.concatenate([temp_clean, fc_res["Temp_pred"]])
        
        opt_params, opt_mse = optimize_pfvi_parameters(wt_clean, sm_clean, rf_clean, temp_clean, r0=req.r0)
        a_h, b_h, n, alpha = opt_params
        
        pfvi_sim = simulate_pfvi(wt_full, sm_full, rf_full, temp_full, a_h, b_h, n, alpha, r0=req.r0)
        
        pfvi_series = pfvi_sim["pfvi"].tolist()
        pfvi_forecast = pfvi_series[-req.h:]
        
        risk_categories = []
        for val in pfvi_forecast:
            if val < 75:
                risk_categories.append("Low")
            elif val < 150:
                risk_categories.append("Moderate")
            elif val < 225:
                risk_categories.append("High")
            else:
                risk_categories.append("Extreme")
                
        current_status = risk_categories[-1] if risk_categories else "Unknown"
        
        return {
            "status": "success",
            "has_missing_data_imputed": has_nans,
            "imputation_method": req.imputation,
            "forecasting_model": req.model,
            "optimization": {
                "a_h": float(a_h),
                "b_h": float(b_h),
                "n": float(n),
                "alpha": float(alpha),
                "mse": float(opt_mse)
            },
            "historical_len": len(wt_clean),
            "forecast_horizon": req.h,
            "forecast": {
                "WT": fc_res["WT_pred"].tolist(),
                "SM": fc_res["SM_pred"].tolist(),
                "Rf": fc_res["Rf_pred"].tolist(),
                "Temp": fc_res["Temp_pred"].tolist(),
                "PFVI": pfvi_forecast,
                "Risk_Categories": risk_categories,
                "Current_Status": current_status
            },
            "full_series": {
                "WT": wt_full.tolist(),
                "SM": sm_full.tolist(),
                "Rf": rf_full.tolist(),
                "Temp": temp_full.tolist(),
                "PFVI": pfvi_series,
                "DI_obs": pfvi_sim["di_obs"].tolist(),
                "DF": pfvi_sim["df"].tolist(),
                "RF": pfvi_sim["rf"].tolist(),
                "WTF": pfvi_sim["wtf"].tolist()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
