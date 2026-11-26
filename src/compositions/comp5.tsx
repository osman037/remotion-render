import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const HolidayTableTopDown: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;
  const centerX = width / 2;
  const centerY = height / 2;

  // Very slow camera drift, one full sin/cos cycle over the whole clip (perfect loop).
  const driftX = Math.sin(progress * twoPi) * width * 0.012;
  const driftY = Math.cos(progress * twoPi) * height * 0.014;
  const driftScale = 1.06 + Math.sin(progress * twoPi) * 0.006;
  const lightX = 0.28 + Math.sin(progress * twoPi) * 0.03;
  const lightY = 0.22 + Math.cos(progress * twoPi) * 0.03;
  const glowPulse = 0.5 + Math.sin(progress * twoPi) * 0.12;

  const donuts = [
    { fx: 0.3, fy: 0.34, r: 0.105, jam: true, jamColor: "#c2274b" },
    { fx: 0.52, fy: 0.28, r: 0.095, jam: false, jamColor: "#c2274b" },
    { fx: 0.7, fy: 0.42, r: 0.11, jam: true, jamColor: "#8f1d3a" },
    { fx: 0.38, fy: 0.62, r: 0.1, jam: true, jamColor: "#d43d5e" },
    { fx: 0.62, fy: 0.68, r: 0.09, jam: false, jamColor: "#c2274b" },
  ];

  const coins = [
    { fx: 0.16, fy: 0.22, r: 0.032 },
    { fx: 0.24, fy: 0.55, r: 0.028 },
    { fx: 0.2, fy: 0.8, r: 0.034 },
    { fx: 0.44, fy: 0.12, r: 0.026 },
    { fx: 0.58, fy: 0.48, r: 0.03 },
    { fx: 0.82, fy: 0.24, r: 0.032 },
    { fx: 0.84, fy: 0.62, r: 0.028 },
    { fx: 0.78, fy: 0.84, r: 0.034 },
    { fx: 0.5, fy: 0.86, r: 0.027 },
    { fx: 0.1, fy: 0.42, r: 0.024 },
  ];

  const sugar = Array.from({ length: 90 }, (_, i) => {
    const d = donuts[i % donuts.length];
    const ang = seededRandom(i * 7 + 1) * twoPi;
    const dist = seededRandom(i * 7 + 2) * 0.82;
    const sx = (d.fx + Math.cos(ang) * dist * d.r * (width / height)) * width;
    const sy = (d.fy + Math.sin(ang) * dist * d.r) * height;
    const size = 2 + seededRandom(i * 7 + 3) * 5;
    const tw = 0.35 + Math.abs(Math.sin(progress * twoPi * 3 + i * 1.3)) * 0.6;
    return { x: sx, y: sy, size, o: tw };
  });

  const steam = Array.from({ length: 10 }, (_, i) => {
    const d = donuts[i % donuts.length];
    const offset = seededRandom(i * 11 + 2);
    const cycle = (progress * 1 + offset) % 1;
    const baseX = d.fx * width + (seededRandom(i * 13 + 4) - 0.5) * d.r * width * 1.2;
    const x = baseX + Math.sin(progress * twoPi * 2 + i * 1.7) * 26;
    const y = d.fy * height - cycle * height * 0.16;
    const size = 26 + seededRandom(i * 17 + 6) * 34 + cycle * 30;
    const o = Math.sin(cycle * Math.PI) * 0.34;
    return { x, y, size, o };
  });

  const sparkles = Array.from({ length: 70 }, (_, i) => {
    const sx = seededRandom(i * 23 + 3) * width;
    const sy = seededRandom(i * 29 + 7) * height;
    const size = 2 + seededRandom(i * 31 + 9) * 6;
    const o = 0.15 + Math.abs(Math.sin(progress * twoPi * 4 + i * 1.1)) * 0.65;
    return { x: sx, y: sy, size, o };
  });

  const grain = Array.from({ length: 120 }, (_, i) => {
    const gx = seededRandom(i * 37 + 11) * width;
    const gy = seededRandom(i * 41 + 13) * height;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.08 + Math.abs(Math.sin(progress * twoPi * 5 + i * 2.3)) * 0.35;
    const gold = seededRandom(i * 47 + 19) > 0.6;
    return { x: gx, y: gy, size, o, gold };
  });

  const weave = Array.from({ length: 96 }, (_, i) => {
    const col = i % 16;
    const row = Math.floor(i / 16);
    const gx = (0.03 + col * 0.061) * width;
    const gy = (0.04 + row * 0.16) * height;
    const o = 0.04 + Math.abs(Math.sin(progress * twoPi + i * 0.4)) * 0.05;
    return { x: gx, y: gy, o };
  });

  const crumbs = Array.from({ length: 24 }, (_, i) => {
    const cx = seededRandom(i * 53 + 5) * width;
    const cy = seededRandom(i * 59 + 8) * height;
    const size = 4 + seededRandom(i * 61 + 10) * 8;
    return { x: cx, y: cy, size };
  });

  const dreidelX = 0.86 * width;
  const dreidelY = 0.42 * height;
  const dreidelRot = progress * 360;
  const greeneryX = 0.14 * width;
  const greeneryY = 0.66 * height;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: "#0a1a4a" }}>
      <div style={{ position: "absolute", left: driftX, top: driftY, width: width * 1.08, height: height * 1.08, transform: `scale(${driftScale})`, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", left: -width * 0.04, top: -height * 0.04, width: width * 1.08, height: height * 1.08, background: `linear-gradient(${progress * 360}deg, #081238, #0a1a4a, #102a6b, #0a1a4a, #081238)` }} />
        <div style={{ position: "absolute", left: -width * 0.04, top: -height * 0.04, width: width * 1.08, height: height * 1.08, background: `radial-gradient(circle at ${lightX * 100}% ${lightY * 100}%, rgba(255, 196, 90, ${0.22 + glowPulse * 0.12}), transparent 55%)` }} />
        <div style={{ position: "absolute", left: -width * 0.04, top: -height * 0.04, width: width * 1.08, height: height * 1.08, background: "repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0px, rgba(255, 255, 255, 0.025) 3px, transparent 3px, transparent 14px)" }} />
        {weave.map((dot, i) => (
          <div key={i} style={{ position: "absolute", left: dot.x, top: dot.y, width: 7, height: 7, borderRadius: "50%", backgroundColor: "#8fb0ff", opacity: dot.o }} />
        ))}
        <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {grain.map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
          ))}
        </svg>
        {crumbs.map((crumb, i) => (
          <div key={i} style={{ position: "absolute", left: crumb.x, top: crumb.y, width: crumb.size, height: crumb.size, borderRadius: "50%", backgroundColor: "#d9a05b", opacity: 0.75 }} />
        ))}
        {donuts.map((donut, i) => {
          const dx = donut.fx * width;
          const dy = donut.fy * height;
          const r = donut.r * width;
          const breathe = 1 + Math.sin(progress * twoPi + i * 1.4) * 0.012;
          return (
            <div key={i} style={{ position: "absolute", left: dx, top: dy, transform: `scale(${breathe})`, transformOrigin: "0px 0px" }}>
              <div style={{ position: "absolute", left: -r + width * 0.012, top: -r * 0.72 + height * 0.014, width: r * 2, height: r * 1.44, borderRadius: "50%", backgroundColor: "rgba(0, 0, 0, 0.45)", filter: "blur(18px)" }} />
              <div style={{ position: "absolute", left: -r, top: -r * 0.72, width: r * 2, height: r * 1.44, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%, #e8b25e 0%, #c98a2e 45%, #8a5a16 78%, #6b4210 100%)" }} />
              <div style={{ position: "absolute", left: -r * 0.82, top: -r * 0.6, width: r * 1.64, height: r * 1.1, borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, rgba(255, 236, 180, 0.55), transparent 55%)" }} />
              <div style={{ position: "absolute", left: -r * 0.34, top: -r * 0.26, width: r * 0.68, height: r * 0.5, borderRadius: "50%", background: donut.jam ? donut.jamColor : "#a06a20", opacity: donut.jam ? 0.95 : 0.55 }} />
              <div style={{ position: "absolute", left: -r * 0.2, top: -r * 0.16, width: r * 0.4, height: r * 0.28, borderRadius: "50%", background: donut.jam ? "#e85d7a" : "#c98a2e", opacity: donut.jam ? 0.9 : 0.4 }} />
            </div>
          );
        })}
        <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {sugar.map((dot, i) => (
            <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill="#ffffff" fillOpacity={dot.o} />
          ))}
        </svg>
        <div style={{ position: "absolute", left: greeneryX, top: greeneryY, transform: `rotate(${Math.sin(progress * twoPi) * 4}deg)`, transformOrigin: "0px 0px" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: width * 0.16, height: height * 0.012, backgroundColor: "#2e6b34", borderRadius: height * 0.006, transform: "rotate(18deg)", transformOrigin: "0px 0px" }} />
          {[0, 1, 2, 3, 4].map((leaf, i) => (
            <div key={i} style={{ position: "absolute", left: width * 0.02 + i * width * 0.026, top: -height * 0.028 + (i % 2) * height * 0.03, width: width * 0.036, height: height * 0.032, borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%", backgroundColor: i % 2 === 0 ? "#3f8f46" : "#2e6b34", transform: `rotate(${-28 + i * 14}deg)` }} />
          ))}
        </div>
        {coins.map((coin, i) => {
          const cx = coin.fx * width;
          const cy = coin.fy * height;
          const r = coin.r * width;
          const glint = 0.55 + Math.abs(Math.sin(progress * twoPi * 2 + i * 1.5)) * 0.45;
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: cx - r + 6, top: cy - r * 0.7 + 8, width: r * 2, height: r * 1.4, borderRadius: "50%", backgroundColor: "rgba(0, 0, 0, 0.4)", filter: "blur(10px)" }} />
              <div style={{ position: "absolute", left: cx - r, top: cy - r * 0.7, width: r * 2, height: r * 1.4, borderRadius: "50%", background: "radial-gradient(circle at 38% 30%, #ffe9a3 0%, #f5c542 45%, #c9930f 80%, #9a6d05 100%)", opacity: glint }} />
              <svg style={{ position: "absolute", left: cx - r * 0.5, top: cy - r * 0.35, width: r, height: r * 0.7 }} width={r} height={r * 0.7} viewBox="0 0 100 70">
                <polygon points="50,2 60,26 86,26 65,42 73,66 50,50 27,66 35,42 14,26 40,26" fill="#8a6100" fillOpacity={0.55} />
              </svg>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: dreidelX, top: dreidelY, transform: `rotate(${dreidelRot}deg)`, transformOrigin: "0px 0px" }}>
          <div style={{ position: "absolute", left: -width * 0.038 + 8, top: -height * 0.032 + 10, width: width * 0.076, height: height * 0.064, backgroundColor: "rgba(0, 0, 0, 0.45)", filter: "blur(12px)" }} />
          <div style={{ position: "absolute", left: -width * 0.038, top: -height * 0.032, width: width * 0.076, height: height * 0.064, background: "linear-gradient(135deg, #ffe9a3, #e8b64c, #b8860b)", borderRadius: width * 0.008 }} />
          <div style={{ position: "absolute", left: -width * 0.008, top: -height * 0.062, width: width * 0.016, height: height * 0.032, backgroundColor: "#d4a017", borderRadius: width * 0.008 }} />
          <div style={{ position: "absolute", left: -width * 0.012, top: -height * 0.014, width: width * 0.024, height: height * 0.028, borderRadius: "50%", backgroundColor: "#8a6100", opacity: 0.7 }} />
        </div>
        {steam.map((wisp, i) => (
          <div key={i} style={{ position: "absolute", left: wisp.x - wisp.size / 2, top: wisp.y - wisp.size / 2, width: wisp.size, height: wisp.size, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 255, 255, 0.85), transparent 65%)", opacity: wisp.o, filter: "blur(6px)" }} />
        ))}
        <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {sparkles.map((star, i) => (
            <circle key={i} cx={star.x} cy={star.y} r={star.size} fill="#fff7d6" fillOpacity={star.o} />
          ))}
        </svg>
        <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at ${lightX * 100}% ${lightY * 100}%, rgba(255, 210, 110, ${0.14 + glowPulse * 0.06}), transparent 60%)` }} />
        <div style={{ position: "absolute", left: centerX - width * 0.45, top: centerY - height * 0.45, width: width * 0.9, height: height * 0.9, borderRadius: "50%", border: "3px solid rgba(255, 209, 102, 0.1)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: "linear-gradient(180deg, rgba(4, 8, 32, 0.25), transparent 20%, transparent 80%, rgba(4, 8, 32, 0.3))" }} />
    </div>
  );
};
