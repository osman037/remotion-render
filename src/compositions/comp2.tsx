/**
 * ParcelRouteTracking.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A parcel travels a stylized dark route map: waypoint pins drop, a glowing
 * path draws behind the moving parcel, progress ticks to 100% -> DELIVERED.
 * No real map brands.
 *
 * Register in Root.tsx:
 *   <Composition id="ParcelRouteTracking" component={ParcelRouteTracking}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#04070F';
const PANEL = 'rgba(10, 16, 30, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.20)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const CYAN = '#22D3EE';
const CYAN_DIM = 'rgba(34, 211, 238, 0.14)';
const AMBER = '#FBBF24';
const EMERALD = '#34D399';
const EMERALD_DIM = 'rgba(52, 211, 153, 0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Route data (stylized — not real geography)
// ---------------------------------------------------------------------------
type Pt = {x: number; y: number};
const WAYPOINTS: (Pt & {name: string; time: string; arrive: number})[] = [
  {x: 430, y: 1610, name: 'ORIGIN FACILITY', time: '08:12', arrive: 120},
  {x: 1120, y: 1220, name: 'REGIONAL HUB', time: '10:47', arrive: 265},
  {x: 1960, y: 1370, name: 'SORT CENTER', time: '12:05', arrive: 415},
  {x: 2760, y: 890, name: 'LOCAL DEPOT', time: '13:38', arrive: 565},
  {x: 3390, y: 560, name: 'DESTINATION', time: '14:32', arrive: 700},
];
const TRAVEL_START = 120;
const TRAVEL_END = 700;
const TRACK_ID = 'TRK-8842-1107';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (frame: number, start: number, end: number) =>
  clamp01((frame - start) / (end - start));
const entr = (frame: number, delay: number, fps: number) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 19, stiffness: 130},
  });
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Catmull-Rom spline through points, t in [0,1]. */
const catmullRom = (pts: Pt[], t: number): Pt => {
  const n = pts.length - 1;
  const seg = Math.min(n - 1, Math.floor(t * n));
  const lt = t * n - seg;
  const p0 = pts[Math.max(0, seg - 1)];
  const p1 = pts[seg];
  const p2 = pts[seg + 1];
  const p3 = pts[Math.min(n, seg + 2)];
  const t2 = lt * lt;
  const t3 = t2 * lt;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * lt +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * lt +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

const SAMPLES = 240;

// ---------------------------------------------------------------------------
// Background — stylized dark map: district blobs, faint roads, vignette
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const blobs = useMemo(
    () =>
      Array.from({length: 14}, (_, i) => ({
        x: rand(i * 3.7) * 3840,
        y: rand(i * 8.1) * 2160,
        rx: 260 + rand(i * 5.3) * 560,
        ry: 200 + rand(i * 6.9) * 420,
      })),
    [],
  );
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.66" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
        </defs>
        {blobs.map((b, i) => (
          <ellipse
            key={i}
            cx={b.x}
            cy={b.y}
            rx={b.rx}
            ry={b.ry}
            fill={i % 2 === 0 ? 'rgba(30,45,80,0.35)' : 'rgba(24,36,66,0.30)'}
          />
        ))}
        {Array.from({length: 25}, (_, i) => (
          <line
            key={'rv' + i}
            x1={i * 160 + (i % 2) * 60}
            y1={0}
            x2={i * 160 + (i % 2) * 60}
            y2={2160}
            stroke="rgba(148,163,184,0.07)"
            strokeWidth={2}
          />
        ))}
        {Array.from({length: 15}, (_, i) => (
          <line
            key={'rh' + i}
            x1={0}
            y1={i * 160 + (i % 3) * 40}
            x2={3840}
            y2={i * 160 + (i % 3) * 40}
            stroke="rgba(148,163,184,0.07)"
            strokeWidth={2}
          />
        ))}
        <ellipse cx={1900} cy={1050} rx={1100} ry={650} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        <rect x={sweepX - 420} y={0} width={840} height={2160} fill="url(#sweepGrad)" />
        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Route layer — faint full path, glowing traveled path, pins, moving parcel
// ---------------------------------------------------------------------------
const RouteLayer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 40, fps);
  const travel = prog(frame, TRAVEL_START, TRAVEL_END);
  const eased = Easing.inOut(Easing.ease)(travel);
  const pts = useMemo(
    () => Array.from({length: SAMPLES + 1}, (_, i) => catmullRom(WAYPOINTS, i / SAMPLES)),
    [],
  );
  const drawn = Math.max(2, Math.floor(eased * SAMPLES));
  const traveled = pts.slice(0, drawn + 1);
  const parcel = catmullRom(WAYPOINTS, eased);
  const toStr = (list: Pt[]) => list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const delivered = prog(frame, 700, 740);
  const ringR = 26 + (frame % 40) * 1.6;
  const ringO = Math.max(0, 0.7 - ((frame % 40) / 40) * 0.7);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: e}}>
      <svg width={3840} height={2160}>
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={AMBER} />
            <stop offset="55%" stopColor={CYAN} />
            <stop offset="100%" stopColor={EMERALD} />
          </linearGradient>
          <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="parcelGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        {/* full faint route */}
        <polyline points={toStr(pts)} fill="none" stroke={HAIRLINE} strokeWidth={5} strokeDasharray="18 16" />
        {/* traveled glowing route */}
        <polyline
          points={toStr(traveled)}
          fill="none"
          stroke="url(#pathGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          filter="url(#pathGlow)"
          opacity={0.95}
        />
        <polyline
          points={toStr(traveled)}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.55}
        />
        {/* waypoint pins */}
        {WAYPOINTS.map((w, i) => {
          const a = entr(frame, w.arrive, fps);
          const passed = frame >= w.arrive;
          const col = i === WAYPOINTS.length - 1 ? EMERALD : passed ? CYAN : FAINT;
          const above = i % 2 === 0;
          return (
            <g key={w.name} opacity={a} transform={`translate(${w.x} ${w.y}) scale(${0.6 + 0.4 * a})`}>
              <circle r={44} fill={col} opacity={0.22} filter="url(#pathGlow)" />
              <circle r={20} fill={BG} stroke={col} strokeWidth={6} />
              <circle r={8} fill={col} />
              <text
                x={0}
                y={above ? -64 : 92}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={30}
                letterSpacing={3}
                fill={passed ? INK : FAINT}
              >
                {w.name}
              </text>
              <text
                x={0}
                y={above ? 96 : -58}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={28}
                fill={passed ? col : FAINT}
              >
                {w.time}
              </text>
            </g>
          );
        })}
        {/* moving parcel */}
        {travel < 1 && (
          <g transform={`translate(${parcel.x} ${parcel.y})`}>
            <circle r={ringR} fill="none" stroke={CYAN} strokeWidth={4} opacity={ringO} />
            <rect x={-30} y={-30} width={60} height={60} rx={14} fill={CYAN} opacity={0.5} filter="url(#parcelGlow)" />
            <rect x={-26} y={-26} width={52} height={52} rx={12} fill="#0B1626" stroke={CYAN} strokeWidth={5} />
            <line x1={0} y1={-26} x2={0} y2={26} stroke={CYAN} strokeWidth={4} />
            <line x1={-26} y1={0} x2={26} y2={0} stroke={CYAN} strokeWidth={4} />
          </g>
        )}
        {/* delivered burst */}
        {delivered > 0 && (
          <g transform={`translate(${WAYPOINTS[4].x} ${WAYPOINTS[4].y})`} opacity={delivered}>
            <circle r={70 + (1 - delivered) * 60} fill="none" stroke={EMERALD} strokeWidth={6} opacity={delivered} />
            <circle r={44} fill={EMERALD_DIM} stroke={EMERALD} strokeWidth={5} />
            <text x={0} y={16} textAnchor="middle" fontFamily={MONO} fontSize={52} fill={EMERALD}>
              ✓
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 20, fps);
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      <div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: CYAN, marginBottom: 14}}>
          LOGISTICS
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(34,211,238,0.35)',
          }}
        >
          Parcel Tracking
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: frame < 700 ? AMBER : EMERALD,
            opacity: pulse,
            boxShadow: `0 0 26px ${frame < 700 ? 'rgba(251,191,36,0.9)' : 'rgba(52,211,153,0.9)'}`,
          }}
        />
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 4, color: frame < 700 ? AMBER : EMERALD}}>
          {frame < 700 ? 'IN TRANSIT' : 'DELIVERED'}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tracking HUD (left panel)
