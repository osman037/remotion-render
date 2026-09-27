/**
 * EVChargingAvailabilityMap.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Live EV charging network availability map: status-ringed station pins
 * (green = available, amber = charging, blue = in queue), kW badges, queue
 * counters, and a route that draws from the driver marker to the nearest
 * available fast charger with a ticking ETA, ending in a charge-start payoff.
 *
 * Register in Root.tsx:
 *   <Composition id="EVChargingAvailabilityMap" component={EVChargingAvailabilityMap}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#060B12';
const INK = '#EAF2FB';
const MUTED = 'rgba(180,198,216,0.62)';
const AVAIL = '#34D399'; // green - available
const CHARGE = '#FBBF24'; // amber - charging
const QUEUE = '#60A5FA'; // blue - queue
const TEAL = '#2DD4BF';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const MAP_START = 20;
const STATIONS_START = 90;
const ROUTE_START = 260;
const ROUTE_END = 560;
const ARRIVE_START = 560;
const PAYOFF_END = 720;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helper
// ---------------------------------------------------------------------------
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Map geometry
// ---------------------------------------------------------------------------
const MAP_LEFT = 220;
const MAP_RIGHT = 3620;
const MAP_TOP = 330;
const MAP_BOTTOM = 1920;

interface Station {
  id: number;
  x: number; // 0..1 across map
  y: number; // 0..1 down map
  name: string;
  kw: number;
  status: 'avail' | 'charging' | 'queue';
  queue: number;
  ports: number;
  free: number;
}

// Nine stations spread across the map
const STATIONS: Station[] = [
  {id: 0, x: 0.13, y: 0.24, name: 'HARBOUR POINT', kw: 350, status: 'avail', queue: 0, ports: 12, free: 7},
  {id: 1, x: 0.33, y: 0.14, name: 'NORTHGATE PLAZA', kw: 180, status: 'charging', queue: 0, ports: 8, free: 0},
  {id: 2, x: 0.52, y: 0.30, name: 'MIDTOWN EXCHANGE', kw: 350, status: 'queue', queue: 3, ports: 10, free: 0},
  {id: 3, x: 0.70, y: 0.16, name: 'AIRPORT TERMINAL', kw: 250, status: 'charging', queue: 0, ports: 6, free: 0},
  {id: 4, x: 0.86, y: 0.38, name: 'RIVERSIDE DEPOT', kw: 180, status: 'avail', queue: 0, ports: 8, free: 5},
  {id: 5, x: 0.22, y: 0.62, name: 'OLD TOWN HUB', kw: 120, status: 'queue', queue: 2, ports: 6, free: 0},
  {id: 6, x: 0.44, y: 0.55, name: 'CENTRAL YARDS', kw: 350, status: 'avail', queue: 0, ports: 14, free: 9},
  {id: 7, x: 0.63, y: 0.72, name: 'SOUTHPORT MALL', kw: 250, status: 'charging', queue: 0, ports: 8, free: 0},
  {id: 8, x: 0.84, y: 0.66, name: 'MARINA DRIVE', kw: 350, status: 'avail', queue: 0, ports: 10, free: 6},
];

// Driver starts bottom-left; nearest available fast charger is CENTRAL YARDS (id 6)
const DRIVER = {x: 0.06, y: 0.88};
const TARGET = STATIONS[6];
const statusColor = (s: Station['status']) =>
  s === 'avail' ? AVAIL : s === 'charging' ? CHARGE : QUEUE;

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.10)" />
      <stop offset="55%" stopColor="rgba(45,212,191,0.03)" />
      <stop offset="100%" stopColor="rgba(6,11,18,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(6,11,18,0)" />
      <stop offset="100%" stopColor="rgba(2,4,8,0.74)" />
    </radialGradient>
    <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="100%" stopColor={AVAIL} />
    </linearGradient>
    <filter id="pinGlow" x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur stdDeviation="11" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered glow, vignette, faint map streets, scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const sweep = useMemo(() => {
    const cols = 21;
    const rows = 12;
    const lines: {x1: number; y1: number; x2: number; y2: number; w: number}[] = [];
    for (let i = 0; i <= cols; i++) {
      const x = MAP_LEFT + (i / cols) * (MAP_RIGHT - MAP_LEFT) + (rand(i) - 0.5) * 90;
      lines.push({x1: x, y1: MAP_TOP, x2: x + (rand(i + 40) - 0.5) * 160, y2: MAP_BOTTOM, w: i % 5 === 0 ? 3 : 1.5});
    }
    for (let j = 0; j <= rows; j++) {
      const y = MAP_TOP + (j / rows) * (MAP_BOTTOM - MAP_TOP) + (rand(j + 90) - 0.5) * 70;
      lines.push({x1: MAP_LEFT, y1: y, x2: MAP_RIGHT, y2: y + (rand(j + 140) - 0.5) * 120, w: j % 4 === 0 ? 3 : 1.5});
    }
    return lines;
  }, []);

  const fade = interpolate(frame, [MAP_START, MAP_START + 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scanX = MAP_LEFT + ((frame / 900) * (MAP_RIGHT - MAP_LEFT + 400)) - 200;

  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(45,212,191,0.10), rgba(45,212,191,0.03) 45%, rgba(6,11,18,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <g opacity={fade * 0.55}>
          {sweep.map((l, i) => (
            <line
              key={`st${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={i % 7 === 0 ? 'rgba(96,165,250,0.10)' : 'rgba(148,163,184,0.07)'}
              strokeWidth={l.w}
            />
          ))}
          {/* river curve */}
          <path
            d={`M ${MAP_LEFT - 60} 1450 C 900 1380, 1400 1600, 2100 1520 S 3300 1700, ${MAP_RIGHT + 60} 1620`}
            fill="none"
            stroke="rgba(96,165,250,0.14)"
            strokeWidth={46}
            strokeLinecap="round"
            opacity={0.7}
          />
          <path
            d={`M ${MAP_LEFT - 60} 1450 C 900 1380, 1400 1600, 2100 1520 S 3300 1700, ${MAP_RIGHT + 60} 1620`}
            fill="none"
            stroke="rgba(96,165,250,0.20)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
        {/* district labels */}
        <g opacity={fade * 0.8}>
          <text x={640} y={480} fill="rgba(148,163,184,0.30)" fontSize={30} fontFamily={MONO} letterSpacing={8}>
            HARBOUR DISTRICT
          </text>
          <text x={2450} y={560} fill="rgba(148,163,184,0.30)" fontSize={30} fontFamily={MONO} letterSpacing={8}>
            MIDTOWN
          </text>
          <text x={1500} y={1700} fill="rgba(148,163,184,0.30)" fontSize={30} fontFamily={MONO} letterSpacing={8}>
            OLD TOWN
          </text>
          <text x={3030} y={1330} fill="rgba(148,163,184,0.30)" fontSize={30} fontFamily={MONO} letterSpacing={8}>
            RIVERSIDE
          </text>
        </g>
        {/* scanning sweep */}
        <rect x={scanX - 70} y={MAP_TOP} width={140} height={MAP_BOTTOM - MAP_TOP} fill="rgba(45,212,191,0.030)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar + network stats
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [0, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 50], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const count = (to: number, start: number) => {
    const t = interpolate(frame, [start, start + 70], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return Math.round(to * (1 - Math.pow(1 - t, 3)));
  };

  const stats = [
    {label: 'CHARGERS FREE', value: count(27, 70), color: AVAIL},
    {label: 'VEHICLES QUEUED', value: count(11, 90), color: QUEUE},
    {label: 'AVG POWER', value: `${count(164, 110)}`, unit: 'kW', color: CHARGE},
  ];

  return (
    <div style={{position: 'absolute', top: 84 + rise, left: 220, right: 220, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
            <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 82, letterSpacing: -1}}>
              CHARGE NETWORK
            </span>
            <span
              style={{
                color: AVAIL,
                fontFamily: MONO,
                fontSize: 36,
                fontWeight: 700,
                border: `2px solid ${AVAIL}`,
                borderRadius: 10,
                padding: '6px 18px',
              }}
            >
              LIVE
            </span>
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
            Real-time charger availability &middot; city grid &middot; 9 hubs
          </div>
        </div>
        <div style={{display: 'flex', gap: 40}}>
          {stats.map((s) => (
            <div key={s.label} style={{textAlign: 'right'}}>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>{s.label}</div>
              <div
                style={{
                  color: s.color,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 76,
                  textShadow: `0 0 26px ${s.color}55`,
                }}
              >
                {s.value}
                {s.unit && <span style={{fontSize: 34, marginLeft: 6}}>{s.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Legend chips
// ---------------------------------------------------------------------------
const Legend: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [140, 190], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const items = [
    {c: AVAIL, t: 'AVAILABLE'},
    {c: CHARGE, t: 'CHARGING'},
    {c: QUEUE, t: 'QUEUE'},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 220,
        bottom: 78,
        display: 'flex',
        gap: 44,
        opacity: fade,
      }}
    >
      {items.map((it) => (
        <div key={it.t} style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              background: it.c,
              boxShadow: `0 0 18px ${it.c}`,
            }}
          />
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>{it.t}</span>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Station pins with status rings, kW badges, queue counters
// ---------------------------------------------------------------------------
const Stations: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const px = (s: Station) => MAP_LEFT + s.x * (MAP_RIGHT - MAP_LEFT);
  const py = (s: Station) => MAP_TOP + s.y * (MAP_BOTTOM - MAP_TOP);

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {STATIONS.map((st, i) => {
        const appearAt = STATIONS_START + i * 26;
        const s = spring({frame: frame - appearAt, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.001) return null;
        const c = statusColor(st.status);
        const x = px(st);
        const y = py(st);
        // pulsing outer ring
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.3);
        const ringR = 44 + pulse * 14;
        // port availability arc
        const portFrac = st.free / st.ports;
        const circ = 2 * Math.PI * 62;
        const isTarget = st.id === TARGET.id;

        return (
          <g key={`stn${st.id}`} opacity={Math.min(1, s)} transform={`translate(${x}, ${y}) scale(${0.6 + 0.4 * s})`}>
            {/* glow halo */}
            <circle r={52} fill={c} opacity={0.16} filter="url(#pinGlow)" />
            {/* pulsing status ring */}
            <circle
              r={ringR}
              fill="none"
              stroke={c}
              strokeWidth={5}
              opacity={0.55 + pulse * 0.3}
              style={{filter: `drop-shadow(0 0 12px ${c})`}}
            />
            {/* port ring */}
            <circle
              r={62}
              fill="none"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth={7}
            />
            <circle
              r={62}
              fill="none"
              stroke={c}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - portFrac * s)}
              transform="rotate(-90)"
              opacity={0.95}
            />
            {/* pin body */}
            <circle r={34} fill="#0B1420" stroke={c} strokeWidth={3.5} />
            {/* lightning bolt */}
            <path
              d="M 4 -16 L -9 4 L -1 4 L -4 17 L 10 -3 L 1 -3 Z"
              fill={c}
              opacity={0.95}
              style={{filter: `drop-shadow(0 0 8px ${c})`}}
            />
            {/* station name */}
            <text
              x={0}
              y={-104}
              fill={INK}
              fontSize={30}
              fontFamily={FONT}
              fontWeight={700}
              textAnchor="middle"
              style={{textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}
            >
              {st.name}
            </text>
            {/* kW badge */}
            <g transform="translate(64, -96)">
              <rect x={0} y={-30} width={168} height={58} rx={12} fill="rgba(8,13,22,0.92)" stroke="rgba(148,163,184,0.35)" strokeWidth={2} />
              <text x={84} y={10} fill={TEAL} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                {st.kw} kW
              </text>
            </g>
            {/* queue chip */}
            {st.status === 'queue' && (
              <g transform="translate(-190, 66)">
                <rect x={0} y={-34} width={262} height={62} rx={12} fill="rgba(8,13,22,0.92)" stroke={QUEUE} strokeWidth={2.5} />
                <text x={131} y={12} fill={QUEUE} fontSize={33} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                  {st.queue} IN QUEUE
                </text>
              </g>
            )}
            {/* available chip */}
            {st.status === 'avail' && (
              <g transform="translate(-178, 66)">
                <rect x={0} y={-34} width={238} height={62} rx={12} fill="rgba(8,13,22,0.92)" stroke={AVAIL} strokeWidth={2.5} />
                <text x={119} y={12} fill={AVAIL} fontSize={33} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                  {st.free} FREE
                </text>
              </g>
            )}
            {/* charging chip */}
            {st.status === 'charging' && (
              <g transform="translate(-196, 66)">
                <rect x={0} y={-34} width={274} height={62} rx={12} fill="rgba(8,13,22,0.92)" stroke={CHARGE} strokeWidth={2.5} />
                <text x={137} y={12} fill={CHARGE} fontSize={33} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                  ALL IN USE
                </text>
              </g>
            )}
            {/* target reticle on CENTRAL YARDS */}
            {isTarget && (
              <g>
                <circle
                  r={110}
                  fill="none"
                  stroke={AVAIL}
                  strokeWidth={3}
                  strokeDasharray="22 18"
                  opacity={0.85}
                >
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
                </circle>
                <circle r={110} fill="none" stroke={AVAIL} strokeWidth={1.5} opacity={0.4} />
              </g>
            )}
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Driver marker + route to nearest available charger
// ---------------------------------------------------------------------------
const Route: React.FC<{frame: number}> = ({frame}) => {
  const sx = MAP_LEFT + DRIVER.x * (MAP_RIGHT - MAP_LEFT);
  const sy = MAP_TOP + DRIVER.y * (MAP_BOTTOM - MAP_TOP);
  const tx = MAP_LEFT + TARGET.x * (MAP_RIGHT - MAP_LEFT);
  const ty = MAP_TOP + TARGET.y * (MAP_BOTTOM - MAP_TOP);

  // Route with a waypoint bend for a natural road feel
  const mx = sx + (tx - sx) * 0.45;
  const my = Math.min(sy, ty) - 160;
  const path = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty - 70}`;

  const draw = interpolate(frame, [ROUTE_START, ROUTE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // traveling dot along the quadratic bezier
  const quad = (t: number) => {
    const ax = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * tx;
    const ay = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * (ty - 70);
    return {x: ax, y: ay};
  };
  const dot = quad(draw);

  const driverIn = interpolate(frame, [ROUTE_START - 40, ROUTE_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ETA counts down 04:48 -> 00:00 across the route
  const etaSec = Math.round(interpolate(frame, [ROUTE_START, ROUTE_END], [288, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const etaStr = `${String(Math.floor(etaSec / 60)).padStart(2, '0')}:${String(etaSec % 60).padStart(2, '0')}`;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {/* driver marker */}
      <g opacity={driverIn}>
        <circle cx={sx} cy={sy} r={30} fill={TEAL} opacity={0.25} filter="url(#pinGlow)" />
        <circle cx={sx} cy={sy} r={16} fill={TEAL} style={{filter: 'drop-shadow(0 0 14px rgba(45,212,191,0.9))'}} />
        <circle cx={sx} cy={sy} r={46} fill="none" stroke={TEAL} strokeWidth={3} opacity={0.6} />
        <text x={sx} y={sy + 92} fill={INK} fontSize={30} fontFamily={MONO} fontWeight={700} textAnchor="middle">
          YOU
        </text>
      </g>

      {/* route */}
      {draw > 0.001 && (
        <g>
          <path
            d={path}
            fill="none"
            stroke="rgba(45,212,191,0.25)"
            strokeWidth={14}
            strokeLinecap="round"
            opacity={0.5}
          />
          <path
            d={path}
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
            style={{filter: 'drop-shadow(0 0 16px rgba(52,211,153,0.7))'}}
          />
          {/* traveling car dot */}
          <circle cx={dot.x} cy={dot.y} r={26} fill={AVAIL} opacity={0.22} filter="url(#pinGlow)" />
          <circle cx={dot.x} cy={dot.y} r={13} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
          {/* ETA pill follows the dot */}
          <g transform={`translate(${dot.x}, ${dot.y - 84})`}>
            <rect x={-130} y={-40} width={260} height={78} rx={16} fill="rgba(8,13,22,0.94)" stroke={AVAIL} strokeWidth={2.5} />
            <text x={0} y={-6} fill={MUTED} fontSize={24} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
              ETA
            </text>
            <text x={0} y={30} fill={AVAIL} fontSize={38} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              {etaStr}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Arrival payoff: charge ring + "CHARGING STARTED" stamp
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const tx = MAP_LEFT + TARGET.x * (MAP_RIGHT - MAP_LEFT);
  const ty = MAP_TOP + TARGET.y * (MAP_BOTTOM - MAP_TOP);

  const bloom = spring({frame: frame - ARRIVE_START, fps, config: {damping: 200, stiffness: 80}});
  const stamp = spring({frame: frame - (ARRIVE_START + 40), fps, config: {damping: 200, stiffness: 120}});

  // charge % fills 18 -> 64 across the payoff window
  const pct = Math.round(interpolate(frame, [ARRIVE_START + 60, 880], [18, 64], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const circ = 2 * Math.PI * 150;

  if (bloom <= 0.001) return null;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g transform={`translate(${tx}, ${ty})`} opacity={Math.min(1, bloom)}>
        {/* expanding shockwave */}
        <circle
          r={60 + bloom * 320}
          fill="none"
          stroke={AVAIL}
          strokeWidth={6 * (1 - bloom) + 1}
          opacity={(1 - bloom) * 0.8}
        />
        {/* charge ring */}
        <circle r={150} fill="rgba(6,11,18,0.88)" stroke="rgba(52,211,153,0.25)" strokeWidth={16} />
        <circle
          r={150}
          fill="none"
          stroke={AVAIL}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          transform="rotate(-90)"
          style={{filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.8))'}}
        />
        <text x={0} y={-8} fill={INK} fontSize={84} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {pct}%
        </text>
        <text x={0} y={44} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
          BATTERY
        </text>
      </g>
      {/* stamp banner */}
      {stamp > 0.001 && (
        <g opacity={Math.min(1, stamp)}>
          <g transform={`translate(${tx}, ${ty - 330}) scale(${0.7 + 0.3 * stamp})`}>
            <rect x={-360} y={-58} width={720} height={116} rx={22} fill="rgba(6,20,16,0.95)" stroke={AVAIL} strokeWidth={4} />
            <text x={0} y={22} fill={AVAIL} fontSize={58} fontFamily={FONT} fontWeight={800} letterSpacing={4} textAnchor="middle">
              CHARGING STARTED
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom ticker: live network feed
// ---------------------------------------------------------------------------
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [220, 270], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const items = [
    'NORTHGATE PLAZA — all 8 ports occupied',
    'CENTRAL YARDS — 9 of 14 free · fastest route',
    'MIDTOWN EXCHANGE — 3 vehicles queued',
    'SOUTHPORT MALL — charge session complete, port freed',
    'MARINA DRIVE — 6 of 10 free · 350 kW',
    'OLD TOWN HUB — 2 vehicles queued',
  ];
  const w = 3840;
  const speed = 4.2;
  const totalW = 6400;
  const x = w - ((frame * speed) % (totalW + w));
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 160,
        left: 0,
        width: 3840,
        height: 74,
        overflow: 'hidden',
        opacity: fade,
        borderTop: '1px solid rgba(148,163,184,0.16)',
        borderBottom: '1px solid rgba(148,163,184,0.16)',
        background: 'rgba(6,11,18,0.55)',
      }}
    >
      <svg width={3840} height={74} style={{position: 'absolute', top: 0, left: 0}}>
        <g transform={`translate(${x}, 47)`}>
          {items.map((t, i) => (
            <text
              key={`tk${i}`}
              x={i * 1060}
              fill={i % 2 === 0 ? 'rgba(180,198,216,0.75)' : 'rgba(52,211,153,0.75)'}
              fontSize={30}
              fontFamily={MONO}
            >
              ● {t}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const EVChargingAvailabilityMap: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <Stations frame={frame} fps={fps} />
      <Route frame={frame} />
      <Payoff frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Legend frame={frame} />
    </AbsoluteFill>
  );
};

export default EVChargingAvailabilityMap;
