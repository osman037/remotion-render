import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const FestivalLightsCountdown: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;

  // 8 steps, one per number. Step 0 = number 8, candle 1 lights. Step 7 = number 1, candle 8 lights.
  const stepIndex = Math.min(7, Math.floor(progress * 8));
  const local = progress * 8 - stepIndex;
  const number = 8 - stepIndex;
  const litCount = stepIndex + 1;

  const fadeIn = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.5, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const masterOpacity = fadeIn * fadeOut;

  // Very slow camera push-in: 1.00 to 1.05 over the 15s.
  const pushScale = 1 + progress * 0.05;

  const gradientAngle = progress * 360;
  const glowStrength = litCount / 8;
  const globalPulse = Math.sin(progress * twoPi);
  // Breathes once per number step: 0 at the change, peaks mid-step.
  const stepPulse = Math.sin(local * Math.PI);

  const numeralOpacity = interpolate(local, [0, 0.15, 0.78, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const numeralScale = interpolate(local, [0, 0.25, 1], [0.86, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Numeral centre-left, so the right third stays empty dark blue copy space.
  const numeralX = width * 0.32;
  const numeralY = height * 0.44;

  // 8 candles in a row along the bottom, inside the left two thirds.
  const candleBaseY = height * 0.84;
  const candles = Array.from({ length: 8 }, (_, i) => {
    const cx = width * (0.1 + (i / 7) * 0.48);
    const candleHeight = height * (0.09 + seededRandom(i * 5 + 2) * 0.03);
    const candleTop = candleBaseY - candleHeight;
    const lit = i < litCount;
    // This candle ignites during its own step (local 0 to 0.3 of that step).
    const ignite =
      i === stepIndex
        ? interpolate(local, [0, 0.3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : lit
          ? 1
          : 0;
    // Stronger, two-frequency flame flicker.
    const flicker =
      Math.sin(progress * twoPi * 9 + i * 1.7) +
      0.5 * Math.sin(progress * twoPi * 17 + i * 2.9);
    const flameScale = ignite * (1 + flicker * 0.16);
    const flameOpacity = ignite * Math.min(1, 0.8 + flicker * 0.18);
    return { cx, candleHeight, candleTop, lit, ignite, flicker, flameScale, flameOpacity };
  });

  // Embers rise only from candles that are already lit. Raised to 72.
  const embers = Array.from({ length: 72 }, (_, i) => {
    const candleIdx = i % 8;
    const candle = candles[candleIdx];
    const offset = seededRandom(i * 11 + 2);
    const cycle = (progress * (0.5 + seededRandom(i * 5 + 1) * 0.9) + offset) % 1;
    const ex =
      candle.cx +
      (seededRandom(i * 13 + 4) - 0.5) * width * 0.03 +
      Math.sin(progress * twoPi * 2 + i) * 14;
    const ey = candle.candleTop - 40 - cycle * height * 0.3;
    const size = 3 + seededRandom(i * 17 + 6) * 8;
    const o = candle.lit ? (1 - cycle) * (0.4 + seededRandom(i * 19 + 8) * 0.5) : 0;
    return { x: ex, y: ey, size, o };
  });

  // Full-frame animated film grain: 260 dots, positions and opacity shift every frame.
  // Grain is the ONLY texture over the right copy space.
  const grain = Array.from({ length: 260 }, (_, i) => {
    const baseX = seededRandom(i * 37 + 11) * width;
    const baseY = seededRandom(i * 41 + 13) * height;
    const gx = baseX + Math.sin(frame * 0.35 + i * 2.1) * 6;
    const gy = baseY + Math.cos(frame * 0.3 + i * 1.7) * 6;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.06 + Math.abs(Math.sin(frame * 0.25 + i * 2.3)) * 0.22;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  // Twinkling stars confined to the left two thirds only. Raised to 170.
  const stars = Array.from({ length: 170 }, (_, i) => {
    const sx = seededRandom(i * 23 + 3) * width * 0.64;
    const sy = seededRandom(i * 29 + 7) * height * 0.6;
    const size = 3 + seededRandom(i * 31 + 9) * 7;
    const cycles = 2 + (i % 3);
    const o = 0.15 + Math.abs(Math.sin(progress * twoPi * cycles + i * 1.1)) * 0.55;
    return { x: sx, y: sy, size, o };
  });

  // 4-point sparkle diamonds, left two thirds only.
  const sparkles = Array.from({ length: 40 }, (_, i) => {
    const sx = seededRandom(i * 53 + 5) * width * 0.64;
    const sy = seededRandom(i * 59 + 11) * height * 0.7;
    const size = 6 + seededRandom(i * 61 + 15) * 16;
    const cycles = 2 + (i % 4);
    const o = 0.1 + Math.abs(Math.sin(progress * twoPi * cycles + i * 2.2)) * 0.6;
    const gold = seededRandom(i * 67 + 21) > 0.45;
    return { x: sx, y: sy, size, o, gold };
  });

  // Large soft bokeh orbs, left two thirds only: 72, gold and blue, drifting and twinkling.
  const bokeh = Array.from({ length: 72 }, (_, i) => {
    const baseX = seededRandom(i * 71 + 3) * width * 0.64;
    const baseY = seededRandom(i * 73 + 7) * height * 0.82;
    const size = 40 + seededRandom(i * 79 + 11) * 180;
    const phase = seededRandom(i * 83 + 13) * twoPi;
    const bx = baseX + Math.sin(progress * twoPi + phase) * 42;
    const by = baseY + Math.cos(progress * twoPi + phase) * 30;
    const gold = seededRandom(i * 89 + 17) > 0.42;
    const twinkle = 0.6 + 0.4 * Math.sin(progress * twoPi * 2 + i * 1.3);
    const o = (0.05 + seededRandom(i * 97 + 19) * 0.3) * twinkle;
    return { x: bx, y: by, size, o, gold };
  });

  // Vertical curtain folds across the left two thirds: 26 thin gradient stripes,
  // each breathing with the slow light wash.
  const foldW = (width * 0.66) / 26;
  const folds = Array.from({ length: 26 }, (_, i) => {
    const o = 0.45 + 0.55 * Math.abs(Math.sin(progress * twoPi + i * 0.9));
    return { left: i * foldW, o };
  });

  // Rings expand on each number change: they restart with every step (local), not continuously.
  // Raised to 5 rings with varying opacity.
  const rings = [0, 1, 2, 3, 4].map((i) => {
    const ringProgress = (local + i / 5) % 1;
    return { ringProgress, widthPx: 2 + (i % 3), peak: 0.5 - i * 0.07 };
  });

  // Rotating light ray fan behind the numeral: 16 rays, one full turn over the clip.
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = progress * 360 + i * 22.5;
    const o = 0.5 + 0.5 * Math.sin(progress * twoPi * 2 + i * 1.1);
    return { angle, o };
  });

  // Fine texture lines under the candle row, left two thirds only. Raised to 14.
  const textureLines = Array.from({ length: 14 }, (_, i) => {
    return {
      y: candleBaseY + height * (0.055 + i * 0.008),
      w: width * (0.5 - i * 0.012),
      o: 0.08 + (i % 2) * 0.08,
    };
  });

  // Patterned gold diamond border under the candle row.
  const diamonds = Array.from({ length: 24 }, (_, i) => {
    const x = width * (0.07 + (i / 23) * 0.54);
    const o = 0.4 + 0.35 * Math.abs(Math.sin(progress * twoPi * 3 + i * 1.4));
    return { x, o };
  });

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        transform: `scale(${pushScale})`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          width,
          height,
          position: "relative",
          overflow: "hidden",
          opacity: masterOpacity,
          background: `linear-gradient(${gradientAngle}deg, #04072a, #0a1a5e, #123a8f, #0a1a5e, #04072a)`,
        }}
      >
        {/* Curtain folds, left two thirds only */}
        {folds.map((fold, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: fold.left,
              top: 0,
              width: foldW,
              height,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.07), rgba(0,0,0,0.14), rgba(255,255,255,0.04))",
              opacity: fold.o,
            }}
          />
        ))}
        {/* Slow moving light wash over the folds */}
        <div
          style={{
            position: "absolute",
            left: width * 0.05 + Math.sin(progress * twoPi) * width * 0.12,
            top: -height * 0.1,
            width: width * 0.35,
            height: height * 1.2,
            background:
              "linear-gradient(90deg, transparent, rgba(255,220,120,0.12), transparent)",
            transform: "skewX(-12deg)",
          }}
        />
        {/* Animated diagonal stripe texture, left two thirds only */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: width * 0.66,
            height,
            background:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 6px, transparent 6px, transparent 26px)",
            backgroundPosition: `${progress * 1200}px 0`,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height,
            background: `linear-gradient(${-gradientAngle}deg, rgba(18, 58, 143, 0.35), transparent 45%, rgba(255, 190, 60, 0.12) 70%, transparent)`,
            opacity: 0.5 + globalPulse * 0.12,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: numeralX - width * 0.3 + Math.sin(progress * twoPi) * 120,
            top: height * 0.3 + Math.cos(progress * twoPi) * 80,
            width: width * 0.55,
            height: height * 0.55,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255, 190, 60, ${0.12 + glowStrength * 0.28 + globalPulse * 0.03}), transparent 65%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: width * 0.05 + Math.cos(progress * twoPi * 2) * 140,
            top: height * 0.55 + Math.sin(progress * twoPi * 2) * 90,
            width: width * 0.4,
            height: height * 0.4,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(80, 160, 255, 0.2), transparent 65%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: numeralX - width * 0.28,
            top: numeralY - height * 0.28,
            width: width * 0.56,
            height: height * 0.56,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255, 190, 60, ${0.1 + glowStrength * 0.2 + stepPulse * 0.12}), transparent 65%)`,
          }}
        />
        {/* Rotating light ray fan behind the numeral */}
        {rays.map((ray, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: numeralX,
              top: numeralY - 7,
              width: width * 0.3,
              height: 14,
              transform: `rotate(${ray.angle}deg)`,
              transformOrigin: "0 50%",
              background:
                "linear-gradient(90deg, rgba(255, 209, 102, 0.12), rgba(255, 209, 102, 0.03) 60%, transparent)",
              borderRadius: 7,
              opacity: ray.o,
            }}
          />
        ))}
        {/* Bokeh orbs, left two thirds only */}
        {bokeh.map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.x - orb.size / 2,
              top: orb.y - orb.size / 2,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: orb.gold
                ? "radial-gradient(circle, rgba(255, 209, 102, 0.55), rgba(255, 157, 0, 0.18) 55%, transparent 72%)"
                : "radial-gradient(circle, rgba(140, 190, 255, 0.55), rgba(80, 140, 255, 0.18) 55%, transparent 72%)",
              opacity: orb.o,
            }}
          />
        ))}
        <svg
          style={{ position: "absolute", left: 0, top: 0, width, height }}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {stars.map((star, i) => (
            <circle key={i} cx={star.x} cy={star.y} r={star.size} fill="#ffffff" fillOpacity={star.o} />
          ))}
          {sparkles.map((spark, i) => (
            <polygon
              key={`s${i}`}
              points={`${spark.x},${spark.y - spark.size} ${spark.x + spark.size * 0.28},${spark.y - spark.size * 0.28} ${spark.x + spark.size},${spark.y} ${spark.x + spark.size * 0.28},${spark.y + spark.size * 0.28} ${spark.x},${spark.y + spark.size} ${spark.x - spark.size * 0.28},${spark.y + spark.size * 0.28} ${spark.x - spark.size},${spark.y} ${spark.x - spark.size * 0.28},${spark.y - spark.size * 0.28}`}
              fill={spark.gold ? "#ffd166" : "#cfe4ff"}
              fillOpacity={spark.o}
            />
          ))}
        </svg>
        {/* Gold medallion ring around the numeral, plus a rotating dashed ring */}
        <div
          style={{
            position: "absolute",
            left: numeralX - width * 0.19,
            top: numeralY - width * 0.19,
            width: width * 0.38,
            height: width * 0.38,
            borderRadius: "50%",
            border: "2px solid rgba(255, 209, 102, 0.35)",
          }}
        />
        <svg
          style={{ position: "absolute", left: 0, top: 0, width, height }}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          <circle
            cx={numeralX}
            cy={numeralY}
            r={width * 0.21}
            fill="none"
            stroke="#ffd166"
            strokeWidth={3}
            strokeDasharray="20 30"
            opacity={0.35}
            transform={`rotate(${progress * 360} ${numeralX} ${numeralY})`}
          />
        </svg>
        {rings.map((ring, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: numeralX - ring.ringProgress * width * 0.22,
              top: numeralY - ring.ringProgress * width * 0.22,
              width: ring.ringProgress * width * 0.44,
              height: ring.ringProgress * width * 0.44,
              borderRadius: "50%",
              border: `${ring.widthPx}px solid #ffd166`,
              opacity: (1 - ring.ringProgress) * ring.peak,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: numeralX - width * 0.16,
            top: numeralY - height * 0.26,
            width: width * 0.32,
            height: height * 0.52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${numeralScale})`,
            opacity: numeralOpacity,
            color: "#ffd166",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: height * 0.42,
            fontWeight: 400,
            lineHeight: 1,
            textShadow: "0 0 60px rgba(255, 190, 60, 0.75), 0 0 140px rgba(255, 157, 0, 0.45)",
          }}
        >
          {number}
        </div>
        <div
          style={{
            position: "absolute",
            left: width * 0.06,
            top: candleBaseY + height * 0.02,
            width: width * 0.56,
            height: height * 0.02,
            background: "linear-gradient(90deg, #d4a017, #e8b64c, #d4a017)",
            borderRadius: height * 0.01,
            opacity: 0.9,
          }}
        />
        {textureLines.map((line, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: width * 0.06,
              top: line.y,
              width: line.w,
              height: 2,
              background: "linear-gradient(90deg, rgba(212, 160, 23, 0.9), rgba(232, 182, 76, 0.5), transparent)",
              opacity: line.o,
            }}
          />
        ))}
        {diamonds.map((diamond, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: diamond.x,
              top: candleBaseY + height * 0.045,
              width: 10,
              height: 10,
              transform: "rotate(45deg)",
              backgroundColor: "#e8b64c",
              opacity: diamond.o,
            }}
          />
        ))}
        {candles.map((candle, i) => (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: candle.cx - width * 0.011,
                top: candle.candleTop,
                width: width * 0.022,
                height: candle.candleHeight,
                background: "linear-gradient(180deg, #ffffff, #dbeafe)",
                borderRadius: width * 0.011,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: candle.cx - width * 0.007,
                top: candle.candleTop + 4,
                width: 4,
                height: candle.candleHeight - 8,
                backgroundColor: "rgba(255, 255, 255, 0.65)",
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: candle.cx - 2,
                top: candle.candleTop - 24,
                width: 4,
                height: 24,
                backgroundColor: "#3a2a12",
              }}
            />
            {/* Pulsing halo behind every flame */}
            <div
              style={{
                position: "absolute",
                left: candle.cx - 110,
                top: candle.candleTop - 150,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255, 190, 60, 0.5), rgba(255, 157, 0, 0.15) 55%, transparent 70%)",
                opacity:
                  candle.flameOpacity *
                  0.55 *
                  (0.75 + 0.25 * Math.sin(progress * twoPi * 7 + i * 1.3)),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: candle.cx - 34 * candle.flameScale,
                top: candle.candleTop - 140 * candle.flameScale,
                width: 68 * candle.flameScale,
                height: 124 * candle.flameScale,
                borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
                background:
                  "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)",
                opacity: candle.flameOpacity,
                filter: `drop-shadow(0 0 ${28 + candle.flicker * 12}px #ffb703)`,
                transform: `rotate(${candle.flicker * 5}deg)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: candle.cx - 13,
                top: candle.candleTop - 88,
                width: 26,
                height: 54,
                borderRadius: "50%",
                backgroundColor: "#fffbe6",
                opacity: candle.flameOpacity * 0.85,
              }}
            />
            {/* Flame reflection streak on the table under each lit candle */}
            <div
              style={{
                position: "absolute",
                left: candle.cx - 6,
                top: candleBaseY + height * 0.02,
                width: 12,
                height: height * 0.06,
                background:
                  "linear-gradient(180deg, rgba(255, 190, 60, 0.5), transparent)",
                opacity: candle.ignite * 0.5,
              }}
            />
          </div>
        ))}
        {embers.map((ember, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ember.x,
              top: ember.y,
              width: ember.size,
              height: ember.size,
              borderRadius: "50%",
              backgroundColor: "#ffca3a",
              opacity: ember.o,
              filter: "drop-shadow(0 0 10px #ffb703)",
            }}
          />
        ))}
        <svg
          style={{ position: "absolute", left: 0, top: 0, width, height }}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {grain.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={dot.gold ? "#ffd166" : "#aaccff"}
              fillOpacity={dot.o}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: candleBaseY + height * 0.04,
            width: width * 0.66,
            height: height * 0.1,
            background: `linear-gradient(180deg, rgba(255, 190, 60, ${0.1 + glowStrength * 0.22 + stepPulse * 0.08}), transparent)`,
          }}
        />
      </div>
    </div>
  );
};
