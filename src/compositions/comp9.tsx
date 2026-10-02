/**
 * EventRegistrationFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The organizer-side event registration process: CREATE the event page ->
 * set TICKET TYPES -> PUBLISH live -> PROMOTE across channels ->
 * REGISTRATIONS roll in until the 500-seat venue sells out.
 * Distinct from attendee check-in. Brand-neutral, deterministic.
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
// Palette (deep plum, purple, coral)
// ---------------------------------------------------------------------------
const BG = '#160F1E';
const INK = '#F8F3FA';
const MUTED = 'rgba(248,243,250,0.62)';
const FAINT = 'rgba(248,243,250,0.32)';
const PURPLE = '#A78BFA';
const CORAL = '#FB7185';
const GOLD = '#FBBF24';
const GREEN = '#34D399';
const CYAN = '#67E8F9';
const PANEL = 'rgba(23,16,31,0.92)';
const HAIRLINE = 'rgba(248,243,250,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: ev
// ---------------------------------------------------------------------------
const Background_ev: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#D3BDF2" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(167,139,250,0.13), rgba(167,139,250,0.03) 46%, rgba(22,15,30,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#evVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(167,139,250,0.045)" />
        <defs>
          <radialGradient id="evVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(22,15,30,0)" />
            <stop offset="100%" stopColor="rgba(9,5,14,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_ev: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`ev-amb-x-${i}`) * 3840;
    const by = random(`ev-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`ev-amb-s-${i}`) * 1.4;
    const ang = random(`ev-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`ev-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? PURPLE : 'rgba(248,243,250,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_ev: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`ev-dth-x-${i}`) * 3840;
    const by = random(`ev-dth-y-${i}`) * 2160;
    const jx = (random(`ev-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`ev-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`ev-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`ev-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E4D4F7" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_ev = [
  'EVENT CREATED',
  '3 TICKET TIERS SET',
  'PAGE LIVE \u2713',
  'EMAIL 12K SENT',
  'SOCIAL REACH 84K',
  'REGISTRATIONS 500/500',
  'SOLD OUT \u2713',
  'SEE YOU AT THE DOORS',
];
const TickerTape_ev: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_ev.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(167,139,250,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(10,6,15,0.66)', borderBottom: '1px solid rgba(248,243,250,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_ev: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  const corners = [
    {x: 60, y: 92, sx: 1, sy: 1},
    {x: 3780, y: 92, sx: -1, sy: 1},
    {x: 60, y: 2068, sx: 1, sy: -1},
    {x: 3780, y: 2068, sx: -1, sy: -1},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {corners.map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.sx},${c.sy})`}>
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={PURPLE} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? PURPLE : 'rgba(248,243,250,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? PURPLE : 'rgba(248,243,250,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_ev: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`ev-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ev-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ev-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`ev-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Event model
// ---------------------------------------------------------------------------
const TIERS_ev = [
  {name: 'EARLY BIRD', price: 29, color: GREEN, seats: 150},
  {name: 'GENERAL', price: 49, color: PURPLE, seats: 280},
  {name: 'VIP', price: 149, color: GOLD, seats: 70},
];
const CAP_ev = 500;

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_ev: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        EVENT REGISTRATION FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        The organizer side &middot; from blank page to a sold-out room
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Event page card (left): created -> ticket tiers -> published
// ---------------------------------------------------------------------------
const EventPage_ev: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 110, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const live = interpolate(frame, [420, 470], [0, 1], clamp01);
  return (
    <div style={{
      position: 'absolute', left: 220, top: 330, width: 860, borderRadius: 28,
      background: PANEL, border: `2px solid ${HAIRLINE}`, padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>STEP 1 \u00B7 CREATE EVENT</div>
        {live > 0.02 && (
          <div style={{color: '#06281D', backgroundColor: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 28, borderRadius: 12, padding: '8px 22px', opacity: live}}>
            \u25CF LIVE
          </div>
        )}
      </div>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 58, marginTop: 16}}>Design Systems Summit</div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 8}}>Nov 14 \u00B7 Grand Hall \u00B7 500 seats</div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 2, marginTop: 30}}>STEP 2 \u00B7 TICKET TIERS</div>
      <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16}}>
        {TIERS_ev.map((t, i) => {
          const on = interpolate(frame, [220 + i * 50, 250 + i * 50], [0, 1], clamp01);
          return (
            <div key={t.name} style={{
              borderRadius: 18, background: 'rgba(248,243,250,0.04)', border: `2px solid ${t.color}`,
              padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: on,
            }}>
              <div>
                <div style={{color: t.color, fontFamily: MONO, fontWeight: 800, fontSize: 34}}>{t.name}</div>
                <div style={{color: MUTED, fontFamily: FONT, fontSize: 26}}>{t.seats} seats</div>
              </div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>${t.price}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Promote panel (center): channels firing
// ---------------------------------------------------------------------------
const Promote_ev: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 480, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const channels = [
    {name: 'EMAIL LIST', reach: '12,400 sent', at: 500},
    {name: 'SOCIAL', reach: '84K impressions', at: 560},
    {name: 'PARTNERS', reach: '36 affiliates', at: 620},
  ];
  return (
    <div style={{
      position: 'absolute', left: 1260, top: 330, width: 640, borderRadius: 28,
      background: PANEL, border: `2px solid ${HAIRLINE}`, padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>STEP 3\u20134 \u00B7 PUBLISH + PROMOTE</div>
      <div style={{marginTop: 22, display: 'flex', flexDirection: 'column', gap: 20}}>
        {channels.map((c) => {
          const on = spring({frame: frame - c.at, fps, config: {damping: 200, stiffness: 120}});
          if (on <= 0.001) return null;
          return (
            <div key={c.name} style={{
              borderRadius: 18, background: `linear-gradient(120deg, rgba(251,113,133,0.16), rgba(167,139,250,0.10))`,
              border: `2px solid rgba(251,113,133,0.4)`, padding: '22px 32px',
              opacity: Math.min(1, on), transform: `translateX(${(1 - on) * 60}px)`,
            }}>
              <div style={{color: CORAL, fontFamily: MONO, fontWeight: 800, fontSize: 36}}>{c.name}</div>
              <div style={{color: INK, fontFamily: FONT, fontSize: 30, marginTop: 6}}>{c.reach}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Registration counter + seat map (right)
// ---------------------------------------------------------------------------
const Seats_ev: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 620, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const reg = Math.floor(interpolate(frame, [640, 840], [0, CAP_ev], clamp01));
  const soldOut = reg >= CAP_ev;
  const dots: React.ReactElement[] = [];
  const cols = 25;
  const rows = 20;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const filled = idx < reg;
      const jx = (random(`ev-seat-x-${idx}`) - 0.5) * 6;
      const jy = (random(`ev-seat-y-${idx}`) - 0.5) * 6;
      dots.push(
        <circle key={idx} cx={2120 + c * 56 + jx} cy={760 + r * 56 + jy} r={16}
          fill={filled ? PURPLE : 'rgba(248,243,250,0.10)'} opacity={filled ? 0.95 : 0.6} />
      );
    }
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <text x={2820} y={700} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
          STEP 5 \u00B7 REGISTRATIONS
        </text>
      </svg>
      <div style={{position: 'absolute', left: 2080, top: 1330, width: 1480, textAlign: 'center'}}>
        <div style={{color: soldOut ? GOLD : INK, fontFamily: MONO, fontWeight: 800, fontSize: 110, textShadow: soldOut ? '0 0 40px rgba(251,191,36,0.5)' : 'none'}}>
          {reg}<span style={{color: FAINT, fontSize: 60}}>/{CAP_ev}</span>
        </div>
        {soldOut && (
          <div style={{
            display: 'inline-block', marginTop: 16, color: '#3A2A05', backgroundColor: GOLD,
            fontFamily: MONO, fontWeight: 800, fontSize: 52, borderRadius: 18, padding: '14px 60px',
            transform: 'rotate(-3deg)', boxShadow: '0 0 60px rgba(251,191,36,0.5)',
          }}>
            SOLD OUT \u2713
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Revenue strip (bottom)
// ---------------------------------------------------------------------------
const Revenue_ev: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const reg = Math.floor(interpolate(frame, [640, 840], [0, CAP_ev], clamp01));
  const rev = Math.round(reg * 0.62 * 49 + reg * 0.24 * 29 + reg * 0.14 * 149);
  const fade = interpolate(frame, [660, 720], [0, 1], clamp01);
  if (fade <= 0) return null;
  return (
    <div style={{position: 'absolute', bottom: 140, left: 220, opacity: fade}}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>PROJECTED REVENUE</div>
      <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 84, textShadow: '0 0 30px rgba(52,211,153,0.4)'}}>
        ${rev.toLocaleString('en-US')}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const EventRegistrationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_ev frame={frame} />
      <AmbientParticles_ev frame={frame} />
      <Title_ev frame={frame} fps={fps} />
      <EventPage_ev frame={frame} fps={fps} />
      <Promote_ev frame={frame} fps={fps} />
      <Seats_ev frame={frame} fps={fps} />
      <Revenue_ev frame={frame} fps={fps} />
      <TickerTape_ev frame={frame} />
      <CornerHud_ev frame={frame} />
      <FineDither_ev frame={frame} />
      <FilmGrain_ev frame={frame} />
    </AbsoluteFill>
  );
};
