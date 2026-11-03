import React from "react";
import { AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame, interpolate } from "remotion";
import { BODY, C, clamp } from "./lib";
import { FPS, SCENES, TOTAL_FRAMES, WORDS, SceneId } from "./timeline";
import { Hook, Queue, Ruler, Resale, Wanted, Fixed, TenX } from "./scenesA";
import { Scalpers, Retail, Win, Instead, Americas, FirstTime, NotDead, Ending } from "./scenesB";

export const LABUBU_FRAMES = TOTAL_FRAMES;

const COMPONENTS: Record<SceneId, React.FC<{ start: number }>> = {
  hook: Hook, queue: Queue, ruler: Ruler, resale: Resale, wanted: Wanted, fixed: Fixed, tenx: TenX,
  scalpers: Scalpers, retail: Retail, win: Win, instead: Instead, americas: Americas, firsttime: FirstTime,
  notdead: NotDead, ending: Ending,
};

/** Each scene punches in from a slight zoom + whip. */
const SceneWrap: React.FC<{ children: React.ReactNode; dir: number }> = ({ children, dir }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 7], [1.18, 1], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const x = interpolate(f, [0, 6], [dir * 140, 0], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const blur = interpolate(f, [0, 5], [14, 0], clamp);
  return <AbsoluteFill style={{ transform: `translateX(${x}px) scale(${s})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>;
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 1, 5], [0.85, 0.6, 0], clamp);
  return <AbsoluteFill style={{ background: "#fff", opacity: o, pointerEvents: "none" }} />;
};

/** Word-by-word captions, 1–3 words at a time, current word highlighted. */
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const i = WORDS.findIndex((w) => t >= w.start && t < w.end + 0.25);
  if (i < 0) return null;
  const cur = WORDS[i];
  // group: chunks of up to 3 words within the same segment
  const segWords = WORDS.filter((w) => w.seg === cur.seg);
  const idx = segWords.indexOf(cur);
  const g0 = Math.floor(idx / 3) * 3;
  const group = segWords.slice(g0, g0 + 3);
  const groupStart = group[0].start;
  const p = interpolate(t - groupStart, [0, 0.08, 0.16], [0.6, 1.08, 1], clamp);
  // hide during the ending's big text and the "Instead" slam
  if (cur.seg === 15 || (cur.seg === 9 && idx === 0)) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1500, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 18, transform: `scale(${p})` }}>
      {group.map((w, k) => {
        const on = w === cur;
        return (
          <span
            key={k}
            style={{
              fontFamily: BODY, fontWeight: 900, fontSize: 74, textTransform: "uppercase", lineHeight: 1.05,
              color: on ? C.ink : "#fff", background: on ? C.lime : "transparent", padding: "2px 14px", borderRadius: 14,
              WebkitTextStroke: on ? undefined : "10px #141414", paintOrder: "stroke fill",
              transform: on ? "rotate(-2deg) scale(1.06)" : undefined, display: "inline-block",
              boxShadow: on ? "6px 7px 0 #141414" : undefined,
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(random(`g${f}`) * 1000);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22 }}>
      <svg width="100%" height="100%">
        <filter id={`n${f}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#n${f})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, height: 14, width: `${(f / TOTAL_FRAMES) * 100}%`, background: C.lime, boxShadow: "0 3px 0 #141414" }} />
  );
};

export const LabubuShort: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {SCENES.map((s, i) => {
      const from = Math.round(s.at * FPS);
      const to = i + 1 < SCENES.length ? Math.round(SCENES[i + 1].at * FPS) : TOTAL_FRAMES;
      const Comp = COMPONENTS[s.id];
      return (
        <Sequence key={s.id} from={from} durationInFrames={to - from} name={s.id}>
          {i === 0 ? <Comp start={s.at} /> : <SceneWrap dir={i % 2 ? 1 : -1}><Comp start={s.at} /></SceneWrap>}
          {i > 0 && s.id !== "instead" && <Flash />}
        </Sequence>
      );
    })}
    <Captions />
    <Grain />
    <Progress />
    <Audio src={staticFile("labubu/mix.wav")} />
  </AbsoluteFill>
);
