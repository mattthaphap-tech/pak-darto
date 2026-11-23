// 2D Character Cast & Cartoon Effect Cards for "Pak Darto".
// Uses 3x supersampled (1800x3000) lit cardShade sprites, contact/cast shadow blobs, and NOINK layer 3.
// Follows skill/references/reports/motion.md & Gold Benchmark kosan/cast.ts:
// - Bouncy walk cycles ("march" / "stroll" with 4.8% height bob & weight-shift sway)
// - Hop / jump arcs with crouch anticipation on celebration & shock beats
// - 4-frame half/shut/shut/half blinks timed 2 frames (LEAD = 2/FPS) before expression swaps
// - Popping 2D FX cards (fxBurst, fxStars, fxCreak, fxMoneyFly, fxCryptoSwarm, fxBadge)
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxShadow, fxContact, fxBurst, fxStars, fxCreak,
  Outfit, FrontOpts, SideOpts, INK,
  PAK_DARTO_OUTFIT, BU_RATNA_OUTFIT, PEMUDA_RAFI_OUTFIT, TUKANG_SAYUR_OUTFIT, WARGA_HARTO_OUTFIT, WARGA_JOKO_OUTFIT, kidOutfit,
} from "./toon";
import { FPS, SHOTS, clamp01, smooth, lerp, WorldState } from "./story";
import { LightName } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}

export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0;
    }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;

const tier = (d: number): [number, number, number] =>
  d < 8.5 ? [1800, 3000, 3.0] : d < 14 ? [1080, 1800, 1.8] : [480, 800, 0.8];

const SUN = new THREE.Vector3(0.5, 0.75, 0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: LightName = "golden";

const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- blinks, expression swaps & micro-motion helpers ----------------
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 48 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const liveTilt = (t: number, seed: number, amp = 2.6) => q(amp * Math.sin(t * 3.2 + seed), 30);
const liveHead = (t: number, seed: number, amp = 4.0) => q(amp * Math.sin(t * 2.4 + seed * 1.7) + (amp * 0.4) * Math.cos(t * 4.1 + seed), 30);

/** Parabolic hop/jump arc with a 3-frame crouch anticipation */
const hopY = (t: number, t0: number, dur = 0.42, height = 0.16): number => {
  const dt = t - t0;
  if (dt < -0.08 || dt > dur) return 0;
  if (dt < 0) return -0.025 * Math.sin(((dt + 0.08) / 0.08) * Math.PI);
  const u = dt / dur;
  return height * 4 * u * (1 - u);
};

type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean, fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const m = side && mirror, light = light2D(cam, m), seed = ((who.i * 5 + 3) % 7) + 1;
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror: m,
    draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

const CONTACT: Record<LightName, [number, number, number]> = {
  space: [0.18, 0.16, 0.32],
  night: [0.18, 0.16, 0.30],
  golden: [0.24, 0.20, 0.33],
  day: [0.20, 0.21, 0.33],
};
const TAIL: [number, number, number] = [0.38, 0.36, 0.56];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");

const blob = (out: Stage, x: number, _y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.15, SUN.y)));
  const len = Math.min(2.2, Math.max(0.5, 1.4 / Math.tan(el))) * sc, h = len + 0.5 * sc, c = 0.3 * h;
  const tc = hexOf(TAIL, k);
  out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: 0.022, z: z + oz * 0.03 * sc, w: 0.54 * sc, h: 0.42 * sc, flat: true, rot });
};

// ---------------- 2D Cartoon FX Cards ----------------

