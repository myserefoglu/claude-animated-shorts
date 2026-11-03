import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { Abs, C, Confetti, EASE, Fill, Halftone, Head, HEAD, BODY, MARKER, lerp, PopWords, Rays, Stamp, Sticker, usePop, useShake, useT, clamp } from "./lib";
import { wordAt, segStart, segEnd, sceneRange } from "./timeline";

type P = { start: number };

/* 1. HOOK — "What happened to Labubu?" */
export const Hook: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const pop = usePop();
  const T = useT(start);
  const land = 16;
  const drop = pop(4, { damping: 9, stiffness: 140 });
  const squash = f >= land ? 1 - 0.18 * Math.exp(-(f - land) / 3) * Math.cos((f - land) / 1.6) : 1;
  const shake = useShake([land, T(wordAt(0, "Labubu"))], 26);
  const letters = "LABUBU?".split("");
  const lAt = T(wordAt(0, "Labubu")) - 2;
  return (
    <Fill style={{ background: C.pink }}>
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        <Rays a="#FF5DB5" b="#FF2E92" speed={0.8} n={20} cy="52%" />
        <Halftone color="#fff" opacity={0.18} />
        {/* giant wobbling question mark */}
        <Abs x={540 + Math.sin(f / 6) * 20} y={760}>
          <div style={{ fontFamily: HEAD, fontSize: 1300, color: "rgba(255,255,255,0.22)", transform: `rotate(${Math.sin(f / 8) * 10}deg) scale(${lerp(f, 0, 20, 0.4, 1, EASE.back)})` }}>?</div>
        </Abs>
        <Sticker who="pink" h={1000} x={540} y={interpolate(drop, [0, 1], [-700, 1090])} sx={2 - squash} sy={squash} rot={Math.sin(f / 5) * 3} border={12} />
        <Abs x={540} y={250}>
          <PopWords text="What happened to" at={2} gap={4} size={110} colors={["#fff"]} />
        </Abs>
        <Abs x={540} y={440}>
          <div style={{ display: "flex" }}>
            {letters.map((l, i) => {
              const p = pop(lAt + i * 2, { damping: 8 });
              const bob = Math.sin((f - i * 3) / 4) * 10 * Math.min(1, Math.max(0, (f - lAt - 14) / 10));
              return (
                <div key={i} style={{ transform: `translateY(${(1 - p) * -300 + bob}px) rotate(${(i % 2 ? 8 : -8) * (1 - p) + (i % 2 ? 3 : -3)}deg) scale(${p})` }}>
                  <Head size={250} color={i === 6 ? C.lime : i % 2 ? C.lime : "#fff"}>{l}</Head>
                </div>
              );
            })}
          </div>
        </Abs>
      </div>
    </Fill>
  );
};

