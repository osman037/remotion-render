/**
 * CreatorMonetizationJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral creator-monetization journey for creator-economy courses,
 * MCNs, and creator-tool SaaS: the fixed partner-program arc — 1,000
 * subscribers, 4,000 watch hours, studio review, ad account, mailed PIN,
 * the $100 payout threshold, and the first payout. Demand-validated
 * 2026-09-30 (PLAUSIBLE).
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
// Palette (creator red + play-button dark)
// ---------------------------------------------------------------------------
const BG = '#0E0708';
const INK = '#FAF3F0';
const MUTED = 'rgba(250,243,240,0.58)';
const RED = '#FF4D4D';
const GOLD = '#FFC94D';
const GREEN = '#34D399';
const BLUE = '#60A5FA';
const PANEL = 'rgba(18,10,11,0.94)';
const HAIRLINE = 'rgba(250,243,240,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------
const MILESTONES = [
  {label: '1,000 SUBS', start: 90, color: RED},
  {label: '4,000 WATCH HRS', start: 200, color: RED},
  {label: 'STUDIO REVIEW', start: 330, color: BLUE},
  {label: 'AD ACCOUNT', start: 450, color: GOLD},
  {label: 'PIN MAILED', start: 560, color: GOLD},
  {label: '$100 THRESHOLD', start: 680, color: GREEN},
  {label: 'FIRST PAYOUT', start: 790, color: GREEN},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="cmGlow" cx="50%" cy="28%" r="80%">
      <stop offset="0%" stopColor="#3D1114" stopOpacity={0.85} />
      <stop offset="55%" stopColor="#220D0F" stopOpacity={0.32} />
      <stop offset="100%" stopColor="#0E0708" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="cmVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#050203" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="cmSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#FF4D4D" stopOpacity={0} />
      <stop offset="50%" stopColor="#FF4D4D" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0} />
    </linearGradient>
    <filter id="cmGlow10" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={10} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: glow + vignette + rising play particles + sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 80; i++) {
    const bx = random(`cm-p-x-${i}`) * 3840;
    const by = random(`cm-p-y-${i}`) * 2160;
    const y = ((by + frame * (0.8 + random(`cm-p-v-${i}`) * 1.6)) % 2300) - 70;
    const o = 0.04 + random(`cm-p-o-${i}`) * 0.06;
    const s = 8 + random(`cm-p-s-${i}`) * 20;
    parts.push(
      <polygon
        key={i}
        points={`${bx},${y - s} ${bx + s * 0.9},${y} ${bx},${y + s}`}
        fill="#FF4D4D"
        opacity={o}
      />,
    );
  }
  const sweepX = interpolate(frame, [0, 900], [-500, 4340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#cmGlow)" />
      <g>{parts}</g>
      <rect x={sweepX - 300} y={0} width={600} height={2160} fill="url(#cmSweep)" />
      <rect width={3840} height={2160} fill="url(#cmVig)" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 1100;

const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`cm-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cm-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cm-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`cm-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`cm-grain-w-${frame}-${i}`) > 0.5;
    rects.push(
      <rect key={i} x={x} y={y} width={s} height={s} fill={white ? '#FFFFFF' : '#000000'} opacity={o} />,
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      {rects}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const p = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 120, stiffness: 160}});
  const y = interpolate(p, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 100, left: 0, right: 0, opacity: op, transform: `translateY(${y}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>CREATOR ECONOMY</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 8, color: INK, marginTop: 22}}>
        ROAD TO <span style={{color: RED}}>MONETIZATION</span>
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED, marginTop: 14}}>
        THE PARTNER-PROGRAM JOURNEY
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Milestone path
// ---------------------------------------------------------------------------
const M_TOP = 600;
const M_LEFT = 280;
const M_RIGHT = 3560;

const MilestonePath: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: Math.max(0, frame - 40), fps, config: {damping: 120, stiffness: 140}});
  const op = interpolate(enter, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const draw = interpolate(frame, [70, 830], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        <line x1={M_LEFT} y1={M_TOP} x2={M_RIGHT} y2={M_TOP} stroke={HAIRLINE} strokeWidth={6} />
        <line
          x1={M_LEFT}
          y1={M_TOP}
          x2={M_LEFT + (M_RIGHT - M_LEFT) * draw}
          y2={M_TOP}
          stroke={RED}
          strokeWidth={6}
          filter="url(#cmGlow10)"
        />
        {MILESTONES.map((m, i) => {
          const x = M_LEFT + (i * (M_RIGHT - M_LEFT)) / (MILESTONES.length - 1);
          const on = frame >= m.start;
          const pop = on ? spring({frame: frame - m.start, fps, config: {damping: 90, stiffness: 220}}) : 0;
          const active = on && (i === MILESTONES.length - 1 || frame < MILESTONES[i + 1].start);
          return (
            <g key={m.label}>
              <circle
                cx={x}
                cy={M_TOP}
                r={24 + pop * 20}
                fill={active ? m.color : on ? '#2A1214' : '#171012'}
                stroke={on ? m.color : HAIRLINE}
                strokeWidth={on ? 4 : 2}
                filter={active ? 'url(#cmGlow10)' : undefined}
              />
              {on && (
                <text x={x} y={M_TOP + 13} textAnchor="middle" fontFamily={MONO} fontSize={34} fontWeight={800} fill={active ? '#171012' : m.color}>
                  ✓
                </text>
              )}
              <text
                x={x}
                y={M_TOP + 84}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={27}
                letterSpacing={4}
                fill={active ? m.color : on ? INK : MUTED}
                fontWeight={active ? 700 : 400}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail stage: thresholds -> review -> PIN -> payout
// ---------------------------------------------------------------------------
const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  // Phase 1: threshold bars (subs + watch hours)
  const p1 = spring({frame: Math.max(0, frame - 85), fps, config: {damping: 110, stiffness: 150}});
  const p1o = interpolate(p1, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p1fade =
    frame > 300 ? interpolate(frame, [300, 340], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const subs = Math.floor(interpolate(frame, [100, 290], [0, 1000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const hours = Math.floor(interpolate(frame, [210, 320], [0, 4000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  // Phase 2: studio review spinner
  const p2 = spring({frame: Math.max(0, frame - 325), fps, config: {damping: 110, stiffness: 150}});
  const p2o = interpolate(p2, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p2fade =
    frame > 440 ? interpolate(frame, [440, 480], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const reviewP = interpolate(frame, [340, 440], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const approved = frame >= 435;

  // Phase 3: PIN envelope
  const p3 = spring({frame: Math.max(0, frame - 555), fps, config: {damping: 110, stiffness: 150}});
  const p3o = interpolate(p3, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const p3fade =
    frame > 660 ? interpolate(frame, [660, 700], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const pinOn = frame >= 620;

  // Phase 4: earnings to payout
  const p4 = spring({frame: Math.max(0, frame - 675), fps, config: {damping: 110, stiffness: 150}});
  const p4o = interpolate(p4, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const earnings = interpolate(frame, [690, 830], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const paid = frame >= 835;

  return (
    <div style={{position: 'absolute', top: 800, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      {p1o * p1fade > 0 && (
        <div style={{opacity: p1o * p1fade, width: 2200, padding: '60px 80px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 30}}>
          <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: RED}}>ELIGIBILITY THRESHOLDS</div>
          {[
            {label: 'SUBSCRIBERS', cur: subs, goal: 1000, color: RED},
            {label: 'WATCH HOURS', cur: hours, goal: 4000, color: RED},
          ].map((t) => {
            const pct = Math.min(1, t.cur / t.goal);
            return (
              <div key={t.label} style={{marginTop: 44}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: INK, letterSpacing: 3}}>{t.label}</div>
                  <div style={{fontFamily: MONO, fontSize: 40, color: pct >= 1 ? GREEN : t.color, fontWeight: 700}}>
                    {t.cur.toLocaleString('en-US')} / {t.goal.toLocaleString('en-US')} {pct >= 1 ? '✓' : ''}
                  </div>
                </div>
                <div style={{marginTop: 16, height: 30, background: 'rgba(250,243,240,0.08)', borderRadius: 15, overflow: 'hidden'}}>
                  <div style={{width: `${pct * 100}%`, height: '100%', background: pct >= 1 ? GREEN : t.color, borderRadius: 15, boxShadow: `0 0 24px ${pct >= 1 ? GREEN : t.color}`}} />
                </div>
              </div>
            );
          })}
          <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 34, letterSpacing: 3, textAlign: 'center'}}>
            OR 10M SHORTS VIEWS IN 90 DAYS — PICK YOUR PATH
          </div>
        </div>
      )}
      {p2o * p2fade > 0 && (
        <div style={{opacity: p2o * p2fade, width: 1900, padding: '60px 80px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 30, display: 'flex', gap: 70, alignItems: 'center'}}>
          <div style={{position: 'relative', width: 260, height: 260}}>
            <svg width={260} height={260}>
              <circle cx={130} cy={130} r={105} fill="none" stroke="rgba(250,243,240,0.10)" strokeWidth={22} />
              <circle
                cx={130}
                cy={130}
                r={105}
                fill="none"
                stroke={approved ? GREEN : BLUE}
                strokeWidth={22}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 105}
                strokeDashoffset={2 * Math.PI * 105 * (1 - reviewP)}
                transform="rotate(-90 130 130)"
              />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, color: approved ? GREEN : BLUE}}>
              {approved ? '✓' : '◌'}
            </div>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: BLUE}}>STUDIO REVIEW</div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 58, color: INK, marginTop: 14}}>
              {approved ? 'CHANNEL APPROVED' : 'REVIEWING YOUR CHANNEL…'}
            </div>
            <div style={{fontFamily: MONO, fontSize: 30, color: MUTED, marginTop: 14, letterSpacing: 3}}>
              {approved ? 'ORIGINAL CONTENT · POLICY COMPLIANT ✓' : 'ORIGINALITY · POLICY COMPLIANCE · AUTHENTICITY'}
            </div>
          </div>
        </div>
      )}
      {p3o * p3fade > 0 && (
        <div style={{opacity: p3o * p3fade, width: 1900, padding: '60px 80px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 30, display: 'flex', gap: 70, alignItems: 'center'}}>
          <div style={{fontSize: 200}}>✉️</div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: GOLD}}>ADDRESS VERIFICATION</div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 58, color: INK, marginTop: 14}}>
              {pinOn ? 'PIN VERIFIED ✓' : 'YOUR PIN IS IN THE MAIL'}
            </div>
            <div style={{display: 'flex', gap: 18, marginTop: 26}}>
              {[2, 4, 7, 1, 9, 3].map((d, i) => {
                const show = pinOn || frame >= 585 + i * 8;
                return (
                  <div key={i} style={{width: 96, height: 120, borderRadius: 14, background: 'rgba(250,243,240,0.07)', border: `2px solid ${HAIRLINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 56, fontWeight: 800, color: show ? GOLD : 'transparent'}}>
                    {show ? d : '·'}
                  </div>
                );
              })}
            </div>
            <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 22, letterSpacing: 3}}>
              ENTER THE 6-DIGIT CODE TO UNLOCK PAYMENTS
            </div>
          </div>
        </div>
      )}
      {p4o > 0 && (
        <div style={{opacity: p4o, width: 2300, padding: '60px 80px', background: PANEL, border: `2px solid ${paid ? GREEN : HAIRLINE}`, borderRadius: 30, boxShadow: paid ? '0 0 70px rgba(52,211,153,0.25)' : 'none'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: paid ? GREEN : MUTED}}>ESTIMATED EARNINGS</div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 100, color: paid ? GREEN : INK}}>
              ${earnings.toFixed(2)}
            </div>
          </div>
          <div style={{marginTop: 30, height: 34, background: 'rgba(250,243,240,0.08)', borderRadius: 17, overflow: 'hidden', position: 'relative'}}>
            <div style={{width: `${earnings}%`, height: '100%', background: paid ? GREEN : GOLD, borderRadius: 17, boxShadow: `0 0 24px ${paid ? GREEN : GOLD}`}} />
            <div style={{position: 'absolute', left: '100%', top: -10, transform: 'translateX(-100%)', fontFamily: MONO, fontSize: 26, color: MUTED, letterSpacing: 3, whiteSpace: 'nowrap', paddingRight: 12}}>
              $100 PAYOUT THRESHOLD
            </div>
          </div>
          {paid && (
            <div style={{marginTop: 34, textAlign: 'center'}}>
              <div style={{display: 'inline-block', border: '8px solid #34D399', borderRadius: 20, padding: '20px 70px', transform: 'rotate(-6deg)', boxShadow: '0 0 60px rgba(52,211,153,0.4)'}}>
                <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 76, letterSpacing: 10, color: GREEN}}>FIRST PAYOUT SENT</div>
              </div>
              <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED, marginTop: 22}}>BANK TRANSFER · 3–5 BUSINESS DAYS</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live revenue ticker (per-frame motion)
// ---------------------------------------------------------------------------
const LiveRevenue: React.FC<{frame: number}> = ({frame}) => {
  const rpm = 3.2 + Math.sin(frame / 90) * 0.6;
  return (
    <div style={{position: 'absolute', top: 380, right: 240, textAlign: 'right'}}>
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>EST. RPM TODAY</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 84, color: GOLD}}>${rpm.toFixed(2)}</div>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: MUTED, marginTop: 6}}>PER 1,000 MONETIZED VIEWS</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticker strip
// ---------------------------------------------------------------------------
const STRIP = '  •  1,000 SUBS + 4,000 WATCH HOURS = THE GATE    •  REVIEW TAKES DAYS, NOT MINUTES — KEEP POSTING    •  PIN ARRIVES BY MAIL IN 2–4 WEEKS    •  PAYOUTS START AT $100    ';

const Strip: React.FC<{frame: number}> = ({frame}) => {
  const x = -((frame * 7) % 2400);
  return (
    <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, overflow: 'hidden', borderTop: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, padding: '22px 0'}}>
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 5, color: MUTED, whiteSpace: 'nowrap', transform: `translateX(${x}px)`}}>
        {STRIP.repeat(3)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CreatorMonetizationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <MilestonePath frame={frame} fps={fps} />
      <LiveRevenue frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Strip frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
