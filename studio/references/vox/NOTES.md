# Vox-style references: what each one teaches

Frames in `frames/` (540 px wide), contact sheets in `sheets/`. These are other people's work:
use them for the look and the method, never copy their content. The source videos are not in
the repo (size and rights); ask the user for them again if a new session needs to re-measure.

All measurements come from `python3 studio/scripts/motion_stats.py <video>`.

| Ref | held % | calm % | busy % | hard cuts/min | avg shot | flashes | brightness | saturation |
|---|---|---|---|---|---|---|---|---|
| mumbai | 40 | 34 | 13 | 29.7 | 2.0 s | 0 | 158 | 0.18 |
| beethoven | 1 | 61 | 13 | 0 (soft blur dissolves) | n/a | 0 | 91 | 0.10 |
| lustig | 36 | 19 | 24 | 18.9 | 3.2 s | 0 | 91 | 0.31 |
| ori_hevy | 59 | 23 | 3 | 0 (chained clips) | n/a | 0 | 183 | 0.11 |
| ori_supps | 52 | 28 | 6 | 2.4 | n/a | 0 | 168 | 0.12 |
| **our Labubu v1 (what not to do)** | **5** | 26 | **30** | 72 | 0.8 s | **4** | 148 | **0.42** |

Takeaway: the references are still (holds or slow drift), muted (saturation 0.10-0.31), and never
flash. Our v1 was constantly moving, loud and flashing: the generic "TikTok template" look.

---

## mumbai: archival desk collage (the closest match to the user's dark, true, evidence-led stories)
*"On November 26th, 2008, Mumbai became the target of a terrorist attack..."*, 50 s, landscape
composition shown rotated in a vertical frame ("please rotate your phone").
- **Surface:** everything sits on aged cream paper and old newspaper/map sheets. One desk, the
  whole video.
- **Pieces:** case-file folders, "CASE 8006" and "ARCHIVE" typewriter labels, old maps (sea route
  drawn in red), halftone B/W photos of real buildings cut out with a white edge, black
  silhouettes of people (attackers, never faces), a fishing boat cut-out, a calendar page
  "NOVEMBER 29", newspaper headline strip "EMERGENCY IN THE CITY", a red target reticle.
- **Evidence grammar:** red string between red pins, red circles, a red ribbon on "166 KILLED",
  a field of identical black head silhouettes for the death toll, masking tape on every corner.
- **Colour:** cream / black / one red. Mustard-yellow paper as a rare second accent.
- **Motion:** pieces slide in from a frame edge and settle without bounce; strips arrive one at a
  time (torn sea strips, then the boat). Long holds between. A new composition about every 2 s.
- **Made with:** generated stills (Gemini sparkle watermark visible bottom-left, so likely Nano
  Banana) assembled as layers. No AI video.
- **Sound:** tense, somber score, rhythmic percussion, SFX for gunfire, explosions, sirens.

## beethoven: cinematic B/W photo + serif type ("claude made this", by Naomi Metzger)
*"The greatest applause of Beethoven's life made no sound..."*, 28 s, vertical.
- **Images:** photoreal black-and-white "archival" scenes (AI stills): empty room with window
  light, composer from behind at a piano, a conductor before a choir, a theatre audience. Faces
  mostly turned away or soft.
- **Type:** one elegant serif italic, white, centred, word by word ("silence / began", "He kept /
  composing"); one hand-drawn white circle around "never sent" on a letter.
- **Motion:** slow push-ins, rack-focus blur used as the transition (0 hard cuts). One composite
  gag: an ear trumpet sliding in beside a small piano figure.
- **Colour:** monochrome, low brightness, grain, vignette.
- **Sound:** dramatic cinematic ambient score, deep drones, rhythmic pulses.
- **Why it matters:** made by Claude (Opus 5.5) per its title, so stills + motion + type is
  proven doable from this kind of pipeline.

## lustig: sepia photoreal scenes + evidence board ("In 1925, a man tried to sell the Eiffel Tower")
32 s, vertical.
- **Images:** photoreal sepia scenes (con man in front of the Eiffel Tower, in a leather chair
  with cards, a boardroom, a handshake at a window, walking away), an evidence corkboard with
  "CONFIDENTIEL" documents and red string, a framed portrait on a museum wall.
- **Type:** big red serif words over the image ("IN 1925", "DEAL WAS REAL", "DISAPPEARED"), one
  plain white sans line on blank parchment ("And the strangest part").
- **Motion:** parallax and slow pushes on the stills; hard cut about every 3 s.
- **Sound:** suspenseful orchestral strings with a steady beat.

## parallax: the core technique ("How Vox makes images look like videos")
1. Pick an image with a clear foreground, midground and background.
2. Separate them into layers (cut-out), and **fill in what was hidden** behind each layer.
3. Space the layers out in 3D and move the camera slowly (dolly or pan).
Without it, stills read as "an iMovie slideshow". In our stack: rembg cut-out + Nano Banana edit
to fill the gap + Remotion 3D transforms.

## ori_hevy / ori_supps: beige paper diorama (Ori Silver, made with Google Omni Flash)
- **Look:** monochrome warm grey-beige layered paper relief, soft studio light and real shadows,
  torn-paper reveals, cut-paper headline words, ONE accent colour (blue, or red), the real product
  photo attached as a reference so it stays identical in every clip.
- **Made with:** AI video (Omni Flash), 10 s clips chained by last frame. Narration baked into
  the clips, then the voice replaced in post because it drifts between clips.
- **Our take:** good for product/explainer and "animation request" shots. Costly per second, so
  use it for a few hero shots, not whole videos. Generate silent clips; keep our own narration.
