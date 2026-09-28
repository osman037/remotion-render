/**
 * CrossBorderRemittance.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A transparent cross-border money transfer: $1,000 sends, the $4.28 fee
 * peels off, a live FX ticker converts at 1 USD = 0.92 EUR, a route arc
 * carries the packet from sender to receiver, and EUR 916.06 lands with a
 * RECEIVED stamp. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="CrossBorderRemittance" component={CrossBorderRemittance}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (deep emerald fintech)
// ---------------------------------------------------------------------------
const BG = '#06231D';
const INK = '#EAF5EE';
const MUTED = 'rgba(234,245,238,0.60)';
const MINT = '#2DE39B';
const MINT_DEEP = '#0E9E66';
const GOLD = '#F5C044';
const WARN = '#FF7A59';
const PANEL = 'rgba(10,42,34,0.72)';
const HAIRLINE = 'rgba(234,245,238,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Money math (kept consistent across the scene)
// ---------------------------------------------------------------------------
const SEND_USD = 1000;
const FEE_USD = 4.28;
const CONVERT_USD = SEND_USD - FEE_USD; // 995.72
const FX_RATE = 0.92;
const ARRIVE_EUR = CONVERT_USD * FX_RATE; // 916.0624 -> 916.06

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const SEND_COUNT = 60; // $1,000 counts up
const FEE_START = 200; // fee peels off
const FX_START = 300; // ticker + conversion
const ROUTE_START = 460; // packet travels
const RECEIVE_START = 600; // EUR counts up, stamp
const COMPARE_START = 700; // bank comparison strip
const RESOLVE_START = 800;

const fmtUSD = (v: number) => `$${v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
const fmtEUR = (v: number) => `\u20AC${v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="emeraldGlow" cx="50%" cy="34%" r="72%">
      <stop offset="0%" stopColor="rgba(45,227,155,0.14)" />
      <stop offset="55%" stopColor="rgba(45,227,155,0.04)" />
      <stop offset="100%" stopColor="rgba(6,35,29,0)" />
    </radialGradient>
    <radialGradient id="emeraldVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(2,12,10,0)" />
      <stop offset="100%" stopColor="rgba(2,12,10,0.7)" />
    </radialGradient>
    <linearGradient id="mintBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={MINT_DEEP} />
      <stop offset="100%" stopColor={MINT} />
    </linearGradient>
    <linearGradient id="goldBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'#B97F1B'} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <filter id="mintGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.45" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const sweepX = interpolate(frame, [0, 900], [-600, 4440], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#emeraldGlow)" />
        <rect x={sweepX - 260} y={0} width={520} height={2160} fill="rgba(45,227,155,0.045)" transform={`skewX(-12)`} />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#emeraldVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 84 + rise, left: 200, right: 200, opacity: fade, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
      <div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
          Send money <span style={{color: MINT}}>across borders</span>
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
          TRANSPARENT FEES &middot; LIVE EXCHANGE RATE
        </div>
      </div>
      <div style={{
        border: `2px solid ${HAIRLINE}`, borderRadius: 18, padding: '14px 30px',
        color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2,
      }}>
        USD &rarr; EUR
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Send panel: $1,000 counts up, then the fee peels off
// ---------------------------------------------------------------------------
const SendPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const count = interpolate(frame, [SEND_COUNT, SEND_COUNT + 80], [0, SEND_USD], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const feeOut = spring({frame: frame - FEE_START, fps, config: {damping: 200, stiffness: 90}});
  // bar: fee slice (4.28/1000) vs remainder
  const feeFrac = FEE_USD / SEND_USD;
  const barW = 1180;
  const feeW = Math.max(64, barW * feeFrac);

  return (
    <div style={{
      position: 'absolute', left: 200, top: 330, width: 1500,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 34, padding: '46px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow)',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>YOU SEND</div>
        <div style={{
          color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 108,
          marginTop: 10, textShadow: '0 0 34px rgba(45,227,155,0.35)',
        }}>
          {fmtUSD(count)}
        </div>
        {/* amount bar with fee peeling off */}
        <div style={{marginTop: 30, position: 'relative', height: 64}}>
          <div style={{
            position: 'absolute', left: 0, top: 0, width: barW, height: 56,
            borderRadius: 16, background: 'linear-gradient(90deg, #0E9E66, #2DE39B)',
            transform: `scaleX(${interpolate(frame, [SEND_COUNT + 80, SEND_COUNT + 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`,
            transformOrigin: 'left center',
          }} />
          {feeOut > 0.001 && (
            <div style={{
              position: 'absolute',
              left: 880,
              top: -190 * Math.min(1, feeOut),
              width: 300,
              opacity: Math.min(1, feeOut),
            }}>
              <div style={{
                background: '#3A1508', border: `2px solid ${WARN}`, borderRadius: 16,
                padding: '14px 22px', textAlign: 'center',
              }}>
                <div style={{color: WARN, fontFamily: MONO, fontWeight: 800, fontSize: 40}}>
                  &minus;{fmtUSD(FEE_USD)}
                </div>
                <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 2, marginTop: 2}}>
                  OUR FEE
                </div>
              </div>
            </div>
          )}
          {feeOut > 0.5 && (
            <div style={{
              position: 'absolute', left: 0, top: 84,
              color: INK, fontFamily: MONO, fontSize: 34, fontWeight: 700,
              opacity: interpolate(frame, [FEE_START + 30, FEE_START + 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}>
              {fmtUSD(CONVERT_USD)} continues to conversion
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FX ticker panel: live rate + converted amount
// ---------------------------------------------------------------------------
const FxPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (FX_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  // live-ticking rate (deterministic)
  const live = frame >= FX_START;
  const tick = live
    ? FX_RATE + 0.0006 * Math.sin((frame - FX_START) * 0.55) + 0.0003 * Math.sin((frame - FX_START) * 1.7)
    : FX_RATE;
  const converted = interpolate(frame, [FX_START + 20, FX_START + 160], [0, ARRIVE_EUR], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 24; i++) {
      out.push(FX_RATE + 0.0011 * Math.sin(i * 1.9) + 0.0006 * Math.cos(i * 0.7));
    }
    return out;
  }, []);
  const shown = ticks.slice(0, Math.min(24, Math.max(0, Math.floor((frame - FX_START) / 8))));

  return (
    <div style={{
      position: 'absolute', left: 1900, top: 330, width: 1740,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 34, padding: '46px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow)',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>EXCHANGE RATE</div>
          {live && (
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: MINT,
                filter: 'url(#mintGlow)',
                opacity: 0.55 + 0.45 * Math.sin(frame * 0.25),
              }} />
              <span style={{color: MINT, fontFamily: MONO, fontSize: 28, letterSpacing: 2}}>LIVE</span>
            </div>
          )}
        </div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 72, marginTop: 12}}>
          1 USD = <span style={{color: GOLD}}>{tick.toFixed(4)}</span> EUR
        </div>
        {/* rate sparkline */}
        <svg width={1560} height={150} style={{marginTop: 18}}>
          {shown.length > 1 && (
            <polyline
              points={shown.map((v, i) => `${60 + i * 62},${130 - ((v - (FX_RATE - 0.002)) / 0.004) * 110}`).join(' ')}
              fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
            />
          )}
          {shown.map((v, i) => (
            <circle key={i} cx={60 + i * 62} cy={130 - ((v - (FX_RATE - 0.002)) / 0.004) * 110} r={7} fill={GOLD} />
          ))}
        </svg>
        <div style={{marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>CONVERTED</span>
          <span style={{
            color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 84,
            textShadow: '0 0 30px rgba(245,192,68,0.4)',
          }}>{fmtEUR(converted)}</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Route arc: sender -> receiver with traveling packet
// ---------------------------------------------------------------------------
const RouteMap: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (ROUTE_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const draw = interpolate(frame, [ROUTE_START, ROUTE_START + 120], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // traveling packet along the arc
  const t = interpolate(frame, [ROUTE_START + 20, ROUTE_START + 140], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const x0 = 480; const x1 = 3360; const yBase = 1250; const arcH = 330;
  const px = x0 + (x1 - x0) * t;
  const py = yBase - Math.sin(t * Math.PI) * arcH;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <path
          d={`M ${x0} ${yBase} Q 1920 ${yBase - arcH * 2} ${x1} ${yBase}`}
          fill="none" stroke={MINT} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={1} pathLength={1}
          strokeDashoffset={1 - draw}
          opacity={0.85} filter="url(#mintGlow)"
        />
        {/* sender node */}
        <g opacity={draw}>
          <circle cx={x0} cy={yBase} r={30} fill={BG} stroke={MINT} strokeWidth={6} />
          <text x={x0} y={yBase + 92} fill={INK} fontSize={40} fontFamily={MONO} fontWeight={700} textAnchor="middle">SENDER</text>
          <text x={x0} y={yBase + 140} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle">United States</text>
        </g>
        {/* receiver node */}
        <g opacity={draw}>
          <circle cx={x1} cy={yBase} r={30} fill={BG} stroke={GOLD} strokeWidth={6} />
          <text x={x1} y={yBase + 92} fill={INK} fontSize={40} fontFamily={MONO} fontWeight={700} textAnchor="middle">RECEIVER</text>
          <text x={x1} y={yBase + 140} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle">Germany</text>
        </g>
        {/* packet */}
        {t > 0 && t < 1 && (
          <g>
            <circle cx={px} cy={py} r={44} fill={MINT} opacity={0.25} filter="url(#mintGlow)" />
            <circle cx={px} cy={py} r={20} fill={MINT} filter="url(#mintGlow)" />
            <text x={px} y={py - 66} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={700} textAnchor="middle">
              {fmtUSD(CONVERT_USD)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Receive panel: EUR counts up + RECEIVED stamp
// ---------------------------------------------------------------------------
const ReceivePanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (RECEIVE_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const count = interpolate(frame, [RECEIVE_START, RECEIVE_START + 110], [0, ARRIVE_EUR], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const stamp = spring({frame: frame - (RECEIVE_START + 120), fps, config: {damping: 120, stiffness: 200}});
  const stampScale = stamp <= 0.001 ? 2.2 : 2.2 - 1.2 * Math.min(1, stamp);

  return (
    <div style={{
      position: 'absolute', left: 1170, top: 1430, width: 1500,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 34, padding: '44px 56px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow)',
        backdropFilter: 'blur(6px)', textAlign: 'center', position: 'relative',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>ARRIVES AS</div>
        <div style={{
          color: MINT, fontFamily: MONO, fontWeight: 800, fontSize: 124,
          marginTop: 8, textShadow: '0 0 44px rgba(45,227,155,0.5)',
        }}>
          {fmtEUR(count)}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 8}}>
          in your recipient&apos;s account &middot; usually within minutes
        </div>
        {stamp > 0.001 && (
          <div style={{
            position: 'absolute', right: 60, top: -70,
            transform: `rotate(-12deg) scale(${stampScale})`,
            opacity: Math.min(1, stamp),
          }}>
            <div style={{
              border: `6px solid ${MINT}`, borderRadius: 20, padding: '18px 44px',
              color: MINT, fontFamily: FONT, fontWeight: 800, fontSize: 54, letterSpacing: 4,
              background: 'rgba(6,35,29,0.85)',
              boxShadow: '0 0 60px rgba(45,227,155,0.45)',
            }}>
              RECEIVED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Comparison strip
// ---------------------------------------------------------------------------
const CompareStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - COMPARE_START, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const typical = interpolate(frame, [COMPARE_START + 20, COMPARE_START + 120], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{
      position: 'absolute', left: 200, top: 1430, width: 880,
      opacity: Math.min(1, s), transform: `translateX(${(1 - s) * -50}px)`,
    }}>
      <div style={{
        background: 'rgba(58,21,8,0.55)', borderRadius: 30, padding: '40px 46px',
        border: `2px solid rgba(255,122,89,0.4)`, backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: WARN, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>TYPICAL BANK COST</div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64, marginTop: 10}}>
          {fmtUSD(35 * typical)}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 8}}>
          hidden markup buried in the rate
        </div>
      </div>
      <div style={{
        marginTop: 22, background: 'rgba(14,158,102,0.18)', borderRadius: 30, padding: '40px 46px',
        border: `2px solid rgba(45,227,155,0.45)`,
      }}>
        <div style={{color: MINT, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>THIS TRANSFER</div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64, marginTop: 10}}>
          {fmtUSD(FEE_USD)}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 8}}>
          flat fee &middot; real exchange rate
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve summary bar
// ---------------------------------------------------------------------------
const ResolveBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [RESOLVE_START, RESOLVE_START + 40], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const items = [
    ['FEE', fmtUSD(FEE_USD)],
    ['RATE', '0.9200'],
    ['ARRIVES', fmtEUR(ARRIVE_EUR)],
    ['SPEED', 'MINUTES'],
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 120, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center', opacity: fade,
    }}>
      <div style={{
        display: 'flex', gap: 2, borderRadius: 24, overflow: 'hidden',
        border: `2px solid ${HAIRLINE}`, background: 'rgba(6,20,16,0.85)',
      }}>
        {items.map(([k, v], i) => (
          <div key={k} style={{
            padding: '26px 70px', textAlign: 'center',
            borderRight: i < items.length - 1 ? `2px solid ${HAIRLINE}` : 'none',
          }}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>{k}</div>
            <div style={{color: i === 2 ? MINT : INK, fontFamily: MONO, fontWeight: 800, fontSize: 46, marginTop: 6}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
// Deterministic full-frame film grain — bitrate insurance for the >= 20 Mbps verify gate.
// random() from 'remotion' is seeded; positions re-seed every frame. Subtle by design.
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: JSX.Element[] = [];
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

export const CrossBorderRemittance: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <SendPanel frame={frame} fps={fps} />
      <FxPanel frame={frame} fps={fps} />
      <RouteMap frame={frame} fps={fps} />
      <ReceivePanel frame={frame} fps={fps} />
      <CompareStrip frame={frame} fps={fps} />
      <ResolveBar frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default CrossBorderRemittance;
