// Free paper-cut look test (no AI): real clip -> freeze -> crowd lifts off as a paper cut-out,
// then a layered paper world with the vivid Labubu as a printed cut-out. 9 s, 1080x1920.
import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import "@fontsource/playfair-display/400-italic.css";
import meta from "../../../public/papertest/meta.json";

export const PAPERTEST_FRAMES = 270;
const SERIF = "'Playfair Display', Georgia, serif";
const c = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
const f2 = (f: number, a: number, b: number, x: number, y: number, e = inOut) => interpolate(f, [a, b], [x, y], { ...c, easing: e });
const P = (n: string) => staticFile(`papertest/${n}`);

/** Soft paper shadow whose offset grows with the gap to the layer below. */
const shadow = (gap: number) => `drop-shadow(${gap * 0.35}px ${gap}px ${gap * 1.6}px rgba(30,25,20,${0.22 + gap * 0.004}))`;

/** Subtle glow in the text's own colour + a soft contrast halo, so text never washes out. */
const glow = (color: string, dark?: boolean) => {
  const h = color.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const halo = dark ? "255,250,240" : "0,0,0";
  if (dark) {
    // dark text: glow with a soft light halo (a dark glow reads as a smudge)
    return [`0 0 4px rgba(${halo},0.9)`, `0 0 16px rgba(${halo},0.75)`, `0 0 40px rgba(${halo},0.5)`].join(", ");
  }
  return [
    `0 0 6px rgba(${r},${g},${b},0.55)`,
    `0 0 22px rgba(${r},${g},${b},0.45)`,
    `0 0 48px rgba(${r},${g},${b},0.25)`,
    `0 2px 28px rgba(${halo},${dark ? 0.75 : 0.55})`,
  ].join(", ");
};

/** Words that settle in (fade + small rise), no bounce. */
const Words: React.FC<{ text: string; at: number; size: number; color: string; y: number; dark?: boolean }> = ({ text, at, size, color, y, dark }) => {
  const f = useCurrentFrame();
  const k = f2(f, at, at + 12, 0, 1, out);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: size,
      color, opacity: k, transform: `translateY(${(1 - k) * 18}px)`, lineHeight: 1,
      textShadow: glow(color, dark) }}>
      {text}
    </div>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.18 }}>
      <svg width="100%" height="100%"><filter id={`g${f}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(random(`g${f}`) * 999)} /></filter>
        <rect width="100%" height="100%" filter={`url(#g${f})`} /></svg>
    </AbsoluteFill>
  );
};

