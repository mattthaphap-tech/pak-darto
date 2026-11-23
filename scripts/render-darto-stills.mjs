// 8 still kunci untuk cek visual SEBELUM render penuh -> out/darto/stills/*.png
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const outDir = path.resolve("out/darto/stills");
fs.mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.CHROME_PATH || undefined;
const chromiumOptions = { gl: "angle" };
const stills = [
  [60, "01_gosip_f60"], [160, "02_pak_darto_f160"], [215, "03_sandal_f215"], [650, "04_tukang_sayur_f650"],
  [1160, "05_hampir_f1160"], [1800, "06_pos_ronda_f1800"], [2440, "07_pagar_f2440"], [2700, "08_ayah_datang_f2700"],
  [2940, "09_kantong_f2940"], [3520, "10_menyuapi_f3520"], [4220, "11_komentar_f4220"],
];
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "DartoShortWithCaptions", browserExecutable, chromiumOptions });
for (const [frame, name] of stills) {
  const output = path.join(outDir, `${name}.png`);
  await renderStill({ composition, serveUrl, frame, output, browserExecutable, chromiumOptions });
  console.log("OK", output);
}
