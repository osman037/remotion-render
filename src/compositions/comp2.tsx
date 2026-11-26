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
  const progress = frame / durationInFrames;
  const camScale = 1 + progress * 0.05;
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

  const sweepX = interpolate(progress, [0, 1], [-width * 0.45, width * 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweep2X = interpolate(progress, [0, 1], [width * 1.1, -width * 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Slow rotating light ray fan behind the dreidel (very low opacity).
  const rayAngle = progress * 180;
  const rayFan =
    "conic-gradient(from 0deg, " +
    Array.from({ length: 12 }, (_, i) => {
      const a = i * 30;
      return `rgba(255, 210, 120, 0.09) ${a}deg ${a + 7}deg, transparent ${a + 7}deg ${a + 30}deg`;
    }).join(", ") +
    ")";

  // Drifting gold glow in the backdrop, slow side-to-side drift.
  const backdropGlowX = centerX + Math.sin(t * 0.12) * width * 0.14 - width * 0.22;
  const backdropGlowO = 0.09 + Math.sin(t * 0.3) * 0.04;

  const coins = Array.from({ length: 18 }, (_, i) => {
    const ang = seededRandom(i * 7 + 1) * twoPi;
    const dist = (0.14 + seededRandom(i * 11 + 3) * 0.24) * width;
    const baseX = centerX + Math.cos(ang) * dist;
    const baseY = dreidelCY + height * 0.08 + Math.sin(ang) * dist * 0.32;
    const size = width * (0.026 + seededRandom(i * 13 + 5) * 0.016);
    const push = scatter * (26 + seededRandom(i * 17 + 9) * 44);
    return {
      x: baseX + Math.cos(ang) * push,
      y: baseY + Math.sin(ang) * push * 0.4,
      size,
      glint: 0.4 + Math.abs(Math.sin(t * 2.0 + i * 1.3)) * 0.6 + landGlint * 0.3,
      starO: 0.25 + Math.abs(Math.sin(t * 2.4 + i * 1.9)) * 0.6,
      rot: seededRandom(i * 19 + 2) * 360,
    };
  });

  // Dust motes stay in the table/spotlight area so the top copy space stays clean.
  const motes = Array.from({ length: 85 }, (_, i) => {
    const mx = centerX + (seededRandom(i * 3 + 1) - 0.5) * width * 0.55;
    const my = horizonY + height * 0.02 + seededRandom(i * 5 + 2) * height * 0.5;
    const drift = Math.sin(t * 0.5 + i * 1.7) * 26 + Math.cos(t * 0.35 + i * 0.9) * 14;
    const fall = ((t * (4 + seededRandom(i * 7 + 4) * 8) + seededRandom(i * 9 + 6) * 200) % 220);
    return { x: mx + drift, y: my + fall, size: 3 + seededRandom(i * 11 + 8) * 7, o: 0.12 + Math.abs(Math.sin(t + i)) * 0.3 };
  });

  // Full-frame film grain: positions, sizes and opacities re-seeded every frame.
  const grain = Array.from({ length: 260 }, (_, i) => {
    const gx = seededRandom(i * 37 + 11 + frame * 1.3) * width;
    const gy = seededRandom(i * 41 + 13 + frame * 1.7) * height;
    const size = 2 + seededRandom(i * 43 + 17 + frame * 0.5) * 5;
    const o = 0.05 + seededRandom(i * 53 + 23 + frame * 0.9) * 0.2;
    const gold = seededRandom(i * 47 + 19) > 0.6;
    return { x: gx, y: gy, size, o, gold };
  });

  // Extreme wood grain: 64 wavy lines + 84 fine lines across the whole table.
  const woodLines = Array.from({ length: 64 }, (_, i) => {
    const baseY = horizonY + height * 0.03 + i * (height * 0.58 / 64);
    const y = baseY + Math.sin(t * 0.25 + i * 0.8) * 5;
    const wob = seededRandom(i * 3 + 2) * 46;
    return { y, wob, o: 0.09 + seededRandom(i * 5 + 1) * 0.13 };
  });
  const fineWoodLines = Array.from({ length: 84 }, (_, i) => {
    const baseY = horizonY + height * 0.02 + seededRandom(i * 7 + 3) * height * 0.6;
    const y = baseY + Math.sin(t * 0.2 + i * 1.1) * 4;
    const wob = 20 + seededRandom(i * 11 + 5) * 60;
    return { y, wob, o: 0.04 + seededRandom(i * 13 + 7) * 0.1 };
  });
  // Wood knots: 6 knots, each 3 concentric ellipses, slowly breathing.
  const knots = Array.from({ length: 6 }, (_, i) => {
    const kx = width * (0.08 + seededRandom(i * 23 + 4) * 0.84);
    const ky = horizonY + height * (0.06 + seededRandom(i * 29 + 6) * 0.5);
    const kr = 26 + seededRandom(i * 31 + 8) * 46;
    const breathe = 1 + Math.sin(t * 0.4 + i * 1.4) * 0.06;
    return { x: kx, y: ky, r: kr * breathe, o: 0.16 + seededRandom(i * 37 + 10) * 0.14 };
  });

  // Bokeh orbs in the deep blue backdrop above the table: gold and blue, out of
  // focus, twinkling, kept dim so the copy space stays usable.
  const bokeh = Array.from({ length: 64 }, (_, i) => {
    const bx = seededRandom(i * 61 + 3) * width;
    const by = seededRandom(i * 67 + 5) * horizonY * 0.98;
    const size = 18 + seededRandom(i * 71 + 7) * 72;
    const gold = seededRandom(i * 73 + 9) > 0.45;
    const tw = 0.55 + Math.sin(t * (0.6 + seededRandom(i * 79 + 11) * 1.4) + i * 2.3) * 0.45;
    return { x: bx, y: by, size, gold, o: (0.05 + seededRandom(i * 83 + 13) * 0.13) * tw, drift: Math.sin(t * 0.2 + i * 1.1) * 18 };
  });
  // Tiny stars up in the backdrop.
  const stars = Array.from({ length: 84 }, (_, i) => {
    const sx = seededRandom(i * 89 + 15) * width;
    const sy = seededRandom(i * 97 + 17) * horizonY * 0.95;
    const size = 2 + seededRandom(i * 101 + 19) * 4;
    const tw = 0.4 + Math.abs(Math.sin(t * (1 + seededRandom(i * 103 + 21) * 2) + i * 1.7)) * 0.6;
    return { x: sx, y: sy, size, o: 0.15 + tw * 0.5 };
  });

  // Bright glint travelling across the dreidel body as it spins.
  const glintPos = (((totalAngle % 360) + 360) % 360) / 360;
  const glintX = 92 + glintPos * 216;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", opacity: fade, background: "#0a1230" }}>
      {/* Slow camera push-in: 1.00 to 1.05 over the 15s */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transform: `scale(${camScale})`, transformOrigin: "50% 62%" }}>
      {/* Deep blue backdrop above the table - top copy space */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height: horizonY + height * 0.06, background: "linear-gradient(180deg, #05082e 0%, #0a1a5e 55%, #123a8f 100%)" }} />
      {/* Slow drifting gold glow in the backdrop */}
      <div style={{ position: "absolute", left: backdropGlowX, top: 0, width: width * 0.44, height: horizonY, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255, 200, 90, ${backdropGlowO}), transparent 70%)` }} />
      {/* Bokeh orbs in the backdrop */}
      {bokeh.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x + b.drift - b.size / 2, top: b.y - b.size / 2, width: b.size, height: b.size, borderRadius: "50%", background: b.gold ? "radial-gradient(circle, rgba(255, 215, 120, 0.9) 0%, rgba(255, 190, 60, 0.35) 45%, transparent 70%)" : "radial-gradient(circle, rgba(150, 190, 255, 0.9) 0%, rgba(90, 140, 255, 0.35) 45%, transparent 70%)", opacity: b.o, filter: "blur(2px)" }} />
      ))}
      {/* Tiny stars in the backdrop */}
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.size, height: s.size, borderRadius: "50%", backgroundColor: "#eaf2ff", opacity: s.o, filter: "drop-shadow(0 0 4px #cfe0ff)" }} />
      ))}
      {/* Warm wood table */}
      <div style={{ position: "absolute", left: 0, top: horizonY, width, height: height - horizonY, background: "linear-gradient(180deg, #8a5a2b 0%, #6b4423 35%, #4a2c14 100%)" }} />
      {/* Wood grain lines */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {woodLines.map((line, i) => (
          <path key={i} d={`M 0 ${line.y} Q ${width * 0.3} ${line.y - line.wob} ${width * 0.6} ${line.y} T ${width} ${line.y + line.wob * 0.5}`} stroke="#3a2210" strokeWidth={4} fill="none" strokeOpacity={line.o} />
        ))}
        {fineWoodLines.map((line, i) => (
          <path key={`f${i}`} d={`M 0 ${line.y} Q ${width * 0.35} ${line.y - line.wob} ${width * 0.7} ${line.y} T ${width} ${line.y + line.wob * 0.4}`} stroke="#2e1a08" strokeWidth={2} fill="none" strokeOpacity={line.o} />
        ))}
        {/* Wood knots: concentric ellipses */}
        {knots.map((k, i) => (
          <g key={`k${i}`} stroke="#2e1a08" fill="none" strokeOpacity={k.o}>
            <ellipse cx={k.x} cy={k.y} rx={k.r} ry={k.r * 0.42} strokeWidth={4} />
            <ellipse cx={k.x} cy={k.y} rx={k.r * 0.62} ry={k.r * 0.26} strokeWidth={3} />
            <ellipse cx={k.x} cy={k.y} rx={k.r * 0.3} ry={k.r * 0.13} strokeWidth={3} />
          </g>
        ))}
      </svg>
      {/* Patterned table edge: fine gold check band along the horizon */}
      <div style={{ position: "absolute", left: 0, top: horizonY - 6, width, height: 12, backgroundColor: "#1c2f6e", backgroundImage: "repeating-linear-gradient(0deg, rgba(212, 175, 55, 0.55) 0 2px, transparent 2px 14px), repeating-linear-gradient(90deg, rgba(212, 175, 55, 0.55) 0 2px, transparent 2px 14px)", opacity: 0.75 }} />
      {/* Warm spotlight cone from above */}
      <div style={{ position: "absolute", left: centerX - width * 0.26, top: 0, width: width * 0.52, height: height * 0.78, background: `radial-gradient(ellipse at 50% 0%, rgba(255, 205, 100, ${0.34 + glowPulse * 0.12}), transparent 70%)` }} />
      {/* Slow rotating light ray fan behind the dreidel */}
      <div style={{ position: "absolute", left: dreidelCX - dreidelW * 1.6, top: dreidelCY - dreidelW * 1.6, width: dreidelW * 3.2, height: dreidelW * 3.2, borderRadius: "50%", background: rayFan, transform: `rotate(${rayAngle}deg)` }} />
      {/* Soft glow pool on the table under the dreidel */}
      <div style={{ position: "absolute", left: centerX - width * 0.22, top: dreidelCY - height * 0.06, width: width * 0.44, height: height * 0.22, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255, 190, 60, ${0.4 + glowPulse * 0.14}), transparent 68%)` }} />
      {/* Warm light sweeps travelling across the table, table area only */}
      <div style={{ position: "absolute", left: sweepX, top: horizonY, width: width * 0.28, height: height - horizonY, background: "linear-gradient(90deg, transparent 0%, rgba(255, 210, 120, 0.16) 50%, transparent 100%)", transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", left: sweep2X, top: horizonY, width: width * 0.2, height: height - horizonY, background: "linear-gradient(90deg, transparent 0%, rgba(255, 225, 160, 0.08) 50%, transparent 100%)", transform: "skewX(14deg)" }} />
      {/* Dust motes drifting in the light */}
      {motes.map((mote, i) => (
        <div key={i} style={{ position: "absolute", left: mote.x, top: mote.y, width: mote.size, height: mote.size, borderRadius: "50%", backgroundColor: "#ffe08a", opacity: mote.o, filter: "drop-shadow(0 0 6px #ffd166)" }} />
      ))}
      {/* Gold coins scattered around the dreidel, each with star emboss and glints */}
      {coins.map((coin, i) => (
        <div key={i} style={{ position: "absolute", left: coin.x - coin.size / 2, top: coin.y - coin.size / 2, width: coin.size, height: coin.size, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff3b0 0%, #f5c542 45%, #b8860b 100%)", border: `${Math.max(2, coin.size * 0.08)}px solid #8a6508`, boxShadow: "0 10px 24px rgba(0,0,0,0.45)" }}>
          <div style={{ position: "absolute", left: "18%", top: "18%", width: "64%", height: "64%", borderRadius: "50%", border: `${Math.max(2, coin.size * 0.05)}px solid rgba(138, 101, 8, 0.7)`, backgroundColor: `rgba(255, 255, 255, ${coin.glint * 0.35})` }} />
          {/* Star emboss: rotated diamond with centre dot */}
          <div style={{ position: "absolute", left: "35%", top: "35%", width: "30%", height: "30%", transform: `rotate(${coin.rot}deg)`, backgroundColor: `rgba(255, 250, 220, ${coin.starO})`, border: `${Math.max(1, coin.size * 0.03)}px solid rgba(138, 101, 8, 0.8)` }} />
          <div style={{ position: "absolute", left: "44%", top: "44%", width: "12%", height: "12%", borderRadius: "50%", backgroundColor: `rgba(138, 101, 8, ${0.5 + coin.starO * 0.4})` }} />
          {i % 3 === 0 && (
            <div style={{ position: "absolute", left: "32%", top: "32%", width: "36%", height: "36%", transform: "rotate(45deg)", backgroundColor: `rgba(255, 255, 240, ${0.25 + Math.abs(Math.sin(t * 2.2 + i * 2.1)) * 0.55})`, filter: "blur(1px)" }} />
          )}
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
          <ellipse cx={200} cy={22} rx={36} ry={10} fill="none" stroke="#8a6508" strokeWidth={2} strokeOpacity={0.6} />
          <ellipse cx={200} cy={46} rx={32} ry={9} fill="none" stroke="#8a6508" strokeWidth={2} strokeOpacity={0.5} />
          <path d="M 120 150 L 280 150 L 320 300 L 200 480 L 80 300 Z" fill="url(#goldBody)" stroke="#8a6508" strokeWidth={7} strokeLinejoin="round" />
          <path d="M 120 150 L 280 150 L 300 220 L 100 220 Z" fill="#fff3b0" fillOpacity={0.35} />
          {/* Facet lines across the body */}
          <g stroke="#8a6508" strokeWidth={3} strokeOpacity={0.4} fill="none">
            <path d="M 160 150 L 200 480" />
            <path d="M 200 150 L 200 480" />
            <path d="M 240 150 L 200 480" />
            <path d="M 100 220 L 300 220" />
            <path d="M 88 290 L 312 290" />
          </g>
          {/* Engraved diamond motif on the top band */}
          <path d="M 200 168 L 224 192 L 200 216 L 176 192 Z" fill="none" stroke="#7a4a00" strokeWidth={3} strokeOpacity={0.65} />
          <circle cx={200} cy={192} r={7} fill="none" stroke="#7a4a00" strokeWidth={2} strokeOpacity={0.65} />
          {/* Engraved dot row flanking the letter */}
          <g fill="#7a4a00" fillOpacity={0.55}>
            <circle cx={112} cy={262} r={6} />
            <circle cx={112} cy={292} r={6} />
            <circle cx={112} cy={322} r={6} />
            <circle cx={288} cy={262} r={6} />
            <circle cx={288} cy={292} r={6} />
            <circle cx={288} cy={322} r={6} />
          </g>
          {/* Bright glint travelling across the body as it spins */}
          <rect x={glintX} y={150} width={30} height={330} fill="#ffffff" fillOpacity={0.3} transform={`skewX(-14)`} />
          <text x={200} y={330} fontSize={150} fill="#7a4a00" textAnchor="middle" fontFamily="serif" fontWeight="bold">
            {letter}
          </text>
        </svg>
      </div>
      {/* Landing glint burst */}
      <div style={{ position: "absolute", left: centerX - width * 0.16, top: dreidelCY - height * 0.12, width: width * 0.32, height: height * 0.24, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 240, 180, ${landGlint * 0.5}), transparent 65%)` }} />
      {/* Patterned cloth border along the bottom edge: fine gold check on deep navy */}
      <div style={{ position: "absolute", left: 0, top: height - height * 0.045, width, height: height * 0.045, backgroundColor: "#0d1b4c", backgroundImage: "repeating-linear-gradient(0deg, rgba(212, 175, 55, 0.4) 0 3px, transparent 3px 34px), repeating-linear-gradient(90deg, rgba(212, 175, 55, 0.4) 0 3px, transparent 3px 34px)", borderTop: "3px solid rgba(212, 175, 55, 0.7)" }} />
      </div>
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
