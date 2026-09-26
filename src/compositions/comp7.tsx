/**
 * RAGPipelineFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Animates a retrieval-augmented generation pipeline: documents are
 * ingested, split into chunks, embedded as vectors, indexed in a
 * glowing point cloud, queried, and the top-3 retrieved chunks ground
 * a synthesized answer with cited source spans.
 *
 * Register in Root.tsx:
 *   <Composition id="RAGPipelineFlow" component={RAGPipelineFlow}
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
const BG = '#070512';
const INK = '#EDEAFB';
const MUTED = 'rgba(196,188,230,0.62)';
const FAINT = 'rgba(196,188,230,0.38)';
const VIOLET = '#A78BFA';
const CYAN = '#22D3EE';
const GREEN = '#34D399';
const GOLD = '#FBBF24';
const PANEL = 'rgba(16,12,34,0.82)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Deterministic seeded random (never Math.random)
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
interface Doc {
  name: string;
  kind: string;
  lines: number[];
}
const DOCS: Doc[] = [
  {name: 'policy-doc.pdf', kind: 'PDF · 48 pages · 2.1 MB', lines: [460, 420, 470, 380, 440]},
  {name: 'faq-page.html', kind: 'HTML · 12 sections · 640 KB', lines: [430, 470, 400, 450, 390]},
  {name: 'support-macros.txt', kind: 'TXT · 214 macros · 96 KB', lines: [470, 390, 440, 420, 400]},
];
// chunk i is sourced from document CHUNK_SRC[i]
const CHUNK_SRC = [0, 1, 2, 0, 1, 2, 0, 1];
const chunkName = (i: number) => `chunk-${String(i + 1).padStart(2, '0')}`;

const RETRIEVED = [
  {chunk: 1, score: '0.91'},
  {chunk: 4, score: '0.87'},
  {chunk: 6, score: '0.84'},
];

const QUERY_TEXT = 'What is the Q3 refund policy?';
const ANSWER_LINES = [
  'Refunds are processed within 14 days of',
  'request. Digital goods are eligible within',
  '72 hours of purchase.',
];
const ANSWER_TOTAL = ANSWER_LINES.join('').length;

const CITATIONS = [
  {tag: '[1]', text: 'policy-doc §4.2 — refund window'},
  {tag: '[2]', text: 'faq-page §1 — eligibility'},
  {tag: '[3]', text: 'support-macro §7 — processing time'},
];

const STAGES = [
  'DOCUMENTS',
  'CHUNKING',
  'EMBEDDINGS',
  'VECTOR INDEX',
  'RETRIEVAL',
  'GROUNDED ANSWER',
];

// Embedding zone geometry (shared by zone + retrieval flight)
const EMB_COL_X = [1320, 1580];
const EMB_BASE_Y = [880, 1140, 1400, 1660];
const embGroupCenter = (chunk: number) => ({
  x: EMB_COL_X[chunk % 2] + 105,
  y: EMB_BASE_Y[Math.floor(chunk / 2)] - 90,
});

// Answer panel retrieved-chip landing slots
const SLOT_X = [2470, 2890, 3310];
const SLOT_Y = 1078;
const SLOT_W = 400;
const SLOT_H = 110;
const slotCenter = (k: number) => ({x: SLOT_X[k] + SLOT_W / 2, y: SLOT_Y + SLOT_H / 2});

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlowViolet" cx="30%" cy="28%" r="70%">
      <stop offset="0%" stopColor="rgba(167,139,250,0.15)" />
      <stop offset="55%" stopColor="rgba(167,139,250,0.04)" />
      <stop offset="100%" stopColor="rgba(7,5,18,0)" />
    </radialGradient>
    <radialGradient id="bgGlowCyan" cx="78%" cy="70%" r="65%">
      <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
      <stop offset="55%" stopColor="rgba(34,211,238,0.03)" />
      <stop offset="100%" stopColor="rgba(7,5,18,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor="rgba(7,5,18,0)" />
      <stop offset="100%" stopColor="rgba(2,1,8,0.74)" />
    </radialGradient>
    <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(167,139,250,0.14)" />
      <stop offset="100%" stopColor="rgba(167,139,250,0.03)" />
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor="#6D28D9" />
      <stop offset="100%" stopColor="#C4B5FD" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#FBBF24" />
      <stop offset="100%" stopColor="#F59E0B" />
    </linearGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bigGlow" x="-120%" y="-120%" width="340%" height="340%">
      <feGaussianBlur stdDeviation="26" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: dark base + glows + vignette + drifting particles + scan sweep
// ---------------------------------------------------------------------------
interface Particle {
  x: number;
  y: number;
  r: number;
  o: number;
  sp: number;
  c: string;
}
const Background: React.FC<{frame: number}> = ({frame}) => {
  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(20260926);
    return Array.from({length: 38}, () => ({
      x: rand() * 3840,
      y: rand() * 2160,
      r: 2 + rand() * 4.5,
      o: 0.05 + rand() * 0.1,
      sp: 0.15 + rand() * 0.6,
      c: rand() > 0.5 ? VIOLET : CYAN,
    }));
  }, []);
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlowViolet)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlowCyan)" />
        {particles.map((p, i) => (
          <circle
            key={i}
            cx={(p.x + frame * p.sp) % 3840}
            cy={p.y}
            r={p.r}
            fill={p.c}
            opacity={p.o}
          />
        ))}
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(167,139,250,0.045)" />
        <line x1={0} y1={scanY} x2={3840} y2={scanY} stroke="rgba(167,139,250,0.18)" strokeWidth={2} />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar (0-60)
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 45], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 96 + rise, left: 150, opacity: fade}}>
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 80,
          letterSpacing: -1,
          textShadow: '0 0 44px rgba(167,139,250,0.35)',
        }}
      >
        RETRIEVAL-AUGMENTED GENERATION
      </div>
      <div style={{marginTop: 18, display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 120, height: 6, borderRadius: 3, background: 'linear-gradient(90deg,#A78BFA,#22D3EE)'}} />
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 34, letterSpacing: 1}}>
          chunk &#8594; embed &#8594; retrieve &#8594; rerank &#8594; synthesize
        </div>
      </div>
      <div style={{position: 'absolute', left: 2400, top: 0, width: 1290, textAlign: 'right'}}>
        <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 2}}>
          PIPELINE rag-v3 &middot; EMBED 1536-dim &middot; INDEX cosine
        </div>
        <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 2, marginTop: 10}}>
          retrieval latency 84 ms &middot; rerank top-8 &#8594; top-3
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage band: six pills + moving dashed flow line (60-220)
// ---------------------------------------------------------------------------
const StageBand: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const lineFade = interpolate(frame, [60, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <line
        x1={150}
        y1={560}
        x2={3700}
        y2={560}
        stroke={VIOLET}
        strokeWidth={3}
        strokeDasharray="16 20"
        strokeDashoffset={-frame * 2}
        opacity={lineFade * 0.55}
      />
      {STAGES.map((label, i) => {
        const s = spring({frame: frame - (60 + i * 26), fps, config: {damping: 200, stiffness: 90}});
        if (s <= 0.001) return null;
        const x = 150 + i * 606;
        const active = i === 5;
        return (
          <g key={label} opacity={Math.min(1, s)} transform={`translate(0, ${(1 - s) * 34})`}>
            <rect
              x={x}
              y={505}
              width={520}
              height={110}
              rx={55}
              fill={active ? 'rgba(52,211,153,0.10)' : 'rgba(16,12,34,0.92)'}
              stroke={active ? GREEN : 'rgba(167,139,250,0.45)'}
              strokeWidth={active ? 3 : 2}
              style={{filter: `drop-shadow(0 0 18px ${active ? 'rgba(52,211,153,0.35)' : 'rgba(167,139,250,0.25)'})`}}
            />
            <text x={x + 44} y={576} fill={active ? GREEN : VIOLET} fontSize={30} fontFamily={MONO} fontWeight={700}>
              {String(i + 1).padStart(2, '0')}
            </text>
            <text x={x + 116} y={576} fill={INK} fontSize={33} fontFamily={FONT} fontWeight={700} letterSpacing={1}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Zone chrome: separator hairlines + column captions (120-200)
// ---------------------------------------------------------------------------
const ZONE_CAPTIONS: [number, string][] = [
  [425, 'INGEST'],
  [1000, 'SPLIT'],
  [1550, 'ENCODE'],
  [2100, 'INDEX'],
  [3050, 'QUERY + SYNTHESIZE'],
];
const ZoneChrome: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [130, 200], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (fade <= 0) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {[725, 1275, 1825, 2375].map((x) => (
        <line key={x} x1={x} y1={700} x2={x} y2={1780} stroke="rgba(167,139,250,0.12)" strokeWidth={1.5} />
      ))}
      {ZONE_CAPTIONS.map(([cx, label]) => (
        <text key={label} x={cx} y={676} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={5} textAnchor="middle">
          {label}
        </text>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// DOCUMENTS zone: three stacked document cards (120-200)
// ---------------------------------------------------------------------------
const DOC_Y = [740, 1080, 1420];
const DocsZone: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    {DOCS.map((doc, i) => {
      const s = spring({frame: frame - (120 + i * 25), fps, config: {damping: 200, stiffness: 90}});
      if (s <= 0.001) return null;
      const y = DOC_Y[i];
      return (
        <g key={doc.name} opacity={Math.min(1, s)} transform={`translate(${(1 - s) * -60}, 0)`}>
          <rect x={150} y={y} width={550} height={300} rx={20} fill="url(#docGrad)" stroke="rgba(167,139,250,0.30)" strokeWidth={2} />
          {/* folded-page icon */}
          <g>
            <rect x={190} y={y + 42} width={76} height={96} rx={6} fill="rgba(237,234,251,0.10)" stroke={INK} strokeWidth={2.5} />
            <path d={`M 242 ${y + 42} L 266 ${y + 42} L 266 ${y + 66} Z`} fill={VIOLET} opacity={0.85} />
            {[0, 1, 2].map((l) => (
              <line key={l} x1={200} y1={y + 92 + l * 14} x2={256} y2={y + 92 + l * 14} stroke={MUTED} strokeWidth={3} strokeLinecap="round" />
            ))}
          </g>
          <text x={292} y={y + 92} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={700}>
            {doc.name}
          </text>
          <text x={292} y={y + 136} fill={MUTED} fontSize={26} fontFamily={MONO}>
            {doc.kind}
          </text>
          {doc.lines.map((w, l) => (
            <rect key={l} x={190} y={y + 178 + l * 24} width={w} height={10} rx={5} fill="rgba(196,188,230,0.20)" />
          ))}
          <circle cx={648} cy={y + 264} r={9} fill={GREEN} opacity={0.9} />
          <text x={622} y={y + 272} fill={GREEN} fontSize={24} fontFamily={MONO} textAnchor="end">
            parsed
          </text>
        </g>
      );
    })}
  </svg>
);

