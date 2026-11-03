import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { Abs, C, Confetti, EASE, Fill, Halftone, Head, HEAD, BODY, MARKER, lerp, PopWords, Rays, Stamp, Sticker, usePop, useShake, useT, clamp } from "./lib";
import { wordAt, sceneRange } from "./timeline";

type P = { start: number };

/* 8. SCALPERS — "Scalpers got wiped out," */
export const Scalpers: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const wipe = T(wordAt(6, "wiped")) - 4;
  const wave = lerp(f, wipe - 6, wipe + 14, -1300, 1400, EASE.in);
  const hitT = f - (wipe + 4);
  const flyX = hitT > 0 ? hitT * 55 : 0;
  const flyY = hitT > 0 ? -hitT * 40 + hitT * hitT * 3 : 0;
  const flyR = hitT > 0 ? hitT * 25 : 0;
  const shake = useShake([wipe + 4], 30);
  const strike = lerp(f, wipe, wipe + 8, 0, 1, EASE.out);
  return (
    <Fill style={{ background: "#2D1E5F" }}>
      <Halftone color="#5B3FB5" opacity={0.6} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        {/* the scalper */}
        <div style={{ position: "absolute", left: 540, top: 1150, transform: `translate(${flyX}px, ${flyY}px) rotate(${flyR}deg) scale(${pop(0)})` }}>
          {/* boxes */}
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ position: "absolute", left: 60 + (k % 2) * 14, top: -90 - k * 120, width: 200, height: 115, background: k % 2 ? C.pink : C.lime, border: "7px solid #141414", borderRadius: 8, fontFamily: HEAD, fontSize: 44, textAlign: "center", lineHeight: "100px", color: C.ink }}>?</div>
          ))}
          {/* body: hoodie */}
          <div style={{ position: "absolute", left: -170, top: -130, width: 300, height: 420, background: "#1A1A1A", border: "8px solid #000", borderRadius: "130px 130px 40px 40px" }} />
          <div style={{ position: "absolute", left: -120, top: -300, width: 200, height: 220, background: "#1A1A1A", border: "8px solid #000", borderRadius: "100px 100px 80px 80px" }} />
          <div style={{ position: "absolute", left: -88, top: -240, width: 136, height: 130, background: "#D9A066", borderRadius: "60px 60px 70px 70px" }} />
          <div style={{ position: "absolute", left: -98, top: -215, width: 156, height: 42, background: "#000", borderRadius: 14 }} />
          <div style={{ position: "absolute", left: -60, top: -150, width: 80, height: 18, borderRadius: "0 0 20px 20px", background: "#7A1F1F" }} />
          <div style={{ position: "absolute", left: 60, top: -330, fontFamily: HEAD, fontSize: 70, color: C.gold, transform: `rotate(${Math.sin(f / 3) * 10}deg)`, opacity: hitT > 0 ? 0 : 1 }}>$$</div>
        </div>
        {/* tidal wave of Labubus */}
        <div style={{ position: "absolute", left: wave, top: 0, width: 1300, height: 1920 }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <Sticker key={i} who={i % 2 ? "pink" : "green"} h={300} x={(i % 4) * 260 + 160 + (Math.floor(i / 4) % 2) * 120} y={560 + Math.floor(i / 4) * 230} rot={Math.sin(f / 3 + i) * 15} border={6} />
          ))}
        </div>
      </div>
      <Abs x={540} y={260}>
        <div style={{ position: "relative", transform: `scale(${pop(0)})` }}>
          <Head size={160} color="#fff">SCALPERS</Head>
          <div style={{ position: "absolute", left: -20, top: 66, height: 26, width: `${strike * 110}%`, background: C.red, transform: "rotate(-4deg)", borderRadius: 13 }} />
        </div>
      </Abs>
      <Abs x={540} y={440}>
        <div style={{ transform: `scale(${pop(wipe + 6)}) rotate(-3deg)` }}>
          <Head size={130} color={C.lime}>WIPED OUT</Head>
        </div>
      </Abs>
    </Fill>
  );
};

