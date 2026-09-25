import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const TEAL = "#2dd4bf";
const CYAN = "#22d3ee";
const GREEN = "#34d399";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const checks = [
  { label: "LIVENESS", at: 150 },
  { label: "FACE MATCH · 99.2%", at: 350 },
  { label: "DEPTH MAP", at: 550 },
];

export const BiometricFaceScan: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const cx = width / 2;
  const cy = height * 0.46;
  const rx = 26 * u;
  const ry = 32 * u;

  // scan line sweeps every 300 frames
  const scanT = (frame % 300) / 300;
  const scanY = cy - ry + scanT * ry * 2;

  // mesh dots inside ellipse
  const dots: { x: number; y: number }[] = [];
  const step = 4.4 * u;
  for (let gx = -rx; gx <= rx; gx += step) {
    for (let gy = -ry; gy <= ry; gy += step) {
      if ((gx * gx) / (rx * rx) + (gy * gy) / ((ry * ry)) < 0.92) {
        dots.push({ x: cx + gx, y: cy + gy });
      }
    }
  }

  const granted = frame > 640;
  const grantSpring = spring({ frame: frame - 640, fps, config: { damping: 14, stiffness: 160 } });

  const corner = (top: boolean, left: boolean): React.CSSProperties => ({
    position: "absolute",
    top: top ? `${5 * u}px` : undefined,
    bottom: top ? undefined : `${5 * u}px`,
    left: left ? `${5 * u}px` : undefined,
    right: left ? undefined : `${5 * u}px`,
    width: `${7 * u}px`,
    height: `${7 * u}px`,
    borderTop: top ? `${0.5 * u}px solid ${TEAL}` : undefined,
    borderBottom: top ? undefined : `${0.5 * u}px solid ${TEAL}`,
    borderLeft: left ? `${0.5 * u}px solid ${TEAL}` : undefined,
    borderRight: left ? undefined : `${0.5 * u}px solid ${TEAL}`,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", fontFamily: FONT, color: "#fff", overflow: "hidden" }}>
      <div style={corner(true, true)} />
      <div style={corner(true, false)} />
      <div style={corner(false, true)} />
      <div style={corner(false, false)} />

      <div
        style={{
          position: "absolute",
          top: `${4 * u}px`,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: `${2.4 * u}px`,
          fontWeight: 700,
          letterSpacing: `${0.3 * u}px`,
          color: TEAL,
        }}
      >
        BIOMETRIC AUTHENTICATION
      </div>

      {/* face mesh */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={TEAL}
          strokeWidth={u * 0.45}
          opacity={0.9}
        />
        {dots.map((d, i) => {
          const dist = Math.abs(d.y - scanY);
          const glow = Math.max(0, 1 - dist / (10 * u));
          return (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={u * 0.28}
              fill={glow > 0.4 ? "#ffffff" : TEAL}
              opacity={0.25 + glow * 0.75}
            />
          );
        })}
        {/* scan line */}
        <line x1={cx - rx - 3 * u} y1={scanY} x2={cx + rx + 3 * u} y2={scanY} stroke={CYAN} strokeWidth={u * 0.5} opacity={0.95} />
        <rect x={cx - rx - 3 * u} y={scanY - 6 * u} width={(rx + 3 * u) * 2} height={6 * u} fill={CYAN} opacity={0.08} />
      </svg>

      {/* checkpoints */}
      <div
        style={{
          position: "absolute",
          right: `${7 * u}px`,
          top: `${30 * u}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${1.6 * u}px`,
        }}
      >
        {checks.map((c) => {
          const done = frame >= c.at;
          const s = spring({ frame: frame - c.at, fps, config: { damping: 16, stiffness: 200 } });
          return (
            <div
              key={c.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${1 * u}px`,
                opacity: done ? 1 : 0.25,
                transform: `translateX(${(1 - Math.min(1, s)) * 4 * u}px)`,
              }}
            >
              <div
                style={{
                  width: `${2.6 * u}px`,
                  height: `${2.6 * u}px`,
                  borderRadius: "50%",
                  border: `${0.35 * u}px solid ${done ? GREEN : "rgba(148,163,184,0.5)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: `${1.6 * u}px`,
                  color: GREEN,
                  fontWeight: 800,
                }}
              >
                {done ? "✓" : ""}
              </div>
              <span style={{ fontSize: `${1.9 * u}px`, fontWeight: 600, letterSpacing: `${0.12 * u}px` }}>
                {c.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* side data dashes */}
      <div style={{ position: "absolute", left: `${7 * u}px`, top: `${30 * u}px`, display: "flex", flexDirection: "column", gap: `${1.1 * u}px` }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              width: `${(10 + ((i * 37) % 8)) * u}px`,
              height: `${0.9 * u}px`,
              borderRadius: `${0.45 * u}px`,
              backgroundColor: "rgba(45,212,191,0.35)",
              opacity: interpolate(frame, [i * 60, i * 60 + 40], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        ))}
      </div>

      {/* granted banner */}
      {granted && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${10 * u}px`,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [640, 670], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            transform: `scale(${0.7 + 0.3 * Math.min(1, grantSpring)})`,
          }}
        >
          <div
            style={{
              border: `${0.5 * u}px solid ${GREEN}`,
              borderRadius: `${1.2 * u}px`,
              padding: `${1.6 * u}px ${5 * u}px`,
              fontSize: `${3.4 * u}px`,
              fontWeight: 800,
              letterSpacing: `${0.4 * u}px`,
              color: GREEN,
              backgroundColor: "rgba(52,211,153,0.08)",
              boxShadow: `0 0 ${4 * u}px rgba(52,211,153,0.35)`,
            }}
          >
            ✓ ACCESS GRANTED
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: `${4 * u}px`,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: `${1.6 * u}px`,
          color: "rgba(148,163,184,0.6)",
          letterSpacing: `${0.2 * u}px`,
        }}
      >
        SECURE ENCLAVE · AES-256 · ZERO-KNOWLEDGE
      </div>
    </AbsoluteFill>
  );
};

export default BiometricFaceScan;
