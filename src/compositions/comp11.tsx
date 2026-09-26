/**
 * MFAExpiryTimer.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * "MFA Code Expiry Radial Timer" - a calm, precise TOTP expiring-code
 * state machine: six digit boxes ringed by a depleting radial countdown,
 * an EXPIRES IN readout, a CODE EXPIRED stamp beat, a resend + refill,
 * and a four-pill lifecycle strip (ISSUED -> ACTIVE -> EXPIRED -> RESENT).
 *
 * Register in Root.tsx:
 *   <Composition id="MFAExpiryTimer" component={MFAExpiryTimer}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette - minimal dark slate, restrained indigo, amber warning, red expired
// ---------------------------------------------------------------------------
const BG = '#0B0E14';
const INK = '#F8FAFC';
const MUTED = 'rgba(148,163,184,0.72)';
const FAINT = 'rgba(148,163,184,0.38)';
const HAIRLINE = 'rgba(148,163,184,0.14)';
const INDIGO = '#6366F1';
const INDIGO_LIGHT = '#818CF8';
const CYAN = '#22D3EE';
const AMBER = '#FBBF24';
const AMBER_DEEP = '#F59E0B';
const RED = '#F87171';
const RED_DEEP = '#EF4444';
const GREEN = '#34D399';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Canvas geometry (device px, 4K)
// ---------------------------------------------------------------------------
const CX = 1920;
const RING_CY = 980;
const RING_R = 560;
const RING_STROKE = 26;
const CIRC = 2 * Math.PI * RING_R;

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) - 900 frames = 15 s
//   0-120    intro      | 120-600  build (code active, ring draining)
//   600-780  payoff     | 780-900  resolve (calm hold on fresh code)
// ---------------------------------------------------------------------------
const DRAIN_START = 120;
const DRAIN_END = 620;
const EXPIRE_AT = 620;
const RESEND_AT = 700;
const REFILL_END = 760;
const RESOLVE_AT = 780;

// ---------------------------------------------------------------------------
// Data - the two codes (deterministic, no randomness anywhere)
// ---------------------------------------------------------------------------
const DIGITS_A = ['4', '8', '2', '9', '1', '6'];
const DIGITS_B = ['7', '3', '5', '0', '8', '4'];

const BOX_W = 200;
const BOX_H = 260;
const BOX_GAP = 28;
const BOX_RAD = 20;
const BOXES_W = DIGITS_A.length * BOX_W + (DIGITS_A.length - 1) * BOX_GAP;
const BOX_X0 = CX - BOXES_W / 2;
const BOX_Y = RING_CY - BOX_H / 2;

// ---------------------------------------------------------------------------
// Deterministic state helpers
// ---------------------------------------------------------------------------
/** 30-second window progress: 1 -> 0 over the drain, refill, gentle drain. */
const ringProgress = (f: number): number => {
  if (f < DRAIN_START) return 1;
  if (f < DRAIN_END) return 1 - (f - DRAIN_START) / (DRAIN_END - DRAIN_START);
  if (f < RESEND_AT) return 0;
  if (f < REFILL_END) return (f - RESEND_AT) / (REFILL_END - RESEND_AT);
  return 1 - ((f - REFILL_END) / (900 - REFILL_END)) * (4 / 30);
};

/** Seconds remaining on the code for the EXPIRES IN readout. */
const secondsLeft = (f: number): number => {
  if (f < DRAIN_START) return 30;
  if (f < DRAIN_END) return 30 * (1 - (f - DRAIN_START) / (DRAIN_END - DRAIN_START));
  if (f < RESEND_AT) return 0;
  if (f < REFILL_END) return 30;
  return Math.max(0, 30 - ((f - REFILL_END) / (900 - REFILL_END)) * 4);
};

const fmtTime = (s: number): string => {
  const whole = Math.ceil(Math.max(0, Math.min(30, s)));
  return `00:${String(whole).padStart(2, '0')}`;
};

/** Lifecycle pill index: 0 ISSUED, 1 ACTIVE, 2 EXPIRED, 3 RESENT, -1 none. */
const activeState = (f: number): number => {
  if (f < 60) return -1;
  if (f < DRAIN_START) return 0;
  if (f < EXPIRE_AT) return 1;
  if (f < RESEND_AT) return 2;
  if (f < RESOLVE_AT) return 3;
  return 1;
};

