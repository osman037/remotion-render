/**
 * ZeroTrustAccessFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Animates a Zero Trust Network Access evaluation flow:
 * posture -> identity -> policy -> least-privilege session grant.
 * Two request packets travel the gate pipeline: REQ-8841 (alice) is
 * granted with a scoped, TTL-bound session token; REQ-8842 (contractor)
 * is denied at the policy engine (location not in allow-list).
 *
 * Register in Root.tsx:
 *   <Composition id="ZeroTrustAccessFlow" component={ZeroTrustAccessFlow}
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
// Palette
// ---------------------------------------------------------------------------
const BG = '#05080F';
const INK = '#E8EDF6';
const MUTED = 'rgba(203,213,225,0.60)';
const FAINT = 'rgba(148,163,184,0.38)';
const CYAN = '#22D3EE';
const TEAL = '#2DD4BF';
const RED = '#F87171';
const GREEN = '#34D399';
const AMBER = '#FBBF24';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Geometry (device px, 4K)
// ---------------------------------------------------------------------------
const CARD_X = [180, 1050, 1920, 2790];
const CARD_Y = 780;
const CARD_W = 700;
const CARD_H = 560;
const GATE_CX = [530, 1400, 2270, 3140];
const LANE_Y = 640;

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 total)
// ---------------------------------------------------------------------------
const ENTER = [80, 140, 200, 260]; // card entrances
const ARRIVE_A = [260, 335, 410, 485]; // packet A arrives at each gate
const PASS_A = [310, 385, 460, 540]; // packet A passes each gate
const ARRIVE_B = [640, 700, 760]; // packet B arrivals (fails at gate 3)
const DENY_B = 775; // policy denies packet B
const GRANT_F = 540; // session token minted
const PAYOFF_S = 700;
const PAYOFF_E = 800;

// ---------------------------------------------------------------------------
// Deterministic helpers (no Math.random anywhere)
// ---------------------------------------------------------------------------
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keyframes(frame: number, keys: Array<[number, number]>): number {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const f0 = keys[i][0];
    const v0 = keys[i][1];
    const f1 = keys[i + 1][0];
    const v1 = keys[i + 1][1];
    if (frame >= f0 && frame <= f1) {
      const t = f1 === f0 ? 0 : (frame - f0) / (f1 - f0);
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const pad2 = (n: number) => String(n).padStart(2, '0');
function fmtTTL(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

function buildToken(seed: number): string {
  const rand = seededRand(seed);
  const hex = () =>
    Array.from({length: 6}, () => Math.floor(rand() * 16).toString(16)).join('');
  return `zt_${hex()}\u2026${hex().slice(0, 4)}`;
}
const TOKEN = buildToken(20260926);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
interface GateDef {
  num: string;
  title: string;
  checks: string[];
  lats: string[];
  meta: string;
}
const GATES: GateDef[] = [
  {
    num: '01',
    title: 'DEVICE POSTURE',
    checks: ['OS patched \u2014 14.5.1', 'disk encrypted', 'EDR healthy'],
    lats: ['21', '14', '9'],
    meta: 'device \u00b7 macbook-pro \u00b7 compliant',
  },
  {
    num: '02',
    title: 'IDENTITY',
    checks: [
      'MFA \u2014 phishing-resistant',
      'user: alice@company',
      'risk score: 12/100 LOW',
    ],
    lats: ['34', '28', '12'],
    meta: 'identity \u00b7 sso \u00b7 verified',
  },
  {
    num: '03',
    title: 'POLICY ENGINE',
    checks: ['role: finance', 'location: allow-list', 'time: business hours'],
    lats: ['18', '22', '11'],
    meta: 'policy \u00b7 42 rules \u00b7 evaluated',
  },
  {
    num: '04',
    title: 'SESSION GRANT',
    checks: [],
    lats: [],
    meta: 'session \u00b7 tls 1.3 \u00b7 mtls',
  },
];

interface LogRow {
  t: string;
  id: string;
  user: string;
  decision: 'GRANTED' | 'DENIED';
  at: number;
}
const LOG_ROWS: LogRow[] = [
  {t: '09:41:02', id: 'REQ-8836', user: 'd.chen', decision: 'GRANTED', at: 150},
  {t: '09:42:47', id: 'REQ-8837', user: 'm.singh', decision: 'GRANTED', at: 175},
  {t: '09:43:19', id: 'REQ-8838', user: 's.almeida', decision: 'DENIED', at: 200},
  {t: '09:44:55', id: 'REQ-8839', user: 'j.lee', decision: 'GRANTED', at: 225},
  {t: '09:47:08', id: 'REQ-8841', user: 'alice', decision: 'GRANTED', at: 560},
  {t: '09:47:31', id: 'REQ-8842', user: 'contractor', decision: 'DENIED', at: 812},
];

interface StatDef {
  label: string;
  value: number;
  color: string;
  cap: string;
  suffix: string;
}
const STATS: StatDef[] = [
  {label: 'GRANTED', value: 1842, color: GREEN, cap: 'decisions \u00b7 last 60 min', suffix: ''},
  {label: 'DENIED', value: 37, color: RED, cap: 'blocked at policy \u00b7 last 60 min', suffix: ''},
  {label: 'AVG DECISION', value: 84, color: CYAN, cap: 'median latency \u00b7 p50', suffix: 'ms'},
];

const SCOPES = ['erp.read', 'invoices.read', 'reports.read'];

const PA_KEYS: Array<[number, number]> = [
  [240, 120],
  [260, 530],
  [300, 530],
  [335, 1400],
  [375, 1400],
  [410, 2270],
  [450, 2270],
  [485, 3140],
  [900, 3140],
];
const PB_KEYS: Array<[number, number]> = [
  [620, 120],
  [640, 530],
  [670, 530],
  [700, 1400],
  [730, 1400],
  [760, 2270],
  [900, 2270],
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
      <stop offset="45%" stopColor="rgba(45,212,191,0.045)" />
      <stop offset="100%" stopColor="rgba(5,8,15,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor="rgba(5,8,15,0)" />
      <stop offset="100%" stopColor="rgba(1,2,5,0.74)" />
    </radialGradient>
    <linearGradient id="trailCyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={CYAN} stopOpacity={0} />
      <stop offset="100%" stopColor={CYAN} stopOpacity={0.85} />
    </linearGradient>
    <linearGradient id="trailAmber" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={AMBER} stopOpacity={0} />
      <stop offset="100%" stopColor={AMBER} stopOpacity={0.85} />
    </linearGradient>
    <linearGradient id="cardSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(255,255,255,0.055)" />
      <stop offset="30%" stopColor="rgba(255,255,255,0.012)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: base + glow + vignette + grid + scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const grid = useMemo(() => {
    const v: number[] = [];
    const h: number[] = [];
    for (let x = 240; x < 3840; x += 240) v.push(x);
    for (let y = 216; y < 2160; y += 216) h.push(y);
    return {v, h};
  }, []);
  const scanY = (frame / 900) * (2160 + 440) - 220;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(34,211,238,0.10), rgba(45,212,191,0.045) 45%, rgba(5,8,15,0) 70%)',
        }}
      />
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <Defs />
        <g opacity={0.9}>
          {grid.v.map((x) => (
            <line
              key={`v${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={2160}
              stroke="rgba(148,163,184,0.05)"
              strokeWidth={1}
            />
          ))}
          {grid.h.map((y) => (
            <line
              key={`h${y}`}
              x1={0}
              y1={y}
              x2={3840}
              y2={y}
              stroke="rgba(148,163,184,0.05)"
              strokeWidth={1}
            />
          ))}
        </g>
        <rect
          x={0}
          y={scanY - 110}
          width={3840}
          height={220}
          fill="rgba(34,211,238,0.028)"
        />
        <line
          x1={0}
          y1={scanY + 110}
          x2={3840}
          y2={scanY + 110}
          stroke="rgba(34,211,238,0.10)"
          strokeWidth={2}
        />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title (top-left, 0-60)
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 60], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 96 + rise,
        left: 180,
        opacity: fade,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        <div
          style={{
            width: 10,
            height: 96,
            background: `linear-gradient(180deg, ${CYAN}, ${TEAL})`,
            borderRadius: 5,
            boxShadow: `0 0 24px rgba(34,211,238,0.7)`,
          }}
        />
        <div
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: 1,
            textShadow: '0 0 34px rgba(34,211,238,0.25)',
          }}
        >
          ZERO TRUST NETWORK ACCESS
        </div>
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: FONT,
          fontSize: 32,
          marginTop: 16,
          marginLeft: 36,
          letterSpacing: 0.5,
        }}
      >
        never trust {'\u00b7'} always verify {'\u2014'} posture {'\u2192'} identity{' '}
        {'\u2192'} policy {'\u2192'} least-privilege grant
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Top-right HUD
// ---------------------------------------------------------------------------
const TopHud: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [40, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 104,
        right: 180,
        textAlign: 'right',
        opacity: fade,
      }}
    >
      <div
        style={{
          color: INK,
          fontFamily: MONO,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 1.5,
        }}
      >
        POLICY BUNDLE <span style={{color: CYAN}}>v2026.09.26</span> {'\u00b7'} 42
        RULES
      </div>
      <div
        style={{
          color: FAINT,
          fontFamily: MONO,
          fontSize: 26,
          letterSpacing: 1.5,
          marginTop: 12,
        }}
      >
        TLS 1.3 {'\u00b7'} mTLS {'\u00b7'} E2E ENCRYPTED
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pipes: dashed flow lanes between gates with animated dashes
// ---------------------------------------------------------------------------
const Pipes: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [100, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const dash = -frame * 3;
  const arrows = [965, 1835, 2705];
  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
    >
      <g opacity={fade}>
        <line
          x1={120}
          y1={LANE_Y}
          x2={3500}
          y2={LANE_Y}
          stroke="rgba(34,211,238,0.06)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <line
          x1={120}
          y1={LANE_Y}
          x2={3500}
          y2={LANE_Y}
          stroke="rgba(148,163,184,0.38)"
          strokeWidth={4}
          strokeDasharray="18 22"
          strokeDashoffset={dash}
          strokeLinecap="round"
        />
        {arrows.map((x) => (
          <polygon
            key={`a${x}`}
            points={`${x},${LANE_Y - 14} ${x},${LANE_Y + 14} ${x + 26},${LANE_Y}`}
            fill="rgba(34,211,238,0.5)"
          />
        ))}
        {GATE_CX.map((cx) => (
          <g key={`stub${cx}`}>
            <line
              x1={cx}
              y1={LANE_Y}
              x2={cx}
              y2={CARD_Y}
              stroke="rgba(148,163,184,0.30)"
              strokeWidth={3}
              strokeDasharray="10 12"
              strokeDashoffset={dash * 0.6}
            />
            <circle
              cx={cx}
              cy={LANE_Y}
              r={11}
              fill={BG}
              stroke="rgba(34,211,238,0.65)"
              strokeWidth={3}
            />
            <circle
              cx={cx}
              cy={CARD_Y}
              r={9}
              fill={BG}
              stroke="rgba(148,163,184,0.55)"
              strokeWidth={3}
            />
          </g>
        ))}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Gate stage card
// ---------------------------------------------------------------------------
type CheckState = 'ok' | 'fail' | 'skip';

const GateCard: React.FC<{frame: number; fps: number; index: number}> = ({
  frame,
  fps,
  index,
}) => {
  const s = spring({
    frame: frame - ENTER[index],
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;

  const gate = GATES[index];
  const x = CARD_X[index];

  // Gate state: green when passed, red when denied (gate 3 vs packet B).
  const denied = index === 2 && frame >= DENY_B;
  const passed = !denied && frame >= PASS_A[index];
  const border = denied
    ? '2.5px solid rgba(248,113,113,0.75)'
    : passed
      ? '2.5px solid rgba(52,211,153,0.65)'
      : '2px solid rgba(148,163,184,0.28)';
  const glow = denied
    ? '0 0 46px rgba(248,113,113,0.28), 0 24px 60px rgba(0,0,0,0.5)'
    : passed
      ? '0 0 46px rgba(52,211,153,0.22), 0 24px 60px rgba(0,0,0,0.5)'
      : '0 24px 60px rgba(0,0,0,0.5)';
  const accent = denied ? RED : passed ? GREEN : CYAN;

  const denyPulse =
    denied && frame < 812 ? 0.5 + 0.5 * Math.sin((frame - DENY_B) * 0.55) : 0;

  // Per-check appearance + result state.
  const checkInfo = (k: number): {state: CheckState; show: boolean} => {
    const appearAt = ARRIVE_A[index] + 6 + k * 14;
    const show = frame >= appearAt;
    if (!show) return {state: 'ok', show: false};
    if (index === 2 && frame >= DENY_B) {
      if (k === 0) return {state: 'ok', show: true};
      if (k === 1) return {state: 'fail', show: true};
      return {state: 'skip', show: true};
    }
    return {state: 'ok', show: true};
  };

  // Session-grant card extras.
  const granted =
    index === 3 &&
    spring({
      frame: frame - (GRANT_F + 8),
      fps,
      config: {damping: 200, stiffness: 90},
    });
  const ttl =
    index === 3
      ? fmtTTL(28800 - Math.floor(Math.max(0, frame - GRANT_F) / 60))
      : '';

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: CARD_Y + (1 - s) * 60,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 28,
        background:
          'linear-gradient(165deg, rgba(34,211,238,0.07), rgba(34,211,238,0.015) 55%, rgba(255,255,255,0.012))',
        border,
        boxShadow: glow,
        opacity: Math.min(1, s),
        padding: '36px 44px',
        overflow: 'hidden',
      }}
    >
      {/* sheen */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: 220,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))',
          pointerEvents: 'none',
        }}
      />
      {/* deny flash wash */}
      {denyPulse > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: CARD_W,
            height: CARD_H,
            background: `rgba(248,113,113,${0.10 + denyPulse * 0.14})`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* header */}
      <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
        <span
          style={{
            color: accent,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 44,
            textShadow: `0 0 18px ${accent}66`,
          }}
        >
          {gate.num}
        </span>
        <span
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 42,
            letterSpacing: 1,
          }}
        >
          {gate.title}
        </span>
        <div style={{flex: 1}} />
        {index === 3 && granted !== null && granted > 0.001 && (
          <div
            style={{
              color: GREEN,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: 2,
              border: `2px solid ${GREEN}`,
              borderRadius: 12,
              padding: '8px 20px',
              opacity: Math.min(1, granted),
              transform: `scale(${0.85 + Math.min(1, granted) * 0.15})`,
              boxShadow: '0 0 22px rgba(52,211,153,0.35)',
            }}
          >
            {'\u25cf'} GRANTED
          </div>
        )}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: denied ? RED : passed ? GREEN : 'rgba(148,163,184,0.35)',
            boxShadow: denied
              ? '0 0 22px rgba(248,113,113,0.9)'
              : passed
                ? '0 0 22px rgba(52,211,153,0.9)'
                : 'none',
          }}
        />
      </div>

      {/* hairline */}
      <div
        style={{
          height: 2,
          marginTop: 26,
          marginBottom: 30,
          background:
            'linear-gradient(90deg, rgba(148,163,184,0.4), rgba(148,163,184,0.06))',
        }}
      />

      {/* checks for gates 1-3 */}
      {index < 3 &&
        gate.checks.map((c, k) => {
          const {state, show} = checkInfo(k);
          if (!show) return null;
          const rowColor =
            state === 'fail' ? RED : state === 'skip' ? FAINT : INK;
          return (
            <div
              key={`${index}-${k}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginTop: k === 0 ? 6 : 34,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  border: `2.5px solid ${
                    state === 'fail' ? RED : state === 'skip' ? FAINT : GREEN
                  }`,
                  color: state === 'fail' ? RED : state === 'skip' ? FAINT : GREEN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 26,
                  boxShadow:
                    state === 'ok'
                      ? '0 0 16px rgba(52,211,153,0.45)'
                      : state === 'fail'
                        ? '0 0 16px rgba(248,113,113,0.55)'
                        : 'none',
                  flexShrink: 0,
                }}
              >
                {state === 'fail' ? '\u2715' : state === 'skip' ? '\u2014' : '\u2713'}
              </div>
              <span
                style={{
                  color: rowColor,
                  fontFamily: MONO,
                  fontSize: 33,
                  flex: 1,
                }}
              >
                {c}
                {state === 'skip' ? ' \u2014 not evaluated' : ''}
              </span>
              <span
                style={{
                  color: FAINT,
                  fontFamily: MONO,
                  fontSize: 26,
                }}
              >
                {state === 'skip' ? '' : `${gate.lats[k]}ms`}
              </span>
            </div>
          );
        })}

      {/* session token card (gate 4) */}
      {index === 3 && (
        <div style={{marginTop: 4}}>
          <div
            style={{
              color: FAINT,
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: 3,
            }}
          >
            SESSION TOKEN
          </div>
          <div
            style={{
              marginTop: 12,
              background: 'rgba(5,8,15,0.55)',
              border: '1.5px solid rgba(52,211,153,0.4)',
              borderRadius: 14,
              padding: '16px 24px',
              color: GREEN,
              fontFamily: MONO,
              fontSize: 34,
              fontWeight: 700,
              textShadow: '0 0 16px rgba(52,211,153,0.5)',
            }}
          >
            {TOKEN}
          </div>
          <div
            style={{
              color: FAINT,
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: 3,
              marginTop: 26,
            }}
          >
            SCOPES {'\u00b7'} LEAST PRIVILEGE
          </div>
          <div style={{display: 'flex', gap: 18, marginTop: 14}}>
            {SCOPES.map((sc) => (
              <div
                key={sc}
                style={{
                  color: CYAN,
                  fontFamily: MONO,
                  fontSize: 29,
                  fontWeight: 700,
                  border: `1.5px solid ${CYAN}`,
                  borderRadius: 22,
                  padding: '10px 26px',
                  background: 'rgba(34,211,238,0.08)',
                }}
              >
                {sc}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 26,
              marginTop: 30,
            }}
          >
            <span
              style={{
                color: FAINT,
                fontFamily: MONO,
                fontSize: 26,
                letterSpacing: 3,
              }}
            >
              TTL
            </span>
            <span
              style={{
                color: INK,
                fontFamily: MONO,
                fontSize: 62,
                fontWeight: 800,
                textShadow: '0 0 24px rgba(232,237,246,0.35)',
              }}
            >
              {ttl}
            </span>
            <span
              style={{
                color: GREEN,
                fontFamily: MONO,
                fontSize: 29,
                fontWeight: 700,
                textShadow: '0 0 14px rgba(52,211,153,0.5)',
              }}
            >
              least privilege {'\u2713'}
            </span>
          </div>
        </div>
      )}

      {/* bottom meta */}
      <div
        style={{
          position: 'absolute',
          left: 44,
          bottom: 30,
          color: FAINT,
          fontFamily: MONO,
          fontSize: 25,
          letterSpacing: 1,
        }}
      >
        {gate.meta}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Request packets travelling the lane
// ---------------------------------------------------------------------------
interface PacketProps {
  frame: number;
  kind: 'A' | 'B';
}
const Packet: React.FC<PacketProps> = ({frame, kind}) => {
  const isA = kind === 'A';
  const keys = isA ? PA_KEYS : PB_KEYS;
  const start = isA ? 240 : 620;
  if (frame < start) return null;

  const color = isA ? CYAN : AMBER;
  const x = keyframes(frame, keys);
  const y = LANE_Y;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.14);

  // Packet B stops and fades after the denial.
  const fadeB = isA
    ? 1
    : interpolate(frame, [800, 832], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  if (fadeB <= 0) return null;

  // Trail length grows with travel speed (shorter while paused).
  const prev = keyframes(Math.max(start, frame - 14), keys);
  const trailLen = Math.min(260, Math.max(0, x - prev) * 4 + 60);

  return (
    <>
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
      >
        <Defs />
        <g opacity={fadeB}>
          <line
            x1={x - trailLen}
            y1={y}
            x2={x - 22}
            y2={y}
            stroke={isA ? 'url(#trailCyan)' : 'url(#trailAmber)'}
            strokeWidth={7}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x - 150,
          top: y - 108,
          width: 300,
          textAlign: 'center',
          opacity: fadeB,
        }}
      >
        <span
          style={{
            color: color,
            fontFamily: MONO,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
            background: 'rgba(5,8,15,0.88)',
            border: `1.5px solid ${color}`,
            borderRadius: 16,
            padding: '8px 20px',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 18px ${color}55`,
          }}
        >
          {isA ? 'REQ-8841 \u00b7 alice' : 'REQ-8842 \u00b7 contractor'}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: x - 46,
          top: y - 46,
          width: 92,
          height: 92,
          borderRadius: 46,
          background: `radial-gradient(circle, ${color}22 0%, ${color}00 70%)`,
          opacity: fadeB * (0.45 + pulse * 0.4),
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 17,
          top: y - 17,
          width: 34,
          height: 34,
          borderRadius: 17,
          background: color,
          boxShadow: `0 0 26px ${color}, 0 0 60px ${color}88`,
          opacity: fadeB,
          filter: 'url(#softGlow)',
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Denial banner below gate 3 + drawn red X at the stop point
// ---------------------------------------------------------------------------
const DenyBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 786,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const draw = interpolate(frame, [768, 794], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bx = 1980;
  const bw = 580;
  const by = 1356;
  const bh = 108;

  return (
    <>
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
      >
        <Defs />
        {draw > 0 && (
          <g opacity={Math.min(1, draw * 1.4)}>
            <circle
              cx={2270}
              cy={LANE_Y}
              r={64}
              fill="rgba(248,113,113,0.10)"
              stroke={RED}
              strokeWidth={7}
              strokeDasharray={2 * Math.PI * 64}
              strokeDashoffset={2 * Math.PI * 64 * (1 - draw)}
              strokeLinecap="round"
              style={{filter: 'drop-shadow(0 0 18px rgba(248,113,113,0.8))'}}
              transform={`rotate(-90 2270 ${LANE_Y})`}
            />
            <path
              d={`M ${2270 - 30} ${LANE_Y - 30} L ${2270 + 30} ${LANE_Y + 30} M ${
                2270 + 30
              } ${LANE_Y - 30} L ${2270 - 30} ${LANE_Y + 30}`}
              fill="none"
              stroke={RED}
              strokeWidth={11}
              strokeLinecap="round"
              strokeDasharray={170}
              strokeDashoffset={170 * (1 - draw)}
              style={{filter: 'drop-shadow(0 0 16px rgba(248,113,113,0.9))'}}
            />
          </g>
        )}
      </svg>
      {s > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: bx,
            top: by + (1 - s) * 44,
            width: bw,
            height: bh,
            borderRadius: 18,
            background:
              'linear-gradient(160deg, rgba(248,113,113,0.16), rgba(248,113,113,0.05))',
            border: `2px solid ${RED}`,
            boxShadow: '0 0 40px rgba(248,113,113,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '0 32px',
            opacity: Math.min(1, s),
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              background: RED,
              color: '#0A0D14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 34,
              flexShrink: 0,
            }}
          >
            {'\u2715'}
          </div>
          <div>
            <div
              style={{
                color: RED,
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 38,
                letterSpacing: 1.5,
                textShadow: '0 0 18px rgba(248,113,113,0.6)',
              }}
            >
              ACCESS DENIED
            </div>
            <div
              style={{
                color: MUTED,
                fontFamily: MONO,
                fontSize: 27,
                marginTop: 4,
              }}
            >
              REQ-8842 {'\u00b7'} location not in allow-list
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Access log table (bottom-left)
// ---------------------------------------------------------------------------
const AccessLog: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 120,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const px = 180;
  const py = 1470;
  const pw = 1720;
  const ph = 430;
  return (
    <div
      style={{
        position: 'absolute',
        left: px,
        top: py + (1 - s) * 50,
        width: pw,
        height: ph,
        borderRadius: 24,
        background:
          'linear-gradient(165deg, rgba(34,211,238,0.05), rgba(34,211,238,0.01) 60%, rgba(255,255,255,0.008))',
        border: '2px solid rgba(148,163,184,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        opacity: Math.min(1, s),
        padding: '30px 44px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <span
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 2,
          }}
        >
          ACCESS LOG
        </span>
        <div style={{flex: 1}} />
        <span
          style={{
            color: FAINT,
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 1.5,
          }}
        >
          live {'\u00b7'} append-only
        </span>
      </div>
      <div
        style={{
          height: 2,
          marginTop: 20,
          background:
            'linear-gradient(90deg, rgba(148,163,184,0.4), rgba(148,163,184,0.06))',
        }}
      />
      <div
        style={{
          display: 'flex',
          color: FAINT,
          fontFamily: MONO,
          fontSize: 25,
          letterSpacing: 2.5,
          marginTop: 18,
          marginBottom: 6,
        }}
      >
        <span style={{width: 260}}>TIME</span>
        <span style={{width: 420}}>REQUEST</span>
        <span style={{width: 520}}>USER</span>
        <span>DECISION</span>
      </div>
      {LOG_ROWS.map((row) => {
        const rs = spring({
          frame: frame - row.at,
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (rs <= 0.001) return null;
        const ok = row.decision === 'GRANTED';
        const dc = ok ? GREEN : RED;
        return (
          <div
            key={row.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 52,
              borderBottom: '1px solid rgba(148,163,184,0.12)',
              opacity: Math.min(1, rs),
              transform: `translateX(${(1 - Math.min(1, rs)) * -36}px)`,
            }}
          >
            <span
              style={{width: 260, color: MUTED, fontFamily: MONO, fontSize: 30}}
            >
              {row.t}
            </span>
            <span
              style={{
                width: 420,
                color: INK,
                fontFamily: MONO,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {row.id}
            </span>
            <span style={{width: 520, color: INK, fontFamily: FONT, fontSize: 30}}>
              {row.user}
            </span>
            <span
              style={{
                color: dc,
                fontFamily: MONO,
                fontSize: 27,
                fontWeight: 800,
                letterSpacing: 1.5,
                border: `1.5px solid ${dc}`,
                borderRadius: 10,
                padding: '5px 18px',
                textShadow: `0 0 12px ${dc}66`,
              }}
            >
              {row.decision}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Session stats (bottom-right) with payoff count-up
// ---------------------------------------------------------------------------
const SessionStats: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 160,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const px = 2050;
  const py = 1470;
  const pw = 1610;
  const ph = 430;

  const prog = easeOutCubic(
    interpolate(frame, [PAYOFF_S, PAYOFF_E], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: px,
        top: py + (1 - s) * 50,
        width: pw,
        height: ph,
        borderRadius: 24,
        background:
          'linear-gradient(165deg, rgba(45,212,191,0.06), rgba(45,212,191,0.015) 60%, rgba(255,255,255,0.008))',
        border: '2px solid rgba(148,163,184,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        opacity: Math.min(1, s),
        padding: '30px 48px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <span
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 2,
          }}
        >
          SESSION STATS
        </span>
        <div style={{flex: 1}} />
        <span
          style={{
            color: FAINT,
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 1.5,
          }}
        >
          rolling window
        </span>
      </div>
      <div
        style={{
          height: 2,
          marginTop: 20,
          marginBottom: 14,
          background:
            'linear-gradient(90deg, rgba(148,163,184,0.4), rgba(148,163,184,0.06))',
        }}
      />
      {STATS.map((st, i) => {
        const shown = Math.floor(st.value * prog);
        const display =
          st.value >= 1000 ? shown.toLocaleString('en-US') : String(shown);
        const barPct = Math.max(2, (st.value / 1842) * 100 * prog);
        return (
          <div key={st.label} style={{marginTop: i === 0 ? 4 : 18}}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 26,
              }}
            >
              <span
                style={{
                  color: FAINT,
                  fontFamily: MONO,
                  fontSize: 26,
                  letterSpacing: 3,
                  width: 330,
                }}
              >
                {st.label}
              </span>
              <span
                style={{
                  color: st.color,
                  fontFamily: MONO,
                  fontSize: 84,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  textShadow: `0 0 26px ${st.color}55`,
                }}
              >
                {display}
                {st.suffix}
              </span>
              <span
                style={{color: FAINT, fontFamily: FONT, fontSize: 26, flex: 1}}
              >
                {st.cap}
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                marginLeft: 356,
                width: 900,
                height: 8,
                borderRadius: 4,
                background: 'rgba(148,163,184,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${barPct}%`,
                  height: 8,
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${st.color}88, ${st.color})`,
                  boxShadow: `0 0 12px ${st.color}66`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [820, 870], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        letterSpacing: 0.5,
        opacity: fade,
      }}
    >
      Zero trust: every request is authenticated, authorized, and encrypted
      {' \u2014 '}regardless of network location.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ZeroTrustAccessFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Title frame={frame} />
      <TopHud frame={frame} />
      <Pipes frame={frame} />
      {[0, 1, 2, 3].map((i) => (
        <GateCard key={`gate${i}`} frame={frame} fps={fps} index={i} />
      ))}
      <Packet frame={frame} kind="A" />
      <Packet frame={frame} kind="B" />
      <DenyBanner frame={frame} fps={fps} />
      <AccessLog frame={frame} fps={fps} />
      <SessionStats frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default ZeroTrustAccessFlow;
