import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const CYAN = "#22d3ee";
const AMBER = "#fbbf24";
const GREEN = "#34d399";
const RED = "#fb7185";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

export const GPUTrainingMonitor: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;
  const isVertical = height > width;

  const gpus = Array.from({ length: 8 }, (_, i) => i);
  const util = (i: number) => {
    const v =
      64 +
      26 * Math.sin(((2 * Math.PI * frame) / 450 + i * 1.7) % (2 * Math.PI)) +
      6 * Math.sin(((2 * Math.PI * frame) / 150 + i * 3.1) % (2 * Math.PI));
    return Math.max(6, Math.min(99, Math.round(v)));
  };
  const temp = (i: number) => Math.round(58 + util(i) * 0.28 + rand(i * 7.3) * 4);
  const vram = (i: number) =>
    Math.round(61 + 22 * Math.sin(((2 * Math.PI * frame) / 600 + i * 2.3) % (2 * Math.PI)) + rand(i * 3.1) * 6);

  // training curves
  const N = 64;
  const lossPts: string[] = [];
  const accPts: string[] = [];
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 100;
    const loss = 2.5 * Math.exp(-x * 0.038) + 0.1 + (rand(i * 1.7) - 0.5) * 0.06;
    const acc = 96.5 - 34 * Math.exp(-x * 0.045) + (rand(i * 2.9) - 0.5) * 0.4;
    lossPts.push(`${x.toFixed(2)},${(40 - (loss / 2.7) * 36).toFixed(2)}`);
    accPts.push(`${x.toFixed(2)},${(40 - ((acc - 60) / 40) * 36).toFixed(2)}`);
  }
  const reveal = interpolate(frame, [60, 720], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const epoch = 1 + Math.min(9, Math.floor(frame / 90));
  const batchPct = Math.round((frame / 900) * 100);
  const events = [
    "ckpt-0041 saved · val_loss 0.412",
    "lr schedule step → 3.2e-4",
    "ckpt-0042 saved · val_loss 0.398",
    "gradient norm clipped at 1.0",
    "ckpt-0043 saved · val_loss 0.385",
    "eval pass complete · acc 96.4%",
  ];
  const visibleEvents = events.slice(0, Math.min(events.length, Math.floor(frame / 150) + 1));

  const headerIn = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", fontFamily: FONT, color: "#fff" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: `${3.2 * u}px ${4 * u}px`,
          opacity: headerIn,
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: `${1.2 * u}px` }}>
            <div
              style={{
                width: `${1.6 * u}px`,
                height: `${1.6 * u}px`,
                borderRadius: "50%",
                backgroundColor: GREEN,
                boxShadow: `0 0 ${1.2 * u}px ${GREEN}`,
                opacity: 0.6 + 0.4 * Math.sin(((2 * Math.PI * frame) / 60) % (2 * Math.PI)),
              }}
            />
            <span style={{ fontSize: `${2.6 * u}px`, fontWeight: 700, letterSpacing: `${0.28 * u}px` }}>
              GPU CLUSTER · TRAINING MONITOR
            </span>
          </div>
          <span style={{ fontSize: `${2.2 * u}px`, color: CYAN, fontWeight: 600 }}>
            EPOCH {epoch}/10
          </span>
        </div>

        {/* gpu grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: `${1.6 * u}px`,
            marginTop: `${2.4 * u}px`,
          }}
        >
          {gpus.map((i) => {
            const uv = util(i);
            const col = uv > 90 ? RED : uv > 70 ? AMBER : CYAN;
            return (
              <div
                key={i}
                style={{
                  width: isVertical ? "47.5%" : "23.2%",
                  backgroundColor: "rgba(15,23,42,0.72)",
                  border: `1px solid rgba(34,211,238,0.22)`,
                  borderRadius: `${1 * u}px`,
                  padding: `${1.6 * u}px`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: `${1.9 * u}px`, fontWeight: 700, color: "#e2e8f0" }}>
                    GPU-{i}
                  </span>
                  <span style={{ fontSize: `${1.7 * u}px`, color: DIM }}>
                    {temp(i)}°C
                  </span>
                </div>
                <div
                  style={{
                    marginTop: `${1 * u}px`,
                    height: `${1.1 * u}px`,
                    borderRadius: `${0.6 * u}px`,
                    backgroundColor: "rgba(148,163,184,0.18)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${uv}%`,
                      height: "100%",
                      backgroundColor: col,
                      borderRadius: `${0.6 * u}px`,
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: `${0.8 * u}px` }}>
                  <span style={{ fontSize: `${1.7 * u}px`, color: col, fontWeight: 700 }}>{uv}%</span>
                  <span style={{ fontSize: `${1.7 * u}px`, color: DIM }}>VRAM {vram(i)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* curves */}
        <div
          style={{
            display: "flex",
            gap: `${1.6 * u}px`,
            marginTop: `${2 * u}px`,
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(34,211,238,0.22)",
              borderRadius: `${1 * u}px`,
              padding: `${1.6 * u}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: `${1.9 * u}px`, fontWeight: 700 }}>TRAINING LOSS</span>
              <span style={{ fontSize: `${1.9 * u}px`, color: CYAN, fontWeight: 700 }}>0.385 ↓</span>
            </div>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ flex: 1, width: "100%", marginTop: `${1 * u}px` }}>
              {[10, 20, 30].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth="0.4" />
              ))}
              <polyline
                points={lossPts.join(" ")}
                fill="none"
                stroke={CYAN}
                strokeWidth="1.1"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={reveal}
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(15,23,42,0.72)",
              border: "1px solid rgba(34,211,238,0.22)",
              borderRadius: `${1 * u}px`,
              padding: `${1.6 * u}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: `${1.9 * u}px`, fontWeight: 700 }}>VAL ACCURACY</span>
              <span style={{ fontSize: `${1.9 * u}px`, color: GREEN, fontWeight: 700 }}>96.4% ↑</span>
            </div>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ flex: 1, width: "100%", marginTop: `${1 * u}px` }}>
              {[10, 20, 30].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth="0.4" />
              ))}
              <polyline
                points={accPts.join(" ")}
                fill="none"
                stroke={GREEN}
                strokeWidth="1.1"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={reveal}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* batch progress + events */}
        <div style={{ marginTop: `${2 * u}px`, display: "flex", gap: `${1.6 * u}px`, alignItems: "stretch" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: `${0.8 * u}px` }}>
              <span style={{ fontSize: `${1.8 * u}px`, color: DIM, letterSpacing: `${0.2 * u}px` }}>
                BATCH PROGRESS
              </span>
              <span style={{ fontSize: `${1.8 * u}px`, color: AMBER, fontWeight: 700 }}>{batchPct}%</span>
            </div>
            <div
              style={{
                height: `${1.4 * u}px`,
                borderRadius: `${0.7 * u}px`,
                backgroundColor: "rgba(148,163,184,0.18)",
                overflow: "hidden",
              }}
            >
              <div style={{ width: `${batchPct}%`, height: "100%", backgroundColor: AMBER }} />
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: `${0.5 * u}px`, justifyContent: "center" }}>
            {visibleEvents.slice(-3).map((e, i) => (
              <div key={i} style={{ fontSize: `${1.6 * u}px`, color: "rgba(226,232,240,0.85)", fontFamily: "monospace" }}>
                <span style={{ color: GREEN }}>▸</span> {e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DIM = "rgba(148,163,184,0.55)";

export default GPUTrainingMonitor;
