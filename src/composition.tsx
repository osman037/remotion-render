import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const MenorahFlameGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;
  const centerX = width / 2;
  const baseY = height * 0.74;
  const gradientAngle = progress * 360;
  const globalPulse = Math.sin(progress * twoPi);
  const scanY = height * 0.5 + Math.sin(progress * twoPi) * height * 0.42;

  const nodes = Array.from({ length: 30 }, (_, i) => {
    const nx = (0.04 + seededRandom(i * 3 + 1) * 0.92) * width;
    const ny = (0.05 + seededRandom(i * 3 + 2) * 0.85) * height;
    const speed = 0.5 + seededRandom(i * 3 + 3) * 1.0;
    const phase = seededRandom(i * 7 + 5) * twoPi;
    const x = nx + Math.sin(progress * twoPi * speed + phase) * 46;
    const y = ny + Math.cos(progress * twoPi * speed + phase) * 34;
    return { x, y, phase };
  });

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; o: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = width * 0.16;
      if (dist < maxDist) {
        lines.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          o: Math.max(0, 1 - dist / maxDist) * 0.55,
        });
      }
    }
  }

  const embers = Array.from({ length: 42 }, (_, i) => {
    const offset = seededRandom(i * 11 + 2);
    const cycle = (progress * (0.6 + seededRandom(i * 5 + 1) * 0.8) + offset) % 1;
    const ex = centerX + (seededRandom(i * 13 + 4) - 0.5) * width * 0.62 + Math.sin(progress * twoPi * 2 + i) * 36;
    const ey = baseY - cycle * height * 0.58;
    const size = 4 + seededRandom(i * 17 + 6) * 10;
    return { x: ex, y: ey, size, o: (1 - cycle) * (0.5 + seededRandom(i * 19 + 8) * 0.5) };
  });

  const candles = [
    { frac: -0.32, h: 0.2, shamash: false },
    { frac: -0.24, h: 0.23, shamash: false },
    { frac: -0.16, h: 0.26, shamash: false },
    { frac: -0.08, h: 0.28, shamash: false },
    { frac: 0, h: 0.34, shamash: true },
    { frac: 0.08, h: 0.28, shamash: false },
    { frac: 0.16, h: 0.26, shamash: false },
    { frac: 0.24, h: 0.23, shamash: false },
    { frac: 0.32, h: 0.2, shamash: false },
  ];

  const gridDots = Array.from({ length: 84 }, (_, i) => {
    const col = i % 12;
    const row = Math.floor(i / 12);
    const gx = (0.06 + col * 0.08) * width;
    const gy = (0.08 + row * 0.13) * height;
    const o = 0.04 + Math.abs(Math.sin(progress * twoPi + i * 0.45)) * 0.07;
    return { x: gx, y: gy, o };
  });

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: `linear-gradient(${gradientAngle}deg, #05082e, #0a1a5e, #123a8f, #05082e)` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 50% 68%, rgba(255, 190, 60, ${0.22 + globalPulse * 0.06}), transparent 62%)` }} />
      {gridDots.map((dot, i) => (
        <div key={i} style={{ position: "absolute", left: dot.x, top: dot.y, width: 7, height: 7, borderRadius: "50%", backgroundColor: "#7fb3ff", opacity: dot.o }} />
      ))}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {lines.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#ffd166" strokeWidth={2} strokeOpacity={line.o} />
        ))}
      </svg>
      {nodes.map((node, i) => (
        <div key={i} style={{ position: "absolute", left: node.x - 6, top: node.y - 6, width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffe08a", opacity: 0.55 + Math.sin(progress * twoPi * 2 + node.phase) * 0.25, filter: "drop-shadow(0 0 10px #ffd166)" }} />
      ))}
      {[0, 1, 2].map((i) => {
        const ringProgress = (progress + i / 3) % 1;
        return (
          <div key={i} style={{ position: "absolute", left: centerX - ringProgress * width * 0.42, top: baseY - ringProgress * width * 0.42, width: ringProgress * width * 0.84, height: ringProgress * width * 0.84, borderRadius: "50%", border: "3px solid #ffd166", opacity: (1 - ringProgress) * 0.35 }} />
        );
      })}
      <div style={{ position: "absolute", left: 0, top: scanY, width, height: 130, background: "linear-gradient(180deg, transparent, rgba(255, 220, 130, 0.16), transparent)" }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${centerX - width * 0.36} ${baseY} Q ${centerX} ${baseY + height * 0.16} ${centerX + width * 0.36} ${baseY}`} stroke="#e8b64c" strokeWidth={26} fill="none" strokeLinecap="round" />
        <path d={`M ${centerX} ${baseY + height * 0.02} L ${centerX} ${baseY + height * 0.1}`} stroke="#e8b64c" strokeWidth={26} strokeLinecap="round" />
        <rect x={centerX - width * 0.2} y={baseY + height * 0.1} width={width * 0.4} height={height * 0.025} rx={height * 0.012} fill="#d4a017" />
      </svg>
      {candles.map((candle, i) => {
        const cx = centerX + candle.frac * width;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        const flicker = Math.sin(progress * twoPi * 3 + i * 1.7);
        const flameScale = 1 + flicker * 0.08;
        const flameOpacity = 0.82 + flicker * 0.12;
        const glow = 26 + flicker * 8;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.012, top: candleTop, width: width * 0.024, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #ffffff, #dbeafe)", borderRadius: width * 0.012 }} />
            <div style={{ position: "absolute", left: cx - 2, top: candleTop - 26, width: 4, height: 26, backgroundColor: "#3a2a12" }} />
            <div style={{ position: "absolute", left: cx - 34 * flameScale, top: candleTop - 148 * flameScale, width: 68 * flameScale, height: 128 * flameScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: flameOpacity, filter: `drop-shadow(0 0 ${glow}px #ffb703)`, transform: `rotate(${flicker * 3}deg)` }} />
            <div style={{ position: "absolute", left: cx - 14, top: candleTop - 96, width: 28, height: 58, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: 0.85 }} />
          </div>
        );
      })}
      {embers.map((ember, i) => (
        <div key={i} style={{ position: "absolute", left: ember.x, top: ember.y, width: ember.size, height: ember.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: ember.o, filter: "drop-shadow(0 0 8px #ffb703)" }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: baseY + height * 0.12, width, height: height * 0.14, background: "linear-gradient(180deg, rgba(255, 190, 60, 0.22), transparent)" }} />
    </div>
  );
};
