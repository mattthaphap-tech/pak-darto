// Timeline "Pak Darto": 36 shot, dikunci ke voice/darto.srt (4396 frame @ 30 fps = 146.5 s).
// Bahasa kamera = framework (push-in pelan, glide/cut pada reframing, kick pada kata penekanan).
import { LightName } from "./lights";

export const FPS = 30;
export const TOTAL = 4396;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export type ShotDef = { id: number; a: number; b: number; light: LightName; sunAz?: number; sunEl?: number };

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 136, light: "golden", sunAz: 52, sunEl: 38 }, // Di sebuah kampung kecil, ada satu nama yang selalu jadi bahan gosip.
  { id: 2, a: 136, b: 185, light: "golden", sunAz: 50, sunEl: 38 }, // Pak Darto. (HERO title)
  { id: 3, a: 185, b: 315, light: "golden", sunAz: 54, sunEl: 40 }, // Bapak tua, bajunya lusuh, sandalnya sudah tipis.
  { id: 4, a: 315, b: 446, light: "day", sunAz: 56, sunEl: 44 }, // Menurut warga... beliau itu pelit. Pelit banget.
  { id: 5, a: 446, b: 564, light: "day", sunAz: 55, sunEl: 44 }, // Arisan RT minta sumbangan, Pak Darto geleng kepala.
  { id: 6, a: 564, b: 695, light: "day", sunAz: 54, sunEl: 43 }, // Menawar sampai tukang sayur menyerah.
  { id: 7, a: 695, b: 782, light: "day", sunAz: 56, sunEl: 45 }, // Punya motor, tapi lebih memilih naik angkot.
  { id: 8, a: 782, b: 891, light: "day", sunAz: 52, sunEl: 42 }, // Acara kampung? Patungan? Jangan harap.
  { id: 9, a: 891, b: 989, light: "day", sunAz: 54, sunEl: 44 }, // Bu Ratna, tetangga paling vokal, selalu berkata,
  { id: 10, a: 989, b: 1146, light: "day", sunAz: 56, sunEl: 45 }, // "Orang kok hidupnya cuma buat dirinya sendiri." Hampir semua warga setuju.
  { id: 11, a: 1146, b: 1182, light: "golden", sunAz: 50, sunEl: 36 }, // Hampir. (DIP)
  { id: 12, a: 1182, b: 1348, light: "golden", sunAz: 52, sunEl: 38 }, // Pemuda tetangga mulai memperhatikan satu hal.
  { id: 13, a: 1348, b: 1520, light: "day", sunAz: 55, sunEl: 44 }, // Setiap Jumat, kantong plastik besar. Kelihatannya berat.
  { id: 14, a: 1520, b: 1643, light: "day", sunAz: 54, sunEl: 44 }, // Pergi diam-diam, tanpa pamit.
  { id: 15, a: 1643, b: 1753, light: "golden", sunAz: 50, sunEl: 36 }, // Pemuda itu penasaran. Terlalu penasaran.
  { id: 16, a: 1753, b: 1905, light: "night", sunAz: 46, sunEl: 36 }, // Bu Ratna mengumpulkan warga di pos ronda.
  { id: 17, a: 1905, b: 1979, light: "night", sunAz: 48, sunEl: 36 }, // "Kita tegur saja Pak Darto. Biar tahu rasa." Semua mengangguk.
  { id: 18, a: 1979, b: 2091, light: "night", sunAz: 44, sunEl: 35 }, // Si pemuda diam, memikirkan kantong plastik itu.
  { id: 19, a: 2091, b: 2250, light: "day", sunAz: 56, sunEl: 45 }, // Jumat berikutnya, ia mengikuti Pak Darto. Dari jauh. Pelan-pelan.
  { id: 20, a: 2250, b: 2336, light: "day", sunAz: 54, sunEl: 44 }, // Pak Darto naik angkot,
  { id: 21, a: 2336, b: 2420, light: "day", sunAz: 54, sunEl: 44 }, // turun di gang sempit, berhenti di depan rumah sederhana.
  { id: 22, a: 2420, b: 2517, light: "day", sunAz: 52, sunEl: 42 }, // Si pemuda bersembunyi di balik pagar.
  { id: 23, a: 2517, b: 2664, light: "golden", sunAz: 52, sunEl: 38 }, // Pintu terbuka. Anak-anak berlarian. (FLASH)
  { id: 24, a: 2664, b: 2865, light: "golden", sunAz: 54, sunEl: 40 }, // Belasan anak memeluk kaki Pak Darto. "Ayah datang!" Pemuda terpaku.
  { id: 25, a: 2865, b: 3040, light: "golden", sunAz: 52, sunEl: 38 }, // Itu panti asuhan kecil. Kantong berisi beras, telur, buku tulis.
  { id: 26, a: 3040, b: 3157, light: "golden", sunAz: 50, sunEl: 38 }, // Dibeli dari hasil menawar sayur. Dari ongkos angkot yang dihemat.
  { id: 27, a: 3157, b: 3269, light: "golden", sunAz: 52, sunEl: 36 }, // Dari semua yang selama ini disebut... pelit.
  { id: 28, a: 3269, b: 3324, light: "golden", sunAz: 50, sunEl: 34 }, // Matanya memanas.
  { id: 29, a: 3324, b: 3466, light: "golden", sunAz: 52, sunEl: 38 }, // Tidak pernah minta dipuji, tidak pernah membela diri.
  { id: 30, a: 3466, b: 3601, light: "golden", sunAz: 50, sunEl: 36 }, // Beliau hanya tersenyum, menyuapi anak-anak satu per satu.
  { id: 31, a: 3601, b: 3751, light: "day", sunAz: 56, sunEl: 45 }, // Esok harinya, Bu Ratna masih bergosip di depan warung. Pemuda ingin bicara.
  { id: 32, a: 3751, b: 3899, light: "day", sunAz: 54, sunEl: 44 }, // Tapi ia sadar, tidak semua kebaikan perlu dibela dengan kata-kata.
  { id: 33, a: 3899, b: 4037, light: "golden", sunAz: 52, sunEl: 36 }, // Kadang, orang yang kita sebut pelit... sedang menanggung hidup orang lain.
  { id: 34, a: 4037, b: 4148, light: "golden", sunAz: 50, sunEl: 36 }, // Dan kita, terlalu sibuk menilai, sampai lupa bertanya.
  { id: 35, a: 4148, b: 4282, light: "golden", sunAz: 52, sunEl: 38 }, // CTA: tulis di komentar.
  { id: 36, a: 4282, b: 4396, light: "golden", sunAz: 50, sunEl: 36 }, // CTA: bagikan, supaya lebih banyak orang berhenti menghakimi.
];

