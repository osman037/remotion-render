/**
 * BackgroundCheckProcess.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral employment background-check process for HR teams,
 * staffing firms, and training vendors: candidate consent, four records
 * checks (identity, employment, education, criminal) with scanning sweeps,
 * a compiled report, and the CLEARED verdict. Document/records arc only —
 * no biometric face scanning (that duplicates produced KYCVerificationFlow).
 * Demand-validated 2026-09-30 (PLAUSIBLE-strong).
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
// Palette (HR slate + teal, institutional)
// ---------------------------------------------------------------------------
const BG = '#080D16';
const INK = '#EEF3FA';
const MUTED = 'rgba(238,243,250,0.58)';
const TEAL = '#2DD4BF';
const BLUE = '#60A5FA';
const VIOLET = '#A78BFA';
const AMBER = '#FBBF24';
const GREEN = '#34D399';
const PANEL = 'rgba(10,17,29,0.94)';
const HAIRLINE = 'rgba(238,243,250,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const CHECKS = [
  {name: 'IDENTITY', records: ['SSN TRACE', 'ADDRESS HISTORY', 'NAME VARIANTS'], color: TEAL, sources: 4},
  {name: 'EMPLOYMENT', records: ['7-YR HISTORY', 'TITLE MATCH', 'REHIRE STATUS'], color: BLUE, sources: 5},
  {name: 'EDUCATION', records: ['DEGREE CONFIRM', 'DATES ATTENDED', 'ACCREDITATION'], color: VIOLET, sources: 3},
  {name: 'CRIMINAL', records: ['COUNTY COURTS', 'STATE REPOS', 'FEDERAL', 'WATCHLIST'], color: AMBER, sources: 6},
];

const CONSENT_START = 90;
const CHECK_START = 240;
const CHECK_GAP = 120;
const REPORT_START = 700;
const VERDICT_START = 790;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bcGlow" cx="50%" cy="28%" r="80%">
      <stop offset="0%" stopColor="#0F2E38" stopOpacity={0.85} />
      <stop offset="55%" stopColor="#0B1B26" stopOpacity={0.32} />
      <stop offset="100%" stopColor="#080D16" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="bcVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#02060C" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="bcSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0} />
      <stop offset="50%" stopColor="#2DD4BF" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
    </linearGradient>
    <filter id="bcGlow10" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={10} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: glow + vignette + drifting document shimmer + sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const shards: React.ReactElement[] = [];
  for (let i = 0; i < 70; i++) {
    const bx = random(`bc-shard-x-${i}`) * 3840;
    const by = random(`bc-shard-y-${i}`) * 2160;
    const y = ((by + frame * (0.4 + random(`bc-shard-v-${i}`) * 1.0)) % 2300) - 70;
    const w = 30 + random(`bc-shard-w-${i}`) * 90;
    const o = 0.03 + random(`bc-shard-o-${i}`) * 0.05;
    shards.push(<rect key={i} x={bx} y={y} width={w} height={10} rx={5} fill="#7DD3FC" opacity={o} transform={`rotate(${random(`bc-shard-r-${i}`) * 30 - 15} ${bx} ${y})`} />);
  }
  const sweepX = interpolate(frame, [0, 900], [-500, 4340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#bcGlow)" />
      <g>{shards}</g>
      <rect x={sweepX - 300} y={0} width={600} height={2160} fill="url(#bcSweep)" />
      <rect width={3840} height={2160} fill="url(#bcVig)" />
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
    const x = random(`bc-grain-x-${frame}-${i}`) * 3840;
    const y = random(`bc-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`bc-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`bc-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`bc-grain-w-${frame}-${i}`) > 0.5;
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
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>PRE-EMPLOYMENT SCREENING</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 8, color: INK, marginTop: 22}}>
        BACKGROUND <span style={{color: TEAL}}>CHECK</span>
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED, marginTop: 14}}>
        CONSENT → RECORDS → REPORT → DECISION
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Consent card
// ---------------------------------------------------------------------------
const Consent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - CONSENT_START), fps, config: {damping: 110, stiffness: 160}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const signed = frame >= 170;
  const sigP = interpolate(frame, [175, 225], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut =
    frame > 260
      ? interpolate(frame, [260, 300], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : 1;
  if (op * fadeOut <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 620, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op * fadeOut}}>
      <div style={{width: 1900, padding: '70px 90px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 30, position: 'relative'}}>
        <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: TEAL}}>STEP 01 — CANDIDATE CONSENT</div>
        <div style={{fontFamily: FONT, fontSize: 44, color: INK, marginTop: 28, lineHeight: 1.5}}>
          I authorize a pre-employment background check, including identity,
          employment, education, and criminal records searches.
        </div>
        <svg width={1720} height={120} style={{marginTop: 30}}>
          <line x1={20} y1={85} x2={900} y2={85} stroke={HAIRLINE} strokeWidth={3} />
          <path
            d="M 60 70 C 180 20, 260 90, 380 45 S 560 80, 700 40 S 820 70, 880 55"
            fill="none"
            stroke={INK}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={900}
            strokeDashoffset={900 * (1 - sigP)}
          />
        </svg>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
          <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, letterSpacing: 4}}>CANDIDATE SIGNATURE</div>
          <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 4, color: signed ? GREEN : AMBER, fontWeight: 700}}>
            {signed ? '✓ CONSENT RECORDED' : 'AWAITING SIGNATURE…'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Four records-check panels with scan sweeps
// ---------------------------------------------------------------------------
const Checks: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const containerFade =
    frame > 660
      ? interpolate(frame, [660, 700], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : 1;
  if (containerFade <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60, opacity: containerFade}}>
      {CHECKS.map((c, i) => {
        const start = CHECK_START + i * CHECK_GAP;
        const inn = spring({frame: Math.max(0, frame - start), fps, config: {damping: 110, stiffness: 160}});
        const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const y = interpolate(inn, [0, 1], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (op <= 0) return null;
        const doneAt = start + 100;
        const done = frame >= doneAt;
        const scanY = interpolate(frame, [start + 20, doneAt], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const sourcesHit = Math.floor(interpolate(frame, [start + 20, doneAt], [0, c.sources], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        return (
          <div
            key={c.name}
            style={{
              width: 820,
              padding: '50px 54px',
              background: PANEL,
              border: `2px solid ${done ? c.color : HAIRLINE}`,
              borderTop: `8px solid ${c.color}`,
              borderRadius: 26,
              opacity: op,
              transform: `translateY(${y}px)`,
              boxShadow: done ? `0 0 50px ${c.color}30` : 'none',
            }}
          >
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: INK, letterSpacing: 4}}>{c.name}</div>
            <div style={{marginTop: 30, position: 'relative'}}>
              {c.records.map((r, k) => {
                const tick = frame >= start + 30 + k * 20;
                return (
                  <div key={r} style={{display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${HAIRLINE}`, opacity: tick ? 1 : 0.25}}>
                    <span style={{fontFamily: MONO, fontSize: 29, color: tick ? INK : MUTED, letterSpacing: 2}}>{r}</span>
                    <span style={{fontFamily: MONO, fontSize: 29, color: tick ? c.color : MUTED, fontWeight: 700}}>{tick ? '✓' : '···'}</span>
                  </div>
                );
              })}
              {!done && frame > start + 20 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: scanY * 220,
                    height: 6,
                    background: c.color,
                    boxShadow: `0 0 30px ${c.color}`,
                  }}
                />
              )}
            </div>
            <div style={{marginTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, letterSpacing: 3}}>
                {done ? `${c.sources} SOURCES` : `${sourcesHit}/${c.sources} SOURCES`}
              </div>
              <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: done ? c.color : AMBER, fontWeight: 700}}>
                {done ? '✓ CLEAR' : 'SEARCHING…'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Report + verdict payoff
// ---------------------------------------------------------------------------
const Report: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - REPORT_START), fps, config: {damping: 100, stiffness: 150}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(inn, [0, 1], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const verdictOn = frame >= VERDICT_START;
  const verdictP = verdictOn ? spring({frame: frame - VERDICT_START, fps, config: {damping: 60, stiffness: 300}}) : 0;
  const pages = Math.min(18, Math.floor(interpolate(frame, [REPORT_START, VERDICT_START], [0, 18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  if (op <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op, transform: `translateY(${y}px)`}}>
      <div style={{width: 2300, padding: '70px 90px', background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 30, position: 'relative'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: TEAL}}>FINAL REPORT</div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 60, color: INK, marginTop: 14}}>CANDIDATE SCREENING SUMMARY</div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, letterSpacing: 4}}>PAGES COMPILED</div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 72, color: INK}}>{pages}</div>
          </div>
        </div>
        <div style={{marginTop: 36, display: 'flex', gap: 26}}>
          {CHECKS.map((c) => (
            <div key={c.name} style={{flex: 1, padding: '26px 30px', background: 'rgba(238,243,250,0.05)', borderRadius: 18, border: `2px solid ${c.color}`}}>
              <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: c.color, fontWeight: 700}}>{c.name}</div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, color: GREEN, marginTop: 10}}>✓ CLEAR</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 30, letterSpacing: 3}}>
          0 FLAGS · FCRA-COMPLIANT · TURNAROUND 36 HOURS
        </div>
        {verdictOn && (
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: 90,
              transform: `rotate(10deg) scale(${0.5 + verdictP * 0.5})`,
              opacity: interpolate(verdictP, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              border: '10px solid #34D399',
              borderRadius: 24,
              padding: '26px 60px',
              background: 'rgba(52,211,153,0.08)',
              boxShadow: '0 0 80px rgba(52,211,153,0.45)',
            }}
          >
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 110, letterSpacing: 12, color: GREEN}}>CLEARED</div>
            <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: MUTED, textAlign: 'center', marginTop: 8}}>READY TO HIRE</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live records counter (per-frame motion)
// ---------------------------------------------------------------------------
const LiveCounter: React.FC<{frame: number}> = ({frame}) => {
  const n = Math.floor(interpolate(frame, [240, 700], [0, 1400], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', top: 380, right: 240, textAlign: 'right'}}>
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>RECORDS SEARCHED</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 84, color: INK}}>{n.toLocaleString('en-US')}</div>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: MUTED, marginTop: 6}}>ACROSS 18 DATA SOURCES</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticker strip
// ---------------------------------------------------------------------------
const STRIP = '  •  94% OF EMPLOYERS RUN BACKGROUND CHECKS ON NEW HIRES    •  ALWAYS GET WRITTEN CONSENT FIRST — IT IS THE LAW IN MOST JURISDICTIONS    •  MOST CHECKS COMPLETE IN 1–3 BUSINESS DAYS    ';

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
export const BackgroundCheckProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <Consent frame={frame} fps={fps} />
      <Checks frame={frame} fps={fps} />
      <Report frame={frame} fps={fps} />
      <LiveCounter frame={frame} />
      <Strip frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