/* 2. QUEUE — "Last year, grown adults were sleeping outside malls" */
const Sleeper: React.FC<{ i: number; x: number; f: number }> = ({ i, x, f }) => {
  const bag = ["#FF6B6B", "#4D96FF", "#FFD93D", "#6BCB77", "#B983FF", "#FF8FAB"][i % 6];
  const skin = ["#F1C27D", "#C68642", "#8D5524", "#FFDBAC", "#E0AC69"][i % 5];
  const hat = ["#222", "#E63946", "#457B9D", "#F4A261"][i % 4];
  const breathe = 1 + Math.sin(f / 9 + i) * 0.04;
  const z = ((f + i * 13) % 60) / 60;
  return (
    <div style={{ position: "absolute", left: x, top: 1180 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 230, height: 92, borderRadius: 46, background: bag, border: "6px solid #141414", transform: `scaleY(${breathe})`, transformOrigin: "bottom" }} />
      <div style={{ position: "absolute", left: 18, top: 30, width: 190, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.35)" }} />
      <div style={{ position: "absolute", left: 186, top: -12, width: 78, height: 78, borderRadius: 40, background: skin, border: "6px solid #141414" }} />
      <div style={{ position: "absolute", left: 186, top: -22, width: 78, height: 40, borderRadius: "40px 40px 6px 6px", background: hat, border: "6px solid #141414" }} />
      <div style={{ position: "absolute", left: 230, top: -60 - z * 120, opacity: Math.sin(z * Math.PI), fontFamily: HEAD, fontSize: 40 + z * 30, color: "#fff" }}>Z</div>
    </div>
  );
};

export const Queue: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const [a, b] = sceneRange("queue");
  const dur = (b - a) * 30;
  const pan = lerp(f, 0, dur, -3400, -150, EASE.inOut);
  const T = useT(start);
  const pop = usePop();
  return (
    <Fill style={{ background: "linear-gradient(#070A26 0%, #1C1550 55%, #3B2370 100%)" }}>
      {Array.from({ length: 70 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`x${i}`) * 1080, top: random(`y${i}`) * 950, width: 5, height: 5, borderRadius: 3, background: "#fff", opacity: 0.3 + 0.7 * Math.abs(Math.sin(f / 7 + i)) }} />
      ))}
      <div style={{ position: "absolute", left: 760, top: 150, width: 170, height: 170, borderRadius: 90, background: "#FFF6C9", boxShadow: "0 0 120px 40px rgba(255,246,201,0.35)" }} />
      {/* skyline (slow parallax) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 3000, height: 1920, transform: `translateX(${pan * 0.25}px)` }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const h = 260 + random(`bh${i}`) * 420, w = 150 + random(`bw${i}`) * 120;
          return (
            <div key={i} style={{ position: "absolute", left: i * 135, top: 1300 - h, width: w, height: h, background: "#241C4F", borderTop: "6px solid #33296A" }}>
              {Array.from({ length: 12 }).map((_, k) => (
                <div key={k} style={{ position: "absolute", left: 20 + (k % 3) * 40, top: 30 + Math.floor(k / 3) * 60, width: 22, height: 30, background: random(`wl${i}${k}`) > 0.6 ? "#FFD96B" : "#1A1440" }} />
              ))}
            </div>
          );
        })}
      </div>
      {/* world that pans */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 5000, height: 1920, transform: `translateX(${pan}px)` }}>
        {/* the mall at the far right end */}
        <div style={{ position: "absolute", left: 3820, top: 560, width: 1000, height: 760, background: "#2B2D42", border: "10px solid #111" }}>
          <div style={{ position: "absolute", left: 120, top: 230, width: 330, height: 530, background: "#FFE08A", boxShadow: "0 0 80px 30px rgba(255,224,138,0.5)" }} />
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ position: "absolute", left: 540 + k * 140, top: 250, width: 100, height: 160, background: "#4B4F72" }} />
          ))}
          <div style={{ position: "absolute", left: 60, top: 40, fontFamily: HEAD, fontSize: 150, color: C.pink, opacity: 0.75 + 0.25 * (Math.sin(f * 1.7) > -0.8 ? 1 : 0), textShadow: `0 0 30px ${C.pink}, 0 0 70px ${C.pink}` }}>MALL</div>
        </div>
        {Array.from({ length: 16 }).map((_, i) => (
          <Sleeper key={i} i={i} x={3560 - i * 250} f={f} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, top: 1300, right: 0, bottom: 0, background: "#16122E" }} />
      <Abs x={540} y={330}>
        <PopWords text="Grown adults" at={T(wordAt(1, "grown"))} size={150} colors={["#fff", C.lime]} />
      </Abs>
      <Abs x={540} y={520}>
        <PopWords text="sleeping outside malls" at={T(wordAt(1, "sleeping"))} size={96} gap={5} colors={["#fff", "#fff", C.pink]} />
      </Abs>
      {/* "LAST YEAR" film tag */}
      <div style={{ position: "absolute", left: 50, top: 70, transform: `scale(${pop(2)}) rotate(-4deg)`, background: C.gold, border: "6px solid #141414", padding: "8px 24px", fontFamily: HEAD, fontSize: 64, color: C.ink }}>LAST YEAR</div>
      <div style={{ position: "absolute", right: 50, top: 82, fontFamily: BODY, fontWeight: 900, fontSize: 52, color: "#ff5a5a" }}>
        ● {String(3).padStart(2, "0")}:{String(Math.floor(12 + f / 4) % 60).padStart(2, "0")} AM
      </div>
    </Fill>
  );
};

