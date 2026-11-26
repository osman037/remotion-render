import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const EightNightsOneByOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;
  const centerX = width * 0.68;
  const baseY = height * 0.76;
  const gradientAngle = progress * 90;
  const globalPulse = Math.sin(progress * twoPi);
  const cameraScale = 1 + progress * 0.05;
  const washBreath = Math.sin(frame * 0.07);
  const washBreath2 = Math.sin(frame * 0.11 + 1.3);

  const candles = [
    { frac: -0.2, h: 0.2, shamash: false },
    { frac: -0.15, h: 0.23, shamash: false },
    { frac: -0.1, h: 0.26, shamash: false },
    { frac: -0.05, h: 0.28, shamash: false },
    { frac: 0, h: 0.34, shamash: true },
    { frac: 0.05, h: 0.28, shamash: false },
    { frac: 0.1, h: 0.26, shamash: false },
    { frac: 0.15, h: 0.23, shamash: false },
    { frac: 0.2, h: 0.2, shamash: false },
  ];

  const lightFrameFor = (i: number): number => {
    if (candles[i].shamash) {
      return 0;
    }
    const order = i < 4 ? i : i - 1;
    return 60 + order * 96;
  };

  const litFor = (i: number): number => {
    const lightFrame = lightFrameFor(i);
    return interpolate(frame, [lightFrame, lightFrame + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  let litCount = 0;
  for (let i = 0; i < candles.length; i++) {
    litCount += litFor(i);
  }

  // ---- 1. Bokeh orbs: 68 large soft orbs, right side only (x 0.42 - 0.98) ----
  const bokeh = Array.from({ length: 68 }, (_, i) => {
    const bx = (0.42 + seededRandom(i * 101 + 7) * 0.56) * width;
    const by = (0.03 + seededRandom(i * 103 + 11) * 0.68) * height;
    const radius = 46 + seededRandom(i * 107 + 13) * 170;
    const gold = seededRandom(i * 109 + 17) > 0.42;
    const phase = seededRandom(i * 113 + 19) * twoPi;
    const cycles = 1 + Math.floor(seededRandom(i * 127 + 23) * 3);
    const baseO = 0.05 + seededRandom(i * 131 + 29) * 0.11;
    return { bx, by, radius, gold, phase, cycles, baseO };
  });

  // ---- 2a. Curtain folds: 48 thin vertical stripes, right side only ----
  const curtain = Array.from({ length: 48 }, (_, i) => {
    const x = width * 0.44 + (i / 48) * width * 0.56;
    const w = (width * 0.56) / 48 + 6;
    const fold = seededRandom(i * 137 + 31);
    const phase = seededRandom(i * 139 + 37) * twoPi;
    return { x, w, fold, phase };
  });
  const washCenter = width * (0.44 + 0.5 * (0.5 + 0.5 * Math.sin(progress * twoPi)));

  // ---- 2b. Twinkling stars: 92 tiny stars, upper right only ----
  const stars = Array.from({ length: 92 }, (_, i) => {
    const sx = (0.45 + seededRandom(i * 149 + 41) * 0.53) * width;
    const sy = (0.02 + seededRandom(i * 151 + 43) * 0.33) * height;
    const size = 2 + seededRandom(i * 157 + 47) * 5;
    const phase = seededRandom(i * 163 + 53) * twoPi;
    const cycles = 1 + Math.floor(seededRandom(i * 167 + 59) * 4);
    const gold = seededRandom(i * 173 + 61) > 0.5;
    return { sx, sy, size, phase, cycles, gold };
  });

  // ---- 5. Embers: 44 rising embers from lit flames ----
  const embers = Array.from({ length: 44 }, (_, i) => {
    const candleIndex = Math.floor(seededRandom(i * 5 + 2) * 9);
    const lightFrame = lightFrameFor(candleIndex);
    const offset = seededRandom(i * 11 + 3);
    const cycle = ((frame - lightFrame) * 0.004 + offset) % 1;
    const cx = centerX + candles[candleIndex].frac * width;
    const candleTop = baseY - candles[candleIndex].h * height;
    const ex = cx + (seededRandom(i * 13 + 4) - 0.5) * 70 + Math.sin(frame * 0.05 + i) * 18;
    const ey = candleTop - 130 - cycle * height * 0.22;
    const size = 3 + seededRandom(i * 17 + 6) * 6;
    const o = litFor(candleIndex) * Math.max(0, 1 - cycle) * 0.6;
    return { x: ex, y: ey, size, o };
  });

  // ---- 3. Film grain: 264 dots, per-frame changing opacity ----
  const grain = Array.from({ length: 264 }, (_, i) => {
    const baseX = seededRandom(i * 37 + 11);
    const baseY = seededRandom(i * 41 + 13);
    const driftX = Math.sin(frame * 0.11 + i * 1.7) * 9;
    const driftY = Math.cos(frame * 0.09 + i * 2.1) * 7;
    const gx = ((baseX + frame * 0.0004 * (0.5 + seededRandom(i * 53 + 23))) % 1) * width + driftX;
    const gy = ((baseY + frame * 0.0003 * (0.5 + seededRandom(i * 59 + 29))) % 1) * height + driftY;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.03 + Math.abs(Math.sin(frame * 0.23 + i * 2.3)) * 0.07;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  // ---- 4. Wood grain: 48 lines ----
  const woodLines = Array.from({ length: 48 }, (_, i) => {
    const ly = baseY + height * 0.125 + seededRandom(i * 61 + 31) * height * 0.125;
    const lx = (0.02 + seededRandom(i * 67 + 37) * 0.12) * width;
    const lw = (0.5 + seededRandom(i * 71 + 41) * 0.46) * width;
    const lo = 0.05 + seededRandom(i * 73 + 43) * 0.13 + Math.abs(Math.sin(frame * 0.05 + i)) * 0.04;
    const warm = seededRandom(i * 79 + 47) > 0.5;
    return { x: lx, y: ly, w: lw, o: lo, warm };
  });

  // ---- 4. Tablecloth check pattern: 12 horizontal + 58 vertical lines ----
  const clothH = Array.from({ length: 12 }, (_, k) => {
    return baseY + height * 0.125 + (k / 11) * height * 0.135;
  });
  const clothV = Array.from({ length: 58 }, (_, k) => {
    return (k / 57) * width;
  });

  // ---- 5. Rotating light ray fan: 14 rays behind the menorah ----
  const rays = Array.from({ length: 14 }, (_, i) => {
    const angle = -70 + (i / 13) * 140;
    const rayO = 0.025 + seededRandom(i * 179 + 67) * 0.035;
    const rayW = 34 + seededRandom(i * 181 + 71) * 60;
    return { angle, rayO, rayW };
  });
  const rayRotation = progress * 90;

  const fadeIn = 1 - interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOpacity = Math.max(fadeIn, fadeOut);

  const tableShimmer = 0.1 + Math.abs(Math.sin(progress * twoPi * 2)) * 0.08;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: `linear-gradient(${gradientAngle}deg, #03051a, #0a1a4e, #123a8f, #0d2a6e, #03051a)` }}>
      <div style={{ width, height, position: "relative", transform: `scale(${cameraScale})`, transformOrigin: "68% 62%" }}>
      <div style={{ position: "absolute", left: centerX - width * 0.32 + Math.sin(progress * twoPi) * 60, top: height * 0.3 + Math.cos(progress * twoPi) * 40, width: width * 0.55, height: height * 0.55, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 190, 60, ${0.12 + litCount * 0.04 + washBreath * 0.03}), transparent 65%)` }} />
      <div style={{ position: "absolute", left: width * 0.1 + Math.sin(frame * 0.02) * 120, top: height * 0.05 + Math.cos(frame * 0.017) * 60, width: width * 0.7, height: height * 0.7, borderRadius: "50%", background: `radial-gradient(circle, rgba(70, 120, 255, ${0.08 + washBreath2 * 0.025}), transparent 65%)` }} />

      {/* Curtain folds, right side only */}
      {curtain.map((stripe, i) => {
        const dist = Math.abs(stripe.x - washCenter) / (width * 0.25);
        const washBoost = Math.max(0, 1 - dist) * 0.28;
        const foldO = 0.16 + stripe.fold * 0.22 + Math.sin(frame * 0.03 + stripe.phase) * 0.06 + washBoost;
        const light = i % 2 === 0;
        return (
          <div key={i} style={{ position: "absolute", left: stripe.x, top: 0, width: stripe.w, height: height * 0.88, background: light ? `linear-gradient(180deg, rgba(38, 62, 140, ${foldO}), rgba(6, 12, 44, ${foldO * 0.8}))` : `linear-gradient(180deg, rgba(8, 16, 54, ${foldO}), rgba(3, 6, 24, ${foldO * 0.8}))`, opacity: 0.85 }} />
        );
      })}
      {/* Slow moving light wash across the curtain */}
      <div style={{ position: "absolute", left: washCenter - width * 0.14, top: 0, width: width * 0.28, height: height * 0.88, background: `linear-gradient(90deg, transparent, rgba(255, 214, 120, ${0.1 + washBreath * 0.03}), transparent)` }} />

      {/* Twinkling stars, upper right only */}
      {stars.map((star, i) => {
        const tw = 0.15 + 0.55 * Math.abs(Math.sin(progress * twoPi * star.cycles + star.phase));
        return (
          <div key={i} style={{ position: "absolute", left: star.sx, top: star.sy, width: star.size, height: star.size, borderRadius: "50%", backgroundColor: star.gold ? "#ffd166" : "#ffffff", opacity: tw, filter: `drop-shadow(0 0 ${star.size * 2}px ${star.gold ? "#ffb703" : "#aaccff"})` }} />
        );
      })}

      {/* Bokeh orbs, right side only, drifting and twinkling */}
      {bokeh.map((orb, i) => {
        const dx = Math.sin(progress * twoPi + orb.phase) * 26;
        const dy = Math.cos(progress * twoPi * 2 + orb.phase) * 16;
        const tw = 0.65 + 0.35 * Math.sin(progress * twoPi * orb.cycles + orb.phase);
        const o = orb.baseO * tw;
        return (
          <div key={i} style={{ position: "absolute", left: orb.bx + dx - orb.radius, top: orb.by + dy - orb.radius, width: orb.radius * 2, height: orb.radius * 2, borderRadius: "50%", background: orb.gold ? `radial-gradient(circle, rgba(255, 205, 90, ${o}) 0%, rgba(255, 160, 40, ${o * 0.45}) 45%, transparent 72%)` : `radial-gradient(circle, rgba(140, 180, 255, ${o}) 0%, rgba(70, 110, 255, ${o * 0.45}) 45%, transparent 72%)`, opacity: 1 }} />
        );
      })}

      {/* Rotating light ray fan behind the menorah */}
      {rays.map((ray, i) => (
        <div key={i} style={{ position: "absolute", left: centerX - ray.rayW / 2, top: baseY - height * 0.58, width: ray.rayW, height: height * 0.62, background: `linear-gradient(180deg, rgba(255, 205, 100, ${ray.rayO + litCount * 0.004}), transparent 85%)`, opacity: 0.9, transform: `rotate(${ray.angle + rayRotation}deg)`, transformOrigin: "50% 100%" }} />
      ))}

      {/* Table surface */}
      <div style={{ position: "absolute", left: 0, top: baseY + height * 0.12, width, height: height * 0.14, background: "linear-gradient(180deg, #2a1a08, #17100a)" }} />
      {/* Tablecloth check pattern */}
      {clothH.map((y, k) => (
        <div key={k} style={{ position: "absolute", left: 0, top: y, width, height: 2, backgroundColor: "#c9a35a", opacity: 0.1 + Math.abs(Math.sin(frame * 0.04 + k)) * 0.05 }} />
      ))}
      {clothV.map((x, k) => (
        <div key={k} style={{ position: "absolute", left: x, top: baseY + height * 0.12, width: 2, height: height * 0.14, backgroundColor: "#c9a35a", opacity: 0.09 + Math.abs(Math.sin(frame * 0.04 + k * 1.3)) * 0.05 }} />
      ))}
      {/* Tablecloth diamond dots at check intersections, right side */}
      {Array.from({ length: 40 }, (_, i) => {
        const dx = (0.46 + seededRandom(i * 191 + 73) * 0.5) * width;
        const dy = baseY + height * 0.13 + seededRandom(i * 193 + 79) * height * 0.12;
        const ds = 4 + seededRandom(i * 197 + 83) * 6;
        const dO = 0.1 + Math.abs(Math.sin(frame * 0.06 + i * 1.9)) * 0.12;
        return (
          <div key={i} style={{ position: "absolute", left: dx, top: dy, width: ds, height: ds, backgroundColor: "#ffd166", opacity: dO, transform: "rotate(45deg)" }} />
        );
      })}
      <div style={{ position: "absolute", left: centerX - width * 0.28, top: baseY + height * 0.12, width: width * 0.56, height: height * 0.02, background: `linear-gradient(90deg, transparent, rgba(255, 190, 60, ${tableShimmer + litCount * 0.03}), transparent)` }} />
      {woodLines.map((line, i) => (
        <div key={i} style={{ position: "absolute", left: line.x, top: line.y, width: line.w, height: 2 + seededRandom(i * 83 + 53) * 2, backgroundColor: line.warm ? "#ffca7a" : "#6b4a1f", opacity: line.o, borderRadius: 2 }} />
      ))}
      {/* Shimmering gold reflection under each candle, grows as it lights */}
      {candles.map((candle, i) => {
        const cx = centerX + candle.frac * width;
        const lit = litFor(i);
        const reflO = lit * (0.22 + 0.12 * Math.abs(Math.sin(frame * 0.1 + i * 2.2)));
        return (
          <div key={i} style={{ position: "absolute", left: cx - 46, top: baseY + height * 0.125, width: 92, height: height * 0.1 * (0.4 + lit * 0.6), background: `linear-gradient(180deg, rgba(255, 190, 60, ${reflO}), rgba(255, 140, 20, ${reflO * 0.4}) 55%, transparent)`, opacity: 1 }} />
        );
      })}
      <div style={{ position: "absolute", left: centerX - width * 0.16, top: baseY + height * 0.02, width: width * 0.32, height: height * 0.12, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255, 170, 40, ${0.1 + litCount * 0.03}), transparent 70%)` }} />

      {/* Menorah */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${centerX - width * 0.2} ${baseY} Q ${centerX} ${baseY + height * 0.16} ${centerX + width * 0.2} ${baseY}`} stroke="#e8b64c" strokeWidth={30} fill="none" strokeLinecap="round" />
        <path d={`M ${centerX} ${baseY + height * 0.02} L ${centerX} ${baseY + height * 0.1}`} stroke="#e8b64c" strokeWidth={30} strokeLinecap="round" />
        <rect x={centerX - width * 0.11} y={baseY + height * 0.1} width={width * 0.22} height={height * 0.025} rx={height * 0.012} fill="#d4a017" />
      </svg>
      {candles.map((candle, i) => {
        const cx = centerX + candle.frac * width;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        const lit = litFor(i);
        const flicker = Math.sin(frame * 0.42 + i * 1.7) * 0.85 + Math.sin(frame * 1.13 + i * 2.9) * 0.5;
        const flameScale = lit * (1 + flicker * 0.22);
        const flameOpacity = lit * (0.8 + flicker * 0.18);
        const glow = 40 + flicker * 26 + litCount * 2;
        const haloOpacity = lit * (0.4 + flicker * 0.22 + litCount * 0.02);
        const slowPulse = 0.5 + 0.5 * Math.sin(progress * twoPi * 2 + i * 1.3);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.012, top: candleTop, width: width * 0.024, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #ffffff, #dbeafe)", borderRadius: width * 0.012 }} />
            <div style={{ position: "absolute", left: cx - 2, top: candleTop - 26, width: 4, height: 26, backgroundColor: "#3a2a12" }} />
            {/* Wide slow-pulsing halo behind every flame */}
            <div style={{ position: "absolute", left: cx - (150 + slowPulse * 50) * flameScale, top: candleTop - (260 + slowPulse * 40) * flameScale, width: (300 + slowPulse * 100) * flameScale, height: (260 + slowPulse * 80) * flameScale, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 190, 60, 0.3) 0%, rgba(255, 120, 0, 0.12) 55%, transparent 75%)", opacity: lit * (0.25 + slowPulse * 0.3) }} />
            <div style={{ position: "absolute", left: cx - (70 + flicker * 14) * flameScale, top: candleTop - (150 + flicker * 12) * flameScale, width: (140 + flicker * 28) * flameScale, height: (130 + flicker * 24) * flameScale, borderRadius: "50%", background: "radial-gradient(circle, rgba(255, 180, 40, 0.55) 0%, rgba(255, 120, 0, 0.22) 55%, transparent 75%)", opacity: haloOpacity, transform: `rotate(${flicker * 7}deg)` }} />
            <div style={{ position: "absolute", left: cx - 38 * flameScale, top: candleTop - 158 * flameScale, width: 76 * flameScale, height: 138 * flameScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: flameOpacity, filter: `drop-shadow(0 0 ${glow}px #ffb703)`, transform: `rotate(${flicker * 7}deg)` }} />
            <div style={{ position: "absolute", left: cx - 15, top: candleTop - 100, width: 30, height: 62, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: flameOpacity * 0.85 }} />
          </div>
        );
      })}
      {embers.map((ember, i) => (
        <div key={i} style={{ position: "absolute", left: ember.x, top: ember.y, width: ember.size, height: ember.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: ember.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      {/* Film grain over everything, full frame, low opacity */}
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
        ))}
      </svg>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, backgroundColor: "#000000", opacity: fadeOpacity }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 68% 62%, rgba(255, 190, 60, ${0.1 + litCount * 0.025 + washBreath * 0.03}), transparent 60%)` }} />
    </div>
  );
};
