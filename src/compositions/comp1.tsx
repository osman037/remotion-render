import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const ShamashLightsFirstCandle: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;

  // Menorah sits centre-right; the left third of frame stays empty dark copy space.
  const groupX = width * 0.63;
  const baseY = height * 0.78;
  const candleGap = width * 0.052;

  // Fade in 0.4s at start, fade out 0.5s at end.
  const fadeIn = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - fps * 0.5, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const overallOpacity = fadeIn * fadeOut;

  // Scene starts dark and still, then warms as the flames grow.
  const darkOverlay = interpolate(frame, [0, fps * 5, fps * 11, fps * 15], [0.62, 0.5, 0.18, 0.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const warmWash = interpolate(frame, [fps * 8, fps * 15], [0, 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowStrength = interpolate(frame, [fps * 5, fps * 11, fps * 15], [0.12, 0.5, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gradientAngle = 205 + Math.sin(progress * twoPi) * 24 + Math.sin(progress * twoPi * 2 + 0.8) * 8;
  // Slow camera push-in, 1.00 to 1.05 over the 15s, toward the menorah.
  const cameraScale = 1 + progress * 0.05;
  // Warm wash breathes as the flames grow; glow pulses with the flicker.
  const warmBreath = 0.85 + Math.sin(progress * twoPi * 3) * 0.15;
  const glowPulse = 0.85 + Math.sin(progress * twoPi * 4) * 0.15;

  // Match strike 3-5s: match appears, spark flash peaks, then fades.
  const matchOpacity = interpolate(frame, [fps * 3, fps * 3.3, fps * 4.8, fps * 5.4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sparkFlash = interpolate(frame, [fps * 3.2, fps * 3.7, fps * 4.4, fps * 5.2], [0, 1, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shamash flame grows steady 5-8s.
  const shamashScale = interpolate(frame, [fps * 4.2, fps * 5, fps * 8], [0, 0.65, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shamashOpacity = interpolate(frame, [fps * 4.2, fps * 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shamash flame leans toward the first candle 8-10.5s, then stands straight again.
  const leanAngle = interpolate(frame, [fps * 8, fps * 9.5, fps * 11], [0, 16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // First candle catches 9.5-11s and burns steady to the end.
  const firstScale = interpolate(frame, [fps * 9.5, fps * 10.2, fps * 11], [0, 0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const firstOpacity = interpolate(frame, [fps * 9.5, fps * 10.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const candles = [
    { frac: -4, h: 0.19, shamash: false },
    { frac: -3, h: 0.22, shamash: false },
    { frac: -2, h: 0.25, shamash: false },
    { frac: -1, h: 0.27, shamash: false },
    { frac: 0, h: 0.33, shamash: true },
    { frac: 1, h: 0.27, shamash: false },
    { frac: 2, h: 0.25, shamash: false },
    { frac: 3, h: 0.22, shamash: false },
    { frac: 4, h: 0.19, shamash: false },
  ];

  // --- EXTREME DETAIL LAYER 1: 64 large soft bokeh orbs behind the menorah ---
  // Confined to the right 58% of frame (x >= 0.42 * width) so the left copy
  // space stays dark. Gold and blue, drifting slowly, twinkling at different
  // rates, out of focus (blurred radial gradients).
  const bokeh = Array.from({ length: 64 }, (_, i) => {
    const s1 = seededRandom(i * 101 + 7);
    const s2 = seededRandom(i * 103 + 13);
    const s3 = seededRandom(i * 107 + 21);
    const s4 = seededRandom(i * 109 + 29);
    const baseX = width * (0.42 + s1 * 0.55);
    const baseYb = height * (0.05 + s2 * 0.82);
    const driftX = Math.sin(progress * twoPi * (0.25 + s3 * 0.5) + i * 1.7) * (30 + s4 * 90);
    const driftY = Math.cos(progress * twoPi * (0.2 + s4 * 0.45) + i * 2.3) * (24 + s3 * 70);
    const size = 34 + s2 * 150;
    const twinkle = 0.5 + Math.sin(progress * twoPi * (1 + s1 * 3) + i * 2.9) * 0.5;
    const gold = s3 > 0.42;
    const o = (0.05 + s4 * 0.22) * (0.45 + twinkle * 0.55) * (0.35 + glowStrength * 0.65);
    return { x: baseX + driftX, y: baseYb + driftY, size, o, gold, blur: 6 + s1 * 14 };
  });

  // --- EXTREME DETAIL LAYER 2: textured curtain-fold wall behind the menorah ---
  // 46 thin vertical folds across the right 60% of frame, each a gradient
  // stripe whose brightness slides with the frame, plus a slow warm light
  // wash sweeping across the folds.
  const curtainX0 = width * 0.4;
  const curtainW = width * 0.6;
  const foldCount = 46;
  const foldWidth = curtainW / foldCount;
  const folds = Array.from({ length: foldCount }, (_, i) => {
    const slide = Math.sin(progress * twoPi * 0.8 + i * 0.55) * 0.5 + 0.5;
    const deep = i % 2 === 0;
    const o = (deep ? 0.1 : 0.22) + slide * 0.16 + glowStrength * 0.08;
    const warm = seededRandom(i * 31 + 5) > 0.5;
    return { x: curtainX0 + i * foldWidth, o, warm };
  });
  const washX = curtainX0 + Math.sin(progress * twoPi * 0.6) * curtainW * 0.28 + curtainW * 0.2;

  // --- EXTREME DETAIL LAYER 3: 88 tiny twinkling stars, upper right only ---
  const stars = Array.from({ length: 88 }, (_, i) => {
    const s1 = seededRandom(i * 211 + 3);
    const s2 = seededRandom(i * 223 + 9);
    const s3 = seededRandom(i * 227 + 17);
    const x = width * (0.55 + s1 * 0.43);
    const y = height * (0.03 + s2 * 0.36);
    const tw = 0.5 + Math.sin(progress * twoPi * (1.5 + s3 * 4) + i * 3.1) * 0.5;
    const size = 2 + s3 * 7;
    const o = 0.08 + tw * (0.3 + s2 * 0.45);
    return { x, y, size, o, gold: s1 > 0.55 };
  });

  // --- EXTREME DETAIL LAYER 4: film grain, 260 dots, full frame, low opacity ---
  // Positions and opacity jump every frame via seededRandom + frame, so the
  // frame never compresses flat. Copy space gets grain only, nothing else.
  const grain = Array.from({ length: 260 }, (_, i) => {
    const gx = (seededRandom(i * 37 + 11) * width + seededRandom(i * 53 + frame * 7) * 260) % width;
    const gy = (seededRandom(i * 41 + 13) * height + seededRandom(i * 59 + frame * 11) * 200) % height;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.04 + Math.abs(Math.sin(progress * twoPi * 6 + i * 2.3)) * 0.12 + seededRandom(i * 61 + frame * 3) * 0.06;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  // --- EXTREME DETAIL LAYER 5a: embers, 64 total (32 from each lit flame) ---
  const embers = Array.from({ length: 64 }, (_, i) => {
    const fromShamash = i < 32;
    const sourceX = fromShamash ? groupX : groupX + candleGap;
    const offset = seededRandom(i * 11 + 2);
    const cycle = (progress * (0.7 + seededRandom(i * 5 + 1) * 0.9) + offset) % 1;
    const ex = sourceX + (seededRandom(i * 13 + 4) - 0.5) * width * 0.07 + Math.sin(progress * twoPi * 2 + i) * 22;
    const ey = baseY - height * 0.34 - cycle * height * 0.34;
    const size = 3 + seededRandom(i * 17 + 6) * 9;
    const lit = fromShamash ? shamashOpacity : firstOpacity;
    return { x: ex, y: ey, size, o: (1 - cycle) * lit * (0.4 + seededRandom(i * 19 + 8) * 0.5) };
  });

  // --- EXTREME DETAIL LAYER 5b: match spark burst, 18 dots (as before) ---
  const sparks = Array.from({ length: 18 }, (_, i) => {
    const angle = seededRandom(i * 3 + 1) * twoPi;
    const dist = seededRandom(i * 7 + 2) * 90 * sparkFlash;
    const sx = groupX + Math.cos(angle) * dist;
    const sy = baseY - height * 0.36 + Math.sin(angle) * dist;
    const size = 3 + seededRandom(i * 5 + 3) * 8;
    return { x: sx, y: sy, size, o: sparkFlash * (0.5 + seededRandom(i * 9 + 4) * 0.5) };
  });

  // --- EXTREME DETAIL LAYER 5c: match spark trail, 34 dots ---
  // A glowing trail arcing from the match head toward the shamash wick,
  // revealed progressively during the 3-5s strike, fading with sparkFlash.
  const sparkTrail = Array.from({ length: 34 }, (_, i) => {
    const t = i / 33;
    const tx = groupX - 52 + t * 70 + Math.sin(t * 9 + progress * twoPi * 3) * 14;
    const ty = baseY - height * 0.36 - 22 + t * 46 + Math.cos(t * 7 + i) * 10;
    const reveal = interpolate(frame, [fps * (3 + t * 1.6), fps * (3.4 + t * 1.6)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const size = 3 + seededRandom(i * 23 + 11) * 8;
    return { x: tx, y: ty, size, o: sparkFlash * reveal * (0.4 + seededRandom(i * 29 + 7) * 0.6) };
  });

  // --- EXTREME DETAIL LAYER 5d: rotating light ray fan behind the menorah ---
  // 14 rays fanning out from behind the flames, rotating very slowly
  // (one full turn per ~100s, so ~54deg over the clip), very low opacity.
  const rayCenterX = groupX;
  const rayCenterY = baseY - height * 0.2;
  const rayAngle = progress * 54;
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * twoPi;
    const len = height * (0.5 + seededRandom(i * 41 + 3) * 0.35);
    const x2 = rayCenterX + Math.cos(a) * len;
    const y2 = rayCenterY + Math.sin(a) * len;
    return { x2, y2, w: 3 + seededRandom(i * 43 + 5) * 14, o: 0.03 + seededRandom(i * 47 + 9) * 0.07 };
  });

  // --- EXTREME DETAIL LAYER 6: fine gold texture lines on the menorah ---
  // Extra thin strokes paralleling the main arc (top and bottom edges),
  // small engraved ticks along the arms, and vertical grain lines on the stem.
  const armTexture = Array.from({ length: 12 }, (_, i) => {
    const t = (i + 0.5) / 12;
    const x = groupX - candleGap * 4 + t * candleGap * 8;
    const arcY = baseY + 4 * t * (1 - t) * height * 0.075;
    return { x, y: arcY };
  });
  const stemLines = [-14, -8, -2, 4, 10];

  const shamashX = groupX;
  const firstX = groupX + candleGap;
  const shamashTop = baseY - height * 0.33;
  const firstTop = baseY - height * 0.27;
  // Stronger three-frequency flame flicker so the flames never sit still.
  const shamashFlicker = Math.sin(progress * twoPi * 7) * 0.6 + Math.sin(progress * twoPi * 13 + 1.1) * 0.4 + Math.sin(progress * twoPi * 23 + 0.5) * 0.35;
  const firstFlicker = Math.sin(progress * twoPi * 7 + 1.4) * 0.6 + Math.sin(progress * twoPi * 11 + 2.2) * 0.4 + Math.sin(progress * twoPi * 19 + 2.8) * 0.35;
  // Pulsing halos: each flame gets two halo rings pulsing at different rates.
  const shamashHalo1 = 0.55 + Math.sin(progress * twoPi * 5) * 0.3;
  const shamashHalo2 = 0.55 + Math.sin(progress * twoPi * 9 + 1.2) * 0.3;
  const firstHalo1 = 0.55 + Math.sin(progress * twoPi * 5 + 0.9) * 0.3;
  const firstHalo2 = 0.55 + Math.sin(progress * twoPi * 8 + 2.1) * 0.3;
  // Table reflection grows as the flames grow, with a shimmering band.
  const reflectionOpacity = glowStrength * 0.5;
  const shimmerX = Math.sin(progress * twoPi * 1.4) * width * 0.06;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", opacity: overallOpacity, background: `linear-gradient(${gradientAngle}deg, #04061f, #0a1748, #122a6e, #3a1e5e, #04061f)` }}>
      <div style={{ width, height, position: "absolute", left: 0, top: 0, transform: `scale(${cameraScale})`, transformOrigin: `${groupX}px ${baseY}px` }}>
      <div style={{ position: "absolute", left: groupX - width * 0.42 + Math.sin(progress * twoPi) * 120, top: height * 0.1 + Math.cos(progress * twoPi) * 80, width: width * 0.6, height: height * 0.6, borderRadius: "50%", background: "radial-gradient(circle, rgba(70, 120, 255, 0.22), transparent 65%)" }} />
      <div style={{ position: "absolute", left: groupX - width * 0.3, top: baseY - height * 0.42, width: width * 0.6, height: height * 0.6, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 190, 60, ${0.1 + glowStrength * 0.4 * glowPulse}), transparent 62%)`, opacity: glowStrength * glowPulse }} />
      <div style={{ position: "absolute", left: groupX - width * 0.22 + Math.sin(progress * twoPi * 2) * 60, top: baseY - height * 0.5 + Math.cos(progress * twoPi * 2) * 40, width: width * 0.44, height: height * 0.5, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 170, 40, ${0.08 + glowStrength * 0.22 * glowPulse}), transparent 65%)` }} />
      {/* Curtain folds: 46 vertical gradient stripes, right 60% only */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {folds.map((fold, i) => (
          <rect key={i} x={fold.x} y={0} width={foldWidth + 2} height={height} fill={fold.warm ? "#3a1e5e" : "#0a1748"} fillOpacity={fold.o} />
        ))}
      </svg>
      {/* Slow warm light wash sweeping across the curtain folds */}
      <div style={{ position: "absolute", left: washX - width * 0.12, top: 0, width: width * 0.24, height, background: "linear-gradient(90deg, transparent, rgba(255, 190, 80, 0.14), transparent)", opacity: 0.4 + glowStrength * 0.6 }} />
      {/* Rotating light ray fan behind the menorah, very low opacity */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`rotate(${rayAngle} ${rayCenterX} ${rayCenterY})`}>
          {rays.map((ray, i) => (
            <line key={i} x1={rayCenterX} y1={rayCenterY} x2={ray.x2} y2={ray.y2} stroke="#ffd166" strokeWidth={ray.w} strokeOpacity={ray.o * (0.4 + glowStrength * 0.6)} strokeLinecap="round" />
          ))}
        </g>
      </svg>
      {/* 64 drifting, twinkling bokeh orbs behind the menorah */}
      {bokeh.map((orb, i) => (
        <div key={i} style={{ position: "absolute", left: orb.x - orb.size / 2, top: orb.y - orb.size / 2, width: orb.size, height: orb.size, borderRadius: "50%", background: orb.gold ? "radial-gradient(circle, rgba(255, 210, 110, 0.85), rgba(255, 170, 40, 0.25) 55%, transparent 72%)" : "radial-gradient(circle, rgba(140, 190, 255, 0.85), rgba(70, 120, 255, 0.25) 55%, transparent 72%)", opacity: orb.o, filter: `blur(${orb.blur}px)` }} />
      ))}
      {/* 88 twinkling stars, upper right only */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {stars.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.size} fill={star.gold ? "#ffd166" : "#cfe4ff"} fillOpacity={star.o} />
        ))}
      </svg>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
        ))}
      </svg>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${groupX - candleGap * 4} ${baseY} Q ${groupX} ${baseY + height * 0.15} ${groupX + candleGap * 4} ${baseY}`} stroke="#e8b64c" strokeWidth={28} fill="none" strokeLinecap="round" />
        <path d={`M ${groupX - candleGap * 4} ${baseY - 14} Q ${groupX} ${baseY + height * 0.15 - 14} ${groupX + candleGap * 4} ${baseY - 14}`} stroke="#f7d774" strokeWidth={3} fill="none" opacity={0.55} />
        <path d={`M ${groupX - candleGap * 4} ${baseY + 14} Q ${groupX} ${baseY + height * 0.15 + 14} ${groupX + candleGap * 4} ${baseY + 14}`} stroke="#a67c00" strokeWidth={3} fill="none" opacity={0.5} />
        {/* Fine gold texture lines paralleling the arc */}
        <path d={`M ${groupX - candleGap * 4} ${baseY - 7} Q ${groupX} ${baseY + height * 0.15 - 7} ${groupX + candleGap * 4} ${baseY - 7}`} stroke="#ffe9a8" strokeWidth={1.5} fill="none" opacity={0.5} />
        <path d={`M ${groupX - candleGap * 4} ${baseY + 7} Q ${groupX} ${baseY + height * 0.15 + 7} ${groupX + candleGap * 4} ${baseY + 7}`} stroke="#8a5f00" strokeWidth={1.5} fill="none" opacity={0.5} />
        <path d={`M ${groupX - candleGap * 4} ${baseY - 21} Q ${groupX} ${baseY + height * 0.15 - 21} ${groupX + candleGap * 4} ${baseY - 21}`} stroke="#f7d774" strokeWidth={1.5} fill="none" opacity={0.35} />
        <path d={`M ${groupX - candleGap * 4} ${baseY + 21} Q ${groupX} ${baseY + height * 0.15 + 21} ${groupX + candleGap * 4} ${baseY + 21}`} stroke="#a67c00" strokeWidth={1.5} fill="none" opacity={0.35} />
        {/* Engraved ticks along the arms */}
        {armTexture.map((tick, i) => (
          <line key={i} x1={tick.x} y1={tick.y - 12} x2={tick.x} y2={tick.y + 12} stroke="#ffe9a8" strokeWidth={1.5} strokeOpacity={0.45} />
        ))}
        <path d={`M ${groupX - 9} ${baseY + height * 0.02} L ${groupX - 9} ${baseY + height * 0.09}`} stroke="#f7d774" strokeWidth={3} opacity={0.55} />
        <path d={`M ${groupX + 9} ${baseY + height * 0.02} L ${groupX + 9} ${baseY + height * 0.09}`} stroke="#a67c00" strokeWidth={3} opacity={0.5} />
        {/* Vertical grain lines on the stem */}
        {stemLines.map((dx, i) => (
          <line key={i} x1={groupX + dx} y1={baseY + height * 0.02} x2={groupX + dx} y2={baseY + height * 0.09} stroke="#ffe9a8" strokeWidth={1.5} strokeOpacity={0.4} />
        ))}
        <path d={`M ${groupX} ${baseY + height * 0.02} L ${groupX} ${baseY + height * 0.09}`} stroke="#e8b64c" strokeWidth={28} strokeLinecap="round" />
        <rect x={groupX - width * 0.19} y={baseY + height * 0.09} width={width * 0.38} height={height * 0.024} rx={height * 0.012} fill="#d4a017" />
        {/* Fine gold lines across the base bar */}
        <line x1={groupX - width * 0.19} y1={baseY + height * 0.098} x2={groupX + width * 0.19} y2={baseY + height * 0.098} stroke="#ffe9a8" strokeWidth={1.5} strokeOpacity={0.5} />
        <line x1={groupX - width * 0.19} y1={baseY + height * 0.106} x2={groupX + width * 0.19} y2={baseY + height * 0.106} stroke="#8a5f00" strokeWidth={1.5} strokeOpacity={0.5} />
      </svg>
      {candles.map((candle, i) => {
        const cx = groupX + candle.frac * candleGap;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.011, top: candleTop, width: width * 0.022, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #fdfdfd, #dbeafe)", borderRadius: width * 0.011 }} />
            <div style={{ position: "absolute", left: cx - width * 0.007, top: candleTop, width: width * 0.004, height: candleHeight, backgroundColor: "rgba(255, 255, 255, 0.65)", borderRadius: width * 0.002 }} />
            <div style={{ position: "absolute", left: cx + width * 0.007, top: candleTop, width: width * 0.003, height: candleHeight, backgroundColor: "rgba(120, 110, 160, 0.35)", borderRadius: width * 0.0015 }} />
            <div style={{ position: "absolute", left: cx - 2, top: candleTop - 24, width: 4, height: 24, backgroundColor: "#3a2a12" }} />
          </div>
        );
      })}
      {/* Pulsing halos behind each flame, two rates each */}
      <div style={{ position: "absolute", left: shamashX - 200 * shamashHalo1, top: shamashTop - 200 * shamashHalo1, width: 400 * shamashHalo1, height: 400 * shamashHalo1, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 200, 80, 0.28), transparent 65%)", opacity: shamashOpacity * shamashHalo1 * 0.8 }} />
      <div style={{ position: "absolute", left: shamashX - 130 * shamashHalo2, top: shamashTop - 130 * shamashHalo2, width: 260 * shamashHalo2, height: 260 * shamashHalo2, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 240, 180, 0.3), transparent 60%)", opacity: shamashOpacity * shamashHalo2 * 0.7 }} />
      <div style={{ position: "absolute", left: firstX - 180 * firstHalo1, top: firstTop - 180 * firstHalo1, width: 360 * firstHalo1, height: 360 * firstHalo1, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 200, 80, 0.28), transparent 65%)", opacity: firstOpacity * firstHalo1 * 0.8 }} />
      <div style={{ position: "absolute", left: firstX - 120 * firstHalo2, top: firstTop - 120 * firstHalo2, width: 240 * firstHalo2, height: 240 * firstHalo2, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 240, 180, 0.3), transparent 60%)", opacity: firstOpacity * firstHalo2 * 0.7 }} />
      <div style={{ position: "absolute", left: shamashX - 70 * shamashScale, top: shamashTop - 150 * shamashScale, width: 140 * shamashScale, height: 132 * shamashScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: shamashOpacity * (0.82 + shamashFlicker * 0.18), filter: `drop-shadow(0 0 ${30 + shamashFlicker * 16}px #ffb703)`, transform: `rotate(${leanAngle + shamashFlicker * 6}deg)` }} />
      <div style={{ position: "absolute", left: shamashX - 26, top: shamashTop - 96, width: 52, height: 58, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: shamashOpacity * 0.8 }} />
      <div style={{ position: "absolute", left: firstX - 62 * firstScale, top: firstTop - 138 * firstScale, width: 124 * firstScale, height: 120 * firstScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: firstOpacity * (0.82 + firstFlicker * 0.18), filter: `drop-shadow(0 0 ${28 + firstFlicker * 16}px #ffb703)`, transform: `rotate(${firstFlicker * 6}deg)` }} />
      <div style={{ position: "absolute", left: firstX - 22, top: firstTop - 88, width: 44, height: 52, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: firstOpacity * 0.8 }} />
      <div style={{ position: "absolute", left: shamashX - 24, top: shamashTop - 34, width: 230, height: 26, backgroundColor: "#8b5a2b", borderRadius: 13, opacity: matchOpacity, transform: "rotate(-32deg)", transformOrigin: "0px 13px" }} />
      <div style={{ position: "absolute", left: shamashX - 52, top: shamashTop - 58, width: 42, height: 42, borderRadius: "50%", background: "radial-gradient(circle, #fff3b0 0%, #ff8c00 60%, #ff5e00 100%)", opacity: matchOpacity, filter: `drop-shadow(0 0 ${30 + sparkFlash * 50}px #ffb703)` }} />
      {sparks.map((spark, i) => (
        <div key={i} style={{ position: "absolute", left: spark.x, top: spark.y, width: spark.size, height: spark.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: spark.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      {sparkTrail.map((dot, i) => (
        <div key={i} style={{ position: "absolute", left: dot.x, top: dot.y, width: dot.size, height: dot.size, borderRadius: "50%", backgroundColor: "#ffe27a", opacity: dot.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      {embers.map((ember, i) => (
        <div key={i} style={{ position: "absolute", left: ember.x, top: ember.y, width: ember.size, height: ember.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: ember.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      {/* Shimmering table reflection, grows with the flames */}
      <div style={{ position: "absolute", left: groupX - width * 0.19, top: baseY + height * 0.115, width: width * 0.38, height: height * 0.09, background: "linear-gradient(180deg, rgba(255, 190, 60, 0.55), rgba(255, 150, 30, 0.12) 60%, transparent)", opacity: reflectionOpacity }} />
      <div style={{ position: "absolute", left: groupX - width * 0.19 + shimmerX, top: baseY + height * 0.115, width: width * 0.1, height: height * 0.09, background: "linear-gradient(180deg, rgba(255, 240, 190, 0.5), transparent)", opacity: reflectionOpacity * 0.8 }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 63% 62%, rgba(255, 190, 60, ${warmWash * warmBreath}), transparent 70%)`, opacity: warmWash > 0 ? 1 : 0 }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height, backgroundColor: "#02031a", opacity: darkOverlay }} />
      </div>
    </div>
  );
};