/** Ring gradient id + accent color by remaining fraction. */
const ringMood = (p: number): {grad: string; accent: string} => {
  if (p <= 0.001) return {grad: 'url(#ringRed)', accent: RED};
  if (p < 0.125) return {grad: 'url(#ringRed)', accent: RED};
  if (p < 0.25) return {grad: 'url(#ringAmber)', accent: AMBER};
  return {grad: 'url(#ringIndigo)', accent: INDIGO_LIGHT};
};

// ---------------------------------------------------------------------------
// Background: drifting hairline grid (very slow, calm)
// ---------------------------------------------------------------------------
const HairlineGrid: React.FC<{frame: number}> = ({frame}) => {
  const shiftX = -((frame * 0.18) % 160);
  const shiftY = -((frame * 0.09) % 160);
  const vLines = useMemo(() => {
    const xs: number[] = [];
    for (let x = -160; x <= 3840 + 160; x += 160) xs.push(x);
    return xs;
  }, []);
  const hLines = useMemo(() => {
    const ys: number[] = [];
    for (let y = -160; y <= 2160 + 160; y += 160) ys.push(y);
    return ys;
  }, []);
  return (
    <g transform={`translate(${shiftX} ${shiftY})`} opacity={0.55}>
      {vLines.map((x) => (
        <line
          key={`v${x}`}
          x1={x}
          y1={-160}
          x2={x}
          y2={2320}
          stroke="rgba(148,163,184,0.055)"
          strokeWidth={1.5}
        />
      ))}
      {hLines.map((y) => (
        <line
          key={`h${y}`}
          x1={-160}
          y1={y}
          x2={4000}
          y2={y}
          stroke="rgba(148,163,184,0.055)"
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Digit box - one of the six code slots
// ---------------------------------------------------------------------------
interface DigitBoxProps {
  digit: string;
  x: number;
  y: number;
  frame: number;
  fps: number;
  enterAt: number;
  opacity: number;
  dimmed: boolean;
}

const DigitBox: React.FC<DigitBoxProps> = ({
  digit,
  x,
  y,
  frame,
  fps,
  enterAt,
  opacity,
  dimmed,
}) => {
  const s = spring({
    frame: Math.max(0, frame - enterAt),
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const rise = interpolate(s, [0, 1], [70, 0]);
  const scale = interpolate(s, [0, 1], [0.72, 1]);
  const border = dimmed ? 'rgba(148,163,184,0.28)' : 'rgba(226,232,240,0.20)';
  return (
    <g
      opacity={opacity * s}
      transform={`translate(${x + BOX_W / 2} ${y + BOX_H / 2 + rise}) scale(${scale}) translate(${-(
        x +
        BOX_W / 2
      )} ${-(y + BOX_H / 2)})`}
    >
      <rect
        x={x}
        y={y}
        width={BOX_W}
        height={BOX_H}
        rx={BOX_RAD}
        fill="rgba(255,255,255,0.028)"
        stroke={border}
        strokeWidth={1.5}
      />
      {/* top edge highlight hairline */}
      <line
        x1={x + BOX_RAD}
        y1={y + 1}
        x2={x + BOX_W - BOX_RAD}
        y2={y + 1}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={1.5}
      />
      <text
        x={x + BOX_W / 2}
        y={y + BOX_H / 2 + 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={MONO}
        fontSize={150}
        fontWeight={700}
        fill={dimmed ? 'rgba(226,232,240,0.75)' : INK}
        style={{
          textShadow: dimmed
            ? 'none'
            : '0 0 34px rgba(129,140,248,0.55), 0 2px 10px rgba(0,0,0,0.6)',
        }}
      >
        {digit}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Lifecycle pill
// ---------------------------------------------------------------------------
interface PillProps {
  label: string;
  x: number;
  active: boolean;
  tone: 'idle' | 'red';
  frame: number;
  fps: number;
  delay: number;
}

const PILL_W = 380;
const PILL_H = 100;
const PILL_Y = 1915;
const PILL_GAP = 90;

const StatePill: React.FC<PillProps> = ({
  label,
  x,
  active,
  tone,
  frame,
  fps,
  delay,
}) => {
  const s = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const rise = interpolate(s, [0, 1], [44, 0]);
  const fill = active
    ? 'rgba(99,102,241,0.16)'
    : tone === 'red'
      ? 'rgba(248,113,113,0.06)'
      : 'rgba(255,255,255,0.02)';
  const stroke = active
    ? INDIGO_LIGHT
    : tone === 'red'
      ? 'rgba(248,113,113,0.55)'
      : 'rgba(148,163,184,0.28)';
  const textFill = active ? INK : tone === 'red' ? RED : MUTED;
  return (
    <g opacity={s} transform={`translate(0 ${rise})`}>
      <rect
        x={x}
        y={PILL_Y}
        width={PILL_W}
        height={PILL_H}
        rx={PILL_H / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 2.5 : 1.5}
        style={
          active
            ? {filter: 'drop-shadow(0 0 26px rgba(99,102,241,0.55))'}
            : undefined
        }
      />
      {active && (
        <circle
          cx={x + 52}
          cy={PILL_Y + PILL_H / 2}
          r={11}
          fill={INDIGO_LIGHT}
          style={{filter: 'drop-shadow(0 0 14px rgba(129,140,248,0.9))'}}
        />
      )}
      <text
        x={x + PILL_W / 2 + (active ? 12 : 0)}
        y={PILL_Y + PILL_H / 2 + 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={MONO}
        fontSize={38}
        fontWeight={700}
        letterSpacing={10}
        fill={textFill}
      >
        {label}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const MFAExpiryTimer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const progress = ringProgress(frame);
  const secs = secondsLeft(frame);
  const state = activeState(frame);
  const mood = ringMood(progress);

  // ---- intro choreography ----
  const titleIn = spring({frame: Math.max(0, frame), fps, config: {damping: 200, stiffness: 90}});
  const subIn = spring({frame: Math.max(0, frame - 14), fps, config: {damping: 200, stiffness: 90}});
  const ruleIn = interpolate(frame, [30, 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const windowLabelIn = interpolate(frame, [40, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sessionIn = interpolate(frame, [50, 84], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sideIn = interpolate(frame, [150, 205], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const footerIn = interpolate(frame, [200, 262], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const readoutsIn = interpolate(frame, [110, 165], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // ---- first code set: dims at expiry, gone at resend ----
  const dimA = interpolate(frame, [EXPIRE_AT, EXPIRE_AT + 35], [1, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeA = interpolate(frame, [RESEND_AT, RESEND_AT + 24], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacityA = dimA * fadeA;

  // ---- CODE EXPIRED stamp: slams in with spring overshoot, fades on resend ----
  const stampS = spring({
    frame: Math.max(0, frame - EXPIRE_AT),
    fps,
    config: {damping: 11, stiffness: 110},
  });
  const stampIn = interpolate(frame, [EXPIRE_AT, EXPIRE_AT + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stampOut = interpolate(frame, [RESEND_AT + 42, REFILL_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stampScale = interpolate(stampS, [0, 1], [2.4, 1]);
  const stampOpacity = stampIn * stampOut;

  // ---- RESEND CODE button: appears at expiry, pulses, pressed away at resend ----
  const btnIn = interpolate(frame, [EXPIRE_AT + 22, EXPIRE_AT + 46], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const btnOut = interpolate(frame, [RESEND_AT, RESEND_AT + 20], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const btnPulse =
    frame >= EXPIRE_AT && frame < RESEND_AT
      ? 1 + 0.028 * Math.sin(((frame - EXPIRE_AT) / 60) * Math.PI * 2 * 1.6)
      : 1;

  // ---- readout text color + warning pulse ----
  const expiredWindow = frame >= EXPIRE_AT && frame < RESEND_AT;
  const warning = secs < 5 && secs > 0 && frame < EXPIRE_AT;
  const readoutColor = expiredWindow ? RED : warning ? AMBER : INK;
  const readoutPulse =
    warning && !expiredWindow ? 0.72 + 0.28 * Math.sin((frame / 60) * Math.PI * 2 * 2.4) : 1;

  // ---- ring head dot position (leading edge of the depleting arc) ----
  const headA = ((-90 + progress * 360) * Math.PI) / 180;
  const hx = CX + RING_R * Math.cos(headA);
  const hy = RING_CY + RING_R * Math.sin(headA);
  const showHead = progress > 0.004;

  // ---- 60 tick marks, alive while the arc still covers them ----
  const ticks = useMemo(() => {
    const arr: {x1: number; y1: number; x2: number; y2: number; major: boolean; i: number}[] = [];
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180;
      const major = i % 5 === 0;
      const r1 = RING_R + 46;
      const r2 = RING_R + (major ? 94 : 70);
      arr.push({
        x1: CX + r1 * Math.sin(a),
        y1: RING_CY - r1 * Math.cos(a),
        x2: CX + r2 * Math.sin(a),
        y2: RING_CY - r2 * Math.cos(a),
        major,
        i,
      });
    }
    return arr;
  }, []);

  const tickAlive = (i: number): boolean => 1 - i / 60 <= progress + 1e-6;
  const tickColor = (alive: boolean): string => {
    if (!alive) return 'rgba(148,163,184,0.16)';
    if (progress < 0.125) return 'rgba(248,113,113,0.85)';
    if (progress < 0.25) return 'rgba(251,191,36,0.85)';
    return 'rgba(226,232,240,0.8)';
  };

  // ---- calm background breathing ----
  const breathe = 0.55 + 0.12 * Math.sin(((frame / 60) * Math.PI * 2) / 9);
  const sessionBlink = 0.55 + 0.45 * Math.sin(((frame / 60) * Math.PI * 2) / 3);

  // ---- lifecycle pills layout ----
  const pillLabels = ['ISSUED', 'ACTIVE', 'EXPIRED', 'RESENT'];
  const pillsW = pillLabels.length * PILL_W + (pillLabels.length - 1) * PILL_GAP;
  const pillX0 = CX - pillsW / 2;

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <svg width={3840} height={2160} viewBox="0 0 3840 2160">
        <defs>
          {/* indigo -> cyan ring gradient */}
          <linearGradient id="ringIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={INDIGO} />
            <stop offset="55%" stopColor={INDIGO_LIGHT} />
            <stop offset="100%" stopColor={CYAN} />
          </linearGradient>
          {/* amber warning gradient */}
          <linearGradient id="ringAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={AMBER} />
            <stop offset="100%" stopColor={AMBER_DEEP} />
          </linearGradient>
          {/* red expired gradient */}
          <linearGradient id="ringRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={RED} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </linearGradient>
          {/* soft glow for the ring arc */}
          <filter id="ringGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={16} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* tight glow for the head dot */}
          <filter id="dotGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation={9} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* large calm indigo aura behind the ring */}
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={INDIGO} stopOpacity={0.15} />
            <stop offset="55%" stopColor={INDIGO} stopOpacity={0.05} />
            <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
          </radialGradient>
          {/* vignette */}
          <radialGradient id="vignette" cx="50%" cy="46%" r="78%">
            <stop offset="52%" stopColor="#000000" stopOpacity={0} />
            <stop offset="100%" stopColor="#04060B" stopOpacity={0.62} />
          </radialGradient>
        </defs>

        {/* ===== base + atmosphere ===== */}
        <rect x={0} y={0} width={3840} height={2160} fill={BG} />
        <HairlineGrid frame={frame} />
        <ellipse cx={CX} cy={RING_CY} rx={1520} ry={1120} fill="url(#bgGlow)" opacity={breathe} />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />

        {/* ===== header ===== */}
        <g opacity={ruleIn}>
          <line x1={280} y1={332} x2={3560} y2={332} stroke={HAIRLINE} strokeWidth={1.5} />
        </g>
        <g opacity={titleIn} transform={`translate(${interpolate(titleIn, [0, 1], [-64, 0])} 0)`}>
          <rect x={280} y={168} width={10} height={76} fill={INDIGO} opacity={0.9} />
          <text
            x={314}
            y={228}
            fontFamily={FONT}
            fontSize={72}
            fontWeight={800}
            letterSpacing={8}
            fill={INK}
            style={{textShadow: '0 2px 18px rgba(0,0,0,0.6)'}}
          >
            TWO-FACTOR AUTHENTICATION
          </text>
        </g>
        <g opacity={subIn} transform={`translate(${interpolate(subIn, [0, 1], [-40, 0])} 0)`}>
          <text x={314} y={292} fontFamily={FONT} fontSize={32} fontWeight={400} letterSpacing={3} fill={MUTED}>
            time-based one-time passcode · 30-second window
          </text>
        </g>
        <g opacity={sessionIn}>
          <circle cx={3320} cy={200} r={10} fill={GREEN} opacity={sessionBlink} />
          <text
            x={3560}
            y={212}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={28}
            fontWeight={600}
            letterSpacing={5}
            fill={MUTED}
          >
            SESSION SECURE
          </text>
        </g>

        {/* window label above the ring */}
        <g opacity={windowLabelIn}>
          <text
            x={CX}
            y={392}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={26}
            fontWeight={600}
            letterSpacing={12}
            fill={FAINT}
          >
            30-SECOND WINDOW
          </text>
        </g>

        {/* ===== faint inner hairline circle for 4K depth ===== */}
        <circle cx={CX} cy={RING_CY} r={468} fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth={1.5} />

        {/* ===== tick marks ===== */}
        {ticks.map((t) => {
          const alive = tickAlive(t.i);
          return (
            <line
              key={`tick${t.i}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={tickColor(alive)}
              strokeWidth={t.major ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* ===== ring track + depleting arc ===== */}
        <circle
          cx={CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth={RING_STROKE}
        />
        {progress > 0.001 && (
          <g filter="url(#ringGlow)">
            <circle
              cx={CX}
              cy={RING_CY}
              r={RING_R}
              fill="none"
              stroke={mood.grad}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              transform={`rotate(-90 ${CX} ${RING_CY})`}
            />
          </g>
        )}
        {/* leading-edge head dot */}
        {showHead && (
          <g filter="url(#dotGlow)">
            <circle cx={hx} cy={hy} r={30} fill={mood.accent} opacity={0.28} />
            <circle cx={hx} cy={hy} r={15} fill="#FFFFFF" />
          </g>
        )}

        {/* ===== digit boxes: first code, then the resent code ===== */}
        {DIGITS_A.map((d, i) => (
          <DigitBox
            key={`a${i}`}
            digit={d}
            x={BOX_X0 + i * (BOX_W + BOX_GAP)}
            y={BOX_Y}
            frame={frame}
            fps={fps}
            enterAt={60 + i * 22}
            opacity={opacityA}
            dimmed={frame >= EXPIRE_AT}
          />
        ))}
        {frame >= RESEND_AT - 30 &&
          DIGITS_B.map((d, i) => (
            <DigitBox
              key={`b${i}`}
              digit={d}
              x={BOX_X0 + i * (BOX_W + BOX_GAP)}
              y={BOX_Y}
              frame={frame}
              fps={fps}
              enterAt={RESEND_AT + i * 18}
              opacity={1}
              dimmed={false}
            />
          ))}

        {/* ===== CODE EXPIRED stamp ===== */}
        {stampOpacity > 0.001 && (
          <g
            opacity={stampOpacity}
            transform={`translate(${CX} ${RING_CY}) rotate(-8) scale(${stampScale}) translate(${-CX} ${-RING_CY})`}
          >
            <rect
              x={CX - 520}
              y={RING_CY - 130}
              width={1040}
              height={260}
              fill="rgba(11,14,20,0.55)"
              stroke={RED}
              strokeWidth={7}
              style={{filter: 'drop-shadow(0 0 44px rgba(248,113,113,0.45))'}}
            />
            <rect
              x={CX - 496}
              y={RING_CY - 106}
              width={992}
              height={212}
              fill="none"
              stroke={RED}
              strokeWidth={2.5}
              opacity={0.75}
            />
            <text
              x={CX}
              y={RING_CY + 6}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={MONO}
              fontSize={88}
              fontWeight={800}
              letterSpacing={20}
              fill={RED}
            >
              CODE EXPIRED
            </text>
          </g>
        )}

        {/* ===== EXPIRES IN readout + thin progress bar ===== */}
        <g opacity={readoutsIn}>
          <text
            x={CX}
            y={1640}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={54}
            fontWeight={700}
            letterSpacing={6}
            fill={readoutColor}
            opacity={readoutPulse}
            style={{textShadow: '0 2px 16px rgba(0,0,0,0.65)'}}
          >
            {`EXPIRES IN  ${fmtTime(secs)}`}
          </text>
          <rect x={CX - 280} y={1686} width={560} height={6} rx={3} fill="rgba(255,255,255,0.08)" />
          <rect
            x={CX - 280}
            y={1686}
            width={560 * progress}
            height={6}
            rx={3}
            fill={mood.accent}
            opacity={0.9}
          />
        </g>

        {/* ===== RESEND CODE button ===== */}
        {btnIn * btnOut > 0.001 && (
          <g
            opacity={btnIn * btnOut}
            transform={`translate(${CX} 1800) scale(${btnPulse}) translate(${-CX} ${-1800})`}
          >
            <rect
              x={CX - 230}
              y={1750}
              width={460}
              height={100}
              rx={50}
              fill="rgba(99,102,241,0.14)"
              stroke={INDIGO_LIGHT}
              strokeWidth={2.5}
              style={{filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.5))'}}
            />
            <text
              x={CX}
              y={1802}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={MONO}
              fontSize={42}
              fontWeight={700}
              letterSpacing={8}
              fill={INK}
            >
              RESEND CODE
            </text>
          </g>
        )}

        {/* ===== lifecycle strip ===== */}
        <g opacity={interpolate(frame, [90, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <text
            x={CX}
            y={1872}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={26}
            fontWeight={600}
            letterSpacing={14}
            fill={FAINT}
          >
            CODE LIFECYCLE
          </text>
        </g>
        {pillLabels.map((label, i) => (
          <React.Fragment key={label}>
            <StatePill
              label={label}
              x={pillX0 + i * (PILL_W + PILL_GAP)}
              active={state === i}
              tone={label === 'EXPIRED' ? 'red' : 'idle'}
              frame={frame}
              fps={fps}
              delay={90 + i * 40}
            />
            {i < pillLabels.length - 1 && (
              <g
                opacity={interpolate(frame, [120 + i * 40, 160 + i * 40], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })}
              >
                <polygon
                  points={`${pillX0 + (i + 1) * PILL_W + i * PILL_GAP + 32},${PILL_Y + PILL_H / 2 - 14} ${pillX0 + (i + 1) * PILL_W + i * PILL_GAP + 58},${PILL_Y + PILL_H / 2} ${pillX0 + (i + 1) * PILL_W + i * PILL_GAP + 32},${PILL_Y + PILL_H / 2 + 14}`}
                  fill={FAINT}
                />
              </g>
            )}
          </React.Fragment>
        ))}

        {/* ===== side annotations ===== */}
        <g opacity={sideIn} transform={`translate(0 ${interpolate(sideIn, [0, 1], [26, 0])})`}>
          <line x1={280} y1={918} x2={344} y2={918} stroke={INDIGO} strokeWidth={3} />
          <text x={280} y={972} fontFamily={MONO} fontSize={30} fontWeight={600} letterSpacing={3} fill={MUTED}>
            TOTP · RFC 6238
          </text>
          <line x1={280} y1={1058} x2={344} y2={1058} stroke={INDIGO} strokeWidth={3} />
          <text x={280} y={1112} fontFamily={MONO} fontSize={30} fontWeight={600} letterSpacing={3} fill={MUTED}>
            6 digits · 30s window
          </text>

          <line x1={3496} y1={918} x2={3560} y2={918} stroke={INDIGO} strokeWidth={3} />
          <text
            x={3560}
            y={972}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={30}
            fontWeight={600}
            letterSpacing={3}
            fill={MUTED}
          >
            phishing-resistant MFA recommended
          </text>
          <line x1={3496} y1={1058} x2={3560} y2={1058} stroke={INDIGO} strokeWidth={3} />
          <text
            x={3560}
            y={1112}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={30}
            fontWeight={600}
            letterSpacing={3}
            fill={MUTED}
          >
            never share this code
          </text>
        </g>

        {/* ===== footer ===== */}
        <g opacity={footerIn}>
          <text
            x={CX}
            y={2096}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={26}
            fontWeight={400}
            letterSpacing={2}
            fill={FAINT}
          >
            Expiring-code UX: the countdown is the security — codes are single-use and time-bound.
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default MFAExpiryTimer;