// ---------------------------------------------------------------------------
// CHUNKING zone: 8 chunk chips flying out of the docs (200-320)
// ---------------------------------------------------------------------------
const CHIP_COL_X = [770, 1010];
const CHIP_ROW_Y = [760, 990, 1220, 1450];
const ChunkingZone: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    {Array.from({length: 8}, (_, i) => {
      const start = 200 + i * 14;
      const s = spring({frame: frame - start, fps, config: {damping: 200, stiffness: 90}});
      if (s <= 0.001) return null;
      const p = easeInOutCubic(clamp01((frame - start) / 90));
      const fromX = 425;
      const fromY = DOC_Y[CHUNK_SRC[i]] + 150;
      const toX = CHIP_COL_X[i % 2] + 115;
      const toY = CHIP_ROW_Y[Math.floor(i / 2)] + 60;
      const cx = lerp(fromX, toX, p);
      const cy = lerp(fromY, toY, p) - Math.sin(p * Math.PI) * 46;
      return (
        <g key={i} opacity={Math.min(1, s)} transform={`translate(${cx - 115}, ${cy - 60}) scale(${0.7 + 0.3 * s})`}>
          <rect
            x={0}
            y={0}
            width={230}
            height={120}
            rx={16}
            fill="rgba(167,139,250,0.10)"
            stroke="rgba(167,139,250,0.55)"
            strokeWidth={2}
            style={{filter: 'drop-shadow(0 0 14px rgba(167,139,250,0.35))'}}
          />
          <text x={22} y={48} fill={INK} fontSize={29} fontFamily={MONO} fontWeight={700}>
            {chunkName(i)}
          </text>
          {[0, 1, 2].map((l) => (
            <rect key={l} x={22} y={66 + l * 15} width={186 - l * 34} height={7} rx={3.5} fill="rgba(196,188,230,0.30)" />
          ))}
        </g>
      );
    })}
  </svg>
);

