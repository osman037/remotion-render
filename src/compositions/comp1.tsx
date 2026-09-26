/**
 * InsuranceClaimJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A trustworthy claim-center narrative: claim filed -> documents upload ->
 * adjuster review -> approved payout, with a ticking payout counter.
 *
 * Register in Root.tsx:
 *   <Composition id="InsuranceClaimJourney" component={InsuranceClaimJourney}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette — trustworthy blue + emerald
// ---------------------------------------------------------------------------
const BG = '#050B16';
const PANEL = 'rgba(11, 19, 34, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.24)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const BLUE = '#3B82F6';
const BLUE_DIM = 'rgba(59, 130, 246, 0.14)';
const SKY = '#38BDF8';
const EMERALD = '#34D399';
const EMERALD_DIM = 'rgba(52, 211, 153, 0.15)';
const AMBER = '#FBBF24';
const ROSE = '#FB7185';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const CLAIM_FIELDS = [
  {label: 'CLAIM NUMBER', value: 'CLM-24813'},
  {label: 'POLICY', value: 'POL-9088-221'},
  {label: 'FILED', value: '24 Sep 2026'},
  {label: 'CATEGORY', value: 'Auto collision'},
  {label: 'DEDUCTIBLE', value: '$500.00'},
];
const DOCS = [
  {name: 'Police report', meta: 'PDF · 2.4 MB', delay: 330},
  {name: 'Damage photos', meta: '12 files · 48 MB', delay: 400},
  {name: 'Repair estimate', meta: 'PDF · 1.1 MB', delay: 470},
];
const STAGES = [
  {title: 'Claim filed', detail: 'Sep 24, 2026 · Auto collision', start: 90, color: SKY},
  {title: 'Documents received', detail: '3 of 3 verified', start: 330, color: SKY},
  {title: 'Adjuster review', detail: 'M. Alvarez · Est. $18,950', start: 510, color: AMBER},
  {title: 'Approved payout', detail: '$18,450 · 2 business days', start: 690, color: EMERALD},
];
const PAYOUT = 18450;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (frame: number, start: number, end: number) =>
  clamp01((frame - start) / (end - start));
const entr = (frame: number, delay: number, fps: number) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 19, stiffness: 130},
  });
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const money = (v: number) =>
  '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Opacity envelope: fade in [inA,inB], hold, fade out [outA,outB]. */
const stageOpacity = (
  frame: number,
  inA: number,
  inB: number,
  outA: number,
  outB: number,
) => prog(frame, inA, inB) * (1 - prog(frame, outA, outB));

