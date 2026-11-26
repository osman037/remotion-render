import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const DreidelLandsOnGimel: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const twoPi = Math.PI * 2;

  // --- Timeline: 0-7s fast spin, 7-11s slowing, 11-13s wobble, 13-15s landed ---
  const dtFast = Math.min(t, 7);
  const angleFast = dtFast * 3 * 360;
  const dtSlow = Math.max(0, Math.min(t, 11) - 7);
  const angleSlow = (3 * dtSlow - 0.3375 * dtSlow * dtSlow) * 360;
  const dtWob = Math.max(0, Math.min(t, 13) - 11);
  const angleWob = (0.3 * dtWob - 0.075 * dtWob * dtWob) * 360;
  // Offset 180 deg so the landed face at 13s is Gimel (index 1).
  const totalAngle = angleFast + angleSlow + angleWob + 180;
  const letters = ["נ", "ג", "ה", "ש"];
  const letterIndex = Math.floor(totalAngle / 90) % 4;
  const letter = letters[letterIndex];
  const spinScale = 0.12 + Math.abs(Math.cos((totalAngle * Math.PI) / 180)) * 0.88;

  const spinSpeed = interpolate(t, [0, 7, 11, 13, 15], [3, 3, 0.3, 0, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ghostOpacity = interpolate(spinSpeed, [0, 3], [0, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wobbleTilt =
    t < 11
      ? 0
      : t < 13
        ? Math.sin((t - 11) * Math.PI * 3) * (1 - (t - 11) / 2) * 11
        : 0;
  const wobbleBob = t < 11 ? 0 : t < 13 ? Math.abs(Math.sin((t - 11) * Math.PI * 3)) * 14 : 0;

  const scatter = interpolate(t, [13, 13.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const landGlint = interpolate(t, [13, 13.5, 15], [1, 0.55, 0.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeIn = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = fadeIn * fadeOut;

  // --- Staging ---
  const horizonY = height * 0.38;
  const centerX = width / 2;
  const dreidelCX = centerX;
  const dreidelCY = height * 0.62;
  const dreidelW = width * 0.2;
  const dreidelH = dreidelW * 1.3;
  const glowPulse = 0.5 + Math.sin(t * twoPi * 0.25) * 0.12;

  const coins = Array.from({ length: 10 }, (_, i) => {
    const ang = seededRandom(i * 7 + 1) * twoPi;
    const dist = (0.16 + seededRandom(i * 11 + 3) * 0.2) * width;
    const baseX = centerX + Math.cos(ang) * dist;
    const baseY = dreidelCY + height * 0.08 + Math.sin(ang) * dist * 0.32;
    const size = width * (0.028 + seededRandom(i * 13 + 5) * 0.014);
    const push = scatter * (26 + seededRandom(i * 17 + 9) * 44);
    return {
      x: baseX + Math.cos(ang) * push,
      y: baseY + Math.sin(ang) * push * 0.4,
      size,
      glint: 0.35 + Math.abs(Math.sin(t * 1.4 + i * 1.3)) * 0.5 + landGlint * 0.25,
    };
  });

  const motes = Array.from({ length: 24 }, (_, i) => {
    const mx = centerX + (seededRandom(i * 3 + 1) - 0.5) * width * 0.5;
    const my = height * 0.12 + seededRandom(i * 5 + 2) * height * 0.5;
    const drift = Math.sin(t * 0.5 + i * 1.7) * 26;
    const fall = ((t * (4 + seededRandom(i * 7 + 4) * 8) + seededRandom(i * 9 + 6) * 200) % 220);
    return { x: mx + drift, y: my + fall, size: 3 + seededRandom(i * 11 + 8) * 7, o: 0.12 + Math.abs(Math.sin(t + i)) * 0.3 };
  });

  const grain = Array.from({ length: 90 }, (_, i) => {
    const gx = seededRandom(i * 37 + 11) * width;
    const gy = seededRandom(i * 41 + 13) * height;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.08 + Math.abs(Math.sin(t * 2 + i * 2.3)) * 0.22;
    const gold = seededRandom(i * 47 + 19) > 0.6;
    return { x: gx, y: gy, size, o, gold };
  });

  const woodLines = Array.from({ length: 9 }, (_, i) => {
    const y = horizonY + height * 0.07 + i * height * 0.065;
    const wob = seededRandom(i * 3 + 2) * 40;
    return { y, wob, o: 0.1 + seededRandom(i * 5 + 1) * 0.12 };
  });

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", opacity: fade, background: "#0a1230" }}>
      {/* Deep blue backdrop above the table - top copy space */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height: horizonY + height * 0.06, background: "linear-gradient(180deg, #05082e 0%, #0a1a5e 55%, #123a8f 100%)" }} />
      {/* Warm wood table */}
      <div style={{ position: "absolute", left: 0, top: horizonY, width, height: height - horizonY, background: "linear-gradient(180deg, #8a5a2b 0%, #6b4423 35%, #4a2c14 100%)" }} />
      {/* Wood grain lines */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {woodLines.map((line, i) => (
          <path key={i} d={`M 0 ${line.y} Q ${width * 0.3} ${line.y - line.wob} ${width * 0.6} ${line.y} T ${width} ${line.y + line.wob * 0.5}`} stroke="#3a2210" strokeWidth={7} fill="none" strokeOpacity={line.o} />
        ))}
      </svg>
      {/* Warm spotlight cone from above */}
      <div style={{ position: "absolute", left: centerX - width * 0.26, top: 0, width: width * 0.52, height: height * 0.78, background: `radial-gradient(ellipse at 50% 0%, rgba(255, 205, 100, ${0.34 + glowPulse * 0.12}), transparent 70%)` }} />
      {/* Soft glow pool on the table under the dreidel */}
      <div style={{ position: "absolute", left: centerX - width * 0.22, top: dreidelCY - height * 0.06, width: width * 0.44, height: height * 0.22, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255, 190, 60, ${0.4 + glowPulse * 0.14}), transparent 68%)` }} />
      {/* Dust motes drifting in the light */}
      {motes.map((mote, i) => (
        <div key={i} style={{ position: "absolute", left: mote.x, top: mote.y, width: mote.size, height: mote.size, borderRadius: "50%", backgroundColor: "#ffe08a", opacity: mote.o, filter: "drop-shadow(0 0 6px #ffd166)" }} />
      ))}
      {/* Gold coins scattered around the dreidel */}
      {coins.map((coin, i) => (
        <div key={i} style={{ position: "absolute", left: coin.x - coin.size / 2, top: coin.y - coin.size / 2, width: coin.size, height: coin.size, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff3b0 0%, #f5c542 45%, #b8860b 100%)", border: `${Math.max(2, coin.size * 0.08)}px solid #8a6508`, boxShadow: "0 10px 24px rgba(0,0,0,0.45)" }}>
          <div style={{ position: "absolute", left: "18%", top: "18%", width: "64%", height: "64%", borderRadius: "50%", border: `${Math.max(2, coin.size * 0.05)}px solid rgba(138, 101, 8, 0.7)`, backgroundColor: `rgba(255, 255, 255, ${coin.glint * 0.35})` }} />
        </div>
      ))}
      {/* Dreidel shadow on the table */}
      <div style={{ position: "absolute", left: dreidelCX - dreidelW * 0.42, top: dreidelCY + dreidelH * 0.36, width: dreidelW * 0.84, height: dreidelH * 0.14, borderRadius: "50%", backgroundColor: "rgba(0, 0, 0, 0.45)", filter: "blur(6px)" }} />
      {/* Fast-spin ghost copy for motion blur */}
      <div style={{ position: "absolute", left: dreidelCX - dreidelW / 2 + 14, top: dreidelCY - dreidelH / 2, width: dreidelW, height: dreidelH, opacity: ghostOpacity, transform: `scaleX(${spinScale * 0.92}) rotate(${wobbleTilt}deg)`, transformOrigin: "50% 55%" }}>
        <svg width={dreidelW} height={dreidelH} viewBox="0 0 400 520">
          <path d="M 120 150 L 280 150 L 320 300 L 200 480 L 80 300 Z" fill="#e8b64c" fillOpacity={0.9} />
        </svg>
      </div>
      {/* The dreidel */}
      <div style={{ position: "absolute", left: dreidelCX - dreidelW / 2, top: dreidelCY - dreidelH / 2 + wobbleBob, width: dreidelW, height: dreidelH, transform: `scaleX(${spinScale}) rotate(${wobbleTilt}deg)`, transformOrigin: "50% 55%" }}>
        <svg width={dreidelW} height={dreidelH} viewBox="0 0 400 520">
          <defs>
            <linearGradient id="goldBody" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8a6508" />
              <stop offset="30%" stopColor="#ffd166" />
              <stop offset="55%" stopColor="#fff3b0" />
              <stop offset="80%" stopColor="#e8b64c" />
              <stop offset="100%" stopColor="#8a6508" />
            </linearGradient>
          </defs>
          <rect x={182} y={18} width={36} height={92} rx={14} fill="#f5c542" stroke="#8a6508" strokeWidth={5} />
          <circle cx={200} cy={22} r={26} fill="#ffd166" stroke="#8a6508" strokeWidth={5} />
          <path d="M 120 150 L 280 150 L 320 300 L 200 480 L 80 300 Z" fill="url(#goldBody)" stroke="#8a6508" strokeWidth={7} strokeLinejoin="round" />
          <path d="M 120 150 L 280 150 L 300 220 L 100 220 Z" fill="#fff3b0" fillOpacity={0.35} />
          <text x={200} y={330} fontSize={150} fill="#7a4a00" textAnchor="middle" fontFamily="serif" fontWeight="bold">
            {letter}
          </text>
        </svg>
      </div>
      {/* Landing glint burst */}
      <div style={{ position: "absolute", left: centerX - width * 0.16, top: dreidelCY - height * 0.12, width: width * 0.32, height: height * 0.24, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 240, 180, ${landGlint * 0.5}), transparent 65%)` }} />
      {/* Grain for bitrate, kept subtle so the subject stays clear */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#c9d6ff"} fillOpacity={dot.o} />
        ))}
      </svg>
      {/* Soft vignette */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: "radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(0, 0, 10, 0.5) 100%)" }} />
    </div>
  );
};
