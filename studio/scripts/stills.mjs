// usage: node scripts/stills.mjs <compositionId> <outDir> <frame,frame,...> [scale]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [id, outDir, framesArg, scaleArg] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_BIN || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
fs.mkdirSync(outDir, { recursive: true });
for (const frame of framesArg.split(",").map(Number)) {
  const output = path.join(outDir, `f${String(frame).padStart(4, "0")}.jpg`);
  await renderStill({ serveUrl, composition, frame, output, imageFormat: "jpeg", jpegQuality: 80, scale: Number(scaleArg || 0.5), browserExecutable,
    onBrowserLog: (l) => l.type === "error" && console.log("browser:", l.text) });
  console.log(output);
}
