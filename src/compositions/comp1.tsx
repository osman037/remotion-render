/**
 * PasswordManagerExplainer.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A password manager story on dark slate: "password123" types out and
 * shatters (cracked in 0.02 seconds), a generator assembles a strong
 * passphrase word by word while a strength meter climbs to green, saved
 * passwords fly into a vault that locks with a key-turn, then one master
 * key unlocks it and a credential autofills into a login form - one password
 * to remember. Payoff on vault/autofill, no timer visuals.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="PasswordManagerExplainer" component={PasswordManagerExplainer}
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
// Palette (dark slate + cyan)
// ---------------------------------------------------------------------------
const BG = '#0C1424';
const INK = '#EAF1FB';
const MUTED = 'rgba(234,241,251,0.60)';
const CYAN = '#38E1FF';
const CYAN_DEEP = '#0E7FA8';
const RED = '#FF5D5D';
const SUCCESS = '#34D399';
const GOLD = '#E8B44A';
const GOLD_DEEP = '#9A7A14';
const PANEL = 'rgba(18,28,48,0.80)';
const HAIRLINE = 'rgba(234,241,251,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const WEAK_START = 60;
const WEAK_TYPE_END = 150;
const CRACK_START = 190;
const GEN_START = 300;
const METER_START = 420;
const VAULT_START = 520;
const LOCK_START = 640;
const KEY_START = 700;
const AUTOFILL_START = 740;
const SHIELD_START = 810;
const RESOLVE_START = 850;

const WEAK = 'password123';
const WORDS = ['harbor', 'lantern', '47', 'comet'];
const SAVED_SITES = ['mail', 'bank', 'shop', 'cloud', 'work', 'social'];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="pmGlow" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stopColor="rgba(56,225,255,0.12)" />
      <stop offset="55%" stopColor="rgba(56,225,255,0.04)" />
      <stop offset="100%" stopColor="rgba(12,20,36,0)" />
    </radialGradient>
    <radialGradient id="pmVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(4,8,16,0)" />
      <stop offset="100%" stopColor="rgba(4,8,16,0.72)" />
    </radialGradient>
    <linearGradient id="goldVault" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={'#F2D47E'} />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD_DEEP} />
    </linearGradient>
    <filter id="cyanGlow2" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow8" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC = () => (
  <>
    <AbsoluteFill style={{backgroundColor: BG}} />
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <rect x={0} y={0} width={3840} height={2160} fill="url(#pmGlow)" />
      <rect x={0} y={0} width={3840} height={2160} fill="url(#pmVignette)" />
    </svg>
  </>
);

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        One password <span style={{color: CYAN}}>to remember</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        PASSWORD MANAGER &middot; HOW IT WORKS
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Weak password types out, then cracks and shatters
// ---------------------------------------------------------------------------
const WeakPassword: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - WEAK_START, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;

  const typed = Math.min(WEAK.length, Math.floor((frame - WEAK_START) / ((WEAK_TYPE_END - WEAK_START) / WEAK.length)));
  const crack = spring({frame: frame - CRACK_START, fps, config: {damping: 200, stiffness: 120}});
  const shattered = frame >= CRACK_START + 50;

  // crack shards
  const shards = [0, 1, 2, 3, 4, 5];
  const dirs = [
    [-1, -1], [1, -1.4], [-1.4, 0.6], [1.2, 0.8], [-0.5, 1.4], [0.7, -0.6],
  ];

  return (
    <div style={{
      position: 'absolute', left: 200, top: 400, width: 1600,
      opacity: Math.min(1, s) * (shattered ? interpolate(frame, [CRACK_START + 50, CRACK_START + 110], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1),
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>TYPICAL PASSWORD</div>
      <div style={{
        marginTop: 18, background: PANEL, borderRadius: 26,
        border: `3px solid ${crack > 0.3 ? RED : HAIRLINE}`,
        padding: '44px 56px', filter: 'url(#panelShadow8)',
        position: 'relative', overflow: 'visible',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 6, minHeight: 110}}>
          {WEAK.slice(0, Math.max(0, typed)).split('').map((ch, i) => {
            const dir = dirs[i % dirs.length];
            const fly = shattered ? Math.min(1, (frame - CRACK_START - 50) / 40) : 0;
            return (
              <span key={i} style={{
                color: crack > 0.3 ? RED : INK,
                fontFamily: MONO, fontWeight: 800, fontSize: 88,
                display: 'inline-block',
                transform: fly > 0
                  ? `translate(${dir[0] * fly * 260}px, ${dir[1] * fly * 200}px) rotate(${fly * dir[0] * 120}deg)`
                  : 'none',
                opacity: 1 - fly * 0.4,
                textShadow: crack > 0.3 ? '0 0 30px rgba(255,93,93,0.6)' : 'none',
              }}>
                {ch}
              </span>
            );
          })}
          {typed < WEAK.length && frame < CRACK_START && (
            <span style={{
              width: 8, height: 96, background: CYAN, marginLeft: 8,
              opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0.15,
            }} />
          )}
        </div>
        {/* crack lines */}
        {crack > 0.3 && !shattered && (
          <svg width={1488} height={220} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            {[
              'M 300 20 L 420 120 L 380 220',
              'M 700 10 L 640 130 L 760 220',
              'M 1100 30 L 1020 140 L 1120 220',
            ].map((d, i) => (
              <path key={i} d={d} fill="none" stroke={RED} strokeWidth={6}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, crack)}
                filter="url(#cyanGlow2)" />
            ))}
          </svg>
        )}
      </div>
      {crack > 0.5 && (
        <div style={{
          marginTop: 22, display: 'flex', alignItems: 'center', gap: 20,
          opacity: interpolate(frame, [CRACK_START + 10, CRACK_START + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>
          <span style={{
            background: RED, color: '#fff', fontFamily: MONO, fontWeight: 800,
            fontSize: 36, padding: '12px 30px', borderRadius: 12,
          }}>
            CRACKED IN 0.02 SECONDS
          </span>
          <span style={{color: MUTED, fontFamily: FONT, fontSize: 30}}>
            reused on 14 sites
          </span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Generator: passphrase words slot in, strength meter climbs
// ---------------------------------------------------------------------------
const Generator: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - GEN_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const meter = interpolate(frame, [METER_START, METER_START + 120], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bits = Math.round(interpolate(frame, [METER_START, METER_START + 120], [0, 128], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }));

  return (
    <div style={{
      position: 'absolute', left: 2040, top: 400, width: 1600,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>GENERATED FOR YOU</div>
      <div style={{
        marginTop: 18, background: PANEL, borderRadius: 26,
        border: `2px solid ${HAIRLINE}`, padding: '44px 56px', filter: 'url(#panelShadow8)',
      }}>
        <div style={{display: 'flex', gap: 18, flexWrap: 'wrap'}}>
          {WORDS.map((w, i) => {
            const ws = spring({frame: frame - (GEN_START + 30 + i * 46), fps, config: {damping: 200, stiffness: 150}});
            if (ws <= 0.001) return null;
            return (
              <span key={w} style={{
                background: 'rgba(56,225,255,0.10)', border: `2px solid ${CYAN}`,
                borderRadius: 16, padding: '18px 34px',
                color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52,
                opacity: Math.min(1, ws),
                transform: `translateY(${(1 - Math.min(1, ws)) * -30}px)`,
                boxShadow: '0 0 30px rgba(56,225,255,0.25)',
              }}>
                {w}
              </span>
            );
          })}
        </div>
        {/* strength meter */}
        <div style={{marginTop: 36}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 14}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 2}}>STRENGTH</span>
            <span style={{
              color: meter > 0.8 ? SUCCESS : meter > 0.4 ? '#FFB020' : RED,
              fontFamily: MONO, fontWeight: 800, fontSize: 40,
            }}>
              {meter > 0.8 ? 'STRONG' : meter > 0.4 ? 'FAIR' : 'WEAK'}
            </span>
          </div>
          <div style={{height: 40, borderRadius: 20, background: 'rgba(234,241,251,0.08)', overflow: 'hidden', border: `2px solid ${HAIRLINE}`}}>
            <div style={{
              height: '100%', width: `${meter * 100}%`, borderRadius: 20,
              background: meter > 0.8 ? SUCCESS : meter > 0.4 ? 'linear-gradient(90deg,#C77E0A,#FFB020)' : RED,
              boxShadow: meter > 0.8 ? '0 0 30px rgba(52,211,153,0.5)' : 'none',
            }} />
          </div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 12}}>
            {bits}-bit entropy &middot; {Math.round(bits * 3.2)} trillion trillion guesses
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Vault: passwords fly in, door locks with key turn
// ---------------------------------------------------------------------------
const Vault: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (VAULT_START - 60), fps, config: {damping: 200, stiffness: 75}});
  if (s <= 0.001) return null;
  const lockT = interpolate(frame, [LOCK_START, LOCK_START + 60], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const locked = lockT >= 1;

  const VX = 200; const VY = 1080; const VW = 1100; const VH = 760;

  return (
    <div style={{
      position: 'absolute', left: VX, top: VY, width: VW,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3, marginBottom: 18}}>
        YOUR ENCRYPTED VAULT
      </div>
      <div style={{position: 'relative', width: VW, height: VH}}>
        <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}>
          {/* vault body */}
          <rect x={20} y={20} width={VW - 40} height={VH - 40} rx={40}
            fill="#1A2438" stroke={locked ? SUCCESS : GOLD} strokeWidth={8} />
          <rect x={20} y={20} width={VW - 40} height={VH - 40} rx={40}
            fill="none" stroke={GOLD} strokeWidth={3} opacity={0.4} />
          {/* door */}
          <g transform={`translate(${VW / 2} ${VH / 2})`}>
            <circle r={220} fill="#0E1830" stroke={GOLD} strokeWidth={10} />
            {/* spokes rotate as it locks */}
            <g transform={`rotate(${lockT * 120})`}>
              {[0, 60, 120].map((a) => (
                <rect key={a} x={-26} y={-210} width={52} height={420} rx={26}
                  fill="url(#goldVault)" opacity={0.9}
                  transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r={70} fill="url(#goldVault)" stroke={GOLD_DEEP} strokeWidth={6} />
            <circle r={26} fill="#0E1830" />
          </g>
          {/* flying passwords */}
          {SAVED_SITES.map((site, i) => {
            const start = VAULT_START + i * 40;
            const t = interpolate(frame, [start, start + 70], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            if (t <= 0 || t >= 1) return null;
            const fx = interpolate(t, [0, 1], [VW + 300, VW / 2]);
            const fy = interpolate(t, [0, 1], [120 + i * 90, VH / 2]);
            return (
              <g key={site} opacity={1 - t * 0.3}>
                <rect x={fx - 130} y={fy - 44} width={260} height={88} rx={18}
                  fill={PANEL} stroke={CYAN} strokeWidth={3} />
                <text x={fx} y={fy + 12} textAnchor="middle" fill={INK} fontSize={36} fontFamily={MONO} fontWeight={700}>
                  {site}
                </text>
              </g>
            );
          })}
        </svg>
        {locked && (
          <div style={{
            position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center',
            opacity: interpolate(frame, [LOCK_START + 40, LOCK_START + 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}>
            <span style={{
              background: 'rgba(52,211,153,0.14)', border: `2px solid ${SUCCESS}`,
              color: SUCCESS, fontFamily: MONO, fontWeight: 800, fontSize: 36,
              padding: '14px 44px', borderRadius: 999, letterSpacing: 2,
            }}>
              256-BIT ENCRYPTED &middot; LOCKED
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Master key unlocks -> autofill into login form
// ---------------------------------------------------------------------------
const Autofill: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (KEY_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const keyTurn = interpolate(frame, [KEY_START, KEY_START + 50], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const unlocked = keyTurn >= 1;
  const fillUser = interpolate(frame, [AUTOFILL_START, AUTOFILL_START + 40], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const fillPass = interpolate(frame, [AUTOFILL_START + 40, AUTOFILL_START + 90], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const shield = spring({frame: frame - SHIELD_START, fps, config: {damping: 150, stiffness: 160}});

  const LX = 1520; const LW = 1920;

  return (
    <div style={{
      position: 'absolute', left: LX, top: 1080, width: LW,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{display: 'flex', gap: 60, alignItems: 'flex-start'}}>
        {/* master key */}
        <div style={{textAlign: 'center', paddingTop: 30}}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            <g transform={`rotate(${keyTurn * 90} 110 110)`}>
              <circle cx={110} cy={70} r={44} fill="none" stroke={GOLD} strokeWidth={18} />
              <rect x={101} y={110} width={18} height={90} fill={GOLD} />
              <rect x={101} y={150} width={44} height={16} fill={GOLD} />
              <rect x={101} y={180} width={34} height={16} fill={GOLD} />
            </g>
          </svg>
          <div style={{color: unlocked ? SUCCESS : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 32, marginTop: 12}}>
            {unlocked ? 'UNLOCKED' : 'MASTER KEY'}
          </div>
        </div>
        {/* login form */}
        <div style={{
          flex: 1, background: PANEL, borderRadius: 30, padding: '48px 56px',
          border: `2px solid ${fillPass >= 1 ? SUCCESS : HAIRLINE}`,
          filter: 'url(#panelShadow8)',
          boxShadow: fillPass >= 1 ? '0 0 60px rgba(52,211,153,0.25)' : 'none',
        }}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>SIGN IN &middot; AUTOFILL</div>
          <div style={{
            marginTop: 24, borderRadius: 16, border: `2px solid ${HAIRLINE}`,
            padding: '26px 34px', background: 'rgba(234,241,251,0.04)',
          }}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 2}}>USERNAME</div>
            <div style={{color: INK, fontFamily: MONO, fontSize: 44, fontWeight: 700, marginTop: 6, minHeight: 60}}>
              {'danish.khan@mail.com'.slice(0, Math.floor(fillUser * 21))}
              {fillUser < 1 && <span style={{opacity: Math.sin(frame * 0.4) > 0 ? 1 : 0.15, color: CYAN}}>|</span>}
            </div>
          </div>
          <div style={{
            marginTop: 20, borderRadius: 16, border: `2px solid ${HAIRLINE}`,
            padding: '26px 34px', background: 'rgba(234,241,251,0.04)',
          }}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 2}}>PASSWORD</div>
            <div style={{color: INK, fontFamily: MONO, fontSize: 44, fontWeight: 700, marginTop: 6, minHeight: 60, letterSpacing: 8}}>
              {'\u2022'.repeat(Math.floor(fillPass * 16))}
            </div>
          </div>
          {fillPass >= 1 && (
            <div style={{
              marginTop: 24, borderRadius: 16, padding: '24px',
              background: SUCCESS, textAlign: 'center',
              opacity: interpolate(frame, [AUTOFILL_START + 90, AUTOFILL_START + 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}>
              <span style={{color: '#0B1220', fontFamily: FONT, fontWeight: 800, fontSize: 44}}>
                Signed in securely
              </span>
            </div>
          )}
        </div>
      </div>
      {/* shield checkmark */}
      {shield > 0.001 && (
        <div style={{
          position: 'absolute', right: 40, top: -40,
          transform: `scale(${0.5 + 0.5 * Math.min(1, shield)})`,
          opacity: Math.min(1, shield),
        }}>
          <svg width={190} height={210} viewBox="0 0 190 210">
            <path d="M95 8 L172 42 V118 C172 166 136 192 95 206 C54 192 18 166 18 118 V42 Z"
              fill="rgba(52,211,153,0.14)" stroke={SUCCESS} strokeWidth={9} filter="url(#cyanGlow2)" />
            <path d="M66 108 L88 132 L126 88" fill="none" stroke={SUCCESS} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
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
      position: 'absolute', bottom: 92, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: PANEL, border: `2px solid ${CYAN}`, borderRadius: 999,
        padding: '28px 90px', display: 'flex', alignItems: 'center', gap: 40,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: CYAN,
          color: '#0B1220', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 52}}>
          One password to remember &mdash; the manager handles the rest
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

export const PasswordManagerExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background />
      <TitleBar frame={frame} />
      <WeakPassword frame={frame} fps={fps} />
      <Generator frame={frame} fps={fps} />
      <Vault frame={frame} fps={fps} />
      <Autofill frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default PasswordManagerExplainer;
