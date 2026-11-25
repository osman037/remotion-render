import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const BlueGoldBokehNight: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;
  const centerX = width / 2;
  const baseY = height * 0.82;
  const gradientAngle = progress * 360;
  const globalPulse = Math.sin(progress * twoPi);
  const scanY = height * 0.5 + Math.sin(progress * twoPi) * height * 0.42;
  const rayRotation = progress * 360;

  const nodes = Array.from({ length: 42 }, (_, i) => {
    const nx = (0.03 + seededRandom(i * 3 + 1) * 0.94) * width;
    const ny = (0.04 + seededRandom(i * 3 + 2) * 0.88) * height;
    const speed = 0.5 + seededRandom(i * 3 + 3) * 1.5;
    const phase = seededRandom(i * 7 + 5) * twoPi;
    const x = nx + Math.sin(progress * twoPi * speed + phase) * 70;
    const y = ny + Math.cos(progress * twoPi * speed + phase) * 52;
    return { x, y, phase };
  });

  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; o: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = width * 0.2;
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

  const bokeh = Array.from({ length: 92 }, (_, i) => {
    const offset = seededRandom(i * 11 + 2);
    const speed = 0.5 + seededRandom(i * 5 + 1) * 1.1;
    const cycle = (progress * speed + offset) % 1;
    const bx = (0.02 + seededRandom(i * 13 + 4) * 0.96) * width + Math.sin(progress * twoPi * 2 + i) * 52;
    const by = height * 0.98 - cycle * height * 0.92;
    const size = width * (0.008 + seededRandom(i * 17 + 6) * 0.038);
    const gold = seededRandom(i * 19 + 8) > 0.35;
    const o = (0.25 + Math.sin(cycle * Math.PI) * 0.55) * (0.6 + seededRandom(i * 23 + 10) * 0.4);
    return { x: bx, y: by, size, o, gold };
  });

  const largeOrbs = Array.from({ length: 10 }, (_, i) => {
    const ox = centerX + Math.sin(progress * twoPi * (0.5 + (i % 3) * 0.5) + i * 1.3) * width * 0.32;
    const oy = height * (0.18 + seededRandom(i * 29 + 12) * 0.55) + Math.cos(progress * twoPi + i * 1.7) * height * 0.08;
    const size = width * (0.1 + seededRandom(i * 31 + 14) * 0.12);
    const o = 0.14 + Math.abs(Math.sin(progress * twoPi * 2 + i)) * 0.14;
    return { x: ox, y: oy, size, o };
  });

  const stars = Array.from({ length: 112 }, (_, i) => {
    const sx = seededRandom(i * 23 + 3) * width;
    const sy = seededRandom(i * 29 + 7) * height * 0.72;
    const size = 2 + seededRandom(i * 31 + 9) * 8;
    const o = 0.25 + Math.abs(Math.sin(progress * twoPi * 3 + i * 1.1)) * 0.65;
    return { x: sx, y: sy, size, o };
  });

  const grain = Array.from({ length: 124 }, (_, i) => {
    const gx = seededRandom(i * 37 + 11) * width;
    const gy = seededRandom(i * 41 + 13) * height;
    const size = 2 + seededRandom(i * 43 + 17) * 6;
    const o = 0.12 + Math.abs(Math.sin(progress * twoPi * 6 + i * 2.3)) * 0.5;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  const gridDots = Array.from({ length: 84 }, (_, i) => {
    const col = i % 12;
    const row = Math.floor(i / 12);
    const gx = (0.06 + col * 0.08) * width;
    const gy = (0.08 + row * 0.13) * height;
    const o = 0.05 + Math.abs(Math.sin(progress * twoPi * 2 + i * 0.45)) * 0.09;
    return { x: gx, y: gy, o };
  });

  const rays = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * twoPi;
    const x2 = centerX + Math.cos(angle) * width * 0.75;
    const y2 = baseY + Math.sin(angle) * width * 0.75;
    const x3 = centerX + Math.cos(angle + 0.06) * width * 0.75;
    const y3 = baseY + Math.sin(angle + 0.06) * width * 0.75;
    return { x2, y2, x3, y3, o: 0.04 + (i % 2) * 0.035 };
  });

  const scanLines = Array.from({ length: 8 }, (_, i) => {
    const cycle = (progress * 2 + i / 8) % 1;
    return { y: cycle * height, o: (1 - cycle) * 0.2 };
  });

  const silhouetteTips = Array.from({ length: 9 }, (_, i) => {
    const frac = -0.32 + i * 0.08;
    const tx = centerX + frac * width;
    const arc = Math.abs(frac) * height * 0.22;
    const ty = baseY - height * 0.1 - (height * 0.12 - arc);
    const flicker = Math.sin(progress * twoPi * 4 + i * 1.7);
    return { x: tx, y: ty, o: 0.55 + flicker * 0.2, glow: 22 + flicker * 8 };
  });

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: `linear-gradient(${gradientAngle}deg, #03061f, #081a4d, #0e2f7a, #123a8f, #03061f)` }}>
      <div style={{ position: "absolute", left: centerX - width * 0.55 + Math.sin(progress * twoPi) * 220, top: height * 0.1 + Math.cos(progress * twoPi) * 140, width: width * 0.7, height: height * 0.7, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 190, 60, 0.26), transparent 65%)" }} />
      <div style={{ position: "absolute", left: centerX - width * 0.4 + Math.cos(progress * twoPi * 2) * 260, top: height * 0.4 + Math.sin(progress * twoPi * 2) * 160, width: width * 0.55, height: height * 0.55, borderRadius: "50%", background: "radial-gradient(circle, rgba(80, 160, 255, 0.26), transparent 65%)" }} />
      <div style={{ position: "absolute", left: -200 + Math.sin(progress * twoPi) * 260, top: 0, width: width + 400, height, background: "repeating-linear-gradient(45deg, rgba(255, 209, 102, 0.06) 0px, rgba(255, 209, 102, 0.06) 18px, transparent 18px, transparent 54px)" }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height, transform: `rotate(${rayRotation}deg)`, transformOrigin: `${centerX}px ${baseY}px` }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {rays.map((ray, i) => (
          <polygon key={i} points={`${centerX},${baseY} ${ray.x2},${ray.y2} ${ray.x3},${ray.y3}`} fill="#ffd166" fillOpacity={ray.o} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 50% 72%, rgba(255, 190, 60, ${0.22 + globalPulse * 0.08}), transparent 62%)` }} />
      {gridDots.map((dot, i) => (
        <div key={i} style={{ position: "absolute", left: dot.x, top: dot.y, width: 8, height: 8, borderRadius: "50%", backgroundColor: "#7fb3ff", opacity: dot.o }} />
      ))}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.size} fill="#ffffff" fillOpacity={star.o} />
        ))}
      </svg>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
        ))}
      </svg>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {lines.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#ffd166" strokeWidth={3} strokeOpacity={line.o} />
        ))}
      </svg>
      {nodes.map((node, i) => (
        <div key={i} style={{ position: "absolute", left: node.x - 7, top: node.y - 7, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#ffe08a", opacity: 0.55 + Math.sin(progress * twoPi * 2 + node.phase) * 0.3, filter: "drop-shadow(0 0 12px #ffd166)" }} />
      ))}
      {largeOrbs.map((orb, i) => (
        <div key={i} style={{ position: "absolute", left: orb.x - orb.size / 2, top: orb.y - orb.size / 2, width: orb.size, height: orb.size, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 214, 120, 0.55) 0%, rgba(255, 190, 60, 0.22) 45%, transparent 70%)", opacity: orb.o, filter: "drop-shadow(0 0 28px #ffd166)" }} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const ringProgress = (progress + i / 5) % 1;
        return (
          <div key={i} style={{ position: "absolute", left: centerX - ringProgress * width * 0.42, top: baseY - ringProgress * width * 0.42, width: ringProgress * width * 0.84, height: ringProgress * width * 0.84, borderRadius: "50%", border: "4px solid #ffd166", opacity: (1 - ringProgress) * 0.35 }} />
        );
      })}
      {scanLines.map((line, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: line.y, width, height: 10, backgroundColor: "#ffe08a", opacity: line.o }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: scanY, width, height: 170, background: "linear-gradient(180deg, transparent, rgba(255, 220, 130, 0.2), transparent)" }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${centerX - width * 0.36} ${baseY - height * 0.1} Q ${centerX} ${baseY + height * 0.06} ${centerX + width * 0.36} ${baseY - height * 0.1}`} stroke="#02061a" strokeWidth={34} fill="none" strokeLinecap="round" />
        <path d={`M ${centerX} ${baseY - height * 0.06} L ${centerX} ${baseY + height * 0.04}`} stroke="#02061a" strokeWidth={34} strokeLinecap="round" />
        <rect x={centerX - width * 0.2} y={baseY + height * 0.04} width={width * 0.4} height={height * 0.025} rx={height * 0.012} fill="#02061a" />
        <path d={`M ${centerX - width * 0.36} ${baseY - height * 0.1} Q ${centerX} ${baseY + height * 0.06} ${centerX + width * 0.36} ${baseY - height * 0.1}`} stroke="#ffd166" strokeWidth={4} fill="none" strokeLinecap="round" strokeOpacity={0.5} />
      </svg>
      {silhouetteTips.map((tip, i) => (
        <div key={i} style={{ position: "absolute", left: tip.x - 18, top: tip.y - 18, width: 36, height: 36, borderRadius: "50%", background: "radial-gradient(circle, #fffbe6 0%, #ffd166 45%, transparent 72%)", opacity: tip.o, filter: `drop-shadow(0 0 ${tip.glow}px #ffb703)` }} />
      ))}
      {bokeh.map((orb, i) => (
        <div key={i} style={{ position: "absolute", left: orb.x - orb.size / 2, top: orb.y - orb.size / 2, width: orb.size, height: orb.size, borderRadius: "50%", background: orb.gold ? "radial-gradient(circle, rgba(255, 240, 190, 0.9) 0%, rgba(255, 190, 60, 0.45) 45%, transparent 72%)" : "radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(160, 200, 255, 0.4) 45%, transparent 72%)", opacity: orb.o, filter: "drop-shadow(0 0 12px #ffd166)" }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: baseY + height * 0.06, width, height: height * 0.12, background: "linear-gradient(180deg, rgba(255, 190, 60, 0.2), transparent)" }} />
    </div>
  );
};
