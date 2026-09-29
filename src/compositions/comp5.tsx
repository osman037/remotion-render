/**
 * RecruitmentFunnelStages.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A hiring funnel story on deep ocean blue: applicants pour in at the top,
 * screening filters sift them stage by stage, interview calendars stack up,
 * the offer letter pops, and the hire counter lands with a time-to-hire
 * ticker. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="RecruitmentFunnelStages" component={RecruitmentFunnelStages}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
// Palette (deep ocean + aqua hiring)
// ---------------------------------------------------------------------------
const BG = '#081C2C';
const INK = '#EAF3FA';
const MUTED = 'rgba(234,243,250,0.60)';
const AQUA = '#38BDF8';
const AQUA_DEEP = '#0E6FA8';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const VIOLET = '#A78BFA';
const PANEL = 'rgba(14,38,60,0.82)';
const HAIRLINE = 'rgba(234,243,250,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const FUNNEL_START = 60;
const STAGE_GAP = 120;
const OFFER_START = 560;
const HIRE_START = 660;
const RESOLVE_START = 810;

const STAGES = [
  {name: 'APPLIED', count: 214, color: AQUA, sub: 'resume intake'},
  {name: 'SCREENING', count: 96, color: '#7CC4FF', sub: 'skills match'},
  {name: 'INTERVIEW', count: 34, color: VIOLET, sub: 'panel rounds'},
  {name: 'OFFER', count: 9, color: AMBER, sub: 'extended'},
  {name: 'HIRED', count: 6, color: GREEN, sub: 'signed'},
];

const INITIALS = ['AK', 'RS', 'JM', 'TW', 'NL', 'PB', 'DQ', 'FH', 'GK', 'VZ', 'YO', 'XC'];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="rfGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(56,189,248,0.12)" />
      <stop offset="55%" stopColor="rgba(56,189,248,0.035)" />
      <stop offset="100%" stopColor="rgba(8,28,44,0)" />
    </radialGradient>
    <radialGradient id="rfVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,12,20,0)" />
      <stop offset="100%" stopColor="rgba(3,12,20,0.72)" />
    </radialGradient>
    <linearGradient id="rfFunnel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={AQUA} stopOpacity={0.35} />
      <stop offset="100%" stopColor={AQUA_DEEP} stopOpacity={0.12} />
    </linearGradient>
    <filter id="rfGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="rfShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.28) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.08 + gx * 0.6 + gy * 1.4);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120} r={2.2} fill="#38BDF8" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#rfGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(56,189,248,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#rfVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        214 applicants. <span style={{color: GREEN}}>Six</span> signed offers.
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        RECRUITMENT FUNNEL &middot; SENIOR FRONTEND ROLE
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Funnel: trapezoid body + stage bands + flowing avatars
// ---------------------------------------------------------------------------
const FX = 200; // funnel left
const FW_TOP = 1600; // top width
const FW_BOT = 620; // bottom width
const FY_TOP = 400;
const FY_BOT = 1560;
const FCX = FX + FW_TOP / 2;

const funnelHalfWidth = (y: number) => {
  const t = (y - FY_TOP) / (FY_BOT - FY_TOP);
  return (FW_TOP + (FW_BOT - FW_TOP) * t) / 2;
};

const stageY = (i: number) => FY_TOP + 60 + i * 215;

const Funnel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (FUNNEL_START - 30), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const funnelPath = `M ${FCX - FW_TOP / 2} ${FY_TOP} L ${FCX + FW_TOP / 2} ${FY_TOP} L ${FCX + FW_BOT / 2} ${FY_BOT} L ${FCX - FW_BOT / 2} ${FY_BOT} Z`;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <path d={funnelPath} fill="url(#rfFunnel)" stroke={AQUA} strokeWidth={4} opacity={0.9} />
        {/* flowing candidate dots */}
        {Array.from({length: 40}, (_, i) => {
          const cycle = ((frame * 1.6 + i * 47) % 900) / 900;
          const y = FY_TOP + 20 + cycle * (FY_BOT - FY_TOP - 40);
          const hw = funnelHalfWidth(y);
          const spread = Math.sin(i * 12.9) * (hw - 40);
          const x = FCX + spread * (0.4 + 0.6 * cycle);
          const a = 0.9 * (1 - cycle * 0.4);
          return <circle key={i} cx={x} cy={y} r={9} fill={AQUA} opacity={a * 0.75} />;
        })}
        {/* stage separators */}
        {STAGES.map((_, i) => {
          const y = FY_TOP + 150 + i * 215;
          if (i === 0) return null;
          const hw = funnelHalfWidth(y);
          return (
            <line key={i} x1={FCX - hw} y1={y} x2={FCX + hw} y2={y}
              stroke={HAIRLINE} strokeWidth={2.5} strokeDasharray="14 14" />
          );
        })}
      </svg>

      {/* stage cards on the right of the funnel */}
      {STAGES.map((st, i) => {
        const cs = spring({frame: frame - (FUNNEL_START + i * STAGE_GAP), fps, config: {damping: 200, stiffness: 90}});
        if (cs <= 0.001) return null;
        const count = Math.round(interpolate(frame, [FUNNEL_START + i * STAGE_GAP, FUNNEL_START + i * STAGE_GAP + 90], [0, st.count], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        const y = stageY(i);
        return (
          <div key={st.name} style={{
            position: 'absolute', left: 2050, top: y - 40, width: 1590,
            opacity: Math.min(1, cs), transform: `translateX(${(1 - Math.min(1, cs)) * 70}px)`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 34,
              background: PANEL, borderRadius: 24, padding: '26px 40px',
              border: `2px solid ${st.color}`, filter: 'url(#rfShadow)',
              boxShadow: `0 0 40px ${st.color}2e`,
            }}>
              <div style={{flex: 1}}>
                <div style={{color: st.color, fontFamily: MONO, fontWeight: 800, fontSize: 36, letterSpacing: 3}}>
                  {st.name}
                </div>
                <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 4}}>{st.sub}</div>
              </div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 76, textShadow: `0 0 24px ${st.color}66`}}>
                {count}
              </div>
            </div>
          </div>
        );
      })}

      {/* avatar chips flowing through screening */}
      {INITIALS.map((ini, i) => {
        const start = FUNNEL_START + 40 + i * 38;
        const end = Math.min(640, start + 260);
        const t = interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (t <= 0 || t >= 1) return null;
        const kept = i % 3 !== 2; // every third filtered out at screening
        const y = FY_TOP + 170 + t * 160;
        const hw = funnelHalfWidth(y);
        const x = FCX + Math.sin(i * 7.3) * (hw - 90);
        const fadeOut = kept ? 1 : 1 - Math.max(0, (t - 0.72) / 0.28);
        return (
          <div key={ini} style={{
            position: 'absolute', left: x - 46, top: y - 46,
            width: 92, height: 92, borderRadius: '50%',
            background: kept ? 'linear-gradient(140deg,#1D4A6B,#0E2A44)' : 'rgba(80,90,110,0.5)',
            border: `3px solid ${kept ? AQUA : 'rgba(150,160,180,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: kept ? INK : 'rgba(200,210,225,0.5)',
            fontFamily: MONO, fontWeight: 800, fontSize: 30,
            opacity: fadeOut * 0.95,
          }}>
            {ini}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Offer letter pop + hire counter + time-to-hire ticker
// ---------------------------------------------------------------------------
const OfferHire: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const os = spring({frame: frame - OFFER_START, fps, config: {damping: 160, stiffness: 120}});
  const hs = spring({frame: frame - HIRE_START, fps, config: {damping: 200, stiffness: 90}});
  const hires = Math.round(interpolate(frame, [HIRE_START, HIRE_START + 110], [0, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const tth = interpolate(frame, [HIRE_START, HIRE_START + 110], [44, 31], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (os <= 0.001 && hs <= 0.001) return null;

  return (
    <div style={{
      position: 'absolute', left: 2050, top: 1480, width: 1590,
    }}>
      {os > 0.001 && (
        <div style={{
          opacity: Math.min(1, os), transform: `scale(${0.7 + 0.3 * Math.min(1, os)}) rotate(${(1 - Math.min(1, os)) * -8}deg)`,
          background: 'linear-gradient(150deg, rgba(251,191,36,0.16), rgba(251,191,36,0.05))',
          border: `3px solid ${AMBER}`, borderRadius: 26, padding: '30px 44px',
          display: 'flex', alignItems: 'center', gap: 30, filter: 'url(#rfShadow)',
          boxShadow: '0 0 60px rgba(251,191,36,0.3)',
        }}>
          <span style={{fontSize: 72}}>&#9993;</span>
          <div>
            <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 40, letterSpacing: 2}}>
              OFFER EXTENDED
            </div>
            <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 6}}>
              9 offers &middot; comp + equity + signing bonus
            </div>
          </div>
        </div>
      )}
      {hs > 0.001 && (
        <div style={{
          marginTop: 28, display: 'flex', gap: 30,
          opacity: Math.min(1, hs), transform: `translateY(${(1 - Math.min(1, hs)) * 50}px)`,
        }}>
          <div style={{
            flex: 1, background: PANEL, borderRadius: 24, padding: '28px 40px',
            border: `3px solid ${GREEN}`, boxShadow: '0 0 50px rgba(52,211,153,0.3)',
          }}>
            <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 32, letterSpacing: 3}}>HIRED</div>
            <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 88, marginTop: 4}}>
              {hires}<span style={{fontSize: 36, color: MUTED}}> / 6</span>
            </div>
          </div>
          <div style={{
            flex: 1, background: PANEL, borderRadius: 24, padding: '28px 40px',
            border: `2px solid ${HAIRLINE}`,
          }}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>TIME-TO-HIRE</div>
            <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 88, marginTop: 4}}>
              {Math.round(tth)}<span style={{fontSize: 36, color: MUTED}}> days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve strip
// ---------------------------------------------------------------------------
const ResolveStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 96, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(52,211,153,0.10)', border: `2px solid ${GREEN}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: GREEN,
          color: '#081C2C', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          SCREEN HARD, INTERVIEW KIND &middot; THE FUNNEL IS A FILTER, NOT A SIEVE
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`rf-grain-x-${frame}-${i}`) * 3840;
    const y = random(`rf-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`rf-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`rf-grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const RecruitmentFunnelStages: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Funnel frame={frame} fps={fps} />
      <OfferHire frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default RecruitmentFunnelStages;
