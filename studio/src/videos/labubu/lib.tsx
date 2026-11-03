import React from "react";
import { Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/rubik/800.css";
import "@fontsource/rubik/900.css";
import "@fontsource/permanent-marker/400.css";

export const C = {
  pink: "#FF3DA5",
  hot: "#FF1F6B",
  lime: "#C6F432",
  cream: "#FFF4E0",
  ink: "#141414",
  sky: "#6EC8FF",
  red: "#FF3B30",
  gold: "#FFC93C",
  navy: "#0B1036",
  green: "#12A150",
  white: "#FFFFFF",
};
export const HEAD = "Anton, Impact, sans-serif";
export const BODY = "Rubik, Arial, sans-serif";
export const MARKER = "'Permanent Marker', cursive";

export const IMG = {
  green: staticFile("labubu/green_kite_cut.png"),
  pink: staticFile("labubu/pink_jump_cut.png"),
};
// Cut-out sizes (px) — used for aspect ratios.
export const IMG_AR = { green: 902 / 1416, pink: 625 / 1057 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (f: number, a: number, b: number, c: number, d: number, ease?: (t: number) => number) =>
  interpolate(f, [a, b], [c, d], { ...clamp, easing: ease });
export const EASE = { out: Easing.out(Easing.cubic), in: Easing.in(Easing.cubic), inOut: Easing.inOut(Easing.cubic), back: Easing.out(Easing.back(2.2)) };

/** Spring that starts at local frame `at` (frames). */
export const usePop = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
    spring({ frame: f - at, fps, config: { damping: 11, stiffness: 190, mass: 0.6, ...cfg } });
};

/** Seconds -> frames relative to a scene start. */
export const useT = (sceneStart: number) => {
  const { fps } = useVideoConfig();
  return (globalSec: number) => Math.round((globalSec - sceneStart) * fps);
};

const outline = (w: number, col = "#fff") =>
  [
    [w, 0], [-w, 0], [0, w], [0, -w], [w * 0.7, w * 0.7], [-w * 0.7, w * 0.7], [w * 0.7, -w * 0.7], [-w * 0.7, -w * 0.7],
  ]
    .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${col})`)
    .join(" ");

/** A Labubu cut-out as a die-cut sticker (white outline + hard shadow). */
export const Sticker: React.FC<{
  who: "green" | "pink";
  h: number;
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  sx?: number;
  sy?: number;
  border?: number;
  grey?: number;
  flip?: boolean;
  shadow?: boolean;
  style?: React.CSSProperties;
}> = ({ who, h, x, y, rot = 0, scale = 1, sx = 1, sy = 1, border = 9, grey = 0, flip, shadow = true, style }) => {
  const w = h * IMG_AR[who];
  return (
    <Img
      src={IMG[who]}
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rot}deg) scale(${scale * (flip ? -sx : sx)}, ${scale * sy})`,
        transformOrigin: "50% 85%",
        filter: `${border ? outline(border) : ""} ${shadow ? "drop-shadow(14px 18px 0 rgba(0,0,0,0.28))" : ""} grayscale(${grey}) ${grey ? `brightness(${1 - grey * 0.25})` : ""}`,
        ...style,
      }}
    />
  );
};

/** Big punchy headline: Anton, black stroke, hard offset shadow. */
export const Head: React.FC<{
  children: React.ReactNode;
  size: number;
  color?: string;
  stroke?: number;
  shadow?: string;
  style?: React.CSSProperties;
  font?: string;
}> = ({ children, size, color = "#fff", stroke = 0.08, shadow = C.ink, style, font = HEAD }) => (
  <div
    style={{
      fontFamily: font,
      fontSize: size,
      lineHeight: 0.95,
      color,
      textTransform: "uppercase",
      WebkitTextStroke: `${Math.round(size * stroke)}px ${C.ink}`,
      paintOrder: "stroke fill",
      textShadow: shadow ? `${Math.round(size * 0.05)}px ${Math.round(size * 0.06)}px 0 ${shadow}` : undefined,
      letterSpacing: 1,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Text that pops in word by word, starting at local frame `at`, `gap` frames apart. */
export const PopWords: React.FC<{
  text: string;
  at: number;
  gap?: number;
  size: number;
  colors?: string[];
  style?: React.CSSProperties;
  font?: string;
}> = ({ text, at, gap = 4, size, colors = ["#fff"], style, font }) => {
  const pop = usePop();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.22, rowGap: size * 0.05, width: 1000, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = pop(at + i * gap);
        return (
          <div key={i} style={{ transform: `scale(${p}) rotate(${(1 - p) * (i % 2 ? 12 : -12)}deg)`, opacity: p > 0.01 ? 1 : 0 }}>
            <Head size={size} color={colors[i % colors.length]} font={font}>
              {w}
            </Head>
          </div>
        );
      })}
    </div>
  );
};

