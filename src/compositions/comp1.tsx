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

  // Embers rise only from the two lit flames, 12 from each.
  const embers = Array.from({ length: 24 }, (_, i) => {
    const fromShamash = i < 12;
    const sourceX = fromShamash ? groupX : groupX + candleGap;
    const offset = seededRandom(i * 11 + 2);
    const cycle = (progress * (0.7 + seededRandom(i * 5 + 1) * 0.9) + offset) % 1;
    const ex = sourceX + (seededRandom(i * 13 + 4) - 0.5) * width * 0.07 + Math.sin(progress * twoPi * 2 + i) * 22;
    const ey = baseY - height * 0.34 - cycle * height * 0.34;
    const size = 3 + seededRandom(i * 17 + 6) * 9;
    const lit = fromShamash ? shamashOpacity : firstOpacity;
    return { x: ex, y: ey, size, o: (1 - cycle) * lit * (0.4 + seededRandom(i * 19 + 8) * 0.5) };
  });

  // Full-frame animated film grain, 180 dots: positions and opacity jump
  // every frame via seededRandom + frame, so the frame never compresses flat.
  // Low opacity only, so it reads as grain and the copy space stays clean.
  const grain = Array.from({ length: 180 }, (_, i) => {
    const gx = (seededRandom(i * 37 + 11) * width + seededRandom(i * 53 + frame * 7) * 260) % width;
    const gy = (seededRandom(i * 41 + 13) * height + seededRandom(i * 59 + frame * 11) * 200) % height;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.04 + Math.abs(Math.sin(progress * twoPi * 6 + i * 2.3)) * 0.12 + seededRandom(i * 61 + frame * 3) * 0.06;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  // Spark burst around the match head at the strike.
  const sparks = Array.from({ length: 18 }, (_, i) => {
    const angle = seededRandom(i * 3 + 1) * twoPi;
    const dist = seededRandom(i * 7 + 2) * 90 * sparkFlash;
    const sx = groupX + Math.cos(angle) * dist;
    const sy = baseY - height * 0.36 + Math.sin(angle) * dist;
    const size = 3 + seededRandom(i * 5 + 3) * 8;
    return { x: sx, y: sy, size, o: sparkFlash * (0.5 + seededRandom(i * 9 + 4) * 0.5) };
  });

  const shamashX = groupX;
  const firstX = groupX + candleGap;
  const shamashTop = baseY - height * 0.33;
  const firstTop = baseY - height * 0.27;
  // Stronger two-frequency flame flicker so the flames never sit still.
  const shamashFlicker = Math.sin(progress * twoPi * 7) * 0.6 + Math.sin(progress * twoPi * 13 + 1.1) * 0.4;
  const firstFlicker = Math.sin(progress * twoPi * 7 + 1.4) * 0.6 + Math.sin(progress * twoPi * 11 + 2.2) * 0.4;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", opacity: overallOpacity, background: `linear-gradient(${gradientAngle}deg, #04061f, #0a1748, #122a6e, #3a1e5e, #04061f)` }}>
      <div style={{ width, height, position: "absolute", left: 0, top: 0, transform: `scale(${cameraScale})`, transformOrigin: `${groupX}px ${baseY}px` }}>
      <div style={{ position: "absolute", left: groupX - width * 0.42 + Math.sin(progress * twoPi) * 120, top: height * 0.1 + Math.cos(progress * twoPi) * 80, width: width * 0.6, height: height * 0.6, borderRadius: "50%", background: "radial-gradient(circle, rgba(70, 120, 255, 0.22), transparent 65%)" }} />
      <div style={{ position: "absolute", left: groupX - width * 0.3, top: baseY - height * 0.42, width: width * 0.6, height: height * 0.6, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 190, 60, ${0.1 + glowStrength * 0.4 * glowPulse}), transparent 62%)`, opacity: glowStrength * glowPulse }} />
      <div style={{ position: "absolute", left: groupX - width * 0.22 + Math.sin(progress * twoPi * 2) * 60, top: baseY - height * 0.5 + Math.cos(progress * twoPi * 2) * 40, width: width * 0.44, height: height * 0.5, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 170, 40, ${0.08 + glowStrength * 0.22 * glowPulse}), transparent 65%)` }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
        ))}
      </svg>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${groupX - candleGap * 4} ${baseY} Q ${groupX} ${baseY + height * 0.15} ${groupX + candleGap * 4} ${baseY}`} stroke="#e8b64c" strokeWidth={28} fill="none" strokeLinecap="round" />
        <path d={`M ${groupX - candleGap * 4} ${baseY - 14} Q ${groupX} ${baseY + height * 0.15 - 14} ${groupX + candleGap * 4} ${baseY - 14}`} stroke="#f7d774" strokeWidth={3} fill="none" opacity={0.55} />
        <path d={`M ${groupX - candleGap * 4} ${baseY + 14} Q ${groupX} ${baseY + height * 0.15 + 14} ${groupX + candleGap * 4} ${baseY + 14}`} stroke="#a67c00" strokeWidth={3} fill="none" opacity={0.5} />
        <path d={`M ${groupX - 9} ${baseY + height * 0.02} L ${groupX - 9} ${baseY + height * 0.09}`} stroke="#f7d774" strokeWidth={3} opacity={0.55} />
        <path d={`M ${groupX + 9} ${baseY + height * 0.02} L ${groupX + 9} ${baseY + height * 0.09}`} stroke="#a67c00" strokeWidth={3} opacity={0.5} />
        <path d={`M ${groupX} ${baseY + height * 0.02} L ${groupX} ${baseY + height * 0.09}`} stroke="#e8b64c" strokeWidth={28} strokeLinecap="round" />
        <rect x={groupX - width * 0.19} y={baseY + height * 0.09} width={width * 0.38} height={height * 0.024} rx={height * 0.012} fill="#d4a017" />
      </svg>
      {candles.map((candle, i) => {
        const cx = groupX + candle.frac * candleGap;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.011, top: candleTop, width: width * 0.022, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #fdfdfd, #dbeafe)", borderRadius: width * 0.011 }} />
            <div style={{ position: "absolute", left: cx - 2, top: candleTop - 24, width: 4, height: 24, backgroundColor: "#3a2a12" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: shamashX - 70 * shamashScale, top: shamashTop - 150 * shamashScale, width: 140 * shamashScale, height: 132 * shamashScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: shamashOpacity * (0.82 + shamashFlicker * 0.18), filter: `drop-shadow(0 0 ${30 + shamashFlicker * 16}px #ffb703)`, transform: `rotate(${leanAngle + shamashFlicker * 6}deg)` }} />
      <div style={{ position: "absolute", left: shamashX - 26, top: shamashTop - 96, width: 52, height: 58, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: shamashOpacity * 0.8 }} />
      <div style={{ position: "absolute", left: firstX - 62 * firstScale, top: firstTop - 138 * firstScale, width: 124 * firstScale, height: 120 * firstScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: firstOpacity * (0.82 + firstFlicker * 0.18), filter: `drop-shadow(0 0 ${28 + firstFlicker * 16}px #ffb703)`, transform: `rotate(${firstFlicker * 6}deg)` }} />
      <div style={{ position: "absolute", left: firstX - 22, top: firstTop - 88, width: 44, height: 52, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: firstOpacity * 0.8 }} />
      <div style={{ position: "absolute", left: shamashX - 24, top: shamashTop - 34, width: 230, height: 26, backgroundColor: "#8b5a2b", borderRadius: 13, opacity: matchOpacity, transform: "rotate(-32deg)", transformOrigin: "0px 13px" }} />
      <div style={{ position: "absolute", left: shamashX - 52, top: shamashTop - 58, width: 42, height: 42, borderRadius: "50%", background: "radial-gradient(circle, #fff3b0 0%, #ff8c00 60%, #ff5e00 100%)", opacity: matchOpacity, filter: `drop-shadow(0 0 ${30 + sparkFlash * 50}px #ffb703)` }} />
      {sparks.map((spark, i) => (
        <div key={i} style={{ position: "absolute", left: spark.x, top: spark.y, width: spark.size, height: spark.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: spark.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      {embers.map((ember, i) => (
        <div key={i} style={{ position: "absolute", left: ember.x, top: ember.y, width: ember.size, height: ember.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: ember.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 63% 62%, rgba(255, 190, 60, ${warmWash * warmBreath}), transparent 70%)`, opacity: warmWash > 0 ? 1 : 0 }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height, backgroundColor: "#02031a", opacity: darkOverlay }} />
      </div>
    </div>
  );
};