/* 9. RETAIL — "and some Labubus now sell for less than retail." */
export const Retail: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const less = T(wordAt(6, "less"));
  const draw = lerp(f, 2, less + 6, 0, 1, EASE.in);
  const shake = useShake([less + 6], 22);
  const dip = f > less + 6;
  const redPulse = dip ? 0.18 + 0.12 * Math.sin(f / 3) : 0;
  return (
    <Fill style={{ background: "#FFF4E0" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.07) 2px, transparent 2px)", backgroundSize: "90px 90px" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080, bottom: 0, background: `rgba(255,59,48,${0.12 + redPulse})` }} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <line x1={0} y1={1080} x2={1080} y2={1080} stroke="#141414" strokeWidth={8} strokeDasharray="30 20" />
          <path d="M 40 520 L 200 470 L 330 560 L 470 640 L 560 820 L 660 900 L 760 1150 L 880 1240 L 1000 1330" fill="none" stroke={C.red} strokeWidth={24} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={1600} strokeDashoffset={1600 * (1 - draw)} />
        </svg>
        <div style={{ position: "absolute", left: 40, top: 1000, fontFamily: BODY, fontWeight: 900, fontSize: 52, color: C.ink, background: C.gold, padding: "4px 18px", border: "6px solid #141414" }}>RETAIL PRICE</div>
        <Abs x={40 + draw * 960} y={520 + draw * 810}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: C.red, border: "8px solid #fff", boxShadow: "0 0 0 6px #141414" }} />
        </Abs>
        <Sticker who="green" h={430} x={820} y={640} rot={-14 + (dip ? Math.sin(f / 2) * 6 : 0)} scale={pop(0)} grey={dip ? lerp(f, less + 6, less + 30, 0, 0.6) : 0} />
        <Abs x={560} y={1260}>
          <div style={{ transform: `scale(${pop(less + 6)}) rotate(-5deg)`, background: C.red, color: "#fff", border: "10px solid #141414", padding: "14px 40px", boxShadow: "14px 16px 0 #141414", textAlign: "center", whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: HEAD, fontSize: 110, lineHeight: 1 }}>↓ LESS THAN</div>
            <div style={{ fontFamily: HEAD, fontSize: 140, lineHeight: 1 }}>RETAIL</div>
          </div>
        </Abs>
      </div>
      <Abs x={540} y={250}>
        <PopWords text="some now sell for" at={T(wordAt(6, "some"))} size={110} gap={4} colors={["#fff", "#fff", C.red, "#fff"]} />
      </Abs>
    </Fill>
  );
};

/* 10. WIN — "That should've been the win. Everyone finally gets the toy they wanted." */
export const Win: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const win = T(wordAt(7, "win"));
  const every = T(wordAt(8, "everyone"));
  const shake = useShake([win], 20);
  const hearts = Array.from({ length: 14 });
  return (
    <Fill style={{ background: C.gold }}>
      <Rays a="#FFC93C" b="#FFE08A" speed={1.2} n={18} cy="42%" />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        {/* trophy */}
        <div style={{ position: "absolute", left: 540, top: 760, transform: `translate(-50%,-50%) scale(${pop(0, { damping: 9 })}) rotate(${Math.sin(f / 8) * 4}deg)` }}>
          <svg width={620} height={760} viewBox="0 0 620 760">
            <path d="M 110 70 Q 0 70 20 200 Q 40 320 170 330" fill="none" stroke="#141414" strokeWidth={42} />
            <path d="M 510 70 Q 620 70 600 200 Q 580 320 450 330" fill="none" stroke="#141414" strokeWidth={42} />
            <path d="M 110 70 Q 0 70 20 200 Q 40 320 170 330" fill="none" stroke="#FFB000" strokeWidth={24} />
            <path d="M 510 70 Q 620 70 600 200 Q 580 320 450 330" fill="none" stroke="#FFB000" strokeWidth={24} />
            <path d="M 100 40 L 520 40 Q 520 380 310 450 Q 100 380 100 40 Z" fill="#FFB000" stroke="#141414" strokeWidth={14} />
            <path d="M 150 70 L 220 70 Q 230 300 300 400 Q 170 330 150 70 Z" fill="#FFE27A" />
            <rect x={270} y={445} width={80} height={130} fill="#FFB000" stroke="#141414" strokeWidth={14} />
            <rect x={160} y={570} width={300} height={110} rx={14} fill="#7B4A12" stroke="#141414" strokeWidth={14} />
            <text x={310} y={650} textAnchor="middle" fontFamily={HEAD} fontSize={64} fill="#FFE27A">#1</text>
          </svg>
        </div>
        <Sticker who="pink" h={340} x={540} y={480} scale={pop(8)} rot={Math.sin(f / 4) * 8} />
        {f > every && (
          <>
            <Sticker who="green" h={560} x={190} y={1360} scale={pop(every)} rot={-12 + Math.sin(f / 3) * 6} flip />
            <Sticker who="pink" h={540} x={900} y={1380} scale={pop(every + 4)} rot={12 + Math.sin(f / 3 + 1) * 6} />
            {hearts.map((_, i) => {
              const t = (f - every - i * 3) / 30;
              if (t < 0) return null;
              return (
                <div key={i} style={{ position: "absolute", left: 100 + random(`hx${i}`) * 880, top: 1600 - t * 700, fontSize: 90, opacity: Math.max(0, 1 - t / 1.6), color: [C.hot, C.pink, "#fff"][i % 3], transform: `scale(${Math.min(1, t * 4)}) rotate(${Math.sin(t * 6 + i) * 20}deg)`, fontFamily: BODY }}>♥</div>
              );
            })}
          </>
        )}
        <Confetti at={win - 2} seed="win" oy={700} />
        <Confetti at={every} seed="win2" n={60} oy={1200} />
      </div>
      <Abs x={540} y={210}>
        <PopWords text="the win!" at={win - 4} size={180} gap={4} colors={["#fff", C.pink]} />
      </Abs>
      {f > every - 2 && (
        <Abs x={540} y={1250}>
          <PopWords text="everyone gets one" at={every} size={104} gap={4} colors={["#fff", "#fff", C.pink]} />
        </Abs>
      )}
    </Fill>
  );
};

