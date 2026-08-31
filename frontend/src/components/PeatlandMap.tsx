import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Flame, Satellite, ShieldAlert, Radio, Crosshair, Zap, Navigation, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export interface LocationPreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface GfwPeatlandFire {
  latitude: number;
  longitude: number;
  alert__date: string;
  confidence__cat?: string;
  bright_ti4__K?: number;
  frp__MW?: number;
  is__peatland?: boolean;
  adm1?: string;
  adm2?: string;
}

export interface FirmsHotspot {
  latitude: number;
  longitude: number;
  bright_ti4: number;
  frp: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: string;
  daynight: string;
}

const FIRMS_MAP_KEY = "aa16407e5eb11df46b09cafc085fe020";

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 12px ${color}; cursor: pointer;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const createPeatlandFireIcon = () => {
  return L.divIcon({
    className: 'gfw-peatland-fire-marker',
    html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fee2e2; box-shadow: 0 0 14px #ef4444; animation: pulse 1.5s infinite; cursor: pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createFirmsHotspotIcon = () => {
  return L.divIcon({
    className: 'firms-hotspot-marker',
    html: `<div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffedd5; box-shadow: 0 0 10px #f97316; cursor: pointer;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const createTargetIcon = () => {
  return L.divIcon({
    className: 'clicked-target-marker',
    html: `<div style="background-color: #0284c7; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 14px #0284c7; cursor: pointer;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

function MapFlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 10, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

interface PeatlandMapProps {
  currentPfvi: number;
  status: string;
  location: LocationPreset;
  onSelectCustomLocation?: (lat: number, lon: number, name?: string) => void;
}

export const PeatlandMap: React.FC<PeatlandMapProps> = ({
  currentPfvi,
  status,
  location,
  onSelectCustomLocation
}) => {
  const pos: [number, number] = [location.lat, location.lon];

  // Live Satellite Overlay Layers state
  const [showFirmsWms, setShowFirmsWms] = useState(true);
  const [showFirmsVector, setShowFirmsVector] = useState(true);
  const [showGibsViirsDay, setShowGibsViirsDay] = useState(true);
  const [showGfwPeatland, setShowGfwPeatland] = useState(true);
  
  // Interactivity state
  const [clickedTarget, setClickedTarget] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'hotspot' | 'gfw' | 'station' | 'point';
    title: string;
    lat: number;
    lon: number;
    details: Record<string, any>;
  } | null>(null);

  const [gfwFires, setGfwFires] = useState<GfwPeatlandFire[]>([]);
  const [firmsHotspots, setFirmsHotspots] = useState<FirmsHotspot[]>([]);
  const [severeAlerts, setSevereAlerts] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/v1/fire-intelligence/severe-alerts')
      .then((res) => {
        if (res.data && res.data.alerts) {
          setSevereAlerts(res.data.alerts);
        }
      })
      .catch((err) => console.warn('Could not fetch severe fire alerts:', err));
  }, []);

  useEffect(() => {
    if (showGfwPeatland) {
      axios.get('/api/v1/fire-intelligence/gfw-peatland-fires?limit=100')
        .then((res) => {
          if (res.data && res.data.fires) {
            setGfwFires(res.data.fires);
          }
        })
        .catch((err) => console.warn('Could not fetch GFW peatland fires:', err));
    }
  }, [showGfwPeatland]);

  useEffect(() => {
    if (showFirmsVector) {
      axios.get('/api/v1/fire-intelligence/firms-hotspots?day_range=1')
        .then((res) => {
          if (res.data && res.data.hotspots) {
            setFirmsHotspots(res.data.hotspots);
          }
        })
        .catch((err) => console.warn('Could not fetch NASA FIRMS vector hotspots:', err));
    }
  }, [showFirmsVector]);

  const handleMapClick = (lat: number, lon: number) => {
    setClickedTarget({ lat, lon });
    const distKm = getDistanceKm(location.lat, location.lon, lat, lon);
    const title = `Titik Klik Peta (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    setSelectedEntity({
      type: 'point',
      title: `Koordinat Klik Peta Satelit`,
      lat,
      lon,
      details: {
        'Latitude': lat.toFixed(5),
        'Longitude': lon.toFixed(5),
        'Jarak ke Stasiun Utama': `${distKm.toFixed(2)} km`,
        'Status Wilayah': 'Realtime Satellite Grid Pick'
      }
    });

    if (onSelectCustomLocation) {
      onSelectCustomLocation(lat, lon, title);
    }
  };

  const getMarkerColor = (pfvi: number) => {
    if (pfvi >= 225) return '#ef4444'; // Red
    if (pfvi >= 150) return '#f97316'; // Orange
    if (pfvi >= 75) return '#f59e0b';  // Amber
    return '#10b981'; // Green
  };

  const color = getMarkerColor(currentPfvi);

  return (
    <div className="telemetry-panel rounded-lg p-5 bg-slate-900/90 border border-slate-800 shadow-md mb-5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <Satellite className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wide text-white flex items-center gap-2 flex-wrap">
              REAL LIVE SATELLITE FIRE MAP (NASA FIRMS & VIIRS OVERPASS)
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded font-semibold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                NASA FIRMS MAP_KEY ACTIVE
              </span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 font-medium">
              Peta Satelit Live NASA FIRMS, VIIRS 375m & GFW Gambut. Klik titik peta untuk langsung memperbarui prediksi.
            </p>
          </div>
        </div>

        {/* Live Satellite Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setShowFirmsWms(!showFirmsWms)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              showFirmsWms
                ? 'bg-rose-900/80 text-rose-200 border-rose-700 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>FIRMS WMS (NASA Key)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFirmsVector(!showFirmsVector)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              showFirmsVector
                ? 'bg-amber-900/80 text-amber-200 border-amber-700 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Hotspots API ({firmsHotspots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGfwPeatland(!showGfwPeatland)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              showGfwPeatland
                ? 'bg-red-900/80 text-red-200 border-red-700 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>GFW Vector Gambut</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGibsViirsDay(!showGibsViirsDay)}
            className={`px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 font-bold cursor-pointer ${
              showGibsViirsDay
                ? 'bg-cyan-900/80 text-cyan-200 border-cyan-700 shadow-xs'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>NASA GIBS 375m</span>
          </button>
        </div>
      </div>

      {/* Severe Fire Alerts Ticker */}
      {severeAlerts.length > 0 && (
        <div className="mb-4 bg-rose-950/40 border border-rose-900/80 rounded p-3 text-xs font-mono shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              PERINGATAN KEBAKARAN PARAH (SEVERE FIRE ALERTS)
            </span>
            <span className="text-[10px] text-rose-300 bg-rose-900/80 border border-rose-700 px-2 py-0.5 rounded font-bold">
              {severeAlerts.length} Area Terdampak Terdeteksi
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {severeAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  setSelectedEntity({
                    type: 'gfw',
                    title: alert.title,
                    lat: alert.lat,
                    lon: alert.lon,
                    details: {
                      'Lokasi Kebakaran': alert.location,
                      'Estimasi Luas Terbakar': `${alert.estimated_burned_km2} km² (${alert.estimated_burned_ha} Ha)`,
                      'Intensitas FRP Maks': `${alert.frp_max_mw} MW`,
                      'Satelit Sensor': alert.satellite_sensor,
                      'Tingkat Bahaya': alert.severity,
                      'Status Waktu': alert.updated_ago
                    }
                  });
                  if (onSelectCustomLocation) {
                    onSelectCustomLocation(alert.lat, alert.lon, alert.location);
                  }
                }}
                className="text-left bg-slate-950 hover:bg-rose-950/50 p-2.5 rounded border border-rose-900/60 hover:border-rose-600 transition-all group shadow-xs cursor-pointer"
              >
                <div className="font-bold text-rose-400 truncate flex items-center justify-between">
                  <span className="group-hover:text-rose-200 transition-colors">{alert.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-900/80 text-rose-200 rounded font-bold">{alert.estimated_burned_km2} km²</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-1 font-medium">{alert.location}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between pt-1 border-t border-slate-900">
                  <span>{alert.updated_ago}</span>
                  <span className="text-emerald-400 font-bold group-hover:underline">Fokus Peta / Prediksi →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dedicated Real Live Satellite Map Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 h-[480px] w-full rounded overflow-hidden relative border border-slate-800 shadow-sm">
          <MapContainer
            center={pos}
            zoom={10}
            scrollWheelZoom={true}
            className="h-full w-full cursor-crosshair"
          >
            <MapFlyTo lat={location.lat} lon={location.lon} />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* High-Resolution Satellite Base Layer (Esri World Imagery) */}
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Transparent Administrative Place Names & Boundaries Label Overlay */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO Voyager Labels</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            />

            {/* NASA FIRMS Dedicated Authorized WMS Thermal Layer (MAP_KEY Authorized) */}
            {showFirmsWms && (
              <WMSTileLayer
                url={`https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/${FIRMS_MAP_KEY}/`}
                layers="fires_viirs_24,fires_modis_24"
                format="image/png"
                transparent={true}
                attribution="NASA FIRMS Dedicated WMS (MAP_KEY Active)"
              />
            )}

            {/* NASA GIBS VIIRS 375m Thermal Anomalies Web Mercator (EPSG3857) WMS Layer */}
            {showGibsViirsDay && (
              <WMSTileLayer
                url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                layers="VIIRS_SNPP_Thermal_Anomalies_375m_Day,VIIRS_SNPP_Thermal_Anomalies_375m_Night"
                format="image/png"
                transparent={true}
                attribution="NASA GIBS VIIRS 375m Thermal"
              />
            )}

            {/* NASA FIRMS Vector Hotspot Point Markers */}
            {showFirmsVector && firmsHotspots.map((hotspot, idx) => (
              <Marker
                key={`firms-vector-${idx}`}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createFirmsHotspotIcon()}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    const distKm = getDistanceKm(location.lat, location.lon, hotspot.latitude, hotspot.longitude);
                    const title = `Hotspot NASA FIRMS (${hotspot.latitude.toFixed(3)}, ${hotspot.longitude.toFixed(3)})`;
                    setSelectedEntity({
                      type: 'hotspot',
                      title: `NASA FIRMS Hotspot (VIIRS)`,
                      lat: hotspot.latitude,
                      lon: hotspot.longitude,
                      details: {
                        'Tanggal / Jam UTC': `${hotspot.acq_date} ${hotspot.acq_time} UTC`,
                        'Kecerahan (T_i4)': `${hotspot.bright_ti4} K`,
                        'Daya FRP': hotspot.frp > 0 ? `${hotspot.frp} MW` : 'N/A',
                        'Satelit Sensor': `${hotspot.satellite} (${hotspot.instrument})`,
                        'Tingkat Kepercayaan': hotspot.confidence,
                        'Jarak ke Stasiun': `${distKm.toFixed(2)} km`
                      }
                    });
                    if (onSelectCustomLocation) {
                      onSelectCustomLocation(hotspot.latitude, hotspot.longitude, title);
                    }
                  }
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-orange-600 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 inline" /> NASA FIRMS Hotspot (VIIRS)
                    </div>
                    <div>Tgl / Jam: {hotspot.acq_date} {hotspot.acq_time} UTC</div>
                    <div>Kecerahan (T_i4): {hotspot.bright_ti4} K</div>
                    <div>Daya FRP: {hotspot.frp > 0 ? `${hotspot.frp} MW` : 'N/A'}</div>
                    <div>Satelit: {hotspot.satellite} ({hotspot.instrument})</div>
                    <div className="mt-1.5 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Prediksi Aktif Terpasang</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* GFW Vector Active Fires on Peatlands */}
            {showGfwPeatland && gfwFires.map((fire, idx) => (
              <Marker
                key={`gfw-fire-${idx}`}
                position={[fire.latitude, fire.longitude]}
                icon={createPeatlandFireIcon()}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    const distKm = getDistanceKm(location.lat, location.lon, fire.latitude, fire.longitude);
                    const title = `GFW Peatland Fire (${fire.latitude.toFixed(3)}, ${fire.longitude.toFixed(3)})`;
                    setSelectedEntity({
                      type: 'gfw',
                      title: `GFW Vector Fire on Peatland`,
                      lat: fire.latitude,
                      lon: fire.longitude,
                      details: {
                        'Tanggal Alert': fire.alert__date,
                        'Kabupaten / Provinsi': `${fire.adm2 || 'Kab'}, ${fire.adm1 || 'Prov'}`,
                        'Kecerahan (K)': fire.bright_ti4__K ? `${fire.bright_ti4__K} K` : '-',
                        'Daya FRP': fire.frp__MW ? `${fire.frp__MW} MW` : '-',
                        'Indikator Gambut': 'is__peatland = true',
                        'Jarak ke Stasiun': `${distKm.toFixed(2)} km`
                      }
                    });
                    if (onSelectCustomLocation) {
                      onSelectCustomLocation(fire.latitude, fire.longitude, title);
                    }
                  }
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-red-600 mb-1 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 inline" /> Active Fire on Peatland
                    </div>
                    <div>Tgl Alert: {fire.alert__date}</div>
                    <div>Lokasi: {fire.adm2 || 'Kab'}, {fire.adm1 || 'Prov'}</div>
                    <div>Kecerahan: {fire.bright_ti4__K || '-'} K</div>
                    <div>Daya FRP: {fire.frp__MW ? `${fire.frp__MW} MW` : '-'}</div>
                    <div className="mt-1 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Prediksi Aktif Terpasang</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* User Clicked Target Point Marker */}
            {clickedTarget && (
              <Marker position={[clickedTarget.lat, clickedTarget.lon]} icon={createTargetIcon()}>
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-sky-600 mb-1 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5 inline" /> Titik Peta Satelit Terpilih
                    </div>
                    <div>Lat: {clickedTarget.lat.toFixed(5)}</div>
                    <div>Lon: {clickedTarget.lon.toFixed(5)}</div>
                    <div className="mt-1 text-[10px] text-sky-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-sky-600" />
                      <span>Telemetri & Prediksi AI Terhubung</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Telemetry Station Marker */}
            <Marker
              position={pos}
              icon={createCustomIcon(color)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedEntity({
                    type: 'station',
                    title: `Stasiun Telemetri Utama`,
                    lat: location.lat,
                    lon: location.lon,
                    details: {
                      'Nama Lokasi': location.name,
                      'PFVI Score': `${currentPfvi.toFixed(1)} / 300.0`,
                      'Status Risiko': status,
                      'Koordinat': `${location.lat}, ${location.lon}`
                    }
                  });
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-slate-900">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{location.name}</h4>
                  <p className="text-xs text-slate-600">Stasiun Telemetri & Multi-Satelit Overpass</p>
                  <div className="mt-2 text-xs font-mono font-semibold text-slate-900">
                    PFVI Score: {currentPfvi.toFixed(1)} / 300.0 ({status})
                  </div>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={pos}
              radius={currentPfvi >= 225 ? 15000 : 8000}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 1.5
              }}
            />
          </MapContainer>

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-xs p-3 rounded border border-slate-800 text-xs shadow-md space-y-2 max-w-[90%] text-slate-200">
            <div className="flex items-center gap-3 font-mono flex-wrap font-semibold text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Low (&lt;75)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                <span>Extreme (&gt;225)</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                <span className="text-orange-400 font-bold">FIRMS Hotspot</span>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="text-rose-400 font-bold">GFW Gambut</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Satellite & Entity Inspector Panel */}
        <div className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h4 className="text-xs font-bold tracking-wider text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                SATELLITE HOTSPOT INSPECTOR
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 rounded text-slate-300 border border-slate-800 font-bold">
                {selectedEntity ? selectedEntity.type.toUpperCase() : 'TELEMETRI'}
              </span>
            </div>

            {selectedEntity ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-white font-bold flex items-center gap-1.5">
                  {selectedEntity.type === 'hotspot' && <Flame className="w-4 h-4 text-orange-400 shrink-0" />}
                  {selectedEntity.type === 'gfw' && <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                  {selectedEntity.type === 'point' && <Crosshair className="w-4 h-4 text-sky-400 shrink-0" />}
                  {selectedEntity.type === 'station' && <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />}
                  <span>{selectedEntity.title}</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded border border-slate-800 space-y-2 text-slate-200 shadow-xs">
                  {Object.entries(selectedEntity.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">{k}:</span>
                      <span className="font-bold text-slate-200">{String(v)}</span>
                    </div>
                  ))}
                </div>

                {onSelectCustomLocation && (
                  <button
                    type="button"
                    onClick={() => onSelectCustomLocation(selectedEntity.lat, selectedEntity.lon, selectedEntity.title)}
                    className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Fokuskan Telemetri ke Titik Ini</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs space-y-3">
                <Crosshair className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                <p>Klik titik mana saja di peta satelit atau marker hotspot kebakaran untuk inspeksi detail telemetri.</p>
                <div className="text-[10px] text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-900 font-semibold">
                  ✓ High-Res Live Satellite Map & NASA FIRMS Key Active
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between font-medium">
            <span>Koordinat Active Target:</span>
            <span className="text-white font-bold">{location.lat.toFixed(3)}, {location.lon.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
