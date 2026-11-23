#!/usr/bin/env python3
"""
Mix audio "Pak Darto" (4396 frame @ 30 fps = 146.533 s): voiceover + SFX/ambience prosedural.
Cue: whoosh tiap cut, kick lembut di kata penekanan, jangkrik pos ronda (f1753-2091), angkot lewat
(f695-782, f2250-2336), flash + bel saat pintu panti terbuka (f2517), pad hangat (f2517-akhir),
bel "Matanya memanas" (f3269), clink CTA (f4148, f4282). Master -15 LUFS, TP <= -1.5 dBTP.
Output: public/darto_mix.wav
"""
import os
import sys
import subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_TPL = os.path.join(ROOT, "skill", "templates", "audio")
sys.path.insert(0, AUDIO_TPL)

from dsp import (
    SR, TAU, ns, tt, rng, dbg, lp, hp, bp, peq, shelf, reson,
    colored, smooth_noise, ramp, fades, phase, modal, pan, st, place, widen,
    make_ir, convolve_st, integrated, momentary_max, true_peak, read_wav, write_wav,
)
import sfx_gen as G
import instruments as I

FPS = 30.0
TOTAL_FRAMES = 4396
DUR = TOTAL_FRAMES / FPS  # 146.533 s
N = ns(DUR)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
SFX_DB = -5.5

def fr(f):
    return float(f) / FPS

# ---------------------------------------------------------------- 1. Load Voiceover
def load_voice():
    mp3_path = os.path.join(ROOT, "public", "darto_vo.mp3")
    tmp_wav = os.path.join(ROOT, "public", "_darto_voice_48k.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", mp3_path, "-ar", str(SR), "-ac", "2", tmp_wav],
        check=True,
    )
    x, sr = read_wav(tmp_wav)
    try:
        os.remove(tmp_wav)
    except OSError:
        pass
    out = np.zeros((2, N))
    m = min(N, x.shape[1])
    out[:, :m] = x[:, :m]
    return out

# ---------------------------------------------------------------- 2. Procedural SFX Generators
RNG = np.random.default_rng(42)

def sfx_whoosh(dur=0.38, center_freq=650, pan_pos=0.0):
    n = ns(dur)
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    noise = colored(n, RNG, -2.5)
    lo = max(60, center_freq * 0.5)
    hi = min(SR * 0.45, center_freq * 1.8)
    w = bp(noise, lo, hi) * env
    return pan(w, pan_pos)

def sfx_kick(dur=0.32, f0=120, f1=38):
    n = ns(dur)
    t = tt(dur)
    env = np.exp(-t * 14.0)
    f_inst = f1 + (f0 - f1) * np.exp(-t * 28.0)
    phi = 2 * np.pi * np.cumsum(f_inst) / SR
    sine = np.sin(phi) * env
    click = np.exp(-t * 180.0) * colored(n, RNG, 2.0)
    hit = sine * 0.85 + click * 0.25
    return st(hit)

def sfx_flash(dur=0.95):
    t = tt(dur)
    out = np.zeros(len(t))
    rise_dur = 0.45
    n_rise = int(rise_dur * SR)
    t_rise = t[:n_rise]
    rise_env = (t_rise / rise_dur) ** 3
    noise_rise = colored(n_rise, RNG, -2.0)
    rise_noise = bp(noise_rise, 350, 2200) * rise_env
    out[:n_rise] += rise_noise * 0.7
    
    n_tail = len(t) - n_rise
    t_tail = np.linspace(0, n_tail / SR, n_tail, endpoint=False)
    tail_env = np.exp(-t_tail * 4.5)
    sub = np.sin(2 * np.pi * (55 * np.exp(-t_tail * 8.0)) * t_tail) * tail_env * 0.9
    sparkle = lp(colored(n_tail, RNG, 1.0), 4500) * tail_env * 0.2
    out[n_rise:] += sub + sparkle
    return st(out)

def sfx_gavel(dur=0.45):
    n = ns(dur)
    t = tt(dur)
    crack = np.exp(-t * 120.0) * colored(n, RNG, 4.0)
    res = (np.sin(2 * np.pi * 380 * t) * 0.5 + np.sin(2 * np.pi * 820 * t) * 0.3) * np.exp(-t * 22.0)
    thud = np.sin(2 * np.pi * 95 * t) * np.exp(-t * 18.0) * 0.7
    return pan(crack * 0.4 + res * 0.4 + thud * 0.6, 0.25)

def sfx_bell(dur=1.2, f_bell=1180):
    n = ns(dur)
    t = tt(dur)
    strike = np.exp(-t * 140.0) * colored(n, RNG, 5.0) * 0.3
    m1 = np.sin(2 * np.pi * f_bell * t) * np.exp(-t * 3.2)
    m2 = np.sin(2 * np.pi * (f_bell * 1.58) * t) * np.exp(-t * 4.5) * 0.45
    m3 = np.sin(2 * np.pi * (f_bell * 2.32) * t) * np.exp(-t * 6.0) * 0.25
    return pan(strike + (m1 + m2 + m3) * 0.65, -0.3)

