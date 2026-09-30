/**
 * FinancialAidApplicationJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral FAFSA-style financial aid application process visual for
 * colleges, edtech, and financial-aid consultancies: documents gather, an
 * FSA ID is created, three form sections complete in sequence (student ->
 * contributor invite -> parent), the form is signed and submitted, a Student
 * Aid Index gauge computes, and the aid package fans out into grants,
 * federal loans, and work-study. Demand-validated 2026-09-30 (PROVEN).
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (deep academic navy + gold)
// ---------------------------------------------------------------------------
const BG = '#060D1A';
const INK = '#F2F5FA';
const MUTED = 'rgba(242,245,250,0.60)';
const GOLD = '#FFC94D';
const GOLD_DIM = 'rgba(255,201,77,0.14)';
const BLUE = '#4DA3FF';
const GREEN = '#34D399';
const PANEL = 'rgba(9,18,36,0.92)';
const HAIRLINE = 'rgba(242,245,250,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const PHASES = [
  {key: 'docs', label: 'DOCUMENTS', start: 90, end: 260},
  {key: 'fsaid', label: 'FSA ID', start: 250, end: 420},
  {key: 'sections', label: 'FORM SECTIONS', start: 410, end: 640},
  {key: 'submit', label: 'SIGN & SUBMIT', start: 630, end: 770},
  {key: 'aid', label: 'AID PACKAGE', start: 760, end: 900},
];

const DOCS = [
  {name: 'FEDERAL TAX RETURN', detail: '1040 · 2024'},
  {name: 'W-2 / INCOME RECORDS', detail: 'WAGES'},
  {name: 'SOCIAL SECURITY NO.', detail: 'ID VERIFIED'},
];

const SECTIONS = [
  {name: 'STUDENT INFO', sub: 'demographics · schools', rows: 5},
  {name: 'CONTRIBUTOR INVITE', sub: 'parent invited via email', rows: 3},
  {name: 'PARENT INFO', sub: 'income · assets', rows: 5},
];

const AID_TYPES = [
  {name: 'GRANTS', amount: 7395, note: 'no repayment', color: GREEN},
  {name: 'FEDERAL LOANS', amount: 5500, note: 'subsidized', color: BLUE},
  {name: 'WORK-STUDY', amount: 3000, note: 'part-time', color: GOLD},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="faGlow" cx="50%" cy="28%" r="80%">
      <stop offset="0%" stopColor="#0E2A5E" stopOpacity={0.85} />
      <stop offset="55%" stopColor="#0A1834" stopOpacity={0.35} />
      <stop offset="100%" stopColor="#060D1A" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="faVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#02040A" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="faGoldBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#8A5E12" />
      <stop offset="50%" stopColor="#FFC94D" />
      <stop offset="100%" stopColor="#FFE9B0" />
    </linearGradient>
    <linearGradient id="faSweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFC94D" stopOpacity={0} />
      <stop offset="50%" stopColor="#FFC94D" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#FFC94D" stopOpacity={0} />
    </linearGradient>
    <filter id="faBlur24" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation={24} />
    </filter>
    <filter id="faGlow8" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={8} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: navy base + glow + vignette + drifting dot grid + light sweep
// ---------------------------------------------------------------------------
const DOTS_X = 32;
const DOTS_Y = 18;

const Background: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  const drift = (frame * 0.55) % 120;
  for (let ix = 0; ix <= DOTS_X; ix++) {
    for (let iy = 0; iy <= DOTS_Y; iy++) {
      const x = ix * 120 - drift;
      const y = iy * 120;
      const tw = 0.05 + 0.05 * random(`fa-dot-${ix}-${iy}-${Math.floor(frame / 24)}`);
      dots.push(
        <circle key={`${ix}-${iy}`} cx={x} cy={y} r={2.4} fill="#9DB8E8" opacity={tw} />,
      );
    }
  }
  const sweepY = interpolate(frame, [0, 900], [-400, 2560], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#faGlow)" />
      <g>{dots}</g>
      <rect x={0} y={sweepY - 260} width={3840} height={520} fill="url(#faSweep)" />
      <rect width={3840} height={2160} fill="url(#faVig)" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 1100;

const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`fa-grain-x-${frame}-${i}`) * 3840;
    const y = random(`fa-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`fa-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`fa-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`fa-grain-w-${frame}-${i}`) > 0.5;
    rects.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={s}
        height={s}
        fill={white ? '#FFFFFF' : '#000000'}
        opacity={o}
      />,
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      {rects}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const p = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 120, stiffness: 160}});
  const y = interpolate(p, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 120, left: 0, right: 0, opacity: op, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 240px'}}>
        <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 8, color: MUTED}}>
          FEDERAL STUDENT AID
        </div>
        <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 8, color: MUTED}}>
          AID YEAR 2027–28
        </div>
      </div>
      <div style={{textAlign: 'center', marginTop: 36}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 118, letterSpacing: 10, color: INK, textShadow: '0 4px 40px rgba(0,0,0,0.6)'}}>
          FINANCIAL AID
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 22, color: GOLD, marginTop: 14}}>
          APPLICATION JOURNEY
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step rail: 5 phase nodes with drawing connector
// ---------------------------------------------------------------------------
const RAIL_TOP = 620;
const RAIL_LEFT = 420;
const RAIL_RIGHT = 3420;

const StepRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: Math.max(0, frame - 40), fps, config: {damping: 120, stiffness: 140}});
  const op = interpolate(enter, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lineDraw = interpolate(frame, [70, 780], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const n = PHASES.length;
  const nodes = PHASES.map((ph, i) => {
    const x = RAIL_LEFT + (i * (RAIL_RIGHT - RAIL_LEFT)) / (n - 1);
    const on = frame >= ph.start;
    const active = frame >= ph.start && frame < ph.end;
    const pop = on
      ? spring({frame: Math.max(0, frame - ph.start), fps, config: {damping: 90, stiffness: 220}})
      : 0;
    const r = 26 + pop * 22;
    return {x, on, active, r, ph};
  });
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        <line x1={RAIL_LEFT} y1={RAIL_TOP} x2={RAIL_RIGHT} y2={RAIL_TOP} stroke={HAIRLINE} strokeWidth={6} />
        <line
          x1={RAIL_LEFT}
          y1={RAIL_TOP}
          x2={RAIL_LEFT + (RAIL_RIGHT - RAIL_LEFT) * lineDraw}
          y2={RAIL_TOP}
          stroke={GOLD}
          strokeWidth={6}
          filter="url(#faGlow8)"
        />
        {nodes.map(({x, on, active, r, ph}, i) => (
          <g key={ph.key}>
            <circle
              cx={x}
              cy={RAIL_TOP}
              r={r}
              fill={active ? GOLD : on ? '#12244A' : '#0A1428'}
              stroke={on ? GOLD : HAIRLINE}
              strokeWidth={on ? 4 : 2}
              filter={active ? 'url(#faGlow8)' : undefined}
            />
            {on && (
              <text
                x={x}
                y={RAIL_TOP + 12}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={34}
                fontWeight={700}
                fill={active ? '#0A1428' : GOLD}
              >
                ✓
              </text>
            )}
            <text
              x={x}
              y={RAIL_TOP + 84}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize={30}
              letterSpacing={5}
              fill={active ? GOLD : on ? INK : MUTED}
              fontWeight={active ? 700 : 400}
            >
              {ph.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Phase panels (detail stage y 780 - 1880)
// ---------------------------------------------------------------------------
const panelAnim = (frame: number, fps: number, start: number, end: number) => {
  const inn = spring({frame: Math.max(0, frame - start), fps, config: {damping: 110, stiffness: 150}});
  const fadeIn = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slide = interpolate(inn, [0, 1], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut =
    frame > end - 40
      ? interpolate(frame, [end - 40, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : 1;
  return {opacity: fadeIn * fadeOut, y: slide};
};

const DocumentsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const {opacity, y} = panelAnim(frame, fps, 90, 265);
  if (opacity <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 800, left: 0, right: 0, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', justifyContent: 'center', gap: 90}}>
        {DOCS.map((d, i) => {
          const tick = frame >= 110 + i * 45;
          const pop = tick
            ? spring({frame: frame - (110 + i * 45), fps, config: {damping: 90, stiffness: 240}})
            : 0;
          return (
            <div
              key={d.name}
              style={{
                width: 780,
                padding: '54px 60px',
                background: PANEL,
                border: `2px solid ${tick ? GOLD : HAIRLINE}`,
                borderRadius: 28,
                transform: `scale(${0.92 + pop * 0.08})`,
                boxShadow: tick ? '0 0 60px rgba(255,201,77,0.18)' : 'none',
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: tick ? GOLD : 'rgba(242,245,250,0.08)',
                    color: tick ? '#0A1428' : MUTED,
                    fontSize: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  {tick ? '✓' : '…'}
                </div>
                <div>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: INK, letterSpacing: 2}}>
                    {d.name}
                  </div>
                  <div style={{fontFamily: MONO, fontSize: 30, color: tick ? GOLD : MUTED, marginTop: 10, letterSpacing: 4}}>
                    {d.detail}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{textAlign: 'center', marginTop: 60, fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: MUTED}}>
        GATHER TAX + INCOME + IDENTITY DOCUMENTS BEFORE YOU BEGIN
      </div>
    </div>
  );
};

const FsaIdPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const {opacity, y} = panelAnim(frame, fps, 255, 425);
  if (opacity <= 0) return null;
  const barW = interpolate(frame, [300, 400], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const verified = frame >= 385;
  return (
    <div style={{position: 'absolute', top: 800, left: 0, right: 0, opacity, transform: `translateY(${y}px)`, display: 'flex', justifyContent: 'center'}}>
      <div style={{width: 1500, padding: '70px 90px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 32}}>
        <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: GOLD}}>STEP 01 — CREATE YOUR FSA ID</div>
        <div style={{display: 'flex', gap: 60, marginTop: 50, alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <div style={{fontFamily: MONO, fontSize: 30, color: MUTED, letterSpacing: 4}}>USERNAME</div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 54, color: INK, marginTop: 8}}>student.aid.2027</div>
            <div style={{fontFamily: MONO, fontSize: 30, color: MUTED, letterSpacing: 4, marginTop: 34}}>PASSWORD</div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 54, color: INK, marginTop: 8, letterSpacing: 6}}>
              ••••••••••••
            </div>
          </div>
          <div style={{width: 320, textAlign: 'center'}}>
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: '50%',
                margin: '0 auto',
                border: `10px solid ${verified ? GREEN : 'rgba(242,245,250,0.15)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 110,
                color: verified ? GREEN : MUTED,
                boxShadow: verified ? '0 0 70px rgba(52,211,153,0.35)' : 'none',
              }}
            >
              {verified ? '✓' : '◌'}
            </div>
            <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: verified ? GREEN : MUTED, marginTop: 24}}>
              {verified ? 'ID VERIFIED' : 'VERIFYING…'}
            </div>
          </div>
        </div>
        <div style={{marginTop: 46, height: 26, background: 'rgba(242,245,250,0.10)', borderRadius: 13, overflow: 'hidden'}}>
          <div style={{width: `${barW * 100}%`, height: '100%', background: 'url(#faGoldBar)', borderRadius: 13}} />
        </div>
        <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 16, letterSpacing: 3, textAlign: 'right'}}>
          {Math.round(barW * 100)}% — YOUR ELECTRONIC SIGNATURE FOR EVERY AID YEAR
        </div>
      </div>
    </div>
  );
};

const SectionsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const {opacity, y} = panelAnim(frame, fps, 415, 645);
  if (opacity <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 780, left: 0, right: 0, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', justifyContent: 'center', gap: 70}}>
        {SECTIONS.map((s, si) => {
          const start = 440 + si * 62;
          const doneCount = Math.max(0, Math.min(s.rows, Math.floor((frame - start) / 12)));
          const allDone = frame >= start + s.rows * 12 + 10;
          const inn = spring({frame: Math.max(0, frame - (start - 20)), fps, config: {damping: 110, stiffness: 160}});
          return (
            <div
              key={s.name}
              style={{
                width: 940,
                padding: '50px 56px',
                background: PANEL,
                border: `2px solid ${allDone ? GREEN : HAIRLINE}`,
                borderRadius: 28,
                opacity: interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                transform: `translateY(${interpolate(inn, [0, 1], [50, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: INK, letterSpacing: 3}}>
                  {s.name}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 28,
                    letterSpacing: 4,
                    color: allDone ? GREEN : MUTED,
                    border: `2px solid ${allDone ? GREEN : HAIRLINE}`,
                    borderRadius: 12,
                    padding: '10px 22px',
                  }}
                >
                  {allDone ? '✓ COMPLETE' : `${doneCount}/${s.rows}`}
                </div>
              </div>
              <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 8, letterSpacing: 2}}>{s.sub}</div>
              <div style={{marginTop: 36, display: 'flex', flexDirection: 'column', gap: 18}}>
                {Array.from({length: s.rows}).map((_, r) => {
                  const filled = r < doneCount;
                  const w = 0.55 + random(`fa-sec-${si}-${r}`) * 0.4;
                  return (
                    <div key={r} style={{height: 22, background: 'rgba(242,245,250,0.08)', borderRadius: 11, overflow: 'hidden'}}>
                      <div
                        style={{
                          width: filled ? `${w * 100}%` : '0%',
                          height: '100%',
                          background: filled ? (allDone ? GREEN : BLUE) : 'transparent',
                          borderRadius: 11,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{textAlign: 'center', marginTop: 56, fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: MUTED}}>
        SECTIONS COMPLETE IN SEQUENCE — STUDENT → CONTRIBUTOR → PARENT
      </div>
    </div>
  );
};

const SubmitPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const {opacity, y} = panelAnim(frame, fps, 635, 775);
  if (opacity <= 0) return null;
  const sig = interpolate(frame, [655, 715], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stamped = frame >= 715;
  const stampP = stamped
    ? spring({frame: frame - 715, fps, config: {damping: 60, stiffness: 320}})
    : 0;
  const refNum = Math.floor(interpolate(frame, [720, 770], [0, 88273194], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', top: 800, left: 0, right: 0, opacity, transform: `translateY(${y}px)`, display: 'flex', justifyContent: 'center'}}>
      <div style={{width: 1700, padding: '64px 90px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 32, position: 'relative'}}>
        <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: GOLD}}>STEP 04 — SIGN & SUBMIT</div>
        <svg width={1520} height={150} style={{marginTop: 40}}>
          <line x1={40} y1={110} x2={1480} y2={110} stroke={HAIRLINE} strokeWidth={3} />
          <path
            d="M 120 95 C 260 20, 340 120, 480 60 S 700 110, 860 55 S 1100 100, 1300 60"
            fill="none"
            stroke={INK}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={1400}
            strokeDashoffset={1400 * (1 - sig)}
          />
        </svg>
        <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, letterSpacing: 4}}>ELECTRONIC SIGNATURE — FSA ID</div>
        <div style={{marginTop: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, letterSpacing: 4}}>
            CONFIRMATION&nbsp;&nbsp;<span style={{color: INK, fontWeight: 700}}>FA-{String(refNum).padStart(8, '0')}</span>
          </div>
          <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, letterSpacing: 4}}>
            STATUS: <span style={{color: stamped ? GREEN : GOLD, fontWeight: 700}}>{stamped ? 'SUBMITTED' : 'SIGNING…'}</span>
          </div>
        </div>
        {stamped && (
          <div
            style={{
              position: 'absolute',
              top: 120,
              right: 120,
              transform: `rotate(-12deg) scale(${0.6 + stampP * 0.4})`,
              opacity: interpolate(stampP, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              border: `8px solid ${GREEN}`,
              borderRadius: 18,
              padding: '18px 44px',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 64,
              letterSpacing: 8,
              color: GREEN,
              boxShadow: '0 0 50px rgba(52,211,153,0.4)',
            }}
          >
            SUBMITTED
          </div>
        )}
      </div>
    </div>
  );
};

const AidPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - 765), fps, config: {damping: 110, stiffness: 150}});
  const opacity = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (opacity <= 0) return null;
  const y = interpolate(inn, [0, 1], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sai = Math.floor(interpolate(frame, [780, 860], [0, 18240], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const total = AID_TYPES.reduce((a, t) => a + t.amount, 0);
  const liveTotal = Math.floor(interpolate(frame, [800, 895], [0, total], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const maxAmt = Math.max(...AID_TYPES.map((t) => t.amount));
  return (
    <div style={{position: 'absolute', top: 800, left: 0, right: 0, opacity, transform: `translateY(${y}px)`, display: 'flex', justifyContent: 'center', gap: 80}}>
      <div style={{width: 1050, padding: '56px 70px', background: PANEL, border: `2px solid ${GOLD_DIM}`, borderRadius: 32, textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: MUTED}}>STUDENT AID INDEX</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 120, color: GOLD, marginTop: 16, textShadow: '0 0 40px rgba(255,201,77,0.35)'}}>
          {sai.toLocaleString('en-US')}
        </div>
        <svg width={900} height={130} style={{marginTop: 10}}>
          {Array.from({length: 60}).map((_, i) => (
            <rect
              key={i}
              x={30 + i * 14}
              y={40}
              width={8}
              height={i / 60 < sai / 40000 ? 60 : 34}
              fill={i / 60 < sai / 40000 ? GOLD : 'rgba(242,245,250,0.12)'}
              rx={4}
            />
          ))}
        </svg>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: GREEN, marginTop: 20}}>
          ✓ ELIGIBLE FOR NEED-BASED AID
        </div>
      </div>
      <div style={{width: 1650, padding: '56px 70px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 32}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: MUTED}}>YOUR AID PACKAGE</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: INK}}>
            ${liveTotal.toLocaleString('en-US')}<span style={{fontSize: 30, color: MUTED}}>/yr</span>
          </div>
        </div>
        <div style={{marginTop: 44, display: 'flex', flexDirection: 'column', gap: 34}}>
          {AID_TYPES.map((t, i) => {
            const start = 800 + i * 28;
            const p = interpolate(frame, [start, start + 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={t.name}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: INK, letterSpacing: 3}}>{t.name}</div>
                  <div style={{fontFamily: MONO, fontSize: 34, color: t.color}}>
                    ${Math.floor(t.amount * p).toLocaleString('en-US')} <span style={{color: MUTED, fontSize: 26}}>· {t.note}</span>
                  </div>
                </div>
                <div style={{marginTop: 14, height: 30, background: 'rgba(242,245,250,0.08)', borderRadius: 15, overflow: 'hidden'}}>
                  <div style={{width: `${(t.amount / maxAmt) * p * 100}%`, height: '100%', background: t.color, borderRadius: 15, boxShadow: `0 0 24px ${t.color}`}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom ticker (per-frame motion)
// ---------------------------------------------------------------------------
const TICKER = '  •  $150B+ FEDERAL AID DISBURSED EACH YEAR    •  ~85% OF U.S. UNDERGRADS RECEIVE FEDERAL AID    •  2027–28 FAFSA OPENS OCTOBER 1    •  FILE EARLY — SOME AID IS FIRST-COME    ';

const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const x = -((frame * 7) % 2400);
  return (
    <div style={{position: 'absolute', bottom: 64, left: 0, right: 0, overflow: 'hidden', borderTop: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, padding: '22px 0'}}>
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 5, color: MUTED, whiteSpace: 'nowrap', transform: `translateX(${x}px)`}}>
        {TICKER.repeat(3)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const FinancialAidApplicationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <StepRail frame={frame} fps={fps} />
      <DocumentsPanel frame={frame} fps={fps} />
      <FsaIdPanel frame={frame} fps={fps} />
      <SectionsPanel frame={frame} fps={fps} />
      <SubmitPanel frame={frame} fps={fps} />
      <AidPanel frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