/* 11. INSTEAD — "Instead, sales fell by about half in a single quarter." */
export const Instead: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const fell = T(wordAt(9, "fell"));
  const half = T(wordAt(9, "half"));
  const drop = lerp(f, fell, half + 4, 1, 0.5, EASE.in);
  const shake = useShake([0, half + 4], 24);
  const pct = Math.round(lerp(f, fell, half + 4, 0, 50, EASE.in));
  const intro = f < 22;
  return (
    <Fill style={{ background: intro ? "#E9E9E9" : "#161616" }}>
      {intro ? (
        <div style={{ position: "absolute", inset: 0, transform: `${shake} rotate(${-3 + f * 0.1}deg) scale(${1.08 - f * 0.003})` }}>
          <Halftone color="#999" opacity={0.5} />
          <Abs x={540 + (f % 4 < 2 ? 8 : -8)} y={900}>
            <Head size={250} color="#fff" shadow={C.red}>INSTEAD,</Head>
          </Abs>
          <Abs x={540} y={1250}>
            <div style={{ fontFamily: MARKER, fontSize: 70, color: C.ink, transform: "rotate(-4deg)" }}>*record scratch*</div>
          </Abs>
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, transform: shake }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 60%, rgba(255,59,48,${f > half ? 0.35 : 0.1}), transparent 70%)` }} />
          {/* bars */}
          {[
            { label: "BEFORE", h: 900, col: C.pink, x: 290 },
            { label: "ONE QUARTER LATER", h: 900 * drop, col: f > half ? C.red : C.pink, x: 790 },
          ].map((b, i) => (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: b.x - 150, top: 1600 - b.h * pop(22 + i * 4), width: 300, height: b.h * pop(22 + i * 4), background: b.col, border: "10px solid #fff", borderBottom: "none" }} />
              <div style={{ position: "absolute", left: b.x - 230, width: 460, top: 1620, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 40, color: "#bbb", letterSpacing: 2 }}>{b.label}</div>
            </React.Fragment>
          ))}
          {/* ghost of the missing half */}
          {f > fell && <div style={{ position: "absolute", left: 640, top: 700, width: 300, height: 900 * (1 - drop), border: "8px dashed rgba(255,255,255,0.5)" }} />}
          <Abs x={540} y={330}>
            <div style={{ transform: `scale(${pop(fell - 2)})` }}>
              <Head size={110} color="#fff">SALES FELL</Head>
            </div>
          </Abs>
          <Abs x={790} y={560}>
            <div style={{ transform: `scale(${pop(fell) * (f > half + 4 ? 1 + 0.05 * Math.sin(f / 2) : 1)})` }}>
              <Head size={210} color={C.red} shadow="#fff">−{pct}%</Head>
            </div>
          </Abs>
        </div>
      )}
    </Fill>
  );
};

/* 12. AMERICAS — "In the Americas, by up to 75%." */
export const Americas: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const s = T(wordAt(10, "up")) - 6;
  const level = lerp(f, s, s + 30, 1, 0.25, EASE.inOut);
  const pct = Math.round((1 - level) * 100);
  const shake = useShake([s + 30], 22);
  const low = level < 0.5;
  const blink = low && Math.floor(f / 5) % 2 === 0;
  return (
    <Fill style={{ background: "#0E1B3D" }}>
      <Halftone color="#22386E" opacity={0.8} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        {/* battery */}
        <div style={{ position: "absolute", left: 250, top: 640, width: 580, height: 1020, border: "22px solid #fff", borderRadius: 60, transform: `scale(${pop(0)})` }}>
          <div style={{ position: "absolute", left: 180, top: -70, width: 180, height: 50, background: "#fff", borderRadius: "16px 16px 0 0" }} />
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 22, height: `calc(${level * 100}% - ${level * 44}px)`, background: level > 0.5 ? C.lime : low && blink ? "#7a1a14" : C.red, borderRadius: 26 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center" }}>
            <Head size={150} color="#fff">{Math.round(level * 100)}%</Head>
          </div>
        </div>
        <Sticker who="green" h={330} x={870} y={1600} rot={20 + Math.sin(f / 4) * 4} grey={lerp(f, s, s + 30, 0, 0.7)} scale={pop(4)} />
      </div>
      <Abs x={540} y={240}>
        <div style={{ transform: `scale(${pop(0)})`, display: "flex", alignItems: "center", gap: 24 }}>
                    <Head size={130} color="#fff">THE AMERICAS</Head>
        </div>
      </Abs>
      <Abs x={540} y={460}>
        <div style={{ transform: `scale(${pop(s)})`, display: "flex", alignItems: "baseline", gap: 24 }}>
          <Head size={70} color="#fff">UP TO</Head>
          <Head size={170} color={C.red} shadow="#fff">−{pct}%</Head>
        </div>
      </Abs>
    </Fill>
  );
};

/* 13. FIRST TIME EVER — "And for the first time ever, the Monsters line shrank in the first half of the year." */
export const FirstTime: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const shrank = T(wordAt(11, "shrank"));
  const first = T(wordAt(11, "first"));
  const pts: [number, number][] = [[90, 1500], [230, 1440], [370, 1330], [510, 1200], [650, 1010], [790, 760], [930, 1380]];
  const up = lerp(f, 4, shrank - 2, 0, 5, EASE.inOut);
  const down = lerp(f, shrank - 2, shrank + 8, 0, 1, EASE.in);
  const shake = useShake([shrank + 8], 26);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  const k = Math.floor(up);
  for (let i = 1; i <= k && i < 6; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  if (k < 5) {
    const a = pts[k], b = pts[k + 1], t = up - k;
    d += ` L ${a[0] + (b[0] - a[0]) * t} ${a[1] + (b[1] - a[1]) * t}`;
  }
  const dn = up >= 5 && down > 0 ? ` L ${pts[5][0] + (pts[6][0] - pts[5][0]) * down} ${pts[5][1] + (pts[6][1] - pts[5][1]) * down}` : "";
  return (
    <Fill style={{ background: "#FFF4E0" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.06) 2px, transparent 2px)", backgroundSize: "70px 70px" }} />
      <div style={{ position: "absolute", inset: 0, transform: shake }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <line x1={60} y1={1580} x2={1020} y2={1580} stroke="#141414" strokeWidth={8} />
          <path d={d} fill="none" stroke={C.green} strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" />
          {dn && <path d={`M ${pts[5][0]} ${pts[5][1]}${dn}`} fill="none" stroke={C.red} strokeWidth={30} strokeLinecap="round" />}
          {pts.slice(0, 6).map(([x, y], i) => (i <= up ? <circle key={i} cx={x} cy={y} r={16} fill="#fff" stroke="#141414" strokeWidth={8} /> : null))}
        </svg>
        {up < 5 && (
          <Abs x={pts[Math.min(5, Math.ceil(up))][0]} y={pts[Math.min(5, Math.ceil(up))][1] - 110}>
            <div style={{ transform: `rotate(${Math.sin(f / 3) * 10}deg)` }}><Head size={90} color={C.green}>↑</Head></div>
          </Abs>
        )}
        <Sticker who="pink" h={300} x={pts[5][0] + (pts[6][0] - pts[5][0]) * down} y={pts[5][1] + (pts[6][1] - pts[5][1]) * down - 170} rot={down > 0 ? 25 + Math.sin(f / 2) * 10 : Math.sin(f / 5) * 6} scale={pop(0)} />
        <Stamp text="FIRST TIME EVER" at={shrank + 8} x={540} y={1760} size={110} rot={-6} />
      </div>
      <Abs x={540} y={200}>
        <div style={{ transform: `scale(${pop(0)})`, fontFamily: BODY, fontWeight: 900, fontSize: 56, color: "#666", letterSpacing: 6, whiteSpace: "nowrap" }}>THE MONSTERS LINE</div>
      </Abs>
      <Abs x={540} y={330}>
        <div style={{ transform: `scale(${pop(first)})` }}>
          <Head size={120} color={f > shrank ? C.red : C.green}>{f > shrank ? "SHRANK ↓" : "ALWAYS UP ↑"}</Head>
        </div>
      </Abs>
      <Abs x={540} y={480}>
        <div style={{ transform: `scale(${pop(T(wordAt(11, "half")) - 2)})`, fontFamily: MARKER, fontSize: 64, color: C.ink, whiteSpace: "nowrap" }}>first half of the year</div>
      </Abs>
    </Fill>
  );
};

/* 14. NOT DEAD — "Labubu isn't dead. It still outsells most of Pop Mart's other characters." */
export const NotDead: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const dead = T(wordAt(12, "dead"));
  const out = T(wordAt(13, "outsells"));
  const up = pop(dead, { damping: 7, stiffness: 160 });
  const board = T(wordAt(13, "it")) - 4;
  const shake = useShake([dead + 3], 20);
  // ECG line
  const ecg = (() => {
    let d = "M 0 300";
    for (let x = 0; x <= 1080; x += 12) {
      const u = (x + f * 18) % 360;
      const y = u > 150 && u < 165 ? 120 : u >= 165 && u < 180 ? 470 : u >= 180 && u < 195 ? 220 : 300;
      d += ` L ${x} ${y}`;
    }
    return d;
  })();
  const bars = [
    { h: 860, me: true },
    { h: 640 },
    { h: 520 },
    { h: 430 },
    { h: 330 },
  ];
  return (
    <Fill style={{ background: f < board ? "#08130C" : C.sky }}>
      {f < board ? (
        <div style={{ position: "absolute", inset: 0, transform: shake }}>
          <svg width={1080} height={600} style={{ position: "absolute", top: 1180 }}>
            <path d={ecg} fill="none" stroke="#3CFF7A" strokeWidth={10} style={{ filter: "drop-shadow(0 0 12px #3CFF7A)" }} />
          </svg>
          <Sticker who="green" h={700} x={540} y={interpolate(up, [0, 1], [1080, 820])} rot={interpolate(up, [0, 1], [-90, 0])} />
          <Abs x={540} y={260}>
            <div style={{ transform: `scale(${pop(dead - 2)})` }}>
              <Head size={170} color="#3CFF7A" shadow="#000">NOT DEAD</Head>
            </div>
          </Abs>
          <Abs x={540} y={1700}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 60, color: "#3CFF7A", opacity: Math.floor(f / 8) % 2 ? 1 : 0.4 }}>♥ {Math.round(lerp(f, dead, dead + 10, 12, 98))} BPM</div>
          </Abs>
        </div>
      ) : (
        <>
          <Rays a="#6EC8FF" b="#8FD6FF" speed={0.5} />
          {bars.map((b, i) => {
            const g = pop(board + 4 + i * 3);
            const x = 120 + i * 200;
            return (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: x - 80, top: 1650 - b.h * g, width: 160, height: b.h * g, background: b.me ? C.pink : "#9AA5B1", border: "8px solid #141414", borderBottom: "none" }} />
                {!b.me && (
                  <div style={{ position: "absolute", left: x - 55, top: 1650 - b.h * g - 130, width: 110, height: 120, background: "#5E6873", borderRadius: "55px 55px 20px 20px", border: "7px solid #141414", fontFamily: HEAD, fontSize: 70, color: "#fff", textAlign: "center", lineHeight: "110px" }}>?</div>
                )}
              </React.Fragment>
            );
          })}
          <Sticker who="green" h={330} x={120} y={1650 - 860 * pop(board + 4) - 160} rot={Math.sin(f / 4) * 6} />
          <Abs x={120} y={1650 - 860 * pop(board + 4) - 360}>
            <svg width={170} height={120} viewBox="0 0 170 120" style={{ transform: `rotate(-14deg) scale(${pop(out)})` }}><path d="M 10 110 L 18 30 L 55 70 L 85 10 L 115 70 L 152 30 L 160 110 Z" fill={C.gold} stroke="#141414" strokeWidth={10} strokeLinejoin="round" /></svg>
          </Abs>
          <div style={{ position: "absolute", left: 220, right: 30, top: 1770, fontFamily: BODY, fontWeight: 900, fontSize: 38, color: C.ink, textAlign: "center", opacity: pop(board + 10) }}>OTHER POP MART CHARACTERS</div>
          <Abs x={540} y={230}>
            <PopWords text="still outsells most" at={out - 4} size={120} gap={4} colors={["#fff", C.pink, "#fff"]} />
          </Abs>
        </>
      )}
    </Fill>
  );
};

/* 15. ENDING — "But once everyone could have one, turns out nobody wants one." */
export const Ending: React.FC<P> = ({ start }) => {
  const f = useCurrentFrame();
  const T = useT(start);
  const pop = usePop();
  const turns = T(wordAt(15, "turns"));
  const nobody = T(wordAt(15, "nobody"));
  const [a, b] = sceneRange("ending");
  const end = Math.round((b - a) * 30);
  const grey = lerp(f, turns, nobody + 10, 0, 1);
  const cols = 8, rows = 11;
  const zoomOut = lerp(f, 0, turns, 1.12, 1, EASE.out);
  const dark = lerp(f, nobody, end - 30, 0, 0.75);
  const fadeOut = lerp(f, end - 14, end - 2, 0, 1);
  return (
    <Fill style={{ background: interpolate(grey, [0, 1], [0, 1]) > 0.5 ? "#2A2A2E" : C.pink }}>
      <div style={{ position: "absolute", inset: 0, background: "#2A2A2E", opacity: grey }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoomOut})` }}>
        {Array.from({ length: cols * rows }).map((_, i) => {
          const cx = i % cols, cy = Math.floor(i / cols);
          const centre = cx === 4 && cy === 5;
          const fallAt = nobody - 6 + random(`fall${i}`) * 40;
          const t = Math.max(0, f - fallAt);
          const fall = centre ? 0 : t * t * 1.6;
          return (
            <Sticker
              key={i}
              who={(cx + cy) % 2 ? "pink" : "green"}
              h={centre ? 230 : 190}
              x={75 + cx * 133}
              y={110 + cy * 168 + fall}
              rot={Math.sin(f / 5 + i) * (6 * (1 - grey)) + (centre ? 0 : t * (random(`r${i}`) - 0.5) * 3)}
              scale={pop(i * 0.35, { damping: 13 }) * (centre ? 1 + grey * 0.6 : 1)}
              grey={grey}
              border={5}
              shadow={false}
              style={{ zIndex: centre ? 5 : 1 }}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, transparent 15%, rgba(0,0,0,${dark}) 60%)` }} />
      <Abs x={540} y={300}>
        <div style={{ opacity: 1 - grey, transform: `scale(${pop(2)})` }}>
          <Head size={110} color="#fff">EVERYONE HAS ONE</Head>
        </div>
      </Abs>
      {f > nobody - 2 && (
        <Abs x={540} y={1430}>
          <div style={{ transform: `scale(${pop(nobody - 2, { damping: 16 })})`, textAlign: "center" }}>
            <div style={{ fontFamily: MARKER, fontSize: 64, color: "#ddd" }}>turns out...</div>
            <Head size={150} color="#fff" shadow={C.hot}>NOBODY</Head>
            <Head size={150} color="#fff" shadow={C.hot}>WANTS ONE.</Head>
          </div>
        </Abs>
      )}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeOut }} />
    </Fill>
  );
};

export { clamp, Rays, Halftone, Confetti };