/* Shot 1: clip plays, freezes, becomes a print on paper; the crowd lifts off as a cut-out. */
const ShotClip: React.FC = () => {
  const f = useCurrentFrame();
  const FREEZE = 72;
  const t = f - FREEZE;
  const toPrint = f2(t, 0, 26, 0, 1);            // frame -> printed photo on the desk
  const lift = f2(t, 8, 60, 0, 1);                // crowd lifts towards camera
  const cam = 1 + f2(f, FREEZE, 135, 0, 0.07);    // slow push after the freeze
  const [ox, oy] = meta.crowd_offset as [number, number];
  const [cw, ch] = meta.crowd_size as [number, number];
  const printScale = 1 - 0.14 * toPrint;
  const sway = Math.sin(f / 23) * 0.4 * lift;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < FREEZE ? (
        <OffthreadVideo src={P("queue.mp4")} muted style={{ width: 1080, height: 1920 }} />
      ) : (
        <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: "50% 62%" }}>
          <Img src={P("desk.png")} style={{ position: "absolute", inset: 0, opacity: toPrint }} />
          {/* the frozen frame turning into a print: white border, muted colour, slight tilt */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${printScale}) rotate(${-2.2 * toPrint}deg)`,
            transformOrigin: "50% 55%", filter: toPrint > 0.02 ? shadow(14 * toPrint) : undefined }}>
            <div style={{ position: "absolute", inset: -26 * toPrint, background: "#f4efe4" }} />
            <Img src={P("freeze.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: 1 - toPrint }} />
            <Img src={P("freeze_print.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: toPrint }} />
          </div>
          {/* the crowd, lifted off the print as a paper cut-out */}
          <div style={{ position: "absolute", left: ox, top: oy, width: cw, height: ch, opacity: toPrint > 0 ? 1 : 0,
            transform: `scale(${printScale + 0.12 * lift}) rotate(${-2.2 * toPrint + 1.6 * lift + sway}deg) translate(${10 * lift}px, ${-30 * lift}px)`,
            transformOrigin: `${540 - ox}px ${1056 - oy}px`, filter: `brightness(${1 + 0.08 * lift}) saturate(${1 + 0.15 * lift}) ${shadow(4 + 30 * lift)}` }}>
            <Img src={P("crowd_cut.png")} style={{ width: cw, height: ch }} />
          </div>
        </AbsoluteFill>
      )}
      <Words text="Last year," at={8} size={64} color="#f5f0e6" y={300} />
      <Words text="grown adults" at={26} size={150} color="#f5f0e6" y={390} />
      <Words text="were sleeping outside malls" at={FREEZE + 20} size={62} color="#f5f0e6" y={590} />
    </AbsoluteFill>
  );
};

/* Shot 2: layered paper world, each layer drifting on its own; vivid Labubu printed cut-out. */
const ShotPaper: React.FC = () => {
  const f = useCurrentFrame();
  const D = 135;
  const cam = f2(f, 0, D, 0, 1, (x) => x);
  // parallax: near layers move more
  const L = (depth: number) => ({ x: -cam * 60 * depth, s: 1 + cam * 0.05 * depth });
  const drift = (seed: number, amp: number, per: number) => Math.sin(f / per + seed) * amp;
  const lab = f2(f, 8, 38, 0, 1, out);   // Labubu drops onto the stack, settles without bounce
  const layer = (depth: number, top: number, src: string, w: number, gap: number, extra = "") => {
    const l = L(depth);
    return (
      <Img src={P(src)} style={{ position: "absolute", left: -150 + l.x + drift(depth * 3, 6 * depth, 40 + depth * 9), top: top + drift(depth, 3, 33 + depth * 7),
        width: w, transform: `scale(${l.s}) ${extra}`, transformOrigin: "50% 0%", filter: shadow(gap) }} />
    );
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "saturate(0.75) brightness(0.9)" }}>
      <Img src={P("sky.png")} style={{ position: "absolute", left: -100 + L(0.3).x, top: -100, width: 1280, transform: `scale(${L(0.3).s})` }} />
      {/* torn-paper clouds at two depths */}
      <Img src={P("cloud2.png")} style={{ position: "absolute", left: 640 + L(0.4).x + drift(7, 8, 50), top: 690 + drift(8, 4, 37), width: 330, filter: shadow(6) }} />
      <Img src={P("cloud1.png")} style={{ position: "absolute", left: -60 + L(0.7).x + drift(9, 12, 44), top: 560 + drift(3, 5, 31), width: 460, filter: shadow(12) }} />
      {/* far plane */}
      <Img src={P("plane2.png")} style={{ position: "absolute", left: 900 - f * 2.2, top: 520 + drift(1, 10, 18), width: 150,
        transform: `rotate(${-6 + drift(2, 3, 14)}deg)`, filter: shadow(6) }} />
      {layer(0.6, 1080, "hill_back.png", 1380, 10)}
      {layer(0.9, 1290, "hill_front.png", 1380, 16)}
      </AbsoluteFill>
      {/* the key object: vivid printed cut-out with a white edge, lifted highest */}
      {/* soft light behind the key object */}
      <div style={{ position: "absolute", left: 540 - 520 + L(1.3).x * 0.6, top: 560, width: 1040, height: 1040, opacity: lab * 0.9,
        background: "radial-gradient(circle, rgba(255,247,225,0.55) 0%, rgba(255,247,225,0.18) 38%, transparent 66%)" }} />
      <div style={{ position: "absolute", left: 540 - 300 + L(1.3).x * 0.6, top: 680 + (1 - lab) * 160, width: 600, opacity: lab,
        transform: `scale(${L(1.3).s}) rotate(${drift(5, 1.2, 26)}deg)`, transformOrigin: "50% 90%",
        filter: `brightness(1.12) saturate(1.25) contrast(1.05) ${shadow(18 + 14 * lab)}` }}>
        <Img src={P("labubu_print.png")} style={{ width: 600 }} />
      </div>
      <div style={{ filter: "saturate(0.75) brightness(0.9)" }}>{layer(1.2, 1560, "ground.png", 1380, 20)}</div>
      {/* near plane crossing the frame */}
      <Img src={P("plane1.png")} style={{ position: "absolute", left: -260 + f * 5.2, top: 120 + drift(4, 18, 20), width: 230,
        transform: `rotate(${4 + drift(3, 4, 12)}deg) scaleX(-1)`, filter: shadow(28) }} />
      <Words text="Everyone wanted" at={30} size={68} color="#2b2722" y={250} dark />
      <Words text="one" at={52} size={200} color="#7FA81E" y={330} dark />
    </AbsoluteFill>
  );
};

export const PaperTest: React.FC = () => {
  const f = useCurrentFrame();
  // rack-focus dissolve between the shots (Beethoven-style), no flash
  const x = f2(f, 128, 146, 0, 1);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={146}>
        <AbsoluteFill style={{ filter: x > 0 ? `blur(${x * 16}px)` : undefined, opacity: 1 - x }}><ShotClip /></AbsoluteFill>
      </Sequence>
      <Sequence from={128}>
        <AbsoluteFill style={{ filter: x < 1 ? `blur(${(1 - x) * 16}px)` : undefined, opacity: x }}><ShotPaper /></AbsoluteFill>
      </Sequence>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(20,15,10,0.35))", pointerEvents: "none" }} />
      <Grain />
    </AbsoluteFill>
  );
};
