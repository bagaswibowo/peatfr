import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import { Header, Province, Regency } from './components/Header';
import { RiskStatusGauge } from './components/RiskStatusGauge';
import { PeatlandMap } from './components/PeatlandMap';
import { ForecastCharts } from './components/ForecastCharts';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PipelineControls } from './components/PipelineControls';
import { TheoreticalSpecsModal } from './components/TheoreticalSpecsModal';

const API_BASE = '/api/v1';

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

  const executePipeline = async (inputData: any = sampleData, isPeatFlag: boolean = sampleData?.is_peat !== false) => {
    if (!inputData) return;
    setIsRunningPipeline(true);

    try {
      const payload = {
        WT: inputData.WT,
        SM: inputData.SM,
        Rf: inputData.Rf,
        Temp: inputData.Temp,
        imputation,
        model,
        h,
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

  // Severe peat-fire clusters: fetched once, shared by the map inspector and the alert ticker.
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

  const forecastPfviList = pfviList.slice(-h);
  const minForecastPfvi = forecastPfviList.length ? Math.min(...forecastPfviList) : 0;
  const maxForecastPfvi = forecastPfviList.length ? Math.max(...forecastPfviList) : 0;

  const currentStatus = pipelineResult ? pipelineResult.forecast.Current_Status : 'Unknown';

  const lastOf = (series: number[] | undefined, fallback: number) =>
    series && series.length ? series[series.length - 1] : fallback;

  const currentWT = pipelineResult ? lastOf(pipelineResult.full_series.WT, 0) : 0;
  const currentSM = pipelineResult ? lastOf(pipelineResult.full_series.SM, 0) : 0;
  const currentRf = pipelineResult ? lastOf(pipelineResult.full_series.Rf, 0) : 0;
  const currentTemp = pipelineResult ? lastOf(pipelineResult.full_series.Temp, 0) : 0;

  const locationPreset = selectedRegency
    ? { id: selectedRegency.id, name: `${selectedRegency.name}, ${selectedProvince?.name || 'Indonesia'}`, lat: selectedRegency.lat, lon: selectedRegency.lon }
    : { id: 'sabangau', name: 'Sabangau, Kalteng', lat: -2.321, lon: 113.901 };

  return (
    <div className="min-h-[100dvh] pb-16">
      {/* Topbar Header */}
      <Header
        selectedProvince={selectedProvince}
        selectedRegency={selectedRegency}
        model={model}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPaperModal={() => setIsPaperModalOpen(true)}
      />

      {/* Main Page Layout Container */}
      <main className="max-w-[1440px] mx-auto px-4 lg:px-7 pt-6 flex flex-col gap-[34px]">
        {/* Upstream Failure Banner — data is never invented client-side */}
        {dataError && (
          <div
            role="alert"
            className="border border-[var(--danger)] bg-[#ff4d4d14] rounded-[var(--r-md)] p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-[var(--danger)] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2 min-w-0">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--danger)]">
                Sumber data tidak tersedia
              </span>
              <p className="text-xs text-[var(--text-mute)] leading-relaxed">{dataError}</p>
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

        {/* 1. HERO / RISK STATUS GAUGE SECTION */}
        <RiskStatusGauge
          hasData={hasData}
          pfvi={currentPfvi}
          status={currentStatus}
          waterTable={currentWT}
          soilMoisture={currentSM}
          rainfall={currentRf}
          temp={currentTemp}
          forecastDays={h}
          minPfvi={minForecastPfvi}
          maxPfvi={maxForecastPfvi}
          fireIntelligence={sampleData?.fire_intelligence}
          optimizedParams={pipelineResult?.optimization}
        />

        {/* 2. REAL LIVE SATELLITE GIS MAP (POSISI DIPINDAHKAN KE ATAS!) */}
        <PeatlandMap
          currentPfvi={currentPfvi}
          status={currentStatus}
          location={locationPreset}
          severeAlerts={severeAlerts}
          onSelectCustomLocation={handleSelectCustomLocation}
        />

        {/* 3. PIPELINE CONTROLS & SELEKSI LOKASI */}
        <PipelineControls
          provinces={provinces}
          selectedProvince={selectedProvince}
          selectedRegency={selectedRegency}
          soilType={soilType}
          onSelectRegion={handleSelectRegion}
          onLoadRealtimeData={() => fetchRealtimeData(selectedRegency)}
          loadingRealtime={loadingRealtime}
          imputation={imputation}
          setImputation={setImputation}
          model={model}
          setModel={setModel}
          h={h}
          setH={setH}
          epochs={epochs}
          setEpochs={setEpochs}
          onRunPipeline={() => executePipeline()}
          isRunning={isRunningPipeline}
        />

        {/* 4. TIME SERIES CHARTS & SIGNAL STRIP */}
        {pipelineResult && (
          <ForecastCharts
            fullSeries={pipelineResult.full_series}
            forecastHorizon={h}
            severeAlerts={severeAlerts}
            onFocusAlert={handleSelectCustomLocation}
          />
        )}

        {/* 5. WHAT-IF SCENARIO SIMULATOR */}
        <ScenarioSimulator currentPfvi={currentPfvi} optimizedParams={pipelineResult?.optimization} />

        {/* FOOTER */}
        <footer className="border-t border-[var(--line)] pt-5 mt-4 font-sans text-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[var(--text-dim)]">
            <p className="max-w-[65ch] leading-relaxed">
              Rancang ulang antarmuka PeatFR, sistem peringatan dini kebakaran lahan gambut tropis (mengacu pada Mahdiyasa dkk., 2025). Data terintegrasi langsung dengan API Open-Meteo ERA5 &amp; NASA FIRMS.
            </p>
            <div className="flex gap-4 text-[var(--text-mute)] font-mono text-[11px]">
              <button type="button" onClick={() => setIsPaperModalOpen(true)} className="hover:text-[var(--accent)] cursor-pointer">Spesifikasi teoretis</button>
              <a href="https://doi.org/10.1016/j.ecoinf.2025.103532" target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">Metodologi model</a>
              <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">Sumber FIRMS</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Theoretical Specs Modal */}
      <TheoreticalSpecsModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
      />
    </div>
  );
}

export default App;
