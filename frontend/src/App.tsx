import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Gauge, Sliders } from 'lucide-react';
import { Header, Province, Regency } from './components/Header';
import { PeatlandMap } from './components/PeatlandMap';
import { ForecastCharts } from './components/ForecastCharts';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PipelineControls } from './components/PipelineControls';
import { ActiveAlerts } from './components/ActiveAlerts';
import { TheoreticalSpecsModal } from './components/TheoreticalSpecsModal';

const API_BASE = '/api/v1';

const TABS = [
  { id: 'pemantauan', label: 'Pemantauan', Icon: Gauge },
  { id: 'peringatan', label: 'Peringatan', Icon: AlertTriangle },
  { id: 'simulasi', label: 'Simulasi', Icon: Sliders }
] as const;

type TabId = typeof TABS[number]['id'];

// Helper to find the nearest province to any clicked geographical point
const findNearestProvince = (lat: number, lon: number, provList: Province[]): Province | null => {
  if (!provList.length) return null;
  let nearest: Province | null = null;
  let minDist = Infinity;
  for (const p of provList) {
    const dP = Math.hypot(p.lat - lat, p.lon - lon);
    if (dP < minDist) {
      minDist = dP;
      nearest = p;
    }
    for (const r of (p.regencies || [])) {
      const dR = Math.hypot(r.lat - lat, r.lon - lon);
      if (dR < minDist) {
        minDist = dR;
        nearest = p;
      }
    }
  }
  return nearest;
};

