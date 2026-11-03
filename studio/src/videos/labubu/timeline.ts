// Timing for "What happened to Labubu?" — everything is driven by the narration take.
// Voice segments are [start, end] in seconds of voice.wav (measured with silencedetect,
// confirmed by a transcript). The voice starts VOICE_OFFSET seconds into the video.

export const FPS = 30;
export const VOICE_OFFSET = 0.4;
export const DURATION_S = 51.5;
export const TOTAL_FRAMES = Math.round(DURATION_S * FPS);

export const SEGMENTS: { t: [number, number]; text: string }[] = [
  { t: [0.0, 1.6], text: "What happened to Labubu?" },
  { t: [2.06, 7.51], text: "Last year, grown adults were sleeping outside malls for a six-inch monster with teeth." },
  { t: [8.08, 10.39], text: "Resale prices hit hundreds of dollars." },
  { t: [11.02, 13.75], text: "Everyone wanted one, and almost nobody could get one." },
  { t: [14.5, 16.07], text: "Then Pop Mart fixed it." },
  { t: [16.58, 18.43], text: "It made about ten times more of them." },
  { t: [19.11, 23.12], text: "Scalpers got wiped out, and some Labubus now sell for less than retail." },
  { t: [23.88, 25.08], text: "That should've been the win." },
  { t: [25.59, 27.65], text: "Everyone finally gets the toy they wanted." },
  { t: [28.33, 31.6], text: "Instead, sales fell by about half in a single quarter." },
  { t: [32.06, 34.78], text: "In the Americas, by up to 75%." },
  { t: [35.44, 39.62], text: "And for the first time ever, the Monsters line shrank in the first half of the year." },
  { t: [40.4, 41.46], text: "Labubu isn't dead." },
  { t: [41.84, 44.62], text: "It still outsells most of Pop Mart's other characters." },
  { t: [45.16, 46.75], text: "But once everyone could have one," },
  { t: [47.26, 48.93], text: "turns out nobody wants one." },
];

export type Word = { w: string; start: number; end: number; seg: number };

// Word times: spread each segment's duration over its words by length (+ a constant per
// word for the attack). Accurate to ~0.1 s, which is plenty for captions in short groups.
export const WORDS: Word[] = SEGMENTS.flatMap((s, seg) => {
  const words = s.text.split(" ");
  const weights = words.map((w) => w.replace(/[^\w%]/g, "").length + 2.2 + (/[,.?]$/.test(w) ? 1.5 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = s.t[0] + VOICE_OFFSET;
  const span = s.t[1] - s.t[0];
  return words.map((w, i) => {
    const d = (weights[i] / total) * span;
    const out = { w, start: t, end: t + d, seg };
    t += d;
    return out;
  });
});

/** Global time (s) when `word` (first match at or after segment `seg`) starts. */
export const wordAt = (seg: number, word: string): number => {
  const hit = WORDS.find((x) => x.seg === seg && x.w.toLowerCase().replace(/[^\w']/g, "").startsWith(word.toLowerCase()));
  if (!hit) throw new Error(`word ${word} not in seg ${seg}`);
  return hit.start;
};
export const segStart = (seg: number) => SEGMENTS[seg].t[0] + VOICE_OFFSET;
export const segEnd = (seg: number) => SEGMENTS[seg].t[1] + VOICE_OFFSET;

// Scene cuts (global seconds). Each scene runs until the next one starts.
export const SCENES = [
  { id: "hook", at: 0 },
  { id: "queue", at: 2.35 },
  { id: "ruler", at: wordAt(1, "for") - 0.05 },
  { id: "resale", at: 8.35 },
  { id: "wanted", at: 11.3 },
  { id: "fixed", at: 14.75 },
  { id: "tenx", at: 16.85 },
  { id: "scalpers", at: 19.35 },
  { id: "retail", at: wordAt(6, "and") - 0.05 },
  { id: "win", at: 24.1 },
  { id: "instead", at: 28.55 },
  { id: "americas", at: 32.3 },
  { id: "firsttime", at: 35.6 },
  { id: "notdead", at: 40.6 },
  { id: "ending", at: 45.4 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];
export const sceneRange = (id: SceneId): [number, number] => {
  const i = SCENES.findIndex((s) => s.id === id);
  return [SCENES[i].at, i + 1 < SCENES.length ? SCENES[i + 1].at : DURATION_S];
};
