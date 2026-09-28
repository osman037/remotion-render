/**
 * ESignatureSigningFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * An electronic signature workflow on warm parchment: a contract descends,
 * "sign here" tabs pulse, an ink signature draws itself, fields check off,
 * the document folds into an envelope, a gold SIGNED seal slams down, an
 * audit trail writes out, and sealed copies land in both inboxes.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="ESignatureSigningFlow" component={ESignatureSigningFlow}
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
// Palette (parchment + ink + gold seal)
// ---------------------------------------------------------------------------
const BG = '#EFE6D2';
const PAPER = '#FFFDF6';
const INK = '#1C2B4A';
const MUTED = 'rgba(28,43,74,0.58)';
const FAINT = 'rgba(28,43,74,0.14)';
const GOLD = '#C9A227';
const GOLD_DEEP = '#9A7A14';
const SUCCESS = '#1F9D6B';
const SIGN_TAB = '#2B6CB0';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const DOC_DROP = 60;
const TABS_START = 190;
const SIGN_DRAW_START = 260;
const SIGN_DRAW_END = 430;
const FIELDS_START = 440;
const STAMP_DATE = 520;
const ENVELOPE_START = 580;
const SEAL_START = 680;
const AUDIT_START = 740;
const INBOX_START = 780;
const BANNER_START = 830;

const SIGN_PATH =
  'M 120 210 C 170 120, 200 260, 250 170 S 330 90, 350 200 ' +
  'S 430 250, 470 150 S 560 120, 590 190 ' +
  'M 470 235 C 560 215, 640 235, 720 205';

const FIELDS = [
  {label: 'SIGNATURE', x: 120, w: 620},
  {label: 'INITIALS', x: 120, w: 300},
  {label: 'DATE', x: 120, w: 300},
];

const AUDIT = [
  'identity verified',
  'timestamp 09:41:22 PKT',
  'tamper-evident seal',
  'audit trail stored',
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="parchGlow" cx="50%" cy="36%" r="72%">
      <stop offset="0%" stopColor="rgba(201,162,39,0.16)" />
      <stop offset="55%" stopColor="rgba(201,162,39,0.05)" />
      <stop offset="100%" stopColor="rgba(239,230,210,0)" />
    </radialGradient>
    <radialGradient id="parchVignette" cx="50%" cy="50%" r="76%">
      <stop offset="62%" stopColor="rgba(120,90,40,0)" />
      <stop offset="100%" stopColor="rgba(120,90,40,0.22)" />
    </radialGradient>
    <linearGradient id="goldSeal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={'#E8C95A'} />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD_DEEP} />
    </linearGradient>
    <linearGradient id="docSheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="rgba(255,255,255,0)" />
      <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="docShadow" x="-25%" y="-25%" width="150%" height="160%">
      <feDropShadow dx="0" dy="26" stdDeviation="34" floodColor="#1C2B4A" floodOpacity="0.28" />
    </filter>
    <filter id="sealGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  // Drifting dot grid — keeps large background regions from encoding too cleanly.
  // Drift wraps by exactly one grid period (96px), so the motion loops seamlessly.
  const drift = (frame * 0.6) % 96;
  const bgDots: JSX.Element[] = [];
  for (let gx = -1; gx <= 41; gx++) {
    for (let gy = 0; gy < 23; gy++) {
      bgDots.push(
        <circle key={`${gx}-${gy}`} cx={48 + gx * 96 - drift} cy={48 + gy * 96} r={2.4} fill="rgba(28,43,74,0.06)" />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#parchGlow)" />
        {bgDots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#parchVignette)" />
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
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        Sign it. Seal it. <span style={{color: GOLD_DEEP}}>Done.</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        ELECTRONIC SIGNATURE WORKFLOW
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The contract document
// ---------------------------------------------------------------------------
const DOC_W = 1180;
const DOC_H = 1380;
const DOC_X = (3840 - DOC_W) / 2;
const DOC_Y = 330;

const Document: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const drop = spring({frame: frame - DOC_DROP, fps, config: {damping: 200, stiffness: 55}});
  if (drop <= 0.001) return null;

  const env = spring({frame: frame - ENVELOPE_START, fps, config: {damping: 200, stiffness: 80}});
  const envT = Math.min(1, Math.max(0, env));
  // document folds into envelope: shrinks toward center-bottom
  const foldScale = 1 - envT * 0.62;
  const foldY = envT * 300;

  const signDraw = interpolate(frame, [SIGN_DRAW_START, SIGN_DRAW_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{
      position: 'absolute', left: DOC_X, top: DOC_Y + (1 - drop) * -900 + foldY,
      width: DOC_W, height: DOC_H,
      opacity: Math.min(1, drop) * (1 - interpolate(frame, [ENVELOPE_START + 60, ENVELOPE_START + 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
      transform: `scale(${foldScale})`,
      transformOrigin: 'center bottom',
    }}>
      <div style={{
        width: DOC_W, height: DOC_H, background: PAPER, borderRadius: 26,
        border: `2px solid ${FAINT}`, filter: 'url(#docShadow)',
        padding: '70px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <rect width={DOC_W} height={DOC_H} fill="url(#docSheen)" style={{position: 'absolute', top: 0, left: 0}} />
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 56}}>
          Services Agreement
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 2, marginTop: 10}}>
          CONTRACT #SA-2026-0914 &middot; 4 PAGES
        </div>
        {/* body text lines */}
        {Array.from({length: 9}).map((_, i) => {
          const lw = spring({frame: frame - (DOC_DROP + 60 + i * 18), fps, config: {damping: 200, stiffness: 140}});
          return (
            <div key={i} style={{
              height: 16, borderRadius: 8, background: FAINT, marginTop: 26,
              width: `${88 - (i % 3) * 14}%`,
              transform: `scaleX(${Math.min(1, Math.max(0, lw))})`,
              transformOrigin: 'left center',
            }} />
          );
        })}
        {/* signature fields */}
        <div style={{marginTop: 60}}>
          {FIELDS.map((f, i) => {
            const fs = spring({frame: frame - (FIELDS_START + i * 40), fps, config: {damping: 200, stiffness: 130}});
            if (fs <= 0.001) return null;
            const done = frame >= FIELDS_START + 120 + i * 40;
            return (
              <div key={f.label} style={{marginTop: 34, opacity: Math.min(1, fs)}}>
                <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>{f.label}</div>
                <div style={{
                  marginTop: 10, height: 74, width: f.w, borderRadius: 12,
                  border: `3px dashed ${done ? SUCCESS : SIGN_TAB}`,
                  background: done ? 'rgba(31,157,107,0.08)' : 'rgba(43,108,176,0.08)',
                  position: 'relative',
                }}>
                  {/* the drawn signature in the first field */}
                  {i === 0 && signDraw > 0 && (
                    <svg width={f.w} height={74} style={{position: 'absolute', top: -44, left: 0, overflow: 'visible'}}>
                      <path
                        d={SIGN_PATH}
                        fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round"
                        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - signDraw}
                      />
                    </svg>
                  )}
                  {i === 2 && frame >= STAMP_DATE && (
                    <div style={{
                      position: 'absolute', left: 20, top: 8,
                      color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 40,
                      opacity: interpolate(frame, [STAMP_DATE, STAMP_DATE + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                    }}>
                      SEP 28, 2026
                    </div>
                  )}
                  {done && (
                    <div style={{
                      position: 'absolute', right: -26, top: -26,
                      width: 64, height: 64, borderRadius: '50%', background: SUCCESS,
                      color: '#fff', fontSize: 38, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>&#10003;</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* pulsing sign-here tabs (outside the clipped paper so they stick out fully) */}
      {frame >= TABS_START && frame < ENVELOPE_START && (
        <div style={{position: 'absolute', right: -70, top: 560}}>
          {[0, 1, 2].map((i) => {
            const tabOn = frame >= TABS_START + i * 60 && frame < FIELDS_START + 120 + i * 40;
            if (!tabOn) return null;
            const pulse = 1 + 0.08 * Math.sin(frame * 0.3);
            return (
              <div key={i} style={{
                marginTop: i === 0 ? 0 : 120,
                background: SIGN_TAB, color: '#fff',
                fontFamily: MONO, fontWeight: 800, fontSize: 30, letterSpacing: 2,
                padding: '18px 26px', borderRadius: '0 14px 14px 0',
                transform: `scale(${pulse})`, transformOrigin: 'left center',
                boxShadow: '0 0 30px rgba(43,108,176,0.6)',
              }}>
                SIGN HERE
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Envelope + gold SIGNED seal
// ---------------------------------------------------------------------------
const Envelope: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (ENVELOPE_START + 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const seal = spring({frame: frame - SEAL_START, fps, config: {damping: 110, stiffness: 220}});
  const sealScale = seal <= 0.001 ? 2.4 : 2.4 - 1.4 * Math.min(1, seal);
  const impact = frame >= SEAL_START && frame < SEAL_START + 10;

  const EW = 900; const EH = 620;
  const EX = (3840 - EW) / 2; const EY = 830;

  return (
    <div style={{
      position: 'absolute', left: EX, top: EY,
      width: EW, height: EH,
      opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 80}px) scale(${0.9 + 0.1 * s}) ${impact ? 'translateY(14px)' : ''}`,
    }}>
      <svg width={EW} height={EH} viewBox={`0 0 ${EW} ${EH}`}>
        <rect x={8} y={8} width={EW - 16} height={EH - 16} rx={28} fill={PAPER} stroke={FAINT} strokeWidth={3} filter="url(#docShadow)" />
        <path d={`M 8 36 L ${EW / 2} ${EH * 0.62} L ${EW - 8} 36`} fill="none" stroke={FAINT} strokeWidth={4} />
        <path d={`M 8 ${EH - 36} L ${EW * 0.38} ${EH * 0.55} M ${EW - 8} ${EH - 36} L ${EW * 0.62} ${EH * 0.55}`} fill="none" stroke={FAINT} strokeWidth={4} />
        {seal > 0.001 && (
          <g transform={`translate(${EW / 2} ${EH * 0.58}) scale(${sealScale})`} opacity={Math.min(1, seal)} filter="url(#sealGlow)">
            <circle r={104} fill="url(#goldSeal)" stroke={GOLD_DEEP} strokeWidth={6} />
            <circle r={84} fill="none" stroke={PAPER} strokeWidth={4} opacity={0.8} />
            <text y={-8} textAnchor="middle" fill={PAPER} fontSize={40} fontFamily={FONT} fontWeight={800} letterSpacing={3}>SIGNED</text>
            <text y={34} textAnchor="middle" fill={PAPER} fontSize={24} fontFamily={MONO} letterSpacing={2}>09&middot;28&middot;2026</text>
          </g>
        )}
      </svg>
      {impact && (
        <div style={{
          position: 'absolute', left: EW / 2 - 260, top: EH * 0.58 - 12,
          width: 520, height: 24, borderRadius: 12,
          background: 'rgba(201,162,39,0.5)', filter: 'blur(10px)',
        }} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Audit trail typing out
// ---------------------------------------------------------------------------
const AuditTrail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - AUDIT_START, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, top: 1560, width: 3840,
      display: 'flex', justifyContent: 'center', gap: 34,
      opacity: Math.min(1, s),
    }}>
      {AUDIT.map((a, i) => {
        const as = spring({frame: frame - (AUDIT_START + 20 + i * 44), fps, config: {damping: 200, stiffness: 140}});
        if (as <= 0.001) return null;
        return (
          <div key={a} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: PAPER, border: `2px solid ${FAINT}`, borderRadius: 999,
            padding: '20px 38px',
            opacity: Math.min(1, as),
            transform: `translateY(${(1 - as) * 26}px)`,
          }}>
            <span style={{color: SUCCESS, fontSize: 32, fontWeight: 800}}>&#10003;</span>
            <span style={{color: INK, fontFamily: MONO, fontSize: 30}}>{a}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inbox copies: sealed doc flies to YOU and CLIENT
// ---------------------------------------------------------------------------
const Inboxes: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - INBOX_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const sides = [
    {label: 'YOUR INBOX', x: 300},
    {label: 'CLIENT INBOX', x: 3840 - 300 - 560},
  ];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      {sides.map((sd, i) => {
        const fly = spring({frame: frame - (INBOX_START + 40 + i * 60), fps, config: {damping: 200, stiffness: 70}});
        if (fly <= 0.001) return null;
        const fx = interpolate(fly, [0, 1], [1920, sd.x + 280]);
        const fy = interpolate(fly, [0, 1], [1140, 420]);
        return (
          <div key={sd.label}>
            {/* inbox tray */}
            <div style={{
              position: 'absolute', left: sd.x, top: 620, width: 560, height: 300,
              background: PAPER, borderRadius: 28, border: `2px solid ${FAINT}`,
              filter: 'url(#docShadow)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>{sd.label}</div>
              <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 44}}>
                Agreement.pdf
              </div>
              {fly > 0.85 && (
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: SUCCESS,
                  color: '#fff', fontSize: 36, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: interpolate(fly, [0.85, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                }}>&#10003;</div>
              )}
            </div>
            {/* flying sealed copy */}
            {fly < 1 && (
              <div style={{
                position: 'absolute', left: fx - 90, top: fy - 60,
                width: 180, height: 120, background: PAPER,
                border: `2px solid ${GOLD}`, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(201,162,39,0.5)',
                opacity: 1 - interpolate(fly, [0.8, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              }}>
                <span style={{color: GOLD_DEEP, fontFamily: FONT, fontWeight: 800, fontSize: 30}}>SIGNED</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve banner
// ---------------------------------------------------------------------------
const ResolveBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - BANNER_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 110, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: INK, borderRadius: 999, padding: '30px 90px',
        display: 'flex', alignItems: 'center', gap: 30,
        boxShadow: '0 18px 60px rgba(28,43,74,0.35)',
      }}>
        <span style={{
          width: 56, height: 56, borderRadius: '50%', background: SUCCESS,
          color: '#fff', fontSize: 34, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: 1}}>
          Legally binding &mdash; complete
        </span>
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

export const ESignatureSigningFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Document frame={frame} fps={fps} />
      <Envelope frame={frame} fps={fps} />
      <AuditTrail frame={frame} fps={fps} />
      <Inboxes frame={frame} fps={fps} />
      <ResolveBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default ESignatureSigningFlow;
