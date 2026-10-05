/**
 * OnlineCourseCreationFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * The creation-to-launch playbook for an online course: an expertise spark
 * ignites into a lightbulb (0-120), the outline branches into module nodes
 * (120-280), lessons fill in with video + quiz icons (280-480), a pricing
 * card and sales page assemble (480-620), launch rocket streaks up (620-740),
 * and first enrollments roll in as avatars while revenue ticks up (740-900).
 * (Creation-to-launch process only — never a platform UI walkthrough.)
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
// Palette
// ---------------------------------------------------------------------------
const BG = '#0C0714';
const GRID = 'rgba(196,181,253,0.10)';
const AXIS = 'rgba(196,181,253,0.5)';
const INK = '#F3EEFF';
const MUTED = 'rgba(205,190,240,0.62)';
const VIOLET = '#A78BFA';
const VIOLET_DEEP = '#7C5CE0';
const CORAL = '#FF7A6B';
const CORAL_SOFT = '#FFB4A2';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}line`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={VIOLET} />
      <stop offset="60%" stopColor={CORAL_SOFT} />
      <stop offset="100%" stopColor={CORAL} />
    </linearGradient>
    <linearGradient id={`${p}area`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CORAL} stopOpacity={0.26} />
      <stop offset="60%" stopColor={VIOLET} stopOpacity={0.06} />
      <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(12,7,20,0)" />
      <stop offset="100%" stopColor="rgba(5,3,10,0.8)" />
    </radialGradient>
    <radialGradient id={`${p}bulbg`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(255,180,162,0.85)" />
      <stop offset="45%" stopColor="rgba(167,139,250,0.35)" />
      <stop offset="100%" stopColor="rgba(167,139,250,0)" />
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
            'radial-gradient(circle at 50% 28%, rgba(255,122,107,0.10), rgba(167,139,250,0.05) 45%, rgba(12,7,20,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="occ" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#occvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(167,139,250,0.03)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`occ-p-x-${i}`) * 3840;
    const by = random(`occ-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`occ-p-s-${i}`) * 1.0;
    const ang = random(`occ-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`occ-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? CORAL : 'rgba(243,238,255,0.85)'} opacity={tw} />);
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
    const bx = random(`occ-d-x-${i}`) * 3840;
    const by = random(`occ-d-y-${i}`) * 2160;
    const jx = (random(`occ-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`occ-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`occ-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`occ-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D8C9F5" opacity={o} />);
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
    const x = random(`occ-g-x-${frame}-${i}`) * 3840;
    const y = random(`occ-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`occ-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`occ-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'EXPERTISE → CURRICULUM', 'FILM ONCE · SELL FOREVER', 'OUTLINE BEFORE YOU RECORD',
  'TEACH WHAT YOU KNOW', 'LAUNCH · ITERATE · GROW', 'YOUR KNOWLEDGE IS THE PRODUCT',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER.length * 680;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 680} y={46} fill="rgba(167,139,250,0.72)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(167,139,250,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(167,139,250,0.22)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3190, y: 2090, t: 'COURSE PLAYBOOK · V1'},
    {x: 60, y: 130, t: 'CREATE · LAUNCH · TEACH'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={CORAL} opacity={0.35 + blink * 0.55} />
          <text x={c.x + 24} y={c.y} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3}>
            {c.t}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        ONLINE COURSE <span style={{color: CORAL}}>CREATION</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Idea → outline → lessons → launch — the <span style={{color: VIOLET, fontWeight: 700}}>creation-to-launch</span> playbook
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene A (0-170): expertise spark ignites the lightbulb
// ---------------------------------------------------------------------------
const Bulb: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame > 175) return null;
  const fade = interpolate(frame, [145, 175], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 5, fps, config: {damping: 200, stiffness: 90}});
  const flash = interpolate(frame, [22, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    * interpolate(frame, [34, 90], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rays: React.ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const ro = 0.2 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.15 + i * 1.1));
    rays.push(
      <line key={i} x1={1920 + Math.cos(a) * 300} y1={1020 + Math.sin(a) * 300}
        x2={1920 + Math.cos(a) * 380} y2={1020 + Math.sin(a) * 380}
        stroke={CORAL} strokeWidth={10} strokeLinecap="round" opacity={ro * Math.min(1, s)} />
    );
  }
  const sparks: React.ReactElement[] = [];
  for (let i = 0; i < 70; i++) {
    const a = random(`occ-sp-a-${i}`) * Math.PI * 2;
    const dist = 120 + random(`occ-sp-d-${i}`) * 620;
    const prog = interpolate(frame, [18, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const x = 1920 + Math.cos(a) * prog * dist;
    const y = 1020 + Math.sin(a) * prog * dist * 0.85 - prog * prog * 160;
    const o = (1 - prog) * (0.4 + random(`occ-sp-o-${i}`) * 0.6);
    const sz = 4 + random(`occ-sp-z-${i}`) * 9;
    sparks.push(<circle key={i} cx={x} cy={y} r={sz} fill={i % 2 === 0 ? CORAL : VIOLET} opacity={o} />);
  }
  const flicker = 0.85 + 0.15 * Math.sin(frame * 0.4);
  return (
    <g opacity={fade}>
      <circle cx={1920} cy={1020} r={520 * flicker} fill="url(#occbulbg)" opacity={0.75 * Math.min(1, s)} />
      {sparks}
      {rays}
      <g opacity={Math.min(1, s)} transform={`translate(1920, 1020) scale(${0.7 + Math.min(1, s) * 0.3})`}>
        <circle r={235} fill="rgba(167,139,250,0.10)" stroke={VIOLET} strokeWidth={7} filter="url(#occglow)" />
        <path d="M -55 40 Q -55 -70 0 -70 Q 55 -70 55 40 Q 55 90 28 105 L -28 105 Q -55 90 -55 40 Z"
          fill="none" stroke={CORAL} strokeWidth={12} strokeLinecap="round" />
        <line x1={0} y1={105} x2={0} y2={150} stroke={CORAL} strokeWidth={12} strokeLinecap="round" />
        <rect x={-95} y={150} width={190} height={46} rx={12} fill={VIOLET_DEEP} />
        <rect x={-95} y={206} width={190} height={46} rx={12} fill={VIOLET_DEEP} opacity={0.75} />
        <rect x={-70} y={262} width={140} height={40} rx={12} fill={VIOLET_DEEP} opacity={0.5} />
      </g>
      <text x={1920} y={1560} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle" opacity={fade}>
        STEP 01 — CAPTURE YOUR EXPERTISE
      </text>
      {flash > 0.01 && <rect x={0} y={0} width={3840} height={2160} fill="#FFFFFF" opacity={flash * 0.35} />}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene B (120-500): outline branches into module nodes, lessons fill in
// ---------------------------------------------------------------------------
const MODULES = [
  {t: 'HOOKS & OUTCOMES', lessons: ['video · the promise', 'quiz · dream outcome']},
  {t: 'FILM & EDIT', lessons: ['video · setup guide', 'video · edit flow', 'quiz · gear check']},
  {t: 'WORKSHEETS', lessons: ['video · templates', 'quiz · practice set']},
  {t: 'ASSESSMENTS', lessons: ['video · quiz design', 'video · feedback loops']},
  {t: 'LAUNCH ASSETS', lessons: ['video · sales page', 'quiz · price test']},
];
const MX = [880, 1400, 1920, 2440, 2960];

const Tree: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 120 || frame > 505) return null;
  const t = frame - 120;
  const fadeIn = interpolate(frame, [120, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [470, 505], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const draw = interpolate(t, [0, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={620} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 02 — OUTLINE → MODULES → LESSONS
      </text>
      {/* spine */}
      <line x1={660} y1={900} x2={3180} y2={900} stroke={VIOLET} strokeWidth={7}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      {MX.map((x, i) => (
        <line key={`b${i}`} x1={x} y1={900} x2={x} y2={760} stroke={VIOLET} strokeWidth={5}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={0.85} />
      ))}
      {MODULES.map((m, i) => {
        const s = spring({frame: t - 60 - i * 34, fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        const sc = Math.max(0.001, Math.min(1, s));
        return (
          <g key={i} opacity={sc} transform={`translate(${MX[i]}, 560) scale(${sc})`}>
            <rect x={-200} y={-70} width={400} height={170} rx={30} fill="#151020" stroke={i % 2 === 0 ? VIOLET : CORAL} strokeWidth={5} filter="url(#occglow)" />
            <text y={-12} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
              MODULE {i + 1}
            </text>
            <text y={44} fill={INK} fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {m.t}
            </text>
            <circle cx={0} cy={150} r={10} fill={CORAL} />
            <line x1={0} y1={160} x2={0} y2={230} stroke={VIOLET} strokeWidth={4} />
          </g>
        );
      })}
      {/* lesson chips fill in (280-480) */}
      {MODULES.map((m, i) =>
        m.lessons.map((l, j) => {
          const s = spring({frame: frame - 285 - (i * 3 + j) * 22, fps, config: {damping: 200, stiffness: 120}});
          if (s <= 0.001) return null;
          const isVideo = l.startsWith('video');
          const x = MX[i];
          const y = 1000 + j * 118;
          return (
            <g key={`${i}-${j}`} opacity={Math.min(1, s)} transform={`translate(${x}, ${y + (1 - Math.min(1, s)) * 40})`}>
              <rect x={-195} y={-42} width={390} height={92} rx={46} fill="rgba(167,139,250,0.10)" stroke={GRID.replace('0.10', '0.5')} strokeWidth={2.5} />
              {isVideo ? (
                <g>
                  <circle cx={-148} cy={4} r={24} fill={CORAL} />
                  <polygon points="-141,-8 -141,16 -123,4" fill="#0C0714" />
                </g>
              ) : (
                <g>
                  <circle cx={-148} cy={4} r={24} fill="none" stroke={VIOLET} strokeWidth={6} />
                  <text x={-148} y={15} fill={VIOLET} fontSize={32} fontFamily={FONT} fontWeight={800} textAnchor="middle">?</text>
                </g>
              )}
              <text x={-108} y={16} fill={INK} fontSize={30} fontFamily={FONT} fontWeight={600}>
                {l}
              </text>
            </g>
          );
        })
      )}
      <text x={1920} y={1620} fill={MUTED} fontSize={34} fontFamily={FONT} textAnchor="middle">
        {MODULES.reduce((n, m) => n + m.lessons.length, 0)} lessons mapped before a single camera rolls
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene C (460-640): pricing card + sales page assemble
// ---------------------------------------------------------------------------
const SalesPage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 460 || frame > 645) return null;
  const fadeIn = interpolate(frame, [460, 490], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [610, 645], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const feats = ['5 core modules', '12 worksheets', 'Quiz bank + answers', 'Lifetime updates', 'Community access'];
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={620} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 03 — PACKAGE & PRICE
      </text>
      {/* sales page wireframe (left) */}
      {(() => {
        const s = spring({frame: frame - 470, fps, config: {damping: 200, stiffness: 95}});
        if (s <= 0.001) return null;
        return (
          <g opacity={Math.min(1, s)} transform={`translate(480, 700) scale(${0.92 + Math.min(1, s) * 0.08})`}>
            <rect x={0} y={0} width={1250} height={1080} rx={36} fill="#100B1C" stroke={VIOLET} strokeWidth={5} />
            <rect x={60} y={60} width={1130} height={220} rx={24} fill="url(#occline)" opacity={0.85} />
            <text x={640} y={190} fill="#0C0714" fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              MASTER THE SKILL
            </text>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={60} y={340 + i * 74} width={1130 - i * 220} height={34} rx={17} fill={GRID.replace('0.10', '0.28')} />
            ))}
            <rect x={60} y={590} width={420} height={110} rx={55} fill={CORAL} filter="url(#occglow)" />
            <text x={270} y={662} fill="#0C0714" fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              ENROLL NOW
            </text>
            {[0, 1, 2].map((i) => {
              const on = interpolate(frame - 500 - i * 30, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={`sb${i}`} opacity={on}>
                  <circle cx={100} cy={800 + i * 90} r={20} fill="none" stroke={CORAL} strokeWidth={7} />
                  <polygon points="92,800 98,810 112,794" transform={`translate(${100 - 100},${800 + i * 90 - (800 + i * 90)})`} fill="none" />
                  <rect x={150} y={786 + i * 90} width={560} height={30} rx={15} fill={GRID.replace('0.10', '0.28')} />
                </g>
              );
            })}
          </g>
        );
      })()}
      {/* pricing card (right) */}
      {(() => {
        const s = spring({frame: frame - 530, fps, config: {damping: 200, stiffness: 95}});
        if (s <= 0.001) return null;
        return (
          <g opacity={Math.min(1, s)} transform={`translate(1990, 700) scale(${0.92 + Math.min(1, s) * 0.08})`}>
            <rect x={0} y={0} width={1370} height={1080} rx={36} fill="#171029" stroke={CORAL} strokeWidth={6} filter="url(#occglow)" />
            <text x={685} y={130} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
              FLAGSHIP COURSE
            </text>
            <text x={685} y={330} fill={INK} fontSize={190} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              $297
            </text>
            <text x={685} y={410} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
              one-time · keep it forever
            </text>
            <line x1={80} y1={470} x2={1290} y2={470} stroke={GRID.replace('0.10', '0.4')} strokeWidth={2} />
            {feats.map((f, i) => {
              const on = interpolate(frame - 545 - i * 22, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (
                <g key={i} opacity={on}>
                  <circle cx={150} cy={545 + i * 96} r={24} fill={CORAL} />
                  <polygon points={`142,${545 + i * 96} 149,${552 + i * 96} 160,${538 + i * 96}`} fill="none" stroke="#0C0714" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                  <text x={200} y={559 + i * 96} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={600}>
                    {f}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene D (600-760): launch rocket streaks up
// ---------------------------------------------------------------------------
const Rocket: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 600 || frame > 765) return null;
  const fadeIn = interpolate(frame, [600, 630], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [735, 765], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ry = interpolate(frame, [620, 745], [2100, 260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flick = 1 + 0.28 * Math.sin(frame * 0.85) + 0.12 * Math.sin(frame * 2.3);
  const trailO = interpolate(frame, [620, 680], [0, 0.75], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const streaks: React.ReactElement[] = [];
  for (let i = 0; i < 26; i++) {
    const sx = 1920 + (random(`occ-rk-x-${i}`) - 0.5) * 900;
    const len = 120 + random(`occ-rk-l-${i}`) * 420;
    const yy = ((random(`occ-rk-y-${i}`) * 2160 + frame * (14 + random(`occ-rk-v-${i}`) * 22)) % 2160);
    streaks.push(
      <line key={i} x1={sx} y1={yy} x2={sx} y2={yy + len} stroke={CORAL} strokeWidth={5 + random(`occ-rk-w-${i}`) * 5} strokeLinecap="round" opacity={0.18 + random(`occ-rk-o-${i}`) * 0.2} />
    );
  }
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={480} fill={CORAL} fontSize={64} fontFamily={FONT} fontWeight={800} letterSpacing={6} textAnchor="middle">
        LAUNCH DAY
      </text>
      {streaks}
      <rect x={1870} y={ry + 330} width={100} height={2160 - ry} fill="url(#occline)" opacity={trailO * 0.5} />
      <g transform={`translate(1920, ${ry})`}>
        <polygon points="-70,330 -150,330 0,560 150,330 70,330" fill={CORAL} opacity={0.9 * flick} transform={`scale(1, ${flick})`} />
        <polygon points="-45,330 -95,330 0,470 95,330 45,330" fill="#FFF3E8" opacity={0.95 * flick} transform={`scale(1, ${flick})`} />
        <polygon points="-150,-40 -260,180 -150,180" fill={VIOLET_DEEP} />
        <polygon points="150,-40 260,180 150,180" fill={VIOLET_DEEP} />
        <rect x={-150} y={-280} width={300} height={620} rx={150} fill="#1B1430" stroke={VIOLET} strokeWidth={7} filter="url(#occglow)" />
        <circle cx={0} cy={-120} r={78} fill="rgba(167,139,250,0.25)" stroke={VIOLET} strokeWidth={7} />
        <circle cx={0} cy={-120} r={40} fill={CORAL_SOFT} opacity={0.9} />
        <rect x={-110} y={120} width={220} height={60} rx={30} fill={CORAL} />
        <text y={165} fill="#0C0714" fontSize={42} fontFamily={MONO} fontWeight={800} textAnchor="middle">GO</text>
      </g>
      <text x={1920} y={1560} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        doors open — your curriculum goes to work
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene E (720-900): first enrollments roll in, revenue ticks up
// ---------------------------------------------------------------------------
const NAMES = ['AR', 'JM', 'SK', 'LT', 'NP', 'DW', 'EH', 'BO', 'CT', 'MF', 'GZ', 'HU', 'IV', 'QJ'];
const Enroll: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 720) return null;
  const fadeIn = interpolate(frame, [720, 750], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rev = interpolate(frame, [745, 890], [0, 12480], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const students = Math.round(interpolate(frame, [745, 890], [0, 87], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.18);
  return (
    <g opacity={fadeIn}>
      <text x={1920} y={600} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 04 — FIRST ENROLLMENTS
      </text>
      <rect x={1320} y={700} width={1200} height={420} rx={40} fill="#100B1C" stroke={CORAL} strokeWidth={5} filter="url(#occglow)" />
      <text x={1920} y={800} fill={MUTED} fontSize={38} fontFamily={MONO} letterSpacing={5} textAnchor="middle">
        REVENUE
      </text>
      <text x={1920} y={990} fill={CORAL} fontSize={150} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        ${Math.round(rev).toLocaleString('en-US')}
      </text>
      <text x={1920} y={1070} fill={VIOLET} fontSize={40} fontFamily={FONT} fontWeight={700} textAnchor="middle">
        {students} students and counting
      </text>
      {/* avatar grid rolling in */}
      {NAMES.map((n, i) => {
        const col = i % 7;
        const rowI = Math.floor(i / 7);
        const tx = 640 + col * 400;
        const ty = 1300 + rowI * 260;
        const s = spring({frame: frame - 750 - i * 12, fps, config: {damping: 200, stiffness: 130}});
        if (s <= 0.001) return null;
        const sc = Math.max(0.001, Math.min(1, s));
        const sx = interpolate(s, [0, 1], [-500, tx], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <g key={i} opacity={sc} transform={`translate(${sx}, ${ty}) scale(${sc})`}>
            <circle r={88} fill={i % 2 === 0 ? 'rgba(167,139,250,0.18)' : 'rgba(255,122,107,0.16)'} stroke={i % 2 === 0 ? VIOLET : CORAL} strokeWidth={4} />
            <text y={20} fill={INK} fontSize={56} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {n}
            </text>
            <circle cx={52} cy={-52} r={22} fill={CORAL} opacity={0.6 + pulse * 0.4} />
            <text x={52} y={-40} fill="#0C0714" fontSize={26} fontFamily={FONT} fontWeight={800} textAnchor="middle">+</text>
          </g>
        );
      })}
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Defs p="occ" />
    <Bulb frame={frame} fps={fps} />
    <Tree frame={frame} fps={fps} />
    <SalesPage frame={frame} fps={fps} />
    <Rocket frame={frame} fps={fps} />
    <Enroll frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(205,190,240,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative course-creation concept — enrollment and revenue figures are illustrative, not a promise.
    </div>
  );
};

export const OnlineCourseCreationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
