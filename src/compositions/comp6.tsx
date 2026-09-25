import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const CYAN = "#22d3ee";
const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

export const ContourRingsLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = 52 * u;
  const RINGS = 16;

  // faint dot grid
  const dots: { x: number; y: number }[] = [];
  const gs = 9 * u;
  for (let gx = gs / 2; gx < width; gx += gs) {
    for (let gy = gs / 2; gy < height; gy += gs) {
      dots.push({ x: gx, y: gy });
    }
  }

  const rot = ((frame / 900) * 360) % 360;

  return (
    <AbsoluteFill style={{ backgroundColor: "#040914", fontFamily: FONT, overflow: "hidden" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={u * 0.12} fill="rgba(34,211,238,0.14)" />
        ))}

        {Array.from({ length: RINGS }, (_, i) => {
          const t = (frame / 450 + i / RINGS) % 1;
          const r = t * maxR;
          const op = Math.sin(Math.PI * t) * 0.6;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={CYAN}
              strokeWidth={u * 0.32}
              opacity={op}
            />
          );
        })}

        {/* slow rotating dashed accent ring */}
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={maxR * 0.62}
            fill="none"
            stroke="#a5f3fc"
            strokeWidth={u * 0.28}
            strokeDasharray={`${3 * u} ${2.2 * u}`}
            opacity={0.5}
          />
        </g>
      </svg>

      {/* copy-safe label, subtle */}
      <div
        style={{
          position: "absolute",
          top: `${5 * u}px`,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: `${1.7 * u}px`,
          letterSpacing: `${0.42 * u}px`,
          color: "rgba(165,243,252,0.5)",
          fontWeight: 600,
        }}
      >
        SEAMLESS LOOP · COPY SPACE SAFE
      </div>
    </AbsoluteFill>
  );
};

export default ContourRingsLoop;
