/**
 * CustomsClearanceFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Port clearance arc: a cargo container rolls into frame, document icons
 * stack and verify one by one, a scanner beam sweeps the container, the
 * import-duty counter settles, a CLEARED stamp slams down, a dotted route
 * line extends, and a haulier truck rolls out of the yard.
 *
 * Register in Root.tsx:
 *   <Composition id="CustomsClearanceFlow" component={CustomsClearanceFlow}
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
// Palette: dark slate + amber/teal
// ---------------------------------------------------------------------------
const BG = '#0B1017';
const INK = '#EAF1F8';
const MUTED = 'rgba(170,188,208,0.62)';
const AMBER = '#F5A524';
const TEAL = '#2DD4BF';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const ARRIVE_START = 80;
const ARRIVE_END = 260;
const DOC_STARTS = [280, 330, 380, 430];
const SCAN_FRAME_AT = 520;
const SCAN_START = 540;
const SCAN_END = 680;
const DUTY_START = 690;
const DUTY_END = 790;
const STAMP_AT = 800;
const ROUTE_START = 800;
const ROUTE_END = 860;
const TRUCK_START = 790;
const TRUCK_END = 905;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const GROUND_Y = 1500;
const CTN = {w: 1200, h: 450, y: 1050, restX: 420}; // rest: 420..1620 x, 1050..1500 y

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlowAmber" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(245,165,36,0.12)" />
      <stop offset="100%" stopColor="rgba(245,165,36,0)" />
    </radialGradient>
    <radialGradient id="bgGlowTeal" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.10)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(11,16,23,0)" />
      <stop offset="100%" stopColor="rgba(2,4,8,0.76)" />
    </radialGradient>
    <linearGradient id="containerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#D99A35" />
      <stop offset="55%" stopColor="#B57A24" />
      <stop offset="100%" stopColor="#8A5A1C" />
    </linearGradient>
    <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#1C2635" />
      <stop offset="100%" stopColor="#101724" />
    </linearGradient>
    <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="rgba(245,165,36,0)" />
      <stop offset="50%" stopColor="rgba(245,165,36,0.55)" />
      <stop offset="100%" stopColor="rgba(245,165,36,0)" />
    </linearGradient>
    <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#46586E" />
      <stop offset="100%" stopColor="#232E3E" />
    </linearGradient>
    <filter id="glowBlur" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered glow, faint yard grid, drifting streaks, vignette
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const grid = useMemo(
    () =>
      Array.from({length: 30}, (_, i) => ({
        x: (i / 29) * 3840,
      })),
    []
  );
  const drift = (frame * 0.5) % 300;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <ellipse cx={900} cy={500} rx={1200} ry={640} fill="url(#bgGlowAmber)" opacity={0.75} />
        <ellipse cx={3100} cy={1820} rx={1300} ry={700} fill="url(#bgGlowTeal)" opacity={0.7} />
        <g opacity={0.05}>
          {grid.map((g, i) => (
            <line key={`vg${i}`} x1={g.x} y1={0} x2={g.x} y2={2160} stroke={INK} strokeWidth={i % 5 === 0 ? 3 : 1.5} />
          ))}
        </g>
        <g opacity={0.06}>
          {Array.from({length: 12}, (_, i) => (
            <rect key={`st${i}`} x={(i * 397 + 2400 - drift * 2) % 4200 - 200} y={200 + (i % 4) * 420} width={260} height={5} rx={2.5} fill={AMBER} />
          ))}
        </g>
        {/* ground */}
        <rect x={0} y={GROUND_Y} width={3840} height={660} fill="#0D141D" />
        <rect x={0} y={GROUND_Y} width={3840} height={6} fill="rgba(245,165,36,0.35)" />
        <g opacity={0.10} stroke={INK} strokeWidth={3}>
          {[1620, 1780, 1950].map((yy) => (
            <line key={`gl${yy}`} x1={0} y1={yy} x2={3840} y2={yy} />
          ))}
        </g>
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title block + live port stats
// ---------------------------------------------------------------------------
const TitleBlock: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 55], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const count = (to: number, start: number) => {
    const t = interpolate(frame, [start, start + 70], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return Math.round(to * (1 - Math.pow(1 - t, 3)));
  };
  const stats = [
    {label: 'CONTAINERS TODAY', value: String(count(1284, 70)), color: AMBER},
    {label: 'AVG CLEARANCE', value: `${count(38, 95)} MIN`, color: TEAL},
    {label: 'VESSELS IN QUEUE', value: String(count(14, 120)), color: INK},
  ];
  return (
    <div style={{position: 'absolute', top: 96 + rise, left: 220, right: 220, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
            <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 88, letterSpacing: -1}}>
              CUSTOMS CLEARANCE
            </span>
            <span
              style={{
                color: AMBER,
                fontFamily: MONO,
                fontSize: 36,
                fontWeight: 700,
                border: `2px solid ${AMBER}`,
                borderRadius: 10,
                padding: '6px 18px',
              }}
            >
              BERTH 04
            </span>
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
            Port operations &middot; Vessel MV Pacific Trader &middot; Import terminal
          </div>
        </div>
        <div style={{display: 'flex', gap: 56}}>
          {stats.map((s) => (
            <div key={s.label} style={{textAlign: 'right'}}>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>{s.label}</div>
              <div
                style={{
                  color: s.color,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 72,
                  textShadow: `0 0 26px ${s.color}55`,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Port scene: ship silhouette + gantry crane (background)
// ---------------------------------------------------------------------------
const PortScene: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const beacon = Math.floor(frame / 24) % 2 === 0;
  if (fade <= 0) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {/* distant container ship */}
      <g opacity={0.35} fill="#1B2534">
        <rect x={300} y={1180} width={1400} height={170} rx={8} />
        <rect x={1420} y={1060} width={180} height={120} rx={6} />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4, 5].map((c) => (
            <rect key={`sc${r}${c}`} x={380 + c * 160} y={1080 - r * 62} width={140} height={52} rx={4} fill={r % 2 ? '#24303F' : '#1B2534'} />
          ))
        )}
      </g>
      {/* gantry crane */}
      <g opacity={0.6}>
        <rect x={2665} y={480} width={70} height={1020} fill="url(#steelGrad)" />
        <rect x={3415} y={480} width={70} height={1020} fill="url(#steelGrad)" />
        <rect x={2450} y={410} width={1250} height={90} rx={8} fill="url(#steelGrad)" />
        <rect x={2000} y={438} width={450} height={44} rx={6} fill="#2A3648" />
        <line x1={2200} y1={482} x2={2200} y2={880} stroke="#54687F" strokeWidth={8} />
        <rect x={2120} y={880} width={160} height={44} rx={8} fill="#54687F" />
        <circle cx={3075} cy={392} r={16} fill={beacon ? '#FF5A5A' : 'rgba(255,90,90,0.25)'} style={beacon ? {filter: 'drop-shadow(0 0 18px rgba(255,90,90,0.9))'} : undefined} />
        <text x={3075} y={1350} fill="rgba(170,188,208,0.5)" fontSize={34} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
          STS-04
        </text>
      </g>
      {/* faint stacked containers behind the action */}
      <g opacity={0.28}>
        {[0, 1, 2].map((c) =>
          [0, 1].map((r) => (
            <rect
              key={`ys${c}${r}`}
              x={120 + c * 210}
              y={1330 - r * 96}
              width={190}
              height={86}
              rx={4}
              fill={r % 2 ? '#1E2A3A' : '#243244'}
              stroke="rgba(170,188,208,0.25)"
              strokeWidth={2}
            />
          ))
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Cargo container (arrives from the left, eases to rest)
// ---------------------------------------------------------------------------
const ContainerUnit: React.FC<{frame: number}> = ({frame}) => {
  const p = interpolate(frame, [ARRIVE_START, ARRIVE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0) return null;
  const ease = 1 - Math.pow(1 - p, 3);
  const x = -950 + ease * (CTN.restX + 950);
  const bob = Math.sin(frame * 0.12) * 5 * (1 - p);
  const top = CTN.y + bob;
  const corr: number[] = [];
  for (let cx = 40; cx < CTN.w - 40; cx += 60) corr.push(cx);

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g transform={`translate(${x}, ${top})`}>
        {/* shadow */}
        <ellipse cx={CTN.w / 2} cy={CTN.h + 44} rx={CTN.w / 2} ry={34} fill="rgba(0,0,0,0.45)" />
        {/* body */}
        <rect x={0} y={0} width={CTN.w} height={CTN.h} rx={10} fill="url(#containerGrad)" />
        {corr.map((cx) => (
          <line key={`cr${cx}`} x1={cx} y1={26} x2={cx} y2={CTN.h - 26} stroke="rgba(60,35,5,0.35)" strokeWidth={7} />
        ))}
        {/* rails */}
        <rect x={0} y={0} width={CTN.w} height={26} fill="rgba(60,35,5,0.5)" />
        <rect x={0} y={CTN.h - 26} width={CTN.w} height={26} fill="rgba(60,35,5,0.5)" />
        {/* door lock rods */}
        {[CTN.w - 130, CTN.w - 90, CTN.w - 50].map((rx) => (
          <g key={`rod${rx}`}>
            <line x1={rx} y1={40} x2={rx} y2={CTN.h - 40} stroke="rgba(40,24,4,0.7)" strokeWidth={9} />
            <rect x={rx - 12} y={CTN.h / 2 - 26} width={24} height={52} rx={6} fill="rgba(40,24,4,0.7)" />
          </g>
        ))}
        {/* stencil labels */}
        <text x={60} y={120} fill="#FFF7E8" fontSize={52} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
          CTRU 482913-7
        </text>
        <text x={60} y={CTN.h - 60} fill="rgba(255,247,232,0.75)" fontSize={32} fontFamily={MONO} letterSpacing={2}>
          MAX GROSS 30,480 KG
        </text>
        <rect x={60} y={150} width={420} height={10} fill="rgba(255,247,232,0.5)" />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Scanner: dashed frame + sweeping beam + progress readout
// ---------------------------------------------------------------------------
const ScannerBeam: React.FC<{frame: number}> = ({frame}) => {
  const frameFade = interpolate(frame, [SCAN_FRAME_AT, SCAN_FRAME_AT + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (frameFade <= 0) return null;
  const p = interpolate(frame, [SCAN_START, SCAN_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const beamX = 420 + p * 1200;
  const pct = Math.round(p * 100);
  const done = frame >= SCAN_END;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={frameFade}>
        <rect
          x={400}
          y={1030}
          width={1240}
          height={490}
          rx={16}
          fill="none"
          stroke={TEAL}
          strokeWidth={4}
          strokeDasharray="26 20"
          opacity={0.8}
          style={{filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.6))'}}
        />
        {/* beam */}
        {!done && p > 0 && (
          <g>
            <rect x={beamX - 55} y={1030} width={110} height={490} fill="url(#beamGrad)" />
            <line x1={beamX} y1={1030} x2={beamX} y2={1520} stroke={AMBER} strokeWidth={7} style={{filter: 'drop-shadow(0 0 18px rgba(245,165,36,0.9))'}} />
          </g>
        )}
        {/* readout */}
        <g transform="translate(1020, 985)">
          <rect x={-250} y={-52} width={500} height={88} rx={16} fill="rgba(8,12,19,0.92)" stroke={done ? TEAL : AMBER} strokeWidth={2.5} />
          <text x={0} y={12} fill={done ? TEAL : AMBER} fontSize={44} fontFamily={MONO} fontWeight={800} letterSpacing={2} textAnchor="middle">
            {done ? '\u2713 SCAN COMPLETE' : `SCAN ${pct}%`}
          </text>
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Document stack: 4 cards slide in, each stamped with a check
// ---------------------------------------------------------------------------
const DOCS = [
  {title: 'CARGO MANIFEST', ref: 'CM-2026-8841'},
  {title: 'COMMERCIAL INVOICE', ref: 'INV-55912'},
  {title: 'PACKING LIST', ref: 'PL-30987'},
  {title: 'ORIGIN CERTIFICATE', ref: 'CO-11204'},
];
const DocStack: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelFade = interpolate(frame, [250, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (panelFade <= 0) return null;
  const px = 1900;
  const pw = 660;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={panelFade}>
        <rect x={px} y={950} width={pw} height={600} rx={20} fill="rgba(13,20,29,0.92)" stroke="rgba(45,212,191,0.35)" strokeWidth={2.5} />
        <text x={px + 40} y={1016} fill={TEAL} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={5}>
          CARGO DOCUMENTS
        </text>
        {DOCS.map((d, i) => {
          const s = spring({frame: frame - DOC_STARTS[i], fps, config: {damping: 200, stiffness: 110}});
          if (s <= 0.001) return null;
          const checkP = interpolate(frame, [DOC_STARTS[i] + 55, DOC_STARTS[i] + 105], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const y = 1060 + i * 118;
          const cx = 2480;
          const cy = y + 47;
          const circ = 2 * Math.PI * 26;
          return (
            <g key={d.ref} opacity={Math.min(1, s)} transform={`translate(${(1 - s) * 120}, ${y})`}>
              <rect x={1920} y={0} width={620} height={95} rx={14} fill="rgba(22,32,46,0.95)" stroke="rgba(148,163,184,0.3)" strokeWidth={2} />
              {/* doc icon */}
              <g transform="translate(1948, 20)">
                <rect x={0} y={0} width={46} height={56} rx={4} fill="rgba(45,212,191,0.16)" stroke={TEAL} strokeWidth={2.5} />
                <path d="M 32 0 L 46 14 L 32 14 Z" fill={TEAL} opacity={0.8} />
                {[24, 32, 40].map((ly) => (
                  <line key={`dl${ly}`} x1={9} y1={ly} x2={37} y2={ly} stroke={TEAL} strokeWidth={2.5} opacity={0.7} />
                ))}
              </g>
              <text x={2014} y={40} fill={INK} fontSize={32} fontFamily={FONT} fontWeight={700}>
                {d.title}
              </text>
              <text x={2014} y={72} fill={MUTED} fontSize={26} fontFamily={MONO}>
                {d.ref}
              </text>
              {/* verification ring + check */}
              <circle cx={cx} cy={cy} r={26} fill="none" stroke="rgba(45,212,191,0.25)" strokeWidth={5} />
              <circle
                cx={cx}
                cy={cy}
                r={26}
                fill="none"
                stroke={TEAL}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - checkP)}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
              <path
                d={`M ${cx - 11} ${cy + 1} L ${cx - 3} ${cy + 9} L ${cx + 12} ${cy - 8}`}
                fill="none"
                stroke={TEAL}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - checkP}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Duty panel: counter settles + breakdown rows
// ---------------------------------------------------------------------------
const DUTY_ROWS = [
  {label: 'Duty 6.5%', value: '$2,786.20', at: 700},
  {label: 'VAT 12%', value: '$1,180.40', at: 725},
  {label: 'Port & handling', value: '$319.90', at: 750},
];
const DutyPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 660, fps, config: {damping: 200, stiffness: 95}});
  if (s <= 0.001) return null;
  const p = interpolate(frame, [DUTY_START, DUTY_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - Math.pow(1 - p, 3);
  const val = 4286.5 * eased;
  const intStr = Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fracStr = String(Math.floor((val - Math.floor(val)) * 100)).padStart(2, '0');
  const px = 2720;

  return (
    <div
      style={{
        position: 'absolute',
        left: px,
        top: 950 + (1 - s) * 50,
        width: 900,
        height: 560,
        opacity: Math.min(1, s),
        borderRadius: 20,
        background: 'linear-gradient(150deg, rgba(30,24,12,0.94), rgba(14,12,8,0.95))',
        border: '2px solid rgba(245,165,36,0.4)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
        padding: '44px 60px',
      }}
    >
      <div style={{color: AMBER, fontFamily: MONO, fontSize: 34, fontWeight: 700, letterSpacing: 5}}>
        IMPORT DUTY &mdash; USD
      </div>
      <div
        style={{
          color: AMBER,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 104,
          marginTop: 18,
          textShadow: '0 0 34px rgba(245,165,36,0.5)',
        }}
      >
        ${intStr}.{fracStr}
      </div>
      <div style={{height: 2, background: 'rgba(245,165,36,0.25)', margin: '26px 0'}} />
      {DUTY_ROWS.map((r) => {
        const rf = interpolate(frame, [r.at, r.at + 40], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (rf <= 0) return null;
        return (
          <div
            key={r.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              opacity: rf,
              transform: `translateY(${(1 - rf) * 18}px)`,
              marginBottom: 18,
            }}
          >
            <span style={{color: MUTED, fontFamily: FONT, fontSize: 32}}>{r.label}</span>
            <span style={{color: INK, fontFamily: MONO, fontSize: 34, fontWeight: 700}}>{r.value}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CLEARED stamp (slams onto the container)
// ---------------------------------------------------------------------------
const ClearedStamp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - STAMP_AT, fps, config: {damping: 15, stiffness: 150}});
  if (s <= 0.001) return null;
  const scale = 1.65 - 0.65 * s;
  return (
    <div
      style={{
        position: 'absolute',
        left: 1020,
        top: 1275,
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          transform: `translate(-50%, -50%) rotate(-9deg) scale(${scale})`,
          opacity: Math.min(1, s * 1.4),
          border: `10px solid ${AMBER}`,
          borderRadius: 24,
          padding: '28px 80px',
          background: 'rgba(245,165,36,0.10)',
          boxShadow: '0 0 70px rgba(245,165,36,0.45), inset 0 0 40px rgba(245,165,36,0.16)',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            color: AMBER,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 108,
            letterSpacing: 12,
            textShadow: '0 0 26px rgba(245,165,36,0.6)',
          }}
        >
          CLEARED
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dotted route line extending to the right
// ---------------------------------------------------------------------------
const RouteLine: React.FC<{frame: number}> = ({frame}) => {
  const w = interpolate(frame, [ROUTE_START, ROUTE_END], [0, 2250], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (w <= 0) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <defs>
        <clipPath id="routeClip">
          <rect x={1700} y={1850} width={w} height={100} />
        </clipPath>
      </defs>
      <g clipPath="url(#routeClip)">
        <line
          x1={1700}
          y1={1900}
          x2={3950}
          y2={1900}
          stroke={AMBER}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray="2 34"
          opacity={0.85}
          style={{filter: 'drop-shadow(0 0 10px rgba(245,165,36,0.7))'}}
        />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Haulier truck rolling out along the route
// ---------------------------------------------------------------------------
const Truck: React.FC<{frame: number}> = ({frame}) => {
  const p = interpolate(frame, [TRUCK_START, TRUCK_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0) return null;
  const x = -1750 + p * 6400;
  const bob = Math.sin(frame * 0.25) * 4;
  const wheelDeg = -((x / 72) * (180 / Math.PI));
  const wheels = [220, 820, 1330];

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g transform={`translate(${x}, ${bob})`}>
        {/* cargo box */}
        <rect x={0} y={1480} width={1100} height={350} rx={12} fill="url(#boxGrad)" stroke="rgba(245,165,36,0.5)" strokeWidth={3} />
        <rect x={0} y={1480} width={1100} height={26} fill="rgba(245,165,36,0.35)" />
        <text x={550} y={1680} fill={AMBER} fontSize={44} fontFamily={FONT} fontWeight={800} letterSpacing={8} textAnchor="middle" opacity={0.9}>
          CLEARED CARGO
        </text>
        <text x={550} y={1740} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
          SEAL NO. 88412
        </text>
        {/* chassis */}
        <rect x={-60} y={1830} width={1230} height={40} rx={8} fill="#0A0E14" />
        {/* cab */}
        <rect x={1150} y={1580} width={350} height={300} rx={18} fill="#16202E" stroke="rgba(148,163,184,0.45)" strokeWidth={3} />
        <polygon points="1180,1620 1420,1620 1470,1720 1180,1720" fill="rgba(45,212,191,0.30)" stroke="rgba(45,212,191,0.6)" strokeWidth={3} />
        <text x={1325} y={1800} fill={MUTED} fontSize={27} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
          CARGO HAULIER
        </text>
        <circle cx={1500} cy={1830} r={16} fill="#FFE9A8" style={{filter: 'drop-shadow(0 0 16px rgba(255,233,168,0.9))'}} />
        {/* wheels */}
        {wheels.map((wx) => (
          <g key={`wh${wx}`}>
            <circle cx={wx} cy={1880} r={72} fill="#0A0C10" stroke="#2A3546" strokeWidth={10} />
            <g transform={`rotate(${wheelDeg} ${wx} 1880)`}>
              {[0, 60, 120].map((a) => (
                <line
                  key={`sp${a}`}
                  x1={wx}
                  y1={1880}
                  x2={wx + 52 * Math.cos((a * Math.PI) / 180)}
                  y2={1880 + 52 * Math.sin((a * Math.PI) / 180)}
                  stroke="#54687F"
                  strokeWidth={10}
                  strokeLinecap="round"
                />
              ))}
            </g>
            <circle cx={wx} cy={1880} r={24} fill={AMBER} opacity={0.85} />
          </g>
        ))}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom stepper: arrival -> documents -> scan -> duty -> released
// ---------------------------------------------------------------------------
const STEPS = [
  {label: 'ARRIVAL', at: 80},
  {label: 'DOCUMENTS', at: 280},
  {label: 'SCAN', at: 540},
  {label: 'DUTY PAID', at: 690},
  {label: 'RELEASED', at: 800},
];
const Stepper: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [100, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const xs = [560, 1240, 1920, 2600, 3280];
  const y = 2010;
  const doneCount = STEPS.filter((st) => frame >= st.at).length;
  const frac = doneCount / STEPS.length;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      <line x1={xs[0]} y1={y} x2={xs[4]} y2={y} stroke="rgba(148,163,184,0.25)" strokeWidth={5} />
      <line
        x1={xs[0]}
        y1={y}
        x2={xs[0] + (xs[4] - xs[0]) * frac}
        y2={y}
        stroke={AMBER}
        strokeWidth={5}
        strokeLinecap="round"
        style={{filter: 'drop-shadow(0 0 10px rgba(245,165,36,0.7))'}}
      />
      {STEPS.map((st, i) => {
        const active = frame >= st.at;
        return (
          <g key={st.label}>
            <circle
              cx={xs[i]}
              cy={y}
              r={42}
              fill={active ? AMBER : 'rgba(11,16,23,0.9)'}
              stroke={active ? AMBER : 'rgba(148,163,184,0.45)'}
              strokeWidth={4}
              style={active ? {filter: 'drop-shadow(0 0 16px rgba(245,165,36,0.8))'} : undefined}
            />
            <text
              x={xs[i]}
              y={y + 15}
              fill={active ? '#0B1017' : MUTED}
              fontSize={36}
              fontFamily={MONO}
              fontWeight={800}
              textAnchor="middle"
            >
              {active ? '\u2713' : String(i + 1)}
            </text>
            <text
              x={xs[i]}
              y={y + 98}
              fill={active ? INK : MUTED}
              fontSize={30}
              fontFamily={MONO}
              fontWeight={active ? 700 : 400}
              letterSpacing={3}
              textAnchor="middle"
            >
              {st.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Status line (appears once cleared)
// ---------------------------------------------------------------------------
const StatusLine: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [830, 875], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 300,
        right: 220,
        opacity: fade,
        color: TEAL,
        fontFamily: MONO,
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: 3,
        textShadow: '0 0 22px rgba(45,212,191,0.6)',
      }}
    >
      STATUS: CLEARED &middot; RELEASED TO HAULIER
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CustomsClearanceFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <PortScene frame={frame} />
      <TitleBlock frame={frame} />
      <ContainerUnit frame={frame} />
      <ScannerBeam frame={frame} />
      <DocStack frame={frame} fps={fps} />
      <DutyPanel frame={frame} fps={fps} />
      <ClearedStamp frame={frame} fps={fps} />
      <RouteLine frame={frame} />
      <Truck frame={frame} />
      <Stepper frame={frame} />
      <StatusLine frame={frame} />
    </AbsoluteFill>
  );
};

export default CustomsClearanceFlow;
