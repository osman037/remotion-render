import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const GREEN = "#34d399";
const TEAL = "#2dd4bf";
const AMBER = "#fbbf24";
const RED = "#fb7185";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

export const CarbonEmissionsDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;
  const isVertical = height > width;

  // CO2 gauge needle 300 -> 421 ppm
  const ppm = interpolate(frame, [60, 420], [300, 421], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const needleA = -90 + ((ppm - 300) / 160) * 180;

  // emissions line 1990-2026
  const EM = [22.1, 23.4, 24.9, 26.8, 29.2, 31.5, 33.8, 36.2];
  const emPts = EM.map(
    (v, i) => `${((i / (EM.length - 1)) * 100).toFixed(1)},${(40 - ((v - 20) / 20) * 34).toFixed(1)}`
  );
  const reveal = interpolate(frame, [80, 700], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // renewable donut
  const R = 6.5 * u;
  const circ = 2 * Math.PI * R;
  const renPct = interpolate(frame, [120, 480], [0, 34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // temp anomaly bars
  const anomalies = [0.32, 0.45, 0.61, 0.74, 0.9, 1.02, 1.18, 1.45];
  const barIn = (i: number) =>
    interpolate(frame, [200 + i * 55, 280 + i * 55], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back),
    });

  const panel: React.CSSProperties = {
    backgroundColor: "rgba(6,24,17,0.85)",
    border: "1px solid rgba(52,211,153,0.25)",
    borderRadius: `${1.2 * u}px`,
    padding: `${2 * u}px`,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#04120b",
        fontFamily: FONT,
        color: "#fff",
        padding: `${3.5 * u}px ${4.5 * u}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: `${2.4 * u}px`, fontWeight: 700, letterSpacing: `${0.26 * u}px`, color: GREEN }}>
          CARBON & CLIMATE DASHBOARD
        </div>
        <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.7)" }}>1990 → 2026</div>
      </div>

      <div
        style={{
          display: "flex",
          gap: `${1.8 * u}px`,
          marginTop: `${2.5 * u}px`,
          flex: 1,
          minHeight: 0,
          flexDirection: isVertical ? "column" : "row",
          flexWrap: "wrap",
        }}
      >
        {/* CO2 gauge */}
        <div style={{ ...panel, minWidth: isVertical ? "100%" : "42%" }}>
          <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.75)", letterSpacing: `${0.18 * u}px` }}>
            ATMOSPHERIC CO₂
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, position: "relative" }}>
            <svg width={34 * u} height={20 * u} viewBox="0 0 100 58">
              <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={7} strokeLinecap="round" />
              <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round"
                strokeDasharray={132} strokeDashoffset={132 * (1 - (ppm - 300) / 160)} />
              <line
                x1={50}
                y1={50}
                x2={50 + 36 * Math.cos(((needleA * Math.PI) / 180))}
                y2={50 + 36 * Math.sin(((needleA * Math.PI) / 180))}
                stroke="#fff"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              <circle cx={50} cy={50} r={4} fill="#fff" />
            </svg>
            <div style={{ position: "absolute", bottom: `${1 * u}px`, textAlign: "center" }}>
              <span style={{ fontSize: `${3.6 * u}px`, fontWeight: 800 }}>{Math.round(ppm)}</span>
              <span style={{ fontSize: `${1.7 * u}px`, color: "rgba(148,163,184,0.7)" }}> ppm</span>
            </div>
          </div>
        </div>

        {/* emissions trend */}
        <div style={{ ...panel, minWidth: isVertical ? "100%" : "52%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.75)", letterSpacing: `${0.18 * u}px` }}>
              GLOBAL CO₂ EMISSIONS · GT
            </span>
            <span style={{ fontSize: `${1.9 * u}px`, color: RED, fontWeight: 700 }}>36.2 ▲</span>
          </div>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ flex: 1, width: "100%", marginTop: `${1 * u}px` }}>
            <polyline
              points={emPts.join(" ")}
              fill="none"
              stroke={AMBER}
              strokeWidth={1.2}
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={reveal}
              strokeLinejoin="round"
            />
            <polygon points={`0,40 ${emPts.join(" ")} 100,40`} fill="rgba(251,191,36,0.1)" />
          </svg>
        </div>

        {/* renewable donut */}
        <div style={{ ...panel, minWidth: isVertical ? "48%" : "30%", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.75)", letterSpacing: `${0.18 * u}px`, alignSelf: "flex-start" }}>
            RENEWABLE SHARE
          </div>
          <svg width={R * 2 + 10} height={R * 2 + 10}>
            <circle cx={R + 5} cy={R + 5} r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={u * 1.6} />
            <circle
              cx={R + 5}
              cy={R + 5}
              r={R}
              fill="none"
              stroke={TEAL}
              strokeWidth={u * 1.6}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - renPct / 100)}
              transform={`rotate(-90 ${R + 5} ${R + 5})`}
            />
            <text x={R + 5} y={R + 8} textAnchor="middle" fill="#fff" fontSize={u * 3.4} fontWeight={800}>
              {Math.round(renPct)}%
            </text>
          </svg>
        </div>

        {/* temp anomaly bars */}
        <div style={{ ...panel, minWidth: isVertical ? "48%" : "64%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.75)", letterSpacing: `${0.18 * u}px` }}>
              TEMP ANOMALY · °C
            </span>
            <span style={{ fontSize: `${1.9 * u}px`, color: RED, fontWeight: 700 }}>+1.45°</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: `${1 * u}px`, flex: 1, marginTop: `${1 * u}px` }}>
            {anomalies.map((a, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${barIn(i) * (a / 1.5) * 100}%`,
                  minHeight: barIn(i) > 0 ? `${1 * u}px` : 0,
                  background: `linear-gradient(180deg, ${RED}, ${AMBER})`,
                  borderRadius: `${0.5 * u}px ${0.5 * u}px 0 0`,
                  opacity: 0.55 + (i / anomalies.length) * 0.45,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: `${2 * u}px`, fontSize: `${1.5 * u}px`, color: "rgba(148,163,184,0.55)", letterSpacing: `${0.16 * u}px` }}>
        ESG REPORTING · NET-ZERO TRACKING · SUSTAINABILITY DISCLOSURE
      </div>
    </AbsoluteFill>
  );
};

export default CarbonEmissionsDashboard;