// ---------------------------------------------------------------------------
const TrackingHud: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 80, fps);
  const travel = prog(frame, TRAVEL_START, TRAVEL_END);
  const pct = Math.round(travel * 100);
  const minsLeft = Math.round((1 - travel) * 380);
  const etaH = Math.floor(minsLeft / 60);
  const etaM = minsLeft % 60;
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 470,
        width: 880,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '52px 60px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: MUTED, marginBottom: 18}}>
        TRACKING ID
      </div>
      <div style={{fontFamily: MONO, fontSize: 40, color: INK, letterSpacing: 2, marginBottom: 44}}>
        {TRACK_ID}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 20}}>
        <div style={{fontFamily: MONO, fontSize: 120, fontWeight: 700, color: CYAN, textShadow: '0 4px 50px rgba(34,211,238,0.4)'}}>
          {pct}
          <span style={{fontSize: 60}}>%</span>
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, color: MUTED, letterSpacing: 2}}>
          {frame < 700 ? `ETA ${etaH}H ${etaM}M` : 'ARRIVED 14:32'}
        </div>
      </div>
      <div style={{height: 14, borderRadius: 7, background: 'rgba(148,163,184,0.15)', overflow: 'hidden'}}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 7,
            background: 'linear-gradient(90deg, #22D3EE, #34D399)',
            boxShadow: '0 0 24px rgba(34,211,238,0.7)',
          }}
        />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 36}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: FAINT, marginBottom: 8}}>FROM</div>
          <div style={{fontFamily: FONT, fontSize: 32, fontWeight: 600, color: INK}}>Origin Facility</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: FAINT, marginBottom: 8}}>TO</div>
          <div style={{fontFamily: FONT, fontSize: 32, fontWeight: 600, color: INK}}>Destination</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Waypoint checklist (bottom strip)
