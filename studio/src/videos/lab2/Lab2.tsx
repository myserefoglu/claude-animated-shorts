// "What happened to Labubu?" v2: paper-cut collage style (STYLE.md), voice Algenib.
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, random, useCurrentFrame } from "remotion";
import TL from "./timeline.json";
import meta from "../../../public/lab2/meta.json";
import { A, Counter, Grain, INK, Label, LIGHT, MarkerCircle, Piece, Scene, Stamp, Strip, Words, ease, IN, INOUT, OUT, shadow, KEY_LIFT, useLocal } from "./kit";

const FPS = 30;
export const LAB2_FRAMES = Math.round(54.0 * FPS);
type Wd = { w: string; start: number; end: number; seg: number };
const WORDS = TL.words as Wd[];
const W = (seg: number, word: string) => {
  const hit = WORDS.find((x) => x.seg === seg && x.w.toLowerCase().replace(/[^\w']/g, "").startsWith(word.toLowerCase()));
  if (!hit) throw new Error(`no ${word} in ${seg}`);
  return hit.start;
};
const PINK = "#FF4FA0", LIME = "#9CCB2C", RED = "#C8322A", GOLD = "#E9B949";

const CUTS: { id: string; at: number; hard?: boolean }[] = [
  { id: "hook", at: 0 },
  { id: "queue", at: 2.45 },
  { id: "ruler", at: W(1, "for") - 0.1 },
  { id: "resale", at: 8.62 },
  { id: "wanted", at: 11.5 },
  { id: "factory", at: 15.05 },
  { id: "tenx", at: 17.7, hard: true },
  { id: "scalpers", at: 20.05 },
  { id: "retail", at: W(6, "and") - 0.05 },
  { id: "win", at: 24.8 },
  { id: "gets", at: 26.3 },
  { id: "instead", at: 29.25, hard: true },
  { id: "americas", at: 33.2, hard: true },
  { id: "firsttime", at: 36.6 },
  { id: "alive", at: 41.8 },
  { id: "podium", at: W(13, "it") - 0.15 },
  { id: "wall", at: 45.85 },
  { id: "drag", at: 48.0 },
];
const end = (id: string) => {
  const i = CUTS.findIndex((c) => c.id === id);
  return i + 1 < CUTS.length ? CUTS[i + 1].at : 54.0;
};
const durOf = (id: string, start: number) => Math.round((end(id) - start) * FPS) + 8;

type P = { start: number; id: string };

const Hook: React.FC<P> = ({ start, id }) => {
  const T = useLocal(start);
  return (
    <Scene world="hook" dur={durOf(id, start)}>
      <Piece src="qmark.png" x={720} y={760} w={470} depth={0.5} gap={16} rot={8} at={0} enter="fade" dim />
      <Strip world="hook" n={1} top={1290} depth={0.6} />
      <Piece src="pink_jump.png" x={460} y={1170} w={560} depth={1} gap={26} at={4} enter="drop" keyObj />
      <Strip world="hook" n={2} top={1600} depth={1.2} gap={20} />
      <Words text="What happened to" at={T(W(0, "what"))} size={66} y={250} />
      <Words text="Labubu?" at={T(W(0, "labubu"))} size={180} y={330} color={PINK} />
    </Scene>
  );
};

const Queue: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const FREEZE = 72;
  const t = f - FREEZE;
  const toPrint = ease(t, 0, 26, 0, 1);
  const lift = ease(t, 8, 60, 0, 1);
  const cam = 1 + ease(f, FREEZE, durOf(id, start), 0, 0.07);
  const [ox, oy] = meta.crowd_offset as [number, number];
  const [cw, ch] = meta.crowd as [number, number];
  const ps = 1 - 0.14 * toPrint;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < FREEZE ? (
        <OffthreadVideo src={A("queue.mp4")} muted style={{ width: 1080, height: 1920 }} />
      ) : (
        <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: "50% 62%" }}>
          <Img src={A("desk.png")} style={{ position: "absolute", inset: 0, opacity: toPrint }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${ps}) rotate(${-2.2 * toPrint}deg)`, transformOrigin: "50% 55%",
            filter: toPrint > 0.02 ? shadow(14 * toPrint) : undefined }}>
            <div style={{ position: "absolute", inset: -26 * toPrint, background: "#f4efe4" }} />
            <Img src={A("freeze.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: 1 - toPrint }} />
            <Img src={A("freeze_print.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: toPrint }} />
          </div>
          <div style={{ position: "absolute", left: ox, top: oy, width: cw, height: ch, transform: `scale(${ps + 0.12 * lift}) rotate(${-2.2 * toPrint + 1.6 * lift + Math.sin(f / 23) * 0.4 * lift}deg) translate(${10 * lift}px, ${-30 * lift}px)`,
            transformOrigin: `${540 - ox}px ${1056 - oy}px`, filter: `brightness(${1 + 0.08 * lift}) saturate(${1 + 0.15 * lift}) ${shadow(4 + 30 * lift)}` }}>
            <Img src={A("crowd.png")} style={{ width: cw, height: ch }} />
          </div>
        </AbsoluteFill>
      )}
      <Words text="Last year," at={T(W(1, "last"))} size={64} y={300} />
      <Words text="grown adults" at={T(W(1, "grown"))} size={150} y={390} />
      <Words text="were sleeping outside malls" at={T(W(1, "sleeping"))} size={62} y={590} />
    </AbsoluteFill>
  );
};

const Ruler: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const six = T(W(1, "six"));
  const teeth = T(W(1, "teeth"));
  const grow = ease(f, six - 6, six + 16, 0, 1, OUT);
  const zoom = ease(f, teeth - 4, teeth + 10, 1, 1.32);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "408px 990px" }}>
      <Scene world="ruler" dur={durOf(id, start)}>
        <Strip world="ruler" n={1} top={1360} depth={0.6} />
        <Piece src="green_kite.png" x={420} y={1080} w={620} depth={1} gap={24} at={0} enter="up" keyObj />
        <Piece src="ruler.png" x={880} y={1950 - 520 * grow} w={150} depth={1.1} gap={18} rot={2} />
        <Counter value={`${Math.round(6 * grow)}″`} size={130} color={INK} y={1950 - 1040 * grow - 150} x={880} at={six - 4} dark />
        <Strip world="ruler" n={2} top={1640} depth={1.25} gap={20} />
        <MarkerCircle cx={408} cy={990} rx={175} ry={72} at={teeth + 4} />
      </Scene>
      <Words text="a six-inch" at={six - 2} size={70} y={240} color={INK} dark />
      <Words text="monster" at={T(W(1, "monster"))} size={170} y={320} color={LIME} dark />
    </AbsoluteFill>
  );
};

const Resale: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const a = T(W(2, "prices")), b = T(W(2, "hundreds")) + 8;
  const v = Math.round(ease(f, a, b, 27, 300, IN));
  const swing = Math.sin(f / 9) * 6 * Math.exp(-f / 50) + Math.sin(f / 17) * 2;
  return (
    <Scene world="resale" dur={durOf(id, start)}>
      <Strip world="resale" n={1} top={1400} depth={0.6} />
      <div style={{ position: "absolute", left: 540 - 2, top: -40, width: 5, height: 650, background: "#3a2e24", transformOrigin: "50% 0", transform: `rotate(${swing * 0.3}deg)` }} />
      <div style={{ position: "absolute", left: 220, top: 610, width: 640, transformOrigin: "50% 0%", transform: `rotate(${-6 + swing}deg)`, filter: shadow(18) }}>
        <Img src={A("tag.png")} style={{ width: 640 }} />
        <div style={{ position: "absolute", left: 100, right: 0, top: 70, textAlign: "center", fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 170, color: RED,
          fontVariantNumeric: "tabular-nums", textShadow: "0 0 18px rgba(200,50,42,0.35)" }}>${v}{f > b ? "+" : ""}</div>
      </div>
      <Piece src="pink_jump.png" x={250} y={1390} w={360} depth={1.1} gap={22} at={6} enter="up" keyObj rot={-6} />
      <Strip world="resale" n={2} top={1650} depth={1.25} gap={20} />
      <Words text="Resale prices hit" at={T(W(2, "resale"))} size={68} y={220} color={INK} dark />
      <Words text="hundreds" at={T(W(2, "hundreds"))} size={150} y={300} color={RED} dark />
    </Scene>
  );
};

const Wanted: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const nob = T(W(3, "nobody"));
  const away = ease(f, nob - 4, nob + 26, 0, 1, IN);
  return (
    <Scene world="sky" dur={durOf(id, start)}>
      <Piece src="cloud2.png" x={820} y={760} w={330} depth={0.4} gap={6} />
      <Piece src="cloud1.png" x={190} y={640} w={460} depth={0.7} gap={10} />
      <Piece src="plane2.png" x={880 - f * 2.2} y={540} w={150} depth={0.5} gap={6} rot={-6} />
      <Strip world="sky" n={1} top={1120} depth={0.6} />
      <Piece src="green_kite.png" x={540} y={980 - away * 900} w={600 - away * 220} depth={1} gap={28} at={4} enter="drop" keyObj />
      <Strip world="sky" n={2} top={1380} depth={0.9} gap={16} />
      <Piece src="crowd.png" x={540} y={1620} w={1100} depth={1.3} gap={20} at={nob - 12} enter="up" dur={18} />
      <Piece src="plane1.png" x={-200 + f * 5} y={160} w={230} depth={1.4} gap={26} sx={-1} />
      <Words text="Everyone wanted" at={T(W(3, "everyone"))} size={68} y={250} color={INK} dark out={nob} />
      <Words text="one" at={T(W(3, "one"))} size={200} y={330} color={LIME} dark out={nob} />
      <Words text="almost nobody could get one" at={nob} size={64} y={300} color={INK} dark />
      <Stamp text="SOLD OUT" x={540} y={760} at={T(W(3, "get")) - 2} size={120} rot={-9} />
    </Scene>
  );
};

const Factory: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const fixed = T(W(4, "fixed"));
  return (
    <Scene world="factory" dur={durOf(id, start)}>
      <Piece src="gear1.png" x={250} y={820} w={360} depth={0.5} gap={10} rot={f * 0.8} dim />
      <Piece src="gear2.png" x={830} y={660} w={290} depth={0.6} gap={10} rot={-f * 1.1} dim />
      <Piece src="gear3.png" x={690} y={1060} w={230} depth={0.8} gap={14} rot={f * 1.5} />
      <Strip world="factory" n={1} top={1250} depth={0.6} />
      {Array.from({ length: 9 }).map((_, i) => {
        const t0 = fixed - 6 + i * 6;
        if (f < t0) return null;
        return <Piece key={i} src={i % 2 ? "box_lime.png" : "box_pink.png"} x={-160 + (f - t0) * 11} y={1455} w={190} depth={1.05} gap={14} keyObj={false} rot={(i % 3) - 1} />;
      })}
      <Strip world="factory" n={2} top={1530} depth={1.15} gap={18} />
      <Words text="Then" at={T(W(4, "then"))} size={70} y={250} />
      <Words text="Pop Mart" at={T(W(4, "pop"))} size={140} y={330} />
      <Words text="fixed it." at={fixed} size={120} y={500} color={LIME} />
    </Scene>
  );
};

const TenX: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const t0 = T(W(5, "ten")) - 10;
  const n = Math.max(1, Math.min(10, 1 + Math.floor(ease(f, t0, t0 + 26, 0, 9.99, (x) => x))));
  const items = 70;
  return (
    <Scene world="pile" dur={durOf(id, start)} push={0.03}>
      <Strip world="pile" n={1} top={1500} depth={0.5} />
      {Array.from({ length: items }).map((_, i) => {
        const at = t0 - 6 + i * 0.45;
        const col = i % 7, row = Math.floor(i / 7);
        const x = 70 + col * 157 + (random(`x${i}`) - 0.5) * 60;
        const y = 1780 - row * 120 + (random(`y${i}`) - 0.5) * 40;
        const kind = i % 5 === 4 ? (i % 2 ? "box_pink.png" : "box_lime.png") : i % 2 ? "pink_s.png" : "green_s.png";
        return <Piece key={i} src={kind} x={x} y={y} w={kind.startsWith("box") ? 170 : 150} depth={0.9 + row * 0.04} gap={10} at={at} enter="drop" dur={6} rot={(random(`r${i}`) - 0.5) * 30} drift={0.5} keyObj={false} />;
      })}
      <Counter value={`×${n}`} size={250} color={PINK} y={300} at={t0} dark />
      <Words text="It made about" at={T(W(5, "it"))} size={66} y={220} color={INK} dark out={t0} />
      <Words text="times more" at={T(W(5, "times"))} size={70} y={580} color={INK} dark />
    </Scene>
  );
};

const Scalpers: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const wipe = T(W(6, "wiped"));
  const sweep = ease(f, wipe - 4, wipe + 12, 0, 1, IN);
  return (
    <Scene world="scalper" dur={durOf(id, start)}>
      <Strip world="scalper" n={1} top={1380} depth={0.6} />
      <Piece src="scalper.png" x={540} y={1180} w={980} depth={0.9} gap={18} at={0} enter="left" dur={18} rot={sweep * 14} opacity={1 - sweep * 0.2} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Piece key={i} src={i % 2 ? "box_lime.png" : "box_pink.png"} x={820 + (i % 2) * 40} y={1420 - i * 105 + sweep * (700 + i * 120)} w={200} depth={1.05} gap={16}
          rot={(i % 3 - 1) * 4 + sweep * (i % 2 ? 60 : -50)} at={4 + i * 2} enter="drop" dur={8} />
      ))}
      <Strip world="scalper" n={2} top={1960 - sweep * 1500} depth={1.2} gap={30} />
      <Words text="Scalpers" at={T(W(6, "scalpers"))} size={150} y={260} />
      <Words text="wiped out" at={wipe} size={130} y={440} color={PINK} />
    </Scene>
  );
};

const Retail: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const less = T(W(6, "less"));
  const fall = ease(f, less - 18, less + 10, 0, 1, IN);
  const v = Math.round(300 - 270 * fall);
  const landed = f > less + 10;
  return (
    <Scene world="retail" dur={durOf(id, start)}>
      <Strip world="retail" n={1} top={1500} depth={0.6} />
      <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 5 }}>
        <line x1={0} y1={1080} x2={1080} y2={1080} stroke="#3a2e24" strokeWidth={6} strokeDasharray="26 18" />
      </svg>
      <Label text="RETAIL PRICE" x={220} y={1030} at={2} rot={-2} />
      <div style={{ position: "absolute", left: 300, top: 560 + fall * 760, width: 600, transform: `rotate(${-4 + fall * 10}deg)`, filter: shadow(18 - fall * 6), zIndex: 10 }}>
        <Img src={A("tag.png")} style={{ width: 600 }} />
        <div style={{ position: "absolute", left: 90, right: 0, top: 64, textAlign: "center", fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 150, color: RED,
          fontVariantNumeric: "tabular-nums", opacity: landed ? 0.25 : 1 }}>${v}</div>
      </div>
      {landed && <Stamp text="BELOW RETAIL" x={600} y={1460} at={less + 11} size={74} rot={-7} />}
      <Strip world="retail" n={2} top={1760} depth={1.2} gap={20} />
      <Words text="now sell for" at={T(W(6, "now"))} size={68} y={220} color={INK} dark />
      <Words text="less than retail" at={less} size={120} y={300} color={RED} dark />
    </Scene>
  );
};

const Win: React.FC<P> = ({ start, id }) => {
  const T = useLocal(start);
  return (
    <Scene world="win" dur={durOf(id, start)}>
      <Piece src="cloud3.png" x={800} y={700} w={420} depth={0.4} gap={8} />
      <Strip world="win" n={1} top={1260} depth={0.6} />
      <Piece src="pink_jump.png" x={360} y={1120} w={420} depth={1} gap={24} at={0} enter="up" keyObj rot={-5} />
      <Piece src="green_kite.png" x={740} y={1090} w={520} depth={1.05} gap={26} at={5} enter="up" keyObj rot={4} />
      <Strip world="win" n={2} top={1580} depth={1.2} gap={20} />
      <Words text="That should've been" at={T(W(7, "that"))} size={70} y={230} color={INK} dark />
      <Words text="the win." at={T(W(7, "win")) - 3} size={170} y={310} color={PINK} dark />
    </Scene>
  );
};

const Gets: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const fin = T(W(8, "finally"));
  return (
    <Scene world="win" dur={durOf(id, start)}>
      <Strip world="win" n={1} top={1150} depth={0.6} />
      {Array.from({ length: 9 }).map((_, i) => {
        const t0 = fin - 4 + i * 4;
        const fall = ease(f, t0, t0 + 26, 0, 1, OUT);
        if (f < t0) return null;
        return <Piece key={i} src={i % 2 ? "pink_s.png" : "green_s.png"} x={120 + i * 105} y={-150 + fall * (1100 + (i % 3) * 60)} w={150} depth={1} gap={18} rot={(i % 2 ? 1 : -1) * (20 - fall * 14)} keyObj />;
      })}
      <Piece src="crowd.png" x={540} y={1560} w={1120} depth={1.2} gap={22} at={0} enter="up" />
      <Words text="Everyone finally gets" at={T(W(8, "everyone"))} size={70} y={230} color={INK} dark />
      <Words text="the toy" at={T(W(8, "toy"))} size={170} y={310} color={PINK} dark />
    </Scene>
  );
};

const Instead: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const fell = T(W(9, "fell")), half = T(W(9, "half"));
  const shrink = ease(f, fell, half + 6, 1, 0.5, INOUT);
  const pct = Math.round((1 - shrink) * 100);
  const bars = f > 16;
  return (
    <Scene world="instead" dur={durOf(id, start)} push={0.03}>
      <Strip world="instead" n={1} top={1700} depth={0.5} />
      {bars && (
        <>
          <Piece src="bar_pink.png" x={330} y={1700 - 390} w={260} depth={0.9} gap={16} origin="50% 100%" sy={ease(f, 16, 30, 0, 1, OUT)} />
          <Piece src="bar_red.png" x={750} y={1700 - 390} w={260} depth={0.95} gap={16} origin="50% 100%" sy={ease(f, 20, 34, 0, 1, OUT) * shrink} />
          <Label text="BEFORE" x={330} y={1760} at={22} rot={-2} size={36} />
          <Label text="ONE QUARTER LATER" x={750} y={1760} at={26} rot={2} size={32} />
          <Counter value={`−${pct}%`} size={230} color={RED} y={330} at={fell - 2} />
        </>
      )}
      <Words text="Instead," at={T(W(9, "instead"))} size={210} y={760} out={T(W(9, "sales")) - 2} />
      <Words text="sales fell" at={T(W(9, "sales"))} size={70} y={230} />
      <Words text="in a single quarter" at={T(W(9, "single")) - 4} size={62} y={600} />
    </Scene>
  );
};

const Americas: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const up = T(W(10, "up")) - 6;
  const lvl = ease(f, up, up + 24, 1, 0.25, INOUT);
  return (
    <Scene world="chart" dur={durOf(id, start)} push={0.03}>
      <div style={{ position: "absolute", left: 540 - 150, top: 1680 - 1000, width: 300, height: 1000 * (1 - lvl), border: "6px dashed rgba(60,46,36,0.45)", borderBottom: "none", zIndex: 3 }} />
      <Piece src="bar_red.png" x={540} y={1680 - 450} w={300} depth={0.95} gap={18} origin="50% 100%" sy={lvl * (1000 / 900)} />
      <Label text="THE AMERICAS" x={540} y={1760} at={4} rot={-2} size={42} />
      <Counter value={`−${Math.round((1 - lvl) * 100)}%`} size={230} color={RED} y={330} at={up - 2} dark />
      <Words text="In the Americas," at={T(W(10, "in"))} size={70} y={230} color={INK} dark />
      <Words text="up to" at={up} size={60} y={600} color={INK} dark />
    </Scene>
  );
};

const FirstTime: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const shrank = T(W(11, "shrank"));
  const pts: [number, number][] = [[110, 1560], [260, 1460], [410, 1330], [560, 1190], [710, 1010], [860, 780], [990, 1300]];
  const up = ease(f, 6, shrank - 2, 0, 5);
  const dn = ease(f, shrank - 2, shrank + 6, 0, 1, IN);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  const k = Math.floor(up);
  for (let i = 1; i <= Math.min(k, 5); i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  if (k < 5) { const a = pts[k], b = pts[k + 1], t = up - k; d += ` L ${a[0] + (b[0] - a[0]) * t} ${a[1] + (b[1] - a[1]) * t}`; }
  if (dn > 0) d += ` L ${pts[5][0] + (pts[6][0] - pts[5][0]) * dn} ${pts[5][1] + (pts[6][1] - pts[5][1]) * dn}`;
  return (
    <Scene world="cork" dur={durOf(id, start)} push={0.04}>
      <Label text="THE MONSTERS LINE" x={330} y={700} at={2} rot={-3} size={40} />
      <svg width={1080} height={1920} style={{ position: "absolute", zIndex: 20, filter: "drop-shadow(4px 8px 6px rgba(0,0,0,0.35))" }}>
        <path d={d} fill="none" stroke="#D3302A" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {pts.map(([x, y], i) => (i <= up || (i === 6 && dn >= 1) ? <Piece key={i} src="pin.png" x={x} y={y} w={52} depth={1} gap={8} drift={0} z={25} /> : null))}
      <Stamp text="FIRST TIME EVER" x={540} y={1700} at={shrank + 8} size={96} rot={-6} />
      <Words text="for the first time ever," at={T(W(11, "first"))} size={64} y={230} />
      <Words text="shrank" at={shrank} size={170} y={310} color="#E0453C" />
      <Words text="in the first half of the year" at={T(W(11, "half")) - 4} size={56} y={520} />
    </Scene>
  );
};

const Alive: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const dead = T(W(12, "dead"));
  const up = ease(f, dead - 4, dead + 12, 0, 1, OUT);
  return (
    <Scene world="alive" dur={durOf(id, start)}>
      <Strip world="alive" n={1} top={1330} depth={0.6} />
      <Piece src="green_kite.png" x={540 + (1 - up) * 60} y={1090 + (1 - up) * 280} w={600} depth={1} gap={20 + 10 * up} rot={-82 * (1 - up)} origin="50% 85%" keyObj grey={0.5 * (1 - up)} />
      <Strip world="alive" n={2} top={1620} depth={1.2} gap={20} />
      <Words text="Labubu" at={T(W(12, "labubu"))} size={80} y={240} />
      <Words text="isn't dead." at={T(W(12, "isn't"))} size={160} y={330} color={LIME} />
    </Scene>
  );
};

const Podium: React.FC<P> = ({ start, id }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const hs = [0.92, 0.6, 0.48, 0.38];
  return (
    <Scene world="podium" dur={durOf(id, start)}>
      {hs.map((h, i) => {
        const g = ease(f, 4 + i * 4, 18 + i * 4, 0, 1, OUT);
        const x = 215 + i * 230;
        const top = 1750 - 900 * h * g;
        return (
          <React.Fragment key={i}>
            <Piece src={i === 0 ? "bar_pink.png" : "bar_grey.png"} x={x} y={1750 - 330} w={220} depth={0.95} gap={14} origin="50% 100%" sy={(900 * h * g) / 660} dim={i > 0} />
            {i > 0 && g > 0.9 && <Piece src={`other${i}.png`} x={x} y={top - 95} w={150} depth={1} gap={12} at={18 + i * 4} enter="drop" dur={8} />}
          </React.Fragment>
        );
      })}
      <Piece src="green_kite.png" x={215} y={1750 - 900 * 0.92 - 175} w={250} depth={1.05} gap={22} at={14} enter="drop" keyObj />
      <Label text="OTHER CHARACTERS" x={720} y={1830} at={20} rot={2} size={36} />
      <Words text="It still outsells" at={T(W(13, "it"))} size={70} y={230} color={INK} dark />
      <Words text="most" at={T(W(13, "most"))} size={170} y={310} color={LIME} dark />
    </Scene>
  );
};

const Wall: React.FC<P> = ({ start, id }) => {
  const T = useLocal(start);
  const t0 = T(W(14, "everyone")) - 4;
  return (
    <Scene world="wall" dur={durOf(id, start)} push={0.06}>
      {Array.from({ length: 48 }).map((_, i) => {
        const c = i % 6, r = Math.floor(i / 6);
        return <Piece key={i} src={(c + r) % 2 ? "pink_s.png" : "green_s.png"} x={95 + c * 178} y={720 + r * 150 - (c % 2) * 40} w={150} depth={0.8 + r * 0.05} gap={10} at={t0 + i * 0.5} enter="drop" dur={6}
          rot={(random(`w${i}`) - 0.5) * 16} keyObj={false} />;
      })}
      <Words text="once everyone could" at={T(W(14, "once"))} size={68} y={230} />
      <Words text="have one" at={T(W(14, "have"))} size={160} y={320} color={PINK} />
    </Scene>
  );
};

const Drag: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useLocal(start);
  const FR = 108;
  const t = f - FR;
  const drain = ease(t, 0, 30, 0, 1);
  const fade = ease(f, Math.round((54 - start) * FPS) - 16, Math.round((54 - start) * FPS) - 2, 0, 1);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < FR ? (
        <OffthreadVideo src={A("drag.mp4")} muted style={{ width: 1080, height: 1920 }} />
      ) : (
        <Img src={A("drag_freeze.png")} style={{ width: 1080, height: 1920, filter: `grayscale(${drain}) brightness(${1 - 0.35 * drain})`, transform: `scale(${1 + 0.04 * drain})` }} />
      )}
      <Words text="turns out" at={T(W(15, "turns"))} size={70} y={300} />
      <Words text="nobody wants one." at={T(W(15, "nobody"))} size={118} y={380} color="#D9D6D0" />
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};

const COMP: Record<string, React.FC<P>> = {
  hook: Hook, queue: Queue, ruler: Ruler, resale: Resale, wanted: Wanted, factory: Factory, tenx: TenX, scalpers: Scalpers, retail: Retail,
  win: Win, gets: Gets, instead: Instead, americas: Americas, firsttime: FirstTime, alive: Alive, podium: Podium, wall: Wall, drag: Drag,
};

/** Soft-focus dissolve in (Beethoven-style), or a hard cut for burst beats. */
const In: React.FC<{ hard?: boolean; children: React.ReactNode }> = ({ hard, children }) => {
  const f = useCurrentFrame();
  if (hard) return <AbsoluteFill>{children}</AbsoluteFill>;
  const k = ease(f, 0, 8, 0, 1);
  return <AbsoluteFill style={{ opacity: k, filter: k < 1 ? `blur(${(1 - k) * 14}px)` : undefined }}>{children}</AbsoluteFill>;
};

export const Lab2: React.FC = () => (
  <AbsoluteFill style={{ background: "#111" }}>
    {CUTS.map((c, i) => {
      const from = Math.round(c.at * FPS);
      const to = i + 1 < CUTS.length ? Math.round(CUTS[i + 1].at * FPS) + 8 : LAB2_FRAMES;
      const C = COMP[c.id];
      return (
        <Sequence key={c.id} from={from} durationInFrames={to - from} name={c.id}>
          <In hard={c.hard || i === 0}><C start={c.at} id={c.id} /></In>
        </Sequence>
      );
    })}
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 58%, rgba(20,15,10,0.32))", pointerEvents: "none" }} />
    <Grain />
    <Audio src={A("mix.wav")} />
  </AbsoluteFill>
);

export const LAB2_CUTS = CUTS.map((c) => ({ id: c.id, at: c.at }));
export { KEY_LIFT, LIGHT, OUT };
