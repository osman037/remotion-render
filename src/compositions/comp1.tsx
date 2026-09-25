import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BLUE = "#38bdf8";
const GREEN = "#34d399";
const AMBER = "#fbbf24";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const STAGES = ["CODE", "BUILD", "TEST", "DEPLOY", "MONITOR"];
const AT = [80, 240, 400, 560, 720];
const LOGS = [
  "> git push origin main",
  "> build #4821 · success in 41s",
  "> 248 tests passed · 0 failed",
  "> deploying to production",
  "> health checks passing · live",
];

export const CICDPipelineDeploy: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width, height) / 100;
  const isVertical = height > width;

  const t = Easing.inOut(Easing.cubic)(frame / 900);
  const doneCount = AT.filter((a) => frame >= a + 60).length;

  const nodePos = (i: number) => {
    const pad = 12;
    const span = 100 - pad * 2;
    return pad + (i / (STAGES.length - 1)) * span;
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#04070f",
        fontFamily: FONT,
        color: "#fff",
        padding: `${4 * u}px ${5 * u}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: `${2.4 * u}px`, fontWeight: 700, letterSpacing: `${0.26 * u}px` }}>
          CI/CD <span style={{ color: BLUE }}>PIPELINE</span>
        </div>
        <div style={{ fontSize: `${1.8 * u}px`, color: "rgba(148,163,184,0.7)" }}>
          {doneCount}/5 stages complete
        </div>
      </div>

      {/* pipeline */}
      <div style={{ position: "relative", flex: 1, marginTop: `${4 * u}px` }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {isVertical ? (
            <line x1={50} y1={6} x2={50} y2={94} stroke="rgba(56,189,248,0.25)" strokeWidth={0.8} />
          ) : (
            <line x1={6} y1={50} x2={94} y2={50} stroke="rgba(56,189,248,0.25)" strokeWidth={0.8} />
          )}
          {/* traveling packet */}
          {isVertical ? (
            <circle cx={50} cy={6 + t * 88} r={2.2} fill={AMBER} style={{ filter: `drop-shadow(0 0 6px ${AMBER})` }} />
          ) : (
            <circle cx={6 + t * 88} cy={50} r={2.2} fill={AMBER} style={{ filter: `drop-shadow(0 0 6px ${AMBER})` }} />
          )}
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {STAGES.map((s, i) => {
            const active = frame >= AT[i];
            const done = frame >= AT[i] + 60;
            const sc = spring({ frame: frame - AT[i], fps, config: { damping: 12, stiffness: 160 } });
            const prog = interpolate(frame, [AT[i], AT[i] + 60], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: `${1 * u}px` }}>
                <div
                  style={{
                    width: `${11 * u}px`,
                    height: `${11 * u}px`,
                    borderRadius: "50%",
                    border: `${0.5 * u}px solid ${done ? GREEN : active ? BLUE : "rgba(148,163,184,0.35)"}`,
                    backgroundColor: done ? "rgba(52,211,153,0.15)" : active ? "rgba(56,189,248,0.15)" : "rgba(15,23,42,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${4 * u}px`,
                    fontWeight: 800,
                    color: done ? GREEN : active ? BLUE : "rgba(148,163,184,0.5)",
                    transform: active ? `scale(${0.6 + 0.4 * Math.min(1, sc)})` : "scale(1)",
                    boxShadow: active ? `0 0 ${2.5 * u}px ${done ? GREEN : BLUE}` : "none",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: `${2 * u}px`, fontWeight: 700, letterSpacing: `${0.18 * u}px` }}>{s}</div>
                <div
                  style={{
                    width: `${12 * u}px`,
                    height: `${0.8 * u}px`,
                    borderRadius: `${0.4 * u}px`,
                    backgroundColor: "rgba(148,163,184,0.18)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: `${prog}%`, height: "100%", backgroundColor: done ? GREEN : BLUE }} />
                </div>
                <div style={{ fontSize: `${1.5 * u}px`, color: done ? GREEN : active ? BLUE : "rgba(148,163,184,0.45)" }}>
                  {done ? "done" : active ? "running…" : "queued"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* deploy log */}
      <div
        style={{
          marginTop: `${3 * u}px`,
          backgroundColor: "rgba(2,6,16,0.9)",
          border: "1px solid rgba(56,189,248,0.2)",
          borderRadius: `${1 * u}px`,
          padding: `${1.8 * u}px ${2.2 * u}px`,
          fontFamily: "monospace",
          minHeight: `${14 * u}px`,
        }}
      >
        {LOGS.slice(0, Math.min(LOGS.length, Math.floor(frame / 170) + 1)).map((l, i) => (
          <div key={i} style={{ fontSize: `${1.8 * u}px`, color: "rgba(226,232,240,0.9)", marginBottom: `${0.6 * u}px` }}>
            <span style={{ color: GREEN }}>$</span> {l.replace("> ", "")}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default CICDPipelineDeploy;