export const XFADE: Record<number, number> = { 16: 8, 19: 8, 21: 8, 31: 8, 33: 8 };
export const FLASH_AT = 2517; // pintu panti terbuka
export const DIP_AT = 1146;   // "Hampir." - dip gelap singkat

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export type WorldState = {
  id: number; f: number; t: number; u: number;
  setKind: "kampung" | "ronda" | "gang";
  cart: boolean; angkot: boolean; doorOpen: boolean;
  showStars: boolean; showMoon: boolean;
};

export const worldState = (id: number, f: number): WorldState => {
  const s = SHOTS[id - 1];
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  const t = f / FPS;
  const setKind: WorldState["setKind"] = id >= 16 && id <= 18 ? "ronda" : (id >= 21 && id <= 30) || id >= 33 ? "gang" : "kampung";
  return {
    id, f, t, u, setKind,
    cart: id === 6,
    angkot: id === 7 || id === 20,
    doorOpen: setKind === "gang" && id >= 23,
    showStars: id >= 16 && id <= 18,
    showMoon: id >= 16 && id <= 18,
  };
};

// ---------------- Reference Camera Engine ----------------
export type CamPose = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<CamPose> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

const mix = (a: CamPose, b: CamPose, k: number): CamPose => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): CamPose => ({ fov: 38, roll: 0, ...c });
const run = (keys: Key[], f: number): CamPose => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 22)));
  }
  return cur;
};
const T = (f: number) => f / FPS;

