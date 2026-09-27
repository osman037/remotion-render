/**
 * VoterRegistrationJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Civic registration arc: a registration form fills field by field, an ID
 * check badge verifies, a REGISTERED stamp slams down, a ballot drops into
 * a ballot box, and a confirmation seal pops under falling confetti — while
 * a REGISTRATION DEADLINE counter ticks across the top banner.
 *
 * Register in Root.tsx:
 *   <Composition id="VoterRegistrationJourney" component={VoterRegistrationJourney}
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

// ---------------------------------------------------------------------------
// Palette (patriotic deep navy + red/white/blue, generic — no party symbols)
// ---------------------------------------------------------------------------
const BG = '#0A1128';
const INK = '#F2F5FC';
const MUTED = 'rgba(190,203,228,0.62)';
const RED = '#E63946';
const BLUE = '#5B8DEF';
const WHITE = '#F4F6FB';
const VERIFY = '#34D399';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const CARD_IN = 60;
const FIELD_STARTS = [140, 230, 320, 410]; // one field every 90 frames
const FIELD_DUR = 90;
const VERIFY_START = 530;
const STAMP_AT = 650;
const BALLOT_START = 700;
const BALLOT_END = 810;
const SEAL_AT = 815;
const CONFETTI_START = 790;
const FOOTER_AT = 845;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helper
// ---------------------------------------------------------------------------
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Form data (generic names only)
// ---------------------------------------------------------------------------
interface Field {
  label: string;
  value: string;
}
const FIELDS: Field[] = [
  {label: 'FULL NAME', value: 'MARIA ELENA ROSS'},
  {label: 'DATE OF BIRTH', value: '04 / 17 / 1998'},
  {label: 'HOME ADDRESS', value: '482 HILLCREST AVE, SPRINGFIELD'},
  {label: 'ID NUMBER', value: 'ID-88234-7710'},
];

const CARD = {x: 300, y: 430, w: 1600, h: 1240};
const FIELD_STEP = 190;
const BOX_W = 1440;
const BOX_H = 96;

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlowRed" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(230,57,70,0.14)" />
      <stop offset="100%" stopColor="rgba(230,57,70,0)" />
    </radialGradient>
    <radialGradient id="bgGlowBlue" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(91,141,239,0.13)" />
      <stop offset="100%" stopColor="rgba(91,141,239,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(10,17,40,0)" />
      <stop offset="100%" stopColor="rgba(3,6,16,0.78)" />
    </radialGradient>
    <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="100%" stopColor="#DDE4F2" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(28,40,80,0.92)" />
      <stop offset="100%" stopColor="rgba(14,22,52,0.94)" />
    </linearGradient>
    <filter id="glowBlur" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered navy glow, drifting pinstripes, vignette, light sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const stripes = useMemo(
    () =>
      Array.from({length: 26}, (_, i) => ({
        x: (i / 25) * 4200 - 180,
        w: i % 4 === 0 ? 5 : 2,
      })),
    []
  );
  const drift = (frame * 0.6) % 340;
  const sweepY = ((frame / 900) * (2160 + 480) - 240) % (2160 + 480) - 240;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <ellipse cx={760} cy={420} rx={1150} ry={620} fill="url(#bgGlowRed)" opacity={0.8} />
        <ellipse cx={3120} cy={1780} rx={1250} ry={680} fill="url(#bgGlowBlue)" opacity={0.8} />
        <g opacity={0.05}>
          {stripes.map((s, i) => (
            <rect key={`ps${i}`} x={s.x - drift} y={0} width={s.w} height={2160} fill={WHITE} />
          ))}
        </g>
        <rect x={0} y={sweepY - 110} width={3840} height={220} fill="rgba(91,141,239,0.045)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Deadline banner (top strip with ticking countdown)
// ---------------------------------------------------------------------------
const DeadlineBanner: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const startSec = 12 * 86400 + 4 * 3600 + 33 * 60 + 12;
  const remain = Math.max(0, startSec - Math.floor(frame / 60));
  const d = Math.floor(remain / 86400);
  const h = Math.floor((remain % 86400) / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const clock = `${pad(d)}D : ${pad(h)}H : ${pad(m)}M : ${pad(s)}S`;
  const blink = Math.floor(frame / 30) % 2 === 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 3840,
        height: 140,
        opacity: fade,
        background: 'linear-gradient(180deg, rgba(20,28,62,0.95), rgba(12,18,44,0.88))',
        borderBottom: '4px solid rgba(230,57,70,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 160px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: RED,
            opacity: blink ? 1 : 0.25,
            boxShadow: '0 0 24px rgba(230,57,70,0.9)',
          }}
        />
        <span style={{color: INK, fontFamily: MONO, fontSize: 42, fontWeight: 700, letterSpacing: 6}}>
          REGISTRATION DEADLINE
        </span>
      </div>
      <span
        style={{
          color: WHITE,
          fontFamily: MONO,
          fontSize: 66,
          fontWeight: 800,
          letterSpacing: 2,
          textShadow: '0 0 30px rgba(230,57,70,0.55)',
        }}
      >
        {clock}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title block + generic star seal
// ---------------------------------------------------------------------------
const TitleBlock: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [10, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [10, 60], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', top: 200 + rise, left: 300, right: 300, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
            VOTER REGISTRATION
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 36, marginTop: 14}}>
            Civic participation drive &middot; Precinct 12 &middot; General election
          </div>
        </div>
        <svg width={210} height={210} viewBox="0 0 210 210">
          <circle cx={105} cy={105} r={96} fill="none" stroke={BLUE} strokeWidth={7} opacity={0.9} />
          <circle cx={105} cy={105} r={78} fill="none" stroke={RED} strokeWidth={3} opacity={0.7} />
          <path
            d="M105 52 L121 89 L160 90 L129 113 L140 151 L105 129 L70 151 L81 113 L50 90 L89 89 Z"
            fill={WHITE}
            opacity={0.92}
            style={{filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'}}
          />
        </svg>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Registration form card with typing fields + completion dots
// ---------------------------------------------------------------------------
const FormCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - CARD_IN, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: CARD.x,
        top: CARD.y + (1 - s) * 60,
        width: CARD.w,
        height: CARD.h,
        opacity: Math.min(1, s),
        borderRadius: 28,
        background: 'linear-gradient(150deg, rgba(28,40,80,0.92), rgba(14,22,52,0.94))',
        border: '2px solid rgba(91,141,239,0.35)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
        padding: '56px 80px',
      }}
    >
      <div style={{color: BLUE, fontFamily: MONO, fontSize: 40, fontWeight: 700, letterSpacing: 8}}>
        REGISTRATION FORM
      </div>
      <div style={{height: 3, background: 'rgba(91,141,239,0.30)', marginTop: 22, borderRadius: 2}} />

      {FIELDS.map((f, i) => {
        const start = FIELD_STARTS[i];
        const p = interpolate(frame, [start, start + FIELD_DUR], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const n = Math.floor(p * f.value.length);
        const text = f.value.slice(0, n);
        const done = p >= 1;
        const active = p > 0 && p < 1;
        const caretOn = active && Math.floor(frame / 15) % 2 === 0;
        const y = 640 + i * FIELD_STEP - CARD.y - 56; // relative to padded card
        return (
          <div key={f.label} style={{position: 'absolute', left: 80, top: 96 + y, width: BOX_W + 80}}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 4}}>{f.label}</div>
            <div
              style={{
                marginTop: 14,
                width: BOX_W,
                height: BOX_H,
                borderRadius: 14,
                border: `2px solid ${done ? 'rgba(52,211,153,0.65)' : active ? 'rgba(91,141,239,0.8)' : 'rgba(148,163,184,0.28)'}`,
                background: 'rgba(6,10,26,0.72)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 34px',
                boxShadow: active ? '0 0 26px rgba(91,141,239,0.25)' : 'none',
              }}
            >
              <span style={{color: INK, fontFamily: MONO, fontSize: 46, fontWeight: 600, letterSpacing: 1}}>
                {text}
                {caretOn && <span style={{color: BLUE}}>&#9612;</span>}
              </span>
              {done && (
                <span style={{color: VERIFY, fontFamily: MONO, fontSize: 40, marginLeft: 'auto'}}>&#10003;</span>
              )}
            </div>
          </div>
        );
      })}

      {/* completion dots */}
      <div style={{position: 'absolute', left: 80, top: 96 + (640 + 4 * FIELD_STEP - CARD.y - 56) - 10}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4, marginBottom: 18}}>
          ALL FIELDS REQUIRED
        </div>
        <div style={{display: 'flex', gap: 26}}>
          {FIELDS.map((f, i) => {
            const filled = frame >= FIELD_STARTS[i] + FIELD_DUR;
            return (
              <div
                key={`dot${i}`}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: filled ? VERIFY : 'rgba(148,163,184,0.18)',
                  border: `2px solid ${filled ? VERIFY : 'rgba(148,163,184,0.4)'}`,
                  boxShadow: filled ? '0 0 18px rgba(52,211,153,0.7)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ID verify badge (ring draws, then check, then label)
// ---------------------------------------------------------------------------
const VerifyBadge: React.FC<{frame: number}> = ({frame}) => {
  const ringP = interpolate(frame, [VERIFY_START, VERIFY_START + 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const checkP = interpolate(frame, [VERIFY_START + 45, VERIFY_START + 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelFade = interpolate(frame, [VERIFY_START + 95, VERIFY_START + 125], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (ringP <= 0) return null;
  const R = 95;
  const circ = 2 * Math.PI * R;
  const cx = 2160;
  const cy = 1300;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g>
        <circle cx={cx} cy={cy} r={R + 26} fill={VERIFY} opacity={0.10 * ringP} filter="url(#glowBlur)" />
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="rgba(8,14,30,0.92)"
          stroke="rgba(52,211,153,0.25)"
          strokeWidth={8}
        />
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={VERIFY}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - ringP)}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{filter: 'drop-shadow(0 0 14px rgba(52,211,153,0.8))'}}
        />
        <path
          d={`M ${cx - 40} ${cy + 4} L ${cx - 12} ${cy + 32} L ${cx + 44} ${cy - 30}`}
          fill="none"
          stroke={VERIFY}
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - checkP}
          style={{filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.8))'}}
        />
        <text
          x={cx}
          y={cy + R + 78}
          fill={VERIFY}
          fontSize={38}
          fontFamily={MONO}
          fontWeight={800}
          letterSpacing={6}
          textAnchor="middle"
          opacity={labelFade}
        >
          VERIFIED
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// REGISTERED stamp (slams onto the form)
// ---------------------------------------------------------------------------
const RegisteredStamp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - STAMP_AT, fps, config: {damping: 15, stiffness: 150}});
  if (s <= 0.001) return null;
  const scale = 1.65 - 0.65 * s;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 3840,
        height: 2160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          marginLeft: 610,
          marginTop: 130,
          transform: `rotate(-10deg) scale(${scale})`,
          opacity: Math.min(1, s * 1.4),
          border: `10px solid ${RED}`,
          borderRadius: 26,
          padding: '34px 90px',
          background: 'rgba(230,57,70,0.10)',
          boxShadow: '0 0 70px rgba(230,57,70,0.45), inset 0 0 40px rgba(230,57,70,0.18)',
        }}
      >
        <div
          style={{
            color: RED,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 118,
            letterSpacing: 10,
            textShadow: '0 0 26px rgba(230,57,70,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          REGISTERED
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ballot box + dropping ballot paper + cast counter
// ---------------------------------------------------------------------------
const BallotBox: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 620, fps, config: {damping: 200, stiffness: 95}});
  if (s <= 0.001) return null;

  const boxX = 2500;
  const boxW = 900;
  const boxTop = 1180;
  const cx = boxX + boxW / 2; // 2950
  const paperW = 430;
  const paperH = 560;

  const dropP = interpolate(frame, [BALLOT_START, BALLOT_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const easeIn = dropP * dropP;
  const paperTop = 560 + easeIn * (1110 - 560);
  const paperSink = interpolate(frame, [BALLOT_END, BALLOT_END + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const paperOpacity = 1 - paperSink;
  const sway = Math.sin(frame * 0.08) * 14 * (1 - dropP);

  const count = Math.round(
    interpolate(frame, [BALLOT_END, BALLOT_END + 40], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, s)} transform={`translate(0, ${(1 - s) * 50})`}>
        {/* ballot paper (drawn first, behind box front) */}
        {dropP > 0 && paperOpacity > 0 && (
          <g opacity={paperOpacity} transform={`translate(${cx + sway}, ${paperTop + paperSink * 90})`}>
            <rect x={-paperW / 2} y={0} width={paperW} height={paperH} rx={10} fill="url(#paperGrad)" />
            <rect
              x={-paperW / 2}
              y={0}
              width={paperW}
              height={paperH}
              rx={10}
              fill="none"
              stroke="rgba(20,30,60,0.35)"
              strokeWidth={3}
            />
            <text x={0} y={64} fill="#1B2440" fontSize={32} fontFamily={MONO} fontWeight={800} letterSpacing={4} textAnchor="middle">
              OFFICIAL BALLOT
            </text>
            <line x1={-paperW / 2 + 40} y1={100} x2={paperW / 2 - 40} y2={100} stroke="rgba(20,30,60,0.25)" strokeWidth={2} />
            {/* candidate A — unchecked */}
            <rect x={-paperW / 2 + 48} y={150} width={40} height={40} rx={6} fill="none" stroke="#1B2440" strokeWidth={4} />
            <text x={-paperW / 2 + 110} y={183} fill="#1B2440" fontSize={34} fontFamily={FONT} fontWeight={600}>
              CANDIDATE A
            </text>
            {/* candidate B — checked */}
            <rect x={-paperW / 2 + 48} y={230} width={40} height={40} rx={6} fill={BLUE} stroke={BLUE} strokeWidth={4} />
            <path
              d={`M ${-paperW / 2 + 56} ${250} L ${-paperW / 2 + 64} ${260} L ${-paperW / 2 + 82} ${242}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x={-paperW / 2 + 110} y={263} fill="#1B2440" fontSize={34} fontFamily={FONT} fontWeight={700}>
              CANDIDATE B
            </text>
            {[330, 380, 430].map((yy) => (
              <line
                key={`bl${yy}`}
                x1={-paperW / 2 + 48}
                y1={yy}
                x2={paperW / 2 - 48}
                y2={yy}
                stroke="rgba(20,30,60,0.18)"
                strokeWidth={3}
              />
            ))}
          </g>
        )}

        {/* box body */}
        <rect x={boxX} y={boxTop} width={boxW} height={520} rx={18} fill="#16224A" stroke={BLUE} strokeWidth={4} />
        <rect x={boxX} y={boxTop} width={boxW} height={120} rx={18} fill="rgba(91,141,239,0.14)" />
        {/* slot */}
        <rect x={cx - 330} y={boxTop - 26} width={660} height={52} rx={14} fill="#05080F" stroke="rgba(91,141,239,0.5)" strokeWidth={3} />
        {/* stencil label */}
        <text x={cx} y={boxTop + 300} fill={WHITE} fontSize={72} fontFamily={FONT} fontWeight={800} letterSpacing={10} textAnchor="middle" opacity={0.92}>
          BALLOT BOX
        </text>
        <text x={cx} y={boxTop + 362} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
          PRECINCT 12 &middot; SEALED
        </text>
        {/* counter plate */}
        <rect x={cx - 260} y={boxTop + 400} width={520} height={86} rx={14} fill="rgba(5,8,15,0.85)" stroke="rgba(148,163,184,0.4)" strokeWidth={2.5} />
        <text x={cx} y={boxTop + 456} fill={BLUE} fontSize={42} fontFamily={MONO} fontWeight={800} letterSpacing={2} textAnchor="middle">
          BALLOTS CAST: {String(count).padStart(3, '0')}
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Confirmation seal (pops after the ballot drops)
// ---------------------------------------------------------------------------
const CheckSeal: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - SEAL_AT, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001) return null;
  const cx = 2950;
  const cy = 830;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, s)} transform={`translate(${cx}, ${cy}) scale(${0.55 + 0.45 * s})`}>
        <circle r={150} fill={BLUE} opacity={0.14} filter="url(#glowBlur)" />
        <circle r={118} fill="rgba(8,14,32,0.94)" stroke={BLUE} strokeWidth={7} />
        <circle
          r={118}
          fill="none"
          stroke={WHITE}
          strokeWidth={3}
          strokeDasharray="20 16"
          opacity={0.7}
          transform={`rotate(${frame * 1.5})`}
        />
        <path
          d="M -52 6 L -16 42 L 56 -36"
          fill="none"
          stroke={WHITE}
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{filter: 'drop-shadow(0 0 16px rgba(91,141,239,0.9))'}}
        />
      </g>
      <text
        x={cx}
        y={cy + 210}
        fill={WHITE}
        fontSize={40}
        fontFamily={MONO}
        fontWeight={800}
        letterSpacing={8}
        textAnchor="middle"
        opacity={Math.min(1, s)}
      >
        VOTE COUNTED
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Confetti (deterministic falling pieces)
// ---------------------------------------------------------------------------
const ConfettiLayer: React.FC<{frame: number}> = ({frame}) => {
  const pieces = useMemo(
    () =>
      Array.from({length: 80}, (_, i) => ({
        x: rand(i * 3 + 1) * 3840,
        delay: rand(i * 7 + 2) * 55,
        speed: 9 + rand(i * 11 + 3) * 8,
        rot: rand(i * 13 + 4) * 360,
        spin: (rand(i * 17 + 5) - 0.5) * 14,
        w: 16 + rand(i * 19 + 6) * 14,
        h: 24 + rand(i * 23 + 7) * 20,
        color: [RED, WHITE, BLUE, '#F4F1EA'][i % 4],
      })),
    []
  );
  if (frame < CONFETTI_START) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {pieces.map((p, i) => {
        const t = frame - CONFETTI_START - p.delay;
        if (t < 0) return null;
        const y = -90 + t * p.speed;
        if (y > 2260) return null;
        const fadeOut = interpolate(frame, [860, 900], [1, 0.15], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const rot = p.rot + t * p.spin;
        return (
          <rect
            key={`cf${i}`}
            x={p.x}
            y={y}
            width={p.w}
            height={p.h}
            rx={4}
            fill={p.color}
            opacity={0.95 * fadeOut}
            transform={`rotate(${rot} ${p.x + p.w / 2} ${y + p.h / 2})`}
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom stepper: form -> verify -> stamp -> ballot
// ---------------------------------------------------------------------------
const STEPS = [
  {label: 'COMPLETE FORM', at: 140},
  {label: 'VERIFY ID', at: 530},
  {label: 'GET STAMPED', at: 650},
  {label: 'CAST BALLOT', at: 700},
];
const Stepper: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const xs = [960, 1600, 2240, 2880];
  const y = 1900;
  const doneCount = STEPS.filter((st) => frame >= st.at).length;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      <line x1={xs[0]} y1={y} x2={xs[3]} y2={y} stroke="rgba(148,163,184,0.25)" strokeWidth={5} />
      <line
        x1={xs[0]}
        y1={y}
        x2={xs[0] + (xs[3] - xs[0]) * Math.min(1, (doneCount / STEPS.length) * 1.0)}
        y2={y}
        stroke={BLUE}
        strokeWidth={5}
        strokeLinecap="round"
        style={{filter: 'drop-shadow(0 0 10px rgba(91,141,239,0.7))'}}
      />
      {STEPS.map((st, i) => {
        const active = frame >= st.at;
        return (
          <g key={st.label}>
            <circle
              cx={xs[i]}
              cy={y}
              r={44}
              fill={active ? BLUE : 'rgba(10,17,40,0.9)'}
              stroke={active ? BLUE : 'rgba(148,163,184,0.45)'}
              strokeWidth={4}
              style={active ? {filter: 'drop-shadow(0 0 16px rgba(91,141,239,0.8))'} : undefined}
            />
            <text
              x={xs[i]}
              y={y + 16}
              fill={active ? '#0A1128' : MUTED}
              fontSize={38}
              fontFamily={MONO}
              fontWeight={800}
              textAnchor="middle"
            >
              {active ? '\u2713' : String(i + 1)}
            </text>
            <text
              x={xs[i]}
              y={y + 104}
              fill={active ? INK : MUTED}
              fontSize={32}
              fontFamily={MONO}
              fontWeight={active ? 700 : 400}
              letterSpacing={3}
              textAnchor="middle"
            >
              {st.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const FooterNote: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [FOOTER_AT, FOOTER_AT + 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 54,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(190,203,228,0.6)',
        fontFamily: FONT,
        fontSize: 30,
        letterSpacing: 2,
        opacity: fade,
      }}
    >
      Every voice matters &nbsp;&middot;&nbsp; register &nbsp;&middot;&nbsp; verify &nbsp;&middot;&nbsp; vote
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const VoterRegistrationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <DeadlineBanner frame={frame} />
      <TitleBlock frame={frame} />
      <FormCard frame={frame} fps={fps} />
      <VerifyBadge frame={frame} />
      <RegisteredStamp frame={frame} fps={fps} />
      <BallotBox frame={frame} fps={fps} />
      <CheckSeal frame={frame} fps={fps} />
      <ConfettiLayer frame={frame} />
      <Stepper frame={frame} />
      <FooterNote frame={frame} />
    </AbsoluteFill>
  );
};

export default VoterRegistrationJourney;
