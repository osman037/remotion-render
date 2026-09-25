import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const CYAN = "#22d3ee";
const RED = "#f43f5e";
const AMBER = "#fbbf24";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const FX = ["RGB SPLIT", "SLICE SHIFT", "SCANLINES", "PIXEL BLOCKS", "CHROMA BURST", "WIPE"];

export const GlitchTransitionSampler: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const cycle = Math.min(5, Math.floor(frame / 150));
  const ct = frame % 150;
  const env = Math.sin((Math.PI * ct) / 150);
  const fx = FX[cycle];

  const title = (extra?: React.CSSProperties) => (
    <div
      style={{
        fontSize: `${13 * u}px`,
        fontWeight: 800,
        letterSpacing: `${0.1 * u}px`,
        color: "#fff",
        ...extra,
      }}
    >
      GLITCH FX
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a", fontFamily: FONT, overflow: "hidden" }}>
      {/* base panel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: `${2 * u}px`,
          filter: fx === "CHROMA BURST" ? `hue-rotate(${env * 120}deg) saturate(${1 + env * 2.5})` : "none",
        }}
      >
        <div style={{ position: "relative" }}>
          {fx === "RGB SPLIT" && (
            <>
              <div style={{ position: "absolute", left: `${-2.4 * u * env}px`, top: 0, color: RED, opacity: 0.85 * env, mixBlendMode: "screen", fontSize: `${13 * u}px`, fontWeight: 800, whiteSpace: "nowrap" }}>
                GLITCH FX
              </div>
              <div style={{ position: "absolute", left: `${2.4 * u * env}px`, top: 0, color: CYAN, opacity: 0.85 * env, mixBlendMode: "screen", fontSize: `${13 * u}px`, fontWeight: 800, whiteSpace: "nowrap" }}>
                GLITCH FX
              </div>
            </>
          )}
          {title()}
        </div>
        <div
          style={{
            width: `${46 * u}px`,
            height: `${1.2 * u}px`,
            background: `linear-gradient(90deg, ${CYAN}, ${AMBER}, ${RED})`,
            borderRadius: `${0.6 * u}px`,
            opacity: 0.9,
          }}
        />
        <div style={{ display: "flex", gap: `${1.5 * u}px` }}>
          {[CYAN, AMBER, RED].map((c, i) => (
            <div key={i} style={{ width: `${8 * u}px`, height: `${8 * u}px`, borderRadius: `${1 * u}px`, backgroundColor: c, opacity: 0.85 }} />
          ))}
        </div>
      </div>

      {/* SLICE SHIFT */}
      {fx === "SLICE SHIFT" &&
        Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${(i / 8) * 100}%`,
              height: `${12.5}%`,
              backgroundColor: i % 2 ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.12)",
              transform: `translateX(${(rand(i * 13.7 + cycle) - 0.5) * env * 22 * u}px)`,
              opacity: env,
            }}
          />
        ))}

      {/* SCANLINES */}
      {fx === "SCANLINES" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(0deg, rgba(34,211,238,0.35) 0 ${0.5 * u}px, transparent ${0.5 * u}px ${1.4 * u}px)`,
            opacity: env * 0.9,
          }}
        />
      )}

      {/* PIXEL BLOCKS */}
      {fx === "PIXEL BLOCKS" &&
        Array.from({ length: 60 }, (_, i) => {
          const cols = 10;
          const r = Math.floor(i / cols);
          const c = i % cols;
          const on = rand(i * 7.9 + cycle * 3.3) < env * 0.75;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(c / cols) * 100}%`,
                top: `${(r / 6) * 100}%`,
                width: `${100 / cols}%`,
                height: `${100 / 6}%`,
                backgroundColor: [CYAN, AMBER, RED][i % 3],
                opacity: on ? 0.55 : 0,
              }}
            />
          );
        })}

      {/* WIPE */}
      {fx === "WIPE" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${(ct / 150) * 110 - 5}%`,
            width: `${6 * u}px`,
            background: `linear-gradient(90deg, transparent, #fff, transparent)`,
            boxShadow: `0 0 ${4 * u}px #fff`,
            opacity: 0.9,
          }}
        />
      )}

      {/* fx label */}
      <div
        style={{
          position: "absolute",
          left: `${4 * u}px`,
          bottom: `${4 * u}px`,
          backgroundColor: "rgba(0,0,0,0.75)",
          border: `1px solid ${CYAN}`,
          borderRadius: `${0.9 * u}px`,
          padding: `${1 * u}px ${2.2 * u}px`,
          fontSize: `${2.2 * u}px`,
          fontWeight: 700,
          letterSpacing: `${0.22 * u}px`,
          color: CYAN,
        }}
      >
        {String(cycle + 1).padStart(2, "0")} · {fx}
      </div>
      <div
        style={{
          position: "absolute",
          right: `${4 * u}px`,
          bottom: `${4 * u}px`,
          fontSize: `${1.7 * u}px`,
          color: "rgba(148,163,184,0.65)",
          letterSpacing: `${0.2 * u}px`,
        }}
      >
        TRANSITION PACK · 6 STYLES
      </div>
    </AbsoluteFill>
  );
};

export default GlitchTransitionSampler;
