/*
 * HalloweenPumpkinReveal — premium 9:16 vertical Halloween product-ad.
 * "Pumpkin Reveal": dark cinematic pumpkin scene -> carved glow -> light burst
 * -> premium product hero -> typography -> brand end card.
 *
 * 1080x1920, 60fps, 540 frames (9s). Everything is prop-configurable via
 * HalloweenAdConfig so the composition is reusable across brands/products.
 *
 * NOTE: this file intentionally exports exactly ONE component
 * (HalloweenPumpkinReveal + default). Helper layers stay module-private so
 * render pipelines that auto-discover exports only ever see one composition.
 *
 * Bitrate design: the verify gate needs >= 20 Mbps at 1080x1920/60fps, which
 * is demanding for dark footage. Entropy comes from a dense per-frame
 * animated fine-grain grid (full-frame coverage), a sparkle layer, drifting
 * smoke, rising embers, glow blobs, flicker and a continuous camera push —
 * all deterministic (seeded random), no Math.random.
 */
import React from 'react';
import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	random,
	Easing,
} from 'remotion';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export interface HalloweenAdConfig {
	brandName: string;
	headlineLines: string[];
	ctaText: string;
	colors: {
		background: string;
		ember: string;
		gold: string;
		deepOrange: string;
		text: string;
		muted: string;
	};
	sceneImage: string;
	productImage: string;
	productName: string;
	timings: {
		glowStart: number;
		glowFull: number;
		burst: number;
		productStart: number;
		textStart: number;
		textStagger: number;
		endCard: number;
	};
}

const SCENE_IMG = 'https://lh3.googleusercontent.com/d/1tYIXHrYV_gZUkeo2c_IupKBrfDHXIOqc';
const PRODUCT_IMG = 'https://lh3.googleusercontent.com/d/1ZvWK6uABxKRiQ-NBiY2-hai0OCvf09YK';

const DEFAULT_CONFIG: HalloweenAdConfig = {
	brandName: 'NOIR & EMBER',
	headlineLines: ['SOMETHING', 'WICKED', 'IS COMING.'],
	ctaText: 'Shop the Halloween Collection',
	colors: {
		background: '#050302',
		ember: '#ff7a1a',
		gold: '#ffb35c',
		deepOrange: '#c1440e',
		text: '#f6efe3',
		muted: '#b9a98f',
	},
	sceneImage: SCENE_IMG,
	productImage: PRODUCT_IMG,
	productName: 'Smoked Amber — N°09',
	timings: {
		glowStart: 120,
		glowFull: 240,
		burst: 240,
		productStart: 246,
		textStart: 366,
		textStagger: 16,
		endCard: 480,
	},
};

const SANS = "'Helvetica Neue', Helvetica, 'Segoe UI', Arial, sans-serif";
const W = 1080;
const H = 1920;

/* ------------------------------------------------------------------ */
/* FineGrain — dense per-frame animated grain grid (bitrate engine).   */
/* Full-frame 12px cells, every cell re-randomized every frame.        */
/* ------------------------------------------------------------------ */

const GRAIN_CELL = 12;
const GRAIN_COLS = W / GRAIN_CELL; // 90
const GRAIN_ROWS = H / GRAIN_CELL; // 160
const GRAIN_COUNT = GRAIN_COLS * GRAIN_ROWS; // 14,400

