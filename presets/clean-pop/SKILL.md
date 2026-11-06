---
name: clean-pop-edit
description: Apply the "Clean Pop" edit preset to the user's own talking/unboxing footage (Turkish or any language) - clean word-timed captions, like/subscribe/hype tap buttons, brand logo badges, a logo card with a product fan, a tier list that fills as categories are named, and restrained synthesized SFX on graphics only - with every version reviewed in the Edit Review Desk panel. Use when the user says "use my preset", "clean pop", "edit it like the Deutschland Design video", or sends intro/outro parts to caption and decorate.
---

# Clean Pop edit preset

Approved by the user on 2026-11-06 for the Hot Wheels *Deutschland Design* unboxing (intro + outro) after three review
rounds. The user edits the main video themselves and sends only the parts to decorate (usually the intro and the outro).
Everything here is code: `edit.py` + `style.json` render it, a per-clip `timeline.json` says what appears when.

## The look (what the user approved, and what they rejected on the way)
| Element | Approved | Rejected (do not bring back) |
|---|---|---|
| Captions | Sentence case as spoken, Inter Display SemiBold 58 px at 1080p, white, soft blurred shadow, no outline. Up to 6 words / 34 chars per line, one line, ~150 px from the bottom. Upcoming words dimmed (alpha 120), they brighten as they are said. Gentle 0.18 s fade + 14 px rise. | ALL-CAPS, thick black outline, yellow active word, orange keywords, pop/bounce per chunk ("cheesy") |
| SFX | Only on graphics: button pop/click/sparkle, a soft whoosh for logo cards and badges, a thock per tier row. ~10-20 per clip. Synthesized in code (no samples, no copyright). | A sound on every caption chunk or word ("every word does not need a sound effect") |
| Engagement | When the speaker asks for a like / subscribe / hype, show the matching pill button (Beğen, Abone ol → Abone olundu, Hype); one pointer taps each one on the exact word. On Shorts, a small "Takip et → Takip ediliyor" follow button over the opening and ending group shots (kind `follow`). | Nothing at all (the user asked for these explicitly in both the intro and the outro) |
| Brands | Each time a product or brand is named or pulled out, a white badge with the official logo + model name slides in beside it. Brand name said → logo card (e.g. Hot Wheels) + a fan of the product cards. | Labels made of plain text, guessed logos, AI-generated cars |
| Lists / rankings | A tier list board appears when the format is named; each tier lands as it is said (green best → red worst), the product image moves into each tier, then parks beside the board (never leave it in the worst tier unless asked). Captions pause while the tiers are named. | |
| Music | None added; the user's own edit keeps its audio, mixed with a limiter (0.89) so SFX never clip. | |

Captions only where the user asks (here: intro speech, and the outro from "İzlediğiniz için teşekkür ederim").
Turkish: write captions exactly as spoken; when a style needs capitals use Turkish rules (i→İ, ı→I) but keep English
loanwords English ("LIKE", "CHASE").

## Workflow (one review loop per version)
1. **Get the parts.** The user shares a Google Drive folder link (public link works: list it with
   `https://drive.google.com/embeddedfolderview?id=<id>`, download with
   `https://drive.usercontent.google.com/download?id=<file id>&export=download&confirm=t`). Folders on their PC are not
   reachable from a cloud session.
2. **Look and listen.** Contact sheet every 3 s (`ffmpeg ... fps=1/3,tile=5x6`); transcribe with Gemini
   (`gemini-3.5-flash`; when its free daily quota is out, `gemini-3.5-flash-lite` works but mishears more).
3. **Transcript check (v0).** Put the transcript in the review panel; the user fixes words there. Never caption from
   an unchecked transcript.
4. **Word timings.** `tools/align.py clip.mp4 lines.txt words.json --from <just before first word> --to <end>`
   (MMS forced aligner; exact to a frame or two; Gemini word timestamps are not good enough).
