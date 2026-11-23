# Audio mix — stored as base64 parts

`public/darto_mix.wav` (27 MB, 48 kHz stereo, 146.5 s — the final VO+SFX mix
the `DartoShortWithCaptions` composition plays) cannot be pushed through the
GitHub connector, which only accepts UTF-8 text files and rejects requests
above ~10 MB. It is therefore stored here as base64 text, split into 8 parts
of ~4.7 MB:

- `darto_mix.wav.b64.part-00` … `darto_mix.wav.b64.part-07`

The render workflow reassembles it before bundling:

```bash
cat audio-parts/darto_mix.wav.b64.part* | base64 -d > public/darto_mix.wav
```

Verified: decoding the parts reproduces the original file byte-for-byte
(md5 `f1528a1ef45bab4a45b4d54b61f46e6e`).

If you ever push with normal git, you can replace these parts with the real
`public/darto_mix.wav` (the `.gitignore` exclusion for it has been removed).