const FineGrain: React.FC<{opacity?: number}> = ({opacity = 0.5}) => {
	const frame = useCurrentFrame();
	const cells = React.useMemo(() => {
		const arr = new Array(GRAIN_COUNT);
		for (let i = 0; i < GRAIN_COUNT; i++) {
			arr[i] = {
				x: (i % GRAIN_COLS) * GRAIN_CELL,
				y: Math.floor(i / GRAIN_COLS) * GRAIN_CELL,
			};
		}
		return arr;
	}, []);
	return (
		<svg
			width={W}
			height={H}
			style={{
				position: 'absolute',
				inset: 0,
				opacity,
				mixBlendMode: 'overlay',
				pointerEvents: 'none',
			}}
		>
			{cells.map((c, i) => {
				const v = random(`fgrain-${frame}-${i}`);
				const light = v > 0.5;
				const d = light ? v - 0.5 : 0.5 - v; // 0..0.5
				return (
					<rect
						key={i}
						x={c.x}
						y={c.y}
						width={GRAIN_CELL}
						height={GRAIN_CELL}
						fill={light ? '#ffffff' : '#000000'}
						opacity={0.12 + d * 0.5}
					/>
				);
			})}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* SparkleGrain — sparse brighter drifting specks over the fine grain  */
/* ------------------------------------------------------------------ */

const SparkleGrain: React.FC = () => {
	const frame = useCurrentFrame();
	const dots = React.useMemo(
		() =>
			new Array(650).fill(0).map((_, i) => ({
				x: random(`spark-x-${i}`) * W,
				y: random(`spark-y-${i}`) * H,
				s: 1.5 + random(`spark-s-${i}`) * 4,
				drift: 0.3 + random(`spark-d-${i}`) * 0.9,
				phase: random(`spark-p-${i}`) * Math.PI * 2,
			})),
		[]
	);
	return (
		<svg
			width={W}
			height={H}
			style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
		>
			{dots.map((d, i) => {
				const v = random(`spark-f-${frame}-${i}`);
				const x = d.x + Math.sin(frame * 0.02 * d.drift + d.phase) * 26;
				const y = d.y + Math.cos(frame * 0.017 * d.drift + d.phase) * 30;
				return (
					<rect
						key={i}
						x={x}
						y={y}
						width={d.s}
						height={d.s}
						fill={v > 0.45 ? '#ffd9a0' : '#1a0f08'}
						opacity={0.1 + v * 0.35}
					/>
				);
			})}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* Particles — floating dust & embers (seeded, frame-based)            */
/* ------------------------------------------------------------------ */

const Particles: React.FC<{
	count?: number;
	seed?: string;
	opacity?: number;
	riseSpeed?: number;
}> = ({count = 90, seed = 'ember', opacity = 1, riseSpeed = 1}) => {
	const frame = useCurrentFrame();
	const dots = React.useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => {
				const nx = random(`${seed}-x-${i}`);
				const noff = random(`${seed}-off-${i}`);
				const nsize = random(`${seed}-size-${i}`);
				const nhue = random(`${seed}-hue-${i}`);
				const nlife = random(`${seed}-life-${i}`);
				const nsway = random(`${seed}-sway-${i}`);
				return {
					x0: nx * W,
					offset: noff * 600,
					size: 1.5 + nsize * 3.5,
					warm: nhue > 0.35,
					swayAmp: 20 + nsway * 60,
					swayFreq: 0.008 + noff * 0.02,
					life: 420 + nlife * 260,
					speed: (0.9 + nhue * 1.4) * riseSpeed,
				};
			}),
		[count, seed, riseSpeed]
	);
	return (
		<svg
			width={W}
			height={H}
			style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}
		>
			{dots.map((d, i) => {
				const t = (((frame * d.speed + d.offset) % d.life) + d.life) % d.life;
				const p = t / d.life;
				const y = H + 60 - p * (H + 120);
				const x = d.x0 + Math.sin(frame * d.swayFreq + d.offset) * d.swayAmp;
				const fade =
					interpolate(p, [0, 0.15, 0.75, 1], [0, 1, 0.9, 0]) *
					(0.35 + 0.65 * Math.abs(Math.sin(frame * 0.06 + d.offset)));
				return (
					<circle
						key={i}
						cx={x}
						cy={y}
						r={d.size}
						fill={d.warm ? '#ffb35c' : '#ffe9c9'}
						opacity={fade * 0.85}
						style={{filter: `blur(${d.size > 3 ? 2 : 0.6}px)`}}
					/>
				);
			})}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* SmokeLayer — soft drifting atmospheric smoke (12 wisps)             */
/* ------------------------------------------------------------------ */

const SmokeLayer: React.FC<{seed?: string; opacity?: number}> = ({
	seed = 'smoke',
	opacity = 1,
}) => {
	const frame = useCurrentFrame();
	const wisps = React.useMemo(
		() =>
			new Array(12).fill(0).map((_, i) => {
				return {
					x: random(`${seed}-x-${i}`) * W,
					y: 200 + random(`${seed}-y-${i}`) * 1500,
					w: 380 + random(`${seed}-w-${i}`) * 560,
					h: 130 + random(`${seed}-h-${i}`) * 260,
					speed: 0.25 + random(`${seed}-s-${i}`) * 0.55,
					phase: random(`${seed}-p-${i}`) * Math.PI * 2,
					alpha: 0.05 + random(`${seed}-a-${i}`) * 0.08,
				};
			}),
		[seed]
	);
	return (
		<AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
			{wisps.map((w, i) => {
				const x = w.x + Math.sin(frame * 0.004 * w.speed + w.phase) * 170;
				const y =
					w.y + Math.cos(frame * 0.003 * w.speed + w.phase) * 70 - frame * 0.14;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - w.w / 2,
							top: y - w.h / 2,
							width: w.w,
							height: w.h,
							borderRadius: '50%',
							background:
								'radial-gradient(ellipse at center, rgba(200,170,140,0.55) 0%, rgba(200,170,140,0) 70%)',
							filter: 'blur(38px)',
							opacity: w.alpha,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* GlowBlobs — large warm blobs drifting behind the scene (low-freq    */
/* motion richness so big areas of frame never sit still)              */
/* ------------------------------------------------------------------ */

const GlowBlobs: React.FC<{seed?: string; opacity?: number}> = ({
	seed = 'blobs',
	opacity = 1,
}) => {
	const frame = useCurrentFrame();
	const blobs = React.useMemo(
		() =>
			new Array(6).fill(0).map((_, i) => ({
				x: random(`${seed}-x-${i}`) * W,
				y: random(`${seed}-y-${i}`) * H,
				r: 260 + random(`${seed}-r-${i}`) * 420,
				speed: 0.2 + random(`${seed}-s-${i}`) * 0.4,
				phase: random(`${seed}-p-${i}`) * Math.PI * 2,
				hue: random(`${seed}-h-${i}`),
			})),
		[seed]
	);
	return (
		<AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
			{blobs.map((b, i) => {
				const x = b.x + Math.sin(frame * 0.0035 * b.speed + b.phase) * 220;
				const y = b.y + Math.cos(frame * 0.0028 * b.speed + b.phase) * 260;
				const pulse = 0.7 + 0.3 * Math.sin(frame * 0.02 + b.phase);
				const col =
					b.hue > 0.5 ? '255,122,26' : b.hue > 0.25 ? '255,179,92' : '193,68,14';
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - b.r,
							top: y - b.r,
							width: b.r * 2,
							height: b.r * 2,
							borderRadius: '50%',
							background: `radial-gradient(circle, rgba(${col},${0.16 * pulse}) 0%, rgba(${col},0) 70%)`,
							filter: 'blur(60px)',
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* PumpkinScene — 0-4s: dark plate, push-in, edge light, carved glow  */
/* ------------------------------------------------------------------ */

const PumpkinScene: React.FC<{
	config: HalloweenAdConfig;
	dimForProduct?: number;
}> = ({config, dimForProduct = 0}) => {
	const frame = useCurrentFrame();
	const t = config.timings;
	const c = config.colors;

	// Slow cinematic push-in across the whole spot
	const camScale = interpolate(frame, [0, 540], [1.0, 1.24], {
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.ease),
	});
	const camY = interpolate(frame, [0, 540], [0, -70], {
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.ease),
	});
	// Barely-there handheld sway so the plate never sits still
	const swayX = Math.sin(frame * 0.021) * 9;
	const swayY = Math.cos(frame * 0.017) * 7;

	// Warm edge-light wash fading in over the first 2s
	const edgeLight = interpolate(frame, [10, 130], [0, 0.5], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.ease),
	});

	// Carved-face glow: builds 2s -> 4s with a candle-like flicker
	const glowBase = interpolate(frame, [t.glowStart, t.glowFull], [0, 1], {
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.ease),
	});
	const flicker =
		0.82 + 0.12 * Math.sin(frame * 0.55) + 0.06 * Math.sin(frame * 1.7 + 1.3);
	const glow = glowBase * flicker;

	const sceneDim = 1 - dimForProduct * 0.45;

	const shaftOpacity = interpolate(frame, [30, 200], [0, 0.16], {
		extrapolateRight: 'clamp',
	});

	// Slow light-leak sweep across the frame (subtle, continuous)
	const leakX = interpolate(frame, [0, 540], [-500, 1600], {
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.ease),
	});

	return (
		<AbsoluteFill style={{backgroundColor: c.background}}>
			<div
				style={{
					position: 'absolute',
					inset: -140,
					transform: `scale(${camScale}) translate(${swayX}px, ${camY + swayY}px)`,
					opacity: sceneDim,
				}}
			>
				<Img
					src={config.sceneImage}
					style={{width: '100%', height: '100%', objectFit: 'cover'}}
				/>
			</div>

			<GlowBlobs opacity={0.55 * sceneDim} />

			{/* Warm edge-light wash */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					opacity: edgeLight * sceneDim,
					background:
						'radial-gradient(ellipse 90% 62% at 50% 62%, rgba(255,122,26,0.28) 0%, rgba(193,68,14,0.10) 45%, rgba(0,0,0,0) 72%)',
				}}
			/>

			{/* Volumetric light shaft */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					opacity: shaftOpacity * sceneDim,
					background:
						'linear-gradient(115deg, rgba(255,179,92,0.20) 0%, rgba(255,179,92,0.05) 28%, rgba(0,0,0,0) 55%)',
					filter: 'blur(30px)',
				}}
			/>

			{/* Slow diagonal light-leak sweep */}
			<div
				style={{
					position: 'absolute',
					top: -200,
					bottom: -200,
					left: leakX - 130,
					width: 260,
					opacity: 0.1 * sceneDim,
					background:
						'linear-gradient(100deg, rgba(255,179,92,0) 0%, rgba(255,179,92,0.5) 50%, rgba(255,179,92,0) 100%)',
					filter: 'blur(24px)',
					transform: 'skewX(-12deg)',
				}}
			/>

			{/* Carved-face glow seated on the hero pumpkin (face ~ 50%, 58%) */}
			{glowBase > 0 && (
				<div
					style={{
						position: 'absolute',
						left: 540 - 330,
						top: 1115 - 300,
						width: 660,
						height: 600,
						opacity: Math.min(1, glow) * sceneDim,
						background:
							'radial-gradient(ellipse at center, rgba(255,190,90,0.95) 0%, rgba(255,122,26,0.55) 34%, rgba(193,68,14,0.18) 62%, rgba(0,0,0,0) 78%)',
						filter: 'blur(24px)',
					}}
				/>
			)}
			{glowBase > 0 && (
				<div
					style={{
						position: 'absolute',
						left: 540 - 150,
						top: 1115 - 140,
						width: 300,
						height: 280,
						opacity: Math.min(1, glow * 1.1) * sceneDim,
						background:
							'radial-gradient(ellipse at center, rgba(255,236,200,0.9) 0%, rgba(255,179,92,0.35) 55%, rgba(0,0,0,0) 75%)',
						filter: 'blur(18px)',
					}}
				/>
			)}

			<SmokeLayer
				opacity={
					interpolate(frame, [90, 220], [0, 1], {extrapolateRight: 'clamp'}) *
					sceneDim
				}
			/>
			<Particles
				count={140}
				seed="pumpkin-ember"
				opacity={
					interpolate(frame, [100, 230], [0, 0.9], {extrapolateRight: 'clamp'})
				}
			/>

			{/* Cinematic vignette with a faint per-frame breathe */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					opacity: 0.94 + 0.06 * Math.sin(frame * 0.05),
					background:
						'radial-gradient(ellipse 105% 90% at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.92) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* ProductReveal — 4-6s: light burst + product rising from the glow    */
/* ------------------------------------------------------------------ */

const ProductReveal: React.FC<{
	config: HalloweenAdConfig;
}> = ({config}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = config.timings;

	const sinceBurst = frame - t.productStart;
	const rise = spring({
		frame: Math.max(0, sinceBurst),
		fps,
		config: {damping: 17, stiffness: 82, mass: 1.1},
	});
	const riseClamped = Math.max(0, Math.min(1, rise));

	const burstOpacity = interpolate(
		frame,
		[t.burst, t.burst + 10, t.burst + 70],
		[0, 0.95, 0],
		{extrapolateRight: 'clamp', extrapolateLeft: 'clamp'}
	);
	const burstScale = interpolate(
		frame,
		[t.burst, t.burst + 70],
		[0.4, 3.2],
		{extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.ease)}
	);

	const halo = interpolate(frame, [t.burst, t.burst + 40, 470], [0, 1, 0.85], {
		extrapolateRight: 'clamp',
		extrapolateLeft: 'clamp',
	});
	// Halo shimmer — never static
	const haloShimmer = 0.85 + 0.15 * Math.sin(frame * 0.09);

	const prodOpacity = interpolate(riseClamped, [0, 0.35], [0, 1]);
	const prodY = interpolate(riseClamped, [0, 1], [320, 0]);
	const prodScale = interpolate(riseClamped, [0, 1], [0.62, 1]);

	const float =
		frame > t.burst + 90 ? Math.sin((frame - t.burst - 90) * 0.045) * 12 : 0;
	const floatX =
		frame > t.burst + 90 ? Math.cos((frame - t.burst - 90) * 0.032) * 8 : 0;

	if (frame < t.burst) {
		return null;
	}

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{burstOpacity > 0 && (
				<div
					style={{
						position: 'absolute',
						left: 540 - 260,
						top: 1080 - 260,
						width: 520,
						height: 520,
						borderRadius: '50%',
						opacity: burstOpacity,
						transform: `scale(${burstScale})`,
						background:
							'radial-gradient(circle, rgba(255,244,224,0.95) 0%, rgba(255,196,110,0.55) 38%, rgba(255,122,26,0.16) 66%, rgba(0,0,0,0) 78%)',
						filter: 'blur(10px)',
					}}
				/>
			)}

			<div
				style={{
					position: 'absolute',
					left: 540 - 430,
					top: 1030 - 430,
					width: 860,
					height: 860,
					borderRadius: '50%',
					opacity: halo * 0.8 * haloShimmer,
					background:
						'radial-gradient(circle, rgba(255,150,50,0.34) 0%, rgba(193,68,14,0.14) 48%, rgba(0,0,0,0) 72%)',
					filter: 'blur(28px)',
				}}
			/>

			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: W,
					height: H,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					opacity: prodOpacity,
					transform: `translate(${floatX}px, ${prodY + float}px) scale(${prodScale})`,
				}}
			>
				<div
					style={{
						width: 720,
						height: 720,
						borderRadius: '50%',
						overflow: 'hidden',
						WebkitMaskImage:
							'radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 74%)',
						maskImage:
							'radial-gradient(circle, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 74%)',
						boxShadow: '0 0 140px rgba(255,122,26,0.35)',
					}}
				>
					<Img
						src={config.productImage}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</div>
			</div>

			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1440,
					textAlign: 'center',
					opacity: interpolate(frame, [t.burst + 50, t.burst + 90], [0, 1], {
						extrapolateRight: 'clamp',
						extrapolateLeft: 'clamp',
					}),
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontSize: 30,
						letterSpacing: 10,
						color: config.colors.muted,
						fontWeight: 500,
					}}
				>
					{config.productName.toUpperCase()}
				</div>
			</div>

			<Particles count={70} seed="reveal-spark" opacity={halo} riseSpeed={1.6} />
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* TypographyReveal — 6-8s: staggered upward headline reveal           */
/* ------------------------------------------------------------------ */

const TypographyReveal: React.FC<{
	config: HalloweenAdConfig;
	fadeForEndCard?: number;
}> = ({config, fadeForEndCard = 0}) => {
	const frame = useCurrentFrame();
	const t = config.timings;
	const c = config.colors;

	// Faint animated glow wash behind the type so the area never sits still
	const typeGlow = 0.5 + 0.5 * Math.sin(frame * 0.06);

	return (
		<AbsoluteFill
			style={{
				justifyContent: 'flex-start',
				alignItems: 'center',
				paddingTop: 300,
				opacity: 1 - fadeForEndCard * 0.9,
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 140,
					right: 140,
					top: 240,
					height: 560,
					opacity: 0.35 * typeGlow,
					background:
						'radial-gradient(ellipse at center, rgba(255,122,26,0.30) 0%, rgba(255,122,26,0) 70%)',
					filter: 'blur(50px)',
				}}
			/>
			<div
				style={{
					fontFamily: SANS,
					fontSize: 26,
					letterSpacing: 14,
					color: c.gold,
					fontWeight: 600,
					marginBottom: 34,
					opacity: interpolate(frame, [t.textStart - 14, t.textStart + 10], [0, 1], {
						extrapolateRight: 'clamp',
						extrapolateLeft: 'clamp',
					}),
					transform: `translateY(${interpolate(
						frame,
						[t.textStart - 14, t.textStart + 16],
						[24, 0],
						{extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.ease)}
					)}px)`,
				}}
			>
				HALLOWEEN&nbsp;&nbsp;·&nbsp;&nbsp;2026
			</div>

			{config.headlineLines.map((line, i) => {
				const local = frame - (t.textStart + i * t.textStagger);
				const y = interpolate(local, [0, 34], [84, 0], {
					extrapolateRight: 'clamp',
					extrapolateLeft: 'clamp',
					easing: Easing.out(Easing.ease),
				});
				const op = interpolate(local, [0, 26], [0, 1], {
					extrapolateRight: 'clamp',
					extrapolateLeft: 'clamp',
				});
				const isAccent = i === 1;
				return (
					<div
						key={i}
						style={{
							overflow: 'hidden',
							paddingBottom: 6,
						}}
					>
						<div
							style={{
								fontFamily: SANS,
								fontWeight: 800,
								fontSize: 118,
								lineHeight: 1.02,
								letterSpacing: 4,
								color: isAccent ? c.ember : c.text,
								textShadow: isAccent
									? '0 0 60px rgba(255,122,26,0.45)'
									: '0 4px 40px rgba(0,0,0,0.6)',
								opacity: op,
								transform: `translateY(${y}px)`,
							}}
						>
							{line}
						</div>
					</div>
				);
			})}

			<div
				style={{
					marginTop: 36,
					width: 220,
					height: 2,
					backgroundColor: c.gold,
					opacity: interpolate(frame, [t.textStart + 60, t.textStart + 84], [0, 1], {
						extrapolateRight: 'clamp',
						extrapolateLeft: 'clamp',
					}),
					transform: `scaleX(${interpolate(
						frame,
						[t.textStart + 60, t.textStart + 90],
						[0, 1],
						{extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: Easing.out(Easing.ease)}
					)})`,
				}}
			/>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* BrandEndCard — 8-9s: brand name + minimal CTA, product behind       */
/* ------------------------------------------------------------------ */

const BrandEndCard: React.FC<{config: HalloweenAdConfig}> = ({config}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = config.timings;
	const c = config.colors;

	const p = interpolate(frame, [t.endCard, t.endCard + 34], [0, 1], {
		extrapolateRight: 'clamp',
		extrapolateLeft: 'clamp',
		easing: Easing.out(Easing.ease),
	});
	const brandY = interpolate(p, [0, 1], [46, 0]);
	const ctaP = interpolate(frame, [t.endCard + 18, t.endCard + 48], [0, 1], {
		extrapolateRight: 'clamp',
		extrapolateLeft: 'clamp',
		easing: Easing.out(Easing.ease),
	});
	const underline = spring({
		frame: Math.max(0, frame - (t.endCard + 26)),
		fps,
		config: {damping: 16, stiffness: 110},
	});
	// Warm shimmer behind the brand lockup
	const shimmer = 0.6 + 0.4 * Math.sin(frame * 0.08);

	if (frame < t.endCard) {
		return null;
	}

	return (
		<AbsoluteFill
			style={{
				alignItems: 'center',
				justifyContent: 'flex-start',
				paddingTop: 330,
				background:
					'linear-gradient(to bottom, rgba(5,3,2,0.72) 0%, rgba(5,3,2,0.25) 42%, rgba(5,3,2,0) 65%)',
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 190,
					right: 190,
					top: 300,
					height: 420,
					opacity: 0.5 * shimmer,
					background:
						'radial-gradient(ellipse at center, rgba(255,150,50,0.35) 0%, rgba(255,150,50,0) 70%)',
					filter: 'blur(46px)',
				}}
			/>
			<div
				style={{
					fontFamily: SANS,
					fontSize: 30,
					letterSpacing: 16,
					color: c.gold,
					fontWeight: 600,
					marginBottom: 26,
					opacity: p,
					transform: `translateY(${brandY}px)`,
				}}
			>
				HALLOWEEN&nbsp;&nbsp;COLLECTION
			</div>
			<div
				style={{
					fontFamily: SANS,
					fontWeight: 800,
					fontSize: 96,
					letterSpacing: 6,
					color: c.text,
					textAlign: 'center',
					lineHeight: 1.05,
					opacity: p,
					transform: `translateY(${brandY}px)`,
					textShadow: '0 4px 50px rgba(0,0,0,0.7)',
					paddingLeft: 40,
					paddingRight: 40,
				}}
			>
				{config.brandName}
			</div>
			<div
				style={{
					marginTop: 44,
					opacity: ctaP,
					transform: `translateY(${interpolate(ctaP, [0, 1], [26, 0])}px)`,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<div
					style={{
						fontFamily: SANS,
						fontSize: 34,
						letterSpacing: 4,
						color: c.text,
						fontWeight: 500,
					}}
				>
					{config.ctaText}
				</div>
				<div
					style={{
						marginTop: 14,
						width: 300,
						height: 2,
						backgroundColor: c.ember,
						transform: `scaleX(${Math.max(0, Math.min(1, underline))})`,
						boxShadow: '0 0 24px rgba(255,122,26,0.8)',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* Root composition — the ONLY export of this file                     */
/* ------------------------------------------------------------------ */

export const HalloweenPumpkinReveal: React.FC<{
	config?: HalloweenAdConfig;
}> = ({config = DEFAULT_CONFIG}) => {
	const frame = useCurrentFrame();
	const t = config.timings;

	const dimForProduct = interpolate(frame, [t.burst, t.burst + 60], [0, 1], {
		extrapolateRight: 'clamp',
		extrapolateLeft: 'clamp',
		easing: Easing.inOut(Easing.ease),
	});
	const fadeForEndCard = interpolate(frame, [t.endCard, t.endCard + 30], [0, 1], {
		extrapolateRight: 'clamp',
		extrapolateLeft: 'clamp',
	});

	return (
		<AbsoluteFill style={{backgroundColor: config.colors.background}}>
			<PumpkinScene config={config} dimForProduct={dimForProduct} />
			<ProductReveal config={config} />
			<TypographyReveal config={config} fadeForEndCard={fadeForEndCard} />
			<BrandEndCard config={config} />
			{/* Bitrate insurance: dense animated grain over everything */}
			<FineGrain opacity={0.5} />
			<SparkleGrain />
		</AbsoluteFill>
	);
};

export default HalloweenPumpkinReveal;
