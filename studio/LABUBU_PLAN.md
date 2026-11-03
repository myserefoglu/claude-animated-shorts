# Labubu video plan (handoff for the next session)

## Approach
Use the vox-director skill (https://github.com/Alisa0808/vox-director, MIT): a Vox-style paper-collage explainer.
- **C-roll mode:** real Labubu product photos are cut out as photographic stickers (never redrawn), and
  collage posters are generated around them (`croll_subject: "product"`).
- **Provider:** call Google's Gemini API directly with the user's key instead of Atlas Cloud.
  `scripts/provider.py` has a `Provider` base class plus a registry; add a `GoogleProvider`
  (images via Nano Banana / Gemini image, video via Gemini Omni, TTS via Gemini) and select it in beats.json
  with `"provider": "google"`. `generativelanguage.googleapis.com` is reachable from the cloud environment.

## Status (2026-11-03)
- **Key: works.** The proxy adds it to every generativelanguage.googleapis.com request, so
  `GEMINI_API_KEY` is not set in the shell, and that is fine. The key can see Nano Banana 2 (`gemini-3.1-flash-image`),
  Gemini Omni (`gemini-omni-1.1-flash`), TTS (`gemini-3.8-flash-tts`) and Lyria (`lyria-3-clip-preview`).
- **Blocker: free tier.** Image, video and music have a free-tier quota of **0** (HTTP 429, "limit: 0").
  Only TTS works. The user has to enable billing on the key's Google project (aistudio.google.com → the
  key → "Set up billing"). Nothing image/video/music-related can be tested until then.
- **vox-director + GoogleProvider: done.** `bash studio/vox/install-vox.sh` (re-run in each new session)
  installs vox-director at a pinned commit into `.claude/skills/vox-director` and registers
  `"provider": "google"` from `studio/vox/google_provider.py`. TTS verified through the provider; image fails
  fast with the billing message. Video/music request shapes are unverified until billing is on.
  Not covered: background removal (use local `rembg`) and `asr_beats.py` (calls Atlas STT directly).

## Steps
1. ~~Check the key, list models.~~ Done.
2. ~~Install vox-director, write `GoogleProvider`.~~ Done. Once billing is on: `python3 .claude/skills/vox-director/scripts/google_provider.py image` (then `video`, `music`) to verify.
3. **Test clip first:** animate one Labubu photo with Gemini Omni. vox-director's own notes say Gemini Omni
   blocks recognisable brands and logos ("prohibited contents"). If Labubu is blocked, the fallbacks are
   Kling (via Atlas Cloud) or vox-director's local keyframe engine (no video model, never blocked).
4. Write the beat map (beats.json). **The user approves it before any paid generation.**
5. Style bake-off (the user picks the look), then keyframes, motion, voice + music, assemble.

## Waiting on the user
- Photos of their own Labubus: plain background, good light, one figure per photo, 2-5 figures.
  Official Pop Mart photos are Pop Mart's IP: the user's call and risk. Skip fan "vectors" (mostly unlicensed).
- Angle (craze explainer / collection review / "why so expensive"), length (30 or 60 s), 9:16, English?
- Voice: a generated narrator, or one cloned from the user's recording.
