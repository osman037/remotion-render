import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

const CYAN = "#22d3ee";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

export const NeonCountdownRing: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const step = Math.min(9, Math.floor(frame / 90));
  const num = 10 - step;
  const pop = spring({ frame: frame - step * 90, fps, config: { damping: 9, stiffness: 220 } });

  const R = 30 * u;
  const circ = 2 * Math.PI * R;
  const ringPct = 1 - frame / 900;

  const ticks = Array.from({ length: 60 }, (_, i) => i);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily: FONT,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: `${2.6 * u}px`, fontWeight: 600, letterSpacing: `${0.6 * u}px`, color: "rgba(165,243,252,0.75)", marginBottom: `${3 * u}px` }}>
        LIVE IN
      </div>

      <div style={{ position: "relative", width: `${(R + 6 * u) * 2}px`, height: `${(R + 6 * u) * 2}px` }}>
        <svg width={(R + 6 * u) * 2} height={(R + 6 * u) * 2} style={{ position: "absolute", inset: 0 }}>
          {ticks.map((i) => {
            const a = (i / 60) * 2 * Math.PI;
            const lit = i / 60 <= ringPct;
            const x1 = (R + 6 * u) + Math.cos(a) * (R + 3.4 * u);
            const y1 = (R + 6 * u) + Math.sin(a) * (R + 3.4 * u);
            const x2 = (R + 6 * u) + Math.cos(a) * (R + 5.2 * u);
            const y2 = (R + 6 * u) + Math.sin(a) * (R + 5.2 * u);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={lit ? CYAN : "rgba(148,163,184,0.25)"} strokeWidth={i % 5 === 0 ? u * 0.7 : u * 0.35} />
            );
          })}
          <circle
            cx={R + 6 * u}
            cy={R + 6 * u}
            r={R}
            fill="none"
            stroke="rgba(148,163,184,0.18)"
            strokeWidth={u * 1.4}
          />
          <circle
            cx={R + 6 * u}
            cy={R + 6 * u}
            r={R}
            fill="none"
            stroke={CYAN}
            strokeWidth={u * 1.4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ringPct)}
            transform={`rotate(-90 ${R + 6 * u} ${R + 6 * u})`}
            style={{ filter: `drop-shadow(0 0 ${1.6 * u}px ${CYAN})` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${17 * u}px`,
            fontWeight: 800,
            color: "#fff",
            transform: `scale(${0.55 + 0.45 * Math.min(1, pop)})`,
            textShadow: `0 0 ${3 * u}px ${CYAN}, 0 0 ${8 * u}px rgba(34,211,238,0.5)`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {num}
        </div>
      </div>

      <div style={{ fontSize: `${2.2 * u}px`, letterSpacing: `${0.5 * u}px`, color: "rgba(148,163,184,0.7)", marginTop: `${3 * u}px` }}>
        SECONDS
      </div>
    </AbsoluteFill>
  );
};

export default NeonCountdownRing;