/* 3. RULER — "for a six-inch monster with teeth" */
export const Ruler: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const grow = lerp(f, T(wordAt(1, "six")) - 4, T(wordAt(1, "monster")), 0, 1, EASE.out);
  const inches = Math.round(grow * 6);
  const teeth = T(wordAt(1, "teeth")) - 3;
  const zoom = lerp(f, teeth - 6, teeth + 6, 1, 2.1, EASE.inOut);
  const shake = useShake([teeth + 6], 18);
  const rulerH = 1000;
  // mouth in the green cut-out sits at ~(0.47, 0.41) of the image; sticker is 1050 tall at (430, 1010)
  const mx = 430 + (0.47 - 0.5) * 1050 * 0.637, my = 1010 + (0.41 - 0.5) * 1050;
  return (
    <Fill style={{ background: C.lime }}>
      <Halftone color="#8DB800" opacity={0.5} dot={8} />
      <div style={{ position: "absolute", inset: 0, transform: `${shake} scale(${zoom})`, transformOrigin: `${mx}px ${my}px` }}>
        <Sticker who="green" h={1050} x={430} y={1010} scale={pop(0, { damping: 10 })} rot={Math.sin(f / 6) * 2} border={12} />
        {/* ruler */}
        <div style={{ position: "absolute", left: 830, top: 1535 - rulerH * grow, width: 150, height: rulerH * grow, background: C.gold, border: "8px solid #141414", borderRadius: 10, overflow: "hidden" }}>
          {Array.from({ length: 25 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 0, bottom: (k * rulerH) / 24, width: k % 4 === 0 ? 80 : 40, height: 6, background: "#141414" }} />
          ))}
          {Array.from({ length: 7 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 92, bottom: (k * rulerH) / 6 - 26, fontFamily: HEAD, fontSize: 46, color: C.ink }}>{k}</div>
          ))}
        </div>
        <Abs x={905} y={1535 - rulerH * grow - 90}>
          <Head size={120} color="#fff">{inches}"</Head>
        </Abs>
        {/* teeth callout */}
        {f > teeth && (
          <>
            <div style={{ position: "absolute", left: mx - 210, top: my - 40, width: 420, height: 170, borderRadius: "50%", border: `12px solid ${C.red}`, transform: `scale(${pop(teeth + 2)}) rotate(-6deg)` }} />
            <Abs x={mx + 30} y={my - 170}>
              <div style={{ fontFamily: MARKER, fontSize: 64, color: C.red, transform: `scale(${pop(teeth + 5) / 2.1}) rotate(-8deg)`, textShadow: "3px 3px 0 #fff" }}>TEETH!!</div>
            </Abs>
          </>
        )}
      </div>
      <Abs x={540} y={250}>
        <PopWords text="six-inch monster" at={T(wordAt(1, "six")) - 2} size={130} gap={6} colors={["#fff", C.pink]} />
      </Abs>
    </Fill>
  );
};

/* 4. RESALE — "Resale prices hit hundreds of dollars." */
export const Resale: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const hit = T(wordAt(2, "hundreds"));
  const price = Math.round(lerp(f, 4, hit + 6, 30, 300, EASE.in));
  const swing = Math.sin(f / 7) * 8 * Math.exp(-f / 60) + Math.sin(f / 11) * 3;
  const shake = useShake([hit + 6], 20);
  const line = lerp(f, 0, hit + 10, 0, 1, EASE.in);
  return (
    <Fill style={{ background: "#0A7A3C" }}>
      <Halftone color="#0FA352" opacity={0.6} gap={40} dot={10} drift={-0.8} />
      {/* rising chart line */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <path d="M -20 1700 L 200 1560 L 330 1610 L 520 1300 L 640 1360 L 820 900 L 940 980 L 1120 300" fill="none" stroke={C.lime} strokeWidth={26} strokeLinejoin="round" strokeDasharray={3000} strokeDashoffset={3000 * (1 - line)} />
      </svg>
      {/* money rain */}
      {Array.from({ length: 26 }).map((_, i) => {
        const y = ((f * (9 + random(`v${i}`) * 9) + random(`o${i}`) * 2200) % 2300) - 250;
        const x = random(`b${i}`) * 1100 - 40;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 150, height: 72, background: "#B9F6CA", border: "5px solid #0B5E2F", borderRadius: 8, transform: `rotate(${(f * (i % 2 ? 3 : -3) + i * 40) % 360}deg) rotateY(${f * 8 + i * 20}deg)`, fontFamily: HEAD, fontSize: 48, color: "#0B5E2F", textAlign: "center", lineHeight: "62px" }}>$</div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        {/* swinging price tag */}
        <div style={{ position: "absolute", left: 540, top: 470, transformOrigin: "0 0", transform: `rotate(${swing}deg) scale(${pop(0)})` }}>
          <div style={{ position: "absolute", left: -4, top: -300, width: 8, height: 300, background: "#141414" }} />
          <div style={{ position: "absolute", left: -330, top: 0, width: 660, height: 380, background: C.cream, border: "12px solid #141414", borderRadius: "40px 40px 40px 40px", boxShadow: "18px 22px 0 rgba(0,0,0,0.3)" }}>
            <div style={{ position: "absolute", left: 300, top: 22, width: 40, height: 40, borderRadius: 20, border: "8px solid #141414" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 52, color: "#666", letterSpacing: 6 }}>RESALE PRICE</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: HEAD, fontSize: 210, color: C.red }}>${price}{f > hit + 6 ? "+" : ""}</div>
          </div>
        </div>
        <Sticker who="pink" h={620} x={250} y={1240} rot={-10 + Math.sin(f / 5) * 4} scale={pop(6)} />
        <Stamp text="$$$ HUNDREDS" at={hit + 4} x={640} y={1150} size={120} rot={-8} color={C.red} />
      </div>
    </Fill>
  );
};

