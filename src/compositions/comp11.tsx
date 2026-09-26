/**
 * FinancialNewsGraphics.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A financial news broadcast package: index cards with animated counters,
 * an intraday chart, rotating headline lower thirds, a top-movers panel,
 * and a scrolling market ticker tape. All names are fictional.
 *
 * Register in Root.tsx:
 *   <Composition id="FinancialNewsGraphics" component={FinancialNewsGraphics}
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
const BG = '#070B16';
const PANEL = 'rgba(12, 18, 36, 0.94)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#F2F5FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const RED = '#EF4444';
const GREEN = '#22C55E';
const GOLD = '#FBBF24';
const BLUE = '#3B82F6';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data — fictional
// ---------------------------------------------------------------------------
const INDICES = [
  {name: 'TECH 100', base: 8412.55, chg: 1.24, color: GREEN},
  {name: 'GLOBAL 500', base: 4208.31, chg: 0.86, color: GREEN},
  {name: 'ENERGY 25', base: 1904.12, chg: -0.42, color: RED},
];
const MOVERS = [
  {sym: 'HLX', name: 'HELIX LABS', chg: 6.42, up: true},
  {sym: 'ORB', name: 'ORBITAL', chg: 4.18, up: true},
  {sym: 'NWD', name: 'NORTHWIND', chg: 2.94, up: true},
  {sym: 'VNT', name: 'VANTACORE', chg: -1.86, up: false},
  {sym: 'FRN', name: 'FERNWORKS', chg: -3.24, up: false},
];
const TAPE = [
  {sym: 'TECH 100', px: '8,412.55', chg: '+1.24%'},
  {sym: 'GLOBAL 500', px: '4,208.31', chg: '+0.86%'},
  {sym: 'ENERGY 25', px: '1,904.12', chg: '-0.42%'},
  {sym: 'NWD', px: '142.80', chg: '+2.94%'},
  {sym: 'HLX', px: '96.44', chg: '+6.42%'},
  {sym: 'BLP', px: '210.15', chg: '+0.72%'},
  {sym: 'VNT', px: '88.30', chg: '-1.86%'},
  {sym: 'ORB', px: '64.92', chg: '+4.18%'},
];
const HEADLINES = [
  {kicker: 'MARKETS', text: 'Tech rally lifts indexes to record close', tag: 'LIVE'},
  {kicker: 'POLICY', text: 'Central bank holds rates steady, cites inflation progress', tag: 'UPDATE'},
  {kicker: 'ENERGY', text: 'Energy sector slips as supply outlook weighs', tag: 'DEVELOPING'},
];
// intraday line for TECH 100 (fictional)
const INTRA = Array.from({length: 60}, (_, i) => {
  const base = 0.4 + (i / 59) * 1.1;
  return base + Math.sin(i / 5) * 0.18 + Math.sin(i / 11 + 2) * 0.1;
});

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

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC = () => (
  <AbsoluteFill>
    <svg width={3840} height={2160}>
      <defs>
        <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </radialGradient>
        <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="150" />
        </filter>
      </defs>
      <ellipse cx={1920} cy={900} rx={1400} ry={800} fill="url(#bgGlowA)" filter="url(#softBlur)" />
      <rect width={3840} height={2160} fill="url(#vignette)" />
    </svg>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 10, fps);
  const secs = Math.floor(frame / 60);
  const clock = `09:${String(30 + Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.15);
  return (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 22,
            background: 'linear-gradient(135deg,#EF4444,#991B1B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            color: '#FFF',
            boxShadow: '0 0 50px rgba(239,68,68,0.5)',
          }}
        >
          FN
        </div>
        <div>
          <div style={{fontFamily: FONT, fontSize: 64, fontWeight: 800, color: INK, letterSpacing: -1}}>
            Financial News
          </div>
          <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: MUTED, marginTop: 6}}>
            MARKET COVERAGE
          </div>
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
        <div
          style={{
            background: RED,
            color: '#FFF',
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 4,
            padding: '20px 40px',
            borderRadius: 14,
            opacity: 0.65 + 0.35 * pulse,
            boxShadow: '0 0 40px rgba(239,68,68,0.6)',
          }}
        >
          ● LIVE
        </div>
        <div style={{fontFamily: MONO, fontSize: 52, fontWeight: 700, color: INK}}>{clock} ET</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Index cards
// ---------------------------------------------------------------------------
const IndexCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 300,
        display: 'flex',
        gap: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
      }}
    >
      {INDICES.map((idx, i) => {
        const ce = entr(frame, 100 + i * 80, fps);
        const t = Easing.out(Easing.cubic)(prog(frame, 120 + i * 80, 420 + i * 80));
        const val = idx.base * (1 + (idx.chg / 100) * t);
        return (
          <div
            key={idx.name}
            style={{
              flex: 1,
              background: PANEL,
              border: `1px solid ${HAIRLINE}`,
              borderLeft: `8px solid ${idx.color}`,
              borderRadius: 20,
              padding: '36px 48px',
              opacity: ce,
              boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: MUTED, marginBottom: 14}}>
              {idx.name}
            </div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 28}}>
              <div style={{fontFamily: MONO, fontSize: 76, fontWeight: 700, color: INK}}>
                {val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: idx.color}}>
                {idx.chg > 0 ? '▲' : '▼'} {Math.abs(idx.chg).toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Intraday chart
// ---------------------------------------------------------------------------
const IntraChart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 200, fps);
  const draw = prog(frame, 240, 640);
  const W = 2200;
  const H = 620;
  const X = (i: number) => 60 + (i / (INTRA.length - 1)) * (W - 120);
  const Y = (v: number) => H - 60 - (v / 1.8) * (H - 140);
  const line = useMemo(
    () => INTRA.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' '),
    [],
  );
  const area = `${line} L${X(INTRA.length - 1).toFixed(1)},${H - 60} L${X(0).toFixed(1)},${H - 60} Z`;
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 640,
        width: W,
        height: 760,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 24,
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '36px 56px 0 56px'}}>
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: MUTED}}>
          TECH 100 · INTRADAY
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: GREEN}}>
          ▲ +1.24% <span style={{color: FAINT, fontSize: 28}}>TODAY</span>
        </div>
      </div>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="intraArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
          <filter id="intraGlow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        <path d={area} fill="url(#intraArea)" opacity={draw} />
        <path
          d={line}
          fill="none"
          stroke={GREEN}
          strokeWidth={8}
          strokeLinecap="round"
          filter="url(#intraGlow)"
          strokeDasharray={6000}
          strokeDashoffset={6000 * (1 - draw)}
        />
      </svg>
      {/* rotating headline lower third */}
      <HeadlineLowerThird frame={frame} fps={fps} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rotating headline lower third
