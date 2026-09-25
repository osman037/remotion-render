import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FONT = "'Inter','Segoe UI',system-ui,-apple-system,sans-serif";

type Cat = { name: string; s: number; e: number; color: string };

const CATS: Cat[] = [
  { name: "Electronics", s: 610, e: 1420, color: "#22d3ee" },
  { name: "Fashion", s: 520, e: 1180, color: "#fbbf24" },
  { name: "Grocery", s: 380, e: 990, color: "#34d399" },
  { name: "Home", s: 340, e: 720, color: "#fb7185" },
  { name: "Beauty", s: 300, e: 640, color: "#38bdf8" },
  { name: "Toys", s: 180, e: 420, color: "#a78bfa" },
];

const valAt = (c: Cat, y: number, frac: number): number => {
  const t = (y + frac) / 8;
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return c.s + (c.e - c.s) * eased;
};

export const EcommerceBarRace: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;

  const step = Math.min(8, Math.floor(frame / 100));
  const frac = Easing.out(Easing.cubic)((frame % 100) / 100);
  const year = 2018 + step;

  const rows = CATS.map((c) => ({ ...c, v: valAt(c, step, frac) })).sort((a, b) => b.v - a.v);
  const max = rows[0].v;
  const intro = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05070f",
        fontFamily: FONT,
        color: "#fff",
        padding: `${4 * u}px ${5 * u}px`,
        opacity: intro,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: `${2.4 * u}px`, fontWeight: 700, letterSpacing: `${0.24 * u}px` }}>
            GLOBAL E-COMMERCE SALES
          </div>
          <div style={{ fontSize: `${1.7 * u}px`, color: "rgba(148,163,184,0.7)", marginTop: `${0.6 * u}px` }}>
            Revenue by category · billion USD
          </div>
        </div>
        <div style={{ fontSize: `${7 * u}px`, fontWeight: 800, color: "#22d3ee", lineHeight: 1 }}>
          {year}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: `${1.7 * u}px`, marginTop: `${3 * u}px`, flex: 1, justifyContent: "center" }}>
        {rows.map((r, i) => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: `${1.5 * u}px` }}>
            <div style={{ width: `${13 * u}px`, textAlign: "right", fontSize: `${2 * u}px`, fontWeight: 600, color: i === 0 ? "#fff" : "rgba(226,232,240,0.75)" }}>
              {r.name}
            </div>
            <div style={{ flex: 1, height: `${3.4 * u}px`, position: "relative" }}>
              <div
                style={{
                  width: `${(r.v / max) * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${r.color}cc, ${r.color})`,
                  borderRadius: `${0.8 * u}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: `${1.2 * u}px`,
                }}
              >
                <span style={{ fontSize: `${1.9 * u}px`, fontWeight: 700, color: "#04070f" }}>
                  ${Math.round(r.v)}B
                </span>
              </div>
            </div>
            {i === 0 && (
              <div
                style={{
                  fontSize: `${1.6 * u}px`,
                  fontWeight: 800,
                  color: "#fbbf24",
                  border: `${0.25 * u}px solid #fbbf24`,
                  borderRadius: `${0.8 * u}px`,
                  padding: `${0.4 * u}px ${1 * u}px`,
                }}
              >
                ▲ LEADER
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: `${2 * u}px` }}>
        <span style={{ fontSize: `${1.6 * u}px`, color: "rgba(148,163,184,0.6)" }}>
          Total market ${(rows.reduce((a, r) => a + r.v, 0) / 1000).toFixed(2)}T
        </span>
        <span style={{ fontSize: `${1.6 * u}px`, color: "rgba(148,163,184,0.6)" }}>
          2018 → 2026 · animated ranking
        </span>
      </div>
    </AbsoluteFill>
  );
};

export default EcommerceBarRace;
