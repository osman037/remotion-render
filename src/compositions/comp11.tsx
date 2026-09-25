import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const CARDS = [
  { name: "Alex Morgan", title: "Chief Executive", accent: "#22d3ee" },
  { name: "Sara Ahmed", title: "Design Director", accent: "#fbbf24" },
  { name: "David Chen", title: "Head of Product", accent: "#34d399" },
];

export const CorporateLowerThirds: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  // faint drifting highlight so the full frame stays alive
  const drift = ((frame / 900) * 120 - 10) % 120;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0f1e 0%, #05070f 60%, #0a0f1e 100%)",
        fontFamily: FONT,
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${drift}%`,
          width: "18%",
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.05), transparent)",
        }}
      />
      {/* faint grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={(width / 12) * i} y1={0} x2={(width / 12) * i} y2={height} stroke="rgba(148,163,184,0.07)" strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(height / 8) * i} x2={width} y2={(height / 8) * i} stroke="rgba(148,163,184,0.07)" strokeWidth={1} />
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          top: `${4 * u}px`,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: `${1.8 * u}px`,
          letterSpacing: `${0.4 * u}px`,
          color: "rgba(148,163,184,0.6)",
          fontWeight: 600,
        }}
      >
        CORPORATE LOWER THIRDS · 3 STYLES
      </div>

      {CARDS.map((c, i) => {
        const start = i * 300;
        const local = frame - start;
        if (local < 0 || local > 300) return null;
        const enter = spring({ frame: local, fps, config: { damping: 16, stiffness: 170 } });
        const exitT = interpolate(local, [240, 295], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });
        const barW = interpolate(local, [10, 70], [0, 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={c.name}
            style={{
              position: "absolute",
              left: `${8 * u}px`,
              bottom: `${13 * u}px`,
              opacity: (1 - exitT) * Math.min(1, enter * 2),
              transform: `translateX(${(1 - Math.min(1, enter)) * -30 * u + exitT * 24 * u}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <div style={{ width: `${1.1 * u}px`, backgroundColor: c.accent, borderRadius: `${0.55 * u}px` }} />
              <div style={{ marginLeft: `${2.2 * u}px`, padding: `${1 * u}px 0` }}>
                <div style={{ fontSize: `${4.2 * u}px`, fontWeight: 800, letterSpacing: `${0.04 * u}px`, lineHeight: 1.1 }}>
                  {c.name}
                </div>
                <div style={{ fontSize: `${2.3 * u}px`, color: "rgba(226,232,240,0.75)", letterSpacing: `${0.22 * u}px`, marginTop: `${0.7 * u}px`, textTransform: "uppercase" }}>
                  {c.title}
                </div>
                <div
                  style={{
                    marginTop: `${1.2 * u}px`,
                    height: `${0.45 * u}px`,
                    width: `${barW * 0.32 * u}px`,
                    backgroundColor: c.accent,
                    borderRadius: `${0.22 * u}px`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default CorporateLowerThirds;
