// Render ONE frame-range chunk of DartoShortWithCaptions (video-only, muted).
// Audio is muxed once at the end by the concat job, so chunks carry no audio.
// Usage: node scripts/render-chunk.mjs <startFrame> <endFrame>
// Env: CHROME_PATH=/path/ke/chrome  CONCURRENCY=2
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const start = Number(process.argv[2]);
const end = Number(process.argv[3]);
if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) {
  console.error("Usage: node scripts/render-chunk.mjs <startFrame> <endFrame>");
  process.exit(1);
}

const compId = "DartoShortWithCaptions";
const outDir = path.resolve("out/darto/chunks");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = process.env.CHROME_PATH || undefined;
// swangle = software ANGLE; proven on the CPU-only VM (plain "angle" fails to
// create a WebGL context there). On GitHub ubuntu runners swangle also works.
const chromiumOptions = { gl: "swangle" };

console.log(`Bundling ${compId}...`);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable, chromiumOptions });

const safeEnd = Math.min(end, composition.durationInFrames - 1);
const outputLocation = path.join(outDir, `chunk-${start}-${safeEnd}.mp4`);
console.log(`Chunk frames ${start}-${safeEnd} of ${composition.durationInFrames} -> ${outputLocation}`);

const t0 = Date.now();
await renderMedia({
  composition, serveUrl, codec: "h264", outputLocation, crf: 18,
  frameRange: [start, safeEnd], muted: true,
  concurrency: Number(process.env.CONCURRENCY || 2),
  browserExecutable, chromiumOptions, timeoutInMilliseconds: 600000,
  onProgress: ({ renderedFrames, encodedFrames, progress }) => {
    if (renderedFrames % 120 === 0 || progress === 1) console.log(`Progress ${(progress * 100).toFixed(1)}% (render ${renderedFrames}/${safeEnd - start + 1}, encode ${encodedFrames})`);
  },
});
console.log(`Chunk done in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${outputLocation}`);
