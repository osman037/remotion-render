/**
 * ProcurementApprovalCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The procurement approval cycle: a requisition card travels a glowing
 * pipeline through five stages — requester, manager approval, supplier,
 * goods receipt, finance payment — then the loop closes and a cost-saving
 * counter ticks up. Deterministic.
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
// Palette (dark steel blue / amber)
// ---------------------------------------------------------------------------
const BG = '#0A0F1A';
const INK = '#EEF4FC';
const MUTED = 'rgba(238,244,252,0.62)';
const FAINT = 'rgba(238,244,252,0.32)';
const BLUE = '#38BDF8';
const AMBER = '#FBBF24';
const GREEN = '#34D399';
const PANEL = 'rgba(11,16,28,0.94)';
const HAIRLINE = 'rgba(238,244,252,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: proc
// ---------------------------------------------------------------------------
const Background_proc: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#9FD6FA" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 28%, rgba(56,189,248,0.13), rgba(251,191,36,0.04) 46%, rgba(10,15,26,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#procVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(56,189,248,0.045)" />
        <defs>
          <radialGradient id="procVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(10,15,26,0)" />
            <stop offset="100%" stopColor="rgba(3,5,11,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_proc: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`proc-amb-x-${i}`) * 3840;
    const by = random(`proc-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`proc-amb-s-${i}`) * 1.4;
    const ang = random(`proc-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`proc-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? BLUE : i % 4 === 1 ? AMBER : 'rgba(238,244,252,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_proc: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`proc-dth-x-${i}`) * 3840;
    const by = random(`proc-dth-y-${i}`) * 2160;
    const jx = (random(`proc-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`proc-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`proc-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`proc-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#9FD6FA" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_proc = [
  'REQ-2041 IN TRANSIT',
  'APPROVAL SLA 4 HOURS',
  'PO-8842 ISSUED',
  '3-WAY MATCH OK',
  'DOCK 7 RECEIVING',
  'PAYMENT RELEASED $48,200',
  'SAVINGS +$12,400',
  'CYCLE TIME 6 DAYS',
];
const TickerTape_proc: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_proc.join('   \u25C6   ') + '   \u25C6   ';
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
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(4,6,12,0.66)', borderBottom: '1px solid rgba(238,244,252,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_proc: React.FC<{frame: number}> = ({frame}) => {
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
            <circle cx={0} cy={0} r={6} fill={BLUE} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? BLUE : 'rgba(238,244,252,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? BLUE : 'rgba(238,244,252,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_proc: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`proc-grain-x-${frame}-${i}`) * 3840;
    const y = random(`proc-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`proc-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`proc-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Pipeline model: 5 stages. Packet moves node to node. Deterministic.
// ---------------------------------------------------------------------------
const STAGES_proc = ['REQUESTER', 'MANAGER', 'SUPPLIER', 'GOODS RECEIPT', 'FINANCE'];
const PIPE_Y = 1050;
const NX = (i: number) => 420 + i * 750; // 420, 1170, 1920, 2670, 3420

// packet x as a function of frame: staged travel with dwell at each node
const packetX = (frame: number): number => {
  if (frame < 150) return NX(0);
  if (frame < 310) return interpolate(frame, [150, 310], [NX(0), NX(1)], clamp01);
  if (frame < 380) return NX(1);
  if (frame < 500) return interpolate(frame, [380, 500], [NX(1), NX(2)], clamp01);
  if (frame < 560) return NX(2);
  if (frame < 680) return interpolate(frame, [560, 680], [NX(2), NX(3)], clamp01);
  if (frame < 730) return NX(3);
  if (frame < 850) return interpolate(frame, [730, 850], [NX(3), NX(4)], clamp01);
  return NX(4);
};

// node status: 0 pending, 1 active, 2 done — from packet progress
const nodeStatus = (frame: number, i: number): number => {
  const arrived = [150, 310, 500, 680, 850][i];
  const left = [150, 380, 560, 730, 899][i];
  if (frame >= left) return 2;
  if (frame >= arrived - 20) return 1;
  return 0;
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_proc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        PROCUREMENT APPROVAL CYCLE
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        requisition to payment &middot; 5 stages &middot; one glowing pipeline
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage node icon (pure SVG primitives)
// ---------------------------------------------------------------------------
const NodeIcon_proc: React.FC<{i: number; x: number; y: number; status: number}> = ({i, x, y, status}) => {
  const col = status === 2 ? GREEN : status === 1 ? AMBER : FAINT;
  const glow = status === 2 ? 'rgba(52,211,153,0.55)' : status === 1 ? 'rgba(251,191,36,0.55)' : 'rgba(238,244,252,0.15)';
  let glyph: React.ReactElement | null = null;
  if (i === 0) {
    glyph = (
      <g>
        <circle cx={x} cy={y - 26} r={30} fill={col} opacity={0.9} />
        <path d={`M ${x - 52} ${y + 52} A 56 44 0 0 1 ${x + 52} ${y + 52} Z`} fill={col} opacity={0.9} />
      </g>
    );
  } else if (i === 1) {
    glyph = (
      <g>
        <rect x={x - 44} y={y - 40} width={88} height={80} rx={10} fill="none" stroke={col} strokeWidth={8} />
        <path d={`M ${x - 26} ${y + 6} L ${x - 8} ${y + 24} L ${x + 30} ${y - 16}`} fill="none" stroke={col} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={x - 10} y={y - 66} width={20} height={30} fill={col} />
      </g>
    );
  } else if (i === 2) {
    glyph = (
      <g>
        <rect x={x - 48} y={y - 30} width={96} height={76} rx={6} fill="none" stroke={col} strokeWidth={8} />
        <line x1={x - 48} y1={y - 6} x2={x + 48} y2={y - 6} stroke={col} strokeWidth={8} />
        <line x1={x} y1={y - 30} x2={x} y2={y + 46} stroke={col} strokeWidth={8} />
      </g>
    );
  } else if (i === 3) {
    glyph = (
      <g>
        <rect x={x - 44} y={y - 48} width={88} height={104} rx={10} fill="none" stroke={col} strokeWidth={8} />
        <rect x={x - 24} y={y - 70} width={48} height={30} rx={6} fill={col} />
        <path d={`M ${x - 24} ${y + 2} L ${x - 10} ${y + 16} L ${x + 26} ${y - 14}`} fill="none" stroke={col} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={x - 24} y1={y + 30} x2={x + 24} y2={y + 30} stroke={col} strokeWidth={6} strokeLinecap="round" />
      </g>
    );
  } else {
    glyph = (
      <g>
        <circle cx={x} cy={y} r={52} fill="none" stroke={col} strokeWidth={9} />
        <text x={x} y={y + 30} fill={col} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
      </g>
    );
  }
  return (
    <g>
      <circle cx={x} cy={y} r={118} fill={PANEL} stroke={col} strokeWidth={6}
        style={{filter: `drop-shadow(0 0 26px ${glow})`}} />
      {glyph}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Main pipeline: track, flow dashes, nodes, traveling packet
// ---------------------------------------------------------------------------
const Pipeline_proc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [90, 160], [0, 1], clamp01);
  if (fade <= 0) return null;
  const px = packetX(frame);
  const nodes: React.ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const st = nodeStatus(frame, i);
    nodes.push(
      <g key={i}>
        <NodeIcon_proc i={i} x={NX(i)} y={PIPE_Y} status={st} />
        <text x={NX(i)} y={PIPE_Y + 210} fill={st === 0 ? FAINT : st === 1 ? AMBER : GREEN} fontSize={32} fontFamily={MONO} fontWeight={800} letterSpacing={3} textAnchor="middle">
          {STAGES_proc[i]}
        </text>
        <text x={NX(i)} y={PIPE_Y + 258} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
          {st === 2 ? 'COMPLETE' : st === 1 ? 'IN PROGRESS' : 'QUEUED'}
        </text>
      </g>
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      <defs>
        <linearGradient id="procFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={AMBER} />
        </linearGradient>
      </defs>
      {/* base track */}
      <line x1={NX(0)} y1={PIPE_Y} x2={NX(4)} y2={PIPE_Y} stroke={HAIRLINE} strokeWidth={14} strokeLinecap="round" />
      {/* completed glow up to packet */}
      {px > NX(0) && (
        <line x1={NX(0)} y1={PIPE_Y} x2={px} y2={PIPE_Y} stroke="url(#procFlow)" strokeWidth={14} strokeLinecap="round"
          style={{filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.7))'}} />
      )}
      {/* flowing dashes */}
      <line x1={NX(0)} y1={PIPE_Y} x2={NX(4)} y2={PIPE_Y} stroke="rgba(56,189,248,0.55)" strokeWidth={4}
        strokeDasharray="28 34" strokeDashoffset={-frame * 2.2} />
      {nodes}
      {/* traveling requisition packet */}
      {frame >= 130 && frame < 880 && (
        <g transform={`translate(${px},${PIPE_Y - 230})`}>
          <rect x={-120} y={-70} width={240} height={140} rx={20} fill={PANEL} stroke={BLUE} strokeWidth={5}
            style={{filter: 'drop-shadow(0 0 26px rgba(56,189,248,0.7))'}} />
          <text x={0} y={-12} fill={BLUE} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle">REQ-2041</text>
          <text x={0} y={36} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">$48,200</text>
          <line x1={0} y1={70} x2={0} y2={104} stroke={BLUE} strokeWidth={5} />
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Manager APPROVED stamp
// ---------------------------------------------------------------------------
const ApproveStamp_proc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 340, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: NX(1) - 260, top: 560, width: 520, opacity: Math.min(1, s),
      transform: `rotate(-10deg) scale(${0.55 + 0.45 * s})`,
    }}>
      <div style={{
        borderRadius: 20, padding: '22px 30px', textAlign: 'center',
        background: 'rgba(52,211,153,0.10)', border: '5px solid rgba(52,211,153,0.95)',
        boxShadow: '0 0 60px rgba(52,211,153,0.45)',
      }}>
        <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 76, letterSpacing: 5}}>APPROVED</div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 30, marginTop: 4}}>MGR SIGN-OFF &middot; 3.2 HRS</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Supplier PO card
