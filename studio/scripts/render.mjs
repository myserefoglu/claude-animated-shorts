// usage: node scripts/render.mjs <compositionId> <out.mp4> [scale]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [id, out, scaleArg] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_BIN || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
let last = -1;
await renderMedia({ serveUrl, composition, codec: "h264", crf: 18, audioBitrate: "192k", outputLocation: out, scale: Number(scaleArg || 1),
  browserExecutable, concurrency: 4, timeoutInMilliseconds: 120000,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log(`${Math.round(progress * 100)}%`); } } });
console.log("done", out);
