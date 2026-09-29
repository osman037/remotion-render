/**
 * IncidentResponseLifecycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * An incident response lifecycle on dark war-room red: a SEV2 alert fires,
 * the on-call engineer acknowledges, the escalation chain lights up, a
 * rollback mitigation runs its progress bar, service health restores block
 * by block, a post-mortem timeline lands its lessons, and the resolve strip
 * reports MTTR. Alert -> acknowledge -> mitigate -> resolve -> post-mortem.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="IncidentResponseLifecycle" component={IncidentResponseLifecycle}
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
// Palette (war room)
// ---------------------------------------------------------------------------
const BG = '#150A0C';
const INK = '#F6EDED';
const MUTED = 'rgba(246,237,237,0.60)';
const RED = '#FF4D4D';
const RED_DEEP = '#A31212';
const AMBER = '#FFB020';
const SUCCESS = '#34D399';
const PANEL = 'rgba(34,16,19,0.80)';
const HAIRLINE = 'rgba(246,237,237,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const ALERT_START = 60;
const ACK_START = 180;
const ESC_START = 260;
const MITIGATE_START = 360;
const HEALTH_START = 540;
const POSTMORTEM_START = 660;
const RESOLVE_START = 800;

const STAGES = ['ALERT', 'ACKNOWLEDGE', 'MITIGATE', 'RESOLVE', 'POST-MORTEM'];
const STAGE_TIMES = [ALERT_START, ACK_START, MITIGATE_START, HEALTH_START, POSTMORTEM_START];

const HEALTH_SERVICES = [
  'API GATEWAY', 'AUTH', 'PAYMENTS', 'SEARCH', 'CDN', 'DATABASE', 'QUEUE', 'WORKERS',
];

const LESSONS = [
  {title: 'ROOT CAUSE', body: 'Cache stampede after deploy v2.14.3'},
  {title: 'FIX SHIPPED', body: 'Circuit breaker + staggered rollout'},
  {title: 'FOLLOW-UP', body: 'Runbook updated · drill scheduled'},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="warGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(255,77,77,0.13)" />
      <stop offset="55%" stopColor="rgba(255,77,77,0.04)" />
      <stop offset="100%" stopColor="rgba(21,10,12,0)" />
    </radialGradient>
    <radialGradient id="warVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(8,3,4,0)" />
      <stop offset="100%" stopColor="rgba(8,3,4,0.72)" />
    </radialGradient>
    <linearGradient id="redBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={RED_DEEP} />
      <stop offset="100%" stopColor={RED} />
    </linearGradient>
    <filter id="redGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow7" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const alertActive = frame >= ALERT_START && frame < HEALTH_START;
  const pulse = alertActive ? 0.05 + 0.04 * Math.sin(frame * 0.25) : 0.02;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#warGlow)" opacity={0.6 + pulse * 8} />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#warVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80, left: 200, opacity: fade, display: 'flex', alignItems: 'center', gap: 34}}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: RED, filter: 'url(#redGlow)',
        opacity: frame >= ALERT_START && frame < HEALTH_START ? 0.5 + 0.5 * Math.sin(frame * 0.3) : 0.9,
      }} />
      <div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
          From alert to <span style={{color: SUCCESS}}>all-clear</span>
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
          INCIDENT RESPONSE LIFECYCLE
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage rail across the top
// ---------------------------------------------------------------------------
const StageRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 30, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const railX = 200; const railW = 3440; const railY = 330;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <line x1={railX} y1={railY} x2={railX + railW} y2={railY} stroke={HAIRLINE} strokeWidth={8} strokeLinecap="round" />
        {STAGES.map((st, i) => {
          const active = frame >= STAGE_TIMES[i];
          const done = i < STAGES.length - 1 ? frame >= STAGE_TIMES[i + 1] : frame >= RESOLVE_START;
          const x = railX + (i / (STAGES.length - 1)) * railW;
          // connector fill to next stage
          if (i < STAGES.length - 1) {
            const nx = railX + ((i + 1) / (STAGES.length - 1)) * railW;
            const cf = interpolate(frame, [STAGE_TIMES[i], STAGE_TIMES[i + 1]], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            return (
              <g key={st}>
                <line x1={x} y1={railY} x2={x + (nx - x) * cf} y2={railY}
                  stroke={done ? SUCCESS : RED} strokeWidth={8} strokeLinecap="round"
                  filter="url(#redGlow)" />
                <circle cx={x} cy={railY} r={active ? 34 : 24}
                  fill={done ? SUCCESS : active ? RED : BG}
                  stroke={done ? SUCCESS : active ? RED : HAIRLINE} strokeWidth={6} />
                {done && (
                  <text x={x} y={railY + 12} textAnchor="middle" fill="#0B1220" fontSize={34} fontWeight={800}>&#10003;</text>
                )}
                <text x={x} y={railY + 84} textAnchor="middle"
                  fill={active ? INK : MUTED} fontSize={32} fontFamily={MONO} fontWeight={active ? 800 : 500}
                  letterSpacing={2}>
                  {st}
                </text>
              </g>
            );
          }
          return (
            <g key={st}>
              <circle cx={x} cy={railY} r={active ? 34 : 24}
                fill={done ? SUCCESS : active ? RED : BG}
                stroke={done ? SUCCESS : active ? RED : HAIRLINE} strokeWidth={6} />
              {done && (
                <text x={x} y={railY + 12} textAnchor="middle" fill="#0B1220" fontSize={34} fontWeight={800}>&#10003;</text>
              )}
              <text x={x} y={railY + 84} textAnchor="middle"
                fill={active ? INK : MUTED} fontSize={32} fontFamily={MONO} fontWeight={active ? 800 : 500}
                letterSpacing={2}>
                {st}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Alert card + acknowledge + escalation
// ---------------------------------------------------------------------------
const AlertPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - ALERT_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const shake = frame >= ALERT_START && frame < ALERT_START + 24
    ? Math.sin(frame * 1.4) * 10 * (1 - (frame - ALERT_START) / 24)
    : 0;

  const ack = spring({frame: frame - ACK_START, fps, config: {damping: 200, stiffness: 110}});
  const escChain = [0, 1, 2].map((i) =>
    spring({frame: frame - (ESC_START + i * 50), fps, config: {damping: 200, stiffness: 140}})
  );
  const escLabels = ['L1 · RAY (ON-CALL)', 'L2 · SRE TEAM', 'INCIDENT COMMANDER'];

  return (
    <div style={{
      position: 'absolute', left: 200, top: 560, width: 1060,
      opacity: Math.min(1, s),
      transform: `translateX(${(1 - s) * -80}px) translateX(${shake}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `3px solid ${RED}`, filter: 'url(#panelShadow7)', backdropFilter: 'blur(6px)',
        boxShadow: '0 0 70px rgba(255,77,77,0.3)',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <span style={{
            background: 'linear-gradient(90deg, #A31212, #FF4D4D)', color: '#fff', fontFamily: MONO, fontWeight: 800,
            fontSize: 44, padding: '12px 34px', borderRadius: 14, letterSpacing: 2,
          }}>
            SEV-2
          </span>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>
            INC-4821 &middot; 09:12 PKT
          </span>
        </div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 56, marginTop: 22}}>
          API latency spiking
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 34, marginTop: 10}}>
          p99 <span style={{color: RED, fontWeight: 800}}>2.4s</span> (SLO 800ms) &middot; error rate 6.2%
        </div>
        {/* acknowledge */}
        {ack > 0.001 && (
          <div style={{
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 20,
            opacity: Math.min(1, ack), transform: `translateY(${(1 - Math.min(1, ack)) * 24}px)`,
          }}>
            <span style={{
              width: 58, height: 58, borderRadius: '50%', background: AMBER,
              color: '#150A0C', fontSize: 34, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>&#10003;</span>
            <span style={{color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 38}}>
              Acknowledged in <span style={{color: AMBER}}>47 seconds</span>
            </span>
          </div>
        )}
      </div>
      {/* escalation chain */}
      <div style={{marginTop: 30}}>
        {escLabels.map((l, i) => {
          const e = escChain[i];
          if (e <= 0.001) return null;
          return (
            <div key={l} style={{
              display: 'flex', alignItems: 'center', gap: 22, marginTop: 16,
              opacity: Math.min(1, e), transform: `translateX(${(1 - Math.min(1, e)) * -40}px)`,
            }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                background: 'linear-gradient(90deg, #A31212, #FF4D4D)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 36,
                border: '3px solid rgba(255,255,255,0.25)',
              }}>
                {['R', 'S', 'IC'][i]}
              </div>
              <div style={{
                flex: 1, background: PANEL, border: `2px solid ${HAIRLINE}`,
                borderRadius: 18, padding: '20px 30px',
              }}>
                <span style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 34}}>{l}</span>
                <span style={{color: SUCCESS, fontFamily: MONO, fontSize: 30, marginLeft: 24}}>PAGED &#10003;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Mitigation: rollback card with progress
// ---------------------------------------------------------------------------
const Mitigation: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - MITIGATE_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const prog = interpolate(frame, [MITIGATE_START + 30, MITIGATE_START + 150], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const done = prog >= 1;

  return (
    <div style={{
      position: 'absolute', left: 1420, top: 560, width: 1000,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `2px solid ${done ? SUCCESS : AMBER}`,
        filter: 'url(#panelShadow7)', backdropFilter: 'blur(6px)',
        boxShadow: done ? '0 0 60px rgba(52,211,153,0.25)' : '0 0 60px rgba(255,176,32,0.2)',
      }}>
        <div style={{color: AMBER, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>MITIGATION</div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 56, marginTop: 12}}>
          Rollback deploy v2.14.3
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 10}}>
          reverting to last known-good build v2.14.2
        </div>
        <div style={{marginTop: 30}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 14}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>ROLLBACK PROGRESS</span>
            <span style={{color: done ? SUCCESS : AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 36}}>
              {done ? 'COMPLETE' : `${Math.round(prog * 100)}%`}
            </span>
          </div>
          <div style={{height: 44, borderRadius: 22, background: 'rgba(246,237,237,0.08)', overflow: 'hidden', border: `2px solid ${HAIRLINE}`}}>
            <div style={{
              height: '100%', width: `${prog * 100}%`,
              background: done ? SUCCESS : 'linear-gradient(90deg, #C77E0A, #FFB020)',
              borderRadius: 22,
            }} />
          </div>
        </div>
        {/* deploy log lines */}
        <div style={{marginTop: 26, fontFamily: MONO, fontSize: 28, color: MUTED}}>
          {[
            '> draining canary pods...',
            '> restoring v2.14.2 image...',
            '> health checks passing...',
          ].map((l, i) => {
            const show = frame >= MITIGATE_START + 50 + i * 36;
            if (!show) return null;
            return (
              <div key={l} style={{marginTop: 8}}>
                <span style={{color: done || i < 2 ? SUCCESS : AMBER}}>{done || i < 2 ? 'OK ' : '.. '}</span>{l}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Service health grid restoring
// ---------------------------------------------------------------------------
const HealthGrid: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - HEALTH_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  return (
    <div style={{
      position: 'absolute', left: 2580, top: 560, width: 1060,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow7)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>SERVICE HEALTH</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 26}}>
          {HEALTH_SERVICES.map((svc, i) => {
            const hs = spring({frame: frame - (HEALTH_START + 30 + i * 34), fps, config: {damping: 200, stiffness: 150}});
            const on = hs > 0.5;
            return (
              <div key={svc} style={{
                borderRadius: 18, padding: '22px 26px',
                background: on ? 'rgba(52,211,153,0.10)' : 'rgba(255,77,77,0.08)',
                border: `2px solid ${on ? SUCCESS : RED}`,
                display: 'flex', alignItems: 'center', gap: 18,
                transform: `scale(${on ? 0.92 + 0.08 * Math.min(1, hs) : 1})`,
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: on ? SUCCESS : RED,
                  boxShadow: on ? '0 0 18px rgba(52,211,153,0.7)' : '0 0 18px rgba(255,77,77,0.7)',
                }} />
                <span style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 32}}>{svc}</span>
                <span style={{color: on ? SUCCESS : RED, fontFamily: MONO, fontSize: 26, marginLeft: 'auto'}}>
                  {on ? 'UP' : 'DOWN'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Post-mortem lessons
// ---------------------------------------------------------------------------
const PostMortem: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - POSTMORTEM_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  return (
    <div style={{
      position: 'absolute', left: 200, top: 1560, width: 3440,
      opacity: Math.min(1, s),
    }}>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 3, marginBottom: 24}}>
        POST-MORTEM &middot; WHAT WE LEARNED
      </div>
      <div style={{display: 'flex', gap: 40}}>
        {LESSONS.map((l, i) => {
          const ls = spring({frame: frame - (POSTMORTEM_START + 30 + i * 60), fps, config: {damping: 200, stiffness: 110}});
          if (ls <= 0.001) return null;
          return (
            <div key={l.title} style={{
              flex: 1, background: PANEL, borderRadius: 26,
              border: `2px solid ${HAIRLINE}`, padding: '36px 44px',
              filter: 'url(#panelShadow7)', backdropFilter: 'blur(6px)',
              opacity: Math.min(1, ls),
              transform: `translateY(${(1 - Math.min(1, ls)) * 44}px)`,
              borderTop: `6px solid ${[RED, AMBER, SUCCESS][i]}`,
            }}>
              <div style={{color: [RED, AMBER, SUCCESS][i], fontFamily: MONO, fontWeight: 800, fontSize: 32, letterSpacing: 3}}>
                {l.title}
              </div>
              <div style={{color: INK, fontFamily: FONT, fontSize: 36, marginTop: 12, lineHeight: 1.35}}>
                {l.body}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve strip
// ---------------------------------------------------------------------------
const ResolveStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 96, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(52,211,153,0.12)', border: `2px solid ${SUCCESS}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: SUCCESS,
          color: '#0B1220', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          MTTR 34 MIN &middot; ALL SYSTEMS OPERATIONAL
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
// Deterministic full-frame film grain — bitrate insurance for the >= 20 Mbps
// verify gate. random() from 'remotion' is seeded; positions re-seed every
// frame. Pure SVG/React (canvas/DOM grain is dead code under SSR). Subtle by design.
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`grain-x-${frame}-${i}`) * 3840;
    const y = random(`grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

export const IncidentResponseLifecycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <StageRail frame={frame} fps={fps} />
      <AlertPanel frame={frame} fps={fps} />
      <Mitigation frame={frame} fps={fps} />
      <HealthGrid frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <PostMortem frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default IncidentResponseLifecycle;