/** Flying Rupiah Money Notes & Gold Coins Card (520x520) */
const fxMoneyFly = (p: Pen, phase: number) => {
  const g = p.g;
  const bills = [
    [130, 260, -0.28, "#2ecc71"],
    [260, 150, 0.16, "#27ae60"],
    [380, 250, 0.34, "#2ecc71"],
  ] as const;
  for (let i = 0; i < bills.length; i++) {
    const [bx, by, rot, col] = bills[i];
    const y = by - ((phase * 95 + i * 40) % 110);
    const x = bx + Math.sin(phase * 4 + i * 2) * 16;
    g.save();
    g.translate(x, y);
    g.rotate(rot + Math.sin(phase * 3 + i) * 0.12);
    g.fillStyle = col;
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(-62, -32, 124, 64, 10);
    g.fill(); g.stroke();
    g.fillStyle = "#fff8e7";
    g.beginPath();
    g.arc(0, 0, 18, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.fillStyle = INK;
    g.font = "900 22px 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText("Rp", 0, 8);
    g.restore();
  }
  for (const [cx, cy, off] of [[185, 360, 0.5], [335, 350, 1.8], [260, 95, 3.1]] as const) {
    const y = cy + Math.sin(phase * 5 + off) * 14;
    g.fillStyle = "#ffd43b";
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.beginPath();
    g.arc(cx, y, 22, 0, Math.PI * 2);
    g.fill(); g.stroke();
  }
};

/** Floating Crypto Coins Card (BTC, ETH, SOL tokens orbiting on a 520x520 canvas) */
const fxCryptoSwarm = (p: Pen, phase: number) => {
  const g = p.g;
  const coins = [
    [140, 220, "#f39c12", "#ffd43b", "₿", 0.0],
    [265, 135, "#00a8ff", "#70e8ff", "◆", 2.1],
    [380, 230, "#8e44ad", "#2ecc71", "S", 4.2],
  ] as const;
  for (const [cx, cy, outer, inner, sym, off] of coins) {
    const x = cx + Math.sin(phase * 3.5 + off) * 14;
    const y = cy + Math.cos(phase * 4.5 + off) * 16;
    g.fillStyle = outer;
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(x, y, 42, 0, Math.PI * 2);
    g.fill(); g.stroke();

    g.fillStyle = inner;
    g.beginPath();
    g.arc(x, y, 30, 0, Math.PI * 2);
    g.fill(); g.stroke();

    g.fillStyle = INK;
    g.font = "900 32px 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(sym, x, y + 11);
  }
};

/** Comic Floating Price / Alert Badge (560x260) — auto-fits text with generous internal padding so it NEVER overflows the box! */
const fxBadge = (p: Pen, text: string, sub: string, bg: string, fg: string) => {
  const g = p.g;
  g.fillStyle = INK;
  g.beginPath();
  g.roundRect(24, 34, 512, 196, 28);
  g.fill();

  g.fillStyle = bg;
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.beginPath();
  g.roundRect(16, 22, 512, 196, 28);
  g.fill();
  g.stroke();

  g.fillStyle = fg;
  g.textAlign = "center";

  // Auto-fit main heading within max width 456 px
  let mainSz = 50;
  g.font = `900 ${mainSz}px 'Segoe UI', Arial, sans-serif`;
  while (g.measureText(text).width > 456 && mainSz > 26) {
    mainSz -= 2;
    g.font = `900 ${mainSz}px 'Segoe UI', Arial, sans-serif`;
  }
  g.fillText(text, 272, 112);

  // Auto-fit subtitle within max width 456 px
  let subSz = 31;
  g.font = `800 ${subSz}px 'Segoe UI', Arial, sans-serif`;
  while (g.measureText(sub).width > 456 && subSz > 18) {
    subSz -= 2;
    g.font = `800 ${subSz}px 'Segoe UI', Arial, sans-serif`;
  }
  g.fillText(sub, 272, 174);
};

// ---------------- Character Roster ----------------
const WHO_DARTO: Who  = { i: 1, o: PAK_DARTO_OUTFIT,     okey: "darto" };
const WHO_RATNA: Who  = { i: 2, o: BU_RATNA_OUTFIT,      okey: "ratna" };
const WHO_HARTO: Who  = { i: 3, o: WARGA_HARTO_OUTFIT,   okey: "harto" };
const WHO_JOKO: Who   = { i: 4, o: WARGA_JOKO_OUTFIT,    okey: "joko" };
const WHO_RAFI: Who   = { i: 5, o: PEMUDA_RAFI_OUTFIT,   okey: "rafi" };
const WHO_TUKANG: Who = { i: 6, o: TUKANG_SAYUR_OUTFIT,  okey: "tukang" };
const KIDS: Who[] = [0, 1, 2, 3, 4, 5, 6].map((k) => ({ i: 10 + k, o: kidOutfit(k), okey: "kid" + k }));

type ActOpts = {
  expr?: FrontOpts["expr"]; prop?: FrontOpts["prop"]; mode?: FrontOpts["mode"]; wave?: number;
  look?: number; facing?: -1 | 0 | 1; scale?: number; y?: number; swaps?: number[]; nod?: number; rate?: number;
};

// ---------------- Stage: characters & 2D FX for all 36 shots ----------------
export const stage = (ws: WorldState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const { id, f, t } = ws;
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);

  const act = (who: Who, x: number, z: number, a: ActOpts = {}) => {
    const kid = who.i >= 10;
    const sc = a.scale ?? (kid ? 0.46 : who === WHO_DARTO ? 0.84 : 0.82);
    const mode = a.mode ?? "stand";
    const fo: FrontOpts = {
      mode,
      phase: q(t * (a.rate ?? (mode === "stand" ? 1.1 : 2.0)) + who.i * 0.13, 20),
      expr: a.expr ?? "neutral",
      blink: lidAt(t, who.i, a.swaps),
      tilt: liveTilt(t, who.i, 2.6),
      headTilt: liveHead(t, who.i, 3.6) + (a.nod ? q(a.nod * Math.sin(t * 7 + who.i), 10) : 0),
      prop: a.prop ?? null,
      look: a.look ?? 0,
      facing: a.facing ?? 0,
    };
    if (a.wave !== undefined) fo.wave = a.wave;
    out.places.push(person(cam, who, x, a.y ?? 0, z, false, false, fo, {}, sc));
    blob(out, x, a.y ?? 0, z, sc * 0.95);
  };
  const badge = (key: string, title: string, sub: string, bg: string, fg: string, x: number, y: number, z: number, w = 0.8) => {
    out.fx.push({ key: `fx|badge|${key}`, cw: 560, ch: 260, draw: (p) => fxBadge(p, title, sub, bg, fg), x, y: y + Math.sin(t * 3.8) * 0.03, z, w, h: w * 0.464 });
  };
  const burst = (key: string, f0: number, x: number, y: number, z: number, col = "#ffd43b", w = 0.8, dur = 24) => {
    if (f < f0 || f > f0 + dur) return;
    const bt = q(clamp01((f - f0) / dur), 20);
    out.fx.push({ key: `fx|burst|${key}|${bt}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, bt, col, 12, 36, 235), x, y, z, w, h: w });
  };
  const stars = (key: string, x: number, y: number, z: number, w = 0.52) => {
    const st = q(t * 0.9, 20);
    out.fx.push({ key: `fx|stars|${key}|${st}`, cw: 420, ch: 210, draw: (p) => fxStars(p, st), x, y, z, w, h: w / 2 });
  };
  const between = (a: number, b: number) => f >= a && f < b;
  const clap = (ph: number) => q(Math.sin(t * 9 + ph), 10);
  const walk = (f0: number, f1: number, a: number, b: number) => lerp(a, b, smooth((f - f0) / (f1 - f0)));
  const moving = (f0: number, f1: number) => f > f0 && f < f1;
  const gossipers = (e: FrontOpts["expr"] = "grin", extra: ActOpts = {}) => {
    act(WHO_HARTO, -1.5, -0.9, { expr: e, facing: 1, look: 1, ...extra });
    act(WHO_RATNA, -0.85, -0.62, { expr: e, facing: 1, look: 1, wave: clap(0.5), ...extra });
    act(WHO_JOKO, 0.9, -0.65, { expr: e, facing: -1, look: -1, ...extra });
  };
  // posisi akhir anak-anak memeluk kaki Pak Darto (gang)
  const KID_END: [number, number][] = [[-0.45, -1.45], [0.55, -1.5], [-0.75, -1.9], [0.85, -1.95], [-0.2, -1.15], [0.35, -1.15], [0.0, -2.0]];
  const kids = (f0: number, n = 7, run = true) => {
    for (let k = 0; k < n; k++) {
      const p = smooth((f - f0 - k * 7) / 55);
      const sx = (k - 3) * 0.28, sz = -3.4;
      const x = lerp(sx, KID_END[k][0], p), z = lerp(sz, KID_END[k][1], p);
      const running = run && p > 0 && p < 1;
      act(KIDS[k], x, z, { expr: "laugh", mode: running ? "march" : "stand", rate: 3.2, facing: 0, look: 0, wave: p >= 1 ? clap(k) : undefined });
    }
  };
  const darto = (x: number, z: number, a: ActOpts = {}) => act(WHO_DARTO, x, z, a);

  if (id === 1) {
    // Gosip kampung -> Pak Darto lewat
    const w = clamp01((f - 60) / 70);
    gossipers("grin");
    if (f >= 60) darto(lerp(3.2, 0.1, smooth(w)), -0.5, { expr: "neutral", mode: w > 0 && w < 1 ? "stroll" : "stand", facing: -1 });
    if (f < 100) badge("s1", "GOSIP KAMPUNG", "SATU NAMA JADI BAHAN", "#8e24aa", "#ffffff", -0.5, 2.3, -0.9, 0.82);
  } else if (id === 2) {
    gossipers("stern");
    darto(0.1, -0.5, { expr: "neutral" });
    badge("s2", "PAK DARTO", "BAPAK TUA PENDIAM", "#ffd43b", INK, 0.1, 2.3, -0.9, 0.84);
    burst("s2", 136, 0.1, 2.0, -0.5, "#ffd43b", 0.8, 22);
  } else if (id === 3) {
    gossipers("stern");
    darto(0.1, -0.5, { expr: "neutral" });
    if (f >= 215) badge("s3", "BAJU LUSUH", "SANDAL SUDAH TIPIS", "#6d4c41", "#ffffff", 0.1, 2.3, -0.9, 0.8);
  } else if (id === 4) {
    gossipers(f < 404 ? "grin" : "laugh");
    darto(0.1, -0.5, { expr: "pained" });
    if (f >= 316 && f < 404) badge("s4a", "MENURUT WARGA...", "BELIAU ITU PELIT", "#546e7a", "#ffffff", -0.4, 2.3, -0.9, 0.8);
    if (f >= 404) badge("s4b", "PELIT BANGET!", "(KATA WARGA)", "#d9382e", "#ffffff", -0.5, 2.25, -0.9, 0.84);
    burst("s4", 408, -0.5, 2.0, -0.6, "#ff5252", 0.9, 22);
  } else if (id === 5) {
    gossipers("stern");
    darto(0.1, -0.5, { expr: "stern", nod: f >= 500 ? 9 : 0 });
    if (f < 500) badge("s5a", "ARISAN RT", "MINTA SUMBANGAN", "#43a047", "#ffffff", -0.3, 2.3, -0.9, 0.8);
    else badge("s5b", "GELENG KEPALA", "(PAK DARTO)", "#37474f", "#ffd43b", 0.1, 2.3, -0.9, 0.8);
  } else if (id === 6) {
    act(WHO_TUKANG, 2.1, -1.6, { expr: f < 660 ? "pained" : "dazed", facing: -1, look: -1 });
    darto(1.2, -0.4, { expr: "grin", facing: 1, look: 1, nod: 4 });
    act(WHO_RATNA, -0.4, -0.8, { expr: "stern", facing: 1, look: 1 });
    if (f < 640) badge("s6a", "MENAWAR!", "SAMPAI MENYERAH", "#ffd43b", INK, 1.6, 2.2, -0.9, 0.78);
    else { badge("s6b", "TUKANG SAYUR", "MENYERAH...", "#546e7a", "#ffffff", 1.8, 2.2, -0.9, 0.78); if (f >= 662) stars("s6", 2.1, 1.95, -1.55); }
  } else if (id === 7) {
    const w = clamp01((f - 735) / 45);
    darto(f < 735 ? -3.3 : walk(735, 780, -0.6, 2.6), f < 735 ? -1.2 : -0.9, { expr: "neutral", mode: moving(735, 780) ? "stroll" : "stand", facing: f < 735 ? 1 : -1 });
    if (f < 735) badge("s7a", "PUNYA MOTOR", "TAPI...", "#7a1f1f", "#ffffff", -3.6, 1.8, -1.9, 0.7);
    else badge("s7b", "LEBIH MILIH ANGKOT", "(HEMAT ONGKOS)", "#1e5fa8", "#ffd600", 2.2, 2.2, -0.9, 0.8);
    void w;
  } else if (id === 8) {
    gossipers("stern", { nod: -0 });
    darto(0.1, -0.5, { expr: f < 844 ? "stern" : "pained" });
    if (f < 814) badge("s8a", "ACARA KAMPUNG?", "", "#ffd43b", INK, 0.1, 2.3, -0.9, 0.8);
    else if (f < 844) badge("s8b", "PATUNGAN?", "", "#ffd43b", INK, 0.1, 2.3, -0.9, 0.8);
    else badge("s8c", "JANGAN HARAP.", "", "#d9382e", "#ffffff", 0.1, 2.3, -0.9, 0.84);
    burst("s8", 844, 0.1, 2.0, -0.5, "#ff5252", 0.8, 20);
  } else if (id === 9) {
    act(WHO_HARTO, -1.5, -0.9, { expr: "stern", facing: 1, look: 1 });
    act(WHO_RATNA, -0.85, -0.62, { expr: "laugh", facing: 1, look: 1, wave: clap(0.5), swaps: [30.0] });
    act(WHO_JOKO, 0.9, -0.65, { expr: "stern", facing: -1, look: -1 });
    darto(0.1, -0.5, { expr: "neutral" });
    if (f < 960) badge("s9", "BU RATNA", "TETANGGA PALING VOKAL", "#d81b60", "#ffffff", -0.85, 2.3, -0.9, 0.82);
  } else if (id === 10) {
    gossipers("stern", { nod: 6 });
    darto(0.1, -0.5, { expr: "pained" });
    if (f >= 1090) badge("s10", "HAMPIR SEMUA", "WARGA SETUJU", "#546e7a", "#ffffff", 0.0, 2.3, -0.9, 0.8);
  } else if (id === 11) {
    gossipers("stern", { nod: 6 });
    act(WHO_RAFI, 2.0, -0.75, { expr: "stern", facing: -1, look: -1 });
    badge("s11", "HAMPIR.", "", "#ffd43b", INK, 2.0, 2.3, -0.9, 0.84);
  } else if (id === 12) {
    gossipers("grin");
    act(WHO_RAFI, 2.0, -0.75, { expr: f < 1278 ? "neutral" : "nervous", facing: -1, look: -1 });
    darto(-2.2, -2.2, { expr: "neutral", scale: 0.7 });
    if (f >= 1182 && f < 1278) badge("s12", "SEORANG PEMUDA", "TETANGGA SEBELAH", "#1e88e5", "#ffffff", 0.2, 2.35, -0.9, 0.82);
    if (f >= 1290) badge("s12b", "MEMPERHATIKAN", "SATU HAL...", "#ffd43b", INK, 2.0, 2.3, -0.9, 0.8);
  } else if (id === 13) {
    const w = clamp01((f - 1350) / 140);
    gossipers("grin");
    darto(lerp(-2.3, -0.7, smooth(w)), lerp(-1.6, -0.6, smooth(w)), { expr: "neutral", prop: "kantong", mode: w > 0 && w < 1 ? "stroll" : "stand", facing: 0 });
    act(WHO_RAFI, 2.6, -1.3, { expr: "nervous", facing: -1, look: -1 });
    if (f < 1440) badge("s13", "SETIAP JUMAT", "KANTONG PLASTIK BESAR", "#43a047", "#ffffff", -1.0, 2.3, -0.9, 0.82);
    if (f >= 1484) badge("s13b", "KELIHATANNYA", "BERAT...", "#546e7a", "#ffffff", -0.7, 1.95, -0.7, 0.72);
  } else if (id === 14) {
    gossipers("laugh");
    darto(walk(1520, 1640, -0.7, 3.4), -0.5 - 0.4 * clamp01((f - 1520) / 120), { expr: "neutral", prop: "kantong", mode: "stroll", facing: -1 });
    if (f >= 1560) badge("s14", "DIAM-DIAM", "TANPA PAMIT PADA SIAPA PUN", "#37474f", "#ffd43b", -0.5, 2.3, -0.9, 0.84);
  } else if (id === 15) {
    act(WHO_RAFI, 2.0, -0.75, { expr: f < 1695 ? "nervous" : "shock", facing: -1, look: -1 });
    act(WHO_JOKO, 0.9, -0.8, { expr: "grin", facing: -1 });
    if (f < 1695) badge("s15", "PEMUDA ITU", "PENASARAN...", "#1e88e5", "#ffffff", 2.0, 2.3, -0.9, 0.8);
    else { badge("s15b", "TERLALU", "PENASARAN!", "#d9382e", "#ffffff", 2.0, 2.3, -0.9, 0.82); burst("s15", 1695, 2.0, 2.0, -0.7, "#ff5252", 0.8, 22); }
  } else if (id === 16) {
    act(WHO_HARTO, -1.5, -0.9, { expr: "stern", facing: 1, look: 1 });
    act(WHO_RATNA, -0.5, -0.65, { expr: "stern", facing: 1, look: 1, wave: clap(0.5) });
    act(WHO_JOKO, 0.7, -0.65, { expr: "stern", facing: -1, look: -1 });
    act(WHO_RAFI, 1.7, -0.9, { expr: "neutral", facing: -1, look: -1 });
    if (f < 1850) badge("s16", "POS RONDA", "RAPAT DADAKAN", "#3e2723", "#ffd43b", -0.4, 2.3, -0.9, 0.8);
    else badge("s16b", "KITA TEGUR", "PAK DARTO", "#d81b60", "#ffffff", -0.5, 2.3, -0.9, 0.8);
  } else if (id === 17) {
    act(WHO_HARTO, -1.5, -0.9, { expr: "stern", facing: 1, look: 1, nod: f >= 1950 ? 7 : 0 });
    act(WHO_RATNA, -0.5, -0.65, { expr: "grin", facing: 1, look: 1, wave: clap(0.5) });
    act(WHO_JOKO, 0.7, -0.65, { expr: "stern", facing: -1, look: -1, nod: f >= 1950 ? 7 : 0 });
    act(WHO_RAFI, 1.7, -0.9, { expr: "neutral", facing: -1, look: -1 });
    if (f < 1950) badge("s17", "BIAR TAHU RASA", "", "#d9382e", "#ffffff", -0.5, 2.3, -0.9, 0.84);
    else badge("s17b", "SEMUA MENGANGGUK", "", "#546e7a", "#ffffff", 0.0, 2.3, -0.9, 0.82);
  } else if (id === 18) {
    act(WHO_HARTO, -1.5, -0.9, { expr: "grin", facing: 1 });
    act(WHO_RATNA, -0.8, -0.65, { expr: "grin", facing: 1 });
    act(WHO_JOKO, 0.2, -0.7, { expr: "grin", facing: -1 });
    act(WHO_RAFI, 1.3, -0.7, { expr: "dazed", facing: 0 });
    if (f >= 2000) badge("s18", "KANTONG PLASTIK", "ITU ISINYA APA?", "#1e88e5", "#ffffff", 1.3, 2.25, -0.9, 0.82);
  } else if (id === 19) {
    darto(walk(2091, 2250, 0.9, 2.3), -0.9, { expr: "neutral", prop: "kantong", mode: "stroll", facing: -1 });
    act(WHO_RAFI, walk(2091, 2250, -0.9, 0.5), -0.7, { expr: "nervous", mode: "stroll", rate: 1.2, facing: -1, look: -1 });
    if (between(2091, 2179)) badge("s19", "JUMAT BERIKUTNYA", "IA MENGIKUTI...", "#1e88e5", "#ffffff", 0.0, 2.3, -0.9, 0.84);
    else if (f < 2212) badge("s19b", "DARI JAUH.", "", "#37474f", "#ffd43b", 0.0, 2.3, -0.9, 0.8);
    else badge("s19c", "PELAN-PELAN.", "", "#37474f", "#ffd43b", 0.0, 2.3, -0.9, 0.8);
  } else if (id === 20) {
    darto(walk(2250, 2330, 1.8, 3.2), walk(2250, 2330, -0.8, -1.2), { expr: "neutral", prop: "kantong", mode: "stroll", facing: -1 });
    act(WHO_RAFI, 0.5, -0.6, { expr: "nervous", facing: -1, look: -1 });
    badge("s20", "NAIK ANGKOT", "", "#1e5fa8", "#ffd600", 2.6, 2.3, -0.9, 0.78);
  } else if (id === 21) {
    darto(0.1, walk(2336, 2400, 0.2, -1.6), { expr: "neutral", prop: "kantong", mode: f < 2400 ? "stroll" : "stand", facing: 0 });
    badge("s21", "GANG SEMPIT", "RUMAH SEDERHANA", "#6d4c41", "#ffffff", 0.0, 2.4, -1.6, 0.8);
  } else if (id === 22) {
    darto(0.1, -1.6, { expr: "neutral", prop: "kantong" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "nervous", facing: 1, look: 1 });
    badge("s22", "BERSEMBUNYI", "DI BALIK PAGAR", "#1e88e5", "#ffffff", -1.2, 2.2, 0.3, 0.78);
  } else if (id === 23) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile", prop: "kantong" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "shock", facing: 1, look: 1 });
    burst("s23", 2517, 0.0, 1.3, -3.8, "#ffd43b", 1.4, 30);
    if (f >= 2540) badge("s23", "PINTU TERBUKA!", "ANAK-ANAK BERLARIAN", "#ffd43b", INK, 0.1, 2.35, -1.6, 0.84);
  } else if (id === 24) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile", prop: "kantong" });
    act(WHO_RAFI, -1.4, 0.35, { expr: f < 2774 ? "shock" : "dazed", facing: 1, look: 1 });
    if (f < 2774) badge("s24a", "BELASAN ANAK", "MEMELUK PAK DARTO", "#43a047", "#ffffff", 0.1, 2.35, -1.6, 0.84);
    else { badge("s24b", "\"AYAH DATANG!\"", "PEMUDA ITU TERPAKU", "#ffd43b", INK, 0.1, 2.35, -1.6, 0.86); burst("s24", 2774, 0.1, 1.9, -1.6, "#ffd43b", 1.0, 26); }
  } else if (id === 25) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile", prop: "kantong" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "dazed", facing: 1, look: 1 });
    if (f < 2921) badge("s25a", "PANTI ASUHAN", "KECIL", "#2e7d32", "#ffd43b", 0.0, 2.55, -3.9, 0.9);
    else badge("s25b", "BERAS • TELUR", "BUKU TULIS", "#6d4c41", "#ffffff", 0.1, 2.25, -1.2, 0.82);
  } else if (id === 26) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile", prop: "kantong" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "dazed", facing: 1, look: 1 });
    if (f < 3102) badge("s26a", "HASIL MENAWAR", "SAYUR", "#43a047", "#ffffff", 0.1, 2.3, -1.6, 0.8);
    else badge("s26b", "ONGKOS ANGKOT", "YANG DIHEMAT", "#1e5fa8", "#ffd600", 0.1, 2.3, -1.6, 0.8);
  } else if (id === 27) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile", prop: "kantong" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "dazed", facing: 1, look: 1 });
    if (f >= 3200) { badge("s27", "BUKAN PELIT.", "", "#ffd43b", INK, 0.1, 2.3, -1.6, 0.84); burst("s27", 3200, 0.1, 2.0, -1.6, "#ffd43b", 0.9, 24); }
    else badge("s27a", "SEMUA YANG DISEBUT...", "PELIT", "#546e7a", "#ffffff", 0.1, 2.3, -1.6, 0.82);
  } else if (id === 28) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "pained", facing: 1, look: 1, swaps: [109.5] });
    badge("s28", "MATANYA", "MEMANAS", "#1e88e5", "#ffffff", -1.2, 2.2, 0.3, 0.76);
  } else if (id === 29) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "relief", facing: 1, look: 1 });
    if (f < 3382) badge("s29a", "TIDAK PERNAH", "MINTA DIPUJI", "#ffd43b", INK, 0.1, 2.3, -1.6, 0.82);
    else badge("s29b", "TIDAK PERNAH", "MEMBELA DIRI", "#ffd43b", INK, 0.1, 2.3, -1.6, 0.82);
  } else if (id === 30) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile_closed" });
    act(WHO_RAFI, -1.4, 0.35, { expr: "relief", facing: 1, look: 1 });
    if (f >= 3480) badge("s30", "MENYUAPI ANAK-ANAK", "SATU PER SATU", "#43a047", "#ffffff", 0.1, 2.3, -1.6, 0.84);
    stars("s30", 0.1, 2.0, -1.6, 0.8);
  } else if (id === 30 + 1) {
    gossipers("laugh");
    act(WHO_RAFI, 2.0, -0.75, { expr: f < 3705 ? "neutral" : "nervous", facing: -1, look: -1 });
    if (f < 3660) badge("s31", "ESOK HARINYA", "DI DEPAN WARUNG", "#ff7043", "#ffffff", -0.4, 2.3, -0.9, 0.8);
    else badge("s31b", "PEMUDA ITU", "INGIN BICARA...", "#1e88e5", "#ffffff", 2.0, 2.3, -0.9, 0.8);
  } else if (id === 32) {
    gossipers("laugh");
    act(WHO_RAFI, 2.0, -0.75, { expr: "relief", facing: -1, look: -1 });
    if (f >= 3790) badge("s32", "TIDAK SEMUA KEBAIKAN", "PERLU DIBELA KATA-KATA", "#ffd43b", INK, 1.0, 2.35, -0.9, 0.9);
  } else if (id === 33) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile_closed" });
    act(WHO_RAFI, -1.2, -0.6, { expr: "smile", facing: 1, look: 1 });
    if (f < 3990) badge("s33a", "KADANG, YANG KITA", "SEBUT PELIT...", "#546e7a", "#ffffff", 0.1, 2.35, -1.6, 0.86);
    else { badge("s33b", "SEDANG MENANGGUNG", "HIDUP ORANG LAIN", "#ffd43b", INK, 0.1, 2.35, -1.6, 0.88); stars("s33", 0.1, 2.0, -1.6, 0.8); }
  } else if (id === 34) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile_closed" });
    act(WHO_RAFI, -1.2, -0.6, { expr: "relief", facing: 1, look: 1 });
    act(WHO_RATNA, -0.2, 0.0, { expr: f < 4090 ? "dazed" : "nervous", facing: 1, look: 1 });
    if (f < 4090) badge("s34a", "TERLALU SIBUK", "MENILAI", "#d9382e", "#ffffff", -0.2, 2.2, 0.0, 0.78);
    else badge("s34b", "LUPA", "BERTANYA", "#546e7a", "#ffffff", -0.2, 2.2, 0.0, 0.78);
  } else if (id === 35) {
    kids(2540);
    darto(0.1, -1.6, { expr: "smile", wave: clap(0.3) });
    act(WHO_RAFI, -1.2, -0.6, { expr: "smile", facing: 1, wave: clap(1.0) });
    act(WHO_RATNA, -0.2, 0.0, { expr: "smile_closed", facing: 1 });
    badge("s35", "TULIS DI KOMENTAR", "PERNAH SALAH MENILAI ORANG?", "#ffd43b", INK, 0.0, 2.55, -1.2, 0.95);
  } else {
    kids(2540);
    darto(0.1, -1.6, { expr: "laugh", wave: clap(0.3) });
    act(WHO_RAFI, -1.2, -0.6, { expr: "laugh", facing: 1, wave: clap(1.0) });
    act(WHO_RATNA, -0.2, 0.0, { expr: "smile", facing: 1, wave: clap(2.0) });
    badge("s36", "BAGIKAN", "SUPAYA ORANG BERHENTI MENGHAKIMI", "#43a047", "#ffffff", 0.0, 2.55, -1.2, 0.95);
    burst("s36", 4290, 0.0, 2.0, -1.2, "#ffd43b", 1.1, 30);
    stars("s36", 0.1, 2.1, -1.6, 0.9);
  }
  return out;
};
