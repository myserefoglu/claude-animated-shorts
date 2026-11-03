# Pipeline: Vox-style documentary shorts

How every video is made. Read with `STYLE.md` (the look) and `references/vox/NOTES.md` (examples).

## The one rule
**Nothing is generated until its imagery is agreed.** Every video goes through the imagery-plan
discussion (stage 2) and a stills check (stage 5) before any full render. Each gate is a
conversation with the user, recorded in the video's `IMAGERY_PLAN.md`, so we never regenerate
whole videos to discover what the user wanted.

## Stages and gates
| # | Stage | Who | Output | Cost |
|---|---|---|---|---|
| 1 | **Script + material in.** User gives the script and whatever they have: screenshots, photos, clips, documents, links | user | `videos/<name>/script.md`, `videos/<name>/material/` | 0 |
| 2 | **Imagery plan (discussion).** I draft one row per line: what we see, which look (A/B/C), where each image comes from, motion, on-screen text, sound, cost. We go back and forth until every row is agreed. Open questions are listed, not guessed | both | `videos/<name>/IMAGERY_PLAN.md` | 0 |
| 🔒 | **Gate 1: plan approved** | user | | |
| 3 | **Voice.** One TTS take (or the user's recording); line timings from the pauses | me | `voice/take.wav`, timings | ~0 |
| 4 | **Assets.** Only the agreed rows: generate stills in the look's style block, cut out layers, fill behind them (parallax), prepare the user's material (print treatment) | me | `assets/` | ~$0.04-0.12 per image |
| 5 | **Stills check.** One still per row at half size, laid next to the matching reference frames; motion rules listed. User reviews | both | contact sheet | 0 |
| 🔒 | **Gate 2: stills approved** (fix only the rows that fail) | user | | |
| 6 | **Preview render** at half size (about 4-5 min per minute of video) + `motion_stats.py` against the targets in `STYLE.md` | me | `out/<name>_preview.mp4` | 0 |
| 🔒 | **Gate 3: preview approved** (timing, pacing, sound) | user | | |
| 7 | **Final render** 1080x1920 (about 15 min per minute here; faster on a GPU PC) | me | `out/<name>.mp4` | 0 |

Changes after a gate only touch the affected rows. The plan's change log records what changed
and why.

## Where each kind of image comes from
| Source | Use for | How |
|---|---|---|
| **User material** (screenshots, photos, documents, clips) | evidence, real people, real events | Print treatment: B/W or halftone, cut or torn edge, tape, paper shadow, on the desk. Clips play inside a torn-paper window with grain |
| **Generated stills** (Nano Banana) | scenes, places, objects, silhouettes, desk pieces, maps | Style block from `STYLE.md`, separate pieces with clear edges, 2K, no text baked in |
| **Generated parallax plates** | cinematic B shots | Generate, cut foreground/midground (rembg), fill behind (Nano Banana edit), animate a slow camera in Remotion |
| **AI video** (Gemini Omni) | rare hero "animation request" shots | Silent clips (our narration stays), 4-10 s, the reference image attached. Budget it per row |
| **Built in Remotion** | maps with routes, red string, stamps, counters, typewriter labels, highlighter, timelines | Reusable kit components, styled as print |

Content limits: Gemini image and video models refuse recognisable real people and brand logos,
and get stricter on violent topics. Plan silhouettes or user photos for those rows; Kling (via
Atlas Cloud) is the fallback for video with real people.

## Cost guide
- Stills: 20-30 per minute of video, plus about 30 % retakes, so about $2-4 per minute.
- AI video: about $0.13 per second (vox-director's figure); keep it to a few hero shots.
- The user's Google AI Pro plan includes about $10/month of Cloud credits usable on the Gemini
  API once billing is enabled on the key's project.

## Tools
| Path | What |
|---|---|
| `src/videos/<name>/` | Remotion composition per video |
| `scripts/stills.mjs` | Render chosen frames as JPEGs (`node scripts/stills.mjs <Comp> <outDir> 30,120 0.5`) |
| `scripts/render.mjs` | Full render (`node scripts/render.mjs <Comp> out/x.mp4 [scale]`) |
| `scripts/motion_stats.py` | Motion/colour measurements vs the references |
| `vox/install-vox.sh` | Installs vox-director (story guide, prompt guide, C-roll keyframes) with our Gemini provider |
| `.claude/skills/vox-director/references/beat-layer.md` | Story pacing and shot patterns (use when drafting the plan) |

### To build (kit, next sessions)
- [ ] Print treatment: halftone / B/W, white cut edge, torn edge mask, tape, paper shadow
- [ ] Desk surface + paper textures (generated once, reused)
- [ ] Slide-and-settle / tape-slap motion, sequenced reveals on word times
- [ ] Parallax plate component (3 layers + camera)
- [ ] Evidence grammar: red string + pins, marker circle and arrow draw-on, stamps, redaction
- [ ] Map component (route draw, pins), counters, timeline strip
- [ ] Serif word-by-word text, typewriter labels
- [ ] Sound: paper foley set, drones/pulses, music bed import + ducking

## Lessons so far
- Labubu v1 (2026-11-03): code-drawn shapes + bouncy motion = generic. Only real photos carried
  the style. See `references/vox/NOTES.md` for the measured difference.
- TTS: send plain text only (style instructions add sounds and padding); one take for the whole
  script; `gemini-2.5-flash-preview-tts` has the larger free quota.
- The cloud machine renders 2D compositions at about 15 min per minute of 1080x1920 video.