/* 5. WANTED — "Everyone wanted one, and almost nobody could get one." */
export const Wanted: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const nobody = T(wordAt(3, "nobody"));
  const lift = lerp(f, nobody - 10, nobody + 20, 0, -260, EASE.inOut);
  const shake = useShake([nobody + 4], 26);
  const skins = ["#F1C27D", "#C68642", "#8D5524", "#FFDBAC", "#E0AC69"];
  return (
    <Fill style={{ background: "#FFD23F" }}>
      <Rays a="#FFD23F" b="#FFE170" speed={-0.3} n={24} cy="35%" />
      <div style={{ position: "absolute", left: 540 - 420, top: 0, width: 840, height: 1400, background: "linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0))", clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        {/* the prize, floating out of reach */}
        <div style={{ position: "absolute", left: 340, top: 1000 + lift, width: 400, height: 70, borderRadius: "50%", background: "#141414", opacity: 0.25 }} />
        <Sticker who="pink" h={640} x={540} y={720 + lift + Math.sin(f / 8) * 14} scale={pop(0)} rot={Math.sin(f / 10) * 4} />
        <div style={{ position: "absolute", left: 540 - 330, top: 720 + lift - 330, width: 660, height: 660, borderRadius: 330, background: "radial-gradient(rgba(255,255,255,0.6), transparent 65%)", mixBlendMode: "screen" }} />
        {/* reaching arms */}
        {Array.from({ length: 13 }).map((_, i) => {
          const x = 30 + i * 82 + (random(`ax${i}`) - 0.5) * 40;
          const reach = 0.5 + 0.5 * Math.sin(f / (5 + random(`af${i}`) * 4) + i * 1.7);
          const top = 1250 - reach * 170 - (i % 3) * 50;
          const rot = (x - 540) / -18 + Math.sin(f / 6 + i) * 4;
          const sk = skins[i % skins.length];
          return (
            <div key={i} style={{ position: "absolute", left: x, top, transform: `rotate(${rot}deg) translateY(${(1 - pop(i * 1.5)) * 500}px)`, transformOrigin: "50% 100%" }}>
              <div style={{ width: 70, height: 900, background: ["#3A86FF", "#FF006E", "#8338EC", "#FB5607", "#06D6A0"][i % 5], border: "6px solid #141414", borderRadius: 30, position: "absolute", top: 110 }} />
              <div style={{ width: 96, height: 120, background: sk, border: "6px solid #141414", borderRadius: "40px 40px 30px 30px", position: "absolute", left: -13, top: 0 }} />
            </div>
          );
        })}
      </div>
      <Abs x={540} y={230}>
        <PopWords text="Everyone wanted one" at={T(wordAt(3, "everyone")) - 2} size={118} gap={4} colors={["#fff", "#fff", C.pink]} />
      </Abs>
      <Stamp text="SOLD OUT" at={nobody + 2} x={540} y={560} size={190} rot={-12} />
    </Fill>
  );
};

/* 6. FIXED — "Then Pop Mart fixed it." */
export const Fixed: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const fix = T(wordAt(4, "fixed"));
  const needle = lerp(f, 6, fix + 4, -80, 80, EASE.back) + (f > fix + 4 ? Math.sin(f * 2.5) * 3 : 0);
  const shake = useShake([fix + 4], 14);
  const Gear: React.FC<{ x: number; y: number; r: number; dir: number; col: string }> = ({ x, y, r, dir, col }) => (
    <svg width={r * 2.6} height={r * 2.6} style={{ position: "absolute", left: x - r * 1.3, top: y - r * 1.3, transform: `rotate(${f * dir * 4}deg)` }} viewBox="-130 -130 260 260">
      {Array.from({ length: 10 }).map((_, k) => (
        <rect key={k} x={-18} y={-125} width={36} height={50} fill={col} stroke="#141414" strokeWidth={8} transform={`rotate(${k * 36})`} />
      ))}
      <circle r={92} fill={col} stroke="#141414" strokeWidth={10} />
      <circle r={30} fill="#1B3A6B" stroke="#141414" strokeWidth={10} />
    </svg>
  );
  return (
    <Fill style={{ background: "#1B3A6B" }}>
      <div style={{ position: "absolute", inset: -50, backgroundImage: "linear-gradient(rgba(255,255,255,0.09) 3px, transparent 3px), linear-gradient(90deg, rgba(255,255,255,0.09) 3px, transparent 3px)", backgroundSize: "80px 80px", transform: `translateY(${f % 80}px)` }} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        <Gear x={170} y={1500} r={150} dir={1} col={C.gold} />
        <Gear x={400} y={1640} r={100} dir={-1.5} col={C.sky} />
        <Gear x={930} y={1450} r={120} dir={-1.2} col={C.pink} />
        {/* production dial */}
        <div style={{ position: "absolute", left: 140, top: 640, width: 800, height: 800, transform: `scale(${pop(0)})` }}>
          <svg width={800} height={800} viewBox="-400 -400 800 800">
            <path d="M -340 0 A 340 340 0 0 1 340 0" fill="none" stroke="#fff" strokeWidth={70} />
            <path d="M 170 -294 A 340 340 0 0 1 340 0" fill="none" stroke={C.red} strokeWidth={70} />
            <path d="M -340 0 A 340 340 0 0 1 -170 -294" fill="none" stroke={C.lime} strokeWidth={70} />
            <path d="M -340 0 A 340 340 0 0 1 340 0" fill="none" stroke="#141414" strokeWidth={8} transform="scale(1.1)" />
            <g transform={`rotate(${needle})`}>
              <path d="M -22 0 L 0 -320 L 22 0 Z" fill="#141414" />
            </g>
            <circle r={50} fill="#141414" />
            <text x={-330} y={80} fill="#fff" fontFamily={HEAD} fontSize={60}>LOW</text>
            <text x={230} y={80} fill="#fff" fontFamily={HEAD} fontSize={60}>MAX</text>
            <text x={0} y={170} textAnchor="middle" fill="#fff" fontFamily={BODY} fontWeight={900} fontSize={54} letterSpacing={8}>PRODUCTION</text>
          </svg>
        </div>
      </div>
      <Abs x={540} y={300}>
        <PopWords text="Pop Mart" at={T(wordAt(4, "pop"))} size={130} gap={3} colors={["#fff"]} />
      </Abs>
      <Abs x={540} y={470}>
        <div style={{ transform: `scale(${pop(fix)}) rotate(-4deg)`, background: C.lime, border: "10px solid #141414", padding: "6px 40px", boxShadow: "12px 14px 0 #141414" }}>
          <Head size={130} color={C.ink} stroke={0} shadow="">FIXED IT ✓</Head>
        </div>
      </Abs>
    </Fill>
  );
};

