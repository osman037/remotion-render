/**
 * PetInsuranceClaimFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A pet insurance claim, end to end: vet invoice + paw icon -> deductible
 * highlighted on the policy card -> invoice scan-uploads -> claim form fills ->
 * reimbursement math animates -> refund flows into the owner's wallet ->
 * coverage renews. Deterministic.
 * (Pet insurance claim journey only — never a human health claim.)
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
// Palette (warm coral/gold on dark plum)
// ---------------------------------------------------------------------------
const BG = '#170F16';
const INK = '#FFF7ED';
const MUTED = 'rgba(255,247,237,0.62)';
const FAINT = 'rgba(255,247,237,0.32)';
const CORAL = '#FB7185';
const GOLD = '#FCD34D';
const GREEN = '#34D399';
const PANEL = 'rgba(32,18,28,0.94)';
const HAIRLINE = 'rgba(255,247,237,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: pet
// ---------------------------------------------------------------------------
const Background_pet: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#F9B4C0" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(251,113,133,0.12), rgba(251,113,133,0.03) 46%, rgba(23,15,22,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#petVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(251,113,133,0.045)" />
        <defs>
          <radialGradient id="petVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(23,15,22,0)" />
            <stop offset="100%" stopColor="rgba(8,5,8,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_pet: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`pet-amb-x-${i}`) * 3840;
    const by = random(`pet-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`pet-amb-s-${i}`) * 1.4;
    const ang = random(`pet-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`pet-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CORAL : i % 4 === 1 ? GOLD : 'rgba(255,247,237,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_pet: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`pet-dth-x-${i}`) * 3840;
    const by = random(`pet-dth-y-${i}`) * 2160;
    const jx = (random(`pet-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`pet-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`pet-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`pet-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#FDD3D8" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_pet = [
  'VET BILL $1,400',
  'DEDUCTIBLE $250',
  '90% COVERED',
  'REIMBURSEMENT $1,035',
  'CLAIM APPROVED',
  'COVERAGE RENEWED',
  'PAW PROTECTION PLAN',
  'CLAIM FILED IN 48H',
];
const TickerTape_pet: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_pet.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(251,113,133,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(14,8,12,0.66)', borderBottom: '1px solid rgba(255,247,237,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_pet: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(251,113,133,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={CORAL} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? CORAL : 'rgba(255,247,237,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? CORAL : 'rgba(255,247,237,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_pet: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`pet-grain-x-${frame}-${i}`) * 3840;
    const y = random(`pet-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pet-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`pet-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Claim model: deterministic data
// ---------------------------------------------------------------------------
const LINES_pet = [
  {label: 'WELLNESS EXAM', amount: 85},
  {label: 'X-RAY — FRONT LEG', amount: 240},
  {label: 'PAIN MEDICATION', amount: 120},
  {label: 'SOFT-TISSUE SURGERY', amount: 955},
];
const TOTAL_pet = 1400;
const DEDUCTIBLE_pet = 250;
const COVERAGE_pet = 0.9;
const ELIGIBLE_pet = TOTAL_pet - DEDUCTIBLE_pet;
const PAYOUT_pet = Math.round(ELIGIBLE_pet * COVERAGE_pet);

const fmt$ = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
const typed = (text: string, start: number, frame: number, cps: number) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - start) / cps)));
  return text.slice(0, n);
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_pet: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        PET INSURANCE CLAIM FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        File the vet bill &middot; watch the reimbursement land in your wallet
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Paw icon (pure SVG, deterministic)
// ---------------------------------------------------------------------------
const Paw_pet: React.FC<{size: number; color: string; opacity?: number}> = ({size, color, opacity = 1}) => (
  <svg width={size} height={size} viewBox="-110 -110 220 220" opacity={opacity}>
    <ellipse cx={0} cy={38} rx={58} ry={46} fill={color} />
    <circle cx={-74} cy={-24} r={27} fill={color} />
    <circle cx={-25} cy={-52} r={27} fill={color} />
    <circle cx={25} cy={-52} r={27} fill={color} />
    <circle cx={74} cy={-24} r={27} fill={color} />
  </svg>
);

// ---------------------------------------------------------------------------
// Stage 1: vet invoice card (left) + policy card (right)
// ---------------------------------------------------------------------------
const Invoice_pet: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 70, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const total = TOTAL_pet * interpolate(frame, [260, 340], [0, 1], clamp01);
  // scan beam + upload progress (420 -> 530)
  const beamOn = frame >= 420 && frame <= 540;
  const beamY = interpolate(frame, [420, 530], [480, 1380], clamp01);
  const upload = interpolate(frame, [420, 530], [0, 1], clamp01);
  const badgeOn = frame >= 540;
  return (
    <div style={{
      position: 'absolute', left: 240, top: 480, width: 1450, height: 900,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '52px 64px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>WHISKERS VET CLINIC</div>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 54, marginTop: 8}}>INVOICE #VK-8841</div>
        </div>
        <Paw_pet size={150} color={CORAL} />
      </div>
      <div style={{marginTop: 40, borderTop: `2px solid ${HAIRLINE}`}} />
      {LINES_pet.map((ln, i) => {
        const on = interpolate(frame, [120 + i * 30, 140 + i * 30], [0, 1], clamp01);
        return (
          <div key={ln.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, opacity: on}}>
            <div style={{color: INK, fontFamily: MONO, fontSize: 36}}>{ln.label}</div>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 36}}>{fmt$(ln.amount)}</div>
          </div>
        );
      })}
      <div style={{marginTop: 40, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3}}>TOTAL DUE</div>
        <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 72, textShadow: '0 0 26px rgba(252,211,77,0.45)'}}>
          {fmt$(total)}
        </div>
      </div>
      {/* scan beam */}
      {beamOn && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: beamY - 480 - 26, height: 52,
          background: 'linear-gradient(90deg, rgba(252,211,77,0), rgba(252,211,77,0.55), rgba(252,211,77,0))',
          boxShadow: '0 0 60px rgba(252,211,77,0.6)',
        }} />
      )}
      {/* upload progress */}
      {frame >= 420 && (
        <div style={{position: 'absolute', left: 64, right: 64, bottom: 36}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>
              {badgeOn ? 'DOCUMENTS UPLOADED' : 'UPLOADING CLAIM DOCUMENTS'}
            </div>
            <div style={{color: GOLD, fontFamily: MONO, fontSize: 30, fontWeight: 800}}>{Math.round(upload * 100)}%</div>
          </div>
          <div style={{height: 14, borderRadius: 7, background: 'rgba(255,247,237,0.10)'}}>
            <div style={{width: `${upload * 100}%`, height: 14, borderRadius: 7, background: `linear-gradient(90deg, ${CORAL}, ${GOLD})`, boxShadow: '0 0 18px rgba(252,211,77,0.5)'}} />
          </div>
        </div>
      )}
      {badgeOn && (
        <div style={{
          position: 'absolute', top: 24, right: 40, borderRadius: 40, padding: '10px 34px',
          background: 'rgba(52,211,153,0.14)', border: `2px solid ${GREEN}`,
          color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 28,
        }}>
          ✓ SCANNED
        </div>
      )}
    </div>
  );
};

