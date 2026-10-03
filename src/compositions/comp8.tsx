/**
 * TrademarkRegistrationFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A wordmark card with a ™ travels through four glowing registry gates:
 * search (magnifier scan) -> filing stamps -> examination checklist ->
 * publication banner -> the ® badge seals on in gold -> renewal ticks orbit
 * the badge. Regal purple/gold. Deterministic.
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
// Palette (regal purple / gold)
// ---------------------------------------------------------------------------
const BG = '#120E1C';
const INK = '#F7F2E8';
const MUTED = 'rgba(247,242,232,0.64)';
const FAINT = 'rgba(247,242,232,0.34)';
const PURPLE = '#C084FC';
const GOLD = '#FDE68A';
const GREEN = '#34D399';
const RED = '#F87171';
const PANEL = 'rgba(20,14,32,0.93)';
const HAIRLINE = 'rgba(247,242,232,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: tm
// ---------------------------------------------------------------------------
const Background_tm: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#E9D5FF" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(192,132,252,0.13), rgba(192,132,252,0.03) 46%, rgba(18,14,28,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#tmVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(253,230,138,0.05)" />
        <defs>
          <radialGradient id="tmVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(18,14,28,0)" />
            <stop offset="100%" stopColor="rgba(7,5,12,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_tm: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`tm-amb-x-${i}`) * 3840;
    const by = random(`tm-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`tm-amb-s-${i}`) * 1.4;
    const ang = random(`tm-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`tm-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? GOLD : i % 4 === 1 ? PURPLE : 'rgba(247,242,232,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_tm: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`tm-dth-x-${i}`) * 3840;
    const by = random(`tm-dth-y-${i}`) * 2160;
    const jx = (random(`tm-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`tm-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`tm-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`tm-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#F3E8FF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_tm = [
  'SERIAL NO. 99-104382',
  'CLASS 09',
  'SEARCH: 0 CONFLICTS',
  'OPPOSITION: NONE FILED',
  'GAZETTE PUBLISHED',
  '® SEALED',
  'RENEW EVERY 10 YEARS',
  'BRAND PROTECTED',
];
const TickerTape_tm: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_tm.join('   ◆   ') + '   ◆   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(253,230,138,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(10,7,18,0.66)', borderBottom: '1px solid rgba(247,242,232,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_tm: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(192,132,252,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={GOLD} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? GOLD : 'rgba(247,242,232,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? GOLD : 'rgba(247,242,232,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_tm: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`tm-grain-x-${frame}-${i}`) * 3840;
    const y = random(`tm-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`tm-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`tm-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Shared geometry: the wordmark card travels gate to gate across 120..680
// ---------------------------------------------------------------------------
const GATE_X = [520, 1280, 2040, 2800];
const PASS_F = [280, 430, 600, 700];
const GATE_LABELS = ['01 · REGISTRY SEARCH', '02 · FILING', '03 · EXAMINATION', '04 · PUBLICATION'];
const CHIP_LABELS = ['SEARCH CLEAR', 'FILED ✓', 'EXAM PASSED ✓', 'PUBLISHED ✓'];
const CARD_CY = 1050;

const cardX = (frame: number): number => interpolate(frame, [120, 680], [520, 2800], clamp01);

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        TRADEMARK REGISTRATION FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        From wordmark to <span style={{color: GOLD}}>®</span> — search, file, examine, publish, seal
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Four registry gates; the card travels through them
// ---------------------------------------------------------------------------
const Gates_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [60, 120], [0, 1], clamp01);
  if (fade <= 0) return null;
  const cx = cardX(frame);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      <defs>
        <filter id="tmGateGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={26} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {GATE_X.map((gx, i) => {
        const passed = frame >= PASS_F[i];
        const active = Math.abs(cx - gx) < 280 && !passed;
        const s = spring({frame: frame - (40 + i * 22), fps, config: {damping: 200, stiffness: 90}});
        if (s <= 0.001) return null;
        const stroke = passed ? GOLD : active ? PURPLE : 'rgba(192,132,252,0.30)';
        const glowO = passed ? 0.9 : active ? 0.65 : 0.25;
        const pulse = active ? 0.75 + 0.25 * Math.sin(frame * 0.12) : 1;
        return (
          <g key={i} opacity={Math.min(1, s)}>
            {/* arch */}
            <rect x={gx - 220} y={620} width={440} height={860} rx={60} fill="none"
              stroke={stroke} strokeWidth={passed ? 14 : 8} opacity={glowO * pulse}
              filter="url(#tmGateGlow)" />
            <rect x={gx - 220} y={620} width={440} height={860} rx={60} fill="none"
              stroke={stroke} strokeWidth={3} opacity={0.9} />
            {/* label plate */}
            <rect x={gx - 250} y={520} width={500} height={72} rx={20} fill={PANEL} stroke={stroke} strokeWidth={3} opacity={0.96} />
            <text x={gx} y={570} fill={passed ? GOLD : INK} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
              {GATE_LABELS[i]}
            </text>
            {/* status chip */}
            {passed && (
              <g>
                <rect x={gx - 210} y={1530} width={420} height={64} rx={32} fill="rgba(253,230,138,0.10)" stroke={GOLD} strokeWidth={3} />
                <text x={gx} y={1574} fill={GOLD} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
                  {CHIP_LABELS[i]}
                </text>
              </g>
            )}
            {/* gate tick marks */}
            {Array.from({length: 9}, (_, k) => (
              <rect key={k} x={gx - 220 + k * 55} y={1408} width={4} height={24}
                fill={passed ? GOLD : 'rgba(192,132,252,0.4)'} opacity={0.8} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The traveling wordmark card + ™ -> ® seal
// ---------------------------------------------------------------------------
const LogoCard_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 110, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const cx = cardX(frame);
  const x = cx - 260;
  const y = CARD_CY - 210;
  const rise = interpolate(frame, [110, 150], [60, 0], clamp01);
  const sealed = frame >= 750;
  const sealS = spring({frame: frame - 750, fps, config: {damping: 170, stiffness: 120}});
  const shock = interpolate(frame, [750, 830], [0, 1], clamp01);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={Math.min(1, s)}>
      <defs>
        <linearGradient id="tmCardBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#241A38" />
          <stop offset="55%" stopColor="#1B1430" />
          <stop offset="100%" stopColor="#150F26" />
        </linearGradient>
        <linearGradient id="tmSealG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="45%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
        <filter id="tmCardShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx={0} dy={18} stdDeviation={34} floodColor="#000000" floodOpacity={0.6} />
        </filter>
        <filter id="tmSealGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={30} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* shockwave rings on seal */}
      {shock > 0 && shock < 1 && (
        <g>
          <circle cx={cx} cy={CARD_CY} r={110 + shock * 420} fill="none" stroke={GOLD} strokeWidth={10 * (1 - shock)} opacity={0.85 * (1 - shock)} />
          <circle cx={cx} cy={CARD_CY} r={110 + shock * 260} fill="none" stroke={PURPLE} strokeWidth={6 * (1 - shock)} opacity={0.6 * (1 - shock)} />
        </g>
      )}
      <g transform={`translate(0,${rise})`}>
        <rect x={x} y={y} width={520} height={420} rx={36} fill="url(#tmCardBg)"
          stroke={sealed ? GOLD : PURPLE} strokeWidth={sealed ? 6 : 4} filter="url(#tmCardShadow)" />
        <rect x={x + 18} y={y + 18} width={484} height={384} rx={26} fill="none" stroke="rgba(192,132,252,0.35)" strokeWidth={2} />
        {/* abstract geometric wordmark */}
        <g opacity={0.98}>
          <circle cx={cx - 130} cy={CARD_CY - 60} r={86} fill="none" stroke={PURPLE} strokeWidth={14} />
          <polygon points={`${cx - 130},${CARD_CY - 122} ${cx - 130 + 92},${CARD_CY + 14} ${cx - 130 - 92},${CARD_CY + 14}`}
            fill={GOLD} opacity={0.92} />
          <circle cx={cx - 130} cy={CARD_CY - 60} r={26} fill={BG} />
          <circle cx={cx - 130} cy={CARD_CY - 60} r={12} fill={GOLD} />
        </g>
        <text x={cx + 40} y={CARD_CY - 34} fill={INK} fontSize={72} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
          LUMEN
        </text>
        <text x={cx + 40} y={CARD_CY + 44} fill={MUTED} fontSize={44} fontFamily={FONT} letterSpacing={10}>
          &amp; CO.
        </text>
        <text x={cx + 196} y={CARD_CY - 88} fill={sealed ? GOLD : FAINT} fontSize={54} fontFamily={FONT} fontWeight={700}>
          {sealed ? '®' : '™'}
        </text>
        <text x={cx} y={CARD_CY + 150} fill={FAINT} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={4}>
          WORDMARK · APPLICANT CARD
        </text>
        {/* ® seal stamp */}
        {sealS > 0.001 && (
          <g transform={`translate(${cx},${CARD_CY - 20}) scale(${0.4 + 0.6 * Math.min(1, sealS)}) rotate(${(1 - Math.min(1, sealS)) * -18})`}
            opacity={Math.min(1, sealS)} filter="url(#tmSealGlow)">
            <circle r={118} fill="url(#tmSealG)" />
            <circle r={118} fill="none" stroke="#8A5A00" strokeWidth={6} />
            <circle r={92} fill="none" stroke="#8A5A00" strokeWidth={3} strokeDasharray="10 8" />
            <text y={44} fill="#5C3A00" fontSize={128} fontFamily={FONT} fontWeight={900} textAnchor="middle">®</text>
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Gate 1: magnifier scan + registry-search counters
// ---------------------------------------------------------------------------
const SearchScan_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const win = interpolate(frame, [140, 280], [0, 1], clamp01);
  const out = interpolate(frame, [330, 400], [1, 0], clamp01);
  const vis = win * out;
  if (vis <= 0) return null;
  const cx = cardX(frame);
  const mx = cx + interpolate(frame, [140, 280], [-180, 180], clamp01);
  const searched = Math.floor(interpolate(frame, [140, 280], [0, 1204318], clamp01));
  const done = frame >= 280;
  return (
    <g opacity={vis}>
      {/* scan beam across the card */}
      <rect x={mx - 26} y={CARD_CY - 210} width={52} height={420} fill="rgba(192,132,252,0.22)" />
      {/* magnifier */}
      <g transform={`translate(${mx},${CARD_CY - 60})`}>
        <circle r={96} fill="rgba(192,132,252,0.10)" stroke={PURPLE} strokeWidth={10} />
        <circle r={96} fill="none" stroke={PURPLE} strokeWidth={3} opacity={0.5} />
        <line x1={66} y1={66} x2={130} y2={130} stroke={PURPLE} strokeWidth={22} strokeLinecap="round" />
        <circle r={70} fill="none" stroke="rgba(253,230,138,0.5)" strokeWidth={2} strokeDasharray="8 8" />
      </g>
      {/* counters */}
      <g>
        <rect x={cx - 260} y={CARD_CY + 250} width={520} height={118} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
        <text x={cx} y={CARD_CY + 296} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
          MARKS SEARCHED
        </text>
        <text x={cx} y={CARD_CY + 348} fill={INK} fontSize={52} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {searched.toLocaleString('en-US')}
        </text>
        {done && (
          <text x={cx} y={CARD_CY + 420} fill={GREEN} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            ✓ 0 CONFLICTS
          </text>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Gate 2: filing stamps slam in sequence
// ---------------------------------------------------------------------------
const STAMPS_tm = [
  {t: 'SUBMITTED', f: 320, col: '#C084FC', dx: -150, dy: 90},
  {t: 'CLASS 09', f: 362, col: '#FDE68A', dx: 0, dy: 130},
  {t: 'FEE PAID', f: 404, col: '#34D399', dx: 150, dy: 90},
];
const FilingStamps_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const win = interpolate(frame, [300, 430], [0, 1], clamp01);
  if (win <= 0) return null;
  const cx = cardX(frame);
  return (
    <g opacity={win}>
      {STAMPS_tm.map((st) => {
        const s = spring({frame: frame - st.f, fps, config: {damping: 150, stiffness: 170}});
        if (s <= 0.001) return null;
        return (
          <g key={st.t} transform={`translate(${cx + st.dx},${CARD_CY + st.dy}) rotate(${(1 - Math.min(1, s)) * -14}) scale(${0.5 + 0.5 * Math.min(1, s)})`} opacity={Math.min(1, s)}>
            <rect x={-118} y={-42} width={236} height={84} rx={12} fill="none" stroke={st.col} strokeWidth={9} />
            <text y={16} fill={st.col} fontSize={40} fontFamily={MONO} fontWeight={900} textAnchor="middle" letterSpacing={3}>
              {st.t}
            </text>
          </g>
        );
      })}
      <text x={cx} y={CARD_CY + 330} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={4}>
        APPLICATION FILED · USPTO QUEUE #4821
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Gate 3: examination checklist panel above the gate
// ---------------------------------------------------------------------------
const EXAM_ITEMS_tm = [
  {t: 'DISTINCTIVENESS', f: 490},
  {t: 'NO LIKELIHOOD OF CONFUSION', f: 520},
  {t: 'CORRECT CLASS SPECIFIED', f: 550},
  {t: 'SPECIMEN OF USE VALID', f: 580},
];
const ExamChecklist_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const win = interpolate(frame, [470, 600], [0, 1], clamp01);
  const out = interpolate(frame, [640, 690], [1, 0], clamp01);
  const vis = win * out;
  if (vis <= 0) return null;
  const gx = GATE_X[2];
  return (
    <g opacity={vis}>
      <rect x={gx - 330} y={300} width={660} height={560} rx={28} fill={PANEL} stroke={PURPLE} strokeWidth={4} />
      <text x={gx} y={368} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={3}>
        EXAMINER REVIEW
      </text>
      <line x1={gx - 300} y1={392} x2={gx + 300} y2={392} stroke={HAIRLINE} strokeWidth={2} />
      {EXAM_ITEMS_tm.map((it, i) => {
        const on = frame >= it.f;
        const yy = 460 + i * 100;
        return (
          <g key={it.t} opacity={on ? 1 : 0.35}>
            <rect x={gx - 286} y={yy - 34} width={68} height={68} rx={14} fill="none"
              stroke={on ? GREEN : FAINT} strokeWidth={5} />
            {on && (
              <path d={`M ${gx - 270} ${yy} l 18 18 l 34 -40`} fill="none" stroke={GREEN} strokeWidth={10}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            <text x={gx - 196} y={yy + 12} fill={on ? INK : MUTED} fontSize={29} fontFamily={MONO} letterSpacing={2}>
              {it.t}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Gate 4: publication banner unfurls; opposition countdown
// ---------------------------------------------------------------------------
const PublicationBanner_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const win = interpolate(frame, [600, 740], [0, 1], clamp01);
  if (win <= 0) return null;
  const gx = GATE_X[3];
  const unfurl = spring({frame: frame - 610, fps, config: {damping: 200, stiffness: 80}});
  const days = Math.ceil(interpolate(frame, [620, 740], [30, 0], clamp01));
  const clear = frame >= 748;
  const h = 210 * Math.min(1, unfurl);
  return (
    <g opacity={win}>
      <rect x={gx - 360} y={1330} width={720} height={h} rx={24} fill={PANEL} stroke={GOLD} strokeWidth={4} />
      {unfurl > 0.5 && (
        <g opacity={interpolate(unfurl, [0.5, 1], [0, 1], clamp01)}>
          <text x={gx} y={1402} fill={GOLD} fontSize={36} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={3}>
            PUBLISHED IN GAZETTE
          </text>
          <text x={gx} y={1456} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
            OPPOSITION PERIOD · {clear ? 'CLOSED' : `${days} DAYS LEFT`}
          </text>
          {/* countdown bar */}
          <rect x={gx - 300} y={1482} width={600} height={14} rx={7} fill="rgba(247,242,232,0.12)" />
          <rect x={gx - 300} y={1482} width={600 * interpolate(frame, [620, 740], [1, 0], clamp01)} height={14} rx={7} fill={GOLD} />
          {clear && (
            <text x={gx} y={1528} fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
              ✓ NO OBJECTIONS FILED
            </text>
          )}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Finale: renewal ticks orbit the sealed badge + payoff
// ---------------------------------------------------------------------------
const RenewalRing_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const bx = cardX(900);
  const by = CARD_CY - 20;
  const rot = (frame - 800) * 0.008;
  return (
    <g opacity={Math.min(1, s)}>
      {Array.from({length: 24}, (_, i) => {
        const a = (i / 24) * Math.PI * 2 + rot;
        const r = 205;
        const tx = bx + Math.cos(a) * r;
        const ty = by + Math.sin(a) * r;
        const on = frame >= 800 + i * 3;
        const tw = on ? 0.9 : 0.25;
        return (
          <g key={i} transform={`translate(${tx},${ty}) rotate(${(a * 180) / Math.PI + 90})`}>
            <rect x={-5} y={-22} width={10} height={on ? 44 : 26} rx={5}
              fill={on ? GOLD : FAINT} opacity={tw} />
          </g>
        );
      })}
      <text x={bx} y={CARD_CY + 300} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={4}>
        RENEWABLE EVERY 10 YEARS
      </text>
      <text x={bx} y={CARD_CY + 348} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
        RIGHTS LAST IN PERPETUITY
      </text>
    </g>
  );
};

const Payoff_tm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 830, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 830) * 0.1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '34px 110px', background: 'rgba(24,16,38,0.95)',
        border: `3px solid ${GOLD}`, textAlign: 'center',
        boxShadow: `0 0 ${50 + pulse * 50}px rgba(253,230,138,0.35)`,
      }}>
        <div style={{color: GOLD, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 1}}>
          TRADEMARK REGISTERED
        </div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 10}}>
          Your brand, legally yours — <span style={{color: PURPLE}}>search to seal in four gates</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TrademarkRegistrationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_tm frame={frame} />
      <AmbientParticles_tm frame={frame} />
      <Title_tm frame={frame} fps={fps} />
      <Gates_tm frame={frame} fps={fps} />
      <LogoCard_tm frame={frame} fps={fps} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <SearchScan_tm frame={frame} fps={fps} />
        <FilingStamps_tm frame={frame} fps={fps} />
        <ExamChecklist_tm frame={frame} fps={fps} />
        <PublicationBanner_tm frame={frame} fps={fps} />
        <RenewalRing_tm frame={frame} fps={fps} />
      </svg>
      <Payoff_tm frame={frame} fps={fps} />
      <TickerTape_tm frame={frame} />
      <CornerHud_tm frame={frame} />
      <FineDither_tm frame={frame} />
      <FilmGrain_tm frame={frame} />
    </AbsoluteFill>
  );
};