5. **Timeline.** Copy `examples/deutschland-design/*.timeline.json`, point it at the clip and words.json, and place
   elements with word references (`"@Hot"`, `"@abone+0.04"`, `"@efendim>+0.7"`); use seconds for things that happen on
   screen without being said (a card coming out of a box: find the window from a 0.5 s contact sheet).
   Logos: `tools/fetch_logo.sh <name> "<Commons file>.svg"` (official SVGs; list of known-good names in the script).
6. **Look first.** `python3 edit.py x.timeline.json sheet.jpg --stills t1,t2,...` and check every new element.
7. **Preview to the panel.** `python3 edit.py x.timeline.json x_v1.mp4 --preview` (720p, < 20 MB), upload it to the
   panel as a new version with a note of what changed, then wait for the user's decision and notes there.
8. **Notes → next version.** Read open notes (`resolved == false`), fix, upload vN+1, reply on each note and mark it
   resolved. Repeat until the user approves.
9. **Finals.** `python3 edit.py x.timeline.json x_final.mp4` (same size/fps/length as the source, H.264 CRF 16, AAC
   192k) + `x_final_sfx.wav` (SFX stem) + `x_final_cues.json`. Deliver all three per clip.

## Vertical Shorts / Reels (no speech, music bed)
Proven on the 23 s Deutschland Design Short (2026-11-06): `examples/deutschland-short/short.timeline.json`.
- Cut points: `ffmpeg -i x.mp4 -vf "select='gt(scene,0.25)',showinfo" -f null -` + a 0.5 s contact sheet.
- One `"layout": "row"` badge per product (logo left, brand + model right) at `"y": 300`: inside the top safe area,
  clear of the Shorts/Reels UI at the bottom. In at the product's first shot, out just before the next product.
- `{"type": "sfx"}` items on the cuts: whoosh into each new product (peak lands on the cut), soft thock on the
  reveal cut, whoosh + hit on the ending. The badge pop is automatic.
- `"sfx_gain": 2.8` (+9 dB) when the bed is loud music (~-15 LUFS); keep 1.0 under speech.
- Previews scale the long side to 1280; the panel player follows the video's shape.

## Review panel
`panel/edit-review.html` is the Edit Review Desk: an Artifact with `capabilities: {db: {}, assets: {}}`.
Live copy: https://claude.ai/artifact/2zg5hityMzmcVTzmN3ij3p (reuse it for the next video: set `project/current`,
replace the `clips` documents). Data model:
- `project/current` {name, subtitle}
- `clips/<id>` {order, title, status: waiting|changes|approved, range:[a,b], lines:[{t,text,flag?,edited?}],
  versions:[{v, label, url:"/_blob/<asset id>", offset, note}]} - arrays are replaced whole on update, so send the full list
- `notes/<auto>` {clip, ver, t, text, resolved, reply?} written by the user from the page
Upload previews with the Artifact tool (`asset: true`, ≤ 20 MiB each), then write the version into the clip.

## Requirements
Python 3 with numpy + Pillow, ffmpeg, Node + Playwright/Chromium (logo SVG → PNG). Fonts are bundled in `fonts/`
(Inter Display: OFL; Font Awesome Free: icons CC BY 4.0, fonts OFL). The aligner needs torch/torchaudio CPU + uroman.
Cloud environment hosts used: drive.google.com, drive.usercontent.google.com, upload.wikimedia.org,
commons.wikimedia.org, download.pytorch.org, download-r2.pytorch.org, dl.fbaipublicfiles.com, generativelanguage.googleapis.com.

## Files
| Path | What |
|---|---|
| `edit.py` | the engine: captions, buttons, logo card + fan, badges (card and row layouts), tier list, timeline SFX, mix, preview/final/stills |
| `style.json` | every look value (sizes, colours, timings, SFX levels); change the preset here, not in code |
| `tools/align.py` | word timings (MMS forced alignment) |
| `tools/fetch_logo.sh`, `tools/svg2png.js` | official logos from Wikimedia Commons → transparent PNG |
| `panel/edit-review.html` | the review panel source |
| `examples/deutschland-design/` | the approved timelines, transcript and word timings (media and logos not committed) |
