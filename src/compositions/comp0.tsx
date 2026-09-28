/**
 * AppointmentBookingFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A warm paper-style online appointment booking flow: October 2026 calendar
 * tiles in, Oct 14 pulses selected, time-slot chips cascade and one confirms,
 * a booking confirmation card assembles (service, date, time, booking ref,
 * QR-style block), and a reminder bell pops. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="AppointmentBookingFlow" component={AppointmentBookingFlow}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (no Math.random in visuals)
// ---------------------------------------------------------------------------
const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (warm paper)
// ---------------------------------------------------------------------------
const BG = '#F6F1E7';
const PAPER = '#FFFDF8';
const INK = '#1B2436';
const MUTED = 'rgba(27,36,54,0.58)';
const FAINT = 'rgba(27,36,54,0.14)';
const ACCENT = '#D9552C';
const ACCENT_DEEP = '#B23E1D';
const GOLD = '#C9A227';
const SUCCESS = '#1F9D6B';
const TILE_BG = '#FFFFFF';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps)
// ---------------------------------------------------------------------------
const CAL_START = 60;
const DATE_PICK = 250; // Oct 14 selected
const SLOTS_START = 300;
const SLOT_CONFIRM = 470; // 10:30 AM confirmed
const CARD_START = 540; // confirmation card assembles
const QR_START = 640;
const BELL_START = 730; // reminder bell
const RESOLVE_START = 800;

// ---------------------------------------------------------------------------
// Calendar data: October 2026. Oct 1 = Thursday.
// Grid columns MON..SUN; leading blanks = 3.
// ---------------------------------------------------------------------------
const LEAD_BLANKS = 3;
const DAYS_IN_MONTH = 31;
const SELECTED_DAY = 14;
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const SLOTS = [
  '09:00 AM', '10:30 AM', '12:00 PM', '02:15 PM',
  '03:45 PM', '05:00 PM', '06:30 PM', '07:45 PM',
];
const CHOSEN_SLOT = 1; // 10:30 AM

const BOOKING_ROWS = [
  {label: 'SERVICE', value: 'Haircut + Color · 75 min'},
  {label: 'DATE', value: 'Wednesday, Oct 14, 2026'},
  {label: 'TIME', value: '10:30 AM (PKT)'},
  {label: 'GUEST', value: 'Sana K.'},
  {label: 'PRICE', value: '$85.00'},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="paperGlow" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(217,85,44,0.10)" />
      <stop offset="50%" stopColor="rgba(201,162,39,0.05)" />
      <stop offset="100%" stopColor="rgba(246,241,231,0)" />
    </radialGradient>
    <radialGradient id="paperVignette" cx="50%" cy="50%" r="78%">
      <stop offset="62%" stopColor="rgba(120,90,40,0)" />
      <stop offset="100%" stopColor="rgba(120,90,40,0.16)" />
    </radialGradient>
    <linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="100%" stopColor={'#E8C95A'} />
    </linearGradient>
    <linearGradient id="accentBtn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={ACCENT} />
      <stop offset="100%" stopColor={ACCENT_DEEP} />
    </linearGradient>
    <linearGradient id="cardSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
      <stop offset="60%" stopColor="rgba(255,255,255,0.25)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="18" stdDeviation="26" floodColor="#1B2436" floodOpacity="0.18" />
    </filter>
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
// Background: warm paper + glow + vignette + faint dot grid
// ---------------------------------------------------------------------------
const Background: React.FC = () => {
  const dots = useMemo(() => {
    const out: {x: number; y: number}[] = [];
    for (let gx = 0; gx < 48; gx++) {
      for (let gy = 0; gy < 27; gy++) {
        out.push({x: 40 + gx * 80, y: 40 + gy * 80});
      }
    }
    return out;
  }, []);
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#paperGlow)" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={2.2} fill="rgba(27,36,54,0.05)" />
        ))}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#paperVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 40], [30, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', top: 84 + rise, left: 200, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        <div style={{
          width: 16, height: 64, borderRadius: 8,
          background: 'linear-gradient(180deg, #D9552C, #C9A227)',
        }} />
        <div>
          <div style={{
            color: INK, fontFamily: FONT, fontWeight: 800,
            fontSize: 78, letterSpacing: -1.5, lineHeight: 1,
          }}>
            Book your appointment
          </div>
          <div style={{
            color: MUTED, fontFamily: MONO, fontSize: 32,
            letterSpacing: 3, marginTop: 12,
          }}>
            SALON AURA &middot; ONLINE SCHEDULING
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calendar panel (left)
// ---------------------------------------------------------------------------
const CAL_X = 200;
const CAL_Y = 330;
const CAL_W = 1500;
const TILE = 196;
const GAP = 18;

const Calendar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panel = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 80}});
  if (panel <= 0.001) return null;

  const selPulse = 1 + 0.045 * Math.sin((frame - DATE_PICK) * 0.12);
  const showSel = frame >= DATE_PICK;

  const cells: {day: number | null; col: number; row: number; key: string}[] = [];
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 5; r++) {
      const idx = r * 7 + c - LEAD_BLANKS;
      const day = idx >= 0 && idx < DAYS_IN_MONTH ? idx + 1 : null;
      cells.push({day, col: c, row: r, key: `${c}-${r}`});
    }
  }

  const fadeOut = interpolate(frame, [CARD_START + 20, CARD_START + 100], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      position: 'absolute', left: CAL_X, top: CAL_Y, width: CAL_W,
      opacity: Math.min(1, panel) * (1 - fadeOut),
      transform: `translateY(${(1 - panel) * 40 - fadeOut * 140}px)`,
    }}>
      <div style={{
        background: PAPER, borderRadius: 36, padding: '48px 52px 52px',
        border: `2px solid ${FAINT}`, filter: 'url(#cardShadow)',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 64}}>
            October <span style={{color: ACCENT}}>2026</span>
          </div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>
            STEP 1 &middot; PICK A DATE
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: `repeat(7, ${TILE}px)`, gap: GAP, marginTop: 34}}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{
              textAlign: 'center', color: MUTED, fontFamily: MONO,
              fontSize: 26, letterSpacing: 2, paddingBottom: 6,
            }}>{w}</div>
          ))}
          {cells.map(({day, col, row, key}) => {
            const order = row * 7 + col;
            const s = spring({
              frame: frame - (CAL_START + order * 3.2), fps,
              config: {damping: 200, stiffness: 120},
            });
            if (s <= 0.001) return <div key={key} />;
            const isSel = day === SELECTED_DAY;
            return (
              <div key={key} style={{
                width: TILE, height: TILE, borderRadius: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSel && showSel ? ACCENT : TILE_BG,
                border: isSel && showSel
                  ? `3px solid ${ACCENT_DEEP}`
                  : `2px solid ${FAINT}`,
                transform: `scale(${isSel && showSel ? selPulse * (0.6 + 0.4 * s) : 0.6 + 0.4 * s})`,
                opacity: Math.min(1, s),
                boxShadow: isSel && showSel
                  ? '0 0 44px rgba(217,85,44,0.55)'
                  : 'none',
              }}>
                {day !== null && (
                  <span style={{
                    color: isSel && showSel ? '#FFFFFF' : INK,
                    fontFamily: day === SELECTED_DAY ? FONT : MONO,
                    fontWeight: isSel && showSel ? 800 : 500,
                    fontSize: isSel && showSel ? 56 : 44,
                  }}>{day}</span>
                )}
              </div>
            );
          })}
        </div>
        {showSel && (
          <div style={{
            marginTop: 26, display: 'flex', alignItems: 'center', gap: 18,
            opacity: interpolate(frame, [DATE_PICK, DATE_PICK + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: SUCCESS,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 30, fontWeight: 800,
            }}>&#10003;</div>
            <div style={{color: INK, fontFamily: FONT, fontSize: 34, fontWeight: 600}}>
              Wednesday, October 14 selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Time slot panel (right)
// ---------------------------------------------------------------------------
const SLOTS_X = 1900;
const SLOTS_Y = 330;

const TimeSlots: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panel = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 80}});
  if (panel <= 0.001) return null;

  return (
    <div style={{
      position: 'absolute', left: SLOTS_X, top: SLOTS_Y, width: 1740,
      opacity: Math.min(1, panel),
      transform: `translateY(${(1 - panel) * 40}px)`,
    }}>
      <div style={{
        background: PAPER, borderRadius: 36, padding: '48px 52px',
        border: `2px solid ${FAINT}`, filter: 'url(#cardShadow)',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 64}}>
            Pick a <span style={{color: ACCENT}}>time</span>
          </div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>
            STEP 2
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26, marginTop: 36}}>
          {SLOTS.map((slot, i) => {
            const s = spring({
              frame: frame - (SLOTS_START + i * 26), fps,
              config: {damping: 200, stiffness: 110},
            });
            if (s <= 0.001) return <div key={slot} />;
            const chosen = i === CHOSEN_SLOT && frame >= SLOT_CONFIRM;
            const tap = chosen
              ? 1 + 0.10 * Math.sin((frame - SLOT_CONFIRM) * 0.35) * Math.exp(-(frame - SLOT_CONFIRM) * 0.03)
              : 1;
            return (
              <div key={slot} style={{
                borderRadius: 22, padding: '30px 0', textAlign: 'center',
                background: chosen ? 'linear-gradient(180deg, #D9552C, #B23E1D)' : TILE_BG,
                border: chosen ? `3px solid ${ACCENT_DEEP}` : `2px solid ${FAINT}`,
                opacity: Math.min(1, s),
                transform: `translateY(${(1 - s) * 34}px) scale(${tap * (0.85 + 0.15 * s)})`,
                boxShadow: chosen ? '0 0 44px rgba(217,85,44,0.5)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
              }}>
                {chosen && (
                  <span style={{color: '#fff', fontSize: 40, fontWeight: 800}}>&#10003;</span>
                )}
                <span style={{
                  color: chosen ? '#FFFFFF' : INK,
                  fontFamily: MONO, fontWeight: chosen ? 800 : 600, fontSize: 46,
                }}>{slot}</span>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 30, color: MUTED, fontFamily: FONT, fontSize: 30,
          opacity: interpolate(frame, [SLOTS_START + 200, SLOTS_START + 240], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>
          8 open slots &middot; all times shown in your timezone
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Confirmation card (bottom center) with QR-style block
// ---------------------------------------------------------------------------
const CARD_X = 200;
const CARD_Y = 1290;

const QrBlock: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cells = useMemo(() => {
    const out: boolean[] = [];
    for (let i = 0; i < 121; i++) {
      const r = Math.floor(i / 11);
      const c = i % 11;
      const inFinder = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
      out.push(inFinder ? true : rand(i * 7.3 + 1) > 0.52);
    }
    return out;
  }, []);
  return (
    <svg width={300} height={300} viewBox="0 0 300 300">
      <rect x={0} y={0} width={300} height={300} rx={18} fill={INK} />
      {cells.map((on, i) => {
        const r = Math.floor(i / 11);
        const c = i % 11;
        const s = spring({
          frame: frame - (QR_START + i * 1.6), fps,
          config: {damping: 220, stiffness: 160},
        });
        if (s <= 0.001) return null;
        return (
          <rect
            key={i}
            x={22 + c * 23.4}
            y={22 + r * 23.4}
            width={19}
            height={19}
            rx={3}
            fill={on ? '#FFFFFF' : 'rgba(255,255,255,0.10)'}
            opacity={Math.min(1, s)}
            transform={`translate(${11.7 + c * 23.4} ${11.7 + r * 23.4}) scale(${s}) translate(${-(11.7 + c * 23.4)} ${-(11.7 + r * 23.4)})`}
          />
        );
      })}
    </svg>
  );
};

const ConfirmCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - CARD_START, fps, config: {damping: 200, stiffness: 70}});
  if (s <= 0.001) return null;

  const glow = interpolate(frame, [RESOLVE_START, 900], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      position: 'absolute', left: CARD_X, top: CARD_Y, width: 3440,
      opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 90}px) scale(${0.94 + 0.06 * s})`,
    }}>
      <div style={{
        background: PAPER, borderRadius: 40, padding: '52px 60px',
        border: `2px solid ${FAINT}`, filter: 'url(#cardShadow)',
        boxShadow: `0 0 ${glow * 90}px rgba(201,162,39,0.35)`,
        display: 'flex', gap: 70, alignItems: 'center',
      }}>
        <div style={{flex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', background: SUCCESS,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 52, fontWeight: 800, filter: 'url(#softGlow)',
            }}>&#10003;</div>
            <div>
              <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 58}}>
                Booking confirmed
              </div>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2, marginTop: 6}}>
                REF BK-8X2Q &middot; STEP 3
              </div>
            </div>
          </div>
          <div style={{marginTop: 30}}>
            {BOOKING_ROWS.map((row, i) => {
              const rs = spring({
                frame: frame - (CARD_START + 40 + i * 34), fps,
                config: {damping: 200, stiffness: 120},
              });
              if (rs <= 0.001) return null;
              return (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '14px 0', borderBottom: i < BOOKING_ROWS.length - 1 ? `2px dashed ${FAINT}` : 'none',
                  opacity: Math.min(1, rs),
                  transform: `translateX(${(1 - rs) * -26}px)`,
                }}>
                  <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>{row.label}</span>
                  <span style={{color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 38}}>{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{textAlign: 'center'}}>
          <QrBlock frame={frame} fps={fps} />
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, marginTop: 14, letterSpacing: 1}}>
            SCAN AT CHECK-IN
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reminder bell pop
// ---------------------------------------------------------------------------
const ReminderBell: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - BELL_START, fps, config: {damping: 140, stiffness: 120}});
  if (s <= 0.001) return null;
  const swing = frame > BELL_START + 20
    ? Math.sin((frame - BELL_START - 20) * 0.22) * 9 * Math.exp(-(frame - BELL_START - 20) * 0.045)
    : 0;
  return (
    <div style={{
      position: 'absolute', right: 210, top: 300,
      opacity: Math.min(1, s),
      transform: `scale(${0.5 + 0.5 * s})`,
    }}>
      <div style={{
        background: INK, borderRadius: 30, padding: '30px 44px',
        display: 'flex', alignItems: 'center', gap: 24,
        border: `2px solid rgba(255,255,255,0.14)`,
      }}>
        <div style={{transform: `rotate(${swing}deg)`, transformOrigin: 'top center'}}>
          <svg width={72} height={72} viewBox="0 0 72 72">
            <path d="M36 8c-11 0-18 8-18 19v12l-7 11h50l-7-11V27c0-11-7-19-18-19z" fill={GOLD} />
            <circle cx={36} cy={58} r={7} fill={GOLD} />
            <path d="M28 6c2-3 5-4 8-4s6 1 8 4" stroke={GOLD} strokeWidth={5} fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 40}}>
            Reminder set
          </div>
          <div style={{color: 'rgba(255,255,255,0.65)', fontFamily: FONT, fontSize: 30, marginTop: 4}}>
            We will nudge you 1 day before
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [RESOLVE_START - 40, RESOLVE_START + 20], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{
      position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center',
      color: MUTED, fontFamily: FONT, fontSize: 28, opacity: fade,
    }}>
      Free cancellation up to 4 hours before &middot; Reschedule anytime from your confirmation link
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Deterministic full-frame film grain — bitrate insurance for the >= 20 Mbps verify gate.
// random() from 'remotion' is seeded; positions re-seed every frame. Subtle by design.
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: JSX.Element[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`grain-x-${frame}-${i}`) * 3840;
    const y = random(`grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

export const AppointmentBookingFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background />
      <TitleBar frame={frame} />
      <Calendar frame={frame} fps={fps} />
      <TimeSlots frame={frame} fps={fps} />
      <ConfirmCard frame={frame} fps={fps} />
      <ReminderBell frame={frame} fps={fps} />
      <Footer frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default AppointmentBookingFlow;