// ---------------------------------------------------------------------------
// EMBEDDINGS zone: each chunk becomes 12 vector bars (300-420)
// ---------------------------------------------------------------------------
const EmbeddingsZone: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const heights = useMemo(() => {
    const rand = mulberry32(777);
    return Array.from({length: 8}, () =>
      Array.from({length: 12}, () => 24 + rand() * 130)
    );
  }, []);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {Array.from({length: 8}, (_, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const gx = EMB_COL_X[col];
        const baseY = EMB_BASE_Y[row];
        const intro = spring({frame: frame - (290 + i * 10), fps, config: {damping: 200, stiffness: 90}});
        if (intro <= 0.001) return null;
        const isRetrieved = RETRIEVED.some((r) => r.chunk === i);
        const ringFade = isRetrieved
          ? interpolate(frame, [498, 532], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
          : 0;
        return (
          <g key={i} opacity={Math.min(1, intro)}>
            <text x={gx} y={baseY - 186} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={1}>
              {chunkName(i)}
            </text>
            <text x={gx + 210} y={baseY - 186} fill={FAINT} fontSize={22} fontFamily={MONO} textAnchor="end">
              12/1536
            </text>
            {heights[i].map((h, j) => {
              const grow = interpolate(
                frame,
                [300 + i * 10 + j * 5, 352 + i * 10 + j * 5],
                [0, h],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
              );
              return (
                <rect
                  key={j}
                  x={gx + j * 18}
                  y={baseY - grow}
                  width={12}
                  height={Math.max(0.1, grow)}
                  rx={4}
                  fill="url(#barGrad)"
                  opacity={0.9}
                  style={{filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.5))'}}
                />
              );
            })}
            <line x1={gx - 8} y1={baseY} x2={gx + 218} y2={baseY} stroke="rgba(196,188,230,0.30)" strokeWidth={2} />
            {/* tick marks on the baseline */}
            {[0, 1, 2, 3].map((t) => (
              <line key={t} x1={gx + t * 70} y1={baseY} x2={gx + t * 70} y2={baseY + 10} stroke={FAINT} strokeWidth={2} />
            ))}
            {isRetrieved && ringFade > 0 && (
              <rect
                x={gx - 26}
                y={baseY - 216}
                width={262}
                height={252}
                rx={20}
                fill="none"
                stroke={GOLD}
                strokeWidth={4}
                opacity={ringFade}
                style={{filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.7))'}}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// VECTOR INDEX zone: 60-dot point cloud coalescing + pulsing core (380-500)
// ---------------------------------------------------------------------------
interface IndexDot {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  r: number;
  c: string;
}
const IndexZone: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const dots = useMemo<IndexDot[]>(() => {
    const rand = mulberry32(1536);
    return Array.from({length: 60}, () => {
      const ang = rand() * Math.PI * 2;
      const rad = Math.sqrt(rand());
      return {
        sx: 1650 + rand() * 900,
        sy: 620 + rand() * 1120,
        ex: 2100 + Math.cos(ang) * rad * 235,
        ey: 1170 + Math.sin(ang) * rad * 400,
        r: 4 + rand() * 5.5,
        c: rand() > 0.55 ? VIOLET : CYAN,
      };
    });
  }, []);
  const fade = interpolate(frame, [370, 430], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (fade <= 0) return null;
  const corePulse = 1 + 0.12 * Math.sin((frame - 480) * 0.08);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {/* pulsing core rings */}
      {frame > 480 &&
        [0, 1, 2].map((k) => {
          const rr = ((frame - 480) * 2.4 + k * 150) % 450;
          return (
            <circle
              key={k}
              cx={2100}
              cy={1170}
              r={60 + rr}
              fill="none"
              stroke={VIOLET}
              strokeWidth={3}
              opacity={(1 - rr / 450) * 0.45}
            />
          );
        })}
      {dots.map((d, i) => {
        const p = easeInOutCubic(clamp01((frame - (380 + i * 1.2)) / 110));
        const float = Math.sin(frame * 0.025 + i * 1.7) * 5;
        return (
          <circle
            key={i}
            cx={lerp(d.sx, d.ex, p)}
            cy={lerp(d.sy, d.ey, p) + float}
            r={d.r}
            fill={d.c}
            opacity={0.35 + p * 0.55}
            style={{filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.6))'}}
          />
        );
      })}
      {/* core */}
      {frame > 470 && (
        <circle
          cx={2100}
          cy={1170}
          r={17 * corePulse}
          fill={VIOLET}
          filter="url(#bigGlow)"
          opacity={0.95}
        />
      )}
      <text x={2100} y={1700} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={1}>
        1536-dim &middot; cosine similarity
      </text>
      <text x={2100} y={1742} fill={FAINT} fontSize={24} fontFamily={MONO} textAnchor="middle">
        60 vectors shown &middot; shard 04/16
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Query bar with type-out (400-520)
// ---------------------------------------------------------------------------
const QueryBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 400, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const n = Math.floor(
    interpolate(frame, [420, 520], [0, QUERY_TEXT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  const caret = frame > 420 && frame < 580 && Math.floor(frame / 20) % 2 === 0;
  const textW = n * 24.2;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={Math.min(1, s)}>
      <g transform={`translate(0, ${(1 - s) * 40})`}>
        <rect x={2400} y={700} width={1300} height={170} rx={24} fill="rgba(34,211,238,0.05)" stroke="rgba(34,211,238,0.45)" strokeWidth={2.5} />
        <text x={2452} y={764} fill={CYAN} fontSize={28} fontFamily={MONO} fontWeight={700} letterSpacing={4}>
          QUERY
        </text>
        {/* magnifier */}
        <circle cx={3630} cy={785} r={26} fill="none" stroke={CYAN} strokeWidth={4} opacity={0.8} />
        <line x1={3649} y1={804} x2={3672} y2={827} stroke={CYAN} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
        <text x={2452} y={834} fill={INK} fontSize={40} fontFamily={MONO}>
          {QUERY_TEXT.slice(0, n)}
        </text>
        {caret && (
          <rect x={2452 + textW + 6} y={798} width={5} height={46} fill={CYAN} />
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// GROUNDED ANSWER panel: retrieved chips land, answer types out (520-740)
// ---------------------------------------------------------------------------
const AnswerPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 545, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const n = Math.floor(
    interpolate(frame, [600, 740], [0, ANSWER_TOTAL], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  );
  let rest = n;
  const shownLines = ANSWER_LINES.map((l) => {
    const take = Math.max(0, Math.min(l.length, rest));
    rest -= l.length;
    return l.slice(0, take);
  });
  const chipS = spring({frame: frame - 705, fps, config: {damping: 200, stiffness: 90}});
  const blink = Math.floor(frame / 22) % 2 === 0;
  const lastLen = shownLines[2].length > 0 ? shownLines[2].length : shownLines[1].length > 0 ? shownLines[1].length : shownLines[0].length;
  const lastY = shownLines[2].length > 0 ? 1362 : shownLines[1].length > 0 ? 1306 : 1250;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={Math.min(1, s)}>
      <g transform={`translate(0, ${(1 - s) * 44})`}>
        <rect x={2400} y={950} width={1300} height={550} rx={28} fill={PANEL} stroke="rgba(52,211,153,0.35)" strokeWidth={2.5} />
        <line x1={2400} y1={978} x2={2400} y2={1472} stroke={GREEN} strokeWidth={7} strokeLinecap="round" />
        {/* header */}
        <circle cx={2478} cy={1012} r={11} fill={GREEN} style={{filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.9))'}} opacity={0.6 + 0.4 * Math.sin(frame * 0.1)} />
        <text x={2504} y={1026} fill={INK} fontSize={38} fontFamily={FONT} fontWeight={800} letterSpacing={2}>
          GROUNDED ANSWER
        </text>
        <text x={2470} y={1062} fill={FAINT} fontSize={24} fontFamily={MONO} letterSpacing={3}>
          CONTEXT &middot; TOP-3 RETRIEVED CHUNKS
        </text>
        {/* landing slots (chips fly into these) */}
        {RETRIEVED.map((r, k) => (
          <g key={k}>
            <rect
              x={SLOT_X[k]}
              y={SLOT_Y}
              width={SLOT_W}
              height={SLOT_H}
              rx={18}
              fill="rgba(251,191,36,0.05)"
              stroke="rgba(251,191,36,0.35)"
              strokeWidth={2}
              strokeDasharray="10 8"
            />
          </g>
        ))}
        {/* typed answer */}
        {shownLines.map((line, li) => (
          <text key={li} x={2470} y={1250 + li * 56} fill={INK} fontSize={36} fontFamily={MONO}>
            {line}
          </text>
        ))}
        {frame > 600 && frame < 770 && blink && (
          <rect x={2470 + lastLen * 21.7 + 8} y={lastY - 36} width={5} height={44} fill={GREEN} />
        )}
        {/* grounded chip */}
        {chipS > 0.001 && (
          <g opacity={Math.min(1, chipS)} transform={`translate(0, ${(1 - chipS) * 26})`}>
            <rect x={2470} y={1410} width={600} height={80} rx={40} fill="rgba(52,211,153,0.10)" stroke={GREEN} strokeWidth={2.5}
              style={{filter: 'drop-shadow(0 0 18px rgba(52,211,153,0.45))'}} />
            <circle cx={2522} cy={1450} r={16} fill="none" stroke={GREEN} strokeWidth={4} />
            <path d="M 2514 1450 L 2520 1457 L 2532 1443" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <text x={2552} y={1462} fill={GREEN} fontSize={30} fontFamily={FONT} fontWeight={700} letterSpacing={1}>
              GROUNDED &middot; 3 sources cited
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Retrieval flight: gold-highlighted top-3 chunks fly to the answer panel
// ---------------------------------------------------------------------------
const RetrievalFlight: React.FC<{frame: number}> = ({frame}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    {RETRIEVED.map((r, k) => {
      const fade = interpolate(frame, [505 + k * 25, 520 + k * 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      if (fade <= 0) return null;
      const p = easeInOutCubic(clamp01((frame - (520 + k * 25)) / 95));
      const sc = 0.55 + 0.45 * easeInOutCubic(clamp01((frame - (505 + k * 25)) / 70));
      const from = embGroupCenter(r.chunk);
      const to = slotCenter(k);
      const cx = lerp(from.x, to.x, p);
      const cy = lerp(from.y, to.y, p) - Math.sin(p * Math.PI) * 90;
      const w = SLOT_W * sc;
      const h = SLOT_H * sc;
      return (
        <g key={k} opacity={fade}>
          <rect
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            rx={18 * sc}
            fill="rgba(20,14,34,0.96)"
            stroke="url(#goldGrad)"
            strokeWidth={3.5}
            style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.65))'}}
          />
          <text x={cx - w / 2 + 24 * sc} y={cy - 6 * sc} fill={INK} fontSize={34 * sc} fontFamily={MONO} fontWeight={700}>
            {chunkName(r.chunk)}
          </text>
          <text x={cx - w / 2 + 24 * sc} y={cy + 36 * sc} fill={GOLD} fontSize={28 * sc} fontFamily={MONO}>
            cos sim {r.score}
          </text>
        </g>
      );
    })}
  </svg>
);

// ---------------------------------------------------------------------------
// Citation panel: three source spans light up staggered (680-780)
// ---------------------------------------------------------------------------
const CitationsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 640, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={Math.min(1, s)}>
      <g transform={`translate(0, ${(1 - s) * 36})`}>
        <rect x={2400} y={1540} width={1300} height={220} rx={24} fill={PANEL} stroke="rgba(251,191,36,0.30)" strokeWidth={2} />
        <text x={2440} y={1584} fill={FAINT} fontSize={24} fontFamily={MONO} letterSpacing={4}>
          CITATIONS &middot; SOURCE SPANS
        </text>
        {CITATIONS.map((c, i) => {
          const light = interpolate(frame, [680 + i * 35, 732 + i * 35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const rowY = 1602 + i * 54;
          return (
            <g key={i} opacity={0.35 + light * 0.65}>
              <rect x={2440} y={rowY} width={1180 * light} height={44} rx={10} fill="rgba(251,191,36,0.13)" />
              <text x={2462} y={rowY + 32} fill={GOLD} fontSize={29} fontFamily={MONO} fontWeight={700}>
                {c.tag}
              </text>
              <text x={2532} y={rowY + 32} fill={light > 0.5 ? INK : MUTED} fontSize={29} fontFamily={MONO}>
                {c.text}
              </text>
              {light > 0.85 && (
                <circle cx={3640} cy={rowY + 22} r={8} fill={GREEN} style={{filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.9))'}} />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [780, 840], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (fade <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: FAINT,
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Grounded generation: every claim traces to a retrieved source span &mdash; no hallucinations shipped.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const RAGPipelineFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <ZoneChrome frame={frame} />
      <StageBand frame={frame} fps={fps} />
      <DocsZone frame={frame} fps={fps} />
      <ChunkingZone frame={frame} fps={fps} />
      <EmbeddingsZone frame={frame} fps={fps} />
      <IndexZone frame={frame} fps={fps} />
      <QueryBar frame={frame} fps={fps} />
      <AnswerPanel frame={frame} fps={fps} />
      <CitationsPanel frame={frame} fps={fps} />
      <RetrievalFlight frame={frame} />
      <TitleBar frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default RAGPipelineFlow;
