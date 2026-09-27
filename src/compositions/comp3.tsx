/**
 * TelehealthVisitJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A virtual care journey in five stages: phone booking -> calendar fills ->
 * waiting room with a live queue counter -> video consult connects (doctor
 * avatar + waveform + timer) -> Rx slip flies to the pharmacy pin.
 * Checkmarks land on a progress rail as each stage completes.
 *
 * Register in Root.tsx:
 *   <Composition id="TelehealthVisitJourney" component={TelehealthVisitJourney}
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
// Palette (teal / sky clinical on deep navy)
// ---------------------------------------------------------------------------
const BG = '#060B14';
const INK = '#EAF2FB';
const MUTED = 'rgba(180,198,216,0.62)';
const TEAL = '#2DD4BF';
const TEAL_DEEP = '#0E7C6E';
const SKY = '#60A5FA';
const MINT = '#6EE7B7';
const LIVE_RED = '#F87171';
const SLATE = '#14202E';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const CARD_Y = 560;
const CARD_H = 980;
const CARD_W = 640;
const STAGE_X = [240, 920, 1600, 2280, 2960];
const CHECK_AT = [200, 330, 480, 640, 780];
const RAIL_Y = 430;
const BANNER_AT = 800;
const STATS_START = 820;

const nodeX = (j: number) => STAGE_X[j] + CARD_W / 2; // 560,1240,1920,2600,3280

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="36%" r="72%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.09)" />
      <stop offset="50%" stopColor="rgba(96,165,250,0.05)" />
      <stop offset="100%" stopColor="rgba(6,11,20,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(6,11,20,0)" />
      <stop offset="100%" stopColor="rgba(2,4,9,0.74)" />
    </radialGradient>
    <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#5EEAD4" />
      <stop offset="100%" stopColor={TEAL_DEEP} />
    </linearGradient>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(96,165,250,0.16)" />
      <stop offset="100%" stopColor="rgba(96,165,250,0.03)" />
    </linearGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bigBlur" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="28" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepX = ((frame / 900) * (3840 + 600)) % (3840 + 600) - 300;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 36%, rgba(45,212,191,0.09), rgba(96,165,250,0.05) 50%, rgba(6,11,20,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {/* faint plus-sign medical texture */}
        <g opacity={fade * 0.5}>
          {Array.from({length: 40}).map((_, i) => {
            const gx = 200 + (i % 10) * 380;
            const gy = 300 + Math.floor(i / 10) * 480;
            return (
              <g key={`pl${i}`} transform={`translate(${gx}, ${gy})`} opacity={0.5}>
                <rect x={-4} y={-22} width={8} height={44} rx={4} fill="rgba(45,212,191,0.10)" />
                <rect x={-22} y={-4} width={44} height={8} rx={4} fill="rgba(45,212,191,0.10)" />
              </g>
            );
          })}
        </g>
        <circle cx={1920} cy={1000} r={700} fill="rgba(45,212,191,0.05)" filter="url(#bigBlur)" opacity={fade} />
        <rect x={sweepX - 110} y={0} width={220} height={2160} fill="rgba(45,212,191,0.02)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 50], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 84 + rise, left: 220, right: 220, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
            <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 82, letterSpacing: -1}}>
              TELEHEALTH VISIT
            </span>
            <span
              style={{
                color: TEAL,
                fontFamily: MONO,
                fontSize: 36,
                fontWeight: 700,
                border: `2px solid ${TEAL}`,
                borderRadius: 10,
                padding: '6px 18px',
              }}
            >
              VIRTUAL CARE JOURNEY
            </span>
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
            Book &middot; wait your turn &middot; consult by video &middot; prescription sent to pharmacy
          </div>
        </div>
        <div
          style={{
            color: SKY,
            fontFamily: MONO,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 2,
            border: `2px solid rgba(96,165,250,0.55)`,
            borderRadius: 14,
            padding: '12px 26px',
            background: 'rgba(96,165,250,0.10)',
          }}
        >
          SECURE &middot; ENCRYPTED
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress rail with stage nodes + landing checkmarks
// ---------------------------------------------------------------------------
const Rail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [40, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const draw = interpolate(frame, [60, 780], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const x0 = 240;
  const x1 = 3600;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <line x1={x0} y1={RAIL_Y} x2={x1} y2={RAIL_Y} stroke="rgba(180,198,216,0.18)" strokeWidth={6} strokeLinecap="round" />
        <line
          x1={x0}
          y1={RAIL_Y}
          x2={x1}
          y2={RAIL_Y}
          stroke={TEAL}
          strokeWidth={6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={{filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.7))'}}
        />
        {CHECK_AT.map((at, j) => {
          const done = frame >= at;
          const pop = spring({frame: frame - at, fps, config: {damping: 200, stiffness: 170}});
          return (
            <g key={`nd${j}`}>
              <circle
                cx={nodeX(j)}
                cy={RAIL_Y}
                r={36}
                fill={done ? TEAL : '#0A1220'}
                stroke={TEAL}
                strokeWidth={4}
                style={done ? {filter: 'drop-shadow(0 0 16px rgba(45,212,191,0.8))'} : undefined}
              />
              {done && pop > 0.001 && (
                <g opacity={Math.min(1, pop)} transform={`translate(${nodeX(j)}, ${RAIL_Y}) scale(${0.5 + 0.5 * pop})`}>
                  <path d="M -14 1 L -4 12 L 15 -13" fill="none" stroke="#06231F" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {!done && (
                <text x={nodeX(j)} y={RAIL_Y + 11} fill={TEAL} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                  {j + 1}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage card shell
// ---------------------------------------------------------------------------
interface StageCardProps {
  frame: number;
  fps: number;
  x: number;
  index: number;
  step: string;
  title: string;
  statusText: string;
  statusAt: number;
  children: React.ReactNode;
}
const StageCard: React.FC<StageCardProps> = ({frame, fps, x, index, step, title, statusText, statusAt, children}) => {
  const s = spring({frame: frame - (60 + index * 40), fps, config: {damping: 200, stiffness: 95}});
  if (s <= 0.001) return null;
  const stFade = interpolate(frame, [statusAt, statusAt + 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ck = spring({frame: frame - statusAt, fps, config: {damping: 200, stiffness: 170}});

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: CARD_Y + (1 - s) * 70,
        width: CARD_W,
        height: CARD_H,
        opacity: Math.min(1, s),
      }}
    >
      <svg width={CARD_W} height={CARD_H} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={3} y={3} width={CARD_W - 6} height={CARD_H - 6} rx={30} fill="rgba(10,16,30,0.92)" stroke="rgba(45,212,191,0.28)" strokeWidth={2.5} />
        <rect x={3} y={3} width={CARD_W - 6} height={CARD_H - 6} rx={30} fill="url(#skyGrad)" />
        <text x={56} y={78} fill={TEAL} fontSize={28} fontFamily={MONO} letterSpacing={4} fontWeight={700}>
          {step}
        </text>
        <text x={56} y={136} fill={INK} fontSize={46} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
          {title}
        </text>
        <line x1={56} y1={176} x2={CARD_W - 56} y2={176} stroke="rgba(180,198,216,0.16)" strokeWidth={1.5} />
        {children}
        {/* status footer */}
        <line x1={56} y1={856} x2={CARD_W - 56} y2={856} stroke="rgba(180,198,216,0.16)" strokeWidth={1.5} />
        <g opacity={stFade}>
          <text x={56} y={912} fill={TEAL} fontSize={30} fontFamily={MONO} fontWeight={700} letterSpacing={1}>
            {statusText}
          </text>
        </g>
        {ck > 0.001 && (
          <g opacity={Math.min(1, ck)} transform={`translate(${CARD_W - 86}, 896) scale(${0.5 + 0.5 * ck})`}>
            <circle r={30} fill={TEAL} style={{filter: 'drop-shadow(0 0 14px rgba(45,212,191,0.8))'}} />
            <path d="M -12 1 L -4 10 L 13 -11" fill="none" stroke="#06231F" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 1: phone booking
// ---------------------------------------------------------------------------
const BookContent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const tap = interpolate(frame, [140, 175], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slotPop = spring({frame: frame - 150, fps, config: {damping: 200, stiffness: 160}});
  const slots = ['10:30', '11:15', '14:00'];
  return (
    <g>
      {/* phone */}
      <rect x={210} y={220} width={220} height={400} rx={38} fill="#0D1626" stroke="rgba(45,212,191,0.5)" strokeWidth={3} />
      <rect x={228} y={272} width={184} height={296} rx={14} fill="rgba(45,212,191,0.08)" />
      <rect x={286} y={232} width={68} height={12} rx={6} fill="rgba(180,198,216,0.35)" />
      {/* screen: mini calendar + time */}
      <rect x={258} y={300} width={124} height={96} rx={12} fill="none" stroke={TEAL} strokeWidth={3} />
      <line x1={258} y1={328} x2={382} y2={328} stroke={TEAL} strokeWidth={3} />
      <text x={320} y={380} fill={INK} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        14
      </text>
      <text x={320} y={446} fill={TEAL} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        10:30 AM
      </text>
      <text x={320} y={492} fill={MUTED} fontSize={24} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
        VIDEO VISIT
      </text>
      {/* tap ripple */}
      {tap > 0 && tap < 1 && (
        <circle cx={320} cy={420} r={20 + tap * 90} fill="none" stroke={TEAL} strokeWidth={5 * (1 - tap) + 1} opacity={(1 - tap) * 0.9} />
      )}
      {/* slot chips */}
      {slots.map((sl, i) => {
        const sel = i === 0;
        const px = 56 + i * 184;
        return (
          <g key={`slot${i}`} opacity={slotPop > 0.001 ? Math.min(1, slotPop) : 0} transform={`translate(0, ${(1 - Math.min(1, slotPop)) * 24})`}>
            <rect
              x={px}
              y={660}
              width={160}
              height={64}
              rx={16}
              fill={sel ? TEAL : 'rgba(45,212,191,0.07)'}
              stroke={TEAL}
              strokeWidth={sel ? 0 : 2.5}
              style={sel ? {filter: 'drop-shadow(0 0 16px rgba(45,212,191,0.7))'} : undefined}
            />
            <text
              x={px + 80}
              y={702}
              fill={sel ? '#06231F' : TEAL}
              fontSize={32}
              fontFamily={MONO}
              fontWeight={800}
              textAnchor="middle"
            >
              {sl}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: calendar fills
// ---------------------------------------------------------------------------
const CalendarContent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const gridFade = interpolate(frame, [160, 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bookPop = spring({frame: frame - 260, fps, config: {damping: 200, stiffness: 140}});
  const cols = 7;
  const cellW = 72;
  const cellH = 60;
  const gap = 6;
  const gx = 47;
  const gy = 280;
  const booked = 14; // day number
  const busyDays = [3, 9, 21];
  const cells: {d: number; x: number; y: number}[] = [];
  for (let d = 1; d <= 28; d++) {
    const c = (d - 1) % cols;
    const r = Math.floor((d - 1) / cols);
    cells.push({d, x: gx + c * (cellW + gap), y: gy + r * (cellH + gap)});
  }
  const detailFade = interpolate(frame, [280, 320], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <g opacity={gridFade}>
      <text x={56} y={252} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={3}>
        OCTOBER 2026
      </text>
      {cells.map((cell) => {
        const isBooked = cell.d === booked;
        return (
          <g key={`day${cell.d}`}>
            <rect
              x={cell.x}
              y={cell.y}
              width={cellW}
              height={cellH}
              rx={10}
              fill={isBooked ? TEAL : 'rgba(180,198,216,0.06)'}
              style={isBooked ? {filter: 'drop-shadow(0 0 14px rgba(45,212,191,0.7))'} : undefined}
            />
            <text
              x={cell.x + cellW / 2}
              y={cell.y + 40}
              fill={isBooked ? '#06231F' : 'rgba(180,198,216,0.7)'}
              fontSize={28}
              fontFamily={MONO}
              fontWeight={isBooked ? 800 : 400}
              textAnchor="middle"
            >
              {cell.d}
            </text>
            {busyDays.includes(cell.d) && !isBooked && (
              <circle cx={cell.x + cellW / 2} cy={cell.y + cellH - 10} r={5} fill={SKY} opacity={0.8} />
            )}
            {isBooked && bookPop > 0.001 && (
              <circle
                cx={cell.x + cellW / 2}
                cy={cell.y + cellH / 2}
                r={30 + (1 - Math.min(1, bookPop)) * 40}
                fill="none"
                stroke={TEAL}
                strokeWidth={4}
                opacity={Math.min(1, bookPop)}
              />
            )}
          </g>
        );
      })}
      {/* appointment detail */}
      <g opacity={detailFade}>
        <rect x={56} y={560} width={528} height={190} rx={18} fill="rgba(45,212,191,0.08)" stroke="rgba(45,212,191,0.4)" strokeWidth={2} />
        <text x={88} y={622} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={800}>
          TUE, OCT 14 &middot; 10:30 AM
        </text>
        <text x={88} y={668} fill={TEAL} fontSize={30} fontFamily={MONO} fontWeight={700}>
          VIDEO VISIT
        </text>
        <text x={88} y={712} fill={MUTED} fontSize={28} fontFamily={FONT}>
          Dr. Amara &middot; General Medicine
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: waiting room queue counter
// ---------------------------------------------------------------------------
const WaitingContent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const stepIdx = Math.max(0, Math.min(4, Math.floor((frame - 280) / 45)));
  const value = frame < 280 ? 5 : 5 - stepIdx;
  const changeFrame = 280 + stepIdx * 45;
  const pop = spring({frame: frame - changeFrame, fps, config: {damping: 200, stiffness: 200}});
  const waitMin = Math.max(0, Math.round(interpolate(frame, [280, 460], [4, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  const next = frame >= 470;

  const Person: React.FC<{cx: number; active: boolean; you: boolean}> = ({cx, active, you}) => (
    <g opacity={active ? 1 : 0.28}>
      <circle cx={cx} cy={640} r={26} fill={active ? TEAL : 'rgba(180,198,216,0.5)'} />
      <path
        d={`M ${cx - 40} 716 Q ${cx - 40} 672 ${cx} 672 Q ${cx + 40} 672 ${cx + 40} 716 Z`}
        fill={active ? TEAL : 'rgba(180,198,216,0.5)'}
      />
      {you && <circle cx={cx} cy={688} r={62} fill="none" stroke={MINT} strokeWidth={4} strokeDasharray="10 8" />}
    </g>
  );

  return (
    <g>
      <text x={320} y={268} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        POSITION IN LINE
      </text>
      <g transform={`translate(320, 430) scale(${0.7 + 0.3 * Math.min(1, pop)})`} opacity={Math.min(1, Math.max(0.2, pop))}>
        <text x={0} y={70} fill={TEAL} fontSize={220} fontFamily={MONO} fontWeight={800} textAnchor="middle" style={{filter: 'drop-shadow(0 0 30px rgba(45,212,191,0.5))'}}>
          {value}
        </text>
      </g>
      {/* queue avatars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Person key={`p${i}`} cx={100 + i * 110} active={i < value} you={i === 4} />
      ))}
      <text x={320} y={792} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
        {next ? '' : `EST. WAIT ${waitMin} MIN`}
      </text>
      {next && (
        <text x={320} y={792} fill={MINT} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle" style={{filter: 'drop-shadow(0 0 18px rgba(110,231,183,0.6))'}}>
          YOU&apos;RE NEXT
        </text>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage 4: video consult
// ---------------------------------------------------------------------------
const ConsultContent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const connecting = frame >= 480 && frame < 560;
  const live = frame >= 560;
  const winPop = spring({frame: frame - 560, fps, config: {damping: 200, stiffness: 100}});
  const totalSec = Math.max(0, frame - 560);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.15);

  return (
    <g>
      {frame < 480 && (
        <g opacity={0.55}>
          <rect x={40} y={220} width={560} height={400} rx={24} fill="rgba(180,198,216,0.05)" stroke="rgba(180,198,216,0.25)" strokeWidth={2.5} strokeDasharray="14 12" />
          <circle cx={320} cy={380} r={52} fill="none" stroke={MUTED} strokeWidth={4} />
          <path d="M 292 352 L 348 380 L 292 408 Z" fill={MUTED} />
          <text x={320} y={500} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
            SCHEDULED &middot; 10:30 AM
          </text>
        </g>
      )}
      {connecting && (
        <g>
          <text x={320} y={420} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
            CONNECTING
          </text>
          {[0, 1, 2].map((i) => (
            <circle
              key={`cd${i}`}
              cx={272 + i * 48}
              cy={480}
              r={14}
              fill={TEAL}
              opacity={0.3 + 0.7 * Math.abs(Math.sin(frame * 0.2 + i * 1.1))}
            />
          ))}
        </g>
      )}
      {live && winPop > 0.001 && (
        <g opacity={Math.min(1, winPop)} transform={`translate(320, 480) scale(${0.7 + 0.3 * winPop}) translate(-320, -480)`}>
          {/* video window */}
          <rect x={40} y={220} width={560} height={400} rx={24} fill="#0A1226" stroke={TEAL} strokeWidth={3} style={{filter: 'drop-shadow(0 0 26px rgba(45,212,191,0.4))'}} />
          {/* doctor avatar */}
          <circle cx={320} cy={380} r={72} fill="url(#tealGrad)" opacity={0.28} />
          <circle cx={320} cy={362} r={44} fill={TEAL} opacity={0.9} />
          <path d="M 248 470 Q 250 410 320 410 Q 390 410 392 470 Z" fill={TEAL} opacity={0.9} />
          <rect x={304} y={404} width={32} height={52} rx={8} fill="#0A1226" opacity={0.55} />
          {/* name tag */}
          <text x={320} y={540} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            Dr. Amara
          </text>
          <text x={320} y={578} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
            GENERAL MEDICINE
          </text>
          {/* LIVE badge */}
          <g transform="translate(96, 262)">
            <circle r={12} fill={LIVE_RED} opacity={0.4 + pulse * 0.6} />
            <circle r={12} fill="none" stroke={LIVE_RED} strokeWidth={3} opacity={0.8} />
            <text x={26} y={10} fill={LIVE_RED} fontSize={28} fontFamily={MONO} fontWeight={800} letterSpacing={2}>
              LIVE
            </text>
          </g>
          {/* waveform */}
          <g>
            {Array.from({length: 26}).map((_, i) => {
              const h = 14 + 44 * Math.abs(Math.sin(frame * 0.22 + i * 0.65));
              const bx = 70 + i * 19.5;
              return <rect key={`wv${i}`} x={bx} y={660 - h / 2} width={10} height={h} rx={5} fill={i % 3 === 0 ? SKY : TEAL} opacity={0.85} />;
            })}
          </g>
          {/* timer */}
          <text x={320} y={736} fill={INK} fontSize={46} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            {mm}:{ss}
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage 5: pharmacy + flying Rx slip
// ---------------------------------------------------------------------------
const RX_START = {x: 2600, y: 1180};
const RX_END = {x: 3280, y: 1250};
const RX_LAUNCH = 680;
const RX_DUR = 80;

const PharmacyContent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const pinPop = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 100}});
  const pathFade = interpolate(frame, [640, 680], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const landed = frame >= RX_LAUNCH + RX_DUR;
  const landPop = spring({frame: frame - (RX_LAUNCH + RX_DUR), fps, config: {damping: 200, stiffness: 150}});
  const ringPulse = 0.5 + 0.5 * Math.sin(frame * 0.1);

  return (
    <g>
      {/* dotted flight path */}
      <path
        d="M 20 620 Q 170 420 320 690"
        fill="none"
        stroke={TEAL}
        strokeWidth={4}
        strokeDasharray="12 14"
        opacity={pathFade * 0.5}
      />
      {/* pharmacy pin */}
      {pinPop > 0.001 && (
        <g opacity={Math.min(1, pinPop)} transform={`translate(320, 320) scale(${0.6 + 0.4 * pinPop})`}>
          {landed && (
            <circle r={86 + ringPulse * 26} fill="none" stroke={TEAL} strokeWidth={5} opacity={0.35 + ringPulse * 0.3} />
          )}
          <path
            d="M 0 78 C -52 30 -72 2 -72 -30 A 72 72 0 1 1 72 -30 C 72 2 52 30 0 78 Z"
            fill="url(#tealGrad)"
            style={{filter: 'drop-shadow(0 0 26px rgba(45,212,191,0.7))'}}
          />
          <rect x={-14} y={-62} width={28} height={64} rx={6} fill="#06231F" />
          <rect x={-32} y={-44} width={64} height={28} rx={6} fill="#06231F" />
        </g>
      )}
      <text x={320} y={500} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        CITY PHARMACY
      </text>
      <text x={320} y={542} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
        0.8 MI &middot; OPEN TILL 10 PM
      </text>
      {/* landed confirmation */}
      {landed && landPop > 0.001 && (
        <g opacity={Math.min(1, landPop)}>
          <rect x={190} y={798} width={260} height={54} rx={27} fill="rgba(110,231,183,0.12)" stroke={MINT} strokeWidth={3} />
          <text x={320} y={834} fill={MINT} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            READY FOR PICKUP
          </text>
        </g>
      )}
    </g>
  );
};

// Rx slip flight (absolute coordinates, drawn above cards)
const RxFlight: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const appear = spring({frame: frame - 640, fps, config: {damping: 200, stiffness: 140}});
  if (appear <= 0.001) return null;
  const t = Math.min(1, Math.max(0, (frame - RX_LAUNCH) / RX_DUR));
  const cxp = (RX_START.x + RX_END.x) / 2;
  const cyp = Math.min(RX_START.y, RX_END.y) - 420;
  const u = 1 - t;
  const px = u * u * RX_START.x + 2 * u * t * cxp + t * t * RX_END.x;
  const py = u * u * RX_START.y + 2 * u * t * cyp + t * t * RX_END.y;
  const rot = Math.sin(t * Math.PI) * 14;
  const landPop = spring({frame: frame - (RX_LAUNCH + RX_DUR), fps, config: {damping: 200, stiffness: 160}});
  const scale = t < 1 ? 0.6 + 0.4 * appear : 0.6 + 0.4 * Math.min(1, landPop);

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      <g transform={`translate(${px}, ${py}) rotate(${rot}) scale(${scale})`}>
        <rect
          x={-150}
          y={-95}
          width={300}
          height={190}
          rx={16}
          fill="#F2F5FA"
          stroke={TEAL}
          strokeWidth={4}
          style={{filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5)) drop-shadow(0 0 22px rgba(45,212,191,0.55))'}}
        />
        <text x={-126} y={-38} fill={TEAL_DEEP} fontSize={46} fontFamily={FONT} fontWeight={800} fontStyle="italic">
          Rx
        </text>
        <line x1={-126} y1={-18} x2={126} y2={-18} stroke="rgba(20,32,46,0.2)" strokeWidth={2} />
        <text x={-126} y={18} fill={SLATE} fontSize={25} fontFamily={MONO} fontWeight={700}>
          ATORVASTATIN 20 MG
        </text>
        <text x={-126} y={52} fill={SLATE} fontSize={22} fontFamily={MONO} opacity={0.75}>
          30 TABLETS &middot; 1 DAILY
        </text>
        <text x={-126} y={82} fill={SLATE} fontSize={22} fontFamily={MONO} opacity={0.6}>
          DR. AMARA
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom banner + stats
// ---------------------------------------------------------------------------
const BottomBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - BANNER_AT, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 1660,
        width: 3840,
        display: 'flex',
        justifyContent: 'center',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 40}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          background: 'linear-gradient(120deg, rgba(45,212,191,0.16), rgba(96,165,250,0.10))',
          border: '2px solid rgba(45,212,191,0.55)',
          borderRadius: 60,
          padding: '22px 64px',
          boxShadow: '0 0 44px rgba(45,212,191,0.35)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: TEAL,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#06231F',
            fontSize: 34,
            fontWeight: 800,
            fontFamily: FONT,
          }}
        >
          ✓
        </div>
        <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: 3}}>
          VISIT COMPLETE
        </span>
      </div>
    </div>
  );
};

const StatsRow: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const totalSec = Math.max(0, frame - 560);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  const cards = [
    {label: 'TIME IN WAITING ROOM', value: '4 MIN', color: TEAL},
    {label: 'CONSULT DURATION', value: `${mm}:${ss}`, color: SKY},
    {label: 'PRESCRIPTION', value: frame >= 780 ? 'Rx SENT' : 'PENDING', color: MINT},
  ];
  const cardW = 860;
  const gap = 60;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startX = (3840 - totalW) / 2;
  const y = 1840;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 3840, height: 2160, pointerEvents: 'none'}}>
      {cards.map((c, k) => {
        const s = spring({
          frame: frame - (STATS_START + k * 24),
          fps,
          config: {damping: 200, stiffness: 95},
        });
        if (s <= 0.001) return null;
        return (
          <div
            key={c.label}
            style={{
              position: 'absolute',
              left: startX + k * (cardW + gap),
              top: y + (1 - s) * 50,
              width: cardW,
              height: 190,
              borderRadius: 26,
              background:
                'linear-gradient(160deg, rgba(45,212,191,0.09), rgba(96,165,250,0.05) 60%, rgba(255,255,255,0.02))',
              border: '1.5px solid rgba(45,212,191,0.30)',
              padding: '28px 48px',
              opacity: Math.min(1, s),
            }}
          >
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>{c.label}</div>
            <div
              style={{
                color: c.color,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 72,
                lineHeight: 1.2,
                marginTop: 8,
                textShadow: `0 0 26px ${c.color}55`,
              }}
            >
              {c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [840, 880], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(180,198,216,0.5)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Illustrative telehealth journey &middot; sample clinical data shown
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TelehealthVisitJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const stages = [
    {step: 'STEP 01', title: 'BOOK VISIT', statusText: 'APPOINTMENT CONFIRMED', statusAt: CHECK_AT[0], content: <BookContent frame={frame} fps={fps} />},
    {step: 'STEP 02', title: 'SCHEDULE', statusText: 'ADDED TO CALENDAR', statusAt: CHECK_AT[1], content: <CalendarContent frame={frame} fps={fps} />},
    {step: 'STEP 03', title: 'WAITING ROOM', statusText: 'DOCTOR IS READY', statusAt: CHECK_AT[2], content: <WaitingContent frame={frame} fps={fps} />},
    {step: 'STEP 04', title: 'VIDEO CONSULT', statusText: 'CONSULT IN PROGRESS', statusAt: CHECK_AT[3], content: <ConsultContent frame={frame} fps={fps} />},
    {step: 'STEP 05', title: 'PHARMACY', statusText: 'Rx SENT TO PHARMACY', statusAt: CHECK_AT[4], content: <PharmacyContent frame={frame} fps={fps} />},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Rail frame={frame} fps={fps} />
      {stages.map((st, j) => (
        <StageCard key={`stage${j}`} frame={frame} fps={fps} x={STAGE_X[j]} index={j} step={st.step} title={st.title} statusText={st.statusText} statusAt={st.statusAt}>
          {st.content}
        </StageCard>
      ))}
      <RxFlight frame={frame} fps={fps} />
      <BottomBanner frame={frame} fps={fps} />
      <StatsRow frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default TelehealthVisitJourney;
