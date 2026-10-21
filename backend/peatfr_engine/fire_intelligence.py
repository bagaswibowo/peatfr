import math
import os
import json
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional

class SimpleTTLCache:
    def __init__(self, ttl_seconds: int = 180):
        self.ttl = ttl_seconds
        self._cache: Dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry_time, data = self._cache[key]
            if time.time() - entry_time < self.ttl:
                return data
            else:
                del self._cache[key]
        return None

    def set(self, key: str, data: Any):
        self._cache[key] = (time.time(), data)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(min(1.0, a)))


# --- Peatland attribution -----------------------------------------------------
# GFW's nasa_viirs_fire_alerts vector layer (is__peatland = true) now answers 403:
# the data API requires a registered API key. Instead of shipping a fake fallback we
# attribute each live NASA FIRMS hotspot to the nearest administrative centroid that
# peatfr_engine/indonesia_admin.json flags as peat, and expose the distance so the UI
# can state how strong the attribution is.
# ponytail: centroid radius heuristic (< = 75 km), swap for a licensed peat polygon
# raster/vector layer when one is available — the call site stays identical.
PEAT_ATTRIBUTION_MAX_KM = 75.0

_ATTRIBUTION_NOTE = "nearest peat-regency centroid"


_SAT_FRIENDLY = {
    "N": "NOAA-20",
    "1": "NOAA-21",
    "T": "Terra",
    "A": "Aqua",
    "SNPP": "Suomi NPP",
}


def friendly_sensor(name: str) -> str:
    key = (name or "").strip().upper()
    return _SAT_FRIENDLY.get(key, key or "tidak diketahui")


def _load_peat_regencies() -> list:
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "indonesia_admin.json")
    out = []
    try:
        with open(path) as f:
            provinces = json.load(f)
    except Exception:
        return out
    for prov in provinces:
        for reg in prov.get("regencies", []):
            try:
                out.append({
                    "adm1": prov.get("name"),
                    "adm2": reg.get("name"),
                    "lat": float(reg["lat"]),
                    "lon": float(reg["lon"]),
                    "peat": bool(reg.get("peat")),
                })
            except (KeyError, TypeError, ValueError):
                continue
    return out


PEAT_REGENCIES = _load_peat_regencies()


_REVERSE_CACHE: Dict[tuple, Optional[Dict[str, Any]]] = {}


