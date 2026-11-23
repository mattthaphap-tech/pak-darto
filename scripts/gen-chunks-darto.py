#!/usr/bin/env python3
"""
SRT (+ deteksi jeda audio) -> caption_chunks.json untuk video "Pak Darto".

ElevenLabs hanya memberi SRT (waktu per baris, bukan per kata). Skrip ini:
1. Membaca voice/darto.srt, membuang tag suara seperti [tertawa] / [menghela napas].
2. Mendeteksi jeda nyata di public/darto_vo.mp3 (ffmpeg silencedetect).
3. Membagi kata dalam tiap blok SRT secara proporsional hanya pada segmen yang BERSUARA,
   jadi jeda di koma / titik tidak ikut "memakan" durasi kata.
4. Menggabungkan 1-2 kata per chunk (gaya caption ref channel).

Jika kamu punya JSON word-timing dari ElevenLabs, pakai gen-chunks.py (versi asli) untuk hasil presisi.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRT = os.path.join(ROOT, "voice", "darto.srt")
MP3 = os.path.join(ROOT, "public", "darto_vo.mp3")
OUT = os.path.join(ROOT, "src", "videos", "darto", "caption_chunks.json")


def ts(s):
    h, m, rest = s.split(":")
    sec, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def parse_srt(path):
    raw = open(path, encoding="utf-8").read().strip().replace("\r", "")
    blocks = []
    for b in re.split(r"\n\s*\n", raw):
        lines = b.split("\n")
        if len(lines) < 3:
            continue
        a, c = [ts(x.strip()) for x in lines[1].split("-->")]
        txt = " ".join(lines[2:])
        blocks.append((a, c, txt))
    return blocks


def silences():
    try:
        p = subprocess.run(
            ["ffmpeg", "-hide_banner", "-i", MP3, "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-"],
            capture_output=True, text=True,
        )
        starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", p.stderr)]
        ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", p.stderr)]
        return list(zip(starts, ends))
    except Exception as e:  # ffmpeg tidak ada -> tanpa deteksi jeda
        print("WARN: ffmpeg silencedetect gagal:", e, file=sys.stderr)
        return []


def speech_segments(a, b, sil):
    segs, cur = [], a
    for s0, s1 in sil:
        if s1 <= a or s0 >= b:
            continue
        if s0 > cur + 0.05:
            segs.append((cur, min(s0, b)))
        cur = max(cur, s1)
    if cur < b - 0.05:
        segs.append((cur, b))
    return segs or [(a, b)]


def weight(w):
    return max(1, len(re.sub(r"[^\wÀ-ÿ]", "", w)))


def main():
    blocks = parse_srt(SRT)
    sil = silences()
    words = []
    for a, b, txt in blocks:
        # tag suara -> bukan kata caption, tapi memakan waktu (dihitung sebagai bobot jeda)
        tag_w = sum(len(t) // 2 for t in re.findall(r"\[[^\]]*\]", txt))
        clean = re.sub(r"\[[^\]]*\]", " ", txt).replace("...", " ")
        toks = [t.replace('"', "").replace("“", "").replace("”", "") for t in clean.split()]
        toks = [t for t in toks if re.search(r"\w", t)]
        if not toks:
            continue
        segs = speech_segments(a, b, sil)
        total_len = sum(s1 - s0 for s0, s1 in segs)
        ws = [weight(t) for t in toks]
        W = sum(ws) + tag_w
        cum = 0.0
        for t, w in zip(toks, ws):
            f0, f1 = cum / W, (cum + w) / W
            cum += w

            def at(frac):
                d = frac * total_len
                for s0, s1 in segs:
                    if d <= s1 - s0:
                        return s0 + d
                    d -= s1 - s0
                return segs[-1][1]

            words.append({"text": t, "start": round(at(f0), 2), "end": round(at(f1), 2)})

    chunks, i = [], 0
    while i < len(words):
        w1 = words[i]
        if i + 1 < len(words):
            w2 = words[i + 1]
            gap = w2["start"] - w1["end"]
            stop = any(w1["text"].endswith(p) for p in [".", "?", "!", ":", ";", ","])
            if not stop and gap < 0.3 and len(w1["text"]) + len(w2["text"]) <= 16:
                chunks.append({"text": f"{w1['text']} {w2['text']}", "start": w1["start"], "end": w2["end"]})
                i += 2
                continue
        chunks.append(dict(w1))
        i += 1

    # beri ekor kecil supaya tidak berkedip, tapi jangan tabrakan dengan chunk berikutnya
    for k, c in enumerate(chunks):
        nxt = chunks[k + 1]["start"] if k + 1 < len(chunks) else c["end"] + 0.3
        c["end"] = round(min(max(c["end"], c["start"] + 0.22), nxt - 0.01), 2)

    json.dump(chunks, open(OUT, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    json.dump(words, open(os.path.join(ROOT, "voice", "darto_words_estimated.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"{len(words)} kata -> {len(chunks)} chunk -> {OUT}")
    for w in words:
        print(f"{w['start']:6.2f}s f={int(round(w['start'] * 30)):4d}..{int(round(w['end'] * 30)):4d} {w['text']}")


if __name__ == "__main__":
    main()
