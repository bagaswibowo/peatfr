import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { Layers, Droplets, CloudRain, Thermometer } from 'lucide-react';
import { signalBadge, badgeToneClass } from '../utils/pfviStatus';

interface ForecastChartsProps {
  fullSeries: {
    WT: number[];
    SM: number[];
    Rf: number[];
    Temp: number[];
    PFVI: number[];
    DI_obs: number[];
  };
  forecastHorizon: number;
  onChangeHorizon?: (h: number) => void;
}

export const ForecastCharts: React.FC<ForecastChartsProps> = ({
  fullSeries,
  forecastHorizon,
  onChangeHorizon
}) => {
  const totalPoints = fullSeries.PFVI.length;
  const historicalCount = totalPoints - forecastHorizon;

  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '1m'>('1m');

  // Prepare chart dataset
  const chartData = fullSeries.PFVI.map((pfviVal, idx) => {
    const isForecast = idx >= historicalCount;
    const dayLabel = isForecast ? `H+${idx - historicalCount + 1}` : `H-${historicalCount - idx}`;
    
    return {
      day: dayLabel,
      step: idx + 1,
      isForecast,
      PFVI_hist: !isForecast || idx === historicalCount - 1 ? pfviVal : null,
      PFVI_pred: isForecast ? pfviVal : null,
      DI_obs: fullSeries.DI_obs ? fullSeries.DI_obs[idx] : null,
      WT: fullSeries.WT[idx],
      SM: fullSeries.SM[idx],
      Rf: fullSeries.Rf[idx],
      Temp: fullSeries.Temp[idx],
    };
  });

  const latestWT = fullSeries.WT[fullSeries.WT.length - 1];
  const latestSM = fullSeries.SM[fullSeries.SM.length - 1];
  const latestRF = fullSeries.Rf[fullSeries.Rf.length - 1];
  const latestTemp = fullSeries.Temp[fullSeries.Temp.length - 1];

  // Badges computed from the actual latest value — never hardcoded, so a
  // critical water table can never sit next to a "Normal" badge.
  const badgeWT = signalBadge('WT', latestWT);
  const badgeSM = signalBadge('SM', latestSM);
  const badgeRf = signalBadge('Rf', latestRF);
  const badgeTemp = signalBadge('Temp', latestTemp);

  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  // Historical-only stats (30–31 days observation period)
  const histWT = fullSeries.WT.slice(0, historicalCount);
  const histSM = fullSeries.SM.slice(0, historicalCount);
  const histRF = fullSeries.Rf.slice(0, historicalCount);
  const histTemp = fullSeries.Temp.slice(0, historicalCount);

  const statsWT = {
    curr: latestWT,
    max: histWT.length ? Math.max(...histWT) : latestWT,
    min: histWT.length ? Math.min(...histWT) : latestWT,
  };
  const statsSM = {
    curr: latestSM,
    max: histSM.length ? Math.max(...histSM) : latestSM,
    min: histSM.length ? Math.min(...histSM) : latestSM,
  };
  const statsRF = {
    curr: latestRF,
    max: histRF.length ? Math.max(...histRF) : latestRF,
    min: histRF.length ? Math.min(...histRF) : latestRF,
  };
  const statsTemp = {
    curr: latestTemp,
    max: histTemp.length ? Math.max(...histTemp) : latestTemp,
    min: histTemp.length ? Math.min(...histTemp) : latestTemp,
  };

  const filteredQuadData = useMemo(() => {
    if (timeRange === '1d') {
      return chartData.slice(- (forecastHorizon + 1));
    }
    if (timeRange === '7d') {
      return chartData.slice(- (forecastHorizon + 7));
    }
    return chartData;
  }, [chartData, timeRange, forecastHorizon]);

  return (
    <div className="space-y-6">
      {/* 1. SIGNAL STRIP (4 Key Driving Variables) */}
      <section>
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <h2 className="font-disp text-[17px] font-bold tracking-tight text-[var(--text)]">Kondisi saat ini</h2>
            <p className="text-[13px] text-[var(--text-dim)] mt-0.5">Empat hal utama yang menentukan risiko kebakaran — air tanah, kelembapan tanah, hujan, dan suhu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] overflow-hidden font-mono">
          {/* Signal 1: Water Table */}
          <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[var(--line)] flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
                <Droplets className="w-3.5 h-3.5 text-[var(--ok)]" />
                <span>Muka air tanah</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeWT.tone)}`}>{badgeWT.label}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-[var(--text)]">
                {latestWT.toFixed(2)}<span className="text-xs text-[var(--text-dim)] font-normal ml-1">m</span>
              </span>
              <div className="w-20 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-14)}>
                    <Line type="monotone" dataKey="WT" stroke="var(--ok)" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Signal 2: Soil Moisture */}
          <div className="p-4 sm:p-5 border-b sm:border-b-0 lg:border-r border-[var(--line)] flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[var(--warn)]" />
                <span>Kelembapan tanah</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeSM.tone)}`}>{badgeSM.label}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-[var(--text)]">
                {latestSM.toFixed(1)}<span className="text-xs text-[var(--text-dim)] font-normal ml-1">%</span>
              </span>
              <div className="w-20 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-14)}>
                    <Line type="monotone" dataKey="SM" stroke="var(--warn)" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Signal 3: Rainfall */}
          <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[var(--line)] flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
                <CloudRain className="w-3.5 h-3.5 text-[var(--high)]" />
                <span>Curah hujan</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeRf.tone)}`}>{badgeRf.label}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-[var(--text)]">
                {latestRF.toFixed(1)}<span className="text-xs text-[var(--text-dim)] font-normal ml-1">mm/hari</span>
              </span>
              <div className="w-20 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-14)}>
                    <Line type="monotone" dataKey="Rf" stroke="var(--high)" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Signal 4: Temperature */}
          <div className="p-4 sm:p-5 flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
                <Thermometer className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Suhu maksimum</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeTemp.tone)}`}>{badgeTemp.label}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-[var(--text)]">
                {latestTemp.toFixed(1)}<span className="text-xs text-[var(--text-dim)] font-normal ml-1">°C</span>
              </span>
              <div className="w-20 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(-14)}>
                    <Line type="monotone" dataKey="Temp" stroke="var(--accent)" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY PFVI TREND CHART */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-3">
          <div>
            <h2 className="font-disp text-[17px] font-bold tracking-tight text-[var(--text)]">Perkembangan risiko, kemarin dan beberapa hari ke depan</h2>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              Garis solid = observasi ({historicalCount} hari) | garis putus-putus = proyeksi AI ({forecastHorizon} hari ke depan)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-mute)]">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[11px] text-[var(--text-dim)]">Horizon:</span>
              {[4, 7, 14].map((hOpt) => (
                <button
                  key={hOpt}
                  type="button"
                  onClick={() => onChangeHorizon && onChangeHorizon(hOpt)}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    forecastHorizon === hOpt
                      ? 'bg-[var(--accent)] text-[#0a0c0a]'
                      : 'bg-[var(--surface-2)] text-[var(--text-mute)] border border-[var(--line)] hover:text-[var(--text)]'
                  }`}
                >
                  {hOpt} Hari
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5"><i className="w-3 h-0.5 rounded bg-[var(--ok)] inline-block" /> Observasi</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-0.5 rounded bg-[var(--accent)] inline-block" /> Proyeksi</span>
          </div>
        </div>

        {/* Interactive Click Inspection Strip */}
        {selectedPoint && (
          <div className="mb-3 p-3 bg-[var(--surface-2)] border border-[var(--accent-line)] rounded-[var(--r-sm)] font-mono text-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--accent)] px-2 py-0.5 bg-[var(--accent-soft)] rounded border border-[var(--accent-line)]">
                {selectedPoint.day} ({selectedPoint.isForecast ? `Proyeksi H+${selectedPoint.step - historicalCount}` : 'Observasi Satelit'})
              </span>
              <span className="text-[var(--text-dim)] text-[11px]">Hasil klik titik garis:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 text-xs">
              <span>TMA: <b className="text-[var(--text)]">{selectedPoint.WT !== undefined ? `${selectedPoint.WT.toFixed(2)} m` : '-'}</b></span>
              <span>Lengas: <b className="text-[var(--text)]">{selectedPoint.SM !== undefined ? `${selectedPoint.SM.toFixed(1)}%` : '-'}</b></span>
              <span>Hujan: <b className="text-[var(--text)]">{selectedPoint.Rf !== undefined ? `${selectedPoint.Rf.toFixed(1)} mm` : '-'}</b></span>
              <span>Suhu: <b className="text-[var(--text)]">{selectedPoint.Temp !== undefined ? `${selectedPoint.Temp.toFixed(1)}°C` : '-'}</b></span>
              <span>PFVI: <b className="text-[var(--accent)] font-bold">{(selectedPoint.PFVI_hist ?? selectedPoint.PFVI_pred)?.toFixed(1)}</b></span>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] cursor-pointer text-[11px] underline ml-1"
              >
                ✕ Tutup
              </button>
            </div>
          </div>
        )}

        <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-5">
          <div className="h-[280px] w-full cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setSelectedPoint(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-dim)" tick={{ fontSize: 10, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }} />
                <YAxis domain={[0, 300]} stroke="var(--text-dim)" tick={{ fontSize: 10, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: '11px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-m)'
                  }}
                />
                <ReferenceArea y1={225} y2={300} fill="var(--danger)" fillOpacity={0.1} />
                <ReferenceArea y1={150} y2={225} fill="var(--high)" fillOpacity={0.08} />
                <ReferenceArea y1={75} y2={150} fill="var(--warn)" fillOpacity={0.05} />

                <ReferenceLine y={225} stroke="var(--danger)" strokeDasharray="3 3" />
                <ReferenceLine y={150} stroke="var(--high)" strokeDasharray="3 3" />
                <ReferenceLine y={75} stroke="var(--warn)" strokeDasharray="3 3" />

                <Line type="monotone" dataKey="PFVI_hist" stroke="var(--ok)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="PFVI Observasi" />
                <Line type="monotone" dataKey="PFVI_pred" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 6 }} name="PFVI Proyeksi" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 4. QUAD CHARTS FOR SUPPORTING VARIABLES */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-disp text-[17px] font-bold tracking-tight text-[var(--text)]">Grafik lengkap tiap variabel</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent-line)]">
                {timeRange === '1d' ? 'Rentang: 1 Hari' : timeRange === '7d' ? 'Rentang: 7 Hari' : 'Rentang: 1 Bulan (30 Hari)'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              {timeRange === '1d'
                ? `Menampilkan 1 hari observasi satelit terbaru ditambah ${forecastHorizon} hari proyeksi AI`
                : timeRange === '7d'
                ? `Menampilkan 7 hari observasi satelit ditambah ${forecastHorizon} hari proyeksi AI`
                : `Menampilkan 30 hari observasi satelit Open-Meteo ERA5-Land ditambah ${forecastHorizon} hari proyeksi AI`}
            </p>
          </div>

          {/* Time Range Switcher Tabs */}
          <div className="flex items-center p-1 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] font-mono text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimeRange('1d')}
              className={`px-3 py-1 rounded-[calc(var(--r-sm)-2px)] font-bold transition-all cursor-pointer ${
                timeRange === '1d'
                  ? 'bg-[var(--accent)] text-[#0a0c0a] shadow-sm'
                  : 'text-[var(--text-mute)] hover:text-[var(--text)]'
              }`}
            >
              1 Hari
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-[calc(var(--r-sm)-2px)] font-bold transition-all cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-[var(--accent)] text-[#0a0c0a] shadow-sm'
                  : 'text-[var(--text-mute)] hover:text-[var(--text)]'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('1m')}
              className={`px-3 py-1 rounded-[calc(var(--r-sm)-2px)] font-bold transition-all cursor-pointer ${
                timeRange === '1m'
                  ? 'bg-[var(--accent)] text-[#0a0c0a] shadow-sm'
                  : 'text-[var(--text-mute)] hover:text-[var(--text)]'
              }`}
            >
              1 Bulan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
          {/* Quad 1: Water Table */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[var(--ok)]" />
                  <span>Muka air tanah</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeWT.tone)}`}>
                  {badgeWT.label}
                </span>
              </div>
              <div className="text-[15px] font-bold text-[var(--text)] mb-1">
                {latestWT.toFixed(2)} <span className="text-[11px] font-normal text-[var(--text-dim)]">m ({Math.abs(latestWT * 100).toFixed(0)} cm)</span>
              </div>
              {/* Stat Peak / Low (30-day hist) */}
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)] pb-1 border-b border-[var(--line-soft)]">
                <span>Peak: <b className="text-[var(--text)]">{statsWT.max.toFixed(2)}m</b></span>
                <span>•</span>
                <span>Low: <b className="text-[var(--text)]">{statsWT.min.toFixed(2)}m</b></span>
              </div>
            </div>
            <div className="h-[140px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredQuadData}
                  margin={{ top: 5, right: 8, left: -22, bottom: 0 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      setSelectedPoint(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    interval={timeRange === '1m' ? 6 : timeRange === '7d' ? 1 : 0}
                  />
                  <YAxis
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '11px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-m)'
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(2)} m (${Math.abs(Number(val) * 100).toFixed(0)} cm)`, 'TMA']}
                  />
                  <Line type="monotone" dataKey="WT" stroke="var(--ok)" strokeWidth={1.8} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quad 2: Soil Moisture */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[var(--warn)]" />
                  <span>Kelembapan tanah</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeSM.tone)}`}>
                  {badgeSM.label}
                </span>
              </div>
              <div className="text-[15px] font-bold text-[var(--text)] mb-1">
                {latestSM.toFixed(1)} <span className="text-[11px] font-normal text-[var(--text-dim)]">% volumetrik</span>
              </div>
              {/* Stat Peak / Low (30-day hist) */}
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)] pb-1 border-b border-[var(--line-soft)]">
                <span>Peak: <b className="text-[var(--text)]">{statsSM.max.toFixed(1)}%</b></span>
                <span>•</span>
                <span>Low: <b className="text-[var(--text)]">{statsSM.min.toFixed(1)}%</b></span>
              </div>
            </div>
            <div className="h-[140px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredQuadData}
                  margin={{ top: 5, right: 8, left: -22, bottom: 0 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      setSelectedPoint(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    interval={timeRange === '1m' ? 6 : timeRange === '7d' ? 1 : 0}
                  />
                  <YAxis
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '11px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-m)'
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Lengas Tanah']}
                  />
                  <Line type="monotone" dataKey="SM" stroke="var(--warn)" strokeWidth={1.8} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quad 3: Rainfall */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-[var(--high)]" />
                  <span>Curah hujan</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeRf.tone)}`}>
                  {badgeRf.label}
                </span>
              </div>
              <div className="text-[15px] font-bold text-[var(--text)] mb-1">
                {latestRF.toFixed(1)} <span className="text-[11px] font-normal text-[var(--text-dim)]">mm/hari</span>
              </div>
              {/* Stat Peak / Low (30-day hist) */}
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)] pb-1 border-b border-[var(--line-soft)]">
                <span>Peak: <b className="text-[var(--text)]">{statsRF.max.toFixed(1)}mm</b></span>
                <span>•</span>
                <span>Low: <b className="text-[var(--text)]">{statsRF.min.toFixed(1)}mm</b></span>
              </div>
            </div>
            <div className="h-[140px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredQuadData}
                  margin={{ top: 5, right: 8, left: -22, bottom: 0 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      setSelectedPoint(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    interval={timeRange === '1m' ? 6 : timeRange === '7d' ? 1 : 0}
                  />
                  <YAxis
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '11px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-m)'
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)} mm/hari`, 'Curah Hujan']}
                  />
                  <Line type="monotone" dataKey="Rf" stroke="var(--high)" strokeWidth={1.8} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quad 4: Temperature */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Suhu maksimum</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeToneClass(badgeTemp.tone)}`}>
                  {badgeTemp.label}
                </span>
              </div>
              <div className="text-[15px] font-bold text-[var(--text)] mb-1">
                {latestTemp.toFixed(1)} <span className="text-[11px] font-normal text-[var(--text-dim)]">°C</span>
              </div>
              {/* Stat Peak / Low (30-day hist) */}
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-dim)] pb-1 border-b border-[var(--line-soft)]">
                <span>Peak: <b className="text-[var(--text)]">{statsTemp.max.toFixed(1)}°C</b></span>
                <span>•</span>
                <span>Low: <b className="text-[var(--text)]">{statsTemp.min.toFixed(1)}°C</b></span>
              </div>
            </div>
            <div className="h-[140px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredQuadData}
                  margin={{ top: 5, right: 8, left: -22, bottom: 0 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      setSelectedPoint(e.activePayload[0].payload);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    interval={timeRange === '1m' ? 6 : timeRange === '7d' ? 1 : 0}
                  />
                  <YAxis
                    stroke="var(--text-dim)"
                    tick={{ fontSize: 8, fill: 'var(--text-mute)', fontFamily: 'var(--font-m)' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: '11px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-m)'
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}°C`, 'Suhu Maks']}
                  />
                  <Line type="monotone" dataKey="Temp" stroke="var(--accent)" strokeWidth={1.8} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
