/**
 * MLTrainingDashboard.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * An ML training dashboard: descending train/val loss curves, a live epoch
 * counter, a climbing accuracy gauge, batch-size / learning-rate readouts,
 * and a streaming training log.
 *
 * Register in Root.tsx:
 *   <Composition id="MLTrainingDashboard" component={MLTrainingDashboard}
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
const BG = '#05070E';
const PANEL = 'rgba(10, 15, 28, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const VIOLET = '#A78BFA';
const CYAN = '#22D3EE';
const EMERALD = '#34D399';
const AMBER = '#FBBF24';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data — synthetic training curves, 40 points over 100 epochs
// ---------------------------------------------------------------------------
const N = 40;
const noise = (i: number, s: number) => (Math.sin(i * 127.1 + s) * 0.5 + 0.5 - 0.5) * 0.05;
const TRAIN_LOSS = Array.from({length: N}, (_, i) => 0.16 + 2.2 * Math.exp(-i / 7) + noise(i, 1.7) * (1 - i / N));
const VAL_LOSS = Array.from({length: N}, (_, i) => 0.28 + 2.2 * Math.exp(-i / 9) + noise(i, 4.2) * (1 - i / N) + 0.02 * Math.sin(i / 3));
const ACC = Array.from({length: N}, (_, i) => 94.2 - 33 * Math.exp(-i / 10) + noise(i, 8.8) * 30 * (1 - i / N));
const LOGS = [
  '[EPOCH  61/100] loss: 0.2418 - acc: 0.9031 - val_loss: 0.3122 - 41s',
  '[EPOCH  62/100] loss: 0.2389 - acc: 0.9044 - val_loss: 0.3098 - 41s',
  '[EPOCH  63/100] loss: 0.2355 - acc: 0.9057 - val_loss: 0.3071 - 42s',
  '[EPOCH  64/100] loss: 0.2321 - acc: 0.9072 - val_loss: 0.3049 - 41s',
  '[EPOCH  65/100] loss: 0.2294 - acc: 0.9081 - val_loss: 0.3026 - 41s',
  '[EPOCH  66/100] loss: 0.2260 - acc: 0.9095 - val_loss: 0.3004 - 42s',
  '[EPOCH  67/100] loss: 0.2233 - acc: 0.9106 - val_loss: 0.2987 - 41s',
  'lr_schedule: cosine decay 3.0e-04 -> 1.2e-05 | grad_norm: 1.84 OK',
];

// Loss chart geometry
const CX = 240;
const CW = 2000;
const CY = 430;
const CH = 900;
const LX = (i: number) => CX + 90 + (i / (N - 1)) * (CW - 180);
const LY = (v: number) => CY + CH - 90 - (v / 2.6) * (CH - 180);

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
const Background: React.FC<{frame: number}> = ({frame}) => {
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
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0" />
            <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={1300} cy={950} rx={1100} ry={700} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line key={'v' + i} x1={i * 320} y1={0} x2={i * 320} y2={2160} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 320} x2={3840} y2={i * 320} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        <rect x={sweepX - 420} y={0} width={840} height={2160} fill="url(#sweepGrad)" />
        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 20, fps);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.15);
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
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
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: VIOLET, marginBottom: 14}}>
          MACHINE LEARNING
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(167,139,250,0.30)',
          }}
        >
          Training Run
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: EMERALD,
            opacity: pulse,
            boxShadow: '0 0 28px rgba(52,211,153,0.9)',
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 32,
            letterSpacing: 3,
            color: INK,
            background: 'rgba(167,139,250,0.12)',
            border: '1px solid rgba(167,139,250,0.45)',
            borderRadius: 18,
            padding: '22px 36px',
          }}
        >
          RUN A-1147 · RESNET-152
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Loss chart
// ---------------------------------------------------------------------------
const LossChart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  const draw = prog(frame, 140, 700);
  const trainLine = useMemo(
    () => TRAIN_LOSS.map((v, i) => `${i === 0 ? 'M' : 'L'}${LX(i).toFixed(0)},${LY(v).toFixed(0)}`).join(' '),
    [],
  );
  const valLine = useMemo(
    () => VAL_LOSS.map((v, i) => `${i === 0 ? 'M' : 'L'}${LX(i).toFixed(0)},${LY(v).toFixed(0)}`).join(' '),
    [],
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: CX,
        top: CY,
        width: CW,
        height: CH,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '40px 60px 0 60px',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: MUTED}}>LOSS · 100 EPOCHS</div>
        <div style={{display: 'flex', gap: 40, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>
          <span style={{color: CYAN}}>— TRAIN</span>
          <span style={{color: VIOLET}}>— VALIDATION</span>
        </div>
      </div>
      <svg width={CW} height={CH - 110}>
        <defs>
          <filter id="lossGlow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        {[0.5, 1.0, 1.5, 2.0, 2.5].map((v) => (
          <g key={v}>
            <line x1={90} y1={LY(v)} x2={CW - 90} y2={LY(v)} stroke={HAIRLINE} strokeWidth={1} strokeDasharray="8 10" />
            <text x={62} y={LY(v) + 9} textAnchor="end" fontFamily={MONO} fontSize={25} fill={FAINT}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <path d={valLine} fill="none" stroke={VIOLET} strokeWidth={7} strokeLinecap="round" opacity={0.85 * draw} strokeDasharray={6000} strokeDashoffset={6000 * (1 - draw)} />
        <path d={trainLine} fill="none" stroke={CYAN} strokeWidth={9} strokeLinecap="round" filter="url(#lossGlow)" strokeDasharray={6000} strokeDashoffset={6000 * (1 - draw)} />
      </svg>
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: MONO,
          fontSize: 26,
          color: FAINT,
        }}
      >
        <span>EPOCH 0</span>
        <span style={{color: MUTED}}>CONVERGING · NO OVERFIT</span>
        <span>EPOCH 100</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right column
// ---------------------------------------------------------------------------
const RightColumn: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 180, fps);
  const epoch = Math.min(100, 1 + Math.floor(prog(frame, 100, 820) * 100));
  const accT = prog(frame, 200, 780);
  const acc = 61 + (94.2 - 61) * Easing.out(Easing.cubic)(accT);
  const gauge = prog(frame, 260, 760);
  const gAng = Math.PI + Easing.out(Easing.cubic)(gauge) * Math.PI;

  const params = [
    {k: 'BATCH SIZE', v: '256'},
    {k: 'LEARNING RATE', v: '3.0e-04'},
    {k: 'OPTIMIZER', v: 'ADAMW'},
    {k: 'GPUS', v: 'A100 × 4'},
    {k: 'GPU UTIL', v: '97%'},
    {k: 'ETA', v: '14 MIN'},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: 2360,
        top: 430,
        width: 1240,
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
      }}
    >
      {/* epoch counter */}
      <div
        style={{
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 28,
          padding: '32px 48px',
          marginBottom: 24,
          boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div>
          <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: MUTED, marginBottom: 8}}>
            EPOCH
          </div>
          <div style={{fontFamily: MONO, fontSize: 100, fontWeight: 700, color: INK, lineHeight: 1}}>
            {epoch}
            <span style={{fontSize: 48, color: FAINT}}>/100</span>
          </div>
        </div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: FAINT, marginBottom: 14}}>
            TRAINING PROGRESS
          </div>
          <div style={{height: 22, borderRadius: 11, background: 'rgba(148,163,184,0.15)', overflow: 'hidden'}}>
            <div
              style={{
                width: `${(epoch / 100) * 100}%`,
                height: '100%',
                borderRadius: 11,
                background: 'linear-gradient(90deg,#22D3EE,#A78BFA)',
                boxShadow: '0 0 24px rgba(34,211,238,0.6)',
              }}
            />
          </div>
        </div>
      </div>
      {/* accuracy gauge */}
      <div
        style={{
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 28,
          padding: '32px 48px',
          marginBottom: 24,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: MUTED, marginBottom: 8}}>
          VALIDATION ACCURACY
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <svg width={560} height={280}>
            <defs>
              <linearGradient id="accGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <path
              d={`M ${252 - 165} ${230} A ${165} ${165} 0 0 1 ${252 + 165} ${230}`}
              fill="none"
              stroke="rgba(148,163,184,0.15)"
              strokeWidth={40}
              strokeLinecap="round"
            />
            <path
              d={`M ${252 - 165} ${230} A ${165} ${165} 0 0 1 ${252 + 165} ${230}`}
              fill="none"
              stroke="url(#accGrad)"
              strokeWidth={40}
              strokeLinecap="round"
              strokeDasharray={Math.PI * 165}
              strokeDashoffset={Math.PI * 165 * (1 - Easing.out(Easing.cubic)(gauge))}
            />
            <line
              x1={252}
              y1={230}
              x2={252 + Math.cos(gAng) * 115}
              y2={230 + Math.sin(gAng) * 115}
              stroke={INK}
              strokeWidth={10}
              strokeLinecap="round"
            />
            <circle cx={252} cy={230} r={22} fill="#0B1220" stroke={INK} strokeWidth={5} />
          </svg>
          <div>
            <div style={{fontFamily: MONO, fontSize: 80, fontWeight: 700, color: EMERALD}}>
              {acc.toFixed(1)}%
            </div>
            <div style={{fontFamily: MONO, fontSize: 26, color: MUTED, letterSpacing: 2, marginTop: 8}}>
              ▲ +33.2 SINCE EPOCH 1
            </div>
          </div>
        </div>
      </div>
      {/* hyperparams */}
      <div
        style={{
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 28,
          padding: '32px 48px',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: MUTED, marginBottom: 22}}>
          HYPERPARAMETERS
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20}}>
          {params.map((p, i) => (
            <div
              key={p.k}
              style={{
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 14,
                padding: '18px 24px',
                opacity: entr(frame, 320 + i * 60, fps),
              }}
            >
              <div style={{fontFamily: MONO, fontSize: 21, letterSpacing: 3, color: FAINT, marginBottom: 8}}>
                {p.k}
              </div>
              <div style={{fontFamily: MONO, fontSize: 34, fontWeight: 700, color: INK}}>{p.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Training log console
// ---------------------------------------------------------------------------
const LogConsole: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 300, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 1390,
        height: 440,
        background: 'rgba(3, 6, 12, 0.95)',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 24,
        padding: '36px 52px',
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
        overflow: 'hidden',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: FAINT, marginBottom: 22}}>
        TRAINING LOG
      </div>
      {LOGS.map((l, i) => {
        const le = entr(frame, 360 + i * 55, fps);
        const highlight = l.startsWith('lr_schedule');
        return (
          <div
            key={i}
            style={{
              fontFamily: MONO,
              fontSize: 29,
              color: highlight ? AMBER : i === LOGS.length - 2 ? EMERALD : MUTED,
              marginBottom: 14,
              opacity: le,
              whiteSpace: 'nowrap',
            }}
          >
            {l}
          </div>
        );
      })}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 29,
          color: INK,
          opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.1)),
        }}
      >
        ▊
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
      <span>CHECKPOINT SAVED · EPOCH 60</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;EARLY STOPPING · PATIENCE 10</span>
      <span>ML OPS · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const MLTrainingDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <LossChart frame={frame} fps={fps} />
      <LogConsole frame={frame} fps={fps} />
      <RightColumn frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default MLTrainingDashboard;