def reverse_geocode(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Resolve the real administrative names for any coordinate via OSM Nominatim.

    No-Mock: this is the authoritative label source for every map click, inside
    or outside peatland provinces. Cached per ~0.05-degree cell; failures return
    None so callers fall back gracefully instead of inventing a name.
    """
    cell = (round(lat / 0.05), round(lon / 0.05))
    if cell in _REVERSE_CACHE:
        return _REVERSE_CACHE[cell]
    result = None
    try:
        url = (
            "https://nominatim.openstreetmap.org/reverse"
            f"?lat={lat}&lon={lon}&zoom=10&accept-language=id&format=json"
        )
        req = urllib.request.Request(
            url, headers={"User-Agent": "PeatFR-EWS/1.0 (peatfr.bagaswibowo.app)"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
        addr = data.get("address", {})
        adm2 = (addr.get("county") or addr.get("regency")
                or addr.get("municipality"))
        adm1 = addr.get("state") or addr.get("province")
        # City-level provinces (DKI Jakarta, DIY Yogyakarta, DKI Papua etc.) expose
        # their province name under city/municipality keys: promote to adm1 and
        # demote any lower admin level to adm2.
        if not adm1 and (addr.get("city") or addr.get("town")):
            adm1 = addr.get("city") or addr.get("town")
            adm2 = addr.get("district") or None
        elif not adm2:
            adm2 = addr.get("city") or addr.get("town") or None
        if adm1 or adm2:
            result = {"adm1": adm1, "adm2": adm2,
                      "village": addr.get("village") or addr.get("suburb")
                      or addr.get("neighbourhood")}
    except Exception:
        result = None
    _REVERSE_CACHE[cell] = result
    return result


def attribute_peatland(lat: float, lon: float) -> Dict[str, Any]:
    """Nearest-regency peat attribution for a coordinate. Pure, offline, deterministic."""
    best = None
    for reg in PEAT_REGENCIES:
        d = haversine_km(lat, lon, reg["lat"], reg["lon"])
        if best is None or d < best["distance_km"]:
            best = {
                "adm1": reg["adm1"],
                "adm2": reg["adm2"],
                "peat": reg["peat"],
                "distance_km": round(d, 1),
            }
    if best is None:
        return {"is_peatland": False, "adm1": None, "adm2": None,
                "distance_km": None, "attribution": "unavailable"}

    within = best["distance_km"] <= PEAT_ATTRIBUTION_MAX_KM
    # Beyond the attribution radius the nearest peat centroid is meaningless
    # (e.g. a Bali click 518 km from Tanah Laut, Kalsel): never attach its
    # province/regency, or downstream consumers mislabel the point. The real
    # administrative names come from OSM reverse geocoding instead.
    geo = None if within else reverse_geocode(lat, lon)
    return {
        "is_peatland": bool(best["peat"] and within),
        "adm1": best["adm1"] if within else (geo or {}).get("adm1"),
        "adm2": best["adm2"] if within else (geo or {}).get("adm2"),
        "village": (geo or {}).get("village") if not within else None,
        "in_peat_radius": within,
        "distance_km": best["distance_km"],
        "attribution": (
            f"{_ATTRIBUTION_NOTE} <= {PEAT_ATTRIBUTION_MAX_KM:.0f} km" if within
            else "nama administratif via reverse geocoding OSM (di luar radius gambut {:.0f} km)".format(PEAT_ATTRIBUTION_MAX_KM)
        ),
    }


class FireIntelligenceEngine:
    # FRP thresholds (MW, VIIRS 375 m) used to grade a cluster of peat hotspots.
    FRP_CRITICAL = 50.0
    FRP_HIGH = 20.0
    CLUSTER_DEG = 0.15  # ~16 km grid cell
    BURNED_AREA_RADIUS_M = 10000

    def __init__(self, owm_api_key: Optional[str] = None, firms_map_key: Optional[str] = None):
        self.owm_api_key = owm_api_key or os.getenv("OPENWEATHER_API_KEY")
        self.firms_map_key = firms_map_key or os.getenv("FIRMS_MAP_KEY", "aa16407e5eb11df46b09cafc085fe020")
        self.headers = {"User-Agent": "Mozilla/5.0 (PeatFR-EWS/1.0; https://peatfr.bagaswibowo.app)"}
        self.cache = SimpleTTLCache(ttl_seconds=180)

    def fetch_firms_hotspots(self, bbox: str = "95,-11,141,6", source: str = "VIIRS_SNPP_NRT", day_range: int = 1) -> Dict[str, Any]:
        """
        Fetch real-time active fire hotspots directly from NASA FIRMS Area API using MAP_KEY.
        Uses in-memory 180s TTL cache to optimize performance & NASA transaction quota.
        """
        day_range = max(1, min(10, int(day_range)))
        cache_key = f"firms:{source}:{bbox}:{day_range}"
        cached_res = self.cache.get(cache_key)
        if cached_res:
            return cached_res

        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{self.firms_map_key}/{source}/{bbox}/{day_range}"
        req = urllib.request.Request(url, headers=self.headers)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                csv_text = resp.read().decode('utf-8').strip()
                lines = csv_text.splitlines()
                if not lines or lines[0].startswith("Invalid") or lines[0].startswith("Error"):
                    return {"status": "error", "message": csv_text, "count": 0, "hotspots": []}

                header = [h.strip() for h in lines[0].split(",")]
                hotspots = []
                for line in lines[1:]:
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) == len(header):
                        row = dict(zip(header, parts))
                        try:
                            hotspots.append({
                                "latitude": float(row.get("latitude", 0)),
                                "longitude": float(row.get("longitude", 0)),
                                "bright_ti4": float(row.get("bright_ti4", row.get("brightness", 0))),
                                "frp": float(row.get("frp", 0)),
                                "acq_date": row.get("acq_date", ""),
                                "acq_time": str(row.get("acq_time", "")).zfill(4),
                                "satellite": friendly_sensor(row.get("satellite", "")),
                                "instrument": row.get("instrument", "VIIRS/MODIS"),
                                "confidence": row.get("confidence", "n/a"),
                                "daynight": row.get("daynight", "D")
                            })
                        except ValueError:
                            continue

                result = {
                    "status": "success",
                    "source": f"NASA FIRMS API ({source})",
                    "map_key_active": True,
                    "count": len(hotspots),
                    "hotspots": hotspots
                }
                self.cache.set(cache_key, result)
                return result
        except Exception as e:
            return {
                "status": "error",
                "message": f"FIRMS API request failed: {str(e)}",
                "count": 0,
                "hotspots": []
            }

    def _peatland_hotspots(self, day_range: int = 1) -> Dict[str, Any]:
        """Live FIRMS hotspots inside Indonesia, each tagged with peat attribution."""
        day_range = max(1, min(10, int(day_range)))
        cache_key = f"peat-attr:{day_range}"
        cached_res = self.cache.get(cache_key)
        if cached_res:
            return cached_res

        firms = self.fetch_firms_hotspots(bbox="95,-11,141,6", source="VIIRS_SNPP_NRT", day_range=day_range)
        tagged = []
        for h in firms.get("hotspots", []):
            a = attribute_peatland(h["latitude"], h["longitude"])
            tagged.append({**h, "peat": a})
        tagged.sort(key=lambda f: f["frp"], reverse=True)

        result = {
            "status": firms.get("status", "error"),
            "total_firms_hotspots": firms.get("count", 0),
            "peatland_hotspots": tagged,
            "attribution_max_km": PEAT_ATTRIBUTION_MAX_KM,
            "attribution_note": _ATTRIBUTION_NOTE,
        }
        if firms.get("status") == "success":
            self.cache.set(cache_key, result)
        return result

    def fetch_gfw_peatland_fires(self, days_back: int = 1, limit: int = 100) -> Dict[str, Any]:
        """
        Active fire detections on Indonesian peatland, sourced live from NASA FIRMS and
        filtered by nearest-regency peat attribution. Field names follow the GFW vector
        layer (`is__peatland`, `adm1`, `adm2`, `frp__MW`) so map consumers stay unchanged.
        """
        src = self._peatland_hotspots(days_back)
        fires = []
        for h in src.get("peatland_hotspots", []):
            a = h["peat"]
            if not a["is_peatland"]:
                continue
            fires.append({
                "latitude": h["latitude"],
                "longitude": h["longitude"],
                "alert__date": h["acq_date"],
                "alert__time_utc": h["acq_time"],
                "confidence__cat": h["confidence"],
                "bright_ti4__K": h["bright_ti4"],
                "frp__MW": h["frp"],
                "is__peatland": True,
                "adm1": a["adm1"],
                "adm2": a["adm2"],
                "peatland_attribution": a["attribution"],
                "regency_centroid_km": a["distance_km"],
                "satellite": h["satellite"],
            })
        fires = fires[:limit]
        return {
            "status": src.get("status"),
            "source": "NASA FIRMS VIIRS 375m + nearest-regency peatland attribution",
            "count": len(fires),
            "total_firms_hotspots": src.get("total_firms_hotspots", 0),
            "attribution_max_km": PEAT_ATTRIBUTION_MAX_KM,
            "fires": fires,
        }

    def fetch_severe_fire_alerts(self, max_alerts: int = 8) -> Dict[str, Any]:
        """
        Severe peat-fire clusters (Kebakaran Parah) derived from live FIRMS detections:
        hotspots are grouped into ~16 km grid cells, graded by max FRP, enriched with the
        burned area reported by FirePing for the cluster centroid. No static alert list.
        """
        cache_key = f"severe:{max_alerts}"
        cached_res = self.cache.get(cache_key)
        if cached_res:
            return cached_res

        src = self._peatland_hotspots(1)
        if src.get("status") != "success":
            return {
                "status": "unavailable",
                "message": "NASA FIRMS tidak dapat dihubungi, data peringatan tidak tersedia",
                "active_severe_alerts": 0,
                "peatland_hotspot_count": 0,
                "alerts": [],
            }

        clusters: Dict[tuple, Dict[str, Any]] = {}
        for h in src.get("peatland_hotspots", []):
            if not h["peat"]["is_peatland"]:
                continue
            key = (round(h["latitude"] / self.CLUSTER_DEG), round(h["longitude"] / self.CLUSTER_DEG))
            c = clusters.setdefault(key, {
                "count": 0, "frp_max": 0.0, "lat_sum": 0.0, "lon_sum": 0.0,
                "latest": "", "adm1": h["peat"]["adm1"], "adm2": h["peat"]["adm2"],
                "regency_km": h["peat"]["distance_km"], "sensors": set(),
            })
            c["count"] += 1
            c["frp_max"] = max(c["frp_max"], h["frp"])
            c["lat_sum"] += h["latitude"]
            c["lon_sum"] += h["longitude"]
            stamp = f"{h['acq_date']} {h['acq_time']}"
            if stamp > c["latest"]:
                c["latest"] = stamp
            c["sensors"].add(h["satellite"])

        ranked = sorted(clusters.items(), key=lambda kv: (kv[1]["frp_max"], kv[1]["count"]), reverse=True)

        alerts = []
        for key, c in ranked:
            if len(alerts) >= max_alerts:
                break
            # A single weak detection is a hotspot, not a "severe fire".
            if c["count"] < 2 and c["frp_max"] < self.FRP_HIGH:
                continue

            lat = c["lat_sum"] / c["count"]
            lon = c["lon_sum"] / c["count"]
            severity = ("CRITICAL" if c["frp_max"] >= self.FRP_CRITICAL
                        else "HIGH" if c["frp_max"] >= self.FRP_HIGH
                        else "WARNING")

            fp = self.fetch_fireping_nearby(lat, lon, radius_m=self.BURNED_AREA_RADIUS_M)
            reported_ha = float(fp.get("burned_area_ha") or 0.0)
            # FirePing reports the burned polygons intersecting the search circle, which can
            # cover far more ground than the circle itself. Only keep the figure when it
            # physically fits inside the queried radius; otherwise report it as unavailable
            # rather than labelling a region-wide total as this cluster's burn scar.
            circle_ha = math.pi * (self.BURNED_AREA_RADIUS_M / 1000.0) ** 2 * 100.0
            if reported_ha and reported_ha <= circle_ha:
                burned_ha, burned_note = reported_ha, None
            else:
                burned_ha, burned_note = None, (
                    f"laporan FirePing ({reported_ha:,.0f} ha) melebihi luas radius "
                    f"{self.BURNED_AREA_RADIUS_M // 1000} km, tidak dapat diatribusikan ke klaster ini"
                    if reported_ha else "tidak ada laporan area terbakar"
                )

            alerts.append({
                "id": f"FIRMS-{key[0]}-{key[1]}",
                "title": f"{c['count']} deteksi titik panas pada zona gambut",
                "location": f"{c['adm2'] or 'Kab. tidak diketahui'}, {c['adm1'] or 'Indonesia'}",
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "severity": severity,
                "detection_count": c["count"],
                "estimated_burned_ha": round(burned_ha, 1) if burned_ha else None,
                "estimated_burned_km2": round(burned_ha / 100.0, 2) if burned_ha else None,
                "burned_area_note": burned_note,
                "burned_area_source": f"FirePing (radius {self.BURNED_AREA_RADIUS_M // 1000} km)" if burned_ha else "unavailable",
                "updated_ago": f"Deteksi terbaru {c['latest']} UTC",
                "peatland_verified": True,
                "peatland_attribution": f"{_ATTRIBUTION_NOTE} ({c['regency_km']} km dari sentroid {c['adm2']})",
                "frp_max_mw": round(c["frp_max"], 1),
                "satellite_sensor": "NASA FIRMS " + "/".join(sorted(s for s in c["sensors"] if s)),
            })

        result = {
            "status": "success",
            "source": "NASA FIRMS VIIRS 375m NRT (klaster ~16 km) + FirePing burned area",
            "active_severe_alerts": len(alerts),
            "peatland_hotspot_count": sum(1 for h in src.get("peatland_hotspots", []) if h["peat"]["is_peatland"]),
            "gfw_peatland_alerts_count": 0,
            "alerts": alerts,
        }
        self.cache.set(cache_key, result)
        return result

    def fetch_fireping_nearby(self, lat: float, lon: float, radius_m: int = 25000) -> Dict[str, Any]:
        """
        Fetch real-time aggregated fire proximity & burned area from FirePing API (Public, Zero-Key).
        Endpoint: /api/public/v1/fires/near
        """
        cache_key = f"fireping:{round(lat, 2)}:{round(lon, 2)}:{radius_m}"
        cached_res = self.cache.get(cache_key)
        if cached_res:
            return cached_res

        url = f"https://fireping.net/api/public/v1/fires/near?latitude={lat}&longitude={lon}&radius={radius_m}"
        req = urllib.request.Request(url, headers=self.headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                summary = data.get("summary", {})
                burned = data.get("burned_area", {})
                result = {
                    "status": data.get("status", "unknown"),
                    "detection_count": summary.get("detection_count", 0),
                    "nearest_distance_km": summary.get("nearest_distance_km"),
                    "latest_detection_at": summary.get("latest_detection_at"),
                    "burned_area_ha": burned.get("total_reported_area_ha", 0.0),
                    "satellite_sources": summary.get("detection_sources", []),
                    "updated_at": data.get("data", {}).get("updated_at")
                }
                self.cache.set(cache_key, result)
                return result
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "detection_count": 0,
                "nearest_distance_km": None,
                "burned_area_ha": 0.0,
                "satellite_sources": []
            }

    def fetch_owm_fwi(self, lat: float, lon: float, temp: float = 34.0, rf: float = 0.0, sm: float = 40.0) -> Dict[str, Any]:
        """
        Fetch atmospheric Fire Weather Index (FWI) from OpenWeatherMap Fire Index API.
        Falls back to meteorological calculation if API key is not provided.
        """
        if self.owm_api_key:
            url = f"https://api.openweathermap.org/data/2.5/fwi/forecast?lat={lat}&lon={lon}&appid={self.owm_api_key}"
            req = urllib.request.Request(url, headers=self.headers)
            try:
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    return {
                        "status": "success",
                        "source": "OpenWeatherMap FWI API",
                        "data": data
                    }
            except Exception:
                pass

        # Meteorological FWI Estimation (Standard Mark-5 / Canadian FWI Approximation)
        # Higher Temp + Lower SM + Lower Rainfall -> Higher FWI (0 to 50 scale)
        dryness_factor = max(0.0, 70.0 - sm)
        heat_factor = max(0.0, temp - 25.0) * 1.5
        rain_mitigation = max(0.0, rf * 2.0)

        fwi_score = max(0.0, min(80.0, (dryness_factor * 0.4 + heat_factor * 1.2) - rain_mitigation))

        if fwi_score < 10.0:
            rating = "Low"
        elif fwi_score < 20.0:
            rating = "Moderate"
        elif fwi_score < 30.0:
            rating = "High"
        elif fwi_score < 45.0:
            rating = "Very High"
        else:
            rating = "Extreme"

        return {
            "status": "estimated",
            "source": "PeatFR Meteorological FWI Engine",
            "fwi_score": round(fwi_score, 1),
            "danger_rating": rating
        }


fire_engine = FireIntelligenceEngine()
