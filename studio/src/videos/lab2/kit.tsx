// Paper-cut kit: reusable pieces for paper-collage shorts (see studio/STYLE.md).
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/special-elite/400.css";
import meta from "../../../public/lab2/meta.json";

export const SERIF = "'Playfair Display', Georgia, serif";
export const TYPE = "'Special Elite', 'Courier New', monospace";
export const clampX = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const OUT = Easing.out(Easing.cubic);
export const IN = Easing.in(Easing.cubic);
export const INOUT = Easing.inOut(Easing.cubic);
export const ease = (f: number, a: number, b: number, x: number, y: number, e = INOUT) => interpolate(f, [a, b], [x, y], { ...clampX, easing: e });
export const A = (n: string) => staticFile(`lab2/${n}`);
const M = meta as unknown as Record<string, [number, number]>;
export const aspect = (n: string) => (M[n] ? M[n][1] / M[n][0] : 1);

/** Camera progress 0..1 across the scene, shared by all pieces for parallax. */
export const Cam = createContext(0);
export const useCam = () => useContext(Cam);

export const shadow = (gap: number) => `drop-shadow(${gap * 0.35}px ${gap}px ${gap * 1.6}px rgba(25,20,15,${0.22 + gap * 0.004}))`;
export const KEY_LIFT = "brightness(1.12) saturate(1.25) contrast(1.05)";

/** A scene: paper background + slow camera push; children get parallax through Cam. */
export const Scene: React.FC<{ world: string; dur: number; push?: number; children?: React.ReactNode; dim?: boolean }> = ({ world, dur, push = 0.05, children }) => {
  const f = useCurrentFrame();
  const p = ease(f, 0, dur, 0, 1, (x) => x);
  return (
    <Cam.Provider value={p}>
      <AbsoluteFill style={{ overflow: "hidden", background: "#222" }}>
        <AbsoluteFill style={{ transform: `scale(${1 + push * p})`, transformOrigin: "50% 55%" }}>
          <Img src={A(`bg_${world}.png`)} style={{ position: "absolute", left: -120 - p * 20, top: -120, width: 1320, filter: "saturate(0.8) brightness(0.92)" }} />
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    </Cam.Provider>
  );
};

type Enter = "none" | "drop" | "up" | "left" | "right" | "fade";

/** One paper piece. x,y = centre. depth drives parallax; gap drives the shadow. */
export const Piece: React.FC<{
  src: string; x: number; y: number; w: number; depth?: number; gap?: number; at?: number; enter?: Enter; dur?: number;
  rot?: number; drift?: number; sx?: number; sy?: number; origin?: string; keyObj?: boolean; grey?: number; opacity?: number;
  dim?: boolean; children?: React.ReactNode; z?: number;
}> = ({ src, x, y, w, depth = 1, gap = 12, at = 0, enter = "none", dur = 14, rot = 0, drift = 1, sx = 1, sy = 1, origin = "50% 50%", keyObj, grey = 0, opacity = 1, dim, children, z }) => {
  const f = useCurrentFrame();
  const cam = useCam();
  const e = enter === "none" ? 1 : ease(f, at, at + dur, 0, 1, OUT);
  if (enter !== "none" && f < at) return null;
  const h = w * aspect(src.replace(".png", ""));
  const seed = x * 7 + y * 3;
  const dx = -cam * 50 * depth + Math.sin(f / (38 + depth * 9) + seed) * 4 * depth * drift;
  const dy = Math.sin(f / (31 + depth * 7) + seed * 0.7) * 2.5 * drift;
  const off = { drop: [0, -150], up: [0, 500], left: [-800, 0], right: [800, 0], fade: [0, 18], none: [0, 0] }[enter];
  const tx = dx + off[0] * (1 - e), ty = dy + off[1] * (1 - e);
  const r = rot + Math.sin(f / (27 + depth * 5) + seed) * 0.5 * drift;
  const filt = [keyObj ? KEY_LIFT : "", dim ? "saturate(0.75) brightness(0.9)" : "", grey ? `grayscale(${grey}) brightness(${1 - grey * 0.15})` : "", shadow(gap)].join(" ");
  return (
    <>
      {keyObj && (
        <div style={{ position: "absolute", left: x - w * 0.85 + tx, top: y - w * 0.85 + ty, width: w * 1.7, height: w * 1.7, opacity: e * 0.85 * (1 - grey) * opacity, zIndex: z,
          background: "radial-gradient(circle, rgba(255,247,225,0.5) 0%, rgba(255,247,225,0.16) 40%, transparent 68%)", pointerEvents: "none" }} />
      )}
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: (enter === "fade" || enter === "drop" ? e : 1) * opacity, zIndex: z,
        transform: `translate(${tx}px, ${ty}px) scale(${(1 + cam * 0.04 * depth) * sx}, ${(1 + cam * 0.04 * depth) * sy}) rotate(${r}deg)`, transformOrigin: origin, filter: filt }}>
        <Img src={A(src)} style={{ width: w, height: h, display: "block" }} />
        {children}
      </div>
    </>
  );
};

/** Torn paper strip (hills, ground, a sweeping sheet). top = y of the torn edge. */
export const Strip: React.FC<{ world: string; n: 1 | 2; top: number; depth?: number; gap?: number; dy?: number }> = ({ world, n, top, depth = 1, gap = 14, dy = 0 }) => (
  <Piece src={`strip${n}_${world}.png`} x={540} y={top - 120 + (aspect(`strip${n}_${world}`) * 1380) / 2 + dy} w={1380} depth={depth} gap={gap} dim drift={0.6} />
);

