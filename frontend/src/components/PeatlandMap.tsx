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
    html: `<div style="background-color: var(--danger); width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fee2e2; box-shadow: 0 0 14px var(--danger); animation: pulse 1.5s infinite; cursor: pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createFirmsHotspotIcon = () => {
  return L.divIcon({
    className: 'firms-hotspot-marker',
    html: `<div style="background-color: var(--accent); width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffedd5; box-shadow: 0 0 10px var(--accent); cursor: pointer;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const createTargetIcon = () => {
  return L.divIcon({
    className: 'clicked-target-marker',
    html: `<div style="background-color: var(--ok); width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 14px var(--ok); cursor: pointer;"></div>`,
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
    if (pfvi >= 225) return 'var(--danger)'; // Red
    if (pfvi >= 150) return 'var(--high)';   // Orange
    if (pfvi >= 75) return 'var(--warn)';    // Amber
    return 'var(--ok)'; // Green
  };

  const color = getMarkerColor(currentPfvi);

  return (
    <section>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)] flex items-center gap-2">
            <Satellite className="w-4 h-4 text-[var(--accent)]" />
            <span>Peta Titik Panas &amp; Kerawanan Lahan Gambut</span>
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">
            Telemetri live NASA FIRMS (VIIRS 375m) &amp; GFW Gambut. Klik titik mana saja untuk inspeksi lokasi.
          </p>
        </div>

        {/* Live Satellite Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setShowFirmsWms(!showFirmsWms)}
            className={`px-3 py-1.5 rounded-[var(--r-sm)] border transition-colors flex items-center gap-1.5 font-semibold cursor-pointer ${
              showFirmsWms
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]'
                : 'bg-[var(--surface-2)] text-[var(--text-mute)] border-[var(--line)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>FIRMS WMS (NASA Key)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFirmsVector(!showFirmsVector)}
            className={`px-3 py-1.5 rounded-[var(--r-sm)] border transition-colors flex items-center gap-1.5 font-semibold cursor-pointer ${
              showFirmsVector
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]'
                : 'bg-[var(--surface-2)] text-[var(--text-mute)] border-[var(--line)]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Hotspots API ({firmsHotspots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGfwPeatland(!showGfwPeatland)}
            className={`px-3 py-1.5 rounded-[var(--r-sm)] border transition-colors flex items-center gap-1.5 font-semibold cursor-pointer ${
              showGfwPeatland
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]'
                : 'bg-[var(--surface-2)] text-[var(--text-mute)] border-[var(--line)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>GFW Vector Gambut</span>
          </button>
        </div>
      </div>

      {/* Map Row Container */}
      <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] overflow-hidden grid grid-cols-1 lg:grid-cols-4">
        {/* Left Map (3 Cols) */}
        <div className="lg:col-span-3 h-[440px] w-full relative">
          <MapContainer
            center={pos}
            zoom={10}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            className="h-full w-full cursor-crosshair"
          >
            <MapFlyTo lat={location.lat} lon={location.lon} />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Satellite Base Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Place Names & Labels Overlay */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO Voyager Labels</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            />

            {/* NASA FIRMS Dedicated WMS Thermal Layer */}
            {showFirmsWms && (
              <WMSTileLayer
                url={`https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/${FIRMS_MAP_KEY}/`}
                layers="fires_viirs_24,fires_modis_24"
                format="image/png"
                transparent={true}
                attribution="NASA FIRMS WMS"
              />
            )}

            {/* NASA GIBS VIIRS 375m Layer */}
            {showGibsViirsDay && (
              <WMSTileLayer
                url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                layers="VIIRS_SNPP_Thermal_Anomalies_375m_Day,VIIRS_SNPP_Thermal_Anomalies_375m_Night"
                format="image/png"
                transparent={true}
                attribution="NASA GIBS VIIRS"
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
                    <div>Kecerahan: {hotspot.bright_ti4} K</div>
                    <div>Daya FRP: {hotspot.frp > 0 ? `${hotspot.frp} MW` : 'N/A'}</div>
                    <div className="mt-1 text-[10px] text-emerald-700 font-bold">✓ Authorized NASA FIRMS Key</div>
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
                    <div className="mt-1 text-[10px] text-emerald-700 font-bold">✓ Verified GFW Peatland Layer</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* User Clicked Target Point Marker */}
            {clickedTarget && (
              <Marker position={[clickedTarget.lat, clickedTarget.lon]} icon={createTargetIcon()}>
                <Popup className="custom-popup">
                  <div className="p-2 font-mono text-xs text-slate-900">
                    <div className="font-bold text-emerald-600 mb-1 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5 inline" /> Titik Peta Satelit Terpilih
                    </div>
                    <div>Lat: {clickedTarget.lat.toFixed(5)}</div>
                    <div>Lon: {clickedTarget.lon.toFixed(5)}</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Telemetry Station Marker */}
            <Marker position={pos} icon={createCustomIcon(color)}>
              <Popup className="custom-popup">
                <div className="p-2 text-slate-900">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{location.name}</h4>
                  <div className="text-xs font-mono font-semibold text-slate-900">
                    PFVI Score: {currentPfvi.toFixed(1)} / 300.0 ({status})
                  </div>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={pos}
              radius={currentPfvi >= 225 ? 15000 : 8000}
              pathOptions={{ color: color, fillColor: color, fillOpacity: 0.15, weight: 1.5 }}
            />
          </MapContainer>
        </div>

        {/* Right Inspector & Legend (1 Col) */}
        <div className="border-t lg:border-t-0 lg:border-l border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-[var(--line)]">
              <h3 className="text-[12.5px] font-semibold text-[var(--text)] flex items-center justify-between">
                <span>Inspektor Titik Panas</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-mute)]">
                  {selectedEntity ? selectedEntity.type.toUpperCase() : 'SELECT POINT'}
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-dim)] mt-0.5">Pilih titik pada peta satelit</p>
            </div>

            <div className="p-4">
              {selectedEntity ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="text-[var(--text)] font-semibold text-[13px]">
                    {selectedEntity.title}
                  </div>
                  <div className="space-y-2 border-t border-[var(--line-soft)] pt-2">
                    {Object.entries(selectedEntity.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[12px] py-1 border-b border-[var(--line-soft)]">
                        <span className="text-[var(--text-mute)]">{k}:</span>
                        <span className="font-semibold text-[var(--text)]">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {onSelectCustomLocation && (
                    <button
                      type="button"
                      onClick={() => onSelectCustomLocation(selectedEntity.lat, selectedEntity.lon, selectedEntity.title)}
                      className="w-full mt-2 py-2 px-3 bg-[var(--accent)] text-[#0a0c0a] font-bold rounded-[var(--r-sm)] text-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Fokuskan Telemetri ke Titik Ini</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-[var(--text-dim)] flex flex-col items-center justify-center gap-2 font-mono text-xs">
                  <Crosshair className="w-6 h-6 text-[var(--text-dim)]" />
                  <p className="max-w-[20ch] leading-snug">Klik salah satu titik di peta untuk melihat telemetri lokal</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Legend Footer */}
          <div className="p-3.5 border-t border-[var(--line)] flex flex-col gap-1.5 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-[var(--text-mute)]">
              <span className="w-2 h-2 rounded-full bg-[var(--ok)] shrink-0" />
              <span>Rendah &lt; 75</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-mute)]">
              <span className="w-2 h-2 rounded-full bg-[var(--warn)] shrink-0" />
              <span>Sedang 75 / 150</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-mute)]">
              <span className="w-2 h-2 rounded-full bg-[var(--high)] shrink-0" />
              <span>Tinggi 150 / 225</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-mute)]">
              <span className="w-2 h-2 rounded-full bg-[var(--danger)] shrink-0" />
              <span>Ekstrem &gt; 225</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
