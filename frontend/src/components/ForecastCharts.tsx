import React from 'react';
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
import { Activity, Layers, Droplets, CloudRain, Thermometer, Flame, ShieldAlert, AlertTriangle, ArrowUpRight } from 'lucide-react';

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
}

export const ForecastCharts: React.FC<ForecastChartsProps> = ({ fullSeries, forecastHorizon }) => {
  const totalPoints = fullSeries.PFVI.length;
  const historicalCount = totalPoints - forecastHorizon;

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

  return (
    <div className="space-y-6">
      {/* 1. SIGNAL STRIP (4 Key Driving Variables) */}
      <section>
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Sinyal permukaan &amp; atmosfer</h2>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">Empat variabel penggerak utama indeks, 31 hari terakhir</p>
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
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#3fc98a1f] text-[var(--ok)]">Normal</span>
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
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#f0b23e1f] text-[var(--warn)]">Kering</span>
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
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#ff8a3d1f] text-[var(--high)]">Minimum</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="text-2xl font-bold tracking-tight text-[var(--text)]">
                {latestRF.toFixed(1)}<span className="text-xs text-[var(--text-dim)] font-normal ml-1">mm/hr</span>
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
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--accent-soft)] text-[var(--accent)]">Normal</span>
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

      {/* 2. SEVERE ALERTS TICKER CARDS */}
      <section>
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Peringatan aktif</h2>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">Area terdampak terdeteksi dalam 24 jam terakhir</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          <div className="bg-[var(--surface)] border border-[var(--line)] border-l-4 border-l-[var(--danger)] min-w-[270px] flex-1 p-4 rounded-[var(--r-md)] flex flex-col gap-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--danger)] tracking-wider">Kebakaran parah</span>
              <span className="text-[11px] text-[var(--text-dim)]">3j lalu</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text)] font-sans leading-snug">6,2 km² area terbakar, Kec. Kamipang, Kab. Katingan</h4>
            <p className="text-[11.5px] text-[var(--text-mute)] font-sans flex items-center justify-between">
              <span>Kalimantan Tengah</span>
              <span className="text-[var(--accent)] font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer">Fokus &rarr;</span>
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] border-l-4 border-l-[var(--warn)] min-w-[270px] flex-1 p-4 rounded-[var(--r-md)] flex flex-col gap-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--warn)] tracking-wider">Anomali termal</span>
              <span className="text-[11px] text-[var(--text-dim)]">5j lalu</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text)] font-sans leading-snug">3,8 km² asap tebal, Rubung Buyung, Kec. Cempaga</h4>
            <p className="text-[11.5px] text-[var(--text-mute)] font-sans flex items-center justify-between">
              <span>Kalimantan Tengah</span>
              <span className="text-[var(--accent)] font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer">Fokus &rarr;</span>
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] border-l-4 border-l-[var(--danger)] min-w-[270px] flex-1 p-4 rounded-[var(--r-md)] flex flex-col gap-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--danger)] tracking-wider">Karhutla dalam</span>
              <span className="text-[11px] text-[var(--text-dim)]">1j lalu</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text)] font-sans leading-snug">1,5 km² potensi kebakaran gambut dalam, TN Sebangau</h4>
            <p className="text-[11.5px] text-[var(--text-mute)] font-sans flex items-center justify-between">
              <span>Palangka Raya</span>
              <span className="text-[var(--accent)] font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer">Fokus &rarr;</span>
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] border-l-4 border-l-[var(--warn)] min-w-[270px] flex-1 p-4 rounded-[var(--r-md)] flex flex-col gap-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--warn)] tracking-wider">Defisit air tanah</span>
              <span className="text-[11px] text-[var(--text-dim)]">8j lalu</span>
            </div>
            <h4 className="text-[13px] font-semibold text-[var(--text)] font-sans leading-snug">Muka air -0,8 m, 2 kecamatan terdampak, Kab. Siak</h4>
            <p className="text-[11.5px] text-[var(--text-mute)] font-sans flex items-center justify-between">
              <span>Riau</span>
              <span className="text-[var(--accent)] font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer">Fokus &rarr;</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3. PRIMARY PFVI TREND CHART */}
      <section>
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Historis &amp; proyeksi PFVI</h2>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">Garis solid = observasi | garis putus-putus = proyeksi {forecastHorizon} hari</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-mute)]">
            <span className="flex items-center gap-1.5"><i className="w-3 h-0.5 rounded bg-[var(--ok)] inline-block" /> Observasi</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-0.5 rounded bg-[var(--accent)] inline-block" /> Proyeksi</span>
          </div>
        </div>

        <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-5">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

                <Line type="monotone" dataKey="PFVI_hist" stroke="var(--ok)" strokeWidth={2} dot={false} name="PFVI Observasi" />
                <Line type="monotone" dataKey="PFVI_pred" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: 'var(--accent)' }} name="PFVI Proyeksi" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 4. QUAD CHARTS FOR SUPPORTING VARIABLES */}
      <section>
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--text)]">Variabel pendukung</h2>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">31 hari observasi ditambah 4 hari proyeksi</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
          {/* Quad 1: Water Table */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Muka air tanah</h4>
              <b className="text-[11px] text-[var(--text-mute)]">m</b>
            </div>
            <div className="h-[90px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="WT" stroke="var(--ok)" strokeWidth={1.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quad 2: Soil Moisture */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Kelembapan tanah</h4>
              <b className="text-[11px] text-[var(--text-mute)]">%</b>
            </div>
            <div className="h-[90px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="SM" stroke="var(--warn)" strokeWidth={1.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quad 3: Rainfall */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Curah hujan</h4>
              <b className="text-[11px] text-[var(--text-mute)]">mm/hari</b>
            </div>
            <div className="h-[90px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="Rf" stroke="var(--high)" strokeWidth={1.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quad 4: Temperature */}
          <div className="border border-[var(--line)] rounded-[var(--r-md)] bg-[var(--surface)] p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Suhu maksimum</h4>
              <b className="text-[11px] text-[var(--text-mute)]">°C</b>
            </div>
            <div className="h-[90px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="Temp" stroke="var(--accent)" strokeWidth={1.6} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
