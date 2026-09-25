import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const UP = "#26a69a";
const DOWN = "#ef5350";
const AMBER = "#fbbf24";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Candle = { o: number; c: number; h: number; l: number };

export const CandlestickTickerTape: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const N = 42;
  const candles: Candle[] = [];
  let price = 100;
  for (let i = 0; i < N; i++) {
    const drift = (rand(i * 3.7) - 0.47) * 6;
    const o = price;
    const c = o + drift;
    const h = Math.max(o, c) + rand(i * 9.1) * 2.4;
    const l = Math.min(o, c) - rand(i * 5.3) * 2.4;
    candles.push({ o, c, h, l });
    price = c;
  }
  const lo = Math.min(...candles.map((k) => k.l));
  const hi = Math.max(...candles.map((k) => k.h));

  const visible = Math.floor(interpolate(frame, [60, 780], [0, N], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  const chartW = width * 0.9;
  const chartH = height * 0.52;
  const chartX = width * 0.05;
  const chartY = height * 0.2;
  const cw = chartW / N;
  const yOf = (p: number) => chartY + chartH - ((p - lo) / (hi - lo)) * chartH;

  const last = candles[Math.max(0, visible - 1)];
  const first = candles[0];
  const chg = last.c - first.o;
  const chgPct = (chg / first.o) * 100;

  const tapeItems = ["AAPL 284.12 +1.2%", "MSFT 512.40 +0.8%", "NVDA 189.55 +2.4%", "TSLA 246.10 -0.6%", "AMZN 201.33 +0.9%", "META 602.77 +1.5%", "GOOG 178.22 +0.4%", "AMD 122.48 +1.1%"];
  const tapeX = -(((frame * 2.2) % 1600) / 1600) * (tapeItems.length * 34 * u);

  return (
    <AbsoluteFill style={{ backgroundColor: "#04070f", fontFamily: FONT, color: "#fff" }}>
      {/* header stats */}
      <div style={{ position: "absolute", top: `${3.5 * u}px`, left: `${5 * u}px`, right: `${5 * u}px`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: `${2.4 * u}px`, fontWeight: 700, letterSpacing: `${0.24 * u}px` }}>
          MARKET PULSE <span style={{ color: "rgba(148,163,184,0.6)", fontWeight: 400 }}>· IDX-500</span>
        </div>
        <div style={{ display: "flex", gap: `${3 * u}px`, alignItems: "baseline" }}>
          <span style={{ fontSize: `${3.4 * u}px`, fontWeight: 800 }}>${last.c.toFixed(2)}</span>
          <span style={{ fontSize: `${2.2 * u}px`, fontWeight: 700, color: chg >= 0 ? UP : DOWN }}>
            {chg >= 0 ? "▲" : "▼"} {Math.abs(chgPct).toFixed(2)}%
          </span>
          <span style={{ fontSize: `${1.7 * u}px`, color: "rgba(148,163,184,0.7)" }}>
            H {hi.toFixed(1)} · L {lo.toFixed(1)}
          </span>
        </div>
      </div>

      {/* candles */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={chartX}
            y1={chartY + chartH * t}
            x2={chartX + chartW}
            y2={chartY + chartH * t}
            stroke="rgba(148,163,184,0.14)"
            strokeWidth={1}
          />
        ))}
        {candles.slice(0, visible).map((k, i) => {
          const up = k.c >= k.o;
          const col = up ? UP : DOWN;
          const x = chartX + i * cw + cw * 0.22;
          const w = cw * 0.56;
          const isLast = i === visible - 1;
          const pulse = isLast ? 0.75 + 0.25 * Math.sin(((2 * Math.PI * frame) / 40) % (2 * Math.PI)) : 1;
          return (
            <g key={i} opacity={pulse}>
              <line x1={x + w / 2} y1={yOf(k.h)} x2={x + w / 2} y2={yOf(k.l)} stroke={col} strokeWidth={Math.max(1.5, u * 0.28)} />
              <rect
                x={x}
                y={yOf(Math.max(k.o, k.c))}
                width={w}
                height={Math.max(2, Math.abs(yOf(k.o) - yOf(k.c)))}
                fill={col}
                rx={u * 0.2}
              />
            </g>
          );
        })}
        {/* price line */}
        <polyline
          points={candles.slice(0, visible).map((k, i) => `${(chartX + i * cw + cw / 2).toFixed(1)},${yOf(k.c).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={AMBER}
          strokeWidth={u * 0.35}
          strokeDasharray={`${1.6 * u} ${1.2 * u}`}
          opacity={0.9}
        />
      </svg>

      {/* ticker tape */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${7 * u}px`,
          backgroundColor: "rgba(2,6,16,0.92)",
          borderTop: `1px solid rgba(251,191,36,0.35)`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", transform: `translateX(${tapeX}px)`, whiteSpace: "nowrap" }}>
          {[...tapeItems, ...tapeItems].map((t, i) => {
            const neg = t.includes("-");
            return (
              <span key={i} style={{ fontSize: `${2.2 * u}px`, fontWeight: 600, marginRight: `${6 * u}px`, color: neg ? DOWN : UP }}>
                {t}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default CandlestickTickerTape;
