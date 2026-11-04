/**
 * Stop-motion "alive paper" motion for collage shorts, measured from the reference videos
 * (shorts-library/docs/MOTION.md). Drop into a Remotion project and wrap pieces in <Piece>.
 *
 *   1. STEPPING  every animated value is sampled at 12 poses / s (30 fps: holds of 3,2,3,2 frames).
 *               Slow drifts become visible 3-4 px jumps. Use stepped(frame) for ALL animation input.
 *   2. WIGGLE    each piece gets its own random offset per step (new pose every step, no smoothing):
 *               hero cut-outs ±0.6 px (p90 3), ±0.1° (p90 0.7°); type ±1.5 px; background 0.
 *   3. GRAIN     a fine grain overlay re-seeded every step, so even held frames flicker a little.
 *
 * Usage:
 *   const f = useStepped();                         // stepped frame for interpolate()/spring()
 *   <Piece id="sun" role="hero" style={{left: 300, top: 400}}> <Img src=.../> </Piece>
 *   <Piece id="title" role="type"> ... </Piece>
 *   <Piece id="paper" role="background"> ... </Piece>
 *   <Grain />                                       // last child of the composition
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const STEP_FPS = 12;

/** Index of the current pose (changes STEP_FPS times a second). */
export function stepIndex(frame: number, fps: number, stepFps = STEP_FPS): number {
  return Math.floor((frame * stepFps) / fps + 1e-6);
}

/** The frame snapped back to the start of its pose: feed this to interpolate()/spring(). */
export function stepped(frame: number, fps: number, stepFps = STEP_FPS): number {
  return Math.round((stepIndex(frame, fps, stepFps) * fps) / stepFps);
}

export function useStepped(stepFps = STEP_FPS): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return stepped(frame, fps, stepFps);
}

/** Deterministic 0..1 random from integers (no Math.random: renders must be repeatable). */
export function rand(...keys: (number | string)[]): number {
  let h = 2166136261;
  for (const k of keys) {
    const s = String(k);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 15), 2246822507);
  }
  h ^= h >>> 13;
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

/** Roughly gaussian (sum of 3 uniforms), mean 0, sd ~1. */
function gauss(...keys: (number | string)[]): number {
  return (rand(...keys, "a") + rand(...keys, "b") + rand(...keys, "c") - 1.5) * 2;
}

export type Role = "hero" | "type" | "prop" | "background" | "none";

/** Wiggle sizes per role, in px of a 1080x1920 frame / degrees / scale fraction (sd per step). */
export const WIGGLE: Record<Role, { px: number; deg: number; scale: number }> = {
  hero: { px: 0.8, deg: 0.15, scale: 0.002 },
  prop: { px: 1.0, deg: 0.25, scale: 0.002 },
  type: { px: 1.5, deg: 0.2, scale: 0.0 },
  background: { px: 0, deg: 0, scale: 0 },
  none: { px: 0, deg: 0, scale: 0 },
};

export function wiggle(id: string, step: number, role: Role = "hero", amount = 1) {
  const w = WIGGLE[role];
  return {
    x: gauss(id, step, "x") * w.px * amount,
    y: gauss(id, step, "y") * w.px * amount,
    rot: gauss(id, step, "r") * w.deg * amount,
    scale: 1 + gauss(id, step, "s") * w.scale * amount,
  };
}

export const Piece: React.FC<{
  id: string;
  role?: Role;
  amount?: number; // 0 = still, 1 = reference level, 2 = nervous
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ id, role = "hero", amount = 1, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = wiggle(id, stepIndex(frame, fps), role, amount);
  const base = style?.transform ? `${style.transform} ` : "";
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        transform: `${base}translate(${w.x}px, ${w.y}px) rotate(${w.rot}deg) scale(${w.scale})`,
      }}
    >
      {children}
    </div>
  );
};

/** Fine paper/film grain, re-seeded every step. opacity ~0.035 matches the references (measured boil). */
export const Grain: React.FC<{ opacity?: number; size?: number }> = ({ opacity = 0.035, size = 0.9 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seed = stepIndex(frame, fps) % 997;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={size} numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
