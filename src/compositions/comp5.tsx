/**
 * LoyaltyTierProgression.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Loyalty tier climb: a member card hops up a stepped BRONZE -> SILVER ->
 * GOLD ladder while the annual spend bar fills past each threshold, perk
 * icons unlock with checkmarks per tier, and the GOLD tier flares with a
 * radiant payoff at the climax.
 *
 * Register in Root.tsx:
 *   <Composition id="LoyaltyTierProgression" component={LoyaltyTierProgression}
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
// Palette (bronze / silver / gold on deep navy)
// ---------------------------------------------------------------------------
const BG = '#080B1A';
const INK = '#EEF1FA';
const MUTED = 'rgba(190,200,225,0.62)';
const BRONZE = '#E8A75D';
const BRONZE_DEEP = '#8A5A2B';
const SILVER = '#DDE4F2';
const SILVER_DEEP = '#7C8699';
const GOLD = '#F5C044';
const GOLD_DEEP = '#9A6B14';
const VIOLET = '#8B7CF6';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const COL_START = 40;
const CARD_AT = 140;
const HOP1_START = 300;
const HOP1_END = 360;
const HOP2_START = 480;
const HOP2_END = 540;
const SPEND_START = 140;
const SPEND_END = 640;
const FLARE_AT = 640;
const PILL_AT = 660;
const STATS_START = 740;

// ---------------------------------------------------------------------------
// Tier data
// ---------------------------------------------------------------------------
interface Perk {
  label: string;
  icon: 'mult' | 'gift' | 'tag' | 'truck' | 'bolt' | 'clock' | 'crown';
  mult?: string;
}
interface Tier {
  name: string;
  color: string;
  deep: string;
  threshold: string;
  spendAt: number;
  perks: Perk[];
}
const TIERS: Tier[] = [
  {
    name: 'BRONZE',
    color: BRONZE,
    deep: BRONZE_DEEP,
    threshold: 'JOIN FREE',
    spendAt: 0,
    perks: [
      {label: 'EARN 1x POINTS', icon: 'mult', mult: '1x'},
      {label: 'BIRTHDAY REWARD', icon: 'gift'},
      {label: 'MEMBER PRICING', icon: 'tag'},
    ],
  },
  {
    name: 'SILVER',
    color: SILVER,
    deep: SILVER_DEEP,
    threshold: 'SPEND $1,500+ / YEAR',
    spendAt: 1500,
    perks: [
      {label: 'EARN 1.5x POINTS', icon: 'mult', mult: '1.5x'},
      {label: 'FREE SHIPPING', icon: 'truck'},
      {label: 'PRIORITY SUPPORT', icon: 'bolt'},
    ],
  },
  {
    name: 'GOLD',
    color: GOLD,
    deep: GOLD_DEEP,
    threshold: 'SPEND $3,500+ / YEAR',
    spendAt: 3500,
    perks: [
      {label: 'EARN 2x POINTS', icon: 'mult', mult: '2x'},
      {label: 'EARLY ACCESS', icon: 'clock'},
      {label: 'VIP EVENTS', icon: 'crown'},
    ],
  },
];
const UNLOCK_BASE = [180, 400, 580];
const unlockAt = (j: number, k: number) => UNLOCK_BASE[j] + k * 24;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const COL_X = [250, 1330, 2410];
const COL_W = 1080;
const TIER_CARD_W = 600;
const TIER_CARD_H = 440;
const STEP_TOP = [1560, 1210, 860];
const STEP_H = 110;
const tierCardY = (j: number) => STEP_TOP[j] - TIER_CARD_H;

const MC_W = 460;
const MC_H = 280;
const mcRest = (j: number) => ({x: COL_X[j] + 620, y: STEP_TOP[j] - MC_H});

const BAR_X = 400;
const BAR_W = 3040;
const BAR_Y = 1700;
const BAR_MAX = 4000;
const FINAL_SPEND = 3940;

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const money = (n: number) => '$' + fmt(n);

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stopColor="rgba(245,192,68,0.09)" />
      <stop offset="50%" stopColor="rgba(139,124,246,0.05)" />
      <stop offset="100%" stopColor="rgba(8,11,26,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(8,11,26,0)" />
      <stop offset="100%" stopColor="rgba(2,3,8,0.74)" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFD98A" />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor="#D9931F" />
    </linearGradient>
    <linearGradient id="bronzeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F0BE7E" />
      <stop offset="100%" stopColor={BRONZE_DEEP} />
    </linearGradient>
    <linearGradient id="silverGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F2F6FF" />
      <stop offset="100%" stopColor={SILVER_DEEP} />
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={BRONZE} />
      <stop offset="55%" stopColor={SILVER} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#141B3D" />
      <stop offset="100%" stopColor="#0A0E24" />
    </linearGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bigBlur" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="30" />
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
            'radial-gradient(circle at 50% 38%, rgba(245,192,68,0.09), rgba(139,124,246,0.05) 50%, rgba(8,11,26,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <g opacity={fade * 0.5}>
          {Array.from({length: 26}).map((_, i) => (
            <line
              key={`dg${i}`}
              x1={-400 + i * 180}
              y1={2160}
              x2={200 + i * 180}
              y2={0}
              stroke="rgba(190,200,225,0.05)"
              strokeWidth={2}
            />
          ))}
        </g>
        <circle cx={2710} cy={640} r={560} fill="rgba(245,192,68,0.06)" filter="url(#bigBlur)" opacity={fade} />
        <rect x={sweepX - 110} y={0} width={220} height={2160} fill="rgba(245,192,68,0.02)" />
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
              LOYALTY TIERS
            </span>
            <span
              style={{
                color: GOLD,
                fontFamily: MONO,
                fontSize: 36,
                fontWeight: 700,
                border: `2px solid ${GOLD}`,
                borderRadius: 10,
                padding: '6px 18px',
              }}
            >
              TIER PROGRESSION
            </span>
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
            Climb from Bronze to Gold &middot; richer perks unlock at every step
          </div>
        </div>
        <div
          style={{
            color: VIOLET,
            fontFamily: MONO,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 2,
            border: `2px solid rgba(139,124,246,0.55)`,
            borderRadius: 14,
            padding: '12px 26px',
            background: 'rgba(139,124,246,0.10)',
          }}
        >
          MEMBER NO. 2481
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Perk icon glyphs (simple geometric)
// ---------------------------------------------------------------------------
const PerkIcon: React.FC<{icon: Perk['icon']; mult?: string; color: string}> = ({icon, mult, color}) => {
  switch (icon) {
    case 'mult':
      return (
        <text x={0} y={9} fill={color} fontSize={24} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {mult}
        </text>
      );
    case 'gift':
      return (
        <g stroke={color} strokeWidth={4.5} fill="none">
          <rect x={-17} y={-7} width={34} height={26} rx={4} />
          <line x1={0} y1={-7} x2={0} y2={19} />
          <rect x={-21} y={-18} width={42} height={11} rx={3} />
          <path d="M -5 -18 C -14 -30 -2 -32 -2 -20 M 5 -18 C 14 -30 2 -32 2 -20" />
        </g>
      );
    case 'tag':
      return (
        <g>
          <path d="M -16 -12 L 5 -19 L 19 -5 L -2 16 L -19 5 Z" fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />
          <circle cx={2} cy={-3} r={4} fill={color} />
        </g>
      );
    case 'truck':
      return (
        <g stroke={color} strokeWidth={4.5} fill="none">
          <rect x={-23} y={-12} width={30} height={21} rx={3} />
          <path d="M 7 -5 L 21 -5 L 21 9 L 7 9 Z" />
          <circle cx={-12} cy={14} r={5.5} fill={color} stroke="none" />
          <circle cx={12} cy={14} r={5.5} fill={color} stroke="none" />
        </g>
      );
    case 'bolt':
      return <path d="M 5 -21 L -10 3 L -2 3 L -5 21 L 10 -4 L 2 -4 Z" fill={color} />;
    case 'clock':
      return (
        <g stroke={color} strokeWidth={4.5} fill="none">
          <circle r={18} />
          <line x1={0} y1={0} x2={0} y2={-11} strokeLinecap="round" />
          <line x1={0} y1={0} x2={8} y2={4} strokeLinecap="round" />
        </g>
      );
    case 'crown':
      return <path d="M -19 11 L -16 -9 L -6 2 L 0 -12 L 6 2 L 16 -9 L 19 11 Z" fill={color} opacity={0.95} />;
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Tier columns: stepped ladder with perk lists
// ---------------------------------------------------------------------------
const tierReachedAt = (j: number) => [CARD_AT, HOP1_END, HOP2_END][j];

const TierColumns: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {TIERS.map((tier, j) => {
        const s = spring({
          frame: frame - (COL_START + j * 45),
          fps,
          config: {damping: 200, stiffness: 95},
        });
        if (s <= 0.001) return null;
        const x = COL_X[j];
        const y = tierCardY(j);
        const reached = frame >= tierReachedAt(j);
        const gradId = j === 0 ? 'bronzeGrad' : j === 1 ? 'silverGrad' : 'goldGrad';

        return (
          <g key={`tier${j}`} opacity={Math.min(1, s)} transform={`translate(0, ${(1 - s) * 70})`}>
            {/* platform step */}
            <rect
              x={x}
              y={STEP_TOP[j]}
              width={COL_W}
              height={STEP_H}
              rx={20}
              fill={`url(#${gradId})`}
              opacity={0.92}
              style={reached ? {filter: `drop-shadow(0 0 26px ${tier.color}88)`} : undefined}
            />
            <rect x={x + 24} y={STEP_TOP[j] + 12} width={COL_W - 48} height={8} rx={4} fill="rgba(255,255,255,0.32)" />
            <text
              x={x + COL_W / 2}
              y={STEP_TOP[j] + 74}
              fill="rgba(10,14,36,0.72)"
              fontSize={32}
              fontFamily={MONO}
              fontWeight={700}
              letterSpacing={4}
              textAnchor="middle"
            >
              STEP {j + 1} / 3
            </text>
            {/* tier card */}
            <rect
              x={x}
              y={y}
              width={TIER_CARD_W}
              height={TIER_CARD_H}
              rx={28}
              fill="rgba(12,16,36,0.92)"
              stroke={tier.color}
              strokeWidth={reached ? 5 : 2.5}
              opacity={reached ? 1 : 0.78}
              style={reached ? {filter: `drop-shadow(0 0 30px ${tier.color}66)`} : undefined}
            />
            {/* medal */}
            <circle cx={x + 92} cy={y + 92} r={50} fill={`url(#${gradId})`} style={{filter: `drop-shadow(0 0 14px ${tier.color}77)`}} />
            <text x={x + 92} y={y + 110} fill="#0A0E24" fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {tier.name[0]}
            </text>
            {/* name + threshold */}
            <text x={x + 166} y={y + 88} fill={tier.color} fontSize={56} fontFamily={FONT} fontWeight={800} letterSpacing={2}>
              {tier.name}
            </text>
            <text x={x + 166} y={y + 140} fill={MUTED} fontSize={27} fontFamily={MONO} letterSpacing={1}>
              {tier.threshold}
            </text>
            <line x1={x + 48} y1={y + 180} x2={x + TIER_CARD_W - 48} y2={y + 180} stroke="rgba(190,200,225,0.16)" strokeWidth={1.5} />
            {/* perks */}
            {tier.perks.map((pk, k) => {
              const rowY = y + 234 + k * 80;
              const ua = unlockAt(j, k);
              const pop = spring({frame: frame - ua, fps, config: {damping: 200, stiffness: 170}});
              const unlocked = pop > 0.001;
              return (
                <g key={`pk${j}${k}`}>
                  <circle
                    cx={x + 82}
                    cy={rowY}
                    r={30}
                    fill={unlocked ? 'rgba(255,255,255,0.06)' : 'rgba(190,200,225,0.05)'}
                    stroke={unlocked ? tier.color : 'rgba(190,200,225,0.25)'}
                    strokeWidth={3}
                  />
                  <g transform={`translate(${x + 82}, ${rowY})`}>
                    <PerkIcon icon={pk.icon} mult={pk.mult} color={unlocked ? tier.color : 'rgba(190,200,225,0.35)'} />
                  </g>
                  <text
                    x={x + 130}
                    y={rowY + 11}
                    fill={unlocked ? INK : 'rgba(190,200,225,0.42)'}
                    fontSize={31}
                    fontFamily={FONT}
                    fontWeight={700}
                    letterSpacing={1}
                  >
                    {pk.label}
                  </text>
                  {unlocked && (
                    <g opacity={Math.min(1, pop)} transform={`translate(${x + TIER_CARD_W - 66}, ${rowY}) scale(${0.5 + 0.5 * pop})`}>
                      <circle r={24} fill={tier.color} style={{filter: `drop-shadow(0 0 12px ${tier.color})`}} />
                      <path d="M -10 1 L -3 9 L 11 -9" fill="none" stroke="#0A0E24" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Spend progress bar with tier threshold markers
// ---------------------------------------------------------------------------
const SpendBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [100, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spend = interpolate(frame, [SPEND_START, SPEND_END], [0, FINAL_SPEND], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frac = spend / BAR_MAX;
  const xFor = (v: number) => BAR_X + (v / BAR_MAX) * BAR_W;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <text x={BAR_X} y={BAR_Y - 40} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4}>
          ANNUAL SPEND
        </text>
        <text x={BAR_X + BAR_W} y={BAR_Y - 28} fill={GOLD} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="end" style={{filter: 'drop-shadow(0 0 18px rgba(245,192,68,0.5))'}}>
          {money(spend)}
        </text>
        <rect x={BAR_X} y={BAR_Y} width={BAR_W} height={34} rx={17} fill="rgba(190,200,225,0.10)" />
        {frac > 0.001 && (
          <rect
            x={BAR_X}
            y={BAR_Y}
            width={BAR_W * frac}
            height={34}
            rx={17}
            fill="url(#barGrad)"
            style={{filter: 'drop-shadow(0 0 16px rgba(245,192,68,0.55))'}}
          />
        )}
        {frac > 0.001 && (
          <circle cx={xFor(spend)} cy={BAR_Y + 17} r={25} fill={GOLD} opacity={0.9} style={{filter: 'drop-shadow(0 0 18px rgba(245,192,68,0.9))'}} />
        )}
        {TIERS.map((t, j) => {
          const mx = xFor(t.spendAt);
          const passed = spend >= t.spendAt;
          return (
            <g key={`mk${j}`}>
              <line x1={mx} y1={BAR_Y - 14} x2={mx} y2={BAR_Y + 48} stroke={passed ? t.color : 'rgba(190,200,225,0.35)'} strokeWidth={4} />
              <circle cx={mx} cy={BAR_Y - 22} r={13} fill={passed ? t.color : 'rgba(190,200,225,0.25)'} style={passed ? {filter: `drop-shadow(0 0 12px ${t.color})`} : undefined} />
              <text x={mx} y={BAR_Y + 94} fill={passed ? t.color : MUTED} fontSize={29} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle">
                {t.spendAt === 0 ? '$0' : money(t.spendAt)} &middot; {t.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Member card climbing the ladder
// ---------------------------------------------------------------------------
const cardPose = (frame: number) => {
  const b = mcRest(0);
  const sv = mcRest(1);
  const g = mcRest(2);
  const bob = Math.sin(frame * 0.08) * 6;
  if (frame < HOP1_START) return {x: b.x, y: b.y + bob, rot: 0, tier: 0};
  if (frame < HOP1_END) {
    const t = (frame - HOP1_START) / (HOP1_END - HOP1_START);
    return {
      x: b.x + (sv.x - b.x) * t,
      y: b.y + (sv.y - b.y) * t - Math.sin(t * Math.PI) * 280,
      rot: Math.sin(t * Math.PI) * 9,
      tier: 1,
    };
  }
  if (frame < HOP2_START) return {x: sv.x, y: sv.y + bob, rot: 0, tier: 1};
  if (frame < HOP2_END) {
    const t = (frame - HOP2_START) / (HOP2_END - HOP2_START);
    return {
      x: sv.x + (g.x - sv.x) * t,
      y: sv.y + (g.y - sv.y) * t - Math.sin(t * Math.PI) * 280,
      rot: Math.sin(t * Math.PI) * 9,
      tier: 2,
    };
  }
  return {x: g.x, y: g.y + bob, rot: 0, tier: 2};
};

const MemberCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - CARD_AT, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001) return null;
  const p = cardPose(frame);
  const tier = TIERS[p.tier];

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <g
        opacity={Math.min(1, s)}
        transform={`translate(${p.x + MC_W / 2}, ${p.y + MC_H / 2}) rotate(${p.rot}) scale(${0.6 + 0.4 * s}) translate(${-MC_W / 2}, ${-MC_H / 2})`}
      >
        <rect
          x={0}
          y={0}
          width={MC_W}
          height={MC_H}
          rx={26}
          fill="url(#cardGrad)"
          stroke={tier.color}
          strokeWidth={5}
          style={{filter: `drop-shadow(0 16px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 28px ${tier.color}55)`}}
        />
        <rect x={20} y={20} width={MC_W - 40} height={MC_H - 40} rx={18} fill="none" stroke={tier.color} strokeWidth={1.5} opacity={0.5} />
        <text x={38} y={62} fill={MUTED} fontSize={24} fontFamily={MONO} letterSpacing={4}>
          LOYALTY MEMBER
        </text>
        <rect x={38} y={88} width={82} height={62} rx={10} fill="url(#goldGrad)" opacity={0.9} />
        <line x1={38} y1={119} x2={120} y2={119} stroke="#0A0E24" strokeWidth={3} opacity={0.6} />
        <line x1={79} y1={88} x2={79} y2={150} stroke="#0A0E24" strokeWidth={3} opacity={0.6} />
        <text x={38} y={216} fill={tier.color} fontSize={60} fontFamily={FONT} fontWeight={800} letterSpacing={3} style={{filter: `drop-shadow(0 0 14px ${tier.color}66)`}}>
          {tier.name}
        </text>
        <text x={38} y={258} fill={INK} fontSize={30} fontFamily={MONO} fontWeight={700} letterSpacing={1}>
          24,860 PTS
        </text>
        <text x={MC_W - 38} y={258} fill={MUTED} fontSize={24} fontFamily={MONO} letterSpacing={2} textAnchor="end">
          NO. 2481
        </text>
        <circle cx={MC_W - 84} cy={80} r={54} fill="none" stroke={tier.color} strokeWidth={3} opacity={0.35} />
        <circle cx={MC_W - 84} cy={80} r={34} fill="none" stroke={tier.color} strokeWidth={2} opacity={0.25} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Gold flare payoff: flash, rays, shockwaves, achievement pill
// ---------------------------------------------------------------------------
const GoldFlare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const flash = interpolate(frame, [FLARE_AT, FLARE_AT + 45], [0.22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const raysFade = interpolate(frame, [FLARE_AT, FLARE_AT + 30, 850, 890], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const w1 = interpolate(frame, [FLARE_AT, FLARE_AT + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const w2 = interpolate(frame, [FLARE_AT + 22, FLARE_AT + 82], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const pill = spring({frame: frame - PILL_AT, fps, config: {damping: 200, stiffness: 90}});

  // flare centers on the gold tier card
  const cx = COL_X[2] + TIER_CARD_W / 2;
  const cy = tierCardY(2) + TIER_CARD_H / 2;
  const twinkle = (ph: number) => 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.11 + ph));

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      <Defs />
      {raysFade > 0.001 && (
        <g opacity={raysFade * 0.5}>
          {Array.from({length: 16}).map((_, i) => {
            const a = ((i * 360) / 16 + frame * 0.35) * (Math.PI / 180);
            return (
              <line
                key={`ray${i}`}
                x1={cx + Math.cos(a) * 300}
                y1={cy + Math.sin(a) * 300}
                x2={cx + Math.cos(a) * 520}
                y2={cy + Math.sin(a) * 520}
                stroke={GOLD}
                strokeWidth={7}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}
      {w1 < 1 && (
        <circle cx={cx} cy={cy} r={240 + w1 * 460} fill="none" stroke={GOLD} strokeWidth={10 * (1 - w1) + 2} opacity={(1 - w1) * 0.8} style={{filter: 'drop-shadow(0 0 24px rgba(245,192,68,0.8))'}} />
      )}
      {w2 < 1 && (
        <circle cx={cx} cy={cy} r={240 + w2 * 460} fill="none" stroke="#FFE1A0" strokeWidth={6 * (1 - w2) + 2} opacity={(1 - w2) * 0.6} />
      )}
      {frame >= FLARE_AT &&
        [
          {dx: -480, dy: -240, ph: 0},
          {dx: 500, dy: -260, ph: 1.3},
          {dx: 540, dy: 240, ph: 2.5},
          {dx: -540, dy: 220, ph: 3.7},
          {dx: 420, dy: -180, ph: 4.6},
        ].map((sp, i) => (
          <g key={`gsp${i}`} opacity={twinkle(sp.ph)} transform={`translate(${cx + sp.dx}, ${cy + sp.dy})`}>
            <path
              d="M 0 -30 L 8 -8 L 30 0 L 8 8 L 0 30 L -8 8 L -30 0 L -8 -8 Z"
              fill="#FFE1A0"
              style={{filter: 'drop-shadow(0 0 14px rgba(245,192,68,0.9))'}}
            />
          </g>
        ))}
      {/* achievement pill above the gold card */}
      {pill > 0.001 && (
        <g opacity={Math.min(1, pill)} transform={`translate(${cx}, 320) scale(${0.5 + 0.5 * pill})`}>
          <rect x={-400} y={-58} width={800} height={116} rx={58} fill="url(#goldGrad)" style={{filter: 'drop-shadow(0 0 44px rgba(245,192,68,0.85))'}} />
          <text x={0} y={22} fill="#1A1206" fontSize={58} fontFamily={FONT} fontWeight={800} letterSpacing={3} textAnchor="middle">
            GOLD STATUS ACHIEVED
          </text>
        </g>
      )}
      {flash > 0.001 && <rect x={0} y={0} width={3840} height={2160} fill={GOLD} opacity={flash} />}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom stat cards
// ---------------------------------------------------------------------------
const StatsRow: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const points = Math.round(
    interpolate(frame, [200, 700], [0, 48200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  let unlocked = 0;
  TIERS.forEach((t, j) =>
    t.perks.forEach((_, k) => {
      if (frame >= unlockAt(j, k)) unlocked++;
    })
  );
  const tierIdx = frame < HOP1_END ? 0 : frame < HOP2_END ? 1 : 2;
  const tierColor = [BRONZE, SILVER, GOLD][tierIdx];

  const cards = [
    {label: 'POINTS EARNED', value: fmt(points), color: GOLD},
    {label: 'PERKS UNLOCKED', value: `${unlocked}/9`, color: VIOLET},
    {label: 'CURRENT TIER', value: TIERS[tierIdx].name, color: tierColor},
  ];

  const cardW = 860;
  const gap = 60;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startX = (3840 - totalW) / 2;
  const y = 1820;

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
              height: 200,
              borderRadius: 26,
              background:
                'linear-gradient(160deg, rgba(245,192,68,0.09), rgba(139,124,246,0.05) 60%, rgba(255,255,255,0.02))',
              border: '1.5px solid rgba(245,192,68,0.30)',
              padding: '30px 48px',
              opacity: Math.min(1, s),
            }}
          >
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>{c.label}</div>
            <div
              style={{
                color: c.color,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 76,
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
  const fade = interpolate(frame, [800, 850], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 44,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(190,200,225,0.5)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Illustrative loyalty program visualization &middot; sample spend values shown
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const LoyaltyTierProgression: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <TierColumns frame={frame} fps={fps} />
      <SpendBar frame={frame} />
      <GoldFlare frame={frame} fps={fps} />
      <MemberCard frame={frame} fps={fps} />
      <StatsRow frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default LoyaltyTierProgression;
