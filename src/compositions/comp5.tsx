/**
 * TelehealthVisitFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The virtual visit as a five-stage process: CHECK IN online -> WAIT in the
 * virtual waiting room -> VIDEO CONSULT with the doctor -> E-PRESCRIPTION
 * sent to the pharmacy -> FOLLOW-UP scheduled. Starts after booking.
 * Brand-neutral, deterministic.
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
// Palette (clinical deep blue, sky)
// ---------------------------------------------------------------------------
const BG = '#081220';
const INK = '#F2F7FC';
const MUTED = 'rgba(242,247,252,0.62)';
const FAINT = 'rgba(242,247,252,0.32)';
const SKY = '#38BDF8';
const BLUE = '#2563EB';
const GREEN = '#34D399';
const VIOLET = '#A78BFA';
const PANEL = 'rgba(10,18,32,0.92)';
const HAIRLINE = 'rgba(242,247,252,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: tv
// ---------------------------------------------------------------------------
const Background_tv: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A8D8F8" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(56,189,248,0.12), rgba(56,189,248,0.03) 46%, rgba(8,18,32,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#tvVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(56,189,248,0.045)" />
        <defs>
          <radialGradient id="tvVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(8,18,32,0)" />
            <stop offset="100%" stopColor="rgba(3,7,14,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_tv: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`tv-amb-x-${i}`) * 3840;
    const by = random(`tv-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`tv-amb-s-${i}`) * 1.4;
    const ang = random(`tv-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`tv-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? SKY : i % 4 === 1 ? VIOLET : 'rgba(242,247,252,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_tv: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`tv-dth-x-${i}`) * 3840;
    const by = random(`tv-dth-y-${i}`) * 2160;
    const jx = (random(`tv-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`tv-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`tv-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`tv-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D6ECFB" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_tv = [
  'CHECKED IN \u2713',
  'QUEUE POSITION 1',
  'DOCTOR JOINED',
  'CONSULT 12 MIN',
  'RX SENT TO PHARMACY',
  'FOLLOW-UP IN 2 WEEKS',
  'VISIT SUMMARY EMAILED',
  'NO WAITING ROOM NEEDED',
];
const TickerTape_tv: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_tv.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(56,189,248,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(4,9,17,0.66)', borderBottom: '1px solid rgba(242,247,252,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_tv: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(56,189,248,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={SKY} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? SKY : 'rgba(242,247,252,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? SKY : 'rgba(242,247,252,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_tv: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`tv-grain-x-${frame}-${i}`) * 3840;
    const y = random(`tv-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`tv-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`tv-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_tv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        TELEHEALTH VISIT FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Check in online &middot; see the doctor on video &middot; Rx sent to your pharmacy
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Five stages rail
// ---------------------------------------------------------------------------
const STEPS_tv = ['CHECK IN', 'WAIT', 'CONSULT', 'RX', 'FOLLOW-UP'];
const STEP_AT_tv = [120, 290, 430, 620, 750];
const Rail_tv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const x0 = 280;
  const x1 = 3560;
  const y = 480;
  const draw = interpolate(frame, [110, 780], [0, 1], clamp01);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={HAIRLINE} strokeWidth={8} />
      <line x1={x0} y1={y} x2={x0 + (x1 - x0) * draw} y2={y} stroke={SKY} strokeWidth={8} strokeLinecap="round"
        style={{filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.6))'}} />
      {STEPS_tv.map((st, i) => {
        const fx = x0 + ((x1 - x0) / 4) * i;
        const on = frame >= STEP_AT_tv[i];
        const s = spring({frame: frame - STEP_AT_tv[i], fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        return (
          <g key={st} opacity={Math.min(1, s)}>
            <circle cx={fx} cy={y} r={40} fill={on ? SKY : '#0C1626'} stroke={on ? SKY : HAIRLINE} strokeWidth={5} />
            {on && <text x={fx} y={y + 15} fill="#06283D" fontSize={40} fontWeight={800} textAnchor="middle">\u2713</text>}
            <text x={fx} y={y + 108} fill={on ? INK : FAINT} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {st}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Central video-call window
// ---------------------------------------------------------------------------
const CallWindow_tv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 110, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const consultOn = frame >= 430;
  const secs = Math.max(0, Math.min(720, frame - 450));
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const waveBars = Array.from({length: 18}, (_, i) => 14 + 34 * (0.5 + 0.5 * Math.sin(frame * 0.3 + i * 1.1)));
  return (
    <div style={{
      position: 'absolute', left: 1920 - 640, top: 760, width: 1280, height: 760, borderRadius: 36,
      background: 'linear-gradient(160deg, #0E1E33, #0A1424)', border: `3px solid ${consultOn ? SKY : HAIRLINE}`,
      opacity: Math.min(1, s), transform: `scale(${0.92 + s * 0.08})`, overflow: 'hidden',
      boxShadow: consultOn ? '0 0 90px rgba(56,189,248,0.3)' : 'none',
    }}>
      {/* doctor tile */}
      <div style={{position: 'absolute', left: 60, top: 60, right: 60, bottom: 190, borderRadius: 24, background: 'radial-gradient(circle at 50% 30%, #14304D, #0B1A2E)', border: `2px solid ${HAIRLINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        {consultOn ? (
          <>
            <div style={{width: 170, height: 170, borderRadius: 85, background: `linear-gradient(140deg, ${SKY}, ${BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 80, fontWeight: 800, fontFamily: FONT}}>
              DR
            </div>
            <div style={{color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 44, marginTop: 26}}>Dr. Alvarez, MD</div>
            <div style={{color: GREEN, fontFamily: MONO, fontSize: 32, marginTop: 8}}>\u25CF IN CONSULTATION</div>
          </>
        ) : (
          <>
            <div style={{color: FAINT, fontFamily: MONO, fontSize: 40}}>WAITING FOR DOCTOR\u2026</div>
            <div style={{color: FAINT, fontFamily: MONO, fontSize: 30, marginTop: 14}}>your visit starts soon</div>
          </>
        )}
      </div>
      {/* self tile */}
      <div style={{position: 'absolute', right: 60, bottom: 60, width: 330, height: 200, borderRadius: 20, background: '#12263E', border: `2px solid ${HAIRLINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 96, height: 96, borderRadius: 48, background: '#1D3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SKY, fontSize: 44, fontWeight: 800, fontFamily: FONT}}>YOU</div>
      </div>
      {/* timer + audio wave */}
      <div style={{position: 'absolute', left: 60, bottom: 60, display: 'flex', alignItems: 'center', gap: 30}}>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{mm}:{ss}</div>
        <svg width={260} height={70}>
          {waveBars.map((h, i) => (
            <rect key={i} x={i * 14.5} y={35 - h / 2} width={9} height={consultOn ? h : 6} rx={4} fill={consultOn ? SKY : FAINT} opacity={0.85} />
          ))}
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Side panels: queue (left), Rx + follow-up (right)
// ---------------------------------------------------------------------------
const Queue_tv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 280, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const pos = Math.max(1, 4 - Math.floor(interpolate(frame, [290, 430], [0, 3], clamp01)));
  const wait = Math.max(0, Math.round(8 * (1 - interpolate(frame, [290, 430], [0, 1], clamp01))));
  return (
    <div style={{
      position: 'absolute', left: 220, top: 760, width: 560, borderRadius: 28,
      background: PANEL, border: `2px solid ${HAIRLINE}`, padding: '40px 48px',
      opacity: Math.min(1, s), transform: `translateX(${(1 - s) * -80}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>VIRTUAL WAITING ROOM</div>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 110, marginTop: 18}}>
        #{pos}
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 8}}>in queue &middot; ~{wait} min wait</div>
      <div style={{marginTop: 28}}>
        {[1, 2, 3].map((p) => (
          <div key={p} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, opacity: p <= pos ? 1 : 0.25}}>
            <div style={{width: 54, height: 54, borderRadius: 27, backgroundColor: p <= pos ? SKY : 'rgba(242,247,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p <= pos ? '#06283D' : FAINT, fontWeight: 800, fontSize: 26}}>{p}</div>
            <div style={{color: MUTED, fontFamily: FONT, fontSize: 28}}>{p === 1 ? 'You \u2014 next up' : `Patient ahead ${p - 1}`}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Rx_tv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 610, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const sent = interpolate(frame, [660, 720], [0, 1], clamp01);
  const fu = spring({frame: frame - 750, fps, config: {damping: 200, stiffness: 100}});
  return (
    <div style={{position: 'absolute', right: 220, top: 760, width: 560, display: 'flex', flexDirection: 'column', gap: 28}}>
      <div style={{
        borderRadius: 28, background: PANEL, border: `2px solid ${HAIRLINE}`,
        padding: '40px 48px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 80}px)`,
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>E-PRESCRIPTION</div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 42, marginTop: 14}}>Amoxicillin 500mg</div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 8}}>Take 3x daily \u00B7 10 days</div>
        <div style={{marginTop: 24, height: 30, borderRadius: 15, background: 'rgba(242,247,252,0.08)', overflow: 'hidden'}}>
          <div style={{width: `${sent * 100}%`, height: '100%', background: `linear-gradient(90deg, ${BLUE}, ${GREEN})`}} />
        </div>
        <div style={{color: sent > 0.98 ? GREEN : MUTED, fontFamily: MONO, fontSize: 30, marginTop: 14}}>
          {sent > 0.98 ? '\u2713 SENT TO PHARMACY' : 'SENDING\u2026'}
        </div>
      </div>
      {fu > 0.001 && (
        <div style={{
          borderRadius: 28, background: 'rgba(8,20,32,0.94)', border: `2px solid ${VIOLET}`,
          padding: '36px 48px', opacity: Math.min(1, fu), transform: `translateX(${(1 - fu) * 80}px)`,
        }}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>FOLLOW-UP SCHEDULED</div>
          <div style={{color: VIOLET, fontFamily: FONT, fontWeight: 800, fontSize: 46, marginTop: 10}}>IN 2 WEEKS \u2713</div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 8}}>Visit summary emailed to you</div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TelehealthVisitFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_tv frame={frame} />
      <AmbientParticles_tv frame={frame} />
      <Title_tv frame={frame} fps={fps} />
      <Rail_tv frame={frame} fps={fps} />
      <Queue_tv frame={frame} fps={fps} />
      <CallWindow_tv frame={frame} fps={fps} />
      <Rx_tv frame={frame} fps={fps} />
      <TickerTape_tv frame={frame} />
      <CornerHud_tv frame={frame} />
      <FineDither_tv frame={frame} />
      <FilmGrain_tv frame={frame} />
    </AbsoluteFill>
  );
};
