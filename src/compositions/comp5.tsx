/**
 * PasswordHealthAudit.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral credential security AUDIT visual for IT trainers and MSPs:
 * a credential inventory is scanned row by row, each account gets a
 * strength-score ring and a verdict chip (WEAK / REUSED / BREACHED / STRONG),
 * findings are tallied, a remediation checklist hardens the posture, and the
 * payoff is an overall Credential Health Score arc rising 41 -> 92 with 2FA
 * shields lighting green. No real passwords are ever shown - only masked dots.
 *
 * Register in Root.tsx:
 *   <Composition id="PasswordHealthAudit" component={PasswordHealthAudit}
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
// Palette (dark security console)
// ---------------------------------------------------------------------------
const BG = '#060B12';
const INK = '#EAF2FB';
const MUTED = 'rgba(234,242,251,0.58)';
const CYAN = '#38E1FF';
const CYAN_DIM = 'rgba(56,225,255,0.16)';
const WEAK = '#F87171';
const REUSED = '#FBBF24';
const BREACHED = '#E11D48';
const STRONG = '#34D399';
const PANEL = 'rgba(10,18,30,0.86)';
const HAIRLINE = 'rgba(234,242,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const ROW_START = 24;       // first account row enters
const ROW_GAP = 14;         // stagger between rows
const SCAN_START = 170;     // audit sweep begins
const SCAN_STEP = 46;       // frames per account verdict
const SUMMARY_START = 560;  // findings tally counts up
const CHECK_START = 430;    // remediation checklist begins
const CHECK_GAP = 58;
const SCORE_START = 580;    // health score arc payoff
const SCORE_END = 740;
const RESOLVE_START = 810;  // final banner

// ---------------------------------------------------------------------------
// Data: 8 generic accounts, 3 weak / 2 reused / 1 breached / 2 strong
// ---------------------------------------------------------------------------
type Verdict = 'WEAK' | 'REUSED' | 'BREACHED' | 'STRONG';
interface Account {
  name: string;
  entropy: number; // bits
  score: number;   // 0-100
  verdict: Verdict;
}
const ACCOUNTS: Account[] = [
  {name: 'Corporate Email', entropy: 58.2, score: 92, verdict: 'STRONG'},
  {name: 'VPN Gateway', entropy: 31.4, score: 38, verdict: 'WEAK'},
  {name: 'Cloud Console', entropy: 44.7, score: 74, verdict: 'REUSED'},
  {name: 'Code Repository', entropy: 52.9, score: 85, verdict: 'STRONG'},
  {name: 'Banking', entropy: 27.8, score: 51, verdict: 'WEAK'},
  {name: 'CRM', entropy: 41.3, score: 44, verdict: 'REUSED'},
  {name: 'Wi-Fi Admin', entropy: 19.5, score: 22, verdict: 'BREACHED'},
  {name: 'Backup Service', entropy: 35.6, score: 61, verdict: 'WEAK'},
];

const VERDICT_COLOR: Record<Verdict, string> = {
  WEAK: WEAK,
  REUSED: REUSED,
  BREACHED: BREACHED,
  STRONG: STRONG,
};

const CHECKLIST = [
  'ROTATE BREACHED CREDENTIALS',
  'ENABLE 2FA ON ALL ACCOUNTS',
  'DEPLOY PASSPHRASE POLICY',
  'REVIEW IN 90 DAYS',
];

const SHIELDS = ['EMAIL', 'VPN', 'BANKING', 'CLOUD'];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="paGlow" cx="42%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(56,225,255,0.13)" />
      <stop offset="55%" stopColor="rgba(56,225,255,0.035)" />
      <stop offset="100%" stopColor="rgba(6,11,18,0)" />
    </radialGradient>
    <radialGradient id="paVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,6,10,0)" />
      <stop offset="100%" stopColor="rgba(2,4,8,0.74)" />
    </radialGradient>
    <linearGradient id="paScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(56,225,255,0)" />
      <stop offset="50%" stopColor="rgba(56,225,255,0.20)" />
      <stop offset="100%" stopColor="rgba(56,225,255,0)" />
    </linearGradient>
    <linearGradient id="paScoreArc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={WEAK} />
      <stop offset="45%" stopColor={REUSED} />
      <stop offset="100%" stopColor={STRONG} />
    </linearGradient>
    <filter id="paGlow12" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="paShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.6" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: vignette + cyan radial glow + drifting shimmer dot grid +
// audit scan sweep + per-frame tickers
// ---------------------------------------------------------------------------
const ROWS_TOP = 560;
const ROW_H = 168;
const ROWS_BOTTOM = ROWS_TOP + 8 * ROW_H;

const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.35) % 140;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 28; gx++) {
    for (let gy = 0; gy <= 16; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.07 + gx * 0.8 + gy * 1.2);
      dots.push(
        <circle
          key={`${gx}-${gy}`}
          cx={gx * 140 - driftX}
          cy={gy * 140 + 40}
          r={2.4}
          fill="#38E1FF"
          opacity={shimmer}
        />
      );
    }
  }
  // Audit sweep travels down the account rows during the build phase.
  const scanProg = interpolate(frame, [SCAN_START, SCAN_START + 8 * SCAN_STEP], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanY = ROWS_TOP + scanProg * (ROWS_BOTTOM - ROWS_TOP);
  const scanOn = frame >= SCAN_START && frame < SCORE_START;
  // Bytes-scanned ticker (per-frame counter for pixel motion).
  const bytes = Math.floor(interpolate(frame, [SCAN_START, SCORE_START], [0, 1843200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const tick = ((frame * 2.4) % 2400) - 200;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#paGlow)" />
        {dots}
        {scanOn && (
          <g>
            <rect x={0} y={scanY - 110} width={3840} height={220} fill="url(#paScan)" />
            <line x1={0} y1={scanY} x2={3840} y2={scanY} stroke={CYAN} strokeWidth={3} opacity={0.75} filter="url(#paGlow12)" />
          </g>
        )}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#paVignette)" />
        {/* per-frame scrolling telemetry strip, bottom */}
        <g opacity={0.5}>
          <text x={tick} y={2108} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={2}>
            SCAN ENGINE v4.2 &middot; SHA-256 SALT CHECK &middot; BREACH CORPUS 14.7B RECORDS &middot; ENTROPY FLOOR 40 BITS &middot; ZERO-TRUST POLICY &middot; BYTES SCANNED {bytes.toLocaleString('en-US')}
          </text>
          <text x={tick + 2400} y={2108} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={2}>
            SCAN ENGINE v4.2 &middot; SHA-256 SALT CHECK &middot; BREACH CORPUS 14.7B RECORDS &middot; ENTROPY FLOOR 40 BITS &middot; ZERO-TRUST POLICY &middot; BYTES SCANNED {bytes.toLocaleString('en-US')}
          </text>
        </g>
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar + live status HUD
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 44], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scanProg = interpolate(frame, [SCAN_START, SCAN_START + 8 * SCAN_STEP], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const done = frame >= SCORE_START;
  return (
    <div style={{position: 'absolute', top: 0, left: 0, width: 3840, opacity: fade}}>
      <div style={{position: 'absolute', top: 84 + rise, left: 200}}>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 80, letterSpacing: -1.5}}>
          Credential Health <span style={{color: CYAN}}>Audit</span>
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 4, marginTop: 14}}>
          SECURITY POSTURE SCAN &middot; 8 ACCOUNTS &middot; NO PLAINTEXT STORED
        </div>
      </div>
      <div style={{position: 'absolute', top: 96 + rise, right: 200, textAlign: 'right'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>STATUS</div>
        <div
          style={{
            color: done ? STRONG : CYAN,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 52,
            marginTop: 10,
            textShadow: done ? `0 0 28px ${STRONG}88` : `0 0 28px ${CYAN}88`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {done ? 'AUDIT COMPLETE' : `SCANNING ${Math.floor(scanProg)}%`}
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 8}}>
          {done ? '6 findings logged' : 'comparing salted hashes vs breach corpus'}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Account rows: inventory -> audit verdicts (score rings + verdict chips)
// ---------------------------------------------------------------------------
const PANEL_LEFT = 200;
const PANEL_W = 1900;
const ROW_INNER_H = 148;

const AccountRows: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 8, fps, config: {damping: 200, stiffness: 70}});
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: PANEL_LEFT,
        top: ROWS_TOP,
        width: PANEL_W,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 60}px)`,
      }}
    >
      <div
        style={{
          background: PANEL,
          borderRadius: 30,
          border: `2px solid ${HAIRLINE}`,
          filter: 'url(#paShadow)',
          backdropFilter: 'blur(6px)',
          padding: '34px 40px 40px',
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18}}>
          <span style={{color: CYAN, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>CREDENTIAL INVENTORY</span>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>8 logins &middot; masked</span>
        </div>
        {ACCOUNTS.map((acc, i) => {
          const rs = spring({frame: frame - (ROW_START + i * ROW_GAP), fps, config: {damping: 170, stiffness: 110}});
          if (rs <= 0.001) return null;
          const verdictStart = SCAN_START + i * SCAN_STEP;
          const vs = spring({frame: frame - verdictStart, fps, config: {damping: 160, stiffness: 120}});
          const ringDraw = interpolate(frame, [verdictStart, verdictStart + 55], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const ringVal = Math.round(acc.score * ringDraw);
          const color = VERDICT_COLOR[acc.verdict];
          const y = 86 + i * ROW_H;
          // Entropy jitter while its row is being audited (per-frame motion).
          const jitter = frame >= verdictStart && frame < verdictStart + SCAN_STEP
            ? 1.6 * Math.sin(frame * 0.5 + i * 1.7)
            : 0;
          const flash = frame >= verdictStart && frame < verdictStart + 8;
          return (
            <div
              key={acc.name}
              style={{
                position: 'absolute',
                left: 40,
                top: y,
                width: PANEL_W - 80,
                height: ROW_INNER_H,
                borderRadius: 20,
                background: flash ? 'rgba(56,225,255,0.10)' : 'rgba(234,242,251,0.028)',
                border: `1.5px solid ${flash ? CYAN_DIM : HAIRLINE}`,
                opacity: Math.min(1, rs),
                transform: `translateX(${(1 - rs) * -70}px)`,
              }}
            >
              <svg width={PANEL_W - 80} height={ROW_INNER_H} style={{position: 'absolute', top: 0, left: 0}}>
                {/* index */}
                <text x={36} y={88} fill={MUTED} fontSize={30} fontFamily={MONO} fontWeight={700}>
                  {String(i + 1).padStart(2, '0')}
                </text>
                {/* account name */}
                <text x={110} y={72} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={700}>
                  {acc.name}
                </text>
                {/* masked credential (never real passwords) */}
                <text x={110} y={118} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={3}>
                  &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
                </text>
                {/* entropy bits, data-driven per account */}
                <text x={700} y={72} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={2}>
                  ENTROPY
                </text>
                <text x={700} y={116} fill={acc.verdict === 'STRONG' ? STRONG : INK} fontSize={36} fontFamily={MONO} fontWeight={700} style={{fontVariantNumeric: 'tabular-nums'}}>
                  {(acc.entropy + jitter).toFixed(1)} bits
                </text>
                {/* strength-score ring */}
                {vs > 0.001 && (
                  <g transform="translate(1230, 74)" opacity={Math.min(1, vs)}>
                    <circle cx={0} cy={0} r={52} fill="none" stroke={HAIRLINE} strokeWidth={11} />
                    <circle
                      cx={0}
                      cy={0}
                      r={52}
                      fill="none"
                      stroke={color}
                      strokeWidth={11}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1 - (ringVal / 100)}
                      transform="rotate(-90)"
                      filter="url(#paGlow12)"
                    />
                    <text x={0} y={14} textAnchor="middle" fill={INK} fontSize={38} fontFamily={MONO} fontWeight={800} style={{fontVariantNumeric: 'tabular-nums'}}>
                      {ringVal}
                    </text>
                  </g>
                )}
                {/* verdict chip */}
                {vs > 0.35 && (
                  <g transform={`translate(1420, 34) scale(${0.7 + 0.3 * Math.min(1, vs)})`} opacity={Math.min(1, vs)}>
                    <rect x={0} y={0} width={320} height={80} rx={40} fill={`${color}1F`} stroke={color} strokeWidth={2.5} />
                    <circle cx={48} cy={40} r={13} fill={color} />
                    <text x={76} y={53} fill={color} fontSize={32} fontFamily={MONO} fontWeight={800} letterSpacing={2}>
                      {acc.verdict}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right column: findings tally + remediation checklist
// ---------------------------------------------------------------------------
const RIGHT_LEFT = 2280;
const RIGHT_W = 1360;

const AuditSummary: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const counts: {label: Verdict | 'SCANNED'; n: number; color: string}[] = [
    {label: 'WEAK', n: 3, color: WEAK},
    {label: 'REUSED', n: 2, color: REUSED},
    {label: 'BREACHED', n: 1, color: BREACHED},
    {label: 'STRONG', n: 2, color: STRONG},
  ];
  const scanned = Math.floor(
    interpolate(frame, [SCAN_START, SCAN_START + 8 * SCAN_STEP], [0, 8], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: RIGHT_LEFT,
        top: ROWS_TOP,
        width: RIGHT_W,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 60}px)`,
      }}
    >
      <div
        style={{
          background: PANEL,
          borderRadius: 30,
          border: `2px solid ${HAIRLINE}`,
          filter: 'url(#paShadow)',
          backdropFilter: 'blur(6px)',
          padding: '34px 44px',
        }}
      >
        <div style={{color: CYAN, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>AUDIT FINDINGS</div>
        <div style={{marginTop: 22}}>
          {counts.map((c, k) => {
            const target = frame >= SUMMARY_START + k * 26 ? c.n : 0;
            const shown = Math.floor(
              interpolate(frame, [SUMMARY_START + k * 26, SUMMARY_START + k * 26 + 40], [0, target], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            );
            return (
              <div
                key={c.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: k === 0 ? 0 : 14,
                }}
              >
                <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>
                  <span style={{color: c.color, fontWeight: 800}}>&#9632;</span> {c.label}
                </span>
                <span
                  style={{
                    color: c.color,
                    fontFamily: MONO,
                    fontWeight: 800,
                    fontSize: 58,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: `0 0 20px ${c.color}66`,
                  }}
                >
                  {shown}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 20, paddingTop: 18, borderTop: `1.5px solid ${HAIRLINE}`}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>CREDENTIALS SCANNED</span>
            <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52, fontVariantNumeric: 'tabular-nums'}}>
              {scanned}<span style={{color: MUTED, fontSize: 32}}>/8</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Remediation: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 90, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const top = ROWS_TOP + 560;
  return (
    <div
      style={{
        position: 'absolute',
        left: RIGHT_LEFT,
        top,
        width: RIGHT_W,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 60}px)`,
      }}
    >
      <div
        style={{
          background: PANEL,
          borderRadius: 30,
          border: `2px solid ${HAIRLINE}`,
          filter: 'url(#paShadow)',
          backdropFilter: 'blur(6px)',
          padding: '34px 44px 40px',
        }}
      >
        <div style={{color: STRONG, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>REMEDIATION CHECKLIST</div>
        <div style={{marginTop: 20}}>
          {CHECKLIST.map((item, i) => {
            const start = CHECK_START + i * CHECK_GAP;
            const on = frame >= start;
            const cs = spring({frame: frame - start, fps, config: {damping: 150, stiffness: 130}});
            if (cs <= 0.001) return null;
            return (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 26,
                  marginTop: i === 0 ? 0 : 20,
                  opacity: on ? 1 : 0.3,
                  transform: `scale(${0.92 + 0.08 * Math.min(1, cs)})`,
                  transformOrigin: 'left center',
                }}
              >
                <span
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: on ? STRONG : 'rgba(234,242,251,0.10)',
                    color: '#060B12',
                    fontSize: 38,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: on ? `0 0 26px ${STRONG}99` : 'none',
                  }}
                >
                  {on ? '\u2713' : '\u00B7'}
                </span>
                <span
                  style={{
                    color: on ? INK : MUTED,
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 36,
                    letterSpacing: 1,
                  }}
                >
                  {item}
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
// Payoff: Credential Health Score arc 41 -> 92 + 2FA shields
// ---------------------------------------------------------------------------
const Shield: React.FC<{x: number; label: string; frame: number; start: number; fps: number}> = ({
  x,
  label,
  frame,
  start,
  fps,
}) => {
  const s = spring({frame: frame - start, fps, config: {damping: 150, stiffness: 120}});
  if (s <= 0.001) return null;
  const lit = frame >= start;
  const pulse = lit ? 0.6 + 0.4 * Math.sin(frame * 0.12 + start * 0.05) : 0;
  return (
    <g transform={`translate(${x}, 0)`} opacity={Math.min(1, s)}>
      <path
        d="M 0 -64 L 56 -38 L 56 12 C 56 48 28 72 0 84 C -28 72 -56 48 -56 12 L -56 -38 Z"
        fill={lit ? 'rgba(52,211,153,0.14)' : 'rgba(234,242,251,0.05)'}
        stroke={lit ? STRONG : HAIRLINE}
        strokeWidth={5}
        style={lit ? {filter: `drop-shadow(0 0 ${18 + pulse * 14}px ${STRONG})`} : undefined}
      />
      {lit && (
        <text x={0} y={24} textAnchor="middle" fill={STRONG} fontSize={56} fontWeight={800}>
          {'\u2713'}
        </text>
      )}
      {!lit && (
        <text x={0} y={22} textAnchor="middle" fill={MUTED} fontSize={44} fontWeight={700} fontFamily={MONO}>
          2FA
        </text>
      )}
      <text x={0} y={128} textAnchor="middle" fill={lit ? STRONG : MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} fontWeight={700}>
        {label}
      </text>
    </g>
  );
};

const HealthScore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = interpolate(frame, [SCORE_START - 40, SCORE_START + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exit = interpolate(frame, [RESOLVE_START - 20, RESOLVE_START + 40], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const vis = enter * exit;
  if (vis <= 0.001) return null;
  const score = Math.round(
    interpolate(frame, [SCORE_START, SCORE_END], [41, 92], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const arcProg = interpolate(frame, [SCORE_START, SCORE_END], [0.41, 0.92], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = 0.9 + 0.1 * enter;
  const cx = 1920;
  const cy = 1010;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: 'rgba(3,6,10,0.80)', opacity: vis}} />
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0, opacity: vis, transform: `scale(${scale})`, transformOrigin: '1920px 1010px'}}
      >
        <text x={cx} y={380} textAnchor="middle" fill={CYAN} fontSize={34} fontFamily={MONO} letterSpacing={6}>
          POSTURE AFTER REMEDIATION
        </text>
        <text x={cx} y={470} textAnchor="middle" fill={INK} fontSize={72} fontFamily={FONT} fontWeight={800} letterSpacing={-1}>
          Credential Health Score
        </text>
        {/* score arc */}
        <g transform={`translate(${cx}, ${cy})`}>
          <circle cx={0} cy={0} r={300} fill="none" stroke={HAIRLINE} strokeWidth={40} />
          <circle
            cx={0}
            cy={0}
            r={300}
            fill="none"
            stroke="url(#paScoreArc)"
            strokeWidth={40}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - arcProg}
            transform="rotate(135)"
            filter="url(#paGlow12)"
          />
          {/* arc track ticks */}
          {Array.from({length: 41}).map((_, k) => {
            const a = (135 + k * (270 / 40)) * (Math.PI / 180);
            const inner = k % 5 === 0 ? 348 : 358;
            return (
              <line
                key={k}
                x1={Math.cos(a) * inner}
                y1={Math.sin(a) * inner}
                x2={Math.cos(a) * 372}
                y2={Math.sin(a) * 372}
                stroke={k / 40 <= arcProg ? STRONG : HAIRLINE}
                strokeWidth={k % 5 === 0 ? 6 : 3}
              />
            );
          })}
        </g>
        <text
          x={cx}
          y={cy + 58}
          textAnchor="middle"
          fill={INK}
          fontSize={180}
          fontFamily={MONO}
          fontWeight={800}
          style={{textShadow: `0 0 60px ${STRONG}77`, fontVariantNumeric: 'tabular-nums'}}
        >
          {score}
        </text>
        <text x={cx} y={cy + 130} textAnchor="middle" fill={MUTED} fontSize={36} fontFamily={MONO} letterSpacing={4}>
          / 100
        </text>
        <text x={cx} y={1520} textAnchor="middle" fill={STRONG} fontSize={40} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
          {'\u2713'} 2FA ENABLED ON ALL ACCOUNTS
        </text>
        <g transform={`translate(${cx - 540}, 1660)`}>
          {SHIELDS.map((label, i) => (
            <Shield key={label} x={i * 360} label={label} frame={frame} fps={fps} start={SCORE_START + 60 + i * 34} />
          ))}
        </g>
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Resolve banner
// ---------------------------------------------------------------------------
const ResolveBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 95}});
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 92,
        left: 0,
        width: 3840,
        display: 'flex',
        justifyContent: 'center',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 50}px)`,
      }}
    >
      <div
        style={{
          background: 'rgba(52,211,153,0.10)',
          border: `2.5px solid ${STRONG}`,
          borderRadius: 999,
          padding: '30px 100px',
          display: 'flex',
          alignItems: 'center',
          gap: 50,
          boxShadow: `0 0 60px ${STRONG}44`,
        }}
      >
        <span
          style={{
            width: 66,
            height: 66,
            borderRadius: '50%',
            background: STRONG,
            color: '#060B12',
            fontSize: 42,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {'\u2713'}
        </span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 50, letterSpacing: 2}}>
          AUDIT COMPLETE &middot; 6 FINDINGS REMEDIATED &middot; SCORE 92/100
        </span>
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
    const s = 2 + random(`pa-grain-s-${frame}-${i}`) * 2.5;
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
export const PasswordHealthAudit: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <AccountRows frame={frame} fps={fps} />
      <AuditSummary frame={frame} fps={fps} />
      <Remediation frame={frame} fps={fps} />
      <HealthScore frame={frame} fps={fps} />
      <ResolveBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