/* 7. TEN X — "It made about ten times more of them." */
export const TenX: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const t0 = T(wordAt(5, "ten")) - 6;
  const steps = [1, 2, 4, 10, 20, 40, 70, 100];
  const k = Math.max(0, Math.min(steps.length - 1, Math.floor((f - t0 + 6) / 4.5)));
  const n = f < t0 ? 1 : steps[k];
  const mult = Math.max(1, Math.min(10, Math.round(lerp(f, t0, t0 + 30, 1, 10, EASE.out))));
  const cols = 10;
  const shake = useShake([t0 + 30], 18);
  return (
    <Fill style={{ background: "#FFF4E0" }}>
      <Halftone color={C.pink} opacity={0.25} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        {n === 1 ? (
          <Sticker who="green" h={760} x={540} y={1050} scale={pop(0)} rot={Math.sin(f / 6) * 3} />
        ) : (
          Array.from({ length: n }).map((_, i) => {
            const cx = i % cols, cy = Math.floor(i / cols);
            const born = t0 + steps.findIndex((s) => s > i) * 4.5;
            return (
              <Sticker key={i} who={(cx + cy) % 2 ? "pink" : "green"} h={175} x={60 + cx * 107} y={330 + cy * 150} border={5} shadow={false} scale={pop(born - 4)} rot={Math.sin(f / 4 + i) * 8} />
            );
          })
        )}
      </div>
      <Abs x={540} y={1000}>
        <div style={{ transform: `scale(${pop(t0) * (1 + 0.08 * Math.sin(f / 2))}) rotate(-6deg)` }}>
          <Head size={430} color={C.pink} stroke={0.06} shadow={C.ink}>×{mult}</Head>
        </div>
      </Abs>
      <Abs x={540} y={1290}>
        <div style={{ transform: `scale(${pop(t0 + 10)})` }}>
          <Head size={84} color="#fff">MORE LABUBUS</Head>
        </div>
      </Abs>
    </Fill>
  );
};

export { clamp, segStart, segEnd, Confetti };
