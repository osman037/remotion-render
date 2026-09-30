/**
 * SupportTicketTriage.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral helpdesk TRIAGE visual for CX trainers, SaaS marketers and
 * support-leadership decks: tickets stream into a live queue, an auto-triage
 * sweep tags each ticket P1-P4, SLA countdown bars drain, tickets are dealt
 * to agent pods with workload meters, and a resolution sweep stamps the queue
 * clear with an SLA attainment payoff. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="SupportTicketTriage" component={SupportTicketTriage}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
// Palette (dark ops console, indigo/violet accent)
// ---------------------------------------------------------------------------
const BG = '#070A14';
const INK = '#EDEFF7';
const MUTED = 'rgba(237,239,247,0.58)';
const INDIGO = '#818CF8';
const VIOLET = '#A78BFA';
const CYAN = '#67E8F9';
const P1 = '#F87171';
const P2 = '#FBBF24';
const P3 = '#60A5FA';
const P4 = '#34D399';
const GREEN = '#34D399';
const PANEL = 'rgba(11,16,30,0.88)';
const HAIRLINE = 'rgba(237,239,247,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const ROW_START = 30;
const ROW_GAP = 16;
const TRIAGE_START = 200;   // priority tagging sweep begins
const TRIAGE_STEP = 52;     // frames per ticket verdict
const DEAL_START = 560;     // deal to agent pods
const RESOLVE_START = 700;  // resolution sweep stamps
const PAYOFF_START = 800;   // final SLA banner

// ---------------------------------------------------------------------------
// Data: 8 tickets
// ---------------------------------------------------------------------------
type Priority = 'P1' | 'P2' | 'P3' | 'P4';
interface Ticket {
  id: string;
  subject: string;
  channel: string;
  priority: Priority;
  slaMin: number;
  agent: string;
}
const TICKETS: Ticket[] = [
  {id: 'T-80421', subject: 'Checkout fails on 3-D Secure redirect', channel: 'CHAT', priority: 'P1', slaMin: 28, agent: 'AMARA'},
  {id: 'T-80417', subject: 'SSO login loop for Okta users', channel: 'EMAIL', priority: 'P1', slaMin: 34, agent: 'DEV'},
  {id: 'T-80432', subject: 'Invoice PDF shows wrong tax rate', channel: 'PORTAL', priority: 'P2', slaMin: 62, agent: 'LENA'},
  {id: 'T-80409', subject: 'Export CSV times out over 50k rows', channel: 'EMAIL', priority: 'P2', slaMin: 71, agent: 'RICO'},
  {id: 'T-80440', subject: 'How to invite a guest workspace', channel: 'CHAT', priority: 'P3', slaMin: 128, agent: 'AMARA'},
  {id: 'T-80436', subject: 'Avatar image not updating', channel: 'PORTAL', priority: 'P3', slaMin: 142, agent: 'LENA'},
  {id: 'T-80445', subject: 'Dark mode toggle request', channel: 'EMAIL', priority: 'P4', slaMin: 240, agent: 'RICO'},
  {id: 'T-80451', subject: 'Typo in onboarding email #3', channel: 'CHAT', priority: 'P4', slaMin: 255, agent: 'DEV'},
];

const PRIORITY_COLOR: Record<Priority, string> = {P1: P1, P2: P2, P3: P3, P4: P4};

const AGENTS = [
  {name: 'AMARA', load: 0.82, color: INDIGO},
  {name: 'DEV', load: 0.64, color: CYAN},
  {name: 'LENA', load: 0.71, color: VIOLET},
  {name: 'RICO', load: 0.55, color: GREEN},
];

const ROW_H = 148;
const QUEUE_TOP = 470;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="stGlow" cx="38%" cy="26%" r="78%">
      <stop offset="0%" stopColor="rgba(129,140,248,0.14)" />
      <stop offset="55%" stopColor="rgba(129,140,248,0.04)" />
      <stop offset="100%" stopColor="rgba(7,10,20,0)" />
    </radialGradient>
    <radialGradient id="stVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,5,11,0)" />
      <stop offset="100%" stopColor="rgba(2,4,9,0.76)" />
    </radialGradient>
    <linearGradient id="stScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(129,140,248,0)" />
      <stop offset="50%" stopColor="rgba(129,140,248,0.16)" />
      <stop offset="100%" stopColor="rgba(129,140,248,0)" />
    </linearGradient>
    <linearGradient id="stBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={INDIGO} />
      <stop offset="100%" stopColor={VIOLET} />
    </linearGradient>
    <filter id="stBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered, drifting, never flat
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift1 = Math.sin((frame / 900) * Math.PI * 2) * 90;
  const drift2 = Math.cos((frame / 900) * Math.PI * 2) * 70;
  const scanY = (frame / 900) * 2400 - 240;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const ox = random(`st-orb-x-${i}`) * 3840;
    const oy = random(`st-orb-y-${i}`) * 2160;
    const r = 260 + random(`st-orb-r-${i}`) * 320;
    const hue = i % 2 === 0 ? 'rgba(129,140,248,0.10)' : 'rgba(103,232,249,0.07)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.7) * 120;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.3) * 90;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#stBlur70)" />);
  }
  const gridLines: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 240) {
    gridLines.push(<line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={2160} stroke="rgba(237,239,247,0.045)" strokeWidth={1} />);
  }
  for (let gy = 0; gy <= 2160; gy += 240) {
    gridLines.push(<line key={`h${gy}`} x1={0} y1={gy} x2={3840} y2={gy} stroke="rgba(237,239,247,0.045)" strokeWidth={1} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#stGlow)" transform={`translate(${drift1},${drift2})`} />
        {orbs}
        {gridLines}
        <rect x={0} y={scanY} width={3840} height={340} fill="url(#stScan)" />
        <rect width={3840} height={2160} fill="url(#stVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [60, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const pulse = 0.72 + 0.28 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 120, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: INDIGO}}>
        SUPPORT OPS &nbsp;·&nbsp; LIVE TRIAGE QUEUE
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 150, color: INK, marginTop: 18, letterSpacing: -2}}>
        Ticket Triage
      </div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 26, gap: 28}}>
        <div style={{width: 22, height: 22, borderRadius: 11, backgroundColor: P1, opacity: pulse, boxShadow: `0 0 30px ${P1}`}} />
        <div style={{fontFamily: MONO, fontSize: 40, color: MUTED}}>8 OPEN &nbsp;·&nbsp; AUTO-ROUTING ACTIVE</div>
        <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 40, color: CYAN, border: `2px solid ${CYAN}`, borderRadius: 12, padding: '10px 26px'}}>
          SLA 98.4%
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticket rows
// ---------------------------------------------------------------------------
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const TicketRows: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <div style={{position: 'absolute', top: QUEUE_TOP, left: 220, width: 2360}}>
      {TICKETS.map((t, i) => {
        const enterStart = ROW_START + i * ROW_GAP;
        const enter = spring({frame: frame - enterStart, fps, config: {damping: 200, stiffness: 110}});
        const triaged = frame >= TRIAGE_START + i * TRIAGE_STEP;
        const dealT = interpolate(frame, [DEAL_START + i * 14, DEAL_START + i * 14 + 60], [0, 1], clamp01);
        const resolved = frame >= RESOLVE_START + i * 24;
        const y = interpolate(enter, [0, 1], [70, 0]);
        const opacity = interpolate(enter, [0, 1], [0, 1]);
        const dealX = interpolate(dealT, [0, 1], [0, 900]);
        const slaFrac = interpolate(frame, [TRIAGE_START, 860], [1, 0.06], clamp01);
        const slaColor = slaFrac > 0.5 ? CYAN : slaFrac > 0.22 ? P2 : P1;
        const rowY = i * ROW_H;
        return (
          <div
            key={t.id}
            style={{
              position: 'absolute',
              top: rowY,
              left: 0,
              width: 2360,
              height: ROW_H - 18,
              opacity,
              transform: `translateY(${y}px) translateX(${dealX}px)`,
              backgroundColor: PANEL,
              border: `1px solid ${HAIRLINE}`,
              borderLeft: `10px solid ${triaged ? PRIORITY_COLOR[t.priority] : 'rgba(237,239,247,0.25)'}`,
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              padding: '0 44px',
              gap: 40,
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 40, color: MUTED, width: 240}}>{t.id}</div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: FONT, fontWeight: 650, fontSize: 52, color: INK}}>{t.subject}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 10}}>
                <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: '4px 16px'}}>
                  {t.channel}
                </div>
                <div style={{flex: 1, height: 14, backgroundColor: 'rgba(237,239,247,0.10)', borderRadius: 7, overflow: 'hidden'}}>
                  <div style={{width: `${slaFrac * 100}%`, height: '100%', backgroundColor: triaged ? slaColor : 'rgba(237,239,247,0.25)', borderRadius: 7}} />
                </div>
                <div style={{fontFamily: MONO, fontSize: 34, color: MUTED}}>SLA {Math.round(t.slaMin * slaFrac)}m</div>
              </div>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 44,
                color: triaged ? '#070A14' : MUTED,
                backgroundColor: triaged ? PRIORITY_COLOR[t.priority] : 'rgba(237,239,247,0.08)',
                borderRadius: 12,
                padding: '14px 34px',
                transform: triaged ? 'scale(1)' : 'scale(0.92)',
                boxShadow: triaged ? `0 0 34px ${PRIORITY_COLOR[t.priority]}66` : 'none',
              }}
            >
              {t.priority}
            </div>
            <div style={{fontFamily: MONO, fontSize: 38, color: triaged ? CYAN : MUTED, width: 190, textAlign: 'right'}}>
              {triaged ? `→ ${t.agent}` : 'QUEUED'}
            </div>
            {resolved && (
              <div
                style={{
                  position: 'absolute',
                  right: -30,
                  top: -30,
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: GREEN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 52,
                  color: '#06281C',
                  boxShadow: `0 0 44px ${GREEN}`,
                }}
              >
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Agent pods (right side)
// ---------------------------------------------------------------------------
const AgentPods: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - DEAL_START + 40, fps, config: {damping: 200, stiffness: 80}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [120, 0]);
  const resolvedCount = TICKETS.filter((_, i) => frame >= RESOLVE_START + i * 24).length;
  return (
    <div style={{position: 'absolute', top: QUEUE_TOP - 40, right: 220, width: 830, opacity, transform: `translateX(${x}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: INDIGO, marginBottom: 30}}>AGENT PODS</div>
      {AGENTS.map((a, i) => {
        const loadW = interpolate(frame, [DEAL_START + 60, DEAL_START + 300], [0.25, a.load], clamp01);
        const myTickets = TICKETS.filter((t) => t.agent === a.name && frame >= TRIAGE_START + TICKETS.indexOf(t) * TRIAGE_STEP).length;
        return (
          <div key={a.name} style={{backgroundColor: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 18, padding: '30px 40px', marginBottom: 26}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div style={{width: 30, height: 30, borderRadius: 15, backgroundColor: a.color, boxShadow: `0 0 24px ${a.color}`, marginRight: 26}} />
              <div style={{fontFamily: FONT, fontWeight: 750, fontSize: 54, color: INK}}>{a.name}</div>
              <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 42, color: CYAN}}>{myTickets} TICKETS</div>
            </div>
            <div style={{height: 22, backgroundColor: 'rgba(237,239,247,0.10)', borderRadius: 11, marginTop: 22, overflow: 'hidden'}}>
              <div style={{width: `${loadW * 100}%`, height: '100%', background: 'linear-gradient(90deg,#818CF8,#A78BFA)', borderRadius: 11}} />
            </div>
            <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, marginTop: 12}}>LOAD {Math.round(loadW * 100)}%</div>
          </div>
        );
      })}
      <div style={{backgroundColor: 'rgba(52,211,153,0.08)', border: `2px solid ${GREEN}`, borderRadius: 18, padding: '30px 40px', marginTop: 10}}>
        <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 8, color: GREEN}}>RESOLVED</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 110, color: INK}}>
          {resolvedCount}<span style={{fontSize: 54, color: MUTED}}> / 8</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  const w = interpolate(frame, [PAYOFF_START, PAYOFF_START + 50], [0, 3400], clamp01);
  return (
    <div style={{position: 'absolute', bottom: 130, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity, transform: `scale(${scale})`}}>
      <div style={{backgroundColor: 'rgba(7,10,20,0.92)', border: `2px solid ${INDIGO}`, borderRadius: 26, padding: '44px 90px', textAlign: 'center', boxShadow: `0 0 90px rgba(129,140,248,0.35)`}}>
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 12, color: INDIGO}}>TRIAGE COMPLETE</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 96, color: INK, marginTop: 12}}>QUEUE CLEAR &nbsp;·&nbsp; SLA 98.4%</div>
        <div style={{width: w, maxWidth: '100%', height: 10, background: 'linear-gradient(90deg,#818CF8,#A78BFA,#67E8F9)', borderRadius: 5, margin: '26px auto 0'}} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 900;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`st-grain-x-${frame}-${i}`) * 3840;
    const y = random(`st-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`st-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`st-grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const SupportTicketTriage: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <TicketRows frame={frame} fps={fps} />
      <AgentPods frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
