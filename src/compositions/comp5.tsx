/**
 * KYCVerificationFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A KYC identity verification on dark slate: an ID card slides in, scan
 * brackets activate, three document checks validate in sequence (document
 * authenticity, photo match, liveness), the checks converge into a decision
 * shield that locks into a green VERIFIED badge, and an account panel
 * unlocks. Document-plus-steps arc only - no facial scanning visuals.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="KYCVerificationFlow" component={KYCVerificationFlow}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (dark slate fintech security)
// ---------------------------------------------------------------------------
const BG = '#0B1220';
const INK = '#EAF1FB';
const MUTED = 'rgba(234,241,251,0.60)';
const CYAN = '#38E1FF';
const CYAN_DEEP = '#0E7FA8';
const SUCCESS = '#34D399';
const AMBER = '#FFB020';
const PANEL = 'rgba(16,26,44,0.78)';
const HAIRLINE = 'rgba(234,241,251,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const CARD_START = 60;
const BRACKETS_START = 200;
const CHECKS_START = 300;
const SHIELD_START = 560;
const BADGE_START = 680;
const UNLOCK_START = 740;
const RESOLVE_START = 830;

const CHECKS = [
  {label: 'DOCUMENT AUTHENTICITY', sub: 'hologram · MRZ · fonts', delay: 0},
  {label: 'PHOTO MATCH', sub: 'ID portrait vs selfie · 98%', delay: 90},
  {label: 'LIVENESS', sub: 'motion challenge passed', delay: 180},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="slateGlow" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stopColor="rgba(56,225,255,0.12)" />
      <stop offset="55%" stopColor="rgba(56,225,255,0.04)" />
      <stop offset="100%" stopColor="rgba(11,18,32,0)" />
    </radialGradient>
    <radialGradient id="slateVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,6,12,0)" />
      <stop offset="100%" stopColor="rgba(3,6,12,0.72)" />
    </radialGradient>
    <linearGradient id="cyanBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={CYAN_DEEP} />
      <stop offset="100%" stopColor={CYAN} />
    </linearGradient>
    <linearGradient id="idSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
      <stop offset="45%" stopColor="rgba(255,255,255,0.03)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="cyanGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow4" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.5" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC = () => (
  <>
    <AbsoluteFill style={{backgroundColor: BG}} />
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <rect x={0} y={0} width={3840} height={2160} fill="url(#slateGlow)" />
      <rect x={0} y={0} width={3840} height={2160} fill="url(#slateVignette)" />
    </svg>
  </>
);

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        Verify identity <span style={{color: CYAN}}>in seconds</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        KYC &middot; DIGITAL IDENTITY VERIFICATION
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ID card sliding in with scan brackets
// ---------------------------------------------------------------------------
const ID_W = 1180;
const ID_H = 700;
const ID_X = 200;
const ID_Y = 400;

const IdCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const slide = spring({frame: frame - CARD_START, fps, config: {damping: 200, stiffness: 60}});
  if (slide <= 0.001) return null;

  const brackets = spring({frame: frame - BRACKETS_START, fps, config: {damping: 200, stiffness: 120}});
  const scanT = interpolate(frame, [BRACKETS_START + 30, BRACKETS_START + 150], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const holo = 0.5 + 0.5 * Math.sin(frame * 0.15);

  const corner = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M ${x + sx * 90} ${y} L ${x} ${y} L ${x} ${y + sy * 90}`}
      fill="none" stroke={CYAN} strokeWidth={10} strokeLinecap="round" filter="url(#cyanGlow)" />
  );

  return (
    <div style={{
      position: 'absolute', left: ID_X + (1 - slide) * -1400, top: ID_Y,
      width: ID_W, opacity: Math.min(1, slide),
    }}>
      <div style={{
        width: ID_W, height: ID_H, borderRadius: 34, position: 'relative',
        background: 'linear-gradient(135deg, #16233C 0%, #0E1830 55%, #14243F 100%)',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow4)', overflow: 'hidden',
      }}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 45%, rgba(255,255,255,0))'}} />
        {/* hologram shimmer band */}
        <div style={{
          position: 'absolute', left: 60, right: 60, top: 250, height: 90, borderRadius: 14,
          background: `linear-gradient(100deg, rgba(56,225,255,${0.10 + holo * 0.16}), rgba(139,92,246,${0.10 + (1 - holo) * 0.16}), rgba(56,225,255,${0.10 + holo * 0.16}))`,
          border: '1px solid rgba(56,225,255,0.35)',
        }} />
        <div style={{padding: '52px 64px', position: 'relative'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 4}}>NATIONAL ID CARD</div>
            <div style={{
              width: 120, height: 76, borderRadius: 12,
              background: 'linear-gradient(135deg, #C9A227, #8A6D1F)',
              border: '2px solid rgba(201,162,39,0.6)',
            }} />
          </div>
          <div style={{display: 'flex', gap: 48, marginTop: 44, alignItems: 'center'}}>
            {/* abstract portrait placeholder (initials, not a face) */}
            <div style={{
              width: 250, height: 250, borderRadius: 24, flexShrink: 0,
              background: 'linear-gradient(135deg, #24365A, #16233C)',
              border: `3px solid ${HAIRLINE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: CYAN, fontFamily: FONT, fontWeight: 800, fontSize: 88,
            }}>
              DK
            </div>
            <div style={{flex: 1}}>
              <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 62}}>DANISH KHAN</div>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, marginTop: 10}}>ID 35202-XXXXXXX-X &middot; EXP 2031</div>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 22, letterSpacing: 2}}>
                DOB 14 MAR 2006 &middot; PK
              </div>
              {/* MRZ lines */}
              <div style={{marginTop: 26}}>
                {['PK<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', '35202XXXXXX0PAK0603148M3101018<<<'].map((l) => (
                  <div key={l} style={{color: 'rgba(234,241,251,0.45)', fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* scan brackets */}
      {brackets > 0.001 && (
        <svg width={ID_W + 120} height={ID_H + 120} style={{position: 'absolute', left: -60, top: -60, overflow: 'visible'}} opacity={Math.min(1, brackets)}>
          {corner(0, 0, 1, 1)}
          {corner(ID_W + 120, 0, -1, 1)}
          {corner(0, ID_H + 120, 1, -1)}
          {corner(ID_W + 120, ID_H + 120, -1, -1)}
          {frame >= BRACKETS_START + 30 && frame <= BRACKETS_START + 160 && (
            <rect x={20} y={30 + scanT * (ID_H + 40)} width={ID_W + 80} height={12} rx={6} fill={CYAN} filter="url(#cyanGlow)" />
          )}
        </svg>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Three verification check cards
// ---------------------------------------------------------------------------
const CheckCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <div style={{position: 'absolute', left: 1620, top: 400, width: 2020}}>
      {CHECKS.map((c, i) => {
        const s = spring({frame: frame - (CHECKS_START + c.delay - 40), fps, config: {damping: 200, stiffness: 85}});
        if (s <= 0.001) return null;
        const active = frame >= CHECKS_START + c.delay;
        const doneAt = CHECKS_START + c.delay + 70;
        const done = frame >= doneAt;
        const prog = interpolate(frame, [CHECKS_START + c.delay, doneAt], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        return (
          <div key={c.label} style={{
            background: PANEL, borderRadius: 28, marginBottom: 34,
            border: `2px solid ${done ? SUCCESS : active ? CYAN : HAIRLINE}`,
            padding: '36px 48px', backdropFilter: 'blur(6px)',
            filter: 'url(#panelShadow4)',
            opacity: Math.min(1, s),
            transform: `translateX(${(1 - s) * 80}px)`,
            boxShadow: done ? '0 0 44px rgba(52,211,153,0.25)' : active ? '0 0 44px rgba(56,225,255,0.25)' : 'none',
            display: 'flex', alignItems: 'center', gap: 36,
          }}>
            {/* status orb */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%', flexShrink: 0,
              background: done ? SUCCESS : 'rgba(234,241,251,0.08)',
              border: `3px solid ${done ? SUCCESS : CYAN}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* progress ring fill */}
              {!done && active && (
                <svg width={96} height={96} viewBox="0 0 96 96" style={{position: 'absolute', inset: 0}}>
                  <circle cx={48} cy={48} r={40} fill="none" stroke={CYAN} strokeWidth={9}
                    strokeLinecap="round" pathLength={1} strokeDasharray={1}
                    strokeDashoffset={1 - prog} transform="rotate(-90 48 48)" />
                </svg>
              )}
              {done && (
                <span style={{color: '#06231D', fontSize: 52, fontWeight: 800}}>&#10003;</span>
              )}
              {active && !done && (
                <span style={{color: CYAN, fontFamily: MONO, fontWeight: 800, fontSize: 30}}>
                  {Math.round(prog * 100)}
                </span>
              )}
            </div>
            <div style={{flex: 1}}>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 42, letterSpacing: 1}}>
                {i + 1}. {c.label}
              </div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 8}}>{c.sub}</div>
            </div>
            {i === 1 && done && (
              <div style={{
                color: SUCCESS, fontFamily: MONO, fontWeight: 800, fontSize: 56,
                textShadow: '0 0 30px rgba(52,211,153,0.5)',
              }}>
                98%
              </div>
            )}
            {i === 2 && active && !done && (
              <svg width={120} height={120} viewBox="0 0 120 120">
                {[0, 1, 2].map((d) => {
                  const a = frame * 0.09 + d * (Math.PI * 2 / 3);
                  return (
                    <circle key={d} cx={60 + 34 * Math.cos(a)} cy={60 + 34 * Math.sin(a)} r={10} fill={CYAN} filter="url(#cyanGlow)" />
                  );
                })}
                <circle cx={60} cy={60} r={14} fill="none" stroke={CYAN} strokeWidth={4} opacity={0.6} />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Decision shield -> VERIFIED badge
// ---------------------------------------------------------------------------
const Shield: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - SHIELD_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const pulse = 1 + 0.04 * Math.sin(frame * 0.18);
  const badge = spring({frame: frame - BADGE_START, fps, config: {damping: 120, stiffness: 190}});
  const locked = frame >= BADGE_START + 30;

  return (
    <div style={{
      position: 'absolute', left: 200, top: 1230, width: 1180,
      opacity: Math.min(1, s), textAlign: 'center',
    }}>
      <svg width={420} height={460} viewBox="0 0 420 460" style={{transform: `scale(${pulse})`}}>
        <path d="M210 20 L380 90 V240 C380 350 300 410 210 440 C120 410 40 350 40 240 V90 Z"
          fill={locked ? 'rgba(52,211,153,0.14)' : 'rgba(56,225,255,0.10)'}
          stroke={locked ? SUCCESS : CYAN} strokeWidth={10}
          filter="url(#cyanGlow)" />
        {locked ? (
          <g>
            <path d="M150 220 L195 268 L272 175" fill="none" stroke={SUCCESS} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : (
          <g opacity={0.85}>
            {[0, 1, 2].map((d) => (
              <circle key={d} cx={210} cy={230} r={40 + d * 34} fill="none" stroke={CYAN} strokeWidth={5} opacity={0.7 - d * 0.2} />
            ))}
            <circle cx={210} cy={230} r={18} fill={CYAN} filter="url(#cyanGlow)" />
          </g>
        )}
      </svg>
      {badge > 0.001 && (
        <div style={{
          marginTop: 10,
          transform: `scale(${2.0 - 1.0 * Math.min(1, badge)})`,
          opacity: Math.min(1, badge),
        }}>
          <span style={{
            border: `6px solid ${SUCCESS}`, borderRadius: 20, padding: '18px 60px',
            color: SUCCESS, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 6,
            background: 'rgba(11,18,32,0.9)', boxShadow: '0 0 70px rgba(52,211,153,0.5)',
            display: 'inline-block',
          }}>
            VERIFIED
          </span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Account panel unlocking
// ---------------------------------------------------------------------------
const AccountPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (UNLOCK_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const unlocked = frame >= UNLOCK_START + 40;
  const rows = [
    ['ACCOUNT', 'DK-88412 · ACTIVE'],
    ['LIMITS', 'FULL ACCESS'],
    ['REGION', 'PK · COMPLIANT'],
  ];
  return (
    <div style={{
      position: 'absolute', left: 1620, top: 1230, width: 2020,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '48px 60px',
        border: `2px solid ${unlocked ? SUCCESS : HAIRLINE}`,
        filter: 'url(#panelShadow4)', backdropFilter: 'blur(6px)',
        boxShadow: unlocked ? '0 0 60px rgba(52,211,153,0.25)' : 'none',
        position: 'relative',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 56}}>
            Account access
          </div>
          {/* lock */}
          <svg width={90} height={110} viewBox="0 0 90 110">
            <rect x={10} y={44} width={70} height={56} rx={12} fill={unlocked ? SUCCESS : 'rgba(234,241,251,0.2)'} />
            <path d={unlocked
              ? 'M25 44 V32 a20 20 0 0 1 40 0'
              : 'M25 44 V32 a20 20 0 0 1 40 0 v12'}
              fill="none" stroke={unlocked ? SUCCESS : 'rgba(234,241,251,0.5)'} strokeWidth={10} />
            {unlocked && <circle cx={45} cy={72} r={9} fill="#06231D" />}
          </svg>
        </div>
        <div style={{marginTop: 26}}>
          {rows.map(([k, v], i) => {
            const rs = spring({frame: frame - (UNLOCK_START + 40 + i * 44), fps, config: {damping: 200, stiffness: 130}});
            if (rs <= 0.001) return null;
            return (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 0', borderBottom: i < rows.length - 1 ? `2px dashed ${HAIRLINE}` : 'none',
                opacity: Math.min(1, rs), transform: `translateX(${(1 - rs) * -30}px)`,
              }}>
                <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>{k}</span>
                <span style={{color: unlocked ? SUCCESS : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 40}}>{v}</span>
              </div>
            );
          })}
        </div>
      </div>
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
      position: 'absolute', bottom: 100, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(52,211,153,0.12)', border: `2px solid ${SUCCESS}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 40,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: SUCCESS,
          color: '#06231D', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          KYC COMPLETE &middot; 42 SECONDS &middot; ZERO MANUAL REVIEW
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const KYCVerificationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background />
      <TitleBar frame={frame} />
      <IdCard frame={frame} fps={fps} />
      <CheckCards frame={frame} fps={fps} />
      <Shield frame={frame} fps={fps} />
      <AccountPanel frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default KYCVerificationFlow;