// ---------------------------------------------------------------------------
const PoCard_proc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 510, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: NX(2) - 270, top: 1380, width: 540, opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 24, background: PANEL, border: `2px solid ${AMBER}`, padding: '28px 40px',
        boxShadow: '0 0 44px rgba(251,191,36,0.30)',
      }}>
        <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 44}}>PO-8842 ISSUED</div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, marginTop: 8}}>240 UNITS &middot; NET-30 TERMS</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Goods receipt dock checklist
// ---------------------------------------------------------------------------
const DockCheck_proc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 660, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const rows = [
    {label: 'QTY VERIFIED', at: 680},
    {label: 'QUALITY PASS', at: 712},
    {label: 'DOCK 7 SCANNED', at: 744},
  ];
  return (
    <div style={{
      position: 'absolute', left: NX(3) - 280, top: 460, width: 560, opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 24, background: PANEL, border: `2px solid ${BLUE}`, padding: '28px 40px',
        boxShadow: '0 0 44px rgba(56,189,248,0.30)',
      }}>
        <div style={{color: BLUE, fontFamily: MONO, fontWeight: 800, fontSize: 36, letterSpacing: 3}}>GOODS RECEIPT</div>
        <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12}}>
          {rows.map((r) => {
            const on = interpolate(frame, [r.at, r.at + 24], [0, 1], clamp01);
            return (
              <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: 0.35 + 0.65 * on}}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: on > 0.5 ? GREEN : 'transparent',
                  border: `3px solid ${on > 0.5 ? GREEN : FAINT}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#04120B', fontSize: 28, fontWeight: 800,
                }}>
                  {on > 0.5 ? '\u2713' : ''}
                </div>
                <div style={{color: on > 0.5 ? INK : MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>{r.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Finance payment pulse
// ---------------------------------------------------------------------------
const PayPulse_proc: React.FC<{frame: number; fps: number}> = ({frame}) => {
  const fade = interpolate(frame, [780, 820], [0, 1], clamp01);
  if (fade <= 0) return null;
  const pulses: React.ReactElement[] = [];
  for (let k = 0; k < 4; k++) {
    const p = interpolate(frame, [790 + k * 60, 790 + k * 60 + 110], [0, 1], clamp01);
    if (p > 0 && p < 1) {
      pulses.push(
        <circle key={k} cx={NX(4)} cy={PIPE_Y} r={130 + p * 420} fill="none" stroke={AMBER}
          strokeWidth={12 * (1 - p) + 2} opacity={(1 - p) * fade} />
      );
    }
  }
  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
        {pulses}
      </svg>
      <div style={{
        position: 'absolute', left: NX(4) - 300, top: 1380, width: 600, opacity: fade, textAlign: 'center',
      }}>
        <div style={{
          borderRadius: 24, background: PANEL, border: `2px solid ${AMBER}`, padding: '28px 40px',
          boxShadow: '0 0 44px rgba(251,191,36,0.35)',
        }}>
          <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>$48,200</div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, marginTop: 8, letterSpacing: 2}}>PAYMENT RELEASED</div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Closed loop + cost-saving counter payoff
// ---------------------------------------------------------------------------
const ClosedLoop_proc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const draw = interpolate(frame, [800, 870], [0, 1], clamp01);
  const saved = Math.round(interpolate(frame, [800, 890], [0, 12400], clamp01));
  const savedStr = saved.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}} opacity={Math.min(1, s)}>
        <path d={`M ${NX(4)} ${PIPE_Y - 150} C ${NX(4) - 400} 220, ${NX(0) + 400} 220, ${NX(0)} ${PIPE_Y - 150}`}
          fill="none" stroke={GREEN} strokeWidth={7}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}
          style={{filter: 'drop-shadow(0 0 16px rgba(52,211,153,0.7))'}} />
        <text x={1920} y={300} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={5} textAnchor="middle" opacity={draw}>
          LOOP CLOSED &middot; REQ ARCHIVED
        </text>
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center',
        opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
      }}>
        <div style={{
          borderRadius: 30, padding: '34px 100px', background: 'rgba(8,16,12,0.95)',
          border: `3px solid ${GREEN}`, textAlign: 'center',
          boxShadow: '0 0 60px rgba(52,211,153,0.40)',
        }}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>COST SAVINGS THIS QUARTER</div>
          <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 96, marginTop: 6}}>+${savedStr}</div>
          <div style={{color: INK, fontFamily: MONO, fontSize: 32, marginTop: 8}}>VS. MANUAL PROCESSING BASELINE</div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ProcurementApprovalCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_proc frame={frame} />
      <AmbientParticles_proc frame={frame} />
      <Title_proc frame={frame} fps={fps} />
      <Pipeline_proc frame={frame} fps={fps} />
      <ApproveStamp_proc frame={frame} fps={fps} />
      <PoCard_proc frame={frame} fps={fps} />
      <DockCheck_proc frame={frame} fps={fps} />
      <PayPulse_proc frame={frame} fps={fps} />
      <ClosedLoop_proc frame={frame} fps={fps} />
      <TickerTape_proc frame={frame} />
      <CornerHud_proc frame={frame} />
      <FineDither_proc frame={frame} />
      <FilmGrain_proc frame={frame} />
    </AbsoluteFill>
  );
};
