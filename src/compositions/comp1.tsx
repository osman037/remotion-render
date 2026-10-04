/**
 * LLCFormationJourney.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * The six legal steps of forming an LLC, from name search to EIN: a lightbulb
 * idea travels a document rail — name approved, agent attached, articles filed
 * with a state seal, operating agreement signed, EIN issued — and the business
 * badge blooms "OFFICIALLY IN BUSINESS".
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
const BG = '#0A0D16';
const GRID = 'rgba(150,170,205,0.10)';
const INK = '#EDF1F8';
const MUTED = 'rgba(198,210,228,0.60)';
const BLUE = '#6EA8FE';
const GOLD = '#F5C451';
const GREEN = '#34D399';
const PAPER = '#F4EDDA';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// The six steps
// ---------------------------------------------------------------------------
const STEPS = [
  {t: 'CHOOSE A NAME', s: 'Availability search clears "Sunrise Roasting LLC"'},
  {t: 'APPOINT REGISTERED AGENT', s: 'Designated recipient for legal documents'},
  {t: 'FILE ARTICLES OF ORGANIZATION', s: 'State stamps the formation document'},
  {t: 'CREATE OPERATING AGREEMENT', s: 'Ownership rules signed by members'},
  {t: 'GET AN EIN', s: 'IRS issues the federal tax ID'},
  {t: 'OPEN FOR BUSINESS', s: 'Bank account, licenses, first invoice'},
];
const STEP_START = [90, 210, 340, 470, 600, 730];
const STEP_DUR = 120;

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}paper`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FBF7EA" />
      <stop offset="100%" stopColor="#E4D9BC" />
    </linearGradient>
    <linearGradient id={`${p}gold`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFE9A8" />
      <stop offset="50%" stopColor={GOLD} />
      <stop offset="100%" stopColor="#C8932B" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(10,13,22,0)" />
      <stop offset="100%" stopColor="rgba(3,5,10,0.78)" />
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
            'radial-gradient(circle at 62% 34%, rgba(245,196,81,0.09), rgba(245,196,81,0.02) 46%, rgba(10,13,22,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="llc" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#llcvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(245,196,81,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`llc-p-x-${i}`) * 3840;
    const by = random(`llc-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`llc-p-s-${i}`) * 1.0;
    const ang = random(`llc-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 2.1));
    const sz = 2.5 + random(`llc-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GOLD : 'rgba(237,241,248,0.85)'} opacity={tw} />);
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
    const bx = random(`llc-d-x-${i}`) * 3840;
    const by = random(`llc-d-y-${i}`) * 2160;
    const jx = (random(`llc-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`llc-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`llc-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`llc-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E8DCC0" opacity={o} />);
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
    const x = random(`llc-g-x-${frame}-${i}`) * 3840;
    const y = random(`llc-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`llc-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`llc-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'CHOOSE A NAME', 'APPOINT A REGISTERED AGENT', 'FILE ARTICLES OF ORGANIZATION',
  'OPERATING AGREEMENT', 'GET YOUR EIN', 'PROTECT YOUR PERSONAL ASSETS',
  'LIMITED LIABILITY COMPANY', 'OPEN FOR BUSINESS',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(245,196,81,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(245,196,81,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(245,196,81,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3300, y: 2090, t: 'LLC · FORMATION DESK'},
    {x: 60, y: 130, t: 'STEP-BY-STEP FILING'},
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

// ---------------------------------------------------------------------------
// Title + step rail (left)
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        STARTING AN <span style={{color: GOLD}}>LLC</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Six legal steps — from a name on paper to <span style={{color: INK, fontWeight: 700}}>officially in business</span>
      </div>
    </div>
  );
};

const StepRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [50, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const active = STEPS.findIndex((_, i) => frame >= STEP_START[i] && frame < STEP_START[i] + STEP_DUR + 40);
  const prog = interpolate(frame, [STEP_START[0], STEP_START[5] + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 180, top: 460, opacity: fade}}>
      <svg width={1150} height={1250}>
        <line x1={34} y1={30} x2={34} y2={30 + 5 * 190} stroke="rgba(245,196,81,0.25)" strokeWidth={5} />
        <line x1={34} y1={30} x2={34} y2={30 + 5 * 190 * prog} stroke={GOLD} strokeWidth={5} />
        {STEPS.map((s, i) => {
          const done = frame >= STEP_START[i] + STEP_DUR - 30;
          const isActive = i === active;
          const y = 30 + i * 190;
          const col = done ? GREEN : isActive ? GOLD : 'rgba(198,210,228,0.4)';
          return (
            <g key={i}>
              <circle cx={34} cy={y} r={26} fill={done ? GREEN : isActive ? GOLD : 'rgba(10,13,22,0.9)'} stroke={col} strokeWidth={3} filter="url(#llcglow)" />
              {done && (
                <path d="M 22 30 l 8 9 l 15 -17" transform={`translate(0, ${y - 30})`} stroke="#04120B" strokeWidth={6} fill="none" strokeLinecap="round" />
              )}
              {isActive && !done && (
                <circle cx={34} cy={y} r={38} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.5 + 0.4 * Math.sin(frame * 0.15)} />
              )}
              <text x={90} y={y - 8} fill={col} fontSize={38} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
                {i + 1}. {s.t}
              </text>
              <text x={90} y={y + 42} fill={MUTED} fontSize={29} fontFamily={FONT} opacity={isActive ? 1 : 0.75}>
                {s.s}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage (right): per-step document scenes
// ---------------------------------------------------------------------------
const STAGE_X = 1560;
const STAGE_W = 2020;
const STAGE_Y = 560;
const STAGE_H = 1090;

const StageFrame: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [50, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: fade}}>
      <rect x={STAGE_X} y={STAGE_Y} width={STAGE_W} height={STAGE_H} rx={40} fill="rgba(16,21,34,0.72)" stroke="rgba(245,196,81,0.35)" strokeWidth={3} />
      {Array.from({length: 24}, (_, i) => {
        const on = ((frame >> 3) + i) % 24 === 12;
        return <rect key={i} x={STAGE_X + 60 + i * 78} y={STAGE_Y + STAGE_H - 40} width={on ? 34 : 10} height={14} fill={on ? GOLD : 'rgba(245,196,81,0.18)'} rx={7} />;
      })}
    </svg>
  );
};

// Step 1: name search — magnifier sweeps, "AVAILABLE" stamp
const StepName: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - STEP_START[0];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const sweep = interpolate(t, [10, 80], [-200, 700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stamp = spring({frame: t - 85, fps, config: {damping: 14, stiffness: 260}});
  const cx = STAGE_X + STAGE_W / 2;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={cx - 520} y={STAGE_Y + 220} width={1040} height={200} rx={24} fill="url(#llcpaper)" />
      <text x={cx} y={STAGE_Y + 300} fill="#1A2030" fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        Sunrise Roasting LLC
      </text>
      <text x={cx} y={STAGE_Y + 372} fill="rgba(26,32,48,0.6)" fontSize={34} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
        NAME AVAILABILITY SEARCH
      </text>
      <line x1={cx - 520 + sweep} y1={STAGE_Y + 220} x2={cx - 520 + sweep} y2={STAGE_Y + 420} stroke={BLUE} strokeWidth={6} opacity={0.7} />
      {stamp > 0.01 && (
        <g transform={`translate(${cx}, ${STAGE_Y + 560}) rotate(-8) scale(${Math.min(1, stamp)})`} opacity={Math.min(1, stamp)}>
          <rect x={-300} y={-70} width={600} height={140} rx={20} fill="none" stroke={GREEN} strokeWidth={8} />
          <text y={26} fill={GREEN} fontSize={72} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={4}>
            AVAILABLE
          </text>
        </g>
      )}
    </g>
  );
};

// Step 2: registered agent badge attaches
const StepAgent: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - STEP_START[1];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const link = interpolate(t, [30, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cx = STAGE_X + STAGE_W / 2;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={cx - 460} y={STAGE_Y + 180} width={420} height={300} rx={24} fill="rgba(110,168,254,0.10)" stroke={BLUE} strokeWidth={3} />
      <circle cx={cx - 250} cy={STAGE_Y + 300} r={54} fill="none" stroke={BLUE} strokeWidth={5} />
      <circle cx={cx - 250} cy={STAGE_Y + 282} r={20} fill={BLUE} />
      <path d={`M ${cx - 288} ${STAGE_Y + 340} a 38 30 0 0 1 76 0`} fill={BLUE} />
      <text x={cx - 250} y={STAGE_Y + 430} fill={INK} fontSize={34} fontFamily={FONT} fontWeight={700} textAnchor="middle">
        Your LLC
      </text>
      <line x1={cx - 40} y1={STAGE_Y + 330} x2={cx - 40 + 480 * link} y2={STAGE_Y + 330} stroke={GOLD} strokeWidth={6} strokeDasharray="16 12" />
      {link > 0.9 && (
        <g>
          <rect x={cx + 40} y={STAGE_Y + 180} width={420} height={300} rx={24} fill="rgba(245,196,81,0.10)" stroke={GOLD} strokeWidth={3} filter="url(#llcglow)" />
          <text x={cx + 250} y={STAGE_Y + 300} fill={GOLD} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            REGISTERED
          </text>
          <text x={cx + 250} y={STAGE_Y + 352} fill={GOLD} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            AGENT
          </text>
          <text x={cx + 250} y={STAGE_Y + 420} fill={MUTED} fontSize={30} fontFamily={FONT} textAnchor="middle">
            receives legal mail
          </text>
        </g>
      )}
      <text x={cx} y={STAGE_Y + 600} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        A designated person or service — required in every state
      </text>
    </g>
  );
};

// Step 3: articles filed, state seal stamps
const StepFile: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - STEP_START[2];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const seal = spring({frame: t - 70, fps, config: {damping: 12, stiffness: 280}});
  const cx = STAGE_X + STAGE_W / 2;
  return (
    <g opacity={Math.min(1, s)}>
      <g transform={`translate(${cx - 300}, ${STAGE_Y + 130}) rotate(${(1 - Math.min(1, s)) * -6})`}>
        <rect x={0} y={0} width={600} height={760} rx={18} fill="url(#llcpaper)" stroke="rgba(26,32,48,0.25)" strokeWidth={3} />
        <text x={300} y={100} fill="#1A2030" fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          ARTICLES OF
        </text>
        <text x={300} y={160} fill="#1A2030" fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          ORGANIZATION
        </text>
        {[230, 310, 390, 470, 550].map((y) => (
          <rect key={y} x={80} y={y} width={440 - (y % 3) * 60} height={22} rx={11} fill="rgba(26,32,48,0.28)" />
        ))}
      </g>
      {seal > 0.01 && (
        <g transform={`translate(${cx + 260}, ${STAGE_Y + 640}) scale(${Math.min(1.25, seal)})`} opacity={Math.min(1, seal)}>
          <circle r={130} fill="none" stroke={GOLD} strokeWidth={10} />
          <circle r={104} fill="none" stroke={GOLD} strokeWidth={3} />
          <text y={-8} fill={GOLD} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">STATE</text>
          <text y={42} fill={GOLD} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">SEAL</text>
        </g>
      )}
      <text x={cx} y={STAGE_Y + 990} fill={GREEN} fontSize={40} fontFamily={MONO} fontWeight={700} textAnchor="middle" opacity={seal > 0.9 ? 1 : 0}>
        ✓ FILED — YOUR LLC LEGALLY EXISTS
      </text>
    </g>
  );
};

// Step 4: operating agreement signatures
const StepAgreement: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - STEP_START[3];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const cx = STAGE_X + STAGE_W / 2;
  const sigs = [0, 1].map((k) => interpolate(t - (25 + k * 30), [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={cx - 330} y={STAGE_Y + 120} width={660} height={700} rx={18} fill="url(#llcpaper)" />
      <text x={cx} y={STAGE_Y + 220} fill="#1A2030" fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        OPERATING AGREEMENT
      </text>
      {['Ownership split: 60 / 40', 'Voting rights defined', 'Profit distribution rules'].map((row, i) => (
        <g key={i}>
          <circle cx={cx - 250} cy={STAGE_Y + 330 + i * 90} r={18} fill="none" stroke="#1A2030" strokeWidth={4} opacity={sigs[0] > 0.5 || i === 0 ? 1 : 0.3} />
          {i === 0 && sigs[0] > 0.5 && <path d={`M ${cx - 260} ${STAGE_Y + 330} l 8 9 l 16 -18`} stroke={GREEN} strokeWidth={7} fill="none" strokeLinecap="round" />}
          <text x={cx - 210} y={STAGE_Y + 344 + i * 90} fill="#1A2030" fontSize={36} fontFamily={FONT}>
            {row}
          </text>
        </g>
      ))}
      {[0, 1].map((k) => (
        <g key={k} opacity={sigs[k]}>
          <line x1={cx - 260 + k * 330} y1={STAGE_Y + 700} x2={cx - 60 + k * 330} y2={STAGE_Y + 700} stroke="#1A2030" strokeWidth={3} />
          <text x={cx - 160 + k * 330} y={STAGE_Y + 660} fill="#2A4BD7" fontSize={52} fontFamily={FONT} fontStyle="italic" textAnchor="middle"
            style={{fontFamily: "'Brush Script MT', cursive"}}>
            {k === 0 ? 'A. Rivera' : 'J. Chen'}
          </text>
          <text x={cx - 160 + k * 330} y={STAGE_Y + 745} fill="rgba(26,32,48,0.6)" fontSize={28} fontFamily={MONO} textAnchor="middle">
            MEMBER {k + 1}
          </text>
        </g>
      ))}
    </g>
  );
};

// Step 5: EIN card issues
const StepEIN: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - STEP_START[4];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const cx = STAGE_X + STAGE_W / 2;
  const digits = '12-3456789'.split('');
  return (
    <g opacity={Math.min(1, s)}>
      <g transform={`translate(${cx}, ${STAGE_Y + 420}) scale(${0.8 + Math.min(1, s) * 0.2})`}>
        <rect x={-460} y={-190} width={920} height={380} rx={28} fill="#0E2A52" stroke={BLUE} strokeWidth={4} filter="url(#llcglow)" />
        <text x={-400} y={-110} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={5}>
          FEDERAL TAX ID — EIN
        </text>
        <g>
          {digits.map((d, i) => {
            const on = interpolate(t - (20 + i * 8), [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <text key={i} x={-400 + i * 82} y={40} fill={on > 0.5 ? '#FFFFFF' : 'rgba(255,255,255,0.18)'} fontSize={96} fontFamily={MONO} fontWeight={800}>
                {d}
              </text>
            );
          })}
        </g>
        <text x={-400} y={130} fill={MUTED} fontSize={32} fontFamily={FONT}>
          Issued by the IRS — free, in minutes
        </text>
      </g>
    </g>
  );
};

// Step 6: payoff — business badge blooms
const StepOpen: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - STEP_START[5];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 95}});
  if (s <= 0.001) return null;
  const cx = STAGE_X + STAGE_W / 2;
  const cy = STAGE_Y + 430;
  const rays: React.ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + frame * 0.01;
    const r1 = 210;
    const r2 = 210 + 60 * (0.5 + 0.5 * Math.sin(frame * 0.12 + i));
    rays.push(
      <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2} stroke={GOLD} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
    );
  }
  return (
    <g opacity={Math.min(1, s)}>
      {rays}
      <g transform={`translate(${cx}, ${cy}) scale(${0.6 + Math.min(1, s) * 0.4})`}>
        <circle r={200} fill="url(#llcgold)" filter="url(#llcglow)" />
        <circle r={168} fill="none" stroke="#7A5A12" strokeWidth={4} />
        <text y={-14} fill="#3A2C08" fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          OFFICIALLY
        </text>
        <text y={52} fill="#3A2C08" fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          IN BUSINESS
        </text>
      </g>
      <text x={cx} y={STAGE_Y + 800} fill={INK} fontSize={42} fontFamily={FONT} textAnchor="middle">
        Bank account <tspan fill={GOLD}>•</tspan> licenses <tspan fill={GOLD}>•</tspan> first invoice
      </text>
      <text x={cx} y={STAGE_Y + 870} fill={GREEN} fontSize={44} fontFamily={MONO} fontWeight={700} textAnchor="middle">
        Sunrise Roasting LLC — est. today
      </text>
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cur = STEPS.findIndex((_, i) => frame >= STEP_START[i] && (i === 5 || frame < STEP_START[i + 1]));
  const show = cur >= 0 ? cur : -1;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs p="llcs" />
      {show === 0 && <StepName frame={frame} fps={fps} />}
      {show === 1 && <StepAgent frame={frame} fps={fps} />}
      {show === 2 && <StepFile frame={frame} fps={fps} />}
      {show === 3 && <StepAgreement frame={frame} fps={fps} />}
      {show === 4 && <StepEIN frame={frame} fps={fps} />}
      {show === 5 && <StepOpen frame={frame} fps={fps} />}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(150,170,205,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      General information only — rules and fees vary by state. Not legal advice.
    </div>
  );
};

export const LLCFormationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <StepRail frame={frame} fps={fps} />
      <StageFrame frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