/** Push-in factor since f0: subject grows ~rate per frame; `punch` raises it for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 28) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 7, (n - i - 0.5) / 7));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<CamPose> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<CamPose> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

// ---- Framing per beat ----
const B = (f0: number, pos: V3, look: V3, fov = 37, roll = 0, rate = 0.0028, punch = 0, n = 22) =>
  (f: number) => dolly(pos, look, pushK(f, f0, rate, punch, n), { fov, roll });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: B(0, [0.6, 2.2, 6.2], [0.0, 1.25, -1.2], 40, 0.01, 0.0022) },
      { f: 66, dur: 16, s: B(66, [-0.7, 1.5, 3.7], [-0.3, 1.4, -0.7], 35, -0.04, 0.003, 0.006) }],
  2: [{ f: 136, cut: true, s: B(136, [0.1, 1.0, 3.2], [0.0, 1.45, -0.5], 34, -0.05, 0.0034, 0.008, 24) }],
  3: [{ f: 185, cut: true, s: B(185, [0.5, 0.5, 1.7], [0.0, 0.18, -0.5], 32, 0.04, 0.003, 0.006, 20) },
      { f: 245, cut: true, s: B(245, [0.0, 1.4, 2.5], [0.0, 1.35, -0.5], 32, -0.03, 0.0034, 0.007, 22) }],
  4: [{ f: 315, s: B(315, [-0.4, 1.56, 4.25], [0.0, 1.38, -0.85], 36, 0.02, 0.0028) },
      { f: 404, cut: true, s: B(404, [-0.3, 1.45, 2.7], [-0.8, 1.45, -0.6], 33, -0.05, 0.0036, 0.009, 24) }],
  5: [{ f: 446, s: B(446, [0.2, 1.5, 3.6], [-0.2, 1.4, -0.7], 35, 0.03, 0.003) },
      { f: 500, cut: true, s: B(500, [0.1, 1.45, 2.6], [0.0, 1.4, -0.5], 32, -0.05, 0.0034, 0.0075, 22) }],
  6: [{ f: 564, s: B(564, [0.8, 1.5, 4.2], [1.4, 1.2, -1.0], 36, 0.02, 0.0028) },
      { f: 630, cut: true, s: B(630, [1.4, 1.4, 2.8], [1.9, 1.3, -1.0], 32, -0.05, 0.0034, 0.008, 22) }],
  7: [{ f: 695, cut: true, s: B(695, [-2.0, 1.1, 2.0], [-3.8, 0.5, -2.0], 34, 0.04, 0.003, 0.006, 20) },
      { f: 735, cut: true, s: B(735, [1.8, 1.6, 5.2], [2.2, 1.0, -1.2], 38, -0.02, 0.0026) }],
  8: [{ f: 782, cut: true, s: B(782, [0.1, 1.45, 2.6], [0.0, 1.4, -0.5], 32, -0.05, 0.0034, 0.008, 18) },
      { f: 814, cut: true, s: B(814, [0.9, 1.4, 3.0], [0.6, 1.4, -0.6], 33, 0.05, 0.0034, 0.008, 18) },
      { f: 844, cut: true, s: B(844, [0.0, 1.3, 2.3], [0.0, 1.45, -0.5], 31, -0.06, 0.004, 0.009, 22) }],
  9: [{ f: 891, s: B(891, [-0.4, 1.45, 2.7], [-0.8, 1.45, -0.6], 33, 0.04, 0.0032, 0.006, 22) }],
  10: [{ f: 989, s: B(989, [0.0, 1.7, 5.6], [0.0, 1.35, -1.0], 38, -0.02, 0.0024) },
       { f: 1060, dur: 16, s: B(1060, [-0.4, 1.5, 3.4], [-0.5, 1.4, -0.7], 34, 0.04, 0.003, 0.006) }],
  11: [{ f: 1146, cut: true, s: B(1146, [1.6, 1.45, 2.8], [2.0, 1.4, -0.7], 32, 0.07, 0.0036, 0.008, 22) }],
  12: [{ f: 1182, cut: true, s: B(1182, [2.0, 1.5, 2.6], [-2.6, 1.3, -3.4], 30, -0.04, 0.0030, 0.006) },
       { f: 1278, cut: true, s: B(1278, [1.6, 1.4, 2.6], [2.0, 1.4, -0.7], 32, 0.05, 0.0034, 0.007, 22) }],
  13: [{ f: 1348, cut: true, s: B(1348, [-1.8, 1.4, 3.6], [-1.6, 1.2, -1.0], 36, 0.02, 0.003) },
       { f: 1484, cut: true, s: B(1484, [-0.5, 1.0, 2.0], [-0.7, 0.9, -0.6], 30, -0.05, 0.0034, 0.008, 22) }],
  14: [{ f: 1520, s: B(1520, [0.5, 1.7, 5.6], [0.5, 1.3, -1.0], 39, -0.02, 0.0024) },
       { f: 1590, dur: 16, s: B(1590, [-0.6, 1.5, 3.6], [-0.9, 1.4, -0.7], 35, 0.04, 0.003, 0.006) }],
  15: [{ f: 1643, cut: true, s: B(1643, [1.7, 1.45, 2.6], [2.0, 1.4, -0.7], 32, -0.05, 0.0034, 0.007, 22) },
       { f: 1695, cut: true, s: B(1695, [1.7, 1.4, 2.2], [2.0, 1.4, -0.7], 30, 0.07, 0.004, 0.009, 24) }],
  16: [{ f: 1753, s: B(1753, [0.0, 1.6, 5.6], [0.0, 1.4, -0.9], 39, 0.015, 0.0024) },
       { f: 1815, cut: true, s: B(1815, [-0.8, 1.5, 2.6], [-1.2, 1.45, -0.8], 33, -0.04, 0.0034, 0.007, 22) }],
  17: [{ f: 1905, cut: true, s: B(1905, [-0.6, 1.45, 2.6], [-1.0, 1.45, -0.7], 32, 0.05, 0.0036, 0.009, 22) },
       { f: 1952, cut: true, s: B(1952, [0.0, 1.6, 5.2], [0.0, 1.4, -0.9], 38, -0.02, 0.0026) }],
  18: [{ f: 1979, cut: true, s: B(1979, [0.9, 1.45, 2.7], [1.3, 1.4, -0.7], 32, -0.06, 0.003, 0.006, 22) }],
  19: [{ f: 2091, s: B(2091, [0.4, 1.5, 4.8], [0.2, 1.35, -1.0], 37, 0.02, 0.0026) },
       { f: 2179, cut: true, s: B(2179, [1.4, 1.4, 2.4], [1.0, 1.4, -0.8], 32, 0.06, 0.0034, 0.007, 22) }],
  20: [{ f: 2250, s: B(2250, [1.8, 1.5, 5.0], [2.4, 1.1, -1.2], 38, -0.02, 0.0026) }],
  21: [{ f: 2336, cut: true, s: B(2336, [0.0, 1.5, 6.0], [0.0, 1.3, -3.0], 38, 0.0, 0.0024) }],
  22: [{ f: 2420, cut: true, s: B(2420, [-0.8, 1.3, 3.4], [-1.4, 1.2, 0.3], 32, -0.05, 0.003, 0.006, 22) },
       { f: 2470, cut: true, s: B(2470, [0.4, 1.5, 5.2], [-0.2, 1.3, -1.2], 38, 0.02, 0.0026) }],
  23: [{ f: 2517, cut: true, s: B(2517, [0.0, 1.2, 4.8], [0.0, 1.1, -3.6], 36, 0.0, 0.0034, 0.008, 26) }],
  24: [{ f: 2664, s: B(2664, [0.2, 1.0, 3.4], [0.1, 0.9, -1.0], 34, 0.04, 0.0030, 0.006, 22) },
       { f: 2774, cut: true, s: B(2774, [-1.0, 1.4, 2.2], [-1.4, 1.35, 0.3], 30, -0.05, 0.0034, 0.008, 22) }],
  25: [{ f: 2865, cut: true, s: B(2865, [0.0, 2.0, 2.4], [0.0, 2.05, -4.4], 30, 0.0, 0.003, 0.006, 20) },
       { f: 2921, cut: true, s: B(2921, [0.3, 0.9, 1.9], [0.1, 0.8, -1.2], 30, 0.05, 0.0034, 0.007, 22) }],
  26: [{ f: 3040, s: B(3040, [0.5, 1.5, 3.6], [0.1, 1.3, -1.2], 36, -0.03, 0.003) },
       { f: 3102, cut: true, s: B(3102, [-0.3, 1.3, 2.8], [0.0, 1.2, -1.0], 33, 0.05, 0.0034, 0.007, 22) }],
  27: [{ f: 3157, cut: true, s: B(3157, [0.1, 1.45, 2.8], [0.0, 1.4, -0.9], 32, -0.05, 0.0034, 0.008, 24) }],
  28: [{ f: 3269, cut: true, s: B(3269, [-1.0, 1.4, 2.0], [-1.4, 1.35, 0.3], 29, 0.04, 0.0036, 0.008, 22) }],
  29: [{ f: 3324, s: B(3324, [0.0, 1.5, 4.4], [0.0, 1.3, -1.2], 37, 0.02, 0.0026) },
       { f: 3400, dur: 16, s: B(3400, [0.1, 1.45, 2.8], [0.1, 1.4, -0.9], 33, -0.04, 0.003, 0.006) }],
  30: [{ f: 3466, s: B(3466, [0.1, 1.1, 3.0], [0.1, 1.0, -1.2], 34, 0.03, 0.003, 0.006) }],
  31: [{ f: 3601, s: B(3601, [-0.4, 1.56, 4.25], [0.2, 1.38, -0.85], 36, 0.02, 0.0028) },
       { f: 3705, cut: true, s: B(3705, [1.6, 1.45, 2.8], [2.0, 1.4, -0.7], 32, -0.05, 0.0034, 0.007, 22) }],
  32: [{ f: 3751, s: B(3751, [1.7, 1.45, 3.0], [2.0, 1.4, -0.7], 33, 0.04, 0.0030, 0.006) },
       { f: 3820, dur: 18, s: B(3820, [0.4, 1.6, 5.4], [0.5, 1.35, -1.0], 38, -0.02, 0.0024) }],
  33: [{ f: 3899, s: B(3899, [0.0, 2.0, 6.2], [0.0, 1.2, -1.5], 39, 0.0, 0.0024) },
       { f: 3965, dur: 18, s: B(3965, [0.1, 1.45, 3.0], [0.1, 1.35, -1.1], 34, -0.04, 0.003, 0.006) }],
  34: [{ f: 4037, s: B(4037, [-0.9, 1.4, 3.0], [-1.4, 1.35, 0.3], 32, 0.04, 0.003, 0.006) }],
  35: [{ f: 4148, s: B(4148, [0.0, 1.7, 5.8], [0.0, 1.3, -1.2], 39, 0.0, 0.0022) }],
  36: [{ f: 4282, s: B(4282, [0.0, 1.55, 4.8], [0.0, 1.3, -1.2], 37, 0.0, 0.0024, 0.005, 20) }],
};

// Impact kicks (detik): lembut & emosional, tegas hanya di beat besar
const KICKS: [number, number][] = [
  [4.53, 0.9], [13.59, 1.0], [26.05, 0.7], [27.15, 0.7], [28.15, 0.9], [38.21, 1.2], [56.51, 0.9],
  [63.49, 0.8], [83.09, 1.4], [87.47, 1.0], [92.47, 0.9], [95.49, 1.0], [105.23, 1.0], [108.95, 0.8],
  [129.97, 0.7], [134.57, 0.7], [138.25, 0.8], [142.73, 0.8],
];

export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

export const camAt = (id: number, f: number): CamPose => {
  const c = run(CAMS[id] ?? CAMS[1], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m],
    roll: c.roll + a * 0.004,
  };
};

export const dofAt = (f: number): { cInf: number; focus?: (frame: number) => V3 } => {
  const s = shotAt(f);
  // wide / establishing = tajam; close-up & macro = DOF dangkal
  const wide = [1, 10, 14, 16, 19, 20, 21, 29, 31, 33, 35].includes(s.id) && !(s.id === 1 && f >= 66) && !(s.id === 16 && f >= 1815) && !(s.id === 19 && f >= 2179) && !(s.id === 29 && f >= 3400) && !(s.id === 31 && f >= 3705) && !(s.id === 33 && f >= 3965);
  if (!wide) return { cInf: 10.8 };
  return { cInf: 4.5, focus: () => [0.0, 1.35, -0.9] };
};