def sfx_clink(dur=0.6, f0=2200):
    n = ns(dur)
    t = tt(dur)
    body = (np.sin(2 * np.pi * f0 * t) * 0.6 + np.sin(2 * np.pi * (f0 * 1.76) * t) * 0.4) * np.exp(-t * 12.0)
    click = np.exp(-t * 200.0) * colored(n, RNG, 6.0) * 0.25
    return st(body + click)

def sfx_cyber_beep(dur=0.35, f=1480):
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    tone = np.sin(2 * np.pi * f * t) * env
    chirp = np.sin(2 * np.pi * (f * 1.4) * t) * (env ** 2) * 0.3
    return pan(tone + chirp, 0.2)

def sfx_kaching(dur=0.85):
    n = ns(dur)
    t = tt(dur)
    mech = np.exp(-t * 80.0) * colored(n, RNG, 2.0) * 0.5
    bell1 = np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 6.5) * 0.5
    bell2 = np.sin(2 * np.pi * 2640 * t) * np.exp(-t * 8.5) * 0.4
    coins = lp(colored(n, RNG, 4.0), 5500) * np.exp(-t * 9.0) * 0.3
    return pan(mech + bell1 + bell2 + coins, -0.2)

# ---------------------------------------------------------------- 3. Procedural SFX tambahan
def sfx_poweroff(dur=1.1):
    t = tt(dur)
    f = 160 * np.exp(-t * 5.5) + 38
    phi = 2 * np.pi * np.cumsum(f) / SR
    hum = (np.sin(phi) + 0.5 * np.sin(2 * phi) + 0.25 * np.sin(3 * phi)) * np.exp(-t * 3.2)
    zap = lp(colored(len(t), RNG, 0.0), 3500) * np.exp(-t * 28.0) * 0.7
    thunk = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 9.0) * 0.8
    return st(hum * 0.5 + zap + thunk)

def sfx_rooster(dur=1.15):
    t = tt(dur)
    pts_t = [0, 0.10, 0.28, 0.46, 0.80, 1.15]
    pts_f = [480, 720, 650, 900, 780, 400]
    f = np.interp(t, pts_t, pts_f) * (1 + 0.014 * np.sin(2 * np.pi * 21 * t))
    phi = 2 * np.pi * np.cumsum(f) / SR
    w = sum(np.sin(k * phi) / (k ** 0.85) for k in range(1, 9))
    env = np.clip(t / 0.04, 0, 1) * np.clip((dur - t) / 0.3, 0, 1) * (0.75 + 0.25 * np.sin(2 * np.pi * 5.5 * t))
    w = bp(w, 350, 4800) * env
    return pan(w * 0.45, 0.3)

def sfx_cluck(dur=0.5):
    n = ns(dur)
    t = tt(dur)
    out = np.zeros(n)
    for t0, f0 in [(0.00, 520), (0.14, 470), (0.30, 430)]:
        i0 = ns(t0)
        L = ns(0.09)
        tl = np.arange(L) / SR
        burst = (np.sin(2 * np.pi * f0 * tl) * 0.6 + bp(colored(L, RNG, 0.0), 600, 2200) * 0.5) * np.exp(-tl * 38.0)
        out[i0:i0 + L] += burst
    return pan(out, 0.25)

def sfx_plug_pop(dur=0.25):
    n = ns(dur)
    t = tt(dur)
    pop = np.sin(2 * np.pi * 240 * t) * np.exp(-t * 40.0) * 0.8 + colored(n, RNG, 1.0) * np.exp(-t * 120.0) * 0.4
    return pan(pop, -0.2)

def sfx_error_beep(dur=0.5):
    t = tt(dur)
    gate = (np.sin(2 * np.pi * 9 * t) > -0.1).astype(float)
    return pan(np.sign(np.sin(2 * np.pi * 330 * t)) * 0.25 * gate * np.exp(-t * 3.0), 0.2)

# ---------------------------------------------------------------- 4. Assemble Procedural Track
KICKS = [(4.53, 0.9), (13.59, 1.0), (26.05, 0.7), (27.15, 0.7), (28.15, 0.9), (38.21, 1.2), (56.51, 0.9),
         (63.49, 0.8), (83.09, 1.4), (87.47, 1.0), (92.47, 0.9), (95.49, 1.0), (105.23, 1.0), (108.95, 0.8),
         (129.97, 0.7), (134.57, 0.7), (138.25, 0.8), (142.73, 0.8)]
SHOT_STARTS = [136, 185, 315, 446, 564, 695, 782, 891, 989, 1182, 1348, 1520, 1643, 1753, 1905, 1979, 2091, 2250,
               2336, 2420, 2664, 2865, 3040, 3157, 3324, 3466, 3601, 3751, 3899, 4037]
