/**
 * ProbateProcessFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * Court-administered probate: a will and courthouse open the story, the
 * executor files a petition and receives LETTERS TESTAMENTARY, the estate
 * inventory fans out (house, accounts, car), the creditor-notice clock ticks,
 * debts settle and taxes clear, then the remaining assets flow to the heirs
 * under an ESTATE CLOSED seal.
 * (Court paperwork and judges only — never insurance gates.)
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette — slate + parchment gold on warm near-black
// ---------------------------------------------------------------------------
const BG = '#0D0B08';
const INK = '#F2EDE2';
const MUTED = 'rgba(214,204,184,0.62)';
const SLATE = '#94A3B8';
const SLATE_DK = '#3B4453';
const GOLD = '#D9A94E';
const PARCH = '#EFE3C8';
const GREEN = '#4ADE80';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Deterministic estate value model
const valAt = (f: number): number => {
  const debts = interpolate(f, [560, 640], [0, 120000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const taxes = interpolate(f, [620, 680], [0, 40000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.max(0, 860000 - debts - taxes);
};
const VAL_MAX = 860000;

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}parch`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F5EDD8" />
      <stop offset="100%" stopColor="#DCCFA8" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(13,11,8,0)" />
      <stop offset="100%" stopColor="rgba(5,4,2,0.8)" />
    </radialGradient>
    <filter id={`${p}glow`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const Background: React.FC<{frame: number}> = ({frame}) => {
  const scan = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(217,169,78,0.11), rgba(217,169,78,0.03) 45%, rgba(13,11,8,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="pp" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#ppvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(217,169,78,0.030)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`pp-p-x-${i}`) * 3840;
    const by = random(`pp-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`pp-p-s-${i}`) * 1.0;
    const ang = random(`pp-a-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`pp-p-z-${i}`) * 5;
    els.push(
      <circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GOLD : 'rgba(148,163,184,0.8)'} opacity={tw} />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Dither: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 2400; i++) {
    const bx = random(`pp-d-x-${i}`) * 3840;
    const by = random(`pp-d-y-${i}`) * 2160;
    const jx = (random(`pp-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`pp-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`pp-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`pp-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E3D5B5" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Grain: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`pp-g-x-${frame}-${i}`) * 3840;
    const y = random(`pp-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pp-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`pp-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'LAST WILL', 'PETITION FILED', 'LETTERS TESTAMENTARY', 'ESTATE INVENTORY',
  'CREDITOR NOTICE PERIOD', 'DEBTS SETTLED', 'ESTATE CLOSED',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 4900;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 700} y={46} fill="rgba(217,169,78,0.75)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(217,169,78,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(217,169,78,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3210, y: 2090, t: 'PROBATE PROCESS'},
    {x: 2970, y: 130, t: 'BUSINESS · ESTATE'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={GOLD} opacity={0.35 + blink * 0.55} />
          <text x={c.x + 24} y={c.y} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3}>
            {c.t}
          </text>
        </g>
      ))}
    </svg>
  );
};

const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        PROBATE <span style={{color: GOLD}}>PROCESS</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        How a court settles an estate — <span style={{color: GOLD, fontWeight: 700}}>petition</span> · inventory ·
        creditors · <span style={{color: GOLD, fontWeight: 700}}>distribution</span>
      </div>
    </div>
  );
};

const EstateHud: React.FC<{frame: number}> = ({frame}) => {
  const inAt = spring({frame: frame - 60, fps: 60, config: {damping: 200, stiffness: 90}});
  if (inAt <= 0.01) return null;
  const v = valAt(frame);
  const fillC = interpolateColors(v / VAL_MAX, [0.6, 1], [GOLD, SLATE]);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, inAt)} transform={`translate(2810, 150) scale(${0.9 + Math.min(1, inAt) * 0.1})`}>
        <rect x={0} y={0} width={880} height={230} rx={28} fill="rgba(8,7,5,0.92)" stroke={GOLD} strokeWidth={3} filter="url(#ppglow)" />
        <text x={44} y={62} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4}>ESTATE VALUE</text>
        <text x={44} y={158} fill={fillC} fontSize={92} fontFamily={MONO} fontWeight={800}>
          ${Math.floor(v).toLocaleString('en-US')}
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — will document + courthouse (frames 30–150)
// ---------------------------------------------------------------------------
const WillAndCourt: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 20 || frame > 170) return null;
  const fade = interpolate(frame, [130, 170], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1 = spring({frame: frame - 20, fps, config: {damping: 200, stiffness: 100}});
  const s2 = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 100}});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        {/* will document */}
        <g opacity={Math.min(1, s1)} transform={`translate(350, ${700 + (1 - Math.min(1, s1)) * 120})`}>
          <rect x={0} y={0} width={700} height={640} rx={14} fill="url(#ppparch)" stroke="#8A7B4F" strokeWidth={4} />
          <text x={52} y={100} fill="#4A4132" fontSize={52} fontFamily={FONT} fontWeight={800} letterSpacing={6}>
            LAST WILL
          </text>
          <text x={52} y={150} fill="#6B5F45" fontSize={30} fontFamily={MONO}>& TESTAMENT</text>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={52} y1={230 + i * 58} x2={648 - (i % 3) * 110} y2={230 + i * 58} stroke="#B9AB83" strokeWidth={12} strokeLinecap="round" />
          ))}
          <text x={52} y={560} fill="#4A4132" fontSize={30} fontFamily={FONT} fontStyle="italic">signed · witnessed · filed</text>
        </g>
        {/* courthouse */}
        <g opacity={Math.min(1, s2)} transform={`translate(1500, ${560 + (1 - Math.min(1, s2)) * 120})`}>
          <polygon points="0,220 400,60 800,220" fill={SLATE_DK} stroke={GOLD} strokeWidth={5} />
          <circle cx={400} cy={150} r={34} fill="none" stroke={GOLD} strokeWidth={5} />
          <text x={400} y={166} fill={GOLD} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">§</text>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={60 + i * 150} y={230} width={70} height={330} fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
          ))}
          <rect x={0} y={220} width={800} height={26} fill={SLATE} />
          <rect x={-30} y={560} width={860} height={40} fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
          <text x={400} y={690} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={6}>
            COURTHOUSE
          </text>
          <text x={400} y={748} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
            the court supervises everything
          </text>
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — executor files petition, LETTERS TESTAMENTARY stamp (frames 120–280)
// ---------------------------------------------------------------------------
const Petition: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 120 || frame > 300) return null;
  const fade = interpolate(frame, [260, 300], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1 = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 105}});
  const fileP = interpolate(frame, [170, 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const st = spring({frame: frame - 215, fps, config: {damping: 200, stiffness: 130}});
  const px = 700 + fileP * (1750 - 700);
  const py = 1250 - Math.sin(fileP * Math.PI) * 260;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s1)} transform={`translate(350, ${1180 + (1 - Math.min(1, s1)) * 120})`}>
          <rect x={0} y={0} width={640} height={400} rx={30} fill="rgba(8,7,5,0.94)" stroke={SLATE} strokeWidth={4} filter="url(#ppglow)" />
          <text x={44} y={96} fill={SLATE} fontSize={30} fontFamily={MONO} letterSpacing={5}>NAMED IN THE WILL</text>
          <text x={44} y={200} fill={INK} fontSize={84} fontFamily={FONT} fontWeight={800}>EXECUTOR</text>
          <text x={44} y={272} fill={MUTED} fontSize={32} fontFamily={FONT}>files the petition with the court</text>
          <text x={44} y={332} fill={MUTED} fontSize={32} fontFamily={FONT}>asks to be appointed</text>
        </g>
        {/* petition flying to court */}
        {fileP > 0 && fileP < 1 && (
          <g transform={`translate(${px}, ${py}) rotate(${fileP * 18})`}>
            <rect x={-70} y={-90} width={140} height={180} rx={8} fill="url(#ppparch)" stroke="#8A7B4F" strokeWidth={3} />
            <text y={10} fill="#4A4132" fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">PETITION</text>
          </g>
        )}
        <g opacity={fileP * 0.5}>
          <path d="M 700 1250 Q 1225 990 1750 1230" fill="none" stroke={SLATE} strokeWidth={5} strokeDasharray="18 14" />
        </g>
        {/* LETTERS TESTAMENTARY stamp */}
        {st > 0.01 && (
          <g opacity={Math.min(1, st)} transform={`translate(1900, 1000) rotate(${-12 + (1 - Math.min(1, st)) * -18}) scale(${Math.min(1, st)})`}>
            <rect x={-330} y={-110} width={660} height={220} rx={20} fill="none" stroke={GOLD} strokeWidth={10} />
            <text y={-14} fill={GOLD} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">LETTERS</text>
            <text y={62} fill={GOLD} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">TESTAMENTARY</text>
            <text y={170} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>executor is now authorized</text>
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — estate inventory fans out: house, accounts, car (frames 260–440)
// ---------------------------------------------------------------------------
const Inventory: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 260 || frame > 470) return null;
  const fade = interpolate(frame, [430, 470], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s0 = spring({frame: frame - 260, fps, config: {damping: 200, stiffness: 100}});
  const items = [
    {x: 900, y: 1450, t: 'HOUSE', s: '$520,000', d: 300},
    {x: 1920, y: 1560, t: 'ACCOUNTS', s: '$240,000', d: 340},
    {x: 2940, y: 1450, t: 'CAR', s: '$100,000', d: 380},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s0)} transform={`translate(1920, ${980 + (1 - Math.min(1, s0)) * 100})`}>
          <rect x={-360} y={-110} width={720} height={220} rx={34} fill="rgba(8,7,5,0.94)" stroke={GOLD} strokeWidth={5} filter="url(#ppglow)" />
          <text y={10} fill={INK} fontSize={72} fontFamily={FONT} fontWeight={800} textAnchor="middle">ESTATE</text>
          <text y={70} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">every asset gets listed</text>
        </g>
        {items.map((it, i) => {
          const s = spring({frame: frame - it.d, fps, config: {damping: 200, stiffness: 100}});
          if (s <= 0.01) return null;
          const spread = interpolate(frame, [it.d, it.d + 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const ix = 1920 + (it.x - 1920) * spread;
          const iy = 1080 + (it.y - 1080) * spread;
          return (
            <g key={i} opacity={Math.min(1, s)} transform={`translate(${ix}, ${iy}) scale(${0.85 + Math.min(1, s) * 0.15})`}>
              <rect x={-240} y={-140} width={480} height={280} rx={28} fill="rgba(8,7,5,0.94)" stroke={SLATE} strokeWidth={4} />
              {i === 0 && (
                <g transform="translate(0, -30)">
                  <rect x={-60} y={-20} width={120} height={80} fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
                  <polygon points="-80,-20 0,-80 80,-20" fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
                </g>
              )}
              {i === 1 && (
                <g transform="translate(0, -30)">
                  <rect x={-70} y={-40} width={140} height={90} rx={12} fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
                  <line x1={-70} y1={-8} x2={70} y2={-8} stroke={SLATE} strokeWidth={3} />
                </g>
              )}
              {i === 2 && (
                <g transform="translate(0, -30)">
                  <rect x={-90} y={-30} width={180} height={60} rx={20} fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
                  <polygon points="-90,-30 -50,-70 50,-70 90,-30" fill={SLATE_DK} stroke={SLATE} strokeWidth={3} />
                  <circle cx={-55} cy={40} r={20} fill={SLATE} />
                  <circle cx={55} cy={40} r={20} fill={SLATE} />
                </g>
              )}
              <text y={110} fill={INK} fontSize={46} fontFamily={FONT} fontWeight={800} textAnchor="middle">{it.t}</text>
              <text y={168} fill={GOLD} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle">{it.s}</text>
            </g>
          );
        })}
        <text x={1920} y={420} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle" opacity={fade}>
          the executor catalogs <tspan fill={GOLD} fontWeight={700}>every asset</tspan> under court supervision
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 4 — creditor-notice clock ticks (frames 420–570)
// ---------------------------------------------------------------------------
const CreditorClock: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 420 || frame > 600) return null;
  const fade = interpolate(frame, [560, 600], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 420, fps, config: {damping: 200, stiffness: 100}});
  const handA = ((frame - 420) / (150 / 3)) * (Math.PI * 2); // ~3 full turns over the beat
  const tick = Math.floor((frame - 420) / 12);
  const notices = [
    {t: 'PUBLISHED IN LOCAL PAPER', d: 440},
    {t: 'CREDITORS COME FORWARD', d: 480},
    {t: 'CLAIMS WINDOW CLOSES', d: 520},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s)} transform={`translate(1920, ${1050 + (1 - Math.min(1, s)) * 100})`}>
          <circle cx={0} cy={0} r={300} fill="rgba(8,7,5,0.94)" stroke={GOLD} strokeWidth={8} filter="url(#ppglow)" />
          {Array.from({length: 12}).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line key={i} x1={Math.cos(a) * 262} y1={Math.sin(a) * 262} x2={Math.cos(a) * 284} y2={Math.sin(a) * 284}
                stroke={GOLD} strokeWidth={6} />
            );
          })}
          <line x1={0} y1={0} x2={Math.cos(handA - Math.PI / 2) * 220} y2={Math.sin(handA - Math.PI / 2) * 220}
            stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.cos(handA / 12 - Math.PI / 2) * 150} y2={Math.sin(handA / 12 - Math.PI / 2) * 150}
            stroke={GOLD} strokeWidth={14} strokeLinecap="round" />
          <circle cx={0} cy={0} r={20} fill={GOLD} />
          <text y={420} fill={INK} fontSize={56} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            CREDITOR-NOTICE PERIOD
          </text>
          <text y={478} fill={MUTED} fontSize={36} fontFamily={MONO} textAnchor="middle">
            TICK {String(Math.max(0, tick)).padStart(3, '0')}
          </text>
        </g>
        {notices.map((n, i) => {
          const on = interpolate(frame - n.d, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          if (on <= 0) return null;
          return (
            <g key={i} opacity={on} transform={`translate(520, ${900 + i * 130})`}>
              <circle cx={0} cy={-8} r={14} fill={i === 2 ? GREEN : GOLD} />
              <text x={36} y={6} fill={i === 2 ? GREEN : MUTED} fontSize={34} fontFamily={MONO} letterSpacing={2}>
                {n.t}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 5 — debts settle, taxes clear (frames 560–710)
// ---------------------------------------------------------------------------
const Settle: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 560 || frame > 730) return null;
  const fade = interpolate(frame, [690, 730], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rows = [
    {t: 'CREDIT CARD DEBT', v: '$45,000', d: 570},
    {t: 'MEDICAL BILLS', v: '$35,000', d: 600},
    {t: 'PERSONAL LOAN', v: '$40,000', d: 630},
    {t: 'ESTATE TAXES', v: '$40,000', d: 660},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade} transform="translate(350, 1080)">
        <rect x={0} y={0} width={1000} height={640} rx={30} fill="rgba(8,7,5,0.94)" stroke={SLATE} strokeWidth={4} filter="url(#ppglow)" />
        <text x={48} y={92} fill={SLATE} fontSize={30} fontFamily={MONO} letterSpacing={5}>VALID CLAIMS — PAID FIRST</text>
        {rows.map((r, i) => {
          const s = spring({frame: frame - r.d, fps, config: {damping: 200, stiffness: 140}});
          if (s <= 0.01) return null;
          const ry = 200 + i * 110;
          return (
            <g key={i} opacity={Math.min(1, s)}>
              <text x={48} y={ry} fill={MUTED} fontSize={36} fontFamily={MONO}>{r.t}</text>
              <text x={700} y={ry} fill={MUTED} fontSize={36} fontFamily={MONO}>{r.v}</text>
              <g transform={`translate(830, ${ry - 14}) scale(${Math.min(1, s)})`}>
                <circle cx={0} cy={0} r={34} fill="rgba(74,222,128,0.15)" stroke={GREEN} strokeWidth={5} />
                <path d="M -16 0 L -4 14 L 18 -12" fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round" />
              </g>
              <text x={48} y={ry + 40} fill={GREEN} fontSize={28} fontFamily={MONO} letterSpacing={2}>SETTLED</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — remaining assets flow to heirs, ESTATE CLOSED seal (frames 700–900)
// ---------------------------------------------------------------------------
const Heirs: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 700) return null;
  const s1 = spring({frame: frame - 700, fps, config: {damping: 200, stiffness: 100}});
  const seal = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 110}});
  const heirs = [
    {x: 2650, t: 'HEIR A', s: '$350,000', d: 730},
    {x: 3250, t: 'HEIR B', s: '$350,000', d: 770},
  ];
  const flows: React.ReactElement[] = [];
  for (let i = 0; i < 20; i++) {
    const p = interpolate(frame, [730 + i * 4, 730 + i * 4 + 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (p <= 0 || p >= 1) continue;
    const x = 1700 + p * (2950 - 1700);
    const y = 1150 - Math.sin(p * Math.PI) * 160 + (random(`pp-f-j-${i}`) - 0.5) * 60;
    flows.push(<circle key={i} cx={x} cy={y} r={18} fill={GOLD} opacity={0.9} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, s1)} transform={`translate(1150, ${1000 + (1 - Math.min(1, s1)) * 100})`}>
        <rect x={-330} y={-110} width={660} height={220} rx={34} fill="rgba(8,7,5,0.94)" stroke={GOLD} strokeWidth={5} filter="url(#ppglow)" />
        <text y={-8} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">REMAINDER</text>
        <text y={66} fill={GOLD} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          ${Math.floor(valAt(frame)).toLocaleString('en-US')}
        </text>
      </g>
      <g opacity={Math.min(1, s1)}>
        <path d="M 1500 1000 Q 2200 840 2950 1000" fill="none" stroke={GOLD} strokeWidth={6} strokeDasharray="22 16" />
        {flows}
      </g>
      {heirs.map((h, i) => {
        const s = spring({frame: frame - h.d, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.01) return null;
        return (
          <g key={i} opacity={Math.min(1, s)} transform={`translate(${h.x}, ${1000 + (1 - Math.min(1, s)) * 100})`}>
            <circle cx={0} cy={-60} r={70} fill={SLATE_DK} stroke={SLATE} strokeWidth={4} />
            <rect x={-70} y={20} width={140} height={150} rx={40} fill={SLATE_DK} stroke={SLATE} strokeWidth={4} />
            <text y={250} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">{h.t}</text>
            <text y={310} fill={GREEN} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">{h.s}</text>
          </g>
        );
      })}
      {seal > 0.01 && (
        <g opacity={Math.min(1, seal)} transform={`translate(1920, 1560) rotate(${-10 + (1 - Math.min(1, seal)) * -16}) scale(${Math.min(1, seal)})`}>
          <circle cx={0} cy={0} r={200} fill="rgba(217,169,78,0.16)" stroke={GOLD} strokeWidth={10} filter="url(#ppglow)" />
          <circle cx={0} cy={0} r={160} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="14 10" />
          <text y={-16} fill={GOLD} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">ESTATE</text>
          <text y={58} fill={GOLD} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">CLOSED</text>
          <polygon points="-40,220 40,220 20,300 -20,300" fill={GOLD} />
        </g>
      )}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(214,204,184,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Educational illustration of the court process — timelines vary by jurisdiction. Not legal advice.
    </div>
  );
};

export const ProbateProcessFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <EstateHud frame={frame} />
      <WillAndCourt frame={frame} fps={fps} />
      <Petition frame={frame} fps={fps} />
      <Inventory frame={frame} fps={fps} />
      <CreditorClock frame={frame} fps={fps} />
      <Settle frame={frame} fps={fps} />
      <Heirs frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