// ---------------------------------------------------------------------------
const WaypointStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 160, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        bottom: 150,
        display: 'flex',
        gap: 24,
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
      }}
    >
      {WAYPOINTS.map((w) => {
        const passed = frame >= w.arrive;
        const col = w.name === 'DESTINATION' ? EMERALD : CYAN;
        return (
          <div
            key={w.name}
            style={{
              flex: 1,
              background: passed ? (w.name === 'DESTINATION' ? EMERALD_DIM : CYAN_DIM) : 'rgba(10,16,30,0.7)',
              border: `1px solid ${passed ? col : HAIRLINE}`,
              borderRadius: 20,
              padding: '26px 30px',
              display: 'flex',
              alignItems: 'center',
              gap: 22,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                border: `3px solid ${passed ? col : FAINT}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 30,
                color: passed ? col : FAINT,
                flexShrink: 0,
              }}
            >
              {passed ? '✓' : '·'}
            </div>
            <div>
              <div style={{fontFamily: MONO, fontSize: 27, letterSpacing: 2, color: passed ? INK : FAINT}}>
                {w.name}
              </div>
              <div style={{fontFamily: MONO, fontSize: 26, color: passed ? col : FAINT, marginTop: 6}}>
                {passed ? w.time : 'PENDING'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Delivered banner
// ---------------------------------------------------------------------------
const DeliveredBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const a = stageOpacityLocal(frame, 720, 770, 880, 900);
  if (a <= 0) return null;
  const pop = spring({frame: Math.max(0, frame - 720), fps, config: {damping: 9, stiffness: 110}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 880,
        display: 'flex',
        justifyContent: 'center',
        opacity: a,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(5, 24, 17, 0.96)',
          border: '2px solid rgba(52,211,153,0.7)',
          borderRadius: 30,
          padding: '44px 110px',
          textAlign: 'center',
          transform: `scale(${0.7 + 0.3 * pop})`,
          boxShadow: '0 0 120px rgba(52,211,153,0.35), 0 30px 90px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{fontFamily: FONT, fontSize: 92, fontWeight: 800, color: EMERALD, letterSpacing: 2}}>
          ✓ DELIVERED
        </div>
        <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, marginTop: 18, letterSpacing: 3}}>
          SIGNED BY RECIPIENT · 14:32 · {TRACK_ID}
        </div>
      </div>
    </div>
  );
};

const stageOpacityLocal = (frame: number, inA: number, inB: number, outA: number, outB: number) =>
  prog(frame, inA, inB) * (1 - prog(frame, outA, outB));

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 27,
        letterSpacing: 4,
        color: FAINT,
        opacity: e,
      }}
    >
      <span>ROUTE MAP · STYLIZED</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;GPS PING 12S AGO</span>
      <span>TRACKING · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ParcelRouteTracking: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <RouteLayer frame={frame} fps={fps} />
      <Header frame={frame} fps={fps} />
      <TrackingHud frame={frame} fps={fps} />
      <WaypointStrip frame={frame} fps={fps} />
      <DeliveredBanner frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default ParcelRouteTracking;
