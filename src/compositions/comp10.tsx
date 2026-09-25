import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const AMBER = "#fbbf24";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const WORDS = [
  { t: "GROWTH", color: "#ffffff" },
  { t: "IS A", color: "#ffffff" },
  { t: "DAILY", color: "#ffffff" },
  { t: "DECISION", color: AMBER },
];

export const GrowthMindsetKineticType: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const subIn = interpolate(frame, [430, 500], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineSweep = interpolate(frame, [150, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        fontFamily: FONT,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* soft radial glow */}
      <div
        style={{
          position: "absolute",
          width: `${90 * u}px`,
          height: `${90 * u}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 65%)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: `${1.2 * u}px`, zIndex: 1 }}>
        {WORDS.map((w, i) => {
          const s = spring({
            frame: frame - i * 26,
            fps,
            config: { damping: 13, stiffness: 130 },
          });
          const shown = frame >= i * 26;
          return (
            <div key={w.t} style={{ position: "relative", overflow: "hidden", paddingBottom: `${0.6 * u}px` }}>
              <div
                style={{
                  fontSize: `${10.5 * u}px`,
                  fontWeight: 800,
                  letterSpacing: `${0.06 * u}px`,
                  lineHeight: 1.04,
                  color: w.color,
                  opacity: shown ? 1 : 0,
                  transform: `translateY(${(1 - Math.min(1, s)) * 9 * u}px)`,
                }}
              >
                {w.t}
              </div>
              {w.t === "DECISION" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: `${0.9 * u}px`,
                    width: `${lineSweep * 100}%`,
                    backgroundColor: AMBER,
                    borderRadius: `${0.45 * u}px`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: `${4.5 * u}px`,
          fontSize: `${2.8 * u}px`,
          fontWeight: 400,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: `${0.14 * u}px`,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 3 * u}px)`,
          zIndex: 1,
        }}
      >
        Small steps. Compounding results.
      </div>

      <div
        style={{
          position: "absolute",
          bottom: `${4 * u}px`,
          fontSize: `${1.6 * u}px`,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: `${0.3 * u}px`,
          opacity: interpolate(frame, [560, 620], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        MOTIVATION · BUSINESS · PERSONAL GROWTH
      </div>
    </AbsoluteFill>
  );
};

export default GrowthMindsetKineticType;