INNER_KEYS = [66, 245, 404, 500, 630, 735, 814, 844, 1060, 1278, 1484, 1590, 1695, 1815, 1952, 2179, 2470, 2774,
              2921, 3102, 3400, 3705, 3820, 3965]

def pad(dur):
    chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (261.63, 329.63, 392.0), (196.0, 246.94, 293.66)]
    n = ns(dur)
    out = np.zeros(n)
    seg = 8.0
    for i, tm in enumerate(np.arange(0, dur, seg)):
        i0 = ns(tm)
        i1 = min(n, ns(tm + seg + 1.5))
        L = i1 - i0
        if L <= 0:
            continue
        tl = np.arange(L) / SR
        env = np.minimum(1.0, tl / 1.5) * np.minimum(1.0, (L / SR - tl) / 2.0)
        w = sum(np.sin(2 * np.pi * f * tl) + 0.3 * np.sin(4 * np.pi * f * tl) for f in chords[i % 4]) / 3.0
        out[i0:i1] += w * env * 0.6
    g = np.minimum(1.0, np.arange(n) / (2.0 * SR)) * np.minimum(1.0, (n - np.arange(n)) / (3.0 * SR))
    return st(out * g)

def sfx_engine(dur):
    n = ns(dur)
    t = np.arange(n) / SR
    rumble = lp(colored(n, RNG, 0.0), 160) * (0.8 + 0.2 * np.sin(2 * np.pi * 23 * t))
    env = np.minimum(1.0, t / 0.8) * np.minimum(1.0, (dur - t) / 0.9)
    return pan(rumble * env * 0.9, 0.4)

def generate_sfx():
    sfx = np.zeros((2, N))

    def put(start_sec, w, gain_db=0.0):
        w = st(w) * (10 ** (gain_db / 20.0))
        i0 = ns(start_sec)
        i1 = min(N, i0 + w.shape[1])
        L = i1 - i0
        if L > 0:
            sfx[:, i0:i1] += w[:, :L]

    for k, f in enumerate(sorted(SHOT_STARTS + INNER_KEYS)):
        put(fr(f), sfx_whoosh(0.30 + 0.06 * (k % 3), 600 + 90 * (k % 5), pan_pos=((k % 4) - 1.5) * 0.25), -9.0 - (k % 2))
    for t0, g in KICKS:
        put(t0, sfx_kick(0.30 + 0.05 * g, 110 + 12 * g, 40), -6.0 + 1.2 * (g - 1.0))
    # jangkrik pos ronda
    cr_dur = fr(2091) - fr(1753)
    cr = st(G.crickets(cr_dur, np.random.default_rng(11), 4))
    cenv = np.minimum(1.0, np.minimum(tt(cr_dur) / 1.2, (cr_dur - tt(cr_dur)) / 1.2))
    put(fr(1753), cr * cenv[None, :], -27.0)
    # angkot lewat
    put(fr(735), sfx_engine(fr(782) - fr(735)), -22.0)
    put(fr(2250), sfx_engine(fr(2336) - fr(2250)), -22.0)
    # pintu panti terbuka
    put(fr(2517) - 0.45, sfx_flash(0.95), -5.0)
    put(fr(2517), sfx_bell(1.6, 1046), -14.0)
    # pad hangat sampai akhir
    pd = pad(DUR - fr(2517))
    put(fr(2517), pd, -29.0)
    # "Matanya memanas"
    put(fr(3269), sfx_bell(2.0, 880), -13.0)
    # CTA
    put(fr(4148), sfx_clink(0.5, 2400), -10.0)
    put(fr(4282), sfx_clink(0.5, 2800), -10.0)
    return sfx

# ---------------------------------------------------------------- 4. Master Mix & Normalization
def main():
    print("Loading voiceover stem...")
    voice = load_voice()
    
    print("Generating procedural frame-accurate SFX stem...")
    sfx = generate_sfx()
    
    # Mix stems: Voice priority + motivated SFX beds
    mix = voice * 0.95 + sfx * 0.55
    
    # Apply soft limiter & loudness normalization to target -15 LUFS
    print("Normalizing master mix to target loudness...")
    lufs = integrated(mix)
    print(f"Initial mix loudness: {lufs:.2f} LUFS")
    gain = 10 ** ((TARGET_LUFS - lufs) / 20.0)
    norm = mix * gain
    
    # Limiter (ffmpeg alimiter) + loudnorm akhir -> -15 LUFS, true peak <= -1.5 dBTP
    from scipy.io import wavfile
    out_wav = os.path.join(ROOT, "public", "darto_mix.wav")
    tmp = os.path.join(ROOT, "public", "_darto_pre.wav")
    wavfile.write(tmp, SR, norm.T.astype(np.float32))
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp, "-af",
         "alimiter=limit=0.85:attack=3:release=90:level=false,loudnorm=I=-15:TP=-1.5:LRA=11",
         "-ar", str(SR), "-c:a", "pcm_s16le", out_wav],
        check=True,
    )
    os.remove(tmp)
    print(f"Master audio -> {out_wav}")

if __name__ == "__main__":
    main()
