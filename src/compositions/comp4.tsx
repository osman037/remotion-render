import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const CandleFlameEmbers: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;
  const centerX = width / 2;
  const flameX = centerX - width * 0.03;
  const flameY = height * 0.46;
  const secondX = centerX + width * 0.22;
  const secondY = height * 0.58;
  const baseY = height * 0.86;
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
          o: Math.max(0, 1 - dist / maxDist) * 0.6,
        });
      }
    }
  }

  const embers = Array.from({ length: 95 }, (_, i) => {
    const offset = seededRandom(i * 11 + 2);
    const cycle = (progress * (0.6 + seededRandom(i * 5 + 1) * 1.2) + offset) % 1;
    const ex = flameX + (seededRandom(i * 13 + 4) - 0.5) * width * 0.72 + Math.sin(progress * twoPi * 2 + i) * 48;
    const ey = flameY - cycle * height * 0.62;
    const size = 4 + seededRandom(i * 17 + 6) * 13;
    return { x: ex, y: ey, size, o: (1 - cycle) * (0.5 + seededRandom(i * 19 + 8) * 0.5) };
  });

  const stars = Array.from({ length: 110 }, (_, i) => {
    const sx = seededRandom(i * 23 + 3) * width;
    const sy = seededRandom(i * 29 + 7) * height;
    const size = 3 + seededRandom(i * 31 + 9) * 9;
    const o = 0.25 + Math.abs(Math.sin(progress * twoPi * 3 + i * 1.1)) * 0.65;
    return { x: sx, y: sy, size, o };
  });

  const grain = Array.from({ length: 120 }, (_, i) => {
    const gx = seededRandom(i * 37 + 11) * width;
    const gy = seededRandom(i * 41 + 13) * height;
    const size = 2 + seededRandom(i * 43 + 17) * 6;
    const o = 0.12 + Math.abs(Math.sin(progress * twoPi * 6 + i * 2.3)) * 0.5;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  const smoke = Array.from({ length: 26 }, (_, i) => {
    const offset = seededRandom(i * 53 + 3);
    const cycle = (progress * (0.4 + seededRandom(i * 59 + 5) * 0.6) + offset) % 1;
    const sx = flameX + (seededRandom(i * 61 + 7) - 0.5) * width * 0.3 + Math.sin(progress * twoPi * 2 + i * 1.3) * 90;
    const sy = flameY - height * 0.14 - cycle * height * 0.42;
    const size = (60 + cycle * 260) * (width / 3840);
    const o = Math.sin(cycle * Math.PI) * 0.16;
    return { x: sx, y: sy, size, o };
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
    const x2 = flameX + Math.cos(angle) * width * 0.75;
    const y2 = flameY + Math.sin(angle) * width * 0.75;
    const x3 = flameX + Math.cos(angle + 0.06) * width * 0.75;
    const y3 = flameY + Math.sin(angle + 0.06) * width * 0.75;
    return { x2, y2, x3, y3, o: 0.05 + (i % 2) * 0.04 };
  });

  const scanLines = Array.from({ length: 8 }, (_, i) => {
    const cycle = (progress * 2 + i / 8) % 1;
    return { y: cycle * height, o: (1 - cycle) * 0.22 };
  });

  const mainFlicker = Math.sin(progress * twoPi * 6);
  const mainScale = 1 + mainFlicker * 0.1;
  const mainOpacity = 0.82 + mainFlicker * 0.14;
  const mainGlow = 46 + mainFlicker * 18;
  const secondFlicker = Math.sin(progress * twoPi * 5 + 1.9);
  const secondScale = 1 + secondFlicker * 0.11;
  const secondOpacity = 0.8 + secondFlicker * 0.15;
  const secondGlow = 30 + secondFlicker * 12;
  const mainFlameW = width * 0.13;
  const mainFlameH = height * 0.38;
  const secondFlameW = width * 0.07;
  const secondFlameH = height * 0.2;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: `linear-gradient(${gradientAngle}deg, #04061f, #0a1a5e, #123a8f, #7a2ea6, #04061f)` }}>
      <div style={{ position: "absolute", left: flameX - width * 0.4 + Math.sin(progress * twoPi) * 220, top: flameY - height * 0.35 + Math.cos(progress * twoPi) * 140, width: width * 0.8, height: height * 0.8, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 170, 40, 0.34), transparent 65%)" }} />
      <div style={{ position: "absolute", left: flameX - width * 0.3 + Math.cos(progress * twoPi * 2) * 260, top: height * 0.5 + Math.sin(progress * twoPi * 2) * 160, width: width * 0.55, height: height * 0.55, borderRadius: "50%", background: "radial-gradient(circle, rgba(80, 160, 255, 0.28), transparent 65%)" }} />
      <div style={{ position: "absolute", left: -200 + Math.sin(progress * twoPi) * 260, top: 0, width: width + 400, height, background: "repeating-linear-gradient(45deg, rgba(255, 209, 102, 0.07) 0px, rgba(255, 209, 102, 0.07) 18px, transparent 18px, transparent 54px)" }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height, transform: `rotate(${rayRotation}deg)`, transformOrigin: `${flameX}px ${flameY}px` }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {rays.map((ray, i) => (
          <polygon key={i} points={`${flameX},${flameY} ${ray.x2},${ray.y2} ${ray.x3},${ray.y3}`} fill="#ffd166" fillOpacity={ray.o} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 47% 46%, rgba(255, 190, 60, ${0.28 + globalPulse * 0.1}), transparent 60%)` }} />
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
      {[0, 1, 2, 3, 4].map((i) => {
        const ringProgress = (progress + i / 5) % 1;
        return (
          <div key={i} style={{ position: "absolute", left: flameX - ringProgress * width * 0.4, top: flameY - ringProgress * width * 0.4, width: ringProgress * width * 0.8, height: ringProgress * width * 0.8, borderRadius: "50%", border: "4px solid #ffd166", opacity: (1 - ringProgress) * 0.4 }} />
        );
      })}
      {scanLines.map((line, i) => (
        <div key={i} style={{ position: "absolute", left: 0, top: line.y, width, height: 10, backgroundColor: "#ffe08a", opacity: line.o }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: scanY, width, height: 160, background: "linear-gradient(180deg, transparent, rgba(255, 220, 130, 0.22), transparent)" }} />
      {smoke.map((puff, i) => (
        <div key={i} style={{ position: "absolute", left: puff.x - puff.size / 2, top: puff.y - puff.size / 2, width: puff.size, height: puff.size, borderRadius: "50%", backgroundColor: "#9db8e8", opacity: puff.o, filter: "blur(6px)" }} />
      ))}
      <div style={{ position: "absolute", left: flameX - width * 0.085, top: baseY - height * 0.4, width: width * 0.17, height: height * 0.46, background: "linear-gradient(180deg, #fff8e6, #f5d76e 30%, #e8b64c 75%, #b8860b)", borderRadius: `${width * 0.02}px ${width * 0.02}px 0 0` }} />
      <div style={{ position: "absolute", left: flameX - width * 0.02, top: baseY - height * 0.4, width: width * 0.04, height: height * 0.46, background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)", borderRadius: width * 0.02 }} />
      <div style={{ position: "absolute", left: secondX - width * 0.045, top: baseY - height * 0.22, width: width * 0.09, height: height * 0.28, background: "linear-gradient(180deg, #ffffff, #dbeafe 40%, #c9a227)", borderRadius: `${width * 0.012}px ${width * 0.012}px 0 0` }} />
      <div style={{ position: "absolute", left: flameX - 3, top: baseY - height * 0.4 - 42, width: 6, height: 42, backgroundColor: "#3a2a12" }} />
      <div style={{ position: "absolute", left: secondX - 2, top: baseY - height * 0.22 - 30, width: 4, height: 30, backgroundColor: "#3a2a12" }} />
      <div style={{ position: "absolute", left: flameX - (mainFlameW / 2) * mainScale, top: flameY - mainFlameH * mainScale, width: mainFlameW * mainScale, height: mainFlameH * mainScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 74%, #fffbe6 0%, #ffd166 36%, #ff9d00 66%, #ff5e00 100%)", opacity: mainOpacity, filter: `drop-shadow(0 0 ${mainGlow}px #ffb703)`, transform: `rotate(${mainFlicker * 4}deg)` }} />
      <div style={{ position: "absolute", left: flameX - (mainFlameW * 0.28) * mainScale, top: flameY - mainFlameH * 0.62 * mainScale, width: mainFlameW * 0.56 * mainScale, height: mainFlameH * 0.62 * mainScale, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: 0.88 }} />
      <div style={{ position: "absolute", left: secondX - (secondFlameW / 2) * secondScale, top: secondY - secondFlameH * secondScale, width: secondFlameW * secondScale, height: secondFlameH * secondScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 74%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: secondOpacity, filter: `drop-shadow(0 0 ${secondGlow}px #ffb703)`, transform: `rotate(${secondFlicker * 4}deg)` }} />
      <div style={{ position: "absolute", left: secondX - secondFlameW * 0.15, top: secondY - secondFlameH * 0.6, width: secondFlameW * 0.3, height: secondFlameH * 0.6, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: 0.85 }} />
      {embers.map((ember, i) => (
        <div key={i} style={{ position: "absolute", left: ember.x, top: ember.y, width: ember.size, height: ember.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: ember.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: baseY, width, height: height * 0.14, background: "linear-gradient(180deg, rgba(255, 190, 60, 0.28), transparent)" }} />
    </div>
  );
};
