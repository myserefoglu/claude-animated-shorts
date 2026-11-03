# Labubu video plan (handoff for the next session)

## Approach
Use the vox-director skill (https://github.com/Alisa0808/vox-director, MIT): a Vox-style paper-collage explainer.
- **C-roll mode:** real Labubu product photos are cut out as photographic stickers (never redrawn), and
  collage posters are generated around them (`croll_subject: "product"`).
- **Provider:** call Google's Gemini API directly with the user's key instead of Atlas Cloud.
  `scripts/provider.py` has a `Provider` base class plus a registry; add a `GoogleProvider`
  (images via Nano Banana / Gemini image, video via Gemini Omni, TTS via Gemini) and select it in beats.json
  with `"provider": "google"`. `generativelanguage.googleapis.com` is reachable from the cloud environment.

## Steps (next session)
1. Check that `GEMINI_API_KEY` is set (it lives in the environment settings, never in chat).
   List the models the key can use.
2. Clone vox-director, install it as a skill, and write `GoogleProvider`.
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