// ---------------------------------------------------------------------------
// Background — blue/emerald glow, grid, vignette, particles, sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const particles = useMemo(
    () =>
      Array.from({length: 70}, (_, i) => ({
        x: rand(i * 3.1) * 3840,
        y: rand(i * 7.7) * 2160,
        r: 1.5 + rand(i * 13.3) * 3.5,
        speed: 0.25 + rand(i * 5.9) * 0.7,
        tw: rand(i * 9.4) * Math.PI * 2,
      })),
    [],
  );
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlowB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="130" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={900} cy={420} rx={900} ry={520} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        <ellipse cx={3050} cy={1750} rx={950} ry={540} fill="url(#bgGlowB)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line
            key={'v' + i}
            x1={i * 320}
            y1={0}
            x2={i * 320}
            y2={2160}
            stroke={HAIRLINE}
            strokeWidth={1}
          />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line
            key={'h' + i}
            x1={0}
            y1={i * 320}
            x2={3840}
            y2={i * 320}
            stroke={HAIRLINE}
            strokeWidth={1}
          />
        ))}
        {particles.map((p, i) => {
          const y = (p.y + frame * p.speed) % 2160;
          const tw = 0.25 + 0.55 * Math.abs(Math.sin(frame * 0.02 + p.tw));
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.r}
              fill={i % 3 === 0 ? EMERALD : SKY}
              opacity={tw * 0.5}
            />
          );
        })}
        <rect x={sweepX - 420} y={0} width={840} height={2160} fill="url(#sweepGrad)" />
        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 20, fps);
  return (
    <div
      style={{
        position: 'absolute',
        top: 120,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 8,
            color: SKY,
            marginBottom: 14,
          }}
        >
          INSURANCE
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(59,130,246,0.35)',
          }}
        >
          Claim Center
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 3,
          color: INK,
          background: BLUE_DIM,
          border: `1px solid rgba(59,130,246,0.45)`,
          borderRadius: 18,
          padding: '22px 36px',
        }}
      >
        CLAIM&nbsp;&nbsp;CLM-24813
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Claim card (left)
// ---------------------------------------------------------------------------
const ClaimCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 90, fps);
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 480,
        width: 1560,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '56px 64px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 40,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>
          CLAIM DETAILS
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: EMERALD,
              opacity: pulse,
              boxShadow: '0 0 24px rgba(52,211,153,0.9)',
            }}
          />
          <span style={{fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: EMERALD}}>
            IN REVIEW
          </span>
        </div>
      </div>
      {CLAIM_FIELDS.map((f, i) => {
        const re = entr(frame, 130 + i * 55, fps);
        return (
          <div
            key={f.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '20px 0',
              borderBottom: i < CLAIM_FIELDS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
              opacity: re,
              transform: `translateX(${(1 - re) * 40}px)`,
            }}
          >
            <span style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: FAINT}}>
              {f.label}
            </span>
            <span style={{fontFamily: FONT, fontSize: 38, fontWeight: 600, color: INK}}>
              {f.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Documents panel (left, below claim card)
// ---------------------------------------------------------------------------
const DocsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 300, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 1140,
        width: 1560,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '40px 56px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 6,
          color: MUTED,
          marginBottom: 24,
        }}
      >
        DOCUMENTS UPLOAD
      </div>
      {DOCS.map((d, i) => {
        const re = entr(frame, d.delay, fps);
        const fill = prog(frame, d.delay + 20, d.delay + 110);
        return (
          <div key={d.name} style={{marginBottom: i < DOCS.length - 1 ? 24 : 0}}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: re,
                transform: `translateX(${(1 - re) * 50}px)`,
                marginBottom: 12,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: fill >= 1 ? EMERALD_DIM : BLUE_DIM,
                    border: `1px solid ${fill >= 1 ? 'rgba(52,211,153,0.5)' : 'rgba(59,130,246,0.5)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 26,
                    color: fill >= 1 ? EMERALD : SKY,
                  }}
                >
                  {fill >= 1 ? '✓' : '···'}
                </div>
                <div>
                  <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 600, color: INK}}>
                    {d.name}
                  </div>
                  <div style={{fontFamily: MONO, fontSize: 26, color: FAINT, marginTop: 6}}>
                    {d.meta}
                  </div>
                </div>
              </div>
              <div style={{fontFamily: MONO, fontSize: 30, color: fill >= 1 ? EMERALD : SKY}}>
                {fill >= 1 ? 'VERIFIED' : Math.round(fill * 100) + '%'}
              </div>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: 'rgba(148,163,184,0.15)',
                overflow: 'hidden',
                opacity: re,
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: '100%',
                  borderRadius: 5,
                  background: fill >= 1 ? EMERALD : SKY,
                  boxShadow: `0 0 18px ${fill >= 1 ? 'rgba(52,211,153,0.7)' : 'rgba(56,189,248,0.7)'}`,
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
// Review timeline (right)
// ---------------------------------------------------------------------------
const ReviewTimeline: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 120, fps);
  const startY = 620;
  const gap = 260;
  return (
    <div
      style={{
        position: 'absolute',
        left: 2080,
        top: 460,
        width: 1520,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '56px 72px 64px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 6,
          color: MUTED,
          marginBottom: 20,
        }}
      >
        REVIEW TIMELINE
      </div>
      <svg width={1376} height={startY - 480 + gap * 3 + 120} style={{display: 'block'}}>
        <defs>
          <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <line
          x1={46}
          y1={startY - 480}
          x2={46}
          y2={startY - 480 + gap * 3}
          stroke={HAIRLINE}
          strokeWidth={4}
        />
        {STAGES.map((s, i) => {
          const y = startY - 480 + i * gap;
          const a = entr(frame, s.start, fps);
          const done = prog(frame, s.start + 90, s.start + 170);
          const active = a > 0.5 && done < 1;
          return (
            <g key={s.title} opacity={a}>
              <line
                x1={46}
                y1={startY - 480}
                x2={46}
                y2={y}
                stroke={s.color}
                strokeWidth={4}
                strokeDasharray={`${(startY - 480 + gap * 3) - (startY - 480)}`}
                strokeDashoffset={(1 - done) * gap * 3}
                opacity={0.85}
              />
              <circle cx={46} cy={y} r={30} fill={s.color} opacity={0.35 * a} filter="url(#nodeGlow)" />
              <circle
                cx={46}
                cy={y}
                r={22}
                fill={BG}
                stroke={s.color}
                strokeWidth={5}
              />
              {done >= 1 && (
                <text
                  x={46}
                  y={y + 13}
                  textAnchor="middle"
                  fontSize={26}
                  fill={s.color}
                  fontFamily={MONO}
                >
                  ✓
                </text>
              )}
              {active && (
                <circle cx={46} cy={y} r={34} fill="none" stroke={s.color} strokeWidth={3} opacity={0.6 + 0.4 * Math.sin(frame * 0.15)} />
              )}
              <text x={110} y={y - 8} fontSize={40} fontWeight={700} fill={INK} fontFamily={FONT}>
                {s.title}
              </text>
              <text x={110} y={y + 44} fontSize={30} fill={MUTED} fontFamily={MONO}>
                {s.detail}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payout panel (bottom)
// ---------------------------------------------------------------------------
const PayoutPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 660, fps);
  const count = interpolate(frame, [700, 850], [0, PAYOUT], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const approved = prog(frame, 850, 890);
  const burst = spring({frame: Math.max(0, frame - 850), fps, config: {damping: 8, stiffness: 90}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 1720,
        width: 3360,
        height: 300,
        background: 'rgba(6, 26, 20, 0.94)',
        border: `1px solid rgba(52,211,153,0.45)`,
        borderRadius: 28,
        padding: '40px 72px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45), 0 0 90px rgba(52,211,153,0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: EMERALD, marginBottom: 16}}>
          APPROVED PAYOUT
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 150,
            fontWeight: 700,
            color: INK,
            letterSpacing: -2,
            textShadow: '0 4px 60px rgba(52,211,153,0.4)',
            transform: `scale(${1 + (1 - burst) * 0.06})`,
          }}
        >
          {money(count)}
        </div>
      </div>
      <div style={{textAlign: 'right'}}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: MONO,
            fontSize: 34,
            letterSpacing: 3,
            color: BG,
            background: EMERALD,
            borderRadius: 16,
            padding: '18px 40px',
            fontWeight: 700,
            opacity: approved,
            transform: `scale(${0.8 + 0.2 * approved})`,
            boxShadow: '0 0 40px rgba(52,211,153,0.6)',
          }}
        >
          ✓ TRANSFER INITIATED
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, color: MUTED, marginTop: 20, letterSpacing: 2}}>
          TO ACCOUNT ····4821 · 2 BUSINESS DAYS
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 27,
        letterSpacing: 4,
        color: FAINT,
        opacity: e,
      }}
    >
      <span>SECURE CLAIM PORTAL</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;ADJUSTER ASSIGNED · M. ALVAREZ</span>
      <span>CLAIM TRACKING · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const InsuranceClaimJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <ClaimCard frame={frame} fps={fps} />
      <DocsPanel frame={frame} fps={fps} />
      <ReviewTimeline frame={frame} fps={fps} />
      <PayoutPanel frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default InsuranceClaimJourney;
