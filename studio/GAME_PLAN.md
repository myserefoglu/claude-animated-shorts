# Game plan: animated story shorts

## Setup status

| Item | Status |
|---|---|
| Skill installed at `~/.claude/skills/cartoon-3d-short/` | Done. Claude Code lists it as a skill now. |
| Remotion project (`studio/`): remotion 4.0.540, @remotion/three, three 0.187, R3F 9.8, postprocessing | Done. `npx tsc --noEmit` passes. |
| Bridge source copied to `src/videos/bridge/`, registered as `BridgeShort` (`src/Root.tsx`, `src/index.ts`) | Done |
| Helper scripts copied to `scripts/` | Done |
| Python `numpy`, `scipy`, `Pillow` (for the audio and QA scripts); ffmpeg | Done (ffmpeg was already installed) |
| Headless Chromium for rendering | Present at `/opt/pw-browsers/chromium_headless_shell-1243/...` |
| **26 Kenney CC0 models** → `public/bridge/kenney/*.glb` (Nature Kit + Fantasy Town Kit) | **Blocked**: kenney.nl and opengameart.org are denied by the network policy |
| **First test still** | **Blocked**: auto mode won't run the downloaded repo's code without your permission |

### Unblocking
1. **Kenney models** (pick one):
   - Add `kenney.nl` to the cloud environment's allowed domains (environment menu → Edit → Network access). Then I download Nature Kit and Fantasy Town Kit and copy the 26 `.glb` files over.
   - Or upload the two zips (Nature Kit, Fantasy Town Kit 2.0) yourself.
   - Without them, the scenes still render. Trees, bushes, flowers, stalls, banners, the windmill and the canoe are just missing.
2. **Running the repo's code:** tell me it's OK to run this repo's scripts (`scripts/*.mjs`, `templates/audio/*.py`), or add a Bash permission rule for them.
3. **Machine-specific edits I still need to make:** `scripts/bridge-stills.mjs` hard-codes a Windows Chrome path and `gl: "angle"`. Here it needs the headless Chromium path above and `gl: "swangle"`, because there's no GPU and rendering runs on the CPU.

## Constraint: this container has no GPU
- The bridge's 2K final render ran at about 4 fps on a GPU, about 10 minutes for 67 s. On this 4-vCPU container it will be much slower. I haven't measured it yet; the first test still will tell us.
- **Recommendation:** do the stills and look-checks here at 0.5 scale. If the CPU timing is bad, run the final 2K render on your own PC with a GPU.

## Steps to make a new short
Every step is saved before moving on. You approve the script, and after that the rest runs without further approvals.

| # | Step | Who | Output |
|---|---|---|---|
| 0 | **Smoke test:** render bridge stills (frames 100, 1000) to prove the pipeline works | me | `out/test/*.jpg` |
| 1 | **Topic:** one surprising true story with a visible physical cause and effect, plus an everyday analogy | you pick (I can propose 5) | topic + sources |
| 2 | **Script:** 55–70 s at about 3.7 words/s, using the beat formula (hook → setting → escalation → snap → "Luckily/Unluckily" → analogy → consequence → callback) | me drafts, **you approve** | `SCRIPT.md` |
| 3 | **Voice:** `voice.wav`, then `words.json` (word timings), hand-fixed | you record, or I use local TTS (e.g. Piper from PyPI) plus Whisper for the timings | `voice/` |
| 4 | **Shot plan:** copy `src/videos/bridge` → `src/videos/<name>`, register it, rewrite `story.ts` (SHOTS, CAMS, DOF, KICKS, XFADE) against the word times | me | new composition |
| 5 | **World:** rework the `build.ts` layout and `paint.ts` textures for the new setting; keep `lights.ts`, `shade.ts`, `ink.ts`, `grade.ts` | me | world |
| 6 | **Characters:** new roles in `cast.ts`, plus new drawings and props in `toon.ts` | me | cast |
| 7 | **Look checks:** stills, side-by-side sheets against `references/frames`, a verifier pass, fixes | me | sheets + scores |
| 8 | **Sound:** fix the picture's timing first, then SFX + original march score, voice ducking, loudness | me | `mix.wav`, stems |
| 9 | **Final render:** 1440×2560 (`--scale 1.3333`), mux the audio, run `short_qa.py` frame by frame | me (or your GPU PC) | `final.mp4` |
| 10 | **Deliver** | me | mp4 sent to you |

## Decisions for you
1. Topic, or should I propose a shortlist?
2. Voice: your own recording, or local TTS?
3. Final render: here on CPU, or on your PC?
4. Should the work be saved somewhere permanent? This container is temporary. I can push to a repo of yours once GitHub is connected.
