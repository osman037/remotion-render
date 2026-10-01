/**
 * PriorAuthorizationFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A consumer-friendly medical prior-authorization explainer for the Adobe
 * Stock "Science" category: a coverage request is submitted, clinical
 * documents are gathered one by one, an insurer-review clock ticks down a
 * 72-hour window, an APPROVED stamp slams onto the decision node (plus a
 * brief denied -> appealed -> overturned mini-arc), and a payoff banner
 * closes the story. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="PriorAuthorizationFlow" component={PriorAuthorizationFlow}
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
// Palette (clean medical blue / teal on deep clinical navy)
// ---------------------------------------------------------------------------
const BG = '#06101C';
const INK = '#EAF2FA';
const MUTED = 'rgba(234,242,250,0.60)';
const FAINT = 'rgba(234,242,250,0.34)';
const TEAL = '#2DD4BF';
const BLUE = '#38BDF8';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const RED = '#F87171';
const PANEL = 'rgba(9,20,36,0.88)';
const HAIRLINE = 'rgba(234,242,250,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const INTRO_AT = 20; // title rises in
const DOCS_START = 150; // document gathering begins
const DOC_GAP = 44; // frames between document check-offs
const REVIEW_START = 430; // insurer-review clock begins
const REVIEW_END = 640; // review window drains to zero
const STAMP_AT = 648; // APPROVED stamp slams down
const DENY_1 = 600; // mini-arc: denied card
const DENY_2 = 650; // mini-arc: appeal filed card
const DENY_3 = 702; // mini-arc: overturned -> approved card
const PAYOFF_START = 800; // final payoff banner (last ~2 s)

// ---------------------------------------------------------------------------
// Flow stations (x positions on the central pipeline)
// ---------------------------------------------------------------------------
interface Node {
  x: number;
  label: string;
  sub: string;
  icon: string;
  at: number;
}
const NODES: Node[] = [
  {x: 500, label: 'REQUEST', sub: 'Request submitted', icon: '\u270E', at: 30},
  {x: 1427, label: 'DOCUMENTS', sub: 'Records gathered', icon: '\u2630', at: 150},
  {x: 2353, label: 'REVIEW', sub: 'Under review', icon: '\u25F7', at: 430},
  {x: 3280, label: 'DECISION', sub: 'Pending', icon: '?', at: 640},
];
const PIPE_Y = 980;
const PIPE_R = 130;

// ---------------------------------------------------------------------------
// Clinical documents (consumer-accessible language, no jargon)
// ---------------------------------------------------------------------------
interface Doc {
  name: string;
  detail: string;
}
const DOCS: Doc[] = [
  {name: "Doctor's referral note", detail: '4 pages'},
  {name: 'Diagnosis summary', detail: '2 pages'},
  {name: 'Treatment plan', detail: '6 pages'},
  {name: 'Lab results', detail: '9 panels'},
  {name: 'Prior visit records', detail: '3 visits'},
  {name: 'Imaging report', detail: '3 series'},
];

// ---------------------------------------------------------------------------
// Audit ticker lines (cycle through the run)
// ---------------------------------------------------------------------------
const AUDIT = [
  'REQ-22941 \u00B7 referral note verified \u00B7 4/4 pages',
  'REQ-22941 \u00B7 diagnosis summary matched \u00B7 code set OK',
  'REQ-22941 \u00B7 treatment plan attached \u00B7 6/6 pages',
  'REQ-22941 \u00B7 lab results synced \u00B7 9/9 panels',
  'REQ-22941 \u00B7 prior visit records linked \u00B7 3 visits',
  'REQ-22941 \u00B7 imaging report attached \u00B7 3/3 series',
  'REVIEW QUEUE \u00B7 position 14 \u2192 3',
  'CLINICAL TEAM B \u00B7 reviewer assigned',
  'POLICY CHECK \u00B7 medical-necessity criteria met',
  'DECISION FINALIZED \u00B7 approval issued to provider',
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="paGlow" cx="42%" cy="30%" r="80%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.13)" />
      <stop offset="52%" stopColor="rgba(56,189,248,0.05)" />
      <stop offset="100%" stopColor="rgba(6,16,28,0)" />
    </radialGradient>
    <radialGradient id="paVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,8,15,0)" />
      <stop offset="100%" stopColor="rgba(1,5,10,0.78)" />
    </radialGradient>
    <linearGradient id="paScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(45,212,191,0)" />
      <stop offset="50%" stopColor="rgba(45,212,191,0.14)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0)" />
    </linearGradient>
    <linearGradient id="paPipe" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={BLUE} />
      <stop offset="60%" stopColor={TEAL} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <linearGradient id="paBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="100%" stopColor={BLUE} />
    </linearGradient>
    <filter id="paBlur60" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="60" />
    </filter>
    <filter id="paBlur18" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered glow, drifting dot grid, orbs, scan sweep, vignette
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = (frame / 900) * 2500 - 250;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ox = random(`pa-orb-x-${i}`) * 3840;
    const oy = random(`pa-orb-y-${i}`) * 2160;
    const r = 240 + random(`pa-orb-r-${i}`) * 340;
    const hue =
      i % 2 === 0 ? 'rgba(45,212,191,0.09)' : 'rgba(56,189,248,0.08)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.9) * 130;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.4) * 95;
    orbs.push(
      <circle
        key={i}
        cx={ox + mx}
        cy={oy + my}
        r={r}
        fill={hue}
        filter="url(#paBlur60)"
      />
    );
  }
  // fine drifting dot grid (high-frequency texture for bitrate)
  const dots: React.ReactElement[] = [];
  const dx = (frame * 0.35) % 120;
  const dy = (frame * 0.22) % 120;
  for (let gx = -120; gx <= 3840 + 120; gx += 120) {
    for (let gy = -120; gy <= 2160 + 120; gy += 120) {
      dots.push(
        <circle
          key={`${gx}-${gy}`}
          cx={gx + dx}
          cy={gy + dy}
          r={2.6}
          fill="rgba(234,242,250,0.055)"
        />
      );
    }
  }
  // hairline cross grid
  const lines: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 480) {
    lines.push(
      <line
        key={`v${gx}`}
        x1={gx}
        y1={0}
        x2={gx}
        y2={2160}
        stroke="rgba(234,242,250,0.035)"
        strokeWidth={1}
      />
    );
  }
  for (let gy = 0; gy <= 2160; gy += 480) {
    lines.push(
      <line
        key={`h${gy}`}
        x1={0}
        y1={gy}
        x2={3840}
        y2={gy}
        stroke="rgba(234,242,250,0.035)"
        strokeWidth={1}
      />
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <Defs />
        {orbs}
        {dots}
        {lines}
        <rect x={0} y={scanY} width={3840} height={300} fill="url(#paScan)" />
        <rect width={3840} height={2160} fill="url(#paVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Drifting particles (per-frame motion, never static)
// ---------------------------------------------------------------------------
const Particles: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 44; i++) {
    const bx = random(`pa-p-x-${i}`) * 3840;
    const by = random(`pa-p-y-${i}`) * 2160;
    const spd = 0.4 + random(`pa-p-s-${i}`) * 0.9;
    const x = bx + Math.sin(frame * 0.008 * spd + i * 2.1) * 160;
    const y = by - (frame * spd * 0.55) % 2400;
    const yy = y < -40 ? y + 2400 : y;
    const r = 3 + random(`pa-p-r-${i}`) * 7;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.02 + i * 1.3));
    const col = i % 3 === 0 ? TEAL : i % 3 === 1 ? BLUE : INK;
    parts.push(
      <circle
        key={i}
        cx={x}
        cy={yy}
        r={r}
        fill={col}
        opacity={0.10 * tw}
      />
    );
  }
  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
    >
      {parts}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title bar with live claims ticker
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({
    frame: frame - INTRO_AT,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  const y = interpolate(rise, [0, 1], [64, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const pulse = 0.7 + 0.3 * Math.sin((frame / 60) * Math.PI * 2);
  const claims = 24517 + Math.floor(frame / 15);
  const claimsStr = claims.toLocaleString('en-US');
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 220,
        right: 220,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 42,
          letterSpacing: 14,
          color: TEAL,
        }}
      >
        HEALTH COVERAGE &nbsp;&middot;&nbsp; PRIOR AUTHORIZATION
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 148,
          color: INK,
          marginTop: 16,
          letterSpacing: -2,
        }}
      >
        Approval, Explained
      </div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 24, gap: 30}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: TEAL,
            opacity: pulse,
            boxShadow: `0 0 30px ${TEAL}`,
          }}
        />
        <div style={{fontFamily: MONO, fontSize: 38, color: MUTED}}>
          REQ-22941 &nbsp;&middot;&nbsp; MRI SCAN REQUEST &nbsp;&middot;&nbsp;
          NETWORK LIVE
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontFamily: MONO,
            fontSize: 38,
            color: INK,
            border: `2px solid ${TEAL}`,
            borderRadius: 12,
            padding: '10px 26px',
            backgroundColor: 'rgba(45,212,191,0.07)',
          }}
        >
          CLAIMS TODAY&nbsp;&nbsp;
          <span style={{color: TEAL, fontWeight: 700}}>{claimsStr}</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Central flow: stations, connecting pipe, traveling packet, status labels
// ---------------------------------------------------------------------------
const FlowDiagram: React.FC<{frame: number; fps: number}> = ({
  frame,
  fps,
}) => {
  const x0 = NODES[0].x;
  const x1 = NODES[NODES.length - 1].x;
  const totalW = x1 - x0;
  const fill = interpolate(frame, [30, STAMP_AT + 20], [0, 1], clamp01);
  const fillX = x0 + fill * totalW;

  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0}}
    >
      {/* baseline pipe */}
      <line
        x1={x0}
        y1={PIPE_Y}
        x2={x1}
        y2={PIPE_Y}
        stroke="rgba(234,242,250,0.16)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* progress fill */}
      <line
        x1={x0}
        y1={PIPE_Y}
        x2={fillX}
        y2={PIPE_Y}
        stroke="url(#paPipe)"
        strokeWidth={10}
        strokeLinecap="round"
        style={{filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.6))'}}
      />
      {/* traveling data packet on the fill front */}
      {frame >= 30 && frame < STAMP_AT + 40 && (
        <g>
          <circle cx={fillX} cy={PIPE_Y} r={30} fill={TEAL} opacity={0.25} />
          <circle
            cx={fillX}
            cy={PIPE_Y}
            r={13}
            fill="#FFFFFF"
            style={{filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.9))'}}
          />
        </g>
      )}

      {NODES.map((n, i) => {
        const enter = spring({
          frame: frame - n.at,
          fps,
          config: {damping: 200, stiffness: 95, mass: 1},
        });
        if (enter <= 0.001) return null;
        const nextAt = i < NODES.length - 1 ? NODES[i + 1].at : STAMP_AT + 20;
        const active = frame >= n.at && frame < nextAt;
        const isDecision = i === NODES.length - 1;
        const approved = isDecision && frame >= STAMP_AT;
        const ringPhase = (frame - n.at) % 70;
        const ringR = PIPE_R + 14 + (ringPhase / 70) * 46;
        const ringO = active ? 0.5 * (1 - ringPhase / 70) : 0;
        const fill_col = approved
          ? GREEN
          : active
            ? TEAL
            : 'rgba(12,26,44,0.92)';
        const strokeCol = approved
          ? GREEN
          : active
            ? TEAL
            : 'rgba(234,242,250,0.35)';
        const label = approved ? 'APPROVED' : n.label;
        const sub = approved ? 'Coverage confirmed' : n.sub;
        const icon = approved ? '\u2713' : n.icon;
        return (
          <g
            key={n.label}
            opacity={interpolate(enter, [0, 1], [0, 1], clamp01)}
          >
            {ringO > 0 && (
              <circle
                cx={n.x}
                cy={PIPE_Y}
                r={ringR}
                fill="none"
                stroke={TEAL}
                strokeWidth={3}
                opacity={ringO}
              />
            )}
            <circle
              cx={n.x}
              cy={PIPE_Y}
              r={PIPE_R}
              fill={fill_col}
              stroke={strokeCol}
              strokeWidth={6}
              style={{
                filter: approved
                  ? `drop-shadow(0 0 34px ${GREEN}88)`
                  : active
                    ? `drop-shadow(0 0 26px ${TEAL}77)`
                    : 'none',
              }}
            />
            <text
              x={n.x}
              y={PIPE_Y + 28}
              fill={approved || active ? '#06231F' : MUTED}
              fontSize={86}
              fontFamily={FONT}
              fontWeight={800}
              textAnchor="middle"
            >
              {icon}
            </text>
            <text
              x={n.x}
              y={PIPE_Y - PIPE_R - 44}
              fill={approved ? GREEN : active ? TEAL : MUTED}
              fontSize={46}
              fontFamily={MONO}
              fontWeight={700}
              letterSpacing={6}
              textAnchor="middle"
            >
              {label}
            </text>
            <text
              x={n.x}
              y={PIPE_Y + PIPE_R + 66}
              fill={INK}
              fontSize={44}
              fontFamily={FONT}
              fontWeight={650}
              textAnchor="middle"
            >
              {sub}
            </text>
            {isDecision && approved && (
              <text
                x={n.x}
                y={PIPE_Y + PIPE_R + 118}
                fill={GREEN}
                fontSize={34}
                fontFamily={MONO}
                textAnchor="middle"
              >
                treatment may begin
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Document checklist panel (left)
// ---------------------------------------------------------------------------
const DocsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({
    frame: frame - 60,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  const doneCount = DOCS.filter(
    (_, i) => frame >= DOCS_START + i * DOC_GAP
  ).length;
  const barW = interpolate(
    frame,
    [DOCS_START, DOCS_START + (DOCS.length - 1) * DOC_GAP + 30],
    [0, 1],
    clamp01
  );
  return (
    <div
      style={{
        position: 'absolute',
        top: 420,
        left: 220,
        width: 920,
        opacity: interpolate(enter, [0, 1], [0, 1], clamp01),
        transform: `translateX(${interpolate(enter, [0, 1], [-60, 0], clamp01)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 38,
          letterSpacing: 10,
          color: BLUE,
          marginBottom: 8,
        }}
      >
        CLINICAL DOCUMENTS
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 34,
          color: MUTED,
          marginBottom: 18,
        }}
      >
        ATTACHED{' '}
        <span style={{color: TEAL, fontWeight: 700}}>
          {doneCount}/{DOCS.length}
        </span>
      </div>
      <div
        style={{
          height: 14,
          backgroundColor: 'rgba(234,242,250,0.10)',
          borderRadius: 7,
          overflow: 'hidden',
          marginBottom: 26,
        }}
      >
        <div
          style={{
            width: `${barW * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg,#2DD4BF,#38BDF8)',
            borderRadius: 7,
          }}
        />
      </div>
      {DOCS.map((d, i) => {
        const checkAt = DOCS_START + i * DOC_GAP;
        const s = spring({
          frame: frame - checkAt,
          fps,
          config: {damping: 200, stiffness: 110, mass: 1},
        });
        const done = frame >= checkAt;
        return (
          <div
            key={d.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '17px 26px',
              marginBottom: 12,
              backgroundColor: done
                ? 'rgba(45,212,191,0.08)'
                : 'rgba(9,20,36,0.70)',
              border: `1px solid ${done ? 'rgba(45,212,191,0.45)' : HAIRLINE}`,
              borderRadius: 14,
              opacity: interpolate(s, [0, 1], [0.45, 1], clamp01),
              transform: `scale(${interpolate(s, [0, 1], [0.97, 1], clamp01)})`,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                border: `3px solid ${done ? GREEN : 'rgba(234,242,250,0.30)'}`,
                backgroundColor: done ? GREEN : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 34,
                color: '#06231F',
                boxShadow: done ? `0 0 22px ${GREEN}88` : 'none',
                transform: `scale(${interpolate(s, [0, 1], [0.6, 1], clamp01)})`,
              }}
            >
              {done ? '\u2713' : ''}
            </div>
            <div style={{flex: 1}}>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 650,
                  fontSize: 40,
                  color: done ? INK : MUTED,
                }}
              >
                {d.name}
              </div>
              <div
                style={{fontFamily: MONO, fontSize: 30, color: FAINT, marginTop: 4}}
              >
                {d.detail}
              </div>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 30,
                color: done ? GREEN : FAINT,
                letterSpacing: 3,
              }}
            >
              {done ? 'ATTACHED' : 'PENDING'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live network panel (right): claims counter, approval rate, sparkline
// ---------------------------------------------------------------------------
const LivePanel: React.FC<{frame: number; fps: number}> = ({
  frame,
  fps,
}) => {
  const enter = spring({
    frame: frame - 90,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  const opacity = interpolate(enter, [0, 1], [0, 1], clamp01);
  const x = interpolate(enter, [0, 1], [60, 0], clamp01);
  const claims = 24517 + Math.floor(frame / 15);
  const rate = interpolate(frame, [REVIEW_START, REVIEW_END], [0, 87.2], clamp01);
  // per-frame sparkline: seeded random walk of "requests per minute"
  const pts: string[] = [];
  const NW = 740;
  const NH = 170;
  const NP = 72;
  for (let i = 0; i < NP; i++) {
    const v =
      0.52 +
      0.26 * Math.sin(i * 0.31 + frame * 0.09) +
      0.22 * (random(`pa-sp-${frame}-${i}`) - 0.5);
    const px = 40 + (i / (NP - 1)) * NW;
    const py = 20 + (1 - Math.min(0.98, Math.max(0.02, v))) * NH;
    pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const sparkPath = pts.join(' ');
  const areaPath = `${sparkPath} L ${(40 + NW).toFixed(1)} ${(20 + NH).toFixed(1)} L 40 ${(20 + NH).toFixed(1)} Z`;
  return (
    <div
      style={{
        position: 'absolute',
        top: 420,
        right: 220,
        width: 920,
        opacity,
        transform: `translateX(${x}px)`,
        backgroundColor: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 22,
        padding: '40px 48px',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 38,
          letterSpacing: 10,
          color: TEAL,
          marginBottom: 26,
        }}
      >
        LIVE NETWORK
      </div>
      <div style={{fontFamily: MONO, fontSize: 32, color: MUTED, letterSpacing: 4}}>
        REQUESTS PROCESSED
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 108,
          color: INK,
          lineHeight: 1.1,
          textShadow: '0 0 30px rgba(56,189,248,0.35)',
        }}
      >
        {claims.toLocaleString('en-US')}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 32,
          color: MUTED,
          letterSpacing: 4,
          marginTop: 30,
        }}
      >
        APPROVAL RATE
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 84,
            color: GREEN,
            textShadow: `0 0 26px ${GREEN}55`,
          }}
        >
          {rate.toFixed(1)}%
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, color: FAINT}}>
          of requests cleared
        </div>
      </div>
      <div
        style={{
          height: 16,
          backgroundColor: 'rgba(234,242,250,0.10)',
          borderRadius: 8,
          overflow: 'hidden',
          marginTop: 14,
        }}
      >
        <div
          style={{
            width: `${(rate / 100) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg,#34D399,#2DD4BF)',
            borderRadius: 8,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 32,
          color: MUTED,
          letterSpacing: 4,
          marginTop: 34,
          marginBottom: 8,
        }}
      >
        REQUESTS / MINUTE
      </div>
      <svg width={820} height={210}>
        <path d={areaPath} fill="rgba(56,189,248,0.14)" />
        <path
          d={sparkPath}
          fill="none"
          stroke={BLUE}
          strokeWidth={5}
          strokeLinecap="round"
          style={{filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.7))'}}
        />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Insurer-review clock: 72-hour window drains with tick marks and readout
// ---------------------------------------------------------------------------
const ReviewClock: React.FC<{frame: number; fps: number}> = ({
  frame,
  fps,
}) => {
  const enter = spring({
    frame: frame - (REVIEW_START - 40),
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  if (enter <= 0.001) return null;
  const y = interpolate(enter, [0, 1], [50, 0], clamp01);
  const opacity = interpolate(enter, [0, 1], [0, 1], clamp01);
  const hoursLeft = interpolate(frame, [REVIEW_START, REVIEW_END], [72, 0], clamp01);
  const BX = 220;
  const BW = 3400;
  const BY = 1370;
  const fillW = (hoursLeft / 72) * BW;
  const reviewing = frame < REVIEW_END;
  const pulse = 0.65 + 0.35 * Math.sin((frame / 60) * Math.PI * 2);
  const ticks: React.ReactElement[] = [];
  for (let h = 0; h <= 72; h += 6) {
    const tx = BX + (h / 72) * BW;
    const major = h % 24 === 0;
    ticks.push(
      <line
        key={h}
        x1={tx}
        y1={BY + 46}
        x2={tx}
        y2={BY + (major ? 84 : 68)}
        stroke={major ? 'rgba(234,242,250,0.55)' : 'rgba(234,242,250,0.28)'}
        strokeWidth={major ? 3 : 2}
      />
    );
    if (major) {
      ticks.push(
        <text
          key={`t${h}`}
          x={tx}
          y={BY + 118}
          fill={FAINT}
          fontSize={30}
          fontFamily={MONO}
          textAnchor="middle"
        >
          {h === 0 ? '72h' : `${72 - h}h`}
        </text>
      );
    }
  }
  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0}}
    >
      <g opacity={opacity} transform={`translate(0, ${y})`}>
        <text
          x={BX}
          y={BY - 46}
          fill={MUTED}
          fontSize={38}
          fontFamily={MONO}
          letterSpacing={10}
        >
          INSURER REVIEW WINDOW
        </text>
        {/* status pill */}
        <g
          transform={`translate(${BX + BW - 560}, ${BY - 108})`}
          opacity={reviewing ? pulse : 1}
        >
          <rect
            x={0}
            y={0}
            width={560}
            height={72}
            rx={36}
            fill={reviewing ? 'rgba(251,191,36,0.10)' : 'rgba(52,211,153,0.10)'}
            stroke={reviewing ? AMBER : GREEN}
            strokeWidth={2.5}
          />
          <text
            x={280}
            y={48}
            fill={reviewing ? AMBER : GREEN}
            fontSize={36}
            fontFamily={MONO}
            fontWeight={700}
            letterSpacing={5}
            textAnchor="middle"
          >
            {reviewing ? 'UNDER REVIEW' : 'DECISION READY'}
          </text>
        </g>
        {/* track */}
        <rect
          x={BX}
          y={BY}
          width={BW}
          height={46}
          rx={23}
          fill="rgba(234,242,250,0.08)"
          stroke="rgba(234,242,250,0.18)"
          strokeWidth={2}
        />
        <rect
          x={BX}
          y={BY}
          width={Math.max(0, fillW)}
          height={46}
          rx={23}
          fill="url(#paBar)"
          opacity={0.85}
        />
        {/* needle at the drain front */}
        {reviewing && (
          <g>
            <line
              x1={BX + fillW}
              y1={BY - 26}
              x2={BX + fillW}
              y2={BY + 72}
              stroke="#FFFFFF"
              strokeWidth={5}
              style={{filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))'}}
            />
            <circle cx={BX + fillW} cy={BY + 23} r={14} fill="#FFFFFF" />
          </g>
        )}
        {ticks}
        <text
          x={BX + BW}
          y={BY + 118}
          fill={INK}
          fontSize={44}
          fontFamily={MONO}
          fontWeight={700}
          textAnchor="end"
        >
          {reviewing ? `${hoursLeft.toFixed(1)}h left` : '0.0h \u00B7 window closed'}
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Deny -> appeal mini-arc (the alternate path, quickly resolved to approved)
// ---------------------------------------------------------------------------
const DenyStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({
    frame: frame - (DENY_1 - 40),
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1], clamp01);
  const cards = [
    {at: DENY_1, title: 'FIRST ANSWER', big: 'DENIED', color: RED, sub: 'needs more records'},
    {at: DENY_2, title: 'NEXT STEP', big: 'APPEAL FILED', color: AMBER, sub: 'doctor adds letter'},
    {at: DENY_3, title: 'FINAL ANSWER', big: 'APPROVED', color: GREEN, sub: 'overturned on appeal'},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        top: 1500,
        left: 220,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 32,
          letterSpacing: 8,
          color: FAINT,
          marginBottom: 16,
        }}
      >
        IF DENIED, YOU CAN APPEAL
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 44}}>
        {cards.map((c, i) => {
          const s = spring({
            frame: frame - c.at,
            fps,
            config: {damping: 200, stiffness: 110, mass: 1},
          });
          const vis = interpolate(s, [0, 1], [0, 1], clamp01);
          return (
            <React.Fragment key={c.big}>
              {i > 0 && (
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 54,
                    color: vis > 0.5 ? TEAL : FAINT,
                    opacity: vis,
                  }}
                >
                  {'\u2192'}
                </div>
              )}
              <div
                style={{
                  width: 470,
                  padding: '26px 34px',
                  backgroundColor: PANEL,
                  border: `2px solid ${vis > 0.5 ? c.color : HAIRLINE}`,
                  borderRadius: 16,
                  opacity: vis,
                  transform: `translateY(${interpolate(s, [0, 1], [30, 0], clamp01)}px)`,
                  boxShadow:
                    vis > 0.5 ? `0 0 34px ${c.color}44` : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 28,
                    letterSpacing: 5,
                    color: FAINT,
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: 52,
                    color: vis > 0.5 ? c.color : FAINT,
                    marginTop: 8,
                  }}
                >
                  {c.big}
                </div>
                <div
                  style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 6}}
                >
                  {c.sub}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// APPROVED stamp: slams onto the decision node with shockwave rings
// ---------------------------------------------------------------------------
const ApprovedStamp: React.FC<{frame: number; fps: number}> = ({
  frame,
  fps,
}) => {
  const s = spring({
    frame: frame - STAMP_AT,
    fps,
    config: {damping: 200, stiffness: 95, mass: 1},
  });
  if (s <= 0.001) return null;
  const scale = interpolate(s, [0, 1], [1.75, 1], clamp01);
  const opacity = interpolate(s, [0, 1], [0, 1], clamp01);
  const cx = NODES[NODES.length - 1].x;
  const cy = PIPE_Y;
  // shockwave rings
  const ring1 = interpolate(frame, [STAMP_AT, STAMP_AT + 55], [80, 460], clamp01);
  const ring1o = interpolate(frame, [STAMP_AT, STAMP_AT + 55], [0.7, 0], clamp01);
  const ring2 = interpolate(frame, [STAMP_AT + 8, STAMP_AT + 70], [60, 380], clamp01);
  const ring2o = interpolate(frame, [STAMP_AT + 8, STAMP_AT + 70], [0.55, 0], clamp01);
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {ring1o > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={ring1}
            fill="none"
            stroke={GREEN}
            strokeWidth={7}
            opacity={ring1o}
          />
        )}
        {ring2o > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={ring2}
            fill="none"
            stroke={TEAL}
            strokeWidth={4}
            opacity={ring2o}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx - 470,
          top: cy - 210,
          width: 940,
          height: 420,
          opacity,
          transform: `rotate(-9deg) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: `10px solid ${GREEN}`,
            borderRadius: 30,
            backgroundColor: 'rgba(6,35,28,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 90px ${GREEN}66, inset 0 0 60px rgba(52,211,153,0.18)`,
          }}
        >
          <div
            style={{
              border: `4px solid ${GREEN}`,
              borderRadius: 20,
              padding: '34px 60px',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 150,
                letterSpacing: 14,
                color: GREEN,
                textShadow: `0 0 44px ${GREEN}99`,
                whiteSpace: 'nowrap',
              }}
            >
              APPROVED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Audit ticker (bottom-left, cycles through the run)
// ---------------------------------------------------------------------------
const AuditTicker: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [100, 150], [0, 1], clamp01);
  if (fade <= 0) return null;
  const idx = Math.min(AUDIT.length - 1, Math.floor((frame - 100) / 72));
  const blink = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 42,
        left: 220,
        opacity: fade,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: TEAL,
          opacity: blink,
          boxShadow: `0 0 18px ${TEAL}`,
        }}
      />
      <div style={{fontFamily: MONO, fontSize: 32, color: MUTED, letterSpacing: 2}}>
        {AUDIT[idx]}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner (last ~2 s)
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({
  frame,
  fps,
}) => {
  const enter = spring({
    frame: frame - PAYOFF_START,
    fps,
    config: {damping: 200, stiffness: 70, mass: 1},
  });
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1], clamp01);
  const scale = interpolate(enter, [0, 1], [0.94, 1], clamp01);
  const barW = interpolate(frame, [PAYOFF_START, PAYOFF_START + 55], [0, 1], clamp01);
  const glowPulse = 0.28 + 0.12 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(5,15,27,0.94)',
          border: `3px solid ${TEAL}`,
          borderRadius: 30,
          padding: '52px 110px',
          textAlign: 'center',
          boxShadow: `0 0 110px rgba(45,212,191,${glowPulse})`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 42,
            letterSpacing: 14,
            color: TEAL,
          }}
        >
          PRIOR AUTHORIZATION COMPLETE
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 118,
            color: INK,
            marginTop: 14,
            letterSpacing: -1,
          }}
        >
          APPROVED{' '}
          <span style={{color: GREEN, textShadow: `0 0 40px ${GREEN}88`}}>
            &middot; CARE CLEARED
          </span>
        </div>
        <div
          style={{
            width: `${barW * 100}%`,
            height: 12,
            background: 'linear-gradient(90deg,#2DD4BF,#38BDF8,#34D399)',
            borderRadius: 6,
            margin: '30px auto 0',
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 36,
            color: MUTED,
            marginTop: 24,
            letterSpacing: 3,
          }}
        >
          coverage confirmed &nbsp;&middot;&nbsp; treatment may begin
        </div>
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
    const x = random(`pa-grain-x-${frame}-${i}`) * 3840;
    const y = random(`pa-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pa-grain-o-${frame}-${i}`) * 0.04;
    const sz = 2 + random(`pa-grain-s-${frame}-${i}`) * 2.5;
    dots.push(
      <rect key={i} x={x} y={y} width={sz} height={sz} fill="#FFFFFF" opacity={o} />
    );
  }
  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
    >
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const PriorAuthorizationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <DocsPanel frame={frame} fps={fps} />
      <LivePanel frame={frame} fps={fps} />
      <FlowDiagram frame={frame} fps={fps} />
      <ReviewClock frame={frame} fps={fps} />
      <DenyStrip frame={frame} fps={fps} />
      <ApprovedStamp frame={frame} fps={fps} />
      <AuditTicker frame={frame} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