export function App() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Configuration State
  const [imputation, setImputation] = useState('knn');
  const [model, setModel] = useState('arima');
  const [h, setH] = useState(4);
  const [epochs, setEpochs] = useState(50);
  const [activeTab, setActiveTab] = useState<TabId>('pemantauan');

  // Data & Pipeline Result State
  const [sampleData, setSampleData] = useState<any>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [soilType, setSoilType] = useState<string>('Tidak diketahui');
  const [severeAlerts, setSevereAlerts] = useState<any[]>([]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Fetch Realtime Open Satellite Data
  const fetchRealtimeData = async (reg: Regency | null = selectedRegency) => {
    if (!reg) return;
    setLoadingRealtime(true);
    try {
      const res = await axios.get(`${API_BASE}/realtime-peatland-data?lat=${reg.lat}&lon=${reg.lon}&days=30`);
      setSampleData(res.data);
      setSoilType(res.data.soil_type || 'Tidak diketahui');
      setDataError(null);

      // Reconcile province from server-side spatial peat attribution only when the
      // point lies within the attribution radius; a far-off centroid (e.g. Bali ->
      // Kalimantan Selatan, ~518 km) must never override the clicked province.
      const attrKm = res.data?.peat_attribution?.distance_km;
      const attrValid = typeof attrKm === 'number' && attrKm <= 75;
      if (attrValid && res.data?.peat_attribution?.adm1) {
        const adm1 = res.data.peat_attribution.adm1;
        const matched = provinces.find(
          p => p.name.toLowerCase().includes(adm1.toLowerCase()) || adm1.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matched) {
          setSelectedProvince(matched);
        }
      } else if (!attrValid && res.data?.peat_attribution?.adm1) {
        // Outside the peat radius the backend resolved the REAL admin names via
        // OSM reverse geocoding: rename the point and select that province so
        // every map click anywhere in Indonesia is labeled correctly.
        const realProvName: string = res.data.peat_attribution.adm1;
        const realRegName: string = res.data.peat_attribution.adm2 || realProvName;
        if (reg.id.startsWith('CUSTOM-')) {
          setSelectedRegency((prev: Regency | null) =>
            prev ? { ...prev, name: realRegName } : prev
          );
        }
        const realMatch = provinces.find(
          p => p.name.toLowerCase() === realProvName.toLowerCase()
        ) ?? provinces.find(
          p => realProvName.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(realProvName.toLowerCase())
        );
        if (realMatch) {
          setSelectedProvince(realMatch);
        }
      }

      executePipeline(res.data, res.data.is_peat !== false);
    } catch (err: any) {
      // No simulated numbers: an unavailable upstream is reported, not invented.
      setSampleData(null);
      setPipelineResult(null);
      setDataError(
        `Telemetri satelit Open-Meteo/ERA5 tidak dapat dimuat untuk ${reg.name} ` +
        `(${err?.response?.status ?? 'jaringan'} ${err?.message ?? ''}). ` +
        `PeatFR tidak menampilkan nilai proyeksi sampai sumber data pulih.`
      );
    } finally {
      setLoadingRealtime(false);
    }
  };

  const handleSelectRegion = (prov: Province, reg: Regency) => {
    setSelectedProvince(prov);
    setSelectedRegency(reg);
    fetchRealtimeData(reg);
  };

  const handleSelectCustomLocation = (lat: number, lon: number, name?: string) => {
    // Immediately identify the nearest province based on clicked coordinates so UI doesn't linger on previous province
    const nearestProv = findNearestProvince(lat, lon, provinces);
    if (nearestProv) {
      setSelectedProvince(nearestProv);
    }

    const customName = name || `Titik GIS (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    const customReg: Regency = {
      id: `CUSTOM-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      name: customName,
      lat: Number(lat.toFixed(3)),
      lon: Number(lon.toFixed(3)),
      // Backend attributes soil type from the nearest peat regency; this is only the
      // pre-fetch placeholder used for the dropdown label.
      peat: true
    };
    setSelectedRegency(customReg);
    fetchRealtimeData(customReg);
  };

  const executePipeline = async (
    inputData: any = sampleData,
    isPeatFlag: boolean = sampleData?.is_peat !== false,
    overrideH?: number
  ) => {
    if (!inputData) return;
    setIsRunningPipeline(true);

    try {
      const activeH = overrideH !== undefined ? overrideH : h;
      const payload = {
        WT: inputData.WT,
        SM: inputData.SM,
        Rf: inputData.Rf,
        Temp: inputData.Temp,
        imputation,
        model,
        h: activeH,
        r0: 3000.0,
        look_back: 12,
        hidden_units: 32,
        epochs,
        is_peat: isPeatFlag
      };

      const res = await axios.post(`${API_BASE}/pipeline/auto`, payload);
      setPipelineResult(res.data);
      setDataError(null);
    } catch (err: any) {
      setPipelineResult(null);
      setDataError(
        `Pipeline PFVI gagal dijalankan (${err?.response?.status ?? 'jaringan'} ${err?.message ?? ''}). ` +
        `Nilai risiko ditahan kosong alih-alih diperkirakan di sisi browser.`
      );
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Severe peat-fire clusters (fetched here, shared by the map markers and the
  // alert list so the warning text exists in exactly one place).
  useEffect(() => {
    axios.get(`${API_BASE}/fire-intelligence/severe-alerts`)
      .then((res) => setSevereAlerts(res.data?.alerts || []))
      .catch((err) => {
        console.warn('Peringatan kebakaran parah tidak tersedia:', err);
        setSevereAlerts([]);
      });
  }, []);

  // On mount, load Indonesia regions and pick Riau - Kab. Siak as default
  useEffect(() => {
    axios.get(`${API_BASE}/indonesia/regions`)
      .then((res) => {
        if (res.data && res.data.provinces && res.data.provinces.length > 0) {
          setProvinces(res.data.provinces);
          const defaultProv = res.data.provinces[0]; // Riau
          const defaultReg = defaultProv.regencies[0]; // Kab. Siak
          setSelectedProvince(defaultProv);
          setSelectedRegency(defaultReg);
          fetchRealtimeData(defaultReg);
        }
      })
      .catch((err) => {
        console.warn('Error loading regions:', err);
        const fallbackReg: Regency = { id: 'ID-RI-SIAK', name: 'Kab. Siak', lat: 0.820, lon: 102.050, peat: true };
        setSelectedRegency(fallbackReg);
        fetchRealtimeData(fallbackReg);
      });
  }, []);

  const hasData = Boolean(pipelineResult) && !dataError;

  const pfviList = pipelineResult ? pipelineResult.full_series.PFVI : [];
  const currentPfvi = pfviList.length ? pfviList[pfviList.length - 1] : 0;

  const currentStatus = pipelineResult ? pipelineResult.forecast.Current_Status : 'Unknown';

  const lastOf = (series: number[] | undefined, fallback: number) =>
    series && series.length ? series[series.length - 1] : fallback;

  const currentWT = pipelineResult ? lastOf(pipelineResult.full_series.WT, 0) : 0;
  const currentSM = pipelineResult ? lastOf(pipelineResult.full_series.SM, 0) : 0;
  const currentRf = pipelineResult ? lastOf(pipelineResult.full_series.Rf, 0) : 0;
  const currentTemp = pipelineResult ? lastOf(pipelineResult.full_series.Temp, 0) : 0;

  const locationPreset = selectedRegency
    ? {
        id: selectedRegency.id,
        name: selectedProvince && !selectedRegency.name.toLowerCase().includes(selectedProvince.name.toLowerCase())
          ? `${selectedRegency.name}, ${selectedProvince.name}`
          : (selectedProvince ? selectedRegency.name : `${selectedRegency.name}, Indonesia`),
        lat: selectedRegency.lat,
        lon: selectedRegency.lon
      }
    : { id: 'sabangau', name: 'Sabangau, Kalteng', lat: -2.321, lon: 113.901 };

  const focusAlert = (alert: any) => {
    handleSelectCustomLocation(alert.lat, alert.lon, alert.location);
    setActiveTab('pemantauan');
    // Let the tab render the map before scrolling to it.
    setTimeout(() => {
      document.getElementById('bagian-peta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // In-tab anchors for the Pemantauan tab (map -> analysis).
  const SECTIONS = [
    { id: 'bagian-peta', label: 'Peta' },
    { id: 'bagian-proyeksi', label: 'Analisis' }
  ];

  return (
    <div className="min-h-[100dvh] pb-12">
      <Header
        provinces={provinces}
        selectedProvince={selectedProvince}
        selectedRegency={selectedRegency}
        model={model}
        theme={theme}
        loadingRealtime={loadingRealtime}
        onSelectRegion={handleSelectRegion}
        onRefresh={() => fetchRealtimeData(selectedRegency)}
        onToggleTheme={toggleTheme}
        onOpenPaperModal={() => setIsPaperModalOpen(true)}
      />

      {/* Tab bar — one section per screen instead of one very long scroll */}
      <nav className="border-b border-[var(--line)] bg-[var(--surface)] sticky top-[60px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-7 flex items-stretch gap-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[14px] font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--text)]'
                    : 'border-transparent text-[var(--text-mute)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {id === 'peringatan' && severeAlerts.length > 0 && (
                  <span className="ml-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--danger)] text-[10px] font-mono font-bold text-white flex items-center justify-center">
                    {severeAlerts.length}
                  </span>
                )}
              </button>
            );
          })}

          {/* Section anchors inline with the tabs, pushed right — no cramped second row. */}
          {activeTab === 'pemantauan' && (
            <div className="ml-auto hidden sm:flex items-center gap-1.5">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-[var(--line)] text-[12px] text-[var(--text-mute)] hover:border-[var(--accent-line)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-4 lg:px-7 pt-6 flex flex-col gap-6">
        {dataError && (
          <div role="alert" className="border border-[var(--danger)] bg-[#ff4d4d14] rounded-[var(--r-md)] p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[var(--danger)] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2 min-w-0">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--danger)]">
                Sumber data tidak tersedia
              </span>
              <p className="text-[13px] text-[var(--text-mute)] leading-relaxed">{dataError}</p>
              <button
                type="button"
                onClick={() => fetchRealtimeData(selectedRegency)}
                disabled={loadingRealtime}
                className="self-start font-mono text-[11px] font-bold px-3 py-1.5 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)] disabled:opacity-50 cursor-pointer"
              >
                {loadingRealtime ? 'Menghubungkan ulang...' : 'Coba tarik ulang telemetri'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pemantauan' && (
          <>
            {/* Map is the primary surface: clicking any point re-targets every
                panel below (settings, current conditions, charts). */}
            <div id="bagian-peta" className="scroll-mt-[120px]">
              <PeatlandMap
                currentPfvi={currentPfvi}
                status={currentStatus}
                location={locationPreset}
                waterTable={currentWT}
                onSelectCustomLocation={handleSelectCustomLocation}
              />
            </div>

            <div id="bagian-proyeksi" className="scroll-mt-[120px] flex flex-col gap-6">
              <PipelineControls
                soilType={soilType}
                imputation={imputation}
                setImputation={setImputation}
                model={model}
                setModel={setModel}
                h={h}
                setH={setH}
                onRunPipeline={() => executePipeline()}
                isRunning={isRunningPipeline}
              />

              {pipelineResult ? (
                <ForecastCharts
                  fullSeries={pipelineResult.full_series}
                  forecastHorizon={h}
                  onChangeHorizon={(newH) => {
                    setH(newH);
                    executePipeline(sampleData, sampleData?.is_peat !== false, newH);
                  }}
                />
              ) : (
                <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-6 text-center text-[13px] text-[var(--text-mute)]">
                  Grafik tren muncul setelah perhitungan selesai.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'peringatan' && (
          <ActiveAlerts alerts={severeAlerts} onFocus={focusAlert} />
        )}

        {activeTab === 'simulasi' && (
          <ScenarioSimulator currentPfvi={currentPfvi} optimizedParams={pipelineResult?.optimization} />
        )}

        <footer className="border-t border-[var(--line)] pt-5 mt-2 font-sans text-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[var(--text-dim)]">
            <p className="max-w-[65ch] leading-relaxed">
              PeatFR, sistem peringatan dini kebakaran lahan gambut tropis (mengacu pada Mahdiyasa dkk., 2025).
              Data terintegrasi langsung dengan API Open-Meteo ERA5 &amp; NASA FIRMS.
            </p>
            <div className="flex gap-4 text-[var(--text-mute)] font-mono text-[11px]">
              <button type="button" onClick={() => setIsPaperModalOpen(true)} className="hover:text-[var(--accent)] cursor-pointer">Spesifikasi teoretis</button>
              <a href="https://doi.org/10.1016/j.ecoinf.2025.103532" target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">Metodologi model</a>
              <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">Sumber FIRMS</a>
            </div>
          </div>
        </footer>
      </main>

      <TheoreticalSpecsModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
      />
    </div>
  );
}

export default App;
