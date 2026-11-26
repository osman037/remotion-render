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
  const driftScale = 1 + 0.015 * (1 - Math.cos(progress * twoPi));
  const moonPulse = 0.82 + 0.18 * Math.sin(progress * twoPi * 2);
  const nightGlowA = 0.35 + 0.3 * Math.sin(progress * twoPi);
  const nightGlowB = 0.35 - 0.3 * Math.sin(progress * twoPi);
  const curtainSway = Math.sin(progress * twoPi) * 8;
  const shimmerX = Math.sin(progress * twoPi * 2) * innerW * 0.12;
  const moonWashX = Math.sin(progress * twoPi) * width * 0.03;

  // 90 twinkling stars inside the window sky only, integer cycles.
  const stars = Array.from({ length: 90 }, (_, i) => {
    const sx = innerX + (0.04 + seededRandom(i * 67 + 5) * 0.9) * innerW;
    const sy = innerY + (0.03 + seededRandom(i * 71 + 9) * 0.42) * innerH;
    const size = 3 + seededRandom(i * 73 + 13) * 7;
    const o = 0.15 + Math.abs(Math.sin(progress * twoPi * 3 + i * 1.9)) * 0.8;
    const cross = seededRandom(i * 131 + 3) > 0.7;
    return { x: sx, y: sy, size, o, cross };
  });

  // Fine wood grain streaks on the frame and sill, opacity breathing slowly.
  const woodLines = Array.from({ length: 70 }, (_, i) => {
    const onSill = seededRandom(i * 79 + 17) > 0.45;
    const wx = onSill
      ? winX - width * 0.02 + seededRandom(i * 83 + 19) * (winW + width * 0.04)
      : (seededRandom(i * 89 + 23) > 0.5 ? winX : winX + winW - frameThick) + seededRandom(i * 97 + 29) * frameThick;
    const wy = onSill
      ? sillY + seededRandom(i * 101 + 31) * height * 0.026
      : winY + seededRandom(i * 103 + 37) * winH;
    const ww = onSill ? 60 + seededRandom(i * 107 + 41) * 260 : 3 + seededRandom(i * 109 + 43) * 5;
    const wh = onSill ? 2 + seededRandom(i * 113 + 47) * 3 : 40 + seededRandom(i * 127 + 53) * 180;
    const o = 0.08 + Math.abs(Math.sin(progress * twoPi * 2 + i * 1.1)) * 0.16;
    return { x: wx, y: wy, w: ww, h: wh, o };
  });

  // 220 snowflakes falling inside the window only, wrapping with modulo cycles (perfect loop).
  const snow = Array.from({ length: 220 }, (_, i) => {
    const offset = seededRandom(i * 11 + 2);
    const speed = 0.5 + seededRandom(i * 5 + 1) * 0.9;
    const cycle = (progress * speed + offset) % 1;
    const sx = innerX + seededRandom(i * 13 + 4) * innerW + Math.sin(progress * twoPi * 2 + i * 1.3) * 34;
    const sy = innerY + cycle * innerH;
    const size = 4 + seededRandom(i * 17 + 6) * 10;
    const o = 0.35 + seededRandom(i * 19 + 8) * 0.55;
    const flake = seededRandom(i * 137 + 7) > 0.75;
    return { x: sx, y: sy, size, o, flake };
  });

  // 45 tiny ice crystals frosted on the glass, sparkling slowly with integer cycles.
  const iceCrystals = Array.from({ length: 45 }, (_, i) => {
    const ix = innerX + (0.05 + seededRandom(i * 139 + 11) * 0.9) * innerW;
    const iy = innerY + (0.05 + seededRandom(i * 149 + 15) * 0.85) * innerH;
    const size = 5 + seededRandom(i * 151 + 21) * 9;
    const o = 0.2 + Math.abs(Math.sin(progress * twoPi * 2 + i * 1.6)) * 0.55;
    const rot = seededRandom(i * 157 + 25) * 90;
    return { x: ix, y: iy, size, o, rot };
  });

  // 14 slow rain streaks running down the panes, modulo cycles (perfect loop).
  const rainStreaks = Array.from({ length: 14 }, (_, i) => {
    const offset = seededRandom(i * 163 + 29);
    const speed = 0.3 + seededRandom(i * 167 + 33) * 0.35;
    const cycle = (progress * speed + offset) % 1;
    const rx = innerX + (0.06 + seededRandom(i * 173 + 37) * 0.88) * innerW;
    const ry = innerY + cycle * innerH * 0.9;
    const len = 70 + seededRandom(i * 179 + 41) * 160;
    const o = 0.12 + seededRandom(i * 181 + 43) * 0.22;
    return { x: rx, y: ry, len, o };
  });

  // 44 distant city windows twinkling slowly with integer cycles.
  const cityLights = Array.from({ length: 44 }, (_, i) => {
    const lx = innerX + (0.06 + seededRandom(i * 23 + 3) * 0.88) * innerW;
    const ly = innerY + innerH * (0.58 + seededRandom(i * 29 + 7) * 0.3);
    const lw = 10 + seededRandom(i * 31 + 9) * 26;
    const lh = 14 + seededRandom(i * 37 + 11) * 30;
    const o = 0.25 + Math.abs(Math.sin(progress * twoPi * 2 + i * 1.4)) * 0.7;
    const warm = seededRandom(i * 41 + 13) > 0.4;
    return { x: lx, y: ly, w: lw, h: lh, o, warm };
  });

  // Far skyline layer: lighter blue-grey rooftops behind the near ones.
  const farBuildings = Array.from({ length: 7 }, (_, i) => {
    const bw = innerW / 7;
    const bh = innerH * (0.08 + seededRandom(i * 191 + 47) * 0.12);
    return { x: innerX + i * bw, y: innerY + innerH - bh, w: bw * 0.97, h: bh };
  });

  // Skyline silhouette: dark rooftops along the bottom of the window.
  const buildings = Array.from({ length: 11 }, (_, i) => {
    const bw = innerW / 11;
    const bh = innerH * (0.1 + seededRandom(i * 43 + 17) * 0.16);
    return { x: innerX + i * bw, y: innerY + innerH - bh, w: bw * 0.96, h: bh };
  });

  // Lit windows set into the near rooftops, twinkling with integer cycles.
  const rooftopWindows = Array.from({ length: 34 }, (_, i) => {
    const b = buildings[Math.floor(seededRandom(i * 197 + 51) * buildings.length)];
    const wx = b.x + 8 + seededRandom(i * 199 + 53) * (b.w - 22);
    const wy = b.y + 10 + seededRandom(i * 211 + 59) * (b.h - 30);
    const o = 0.3 + Math.abs(Math.sin(progress * twoPi * 2 + i * 1.8)) * 0.65;
    const warm = seededRandom(i * 223 + 61) > 0.35;
    return { x: wx, y: wy, o, warm };
  });

  // Snow mounds piled on the sill and the bottom window ledge.
  const snowMounds = Array.from({ length: 14 }, (_, i) => {
    const mx = winX - width * 0.015 + seededRandom(i * 227 + 67) * (winW + width * 0.03);
    const mr = 26 + seededRandom(i * 229 + 71) * 60;
    const o = 0.75 + Math.abs(Math.sin(progress * twoPi + i * 0.9)) * 0.2;
    return { x: mx, r: mr, o };
  });

  // Dense animated grain across the frame: positions drift every frame,
  // low opacity so the copy space stays clean and dark (grain only, no snow/stars there).
  const grain = Array.from({ length: 260 }, (_, i) => {
    const baseX = seededRandom(i * 47 + 19) * width;
    const baseY = seededRandom(i * 53 + 23) * height;
    const gx = baseX + Math.sin(progress * twoPi * 3 + i * 1.7) * 34;
    const gy = baseY + Math.cos(progress * twoPi * 2 + i * 2.3) * 26;
    const size = 2 + seededRandom(i * 59 + 29) * 5;
    const o = 0.04 + Math.abs(Math.sin(progress * twoPi * 4 + i * 2.1)) * 0.12;
    const gold = seededRandom(i * 61 + 31) > 0.6;
    return { x: gx, y: gy, size, o, gold };
  });

  // Patterned curtain at the window's left edge: vertical velvet folds plus a
  // fine diamond weave, swaying very slowly with an integer cycle.
  const curtainFolds = Array.from({ length: 9 }, (_, i) => {
    const fx = winX + (i / 8) * winW * 0.075;
    return { x: fx };
  });
  const curtainDiamonds = Array.from({ length: 48 }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const dx = winX + 6 + col * (winW * 0.075 / 4) + (row % 2) * 10;
    const dy = winY + 24 + row * (winH / 12);
    const o = 0.25 + Math.abs(Math.sin(progress * twoPi + i * 0.7)) * 0.3;
    return { x: dx, y: dy, o };
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
    <div style={{ width, height, position: "relative", overflow: "hidden", transform: `scale(${driftScale})`, transformOrigin: "50% 50%", background: `linear-gradient(${100 + skyShift * 60}deg, #04061f, #071033, #0a1a4a, #04061f)` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: width * 0.36, height, background: "linear-gradient(90deg, rgba(4, 6, 31, 0.9), rgba(7, 16, 51, 0.25) 78%, transparent)" }} />
      <div style={{ position: "absolute", left: centerX - width * 0.3 + coolPulse * 60, top: winY - height * 0.05, width: width * 0.6, height: height * 0.9, borderRadius: "50%", background: "radial-gradient(circle, rgba(110, 170, 255, 0.22), transparent 65%)" }} />
      <div style={{ position: "absolute", left: innerX, top: innerY, width: innerW, height: innerH, background: "linear-gradient(180deg, #0b1030 0%, #12224f 52%, #1c3568 78%, #0d1734 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: innerW, height: innerH, background: "linear-gradient(180deg, rgba(20, 40, 90, 0.5), rgba(60, 30, 90, 0.2) 60%, transparent)", opacity: nightGlowA }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: innerW, height: innerH, background: "linear-gradient(0deg, rgba(90, 60, 140, 0.4), transparent 55%)", opacity: nightGlowB }} />
        <div style={{ position: "absolute", left: innerW * 0.68, top: innerH * 0.1, width: innerW * 0.14, height: innerW * 0.14, borderRadius: "50%", background: "radial-gradient(circle, rgba(240, 244, 255, 0.95) 0%, rgba(200, 215, 255, 0.55) 45%, transparent 72%)" }} />
        <div style={{ position: "absolute", left: innerW * 0.62, top: innerH * 0.05, width: innerW * 0.26, height: innerW * 0.26, borderRadius: "50%", background: "radial-gradient(circle, rgba(190, 210, 255, 0.25), transparent 65%)", opacity: moonPulse }} />
        <div style={{ position: "absolute", left: innerW * 0.55, top: innerH * 0.02, width: innerW * 0.4, height: innerW * 0.4, borderRadius: "50%", background: "radial-gradient(circle, rgba(170, 200, 255, 0.14), transparent 68%)", opacity: 0.6 + moonPulse * 0.3 }} />
        <div style={{ position: "absolute", left: innerW * 0.715, top: innerH * 0.135, width: innerW * 0.02, height: innerW * 0.02, borderRadius: "50%", backgroundColor: "rgba(160, 175, 210, 0.5)" }} />
        <div style={{ position: "absolute", left: innerW * 0.755, top: innerH * 0.17, width: innerW * 0.013, height: innerW * 0.013, borderRadius: "50%", backgroundColor: "rgba(160, 175, 210, 0.45)" }} />
        <div style={{ position: "absolute", left: innerW * 0.735, top: innerH * 0.2, width: innerW * 0.01, height: innerW * 0.01, borderRadius: "50%", backgroundColor: "rgba(160, 175, 210, 0.4)" }} />
        <svg style={{ position: "absolute", left: 0, top: 0, width: innerW, height: innerH }} width={innerW} height={innerH} viewBox={`0 0 ${innerW} ${innerH}`}>
          {farBuildings.map((b, i) => (
            <rect key={i} x={b.x - innerX} y={b.y - innerY} width={b.w} height={b.h} fill="#131f45" />
          ))}
          {buildings.map((b, i) => (
            <rect key={i} x={b.x - innerX} y={b.y - innerY} width={b.w} height={b.h} fill="#070d24" />
          ))}
        </svg>
        {rooftopWindows.map((rw, i) => (
          <div key={i} style={{ position: "absolute", left: rw.x - innerX, top: rw.y - innerY, width: 11, height: 15, backgroundColor: rw.warm ? "#ffcf5e" : "#bcd6ff", opacity: rw.o, filter: "drop-shadow(0 0 6px #ffd166)" }} />
        ))}
        {cityLights.map((light, i) => (
          <div key={i} style={{ position: "absolute", left: light.x - innerX, top: light.y - innerY, width: light.w, height: light.h, backgroundColor: light.warm ? "#ffd166" : "#aaccff", opacity: light.o, filter: "drop-shadow(0 0 8px #ffd166)" }} />
        ))}
        {stars.map((star, i) => (
          <div key={i} style={{ position: "absolute", left: star.x - innerX, top: star.y - innerY, width: star.size, height: star.size, borderRadius: "50%", backgroundColor: "#ffffff", opacity: star.o }}>
            {star.cross ? (
              <div style={{ position: "absolute", left: -star.size * 0.8, top: star.size * 0.4, width: star.size * 2.6, height: 2, backgroundColor: "rgba(255, 255, 255, 0.7)" }} />
            ) : null}
            {star.cross ? (
              <div style={{ position: "absolute", left: star.size * 0.4, top: -star.size * 0.8, width: 2, height: star.size * 2.6, backgroundColor: "rgba(255, 255, 255, 0.7)" }} />
            ) : null}
          </div>
        ))}
        {iceCrystals.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x - innerX, top: c.y - innerY, width: c.size, height: c.size, backgroundColor: "rgba(210, 230, 255, 0.85)", opacity: c.o, transform: `rotate(${c.rot}deg)`, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
        ))}
        {snow.map((flake, i) => (
          <div key={i} style={{ position: "absolute", left: flake.x - innerX, top: flake.y - innerY, width: flake.size, height: flake.size, borderRadius: "50%", backgroundColor: "#ffffff", opacity: flake.o }}>
            {flake.flake ? (
              <div style={{ position: "absolute", left: -flake.size * 0.5, top: flake.size * 0.42, width: flake.size * 2, height: 2, backgroundColor: "rgba(255, 255, 255, 0.8)" }} />
            ) : null}
            {flake.flake ? (
              <div style={{ position: "absolute", left: flake.size * 0.42, top: -flake.size * 0.5, width: 2, height: flake.size * 2, backgroundColor: "rgba(255, 255, 255, 0.8)" }} />
            ) : null}
          </div>
        ))}
        {rainStreaks.map((r, i) => (
          <div key={i} style={{ position: "absolute", left: r.x - innerX, top: r.y - innerY, width: 3, height: r.len, background: "linear-gradient(180deg, transparent, rgba(200, 225, 255, 0.55), transparent)", opacity: r.o, borderRadius: 2 }} />
        ))}
        <div style={{ position: "absolute", left: innerW * (0.1 + Math.sin(progress * twoPi) * 0.08), top: -innerH * 0.1, width: innerW * 0.16, height: innerH * 1.2, background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.07), transparent)", transform: "rotate(12deg)" }} />
        <div style={{ position: "absolute", left: innerW * (0.75 - Math.sin(progress * twoPi * 2) * 0.1) + shimmerX * 0.4, top: -innerH * 0.1, width: innerW * 0.1, height: innerH * 1.2, background: "linear-gradient(90deg, transparent, rgba(190, 215, 255, 0.09), transparent)", transform: "rotate(-10deg)" }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: innerW, height: innerH * 0.22, background: `radial-gradient(ellipse at 50% 110%, rgba(255, 190, 60, ${0.22 + warmPulse * 0.07}), transparent 70%)` }} />
      </div>
      <div style={{ position: "absolute", left: winX - width * 0.006, top: winY - height * 0.006, width: winW + width * 0.012, height: winH + height * 0.012, border: `${frameThick}px solid #2a1c10`, boxSizing: "border-box", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: centerX - width * 0.004, top: winY, width: width * 0.008, height: winH, backgroundColor: "#2a1c10" }} />
      <div style={{ position: "absolute", left: winX, top: winY + winH / 2 - height * 0.004, width: winW, height: height * 0.008, backgroundColor: "#2a1c10" }} />
      <svg style={{ position: "absolute", left: winX + curtainSway, top: winY, width: winW * 0.075, height: winH }} width={winW * 0.075} height={winH} viewBox={`0 0 ${winW * 0.075} ${winH}`}>
        <rect x={0} y={0} width={winW * 0.075} height={winH} fill="#1b1440" fillOpacity={0.92} />
        {curtainFolds.map((f, i) => (
          <rect key={i} x={f.x - winX} y={0} width={7} height={winH} fill={i % 2 === 0 ? "#241a55" : "#120c2e"} fillOpacity={0.85} />
        ))}
        {curtainDiamonds.map((d, i) => (
          <rect key={i} x={d.x - winX - curtainSway} y={d.y - winY} width={14} height={14} fill="#c9a227" fillOpacity={d.o * 0.55} transform={`rotate(45 ${d.x - winX - curtainSway + 7} ${d.y - winY + 7})`} />
        ))}
        <rect x={0} y={0} width={winW * 0.075} height={26} fill="#c9a227" fillOpacity={0.5} />
      </svg>
      <div style={{ position: "absolute", left: winX - width * 0.02, top: sillY, width: winW + width * 0.04, height: height * 0.028, background: "linear-gradient(180deg, #5a3d22, #3a2716)", borderRadius: height * 0.008 }} />
      {snowMounds.map((m, i) => (
        <div key={i} style={{ position: "absolute", left: m.x - m.r, top: sillY - m.r * 0.45, width: m.r * 2, height: m.r, borderRadius: "50% 50% 0 0", backgroundColor: "rgba(235, 242, 255, 0.92)", opacity: m.o }} />
      ))}
      {woodLines.map((line, i) => (
        <div key={i} style={{ position: "absolute", left: line.x, top: line.y, width: line.w, height: line.h, backgroundColor: "#1d1206", opacity: line.o }} />
      ))}
      <div style={{ position: "absolute", left: centerX - width * 0.22 + warmPulse * 40, top: baseY - height * 0.34, width: width * 0.44, height: height * 0.4, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 190, 60, ${0.3 + warmPulse * 0.08}), transparent 65%)` }} />
      <div style={{ position: "absolute", left: centerX - width * 0.2 + Math.sin(progress * twoPi * 3) * 50, top: baseY - height * 0.3, width: width * 0.4, height: height * 0.34, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 170, 40, ${0.16 + Math.abs(Math.sin(progress * twoPi * 3)) * 0.12}), transparent 65%)` }} />
      <div style={{ position: "absolute", left: winX - width * 0.02 + moonWashX, top: sillY, width: winW + width * 0.04, height: height * 0.028, background: "linear-gradient(90deg, transparent, rgba(150, 190, 255, 0.28), transparent)", opacity: 0.55 + coolPulse * 0.2 }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${centerX - winW * 0.26} ${baseY} Q ${centerX} ${baseY + height * 0.045} ${centerX + winW * 0.26} ${baseY}`} stroke="#e8b64c" strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={`M ${centerX} ${baseY} L ${centerX} ${baseY + height * 0.028}`} stroke="#e8b64c" strokeWidth={16} strokeLinecap="round" />
        <rect x={centerX - winW * 0.14} y={baseY + height * 0.028} width={winW * 0.28} height={height * 0.01} rx={height * 0.005} fill="#d4a017" />
      </svg>
      {candles.map((candle, i) => {
        const cx = centerX + candle.frac * winW;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        const flicker = Math.sin(progress * twoPi * 4 + i * 1.7) * 0.7 + Math.sin(progress * twoPi * 7 + i * 2.3) * 0.3 + Math.sin(progress * twoPi * 11 + i * 2.9) * 0.2;
        const flameScale = 1 + flicker * 0.25;
        const flameOpacity = 0.78 + flicker * 0.18;
        const glow = 16 + flicker * 12;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.005, top: candleTop, width: width * 0.01, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #ffffff, #dbeafe)", borderRadius: width * 0.005 }} />
            <div style={{ position: "absolute", left: cx - 1, top: candleTop - 12, width: 2, height: 12, backgroundColor: "#3a2a12" }} />
            <div style={{ position: "absolute", left: cx - 22 * flameScale, top: candleTop - 78 * flameScale, width: 44 * flameScale, height: 66 * flameScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: flameOpacity, filter: `drop-shadow(0 0 ${glow}px #ffb703)`, transform: `rotate(${flicker * 8}deg)` }} />
            <div style={{ position: "absolute", left: cx - 8, top: candleTop - 48, width: 16, height: 32, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: 0.85 }} />
            <div style={{ position: "absolute", left: cx - 30 * flameScale, top: candleTop - 90 * flameScale, width: 60 * flameScale, height: 90 * flameScale, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 180, 60, 0.28), transparent 70%)", opacity: 0.5 + flicker * 0.3 }} />
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
