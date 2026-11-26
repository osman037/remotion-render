import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const WindowAtDusk: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;

  // Window occupies the right 60% of the frame; left 35% stays empty copy space.
  const winX = width * 0.38;
  const winY = height * 0.08;
  const winW = width * 0.59;
  const winH = height * 0.74;
  const sillY = winY + winH;
  const frameThick = width * 0.012;
  const innerX = winX + frameThick;
  const innerY = winY + frameThick;
  const innerW = winW - frameThick * 2;
  const innerH = winH - frameThick * 2;
  const centerX = winX + winW / 2;
  const baseY = sillY;

  const skyShift = Math.sin(progress * twoPi) * 0.06;
  const warmPulse = Math.sin(progress * twoPi);
  const coolPulse = Math.cos(progress * twoPi);

  // Snow falling inside the window only, wrapping with modulo cycles (perfect loop).
  const snow = Array.from({ length: 72 }, (_, i) => {
    const offset = seededRandom(i * 11 + 2);
    const speed = 0.5 + seededRandom(i * 5 + 1) * 0.9;
    const cycle = (progress * speed + offset) % 1;
    const sx = innerX + seededRandom(i * 13 + 4) * innerW + Math.sin(progress * twoPi * 2 + i * 1.3) * 34;
    const sy = innerY + cycle * innerH;
    const size = 4 + seededRandom(i * 17 + 6) * 10;
    const o = 0.35 + seededRandom(i * 19 + 8) * 0.55;
    return { x: sx, y: sy, size, o };
  });

  // Distant city windows twinkling slowly with integer cycles.
  const cityLights = Array.from({ length: 14 }, (_, i) => {
    const lx = innerX + (0.06 + seededRandom(i * 23 + 3) * 0.88) * innerW;
    const ly = innerY + innerH * (0.58 + seededRandom(i * 29 + 7) * 0.3);
    const lw = 10 + seededRandom(i * 31 + 9) * 26;
    const lh = 14 + seededRandom(i * 37 + 11) * 30;
    const o = 0.25 + Math.abs(Math.sin(progress * twoPi * 2 + i * 1.4)) * 0.7;
    const warm = seededRandom(i * 41 + 13) > 0.4;
    return { x: lx, y: ly, w: lw, h: lh, o, warm };
  });

  // Skyline silhouette: dark rooftops along the bottom of the window.
  const buildings = Array.from({ length: 9 }, (_, i) => {
    const bw = innerW / 9;
    const bh = innerH * (0.1 + seededRandom(i * 43 + 17) * 0.16);
    return { x: innerX + i * bw, y: innerY + innerH - bh, w: bw * 0.96, h: bh };
  });

  // Subtle grain across the frame, low opacity so the copy space stays clean and dark.
  const grain = Array.from({ length: 90 }, (_, i) => {
    const gx = seededRandom(i * 47 + 19) * width;
    const gy = seededRandom(i * 53 + 23) * height;
    const size = 2 + seededRandom(i * 59 + 29) * 5;
    const o = 0.04 + Math.abs(Math.sin(progress * twoPi * 4 + i * 2.1)) * 0.1;
    const gold = seededRandom(i * 61 + 31) > 0.6;
    return { x: gx, y: gy, size, o, gold };
  });

  // Nine candles on the sill, shamash taller in the centre.
  const candles = [
    { frac: -0.2, h: 0.055, shamash: false },
    { frac: -0.15, h: 0.062, shamash: false },
    { frac: -0.1, h: 0.07, shamash: false },
    { frac: -0.05, h: 0.078, shamash: false },
    { frac: 0, h: 0.1, shamash: true },
    { frac: 0.05, h: 0.078, shamash: false },
    { frac: 0.1, h: 0.07, shamash: false },
    { frac: 0.15, h: 0.062, shamash: false },
    { frac: 0.2, h: 0.055, shamash: false },
  ];

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: `linear-gradient(${100 + skyShift * 60}deg, #04061f, #071033, #0a1a4a, #04061f)` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: width * 0.36, height, background: "linear-gradient(90deg, rgba(4, 6, 31, 0.9), rgba(7, 16, 51, 0.25) 78%, transparent)" }} />
      <div style={{ position: "absolute", left: centerX - width * 0.3 + coolPulse * 60, top: winY - height * 0.05, width: width * 0.6, height: height * 0.9, borderRadius: "50%", background: "radial-gradient(circle, rgba(110, 170, 255, 0.22), transparent 65%)" }} />
      <div style={{ position: "absolute", left: innerX, top: innerY, width: innerW, height: innerH, background: "linear-gradient(180deg, #0b1030 0%, #12224f 52%, #1c3568 78%, #0d1734 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: innerW * 0.68, top: innerH * 0.1, width: innerW * 0.14, height: innerW * 0.14, borderRadius: "50%", background: "radial-gradient(circle, rgba(240, 244, 255, 0.95) 0%, rgba(200, 215, 255, 0.55) 45%, transparent 72%)" }} />
        <div style={{ position: "absolute", left: innerW * 0.62, top: innerH * 0.05, width: innerW * 0.26, height: innerW * 0.26, borderRadius: "50%", background: "radial-gradient(circle, rgba(190, 210, 255, 0.25), transparent 65%)" }} />
        <svg style={{ position: "absolute", left: 0, top: 0, width: innerW, height: innerH }} width={innerW} height={innerH} viewBox={`0 0 ${innerW} ${innerH}`}>
          {buildings.map((b, i) => (
            <rect key={i} x={b.x - innerX} y={b.y - innerY} width={b.w} height={b.h} fill="#070d24" />
          ))}
        </svg>
        {cityLights.map((light, i) => (
          <div key={i} style={{ position: "absolute", left: light.x - innerX, top: light.y - innerY, width: light.w, height: light.h, backgroundColor: light.warm ? "#ffd166" : "#aaccff", opacity: light.o, filter: "drop-shadow(0 0 8px #ffd166)" }} />
        ))}
        {snow.map((flake, i) => (
          <div key={i} style={{ position: "absolute", left: flake.x - innerX, top: flake.y - innerY, width: flake.size, height: flake.size, borderRadius: "50%", backgroundColor: "#ffffff", opacity: flake.o }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: winX - width * 0.006, top: winY - height * 0.006, width: winW + width * 0.012, height: winH + height * 0.012, border: `${frameThick}px solid #2a1c10`, boxSizing: "border-box", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: centerX - width * 0.004, top: winY, width: width * 0.008, height: winH, backgroundColor: "#2a1c10" }} />
      <div style={{ position: "absolute", left: winX, top: winY + winH / 2 - height * 0.004, width: winW, height: height * 0.008, backgroundColor: "#2a1c10" }} />
      <div style={{ position: "absolute", left: winX - width * 0.02, top: sillY, width: winW + width * 0.04, height: height * 0.028, background: "linear-gradient(180deg, #5a3d22, #3a2716)", borderRadius: height * 0.008 }} />
      <div style={{ position: "absolute", left: centerX - width * 0.22 + warmPulse * 40, top: baseY - height * 0.34, width: width * 0.44, height: height * 0.4, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 190, 60, ${0.3 + warmPulse * 0.08}), transparent 65%)` }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${centerX - winW * 0.26} ${baseY} Q ${centerX} ${baseY + height * 0.045} ${centerX + winW * 0.26} ${baseY}`} stroke="#e8b64c" strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={`M ${centerX} ${baseY} L ${centerX} ${baseY + height * 0.028}`} stroke="#e8b64c" strokeWidth={16} strokeLinecap="round" />
        <rect x={centerX - winW * 0.14} y={baseY + height * 0.028} width={winW * 0.28} height={height * 0.01} rx={height * 0.005} fill="#d4a017" />
      </svg>
      {candles.map((candle, i) => {
        const cx = centerX + candle.frac * winW;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        const flicker = Math.sin(progress * twoPi * 4 + i * 1.7);
        const flameScale = 1 + flicker * 0.12;
        const flameOpacity = 0.82 + flicker * 0.14;
        const glow = 18 + flicker * 8;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.005, top: candleTop, width: width * 0.01, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #ffffff, #dbeafe)", borderRadius: width * 0.005 }} />
            <div style={{ position: "absolute", left: cx - 1, top: candleTop - 12, width: 2, height: 12, backgroundColor: "#3a2a12" }} />
            <div style={{ position: "absolute", left: cx - 22 * flameScale, top: candleTop - 78 * flameScale, width: 44 * flameScale, height: 66 * flameScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: flameOpacity, filter: `drop-shadow(0 0 ${glow}px #ffb703)`, transform: `rotate(${flicker * 5}deg)` }} />
            <div style={{ position: "absolute", left: cx - 8, top: candleTop - 48, width: 16, height: 32, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: 0.85 }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: winX - width * 0.02, top: sillY + height * 0.028, width: winW + width * 0.04, height: height * 0.05, background: `linear-gradient(180deg, rgba(255, 190, 60, ${0.2 + warmPulse * 0.06}), transparent)` }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
        ))}
      </svg>
    </div>
  );
};
