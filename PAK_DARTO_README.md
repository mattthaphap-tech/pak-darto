# Pak Darto — Remotion project (siap render)

Short vertikal 1080×1920 @ 30 fps, 146.5 detik, gaya 2D-in-3D.

## Sudah termasuk
- `public/darto_vo.mp3` voiceover asli · `public/darto_mix.wav` mix final (VO + SFX, -15.2 LUFS, sudah jadi)
- `src/videos/darto/` set 3D (kampung, pos ronda, gang panti), karakter, 36 shot, caption (`caption_chunks.json`)
- `voice/darto.srt`

## Render
```bash
npm install
npm run studio             # preview: PakDarto / DartoShortWithCaptions
npm run stills:darto       # 11 still cek visual -> out/darto/stills/
npm run render:darto       # render penuh -> out/darto/Darto_Final.mp4
```
Composition: `DartoShortWithCaptions` (default), `DartoShort` (tanpa caption), `DartoCaptionOverlay` (caption transparan), `DartoCaptionGreenScreen`.
Opsi: `CHROME_PATH=/path/chrome`, `CONCURRENCY=4`. CLI: `npx remotion render src/index.ts DartoShortWithCaptions out/darto.mp4 --gl=angle --concurrency=2`

## Regenerasi (opsional)
`npm run chunks:darto` (caption dari SRT, butuh ffmpeg) · `npm run audio:darto` (butuh Python+numpy+scipy+ffmpeg)

## Catatan jujur
Dibuat tanpa bisa menjalankan Remotion/WebGL, jadi tampilan 3D belum pernah dirender. Logika kamera/timeline dan audio sudah diuji. Jalankan `stills:darto` dulu, lalu koreksi posisi karakter/kamera di `cast.ts` / `story.ts` bila perlu.