const PolicyCard_pet: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 240, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.14);
  const rows = [
    {k: 'COVERAGE RATE', v: '90%'},
    {k: 'ANNUAL LIMIT', v: '$15,000'},
    {k: 'PET', v: 'WHISKERS · DOG'},
    {k: 'STATUS', v: 'ACTIVE'},
  ];
  return (
    <div style={{
      position: 'absolute', right: 240, top: 480, width: 1450, height: 900,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '52px 64px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>PAW PROTECTION PLAN</div>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 54, marginTop: 8}}>GOLD TIER POLICY</div>
        </div>
        <div style={{
          width: 150, height: 150, borderRadius: 75, border: `6px solid ${GOLD}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 44,
          boxShadow: '0 0 40px rgba(252,211,77,0.35)',
        }}>
          G
        </div>
      </div>
      <div style={{marginTop: 40, borderTop: `2px solid ${HAIRLINE}`}} />
      {rows.map((r, i) => {
        const on = interpolate(frame, [300 + i * 30, 320 + i * 30], [0, 1], clamp01);
        return (
          <div key={r.k} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 42, opacity: on}}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>{r.k}</div>
            <div style={{color: INK, fontFamily: MONO, fontSize: 40, fontWeight: 800}}>{r.v}</div>
          </div>
        );
      })}
      {/* deductible highlight */}
      <div style={{
        marginTop: 52, borderRadius: 24, padding: '30px 40px',
        border: `3px solid ${CORAL}`, background: 'rgba(251,113,133,0.08)',
        boxShadow: `0 0 ${30 + pulse * 40}px rgba(251,113,133,0.45)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{color: CORAL, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>◈ DEDUCTIBLE MET THIS YEAR</div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 8}}>You pay this first — the plan covers the rest</div>
        </div>
        <div style={{color: CORAL, fontFamily: MONO, fontWeight: 800, fontSize: 84, textShadow: '0 0 30px rgba(251,113,133,0.6)'}}>
          {fmt$(DEDUCTIBLE_pet)}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: claim form (left bottom) + reimbursement math (right bottom)
// ---------------------------------------------------------------------------
const ClaimForm_pet: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 560, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const fields = [
    {k: 'PET NAME', v: 'WHISKERS'},
    {k: 'OWNER', v: 'A. REHMANI'},
    {k: 'INVOICE', v: 'VK-8841'},
    {k: 'CLINIC', v: 'WHISKERS VET CLINIC'},
  ];
  return (
    <div style={{
      position: 'absolute', left: 240, top: 1450, width: 1450, height: 560,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '44px 64px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>CLAIM FORM — AUTO-FILLING</div>
      {fields.map((f, i) => {
        const val = typed(f.v, 590 + i * 55, frame, 1.6);
        const done = val.length >= f.v.length;
        return (
          <div key={f.k} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 44}}>
            <div style={{color: FAINT, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>{f.k}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <div style={{color: INK, fontFamily: MONO, fontSize: 36, fontWeight: 700}}>
                {val}{!done && frame > 590 + i * 55 && <span style={{color: GOLD}}>|</span>}
              </div>
              {done && <div style={{color: GREEN, fontFamily: MONO, fontSize: 34, fontWeight: 800}}>✓</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ReimburseMath_pet: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 620, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const bill = TOTAL_pet * interpolate(frame, [630, 680], [0, 1], clamp01);
  const dedOn = frame >= 690;
  const eligible = ELIGIBLE_pet * interpolate(frame, [700, 740], [0, 1], clamp01);
  const pctOn = frame >= 750;
  const payout = PAYOUT_pet * interpolate(frame, [770, 840], [0, 1], clamp01);
  // wallet stream coins 780 -> 870
  const coins: React.ReactElement[] = [];
  for (let i = 0; i < 14; i++) {
    const start = 780 + i * 6;
    const p = interpolate(frame, [start, start + 70], [0, 1], clamp01);
    if (p <= 0 || p >= 1) continue;
    const cx = interpolate(p, [0, 1], [2330, 3330], clamp01);
    const cy = 1760 - Math.sin(p * Math.PI) * 90;
    coins.push(
      <g key={i} opacity={p}>
        <circle cx={cx} cy={cy} r={26} fill={GOLD} style={{filter: 'drop-shadow(0 0 14px rgba(252,211,77,0.8))'}} />
        <text x={cx} y={cy + 12} fill={BG} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
      </g>
    );
  }
  return (
    <div style={{
      position: 'absolute', right: 240, top: 1450, width: 1450, height: 560,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '44px 64px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>REIMBURSEMENT MATH</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginTop: 40}}>
        <div>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 24}}>VET BILL</div>
          <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 56}}>{fmt$(bill)}</div>
        </div>
        <div style={{color: CORAL, fontFamily: MONO, fontSize: 48, fontWeight: 800, opacity: dedOn ? 1 : 0.25}}>−</div>
        <div style={{opacity: dedOn ? 1 : 0.25}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 24}}>DEDUCTIBLE</div>
          <div style={{color: CORAL, fontFamily: MONO, fontWeight: 800, fontSize: 56}}>{fmt$(DEDUCTIBLE_pet)}</div>
        </div>
        <div style={{color: FAINT, fontFamily: MONO, fontSize: 48, fontWeight: 800, opacity: frame >= 700 ? 1 : 0.25}}>=</div>
        <div style={{opacity: frame >= 700 ? 1 : 0.25}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 24}}>ELIGIBLE</div>
          <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 56}}>{fmt$(eligible)}</div>
        </div>
        <div style={{color: FAINT, fontFamily: MONO, fontSize: 44, fontWeight: 800, opacity: pctOn ? 1 : 0.25}}>×90%</div>
      </div>
      <div style={{marginTop: 44, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>YOU GET BACK</div>
        <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 96, textShadow: '0 0 34px rgba(52,211,153,0.55)'}}>
          {fmt$(payout)}
        </div>
      </div>
      {/* wallet */}
      <div style={{position: 'absolute', right: 64, bottom: 44, display: 'flex', alignItems: 'center', gap: 24}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 2}}>OWNER WALLET</div>
        <svg width={120} height={90} viewBox="0 0 120 90">
          <rect x={6} y={14} width={108} height={70} rx={14} fill={GOLD} opacity={0.9} />
          <rect x={6} y={14} width={108} height={22} rx={11} fill="#B8892B" />
          <circle cx={84} cy={60} r={9} fill={BG} />
        </svg>
      </div>
      <svg width={1450} height={560} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
        {coins}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: coverage renews (payoff)
// ---------------------------------------------------------------------------
const RenewRing_pet: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const fill = interpolate(frame, [810, 890], [0, 1], clamp01);
  const C = 2 * Math.PI * 210;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 810) * 0.12);
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: `rgba(10,5,9,${0.55 * Math.min(1, s)})`, opacity: Math.min(1, s),
    }}>
      <div style={{transform: `scale(${0.85 + 0.15 * s})`, textAlign: 'center'}}>
        <svg width={560} height={560} viewBox="0 0 560 560">
          <defs>
            <linearGradient id="petRingG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={GOLD} />
              <stop offset="100%" stopColor={CORAL} />
            </linearGradient>
          </defs>
          <circle cx={280} cy={280} r={210} fill="none" stroke="rgba(255,247,237,0.12)" strokeWidth={44} />
          <circle cx={280} cy={280} r={210} fill="none" stroke="url(#petRingG)" strokeWidth={44}
            strokeDasharray={C} strokeDashoffset={C * (1 - fill)} transform="rotate(-90 280 280)"
            strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${20 + pulse * 30}px rgba(252,211,77,0.55))`}} />
          <g transform="translate(280,280) scale(1.6)">
            <ellipse cx={0} cy={38} rx={58} ry={46} fill={GOLD} />
            <circle cx={-74} cy={-24} r={27} fill={GOLD} />
            <circle cx={-25} cy={-52} r={27} fill={GOLD} />
            <circle cx={25} cy={-52} r={27} fill={GOLD} />
            <circle cx={74} cy={-24} r={27} fill={GOLD} />
          </g>
        </svg>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 84, marginTop: 30, letterSpacing: 1}}>
          COVERAGE RENEWED
        </div>
        <div style={{color: GOLD, fontFamily: MONO, fontSize: 40, marginTop: 14}}>
          {fmt$(PAYOUT_pet)} reimbursed &middot; WHISKERS is protected for another year
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const PetInsuranceClaimFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_pet frame={frame} />
      <AmbientParticles_pet frame={frame} />
      <Title_pet frame={frame} fps={fps} />
      <Invoice_pet frame={frame} fps={fps} />
      <PolicyCard_pet frame={frame} fps={fps} />
      <ClaimForm_pet frame={frame} fps={fps} />
      <ReimburseMath_pet frame={frame} fps={fps} />
      <RenewRing_pet frame={frame} fps={fps} />
      <TickerTape_pet frame={frame} />
      <CornerHud_pet frame={frame} />
      <FineDither_pet frame={frame} />
      <FilmGrain_pet frame={frame} />
    </AbsoluteFill>
  );
};
