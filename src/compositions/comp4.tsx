/**
 * EventCheckinFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * An event attendee check-in on deep indigo: a ticket builds, a scan line
 * sweeps its QR, a VERIFIED badge stamps, an attendee badge assembles piece
 * by piece, it clips onto a lanyard, the entry gate swings open, and a
 * WELCOME burst closes the arc. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="EventCheckinFlow" component={EventCheckinFlow}
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

const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Palette (deep indigo event)
// ---------------------------------------------------------------------------
const BG = '#131029';
const INK = '#F2EEFF';
const MUTED = 'rgba(242,238,255,0.60)';
const VIOLET = '#8B5CF6';
const VIOLET_DEEP = '#5B34C7';
const AMBER = '#FFB020';
const AMBER_DEEP = '#C77E0A';
const SUCCESS = '#34D399';
const PANEL = 'rgba(28,22,62,0.78)';
const HAIRLINE = 'rgba(242,238,255,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const TICKET_START = 60;
const SCAN_START = 230;
const VERIFY_START = 360;
const BADGE_START = 460;
const LANYARD_START = 640;
const GATE_START = 700;
const WELCOME_START = 780;
const STATS_START = 830;

const BADGE_ROWS = [
  {label: 'ATTENDEE', value: 'Danish A.'},
  {label: 'ROLE', value: 'Speaker · AI Track'},
  {label: 'SESSION', value: 'Hall B · 10:00 AM'},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="indigoGlow" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stopColor="rgba(139,92,246,0.16)" />
      <stop offset="55%" stopColor="rgba(139,92,246,0.05)" />
      <stop offset="100%" stopColor="rgba(19,16,41,0)" />
    </radialGradient>
    <radialGradient id="indigoVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(6,4,16,0)" />
      <stop offset="100%" stopColor="rgba(6,4,16,0.72)" />
    </radialGradient>
    <linearGradient id="violetBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={VIOLET_DEEP} />
      <stop offset="100%" stopColor={VIOLET} />
    </linearGradient>
    <linearGradient id="amberBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={AMBER} />
      <stop offset="100%" stopColor={AMBER_DEEP} />
    </linearGradient>
    <filter id="violetGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow3" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.5" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const orbs = useMemo(() => [
    {x: 700, y: 500, r: 420, c: 'rgba(139,92,246,0.10)'},
    {x: 3200, y: 1600, r: 520, c: 'rgba(255,176,32,0.07)'},
    {x: 3000, y: 420, r: 340, c: 'rgba(52,211,153,0.06)'},
  ], []);
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#indigoGlow)" />
        {orbs.map((o, i) => (
          <circle key={i} cx={o.x} cy={o.y + 30 * Math.sin(frame * 0.02 + i * 2)} r={o.r} fill={o.c} />
        ))}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#indigoVignette)" />
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
        Check in. Badge on. <span style={{color: AMBER}}>You&apos;re in.</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        EVENT ATTENDEE CHECK-IN
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticket with QR + scan line + VERIFIED stamp
// ---------------------------------------------------------------------------
const Ticket: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - TICKET_START, fps, config: {damping: 200, stiffness: 70}});
  if (s <= 0.001) return null;

  const qrCells = useMemo(() => {
    const out: boolean[] = [];
    for (let i = 0; i < 64; i++) {
      const r = Math.floor(i / 8); const c = i % 8;
      const finder = (r < 2 && c < 2) || (r < 2 && c > 5) || (r > 5 && c < 2);
      out.push(finder ? true : rand(i * 11.7 + 3) > 0.5);
    }
    return out;
  }, []);

  const scanY = interpolate(frame, [SCAN_START, SCAN_START + 110], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const stamp = spring({frame: frame - VERIFY_START, fps, config: {damping: 130, stiffness: 200}});

  const TW = 1300; const TH = 620;
  const TX = 200; const TY = 380;

  return (
    <div style={{
      position: 'absolute', left: TX, top: TY, width: TW,
      opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 70}px) rotate(${(1 - s) * -3}deg)`,
    }}>
      <div style={{
        width: TW, height: TH, background: PANEL, borderRadius: 34,
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow3)',
        backdropFilter: 'blur(6px)', display: 'flex', overflow: 'hidden',
        position: 'relative',
      }}>
        {/* stub */}
        <div style={{
          width: 380, background: 'linear-gradient(90deg, #5B34C7, #8B5CF6)', padding: '48px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{color: 'rgba(255,255,255,0.75)', fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>ADMIT ONE</div>
          <div style={{color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 62, marginTop: 12, lineHeight: 1.05}}>
            Future<br />Tech<br />Summit
          </div>
          <div style={{color: 'rgba(255,255,255,0.75)', fontFamily: MONO, fontSize: 28, marginTop: 18}}>
            OCT 14 &middot; HALL B
          </div>
        </div>
        <div style={{
          width: 6, margin: '36px 0',
          backgroundImage: `repeating-linear-gradient(180deg, ${HAIRLINE} 0 18px, transparent 18px 36px)`,
        }} />
        {/* QR zone */}
        <div style={{flex: 1, padding: '48px 56px', position: 'relative'}}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>SCAN TO VERIFY</div>
          <svg width={330} height={330} viewBox="0 0 330 330" style={{marginTop: 22}}>
            <rect x={0} y={0} width={330} height={330} rx={20} fill="#0D0A20" stroke={HAIRLINE} strokeWidth={3} />
            {qrCells.map((on, i) => {
              const r = Math.floor(i / 8); const c = i % 8;
              return (
                <rect key={i} x={26 + c * 34.75} y={26 + r * 34.75} width={28} height={28} rx={4}
                  fill={on ? VIOLET : 'rgba(139,92,246,0.14)'} />
              );
            })}
            {/* scan line */}
            {frame >= SCAN_START && frame <= SCAN_START + 120 && (
              <g>
                <rect x={14} y={20 + scanY * 290} width={302} height={10} rx={5} fill={AMBER} filter="url(#violetGlow)" />
                <rect x={14} y={20 + scanY * 290 - 60} width={302} height={60} fill="rgba(255,176,32,0.10)" />
              </g>
            )}
          </svg>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, marginTop: 16}}>
            TICKET #FTS-2941-08
          </div>
        </div>
        {/* VERIFIED stamp */}
        {stamp > 0.001 && (
          <div style={{
            position: 'absolute', right: 60, top: 60,
            transform: `rotate(-12deg) scale(${2.2 - 1.2 * Math.min(1, stamp)})`,
            opacity: Math.min(1, stamp),
          }}>
            <div style={{
              border: `6px solid ${SUCCESS}`, borderRadius: 18, padding: '14px 40px',
              color: SUCCESS, fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: 4,
              background: 'rgba(13,10,32,0.88)', boxShadow: '0 0 60px rgba(52,211,153,0.5)',
            }}>
              VERIFIED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Attendee badge assembling
// ---------------------------------------------------------------------------
const AttendeeBadge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - BADGE_START, fps, config: {damping: 200, stiffness: 75}});
  if (s <= 0.001) return null;

  const BX = 1780; const BY = 380; const BW = 1040; const BH = 620;

  return (
    <div style={{
      position: 'absolute', left: BX, top: BY, width: BW,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 70}px)`,
    }}>
      <div style={{
        width: BW, height: BH, background: '#FFFDF8', borderRadius: 34,
        filter: 'url(#panelShadow3)', padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 26, background: 'linear-gradient(180deg, #FFB020, #C77E0A)'}} />
        <div style={{display: 'flex', gap: 40, alignItems: 'center'}}>
          {/* avatar */}
          <div style={{
            width: 190, height: 190, borderRadius: '50%',
            background: 'linear-gradient(90deg, #5B34C7, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 76,
            flexShrink: 0,
          }}>
            DA
          </div>
          <div style={{flex: 1}}>
            {BADGE_ROWS.map((row, i) => {
              const rs = spring({frame: frame - (BADGE_START + 40 + i * 46), fps, config: {damping: 200, stiffness: 130}});
              if (rs <= 0.001) return null;
              return (
                <div key={row.label} style={{
                  opacity: Math.min(1, rs),
                  transform: `translateX(${(1 - rs) * -30}px)`,
                  marginTop: i === 0 ? 0 : 18,
                }}>
                  <div style={{color: 'rgba(28,22,62,0.55)', fontFamily: MONO, fontSize: 24, letterSpacing: 3}}>{row.label}</div>
                  <div style={{
                    color: '#1B1740', fontFamily: FONT,
                    fontWeight: i === 0 ? 800 : 600,
                    fontSize: i === 0 ? 56 : 38, marginTop: 2,
                  }}>{row.value}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* session color bar + lanyard clip */}
        <div style={{display: 'flex', gap: 18, marginTop: 44, alignItems: 'center'}}>
          {['#8B5CF6', '#FFB020', '#34D399', '#7FD8F7'].map((c, i) => {
            const cs = spring({frame: frame - (BADGE_START + 180 + i * 30), fps, config: {damping: 200, stiffness: 160}});
            return (
              <div key={c} style={{
                width: 120, height: 34, borderRadius: 17, background: c,
                transform: `scaleX(${Math.min(1, Math.max(0, cs))})`, transformOrigin: 'left center',
              }} />
            );
          })}
          <span style={{color: 'rgba(28,22,62,0.55)', fontFamily: MONO, fontSize: 26, marginLeft: 8}}>
            AI TRACK &middot; ALL ACCESS
          </span>
        </div>
        {/* lanyard strap + clip */}
        {frame >= LANYARD_START && (
          <svg width={BW} height={120} style={{position: 'absolute', top: -96, left: 0, overflow: 'visible'}}>
            <rect x={BW / 2 - 34} y={-40} width={68} height={140} fill={VIOLET} opacity={0.95} />
            <rect x={BW / 2 - 34} y={-40} width={68} height={140} fill="none" stroke={VIOLET_DEEP} strokeWidth={4} />
            <circle cx={BW / 2} cy={104} r={26} fill="none" stroke={AMBER} strokeWidth={10} />
          </svg>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Entry gate: turnstile arms swing open
// ---------------------------------------------------------------------------
const EntryGate: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (GATE_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const open = interpolate(frame, [GATE_START, GATE_START + 90], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const GX = 3040; const GY = 380; const GW = 600; const GH = 620;

  return (
    <div style={{
      position: 'absolute', left: GX, top: GY, width: GW,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        width: GW, height: GH, background: PANEL, borderRadius: 34,
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow3)',
        backdropFilter: 'blur(6px)', padding: '40px 44px',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>ENTRY GATE 03</div>
        <svg width={GW - 88} height={440} viewBox="0 0 512 440" style={{marginTop: 20}}>
          {/* posts */}
          <rect x={20} y={60} width={36} height={340} rx={12} fill={VIOLET_DEEP} />
          <rect x={456} y={60} width={36} height={340} rx={12} fill={VIOLET_DEEP} />
          {/* arms swing open */}
          <g transform={`translate(56 230) rotate(${-open * 78})`}>
            <rect x={0} y={-14} width={200} height={28} rx={14} fill={AMBER} filter="url(#violetGlow)" />
          </g>
          <g transform={`translate(456 230) rotate(${open * 78})`}>
            <rect x={-200} y={-14} width={200} height={28} rx={14} fill={AMBER} filter="url(#violetGlow)" />
          </g>
          {/* walkway glow when open */}
          {open > 0.6 && (
            <rect x={120} y={330} width={272} height={50} rx={25} fill={SUCCESS} opacity={0.35 * open} />
          )}
          <text x={256} y={46} textAnchor="middle" fill={open > 0.6 ? SUCCESS : MUTED} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4}>
            {open > 0.6 ? 'OPEN' : 'READY'}
          </text>
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WELCOME burst
// ---------------------------------------------------------------------------
const Welcome: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - WELCOME_START, fps, config: {damping: 150, stiffness: 130}});
  if (s <= 0.001) return null;
  const confetti = useMemo(() => {
    const out: {seed: number; x: number; c: string; r: number}[] = [];
    const colors = [VIOLET, AMBER, SUCCESS, '#7FD8F7', '#fff'];
    for (let i = 0; i < 60; i++) {
      out.push({
        seed: i * 1.37, x: 400 + rand(i * 3.1) * 3040,
        c: colors[i % colors.length], r: 8 + rand(i * 7.7) * 14,
      });
    }
    return out;
  }, []);
  const t = Math.min(1, (frame - WELCOME_START) / 110);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {confetti.map((cf, i) => {
          const fall = t * (900 + (cf.seed % 500));
          const y = 1080 - 700 * (1 - t) * (1 - t) + fall * 0.4;
          if (y > 2200) return null;
          return (
            <g key={i} opacity={Math.max(0, 1 - t * 0.7)}>
              <rect
                x={cf.x + 60 * Math.sin(cf.seed + t * 9)} y={y}
                width={cf.r} height={cf.r * 0.6} rx={3} fill={cf.c}
                transform={`rotate(${cf.seed * 57 + t * 540} ${cf.x} ${y})`}
              />
            </g>
          );
        })}
      </svg>
      <div style={{
        position: 'absolute', left: 0, top: 1150, width: 3840, textAlign: 'center',
        transform: `scale(${0.6 + 0.4 * Math.min(1, s)})`,
      }}>
        <span style={{
          color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: 6,
          textShadow: '0 0 80px rgba(139,92,246,0.8)',
        }}>
          WELCOME IN
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve stats strip
// ---------------------------------------------------------------------------
const StatsStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - STATS_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const items: [string, string][] = [
    ['CHECKED IN', '1,248'],
    ['ON-TIME RATE', '96%'],
    ['AVG PER SCAN', '8 SEC'],
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 110, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{display: 'flex', gap: 2, borderRadius: 26, overflow: 'hidden', border: `2px solid ${HAIRLINE}`, background: 'rgba(13,10,32,0.88)'}}>
        {items.map(([k, v], i) => (
          <div key={k} style={{
            padding: '28px 90px', textAlign: 'center',
            borderRight: i < items.length - 1 ? `2px solid ${HAIRLINE}` : 'none',
          }}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>{k}</div>
            <div style={{color: i === 0 ? SUCCESS : INK, fontFamily: MONO, fontWeight: 800, fontSize: 58, marginTop: 8}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const EventCheckinFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Ticket frame={frame} fps={fps} />
      <AttendeeBadge frame={frame} fps={fps} />
      <EntryGate frame={frame} fps={fps} />
      <Welcome frame={frame} fps={fps} />
      <StatsStrip frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default EventCheckinFlow;