/** Glow: subtle colour glow + contrast halo, so text never washes out (STYLE.md). */
export const glow = (color: string, dark?: boolean) => {
  const h = color.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  if (dark) return ["0 0 4px rgba(255,250,240,0.9)", "0 0 16px rgba(255,250,240,0.75)", "0 0 40px rgba(255,250,240,0.5)"].join(", ");
  return [`0 0 6px rgba(${r},${g},${b},0.55)`, `0 0 22px rgba(${r},${g},${b},0.45)`, `0 0 48px rgba(${r},${g},${b},0.25)`, "0 2px 28px rgba(0,0,0,0.55)"].join(", ");
};

export const LIGHT = "#f5f0e6";
export const INK = "#2b2722";

/** Serif words that settle in (fade + small rise), no bounce. */
export const Words: React.FC<{ text: string; at: number; size: number; color?: string; y: number; dark?: boolean; bold?: boolean; out?: number; x?: number }> = ({
  text, at, size, color = LIGHT, y, dark, bold, out, x,
}) => {
  const f = useCurrentFrame();
  const k = ease(f, at, at + 12, 0, 1, OUT) * (out !== undefined ? ease(f, out, out + 8, 1, 0) : 1);
  if (k <= 0) return null;
  const isKey = color !== LIGHT && color !== INK;
  return (
    <div style={{ position: "absolute", left: x !== undefined ? x - 540 : 0, width: 1080, top: y, textAlign: "center", fontFamily: SERIF, fontStyle: bold ? "normal" : "italic",
      fontWeight: bold ? 700 : 400, fontSize: size, color, opacity: k, transform: `translateY(${(1 - k) * 18}px)`, lineHeight: 1, zIndex: 50,
      textShadow: isKey ? glow(color, false) + (dark ? ", 0 0 30px rgba(255,250,240,0.6)" : "") : glow(color, dark) }}>
      {text}
    </div>
  );
};

/** A number that counts (prices, multipliers, percentages). */
export const Counter: React.FC<{ value: string; size: number; color: string; y: number; x?: number; at?: number; dark?: boolean }> = ({ value, size, color, y, x = 540, at = 0, dark }) => {
  const f = useCurrentFrame();
  const k = ease(f, at, at + 8, 0, 1, OUT);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x - 540, width: 1080, top: y, textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: size, color, opacity: k,
      lineHeight: 1, zIndex: 50, textShadow: glow(color, false) + (dark ? ", 0 0 26px rgba(255,250,240,0.7)" : ""), fontVariantNumeric: "tabular-nums" }}>
      {value}
    </div>
  );
};

/** Typewriter label on a paper slip. */
export const Label: React.FC<{ text: string; x: number; y: number; at?: number; rot?: number; size?: number; w?: number }> = ({ text, x, y, at = 0, rot = -3, size = 40, w }) => {
  const f = useCurrentFrame();
  const e = ease(f, at, at + 10, 0, 1, OUT);
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) translateY(${(1 - e) * 30}px)`, opacity: e, zIndex: 40,
      background: "#efe8d8", padding: "10px 22px", fontFamily: TYPE, fontSize: size, color: "#2b2722", letterSpacing: 2, whiteSpace: "nowrap", width: w,
      boxShadow: "6px 10px 16px rgba(25,20,15,0.3)", backgroundImage: `url(${A("bg_chart.png")})`, backgroundSize: "600px" }}>
      {text}
    </div>
  );
};

/** Red rubber stamp: slaps on, settles (no bounce). */
export const Stamp: React.FC<{ text: string; x: number; y: number; at: number; rot?: number; size?: number; color?: string }> = ({ text, x, y, at, rot = -8, size = 110, color = "#C8322A" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = ease(f, at, at + 5, 1.35, 1, OUT);
  const o = ease(f, at, at + 3, 0, 0.9);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o, zIndex: 45,
      border: `${size * 0.08}px solid ${color}`, borderRadius: size * 0.1, padding: `${size * 0.06}px ${size * 0.2}px`, color, fontFamily: TYPE, fontSize: size,
      whiteSpace: "nowrap", mixBlendMode: "multiply", letterSpacing: 3 }}>
      {text}
    </div>
  );
};

/** Marker circle drawn on. */
export const MarkerCircle: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; color?: string }> = ({ cx, cy, rx, ry, at, color = "#D7342B" }) => {
  const f = useCurrentFrame();
  const k = ease(f, at, at + 10, 0, 1, OUT);
  if (k <= 0) return null;
  const len = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2) * 1.15;
  const d = `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx * 0.98} ${cy - ry * 0.25} A ${rx * 1.05} ${ry * 1.05} 0 0 1 ${cx + rx * 0.7} ${cy - ry * 0.95}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 30 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} opacity={0.92} />
    </svg>
  );
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.16 }}>
      <svg width="100%" height="100%"><filter id={`g${f}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(random(`g${f}`) * 999)} /></filter>
        <rect width="100%" height="100%" filter={`url(#g${f})`} /></svg>
    </AbsoluteFill>
  );
};

export const useLocal = (start: number) => {
  const { fps } = useVideoConfig();
  return (sec: number) => Math.round((sec - start) * fps);
};