// ---------------------------------------------------------------------------
const HeadlineLowerThird: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const slot = Math.floor(frame / 300) % HEADLINES.length;
  const local = frame % 300;
  const inE = entr(local, 8, fps);
  const outFade = local > 262 ? 1 - (local - 262) / 38 : 1;
  const h = HEADLINES[slot];
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        right: 56,
        bottom: 40,
        opacity: Math.min(inE, Math.max(0, outFade)),
        transform: `translateY(${(1 - inE) * 70}px)`,
      }}
    >
      <div
        style={{
          background: 'rgba(4, 8, 18, 0.94)',
          borderLeft: `10px solid ${RED}`,
          borderRadius: 16,
          padding: '30px 44px',
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            background: RED,
            color: '#FFF',
            fontFamily: MONO,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 3,
            padding: '14px 26px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {h.tag}
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: GOLD, whiteSpace: 'nowrap'}}>
          {h.kicker}
        </div>
        <div style={{fontFamily: FONT, fontSize: 42, fontWeight: 700, color: INK}}>{h.text}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Top movers panel
// ---------------------------------------------------------------------------
const Movers: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 260, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 2560,
        top: 640,
        width: 1040,
        height: 760,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 24,
        padding: '44px 52px',
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED, marginBottom: 28}}>
        TOP MOVERS
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}>
        {MOVERS.map((m, i) => {
          const re = entr(frame, 320 + i * 70, fps);
          return (
            <div
              key={m.sym}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: re,
                transform: `translateX(${(1 - re) * 50}px)`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
                <div
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 18,
                    background: m.up ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)',
                    border: `1px solid ${m.up ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 30,
                    fontWeight: 700,
                    color: m.up ? GREEN : RED,
                  }}
                >
                  {m.sym}
                </div>
                <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 600, color: INK}}>{m.name}</div>
              </div>
              <div style={{fontFamily: MONO, fontSize: 44, fontWeight: 700, color: m.up ? GREEN : RED}}>
                {m.up ? '+' : ''}{m.chg.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticker tape
// ---------------------------------------------------------------------------
const TickerTape: React.FC<{frame: number}> = ({frame}) => {
  const items = [...TAPE, ...TAPE];
  const x = interpolate(frame, [0, 900], [0, -50], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 130,
        height: 110,
        background: 'rgba(3, 6, 14, 0.97)',
        borderTop: `2px solid ${HAIRLINE}`,
        borderBottom: `2px solid ${HAIRLINE}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{display: 'flex', transform: `translateX(${x}%)`, whiteSpace: 'nowrap'}}>
        {items.map((t, i) => {
          const up = !t.chg.startsWith('-');
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', padding: '0 60px'}}>
              <span style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK, marginRight: 28}}>
                {t.sym}
              </span>
              <span style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginRight: 28}}>{t.px}</span>
              <span style={{fontFamily: MONO, fontSize: 36, fontWeight: 700, color: up ? GREEN : RED}}>
                {t.chg}
              </span>
              <span style={{fontFamily: MONO, fontSize: 36, color: FAINT, marginLeft: 60}}>///</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
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
      <span>DELAYED 15 MIN</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;FICTIONAL DATA · DEMO ONLY</span>
      <span>FINANCIAL NEWS · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const FinancialNewsGraphics: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background />
      <Header frame={frame} fps={fps} />
      <IndexCards frame={frame} fps={fps} />
      <IntraChart frame={frame} fps={fps} />
      <Movers frame={frame} fps={fps} />
      <TickerTape frame={frame} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default FinancialNewsGraphics;