/** Rubber stamp that slams in at `at`. */
export const Stamp: React.FC<{ text: string; at: number; color?: string; size?: number; rot?: number; x: number; y: number; sub?: string }> = ({
  text, at, color = C.red, size = 150, rot = -12, x, y, sub,
}) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < 0) return null;
  const s = interpolate(t, [0, 5, 8, 11], [3.2, 0.92, 1.04, 1], clamp);
  const o = interpolate(t, [0, 3], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o,
        border: `${size * 0.09}px solid ${color}`, borderRadius: size * 0.16, padding: `${size * 0.08}px ${size * 0.22}px`,
        color, fontFamily: HEAD, fontSize: size, lineHeight: 1, textTransform: "uppercase", textAlign: "center",
        background: "rgba(255,255,255,0.9)", boxShadow: `0 ${size * 0.08}px 0 rgba(0,0,0,0.25)`, whiteSpace: "nowrap",
      }}
    >
      {text}
      {sub && <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: size * 0.26, marginTop: size * 0.05 }}>{sub}</div>}
    </div>
  );
};

/** Halftone dot background layer. */
export const Halftone: React.FC<{ color: string; dot?: number; gap?: number; opacity?: number; drift?: number }> = ({
  color, dot = 7, gap = 34, opacity = 0.35, drift = 0.6,
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute", inset: -100, opacity,
        backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot + 1}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        backgroundPosition: `${f * drift}px ${f * drift}px`,
      }}
    />
  );
};

/** Spinning sunburst rays. */
export const Rays: React.FC<{ a: string; b: string; speed?: number; n?: number; cx?: string; cy?: string }> = ({
  a, b, speed = 0.4, n = 16, cx = "50%", cy = "45%",
}) => {
  const f = useCurrentFrame();
  const step = 360 / n;
  return (
    <div
      style={{
        position: "absolute", left: "50%", top: cy, width: 3200, height: 3200, marginLeft: -1600, marginTop: -1600,
        background: `repeating-conic-gradient(from ${f * speed}deg at 50% 50%, ${a} 0deg ${step / 2}deg, ${b} ${step / 2}deg ${step}deg)`,
        transformOrigin: cx,
      }}
    />
  );
};

/** Deterministic confetti burst starting at local frame `at`. */
export const Confetti: React.FC<{ at: number; n?: number; seed?: string; ox?: number; oy?: number }> = ({ at, n = 90, seed = "c", ox = 540, oy = 900 }) => {
  const f = useCurrentFrame();
  const t = (f - at) / 30;
  if (t < 0) return null;
  const cols = [C.pink, C.lime, C.gold, C.sky, "#fff", C.hot];
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const ang = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 700 + random(`${seed}s${i}`) * 1500;
        const x = ox + Math.cos(ang) * sp * t;
        const y = oy + Math.sin(ang) * sp * t * 0.8 + 1400 * t * t;
        const r = random(`${seed}r${i}`) * 720 * t * 2;
        const w = 18 + random(`${seed}w${i}`) * 22;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.45, background: cols[i % cols.length], transform: `rotate(${r}deg) rotateX(${r * 1.3}deg)`, borderRadius: 3 }} />
        );
      })}
    </>
  );
};

/** Camera shake offset, decaying, triggered at local frames in `hits`. */
export const useShake = (hits: number[], amp = 22, len = 10) => {
  const f = useCurrentFrame();
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const t = f - h;
    if (t >= 0 && t < len) {
      const k = (1 - t / len) ** 2 * amp;
      x += (random(`sx${h}${t}`) - 0.5) * 2 * k;
      y += (random(`sy${h}${t}`) - 0.5) * 2 * k;
      r += (random(`sr${h}${t}`) - 0.5) * 0.12 * k;
    }
  }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};

export const Fill: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>{children}</div>
);

export const Abs: React.FC<{ x: number; y: number; children?: React.ReactNode; style?: React.CSSProperties; center?: boolean }> = ({ x, y, children, style, center = true }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: center ? "translate(-50%,-50%)" : undefined, ...style }}>{children}</div>
);
