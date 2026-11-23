// Render penuh "Pak Darto" -> out/darto/Darto_Final.mp4  (lintas-platform)
// Pakai:  npm run render:darto            (video + caption)
//         npm run render:darto -- DartoShort out/darto/tanpa_caption.mp4
// Env opsional: CHROME_PATH=/path/ke/chrome  CONCURRENCY=2
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const compId = process.argv[2] || "DartoShortWithCaptions";
const outputLocation = path.resolve(process.argv[3] || "out/darto/Darto_Final.mp4");
fs.mkdirSync(path.dirname(outputLocation), { recursive: true });

const browserExecutable = process.env.CHROME_PATH || undefined;
const chromiumOptions = { gl: "angle" };

console.log(`Bundling ${compId}...`);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable, chromiumOptions });

const t0 = Date.now();
console.log(`Render ${composition.durationInFrames} frame (${(composition.durationInFrames / 30).toFixed(1)} s) -> ${outputLocation}`);
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation, crf: 18,
  concurrency: Number(process.env.CONCURRENCY || 2),
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000,
  onProgress: ({ renderedFrames, encodedFrames, progress }) => {
    if (renderedFrames % 120 === 0 || progress === 1) console.log(`Progress ${(progress * 100).toFixed(1)}% (render ${renderedFrames}/${composition.durationInFrames}, encode ${encodedFrames})`);
  },
});
console.log(`Selesai dalam ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${outputLocation}`);
