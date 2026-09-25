import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const TEAL = "#2dd4bf";
const GREEN = "#34d399";
const AMBER = "#fbbf24";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const ecg = (t: number): number => {
  const g = (c: number, w: number, a: number) =>
    a * Math.exp(-((t - c) * (t - c)) / (2 * w * w));
  return (
    g(0.12, 0.028, 0.14) +
    g(0.275, 0.007, -0.14) +
    g(0.3, 0.009, 1) +
    g(0.325, 0.007, -0.28) +
    g(0.56, 0.05, 0.26)
  );
};

export const EKGMedicalMonitor: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;
  const isVertical = height > width;

  const chartW = isVertical ? width * 0.9 : width * 0.62;
  const chartH = isVertical ? height * 0.34 : height * 0.6;
  const pxPerBeat = chartW / 3;
  const beatAdvance = 1 / (60 * 1.05);
  const M = 220;
  const pts: string[] = [];
  for (let i = 0; i <= M; i++) {
    const x = (i / M) * chartW;
    let phase = (x / pxPerBeat - frame * beatAdvance) % 1;
    if (phase < 0) phase += 1;
    const v = ecg(phase);
    const y = chartH * 0.55 - v * chartH * 0.42;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const bpm = 72 + Math.round(2 * Math.sin(((2 * Math.PI * frame) / 600) % (2 * Math.PI)));
  const spo2 = 98;
  const R = 7 * u;
  const circ = 2 * Math.PI * R;

  const intro = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const vitals = [
    { k: "RESP", v: "16 /min" },
    { k: "TEMP", v: "36.6 °C" },
    { k: "NIBP", v: "120/80" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#020617",
        fontFamily: FONT,
        color: "#fff",
        padding: `${3.5 * u}px ${4.5 * u}px`,
        opacity: intro,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: `${2.4 * u}px`, fontWeight: 700, letterSpacing: `${0.26 * u}px`, color: TEAL }}>
          CARDIAC MONITOR
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: `${1 * u}px` }}>
          <div
            style={{
              width: `${1.5 * u}px`,
              height: `${1.5 * u}px`,
              borderRadius: "50%",
              backgroundColor: GREEN,
              opacity: 0.5 + 0.5 * Math.abs(Math.sin(((2 * Math.PI * frame) / 63) % (2 * Math.PI))),
            }}
          />
          <span style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.75)" }}>LIVE</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: `${2 * u}px`,
          marginTop: `${2.5 * u}px`,
          flex: 1,
          minHeight: 0,
          flexDirection: isVertical ? "column" : "row",
        }}
      >
        {/* EKG panel */}
        <div
          style={{
            flex: isVertical ? undefined : 1.6,
            height: isVertical ? `${38 * u}px` : "100%",
            backgroundColor: "rgba(8,15,35,0.85)",
            border: "1px solid rgba(45,212,191,0.25)",
            borderRadius: `${1.2 * u}px`,
            padding: `${2 * u}px`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.7)", letterSpacing: `${0.2 * u}px` }}>
            LEAD II · 25 mm/s
          </div>
          <svg width={chartW} height={chartH} style={{ marginTop: `${1 * u}px` }}>
            {[0.25, 0.5, 0.75].map((t) => (
              <line key={t} x1={0} y1={chartH * t} x2={chartW} y2={chartH * t} stroke="rgba(45,212,191,0.12)" strokeWidth={1} />
            ))}
            <polyline points={pts.join(" ")} fill="none" stroke={TEAL} strokeWidth={u * 0.55} strokeLinejoin="round" opacity={0.35} />
            <polyline
              points={pts.slice(Math.floor(M * 0.82)).join(" ")}
              fill="none"
              stroke="#a7f3d0"
              strokeWidth={u * 0.7}
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 ${1.4 * u}px ${TEAL})` }}
            />
          </svg>
        </div>

        {/* vitals column */}
        <div style={{ flex: 1, display: "flex", flexDirection: isVertical ? "row" : "column", gap: `${1.6 * u}px` }}>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(8,15,35,0.85)",
              border: "1px solid rgba(45,212,191,0.25)",
              borderRadius: `${1.2 * u}px`,
              padding: `${2 * u}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.7)", letterSpacing: `${0.2 * u}px` }}>HEART RATE</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: `${1 * u}px` }}>
              <span style={{ fontSize: `${6.5 * u}px`, fontWeight: 800, color: GREEN, lineHeight: 1.1 }}>{bpm}</span>
              <span style={{ fontSize: `${2 * u}px`, color: "rgba(148,163,184,0.7)" }}>BPM</span>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(8,15,35,0.85)",
              border: "1px solid rgba(45,212,191,0.25)",
              borderRadius: `${1.2 * u}px`,
              padding: `${2 * u}px`,
              display: "flex",
              alignItems: "center",
              gap: `${2 * u}px`,
            }}
          >
            <svg width={R * 2 + 8} height={R * 2 + 8}>
              <circle cx={R + 4} cy={R + 4} r={R} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={u * 1.1} />
              <circle
                cx={R + 4}
                cy={R + 4}
                r={R}
                fill="none"
                stroke={TEAL}
                strokeWidth={u * 1.1}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - spo2 / 100)}
                transform={`rotate(-90 ${R + 4} ${R + 4})`}
              />
              <text x={R + 4} y={R + 6} textAnchor="middle" fill="#fff" fontSize={u * 3} fontWeight={800}>
                {spo2}
              </text>
            </svg>
            <div>
              <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.7)", letterSpacing: `${0.2 * u}px` }}>SpO2</div>
              <div style={{ fontSize: `${2.4 * u}px`, fontWeight: 700 }}>98%</div>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(8,15,35,0.85)",
              border: "1px solid rgba(45,212,191,0.25)",
              borderRadius: `${1.2 * u}px`,
              padding: `${2 * u}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: `${0.8 * u}px`,
            }}
          >
            {vitals.map((v) => (
              <div key={v.k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.7)" }}>{v.k}</span>
                <span style={{ fontSize: `${1.9 * u}px`, fontWeight: 700 }}>{v.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: `${2 * u}px`, fontSize: `${1.5 * u}px`, color: "rgba(148,163,184,0.5)", letterSpacing: `${0.18 * u}px` }}>
        STABLE RHYTHM · NO ARRHYTHMIA DETECTED · {AMBER === "#fbbf24" ? "" : ""}BED 04 · WARD C
      </div>
    </AbsoluteFill>
  );
};

export default EKGMedicalMonitor;
